import { supabase } from '@/services/supabase';
import type { QueueMetric } from '@/lib/types/domain';

export const queueService = {
  fetchQueueMetrics: async (matchId: string): Promise<QueueMetric[]> => {
    const { data, error } = await supabase
      .from('queue_metrics')
      .select('*')
      .eq('match_id', matchId)
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch queue metrics:', error);
      return [];
    }
    
    // De-duplicate to get latest per amenity
    const seen = new Set();
    const latest: QueueMetric[] = [];
    for (const metric of data as QueueMetric[]) {
      if (!seen.has(metric.amenity_id)) {
        seen.add(metric.amenity_id);
        latest.push(metric);
      }
    }

    return latest;
  },
  
  fetchQueueMetricForAmenity: async (matchId: string, amenityId: string): Promise<QueueMetric | null> => {
    const { data, error } = await supabase
      .from('queue_metrics')
      .select('*')
      .eq('match_id', matchId)
      .eq('amenity_id', amenityId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // not found is ok
        console.error('Failed to fetch queue metric:', error);
      }
      return null;
    }

    return data as QueueMetric;
  }
};
