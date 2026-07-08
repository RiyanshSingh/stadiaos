import { supabase } from '@/services/supabase';
import { dashboardService } from './dashboardService';
import { queueService } from './queueService';
import { facilityService, type FacilityViewModel } from './facilityService';
import { requireOpsSession } from '@/lib/authGuards';

const normalizeCount = (count: number | null | undefined): number => count ?? 0;

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

export interface OperationsHotspots {
  gates: Awaited<ReturnType<typeof dashboardService.getDashboardGateStatus>>;
  facilities: FacilityViewModel[];
}

export const opsService = {
  fetchCommandCenterSnapshot: async (matchId: string): Promise<OpsSnapshot> => {
    await requireOpsSession();

    if (!matchId) {
      throw new Error('Invalid snapshot context.');
    }

    const { count: incidentCount, error: incidentError } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .neq('status', 'resolved')
      .neq('status', 'closed');

    if (incidentError) {
      console.error('Failed to count active incidents:', incidentError);
    }

    const { count: advisoryCount, error: advisoryError } = await supabase
      .from('ai_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('recommendation_type', 'public_advisory');

    if (advisoryError) {
      console.error('Failed to count public advisories:', advisoryError);
    }

    const gates = await dashboardService.getDashboardGateStatus(matchId);
    const congestedGatesCount = gates.filter((g) => g.crowd === 'High' || g.crowd === 'Medium').length;

    const queues = await queueService.fetchQueueMetrics(matchId);
    const highQueueFacilitiesCount = queues.filter((q) => q.queue_score > 0.7).length;

    return {
      activeIncidentsCount: normalizeCount(incidentCount),
      activeAdvisoriesCount: normalizeCount(advisoryCount),
      congestedGatesCount,
      highQueueFacilitiesCount
    };
  },

  publishPublicAdvisory: async (matchId: string, stadiumId: string, title: string, content: string): Promise<void> => {
    await requireOpsSession();

    if (!matchId || !stadiumId) {
      throw new Error('Invalid advisory context.');
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !cleanContent) {
      throw new Error('Title and content are required for public advisories.');
    }

    const { error } = await supabase
      .from('ai_recommendations')
      .insert([
        {
          match_id: matchId,
          stadium_id: stadiumId,
          recommendation_type: 'public_advisory',
          title: cleanTitle,
          content: cleanContent,
          generated_by: 'ops_manager'
        }
      ]);

    if (error) {
      console.error('Failed to publish advisory:', error);
      throw error;
    }
  },

  fetchPublicAdvisories: async (matchId: string): Promise<PublicAdvisory[]> => {
    await requireOpsSession();

    if (!matchId) {
      console.warn('fetchPublicAdvisories called without matchId.');
      return [];
    }

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

    return data ?? [];
  },

  fetchOperationsHotspots: async (matchId: string, stadiumId: string): Promise<OperationsHotspots> => {
    await requireOpsSession();

    if (!matchId || !stadiumId) {
      throw new Error('Invalid operations hotspots context.');
    }

    const gates = await dashboardService.getDashboardGateStatus(matchId);
    const facilities = await facilityService.fetchFacilities(stadiumId, matchId);

    const crowdScore: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const sortedFacilities = [...facilities].sort(
      (a, b) => crowdScore[b.crowd] - crowdScore[a.crowd]
    );

    return {
      gates,
      facilities: sortedFacilities
    };
  }
};
