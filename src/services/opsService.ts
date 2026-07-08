import { supabase } from '@/services/supabase';
import { dashboardService } from './dashboardService';
import { queueService } from './queueService';
import { facilityService } from './facilityService';
import { requireOpsSession } from '@/lib/authGuards';

export interface OpsSnapshot {
  activeIncidentsCount: number;
  activeAdvisoriesCount: number;
  congestedGatesCount: number;
  highQueueFacilitiesCount: number;
}

export interface PublicAdvisory {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export const opsService = {
  fetchCommandCenterSnapshot: async (matchId: string): Promise<OpsSnapshot> => {
    await requireOpsSession();
    // 1. Fetch active incidents count
    const { count: incidentCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .neq('status', 'resolved')
      .neq('status', 'closed');

    // 2. Fetch active advisories count (using ai_recommendations table as fallback)
    const { count: advisoryCount } = await supabase
      .from('ai_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('recommendation_type', 'public_advisory');

    // 3. Fetch gates and count congested (Medium/High)
    const gates = await dashboardService.getDashboardGateStatus(matchId);
    const congestedGatesCount = gates.filter(g => g.crowd === 'High' || g.crowd === 'Medium').length;

    // 4. Fetch queues and count High queues
    // For MVP we just fetch all latest queue metrics and count those > 0.7 score
    const queues = await queueService.fetchQueueMetrics(matchId);
    const highQueueFacilitiesCount = queues.filter(q => q.queue_score > 0.7).length;

    return {
      activeIncidentsCount: incidentCount || 0,
      activeAdvisoriesCount: advisoryCount || 0,
      congestedGatesCount,
      highQueueFacilitiesCount,
    };
  },

  publishPublicAdvisory: async (matchId: string, stadiumId: string, title: string, content: string): Promise<void> => {
    const userId = await requireOpsSession();
    const { error } = await supabase
      .from('ai_recommendations')
      .insert([{
        match_id: matchId,
        stadium_id: stadiumId,
        recommendation_type: 'public_advisory',
        title,
        content,
        generated_by: 'ops_manager' // distinguishing from 'groq'
      }]);
    
    if (error) {
      console.error('Failed to publish advisory:', error);
      throw error;
    }
  },

  fetchPublicAdvisories: async (matchId: string): Promise<PublicAdvisory[]> => {
    await requireOpsSession();
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('id, title, content, created_at')
      .eq('match_id', matchId)
      .eq('recommendation_type', 'public_advisory')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch advisories:', error);
      return [];
    }

    return data as PublicAdvisory[];
  },

  fetchOperationsHotspots: async (matchId: string, stadiumId: string) => {
    await requireOpsSession();
    const gates = await dashboardService.getDashboardGateStatus(matchId);
    const facilities = await facilityService.fetchFacilities(stadiumId, matchId);
    
    // Sort facilities by queue score (descending), we have wait and crowd from facilityService
    // Map crowd to a numerical value for sorting
    const crowdScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortedFacilities = facilities.sort((a, b) => crowdScore[b.crowd] - crowdScore[a.crowd]);

    return {
      gates,
      facilities: sortedFacilities
    };
  }
};
