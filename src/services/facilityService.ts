import { supabase } from '@/services/supabase';
import type { Amenity } from '@/lib/types/domain';
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

export const facilityService = {
  fetchFacilities: async (stadiumId: string, matchId: string): Promise<FacilityViewModel[]> => {
    const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';

    // 1. Fetch amenities + zones
    const { data: amenities, error } = await supabase
      .from('amenities')
      .select('*, zone:zones(*)')
      .eq('stadium_id', TEMPLATE_STADIUM_ID);

    if (error || !amenities) {
      console.error('Failed to fetch facilities:', error);
      return [];
    }

    // 2. Fetch latest queue metrics
    const queueMetrics = await queueService.fetchQueueMetrics(matchId);
    const queueMap = new Map(queueMetrics.map(q => [q.amenity_id, q]));

    // 3. Map to view model
    return (amenities as Amenity[]).map(amenity => {
      const q = queueMap.get(amenity.id);
      
      // Basic heuristic for wait/crowd
      let wait = '0 mins';
      let crowd: 'Low' | 'Medium' | 'High' = 'Low';
      
      if (q) {
        wait = `${q.estimated_wait_minutes} mins`;
        if (q.queue_score > 0.7) crowd = 'High';
        else if (q.queue_score > 0.4) crowd = 'Medium';
      }

      return {
        id: amenity.id,
        name: amenity.name,
        type: amenity.amenity_type,
        zone: amenity.zone?.name || 'Unknown Zone',
        wait,
        crowd,
        distance: 'TBD', // We don't have routing yet
        accessible: amenity.is_accessible,
      };
    });
  },

  fetchFacilityById: async (id: string, matchId: string): Promise<FacilityViewModel | null> => {
    const { data, error } = await supabase
      .from('amenities')
      .select('*, zone:zones(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    const amenity = data as Amenity;
    const q = await queueService.fetchQueueMetricForAmenity(matchId, amenity.id);
    
    let wait = '0 mins';
    let crowd: 'Low' | 'Medium' | 'High' = 'Low';
    
    if (q) {
      wait = `${q.estimated_wait_minutes} mins`;
      if (q.queue_score > 0.7) crowd = 'High';
      else if (q.queue_score > 0.4) crowd = 'Medium';
    }

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
  }
};
