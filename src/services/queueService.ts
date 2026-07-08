import { supabase } from '@/services/supabase';
import type { QueueMetric } from '@/lib/types/domain';

type QueueMetricRow = QueueMetric;

const deduplicateLatestQueueMetrics = (metrics: QueueMetricRow[]): QueueMetricRow[] => {
  const latestByAmenity = new Map<string, QueueMetricRow>();

  for (const metric of metrics) {
    if (!latestByAmenity.has(metric.amenity_id)) {
      latestByAmenity.set(metric.amenity_id, metric);
    }
  }

  return Array.from(latestByAmenity.values());
};

export const queueService = {
  fetchQueueMetrics: async (matchId: string): Promise<QueueMetric[]> => {
    const { data, error } = await supabase
      .from<QueueMetric>('queue_metrics')
      .select('*')
      .eq('match_id', matchId)
      .order('captured_at', { ascending: false });

    if (error || !data) {
      if (error) {
        console.error('Failed to fetch queue metrics:', error);
      }
      return [];
    }

    return deduplicateLatestQueueMetrics(data);
  },
  
  fetchQueueMetricForAmenity: async (matchId: string, amenityId: string): Promise<QueueMetric | null> => {
    const { data, error } = await supabase
      .from<QueueMetric>('queue_metrics')
      .select('*')
      .eq('match_id', matchId)
      .eq('amenity_id', amenityId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Failed to fetch queue metric:', error);
      }
      return null;
    }

    return data ?? null;
  }
};
