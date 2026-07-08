import { supabase } from '@/services/supabase';
import { groq } from '@/services/groq';
import type { AiRecommendation, QueueMetric } from '@/lib/types/domain';
import { parseGroqRecommendations } from '@/lib/formatters';

export interface GateStatus {
  gate: string;
  crowd: 'Low' | 'Medium' | 'High';
  waitTime: number;
}

type GateMetricRow = {
  density_score: number;
  estimated_wait_minutes?: number;
  zones: { name: string; zone_type: string };
};

type QueueMetricWithAmenity = QueueMetric & {
  amenities?: { name: string; amenity_type: string };
};

const getCrowdLabel = (density: number): GateStatus['crowd'] =>
  density > 0.7 ? 'High' : density > 0.4 ? 'Medium' : 'Low';

const getShortestQueueMetric = (rows: QueueMetricWithAmenity[], amenityType: string) => {
  const candidates = rows.filter((row) => row.amenities?.amenity_type === amenityType);
  if (candidates.length === 0) return null;
  return candidates.reduce((prev, curr) =>
    prev.estimated_wait_minutes <= curr.estimated_wait_minutes ? prev : curr
  );
};

export const dashboardService = {
  getDashboardGateStatus: async (matchId: string): Promise<GateStatus[]> => {
    if (!matchId) {
      console.warn('getDashboardGateStatus called without matchId.');
      return [];
    }

    const { data, error } = await supabase
      .from('crowd_metrics')
      .select('density_score, estimated_wait_minutes, zones(name, zone_type)')
      .eq('match_id', matchId)
      .order('captured_at', { ascending: false })
      .limit(10);
      
    const typedData = data as unknown as GateMetricRow[];

    if (error || !data) {
      if (error) {
        console.error('Failed to fetch gate metrics:', error);
      }
      return [];
    }

    const seen = new Set<string>();
    const gates: GateStatus[] = [];

    for (const metric of typedData) {
      if (!metric.zones || metric.zones.zone_type !== 'gate' || seen.has(metric.zones.name)) continue;
      seen.add(metric.zones.name);

      gates.push({
        gate: metric.zones.name,
        crowd: getCrowdLabel(metric.density_score),
        waitTime: metric.estimated_wait_minutes ?? 0
      });
    }

    return gates;
  },

  getDashboardRecommendations: async (matchId: string): Promise<AiRecommendation[]> => {
    if (!matchId) {
      console.warn('getDashboardRecommendations called without matchId.');
      return [];
    }

    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }

    if (error) {
      console.error('Failed to fetch AI recommendations:', error);
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant for StadiaOS. The crowd metrics DB is currently sparse. Generate exactly 2 creative, short, helpful recommendations for fans in a JSON array. Each object should have: recommendation_type (e.g. crowd, food), title (e.g. Snack Time), content (1-2 sentences of advice).'
          }
        ],
        model: 'llama3-8b-8192',
        response_format: { type: 'json_object' }
      });

      const aiRecs = parseGroqRecommendations(completion.choices[0]?.message?.content || '', matchId);
      if (aiRecs.length > 0) {
        const inserts = aiRecs.map(({ id: _id, ...rest }) => rest);
        await supabase.from('ai_recommendations').insert(inserts);
      }

      return aiRecs;
    } catch (e) {
      console.error('Failed to generate recommendations via Groq:', e);
      return [];
    }
  },

  getLiveStatusCards: async (matchId: string) => {
    if (!matchId) {
      console.warn('getLiveStatusCards called without matchId.');
      return { gate: null, food: null, washroom: null };
    }

    const gates = await dashboardService.getDashboardGateStatus(matchId);
    const leastCongestedGate = gates.length > 0
      ? gates.reduce((prev, curr) => (prev.waitTime < curr.waitTime ? prev : curr))
      : null;

    const { data: queueData, error: queueError } = await supabase
      .from('queue_metrics')
      .select('estimated_wait_minutes, amenities(name, amenity_type)')
      .eq('match_id', matchId);

    if (queueError) {
      console.error('Failed to fetch queue metrics for live status cards:', queueError);
    }

    const queueRows = (queueData ?? []) as unknown as QueueMetricWithAmenity[];

    return {
      gate: leastCongestedGate,
      food: getShortestQueueMetric(queueRows, 'food'),
      washroom: getShortestQueueMetric(queueRows, 'washroom')
    };
  }
};
