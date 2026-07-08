import { supabase } from '@/services/supabase';
import type { Zone, Amenity } from '@/lib/types/domain';
import { alertService } from './alertService';
import { buildVenueGraph } from './routing/venueGraph';
import type { RouteGraph } from '@/lib/types/routing';

export type MapPoint = {
  id: string;
  x: string;
  y: string;
  type: string;
  name: string;
  wait?: string;
  crowd?: 'Low' | 'Medium' | 'High';
  accessible?: boolean;
  desc?: string;
  status?: 'active' | 'resolved';
};

export const mapService = {
  fetchExplorePoints: async (_stadiumId: string, _matchId: string): Promise<MapPoint[]> => {
    const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';

    // 1. Fetch amenities
    const { data: amenities } = await supabase
      .from('amenities')
      .select('*, zone:zones(*)')
      .eq('stadium_id', TEMPLATE_STADIUM_ID);

    // 2. Fetch zones
    const { data: zones } = await supabase
      .from('zones')
      .select('*')
      .eq('stadium_id', TEMPLATE_STADIUM_ID);

    const points: MapPoint[] = [];

    // Map amenities (food, washroom, medical)
    if (amenities) {
      for (const am of amenities as Amenity[]) {
        if (am.metadata?.x && am.metadata?.y) {
          points.push({
            id: am.id,
            x: am.metadata.x,
            y: am.metadata.y,
            type: am.amenity_type,
            name: am.name,
            accessible: am.is_accessible,
            desc: `Zone: ${am.zone?.name || ''}`
          });
        }
      }
    }

    // Map zones (gates, exits)
    if (zones) {
      for (const z of zones as Zone[]) {
        if (z.metadata?.x && z.metadata?.y && (z.zone_type === 'gate' || z.zone_type === 'exit')) {
          points.push({
            id: z.id,
            x: z.metadata.x,
            y: z.metadata.y,
            type: z.zone_type,
            name: z.name,
            accessible: z.is_accessible
          });
        }
      }
    }

    return points;
  },

  fetchLiveOverlays: async (matchId: string, _stadiumId: string): Promise<MapPoint[]> => {
    // For live mode, we fetch alerts and map them to points if they have coordinates
    const alerts = await alertService.fetchActiveAlerts(matchId);
    
    // We need to join incidents with zones to get coordinates.
    // Fetch all incidents that are NOT resolved, to show on the live map.
    // We don't filter to only high/critical here, because fans might want to see where general help is.
    // BUT we should respect the fan-safe rule. We'll let the alertService dictate what's an "alert".
    // For general incidents reported by fans (like a spilled drink), we can show as 'live_incident'.
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*, zone:zones(*)')
      .eq('match_id', matchId)
      .neq('status', 'resolved');

    const points: MapPoint[] = [];

    if (incidents) {
      for (const inc of incidents as any[]) {
        if (inc.zone?.metadata?.x && inc.zone?.metadata?.y) {
          // Check if this incident is also an active alert
          const isAlert = alerts.some(a => a.id === inc.id);
          
          points.push({
            id: inc.id,
            x: inc.zone.metadata.x,
            y: inc.zone.metadata.y,
            type: isAlert ? 'live_alert' : 'live_incident',
            name: inc.title,
            desc: inc.ai_summary || inc.description,
            status: 'active'
          });
        }
      }
    }

    return points;
  },

  fetchRouteGraph: async (_stadiumId: string): Promise<RouteGraph> => {
    const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';

    const [{ data: zones }, { data: amenities }, { data: routes }] = await Promise.all([
      supabase.from('zones').select('*').eq('stadium_id', TEMPLATE_STADIUM_ID),
      supabase.from('amenities').select('*, zone:zones(metadata)').eq('stadium_id', TEMPLATE_STADIUM_ID),
      supabase.from('routes').select('*, from_zone:zones!from_zone_id(metadata), to_zone:zones!to_zone_id(metadata)').eq('stadium_id', TEMPLATE_STADIUM_ID),
    ]);

    const allNodes = [
      ...(zones ?? []).map((z: any) => ({
        id: z.id,
        name: z.name,
        level: z.level,
        is_accessible: z.is_accessible,
        metadata: z.metadata,
      })),
      ...(amenities ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        level: '1',
        is_accessible: a.is_accessible,
        metadata: a.metadata,
        parent_routing_key: a.zone?.metadata?.routing_key,
      })),
    ];

    const allRoutes = (routes ?? []).map((r: any) => ({
      fromKey: r.from_zone?.metadata?.routing_key,
      toKey: r.to_zone?.metadata?.routing_key,
      distanceMeters: r.distance,
      is_accessible: r.is_accessible,
      type: r.distance > 30 ? (r.is_accessible ? 'elevator' : 'stairs') : 'walk' // infer roughly
    }));

    return buildVenueGraph(allNodes, allRoutes);
  },
};
