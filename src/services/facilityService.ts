import { supabase } from '@/services/supabase';
import type { Amenity, Zone, QueueMetric } from '@/lib/types/domain';
import { queueService } from './queueService';

export type FacilityViewModel = {
  id: string;
  name: string;
  type: string;
  zone: string;
  wait: string;
  crowd: 'Low' | 'Medium' | 'High';
  distance: string;
  accessible: boolean;
};

type AmenityRow = Amenity & {
  zone?: Zone | null;
};

const mapQueueToCrowd = (queueScore: number): FacilityViewModel['crowd'] => {
  if (queueScore > 0.7) return 'High';
  if (queueScore > 0.4) return 'Medium';
  return 'Low';
};

const fromAmenity = (amenity: AmenityRow, queueMetric?: QueueMetric): FacilityViewModel => {
  const wait = queueMetric ? `${queueMetric.estimated_wait_minutes} mins` : '0 mins';
  const crowd = queueMetric ? mapQueueToCrowd(queueMetric.queue_score) : 'Low';

  return {
    id: amenity.id,
    name: amenity.name,
    type: amenity.amenity_type,
    zone: amenity.zone?.name || 'Unknown Zone',
    wait,
    crowd,
    distance: 'TBD',
    accessible: amenity.is_accessible,
  };
};

export const facilityService = {
  fetchFacilities: async (stadiumId: string, matchId: string): Promise<FacilityViewModel[]> => {
    const stadiumQueryId = stadiumId || '11111111-1111-1111-1111-111111111111';

    const { data: amenities, error } = await supabase
      .from('amenities')
      .select('*, zone:zones(*)')
      .eq('stadium_id', stadiumQueryId);

    if (error || !amenities) {
      console.error('Failed to fetch facilities:', error);
      return [];
    }

    const queueMetrics = await queueService.fetchQueueMetrics(matchId);
    const queueMap = new Map<string, QueueMetric>(queueMetrics.map((q) => [q.amenity_id, q]));

    return amenities.map((amenity) => fromAmenity(amenity, queueMap.get(amenity.id)));
  },

  fetchFacilityById: async (id: string, matchId: string): Promise<FacilityViewModel | null> => {
    const { data, error } = await supabase
      .from('amenities')
      .select('*, zone:zones(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const queueMetric = await queueService.fetchQueueMetricForAmenity(matchId, data.id);
    return fromAmenity(data, queueMetric ?? undefined);
  }
};
