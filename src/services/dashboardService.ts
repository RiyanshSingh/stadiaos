import { supabase } from '@/services/supabase';
import { groq } from '@/services/groq';
import type { AiRecommendation } from '@/lib/types/domain';

export interface GateStatus {
  gate: string;
  crowd: 'Low' | 'Medium' | 'High';
  waitTime: number;
}

export const dashboardService = {
  getDashboardGateStatus: async (matchId: string): Promise<GateStatus[]> => {
    const { data, error } = await supabase
      .from('crowd_metrics')
      .select('density_score, estimated_wait_minutes, zones(name, zone_type)')
      .eq('match_id', matchId)
      .order('captured_at', { ascending: false })
      .limit(10);
      
    if (data && !error) {
      const seen = new Set();
      const gates: GateStatus[] = [];
      data.forEach((metric: any) => {
        if (metric.zones.zone_type === 'gate' && !seen.has(metric.zones.name)) {
          seen.add(metric.zones.name);
          gates.push({
            gate: metric.zones.name,
            crowd: metric.density_score > 0.7 ? 'High' : metric.density_score > 0.4 ? 'Medium' : 'Low',
            waitTime: metric.estimated_wait_minutes || 0
          });
        }
      });
      return gates;
    }
    
    return [];
  },

  getDashboardRecommendations: async (matchId: string): Promise<AiRecommendation[]> => {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0 && !error) {
      return data as AiRecommendation[];
    }
    
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an AI assistant for StadiaOS. The crowd metrics DB is currently sparse. Generate exactly 2 creative, short, helpful recommendations for fans in a JSON array. Each object should have: recommendation_type (e.g. crowd, food), title (e.g. Snack Time), content (1-2 sentences of advice).' }
        ],
        model: 'llama3-8b-8192',
        response_format: { type: 'json_object' }
      });
      
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"recommendations":[]}');
      const recs = parsed.recommendations || parsed;
      const aiRecs = (Array.isArray(recs) ? recs : []).map((r: any, idx: number) => ({
        id: `gen-${idx}`,
        match_id: matchId,
        stadium_id: '11111111-1111-1111-1111-111111111111',
        recommendation_type: r.recommendation_type || 'general',
        title: r.title || 'Tip',
        content: r.content || 'Enjoy the match!',
        created_at: new Date().toISOString()
      }));

      // Insert into DB so we don't generate next time
      const inserts = aiRecs.map(({id: _id, ...rest}) => rest); // remove temp ID for insert
      await supabase.from('ai_recommendations').insert(inserts);

      return aiRecs as AiRecommendation[];
    } catch (e) {
      console.error('Failed to generate recommendations via Groq:', e);
      return [];
    }
  },

  getLiveStatusCards: async (matchId: string) => {
    // 1. Fetch gate congestion
    const gates = await dashboardService.getDashboardGateStatus(matchId);
    const leastCongestedGate = gates.length > 0 ? gates.reduce((prev, curr) => (prev.waitTime < curr.waitTime ? prev : curr)) : null;

    // 2. Fetch queue metrics to find shortest food wait
    const { data: queueData } = await supabase
      .from('queue_metrics')
      .select('estimated_wait_minutes, amenities(name, amenity_type)')
      .eq('match_id', matchId);

    let shortestFoodWait: any = null;
    let shortestWashroomWait: any = null;

    if (queueData) {
      const foods = queueData.filter((q: any) => q.amenities?.amenity_type === 'food');
      if (foods.length > 0) {
        shortestFoodWait = foods.reduce((prev, curr) => (prev.estimated_wait_minutes < curr.estimated_wait_minutes ? prev : curr));
      }
      const washrooms = queueData.filter((q: any) => q.amenities?.amenity_type === 'washroom');
      if (washrooms.length > 0) {
        shortestWashroomWait = washrooms.reduce((prev, curr) => (prev.estimated_wait_minutes < curr.estimated_wait_minutes ? prev : curr));
      }
    }

    return {
      gate: leastCongestedGate,
      food: shortestFoodWait,
      washroom: shortestWashroomWait,
    };
  }
};
