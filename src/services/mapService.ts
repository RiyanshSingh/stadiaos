import { supabase } from '@/services/supabase';
import type { Zone, Amenity, Incident } from '@/lib/types/domain';
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

type AmenityRow = Amenity & {
  zone?: Zone | null;
};

type IncidentWithZone = Incident & {
  zone?: { metadata?: { x?: string; y?: string } } | null;
};

type RouteNodeZone = Zone & {
  metadata?: any;
};

type AmenityRouteRow = Amenity & {
  zone?: { metadata?: { routing_key?: string } } | null;
};

type RouteRow = {
  distance: number;
  is_accessible: boolean;
  from_zone?: { metadata?: { routing_key?: string } } | null;
  to_zone?: { metadata?: { routing_key?: string } } | null;
};

export const mapService = {
  fetchExplorePoints: async (_stadiumId: string, _matchId: string): Promise<MapPoint[]> => {
    const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';

    const { data: amenities } = await supabase
      .from<AmenityRow>('amenities')
      .select('*, zone:zones(*)')
      .eq('stadium_id', TEMPLATE_STADIUM_ID);

    const { data: zones } = await supabase
      .from<Zone>('zones')
      .select('*')
      .eq('stadium_id', TEMPLATE_STADIUM_ID);

    const points: MapPoint[] = [];

    for (const amenity of amenities ?? []) {
      if (!amenity.metadata?.x || !amenity.metadata?.y) continue;
      points.push({
        id: amenity.id,
        x: amenity.metadata.x,
        y: amenity.metadata.y,
        type: amenity.amenity_type,
        name: amenity.name,
        accessible: amenity.is_accessible,
        desc: `Zone: ${amenity.zone?.name ?? ''}`
      });
    }

    for (const zone of zones ?? []) {
      if (!zone.metadata?.x || !zone.metadata?.y) continue;
      if (zone.zone_type !== 'gate' && zone.zone_type !== 'exit') continue;

      points.push({
        id: zone.id,
        x: zone.metadata.x,
        y: zone.metadata.y,
        type: zone.zone_type,
        name: zone.name,
        accessible: zone.is_accessible
      });
    }

    return points;
  },

  fetchLiveOverlays: async (matchId: string, _stadiumId: string): Promise<MapPoint[]> => {
    const alerts = await alertService.fetchActiveAlerts(matchId);

    const { data: incidents } = await supabase
      .from<IncidentWithZone>('incidents')
      .select('*, zone:zones(*)')
      .eq('match_id', matchId)
      .neq('status', 'resolved');

    const points: MapPoint[] = [];

    for (const incident of incidents ?? []) {
      if (!incident.zone?.metadata?.x || !incident.zone?.metadata?.y) continue;

      const isAlert = alerts.some((alert) => alert.id === incident.id);
      points.push({
        id: incident.id,
        x: incident.zone.metadata.x,
        y: incident.zone.metadata.y,
        type: isAlert ? 'live_alert' : 'live_incident',
        name: incident.title,
        desc: incident.ai_summary ?? incident.description,
        status: 'active'
      });
    }

    return points;
  },

  fetchRouteGraph: async (_stadiumId: string): Promise<RouteGraph> => {
    const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';

    const [{ data: zones }, { data: amenities }, { data: routes }] = await Promise.all([
      supabase.from<RouteNodeZone>('zones').select('*').eq('stadium_id', TEMPLATE_STADIUM_ID),
      supabase.from<AmenityRouteRow>('amenities').select('*, zone:zones(metadata)').eq('stadium_id', TEMPLATE_STADIUM_ID),
      supabase.from<RouteRow>('routes')
        .select('*, from_zone:zones!from_zone_id(metadata), to_zone:zones!to_zone_id(metadata)')
        .eq('stadium_id', TEMPLATE_STADIUM_ID)
    ]);

    const allNodes = [
      ...(zones ?? []).map((zone) => ({
        id: zone.id,
        name: zone.name,
        level: zone.level,
        is_accessible: zone.is_accessible,
        metadata: zone.metadata
      })),
      ...(amenities ?? []).map((amenity) => ({
        id: amenity.id,
        name: amenity.name,
        level: '1',
        is_accessible: amenity.is_accessible,
        metadata: amenity.metadata,
        parent_routing_key: amenity.zone?.metadata?.routing_key
      }))
    ];

    const allRoutes = (routes ?? []).map((route) => ({
      fromKey: route.from_zone?.metadata?.routing_key,
      toKey: route.to_zone?.metadata?.routing_key,
      distanceMeters: route.distance,
      is_accessible: route.is_accessible,
      type: route.distance > 30 ? (route.is_accessible ? 'elevator' : 'stairs') : 'walk'
    }));

    return buildVenueGraph(allNodes, allRoutes);
  }
};
