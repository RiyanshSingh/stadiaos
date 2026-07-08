import type { RouteEdge, RouteGraph, RouteNode } from '@/lib/types/routing';

/**
 * Semantic routing keys for the venue.
 * These must match `metadata.routing_key` values in the DB.
 * The graph topology is defined in terms of these keys — never raw UUIDs.
 */
export const ROUTING_KEYS = {
  // Gates (level 0)
  GATE_A: 'gate_a',
  GATE_B: 'gate_b',
  GATE_C: 'gate_c',

  // Concourses (level 1)
  NORTH_CONCOURSE: 'north_concourse',
  SOUTH_CONCOURSE: 'south_concourse',
  EAST_CONCOURSE: 'east_concourse',
  WEST_CONCOURSE: 'west_concourse',

  // Level transitions
  ESCALATOR_NORTH: 'escalator_north',
  ESCALATOR_SOUTH: 'escalator_south',
  ELEVATOR_EAST: 'elevator_east',

  // Stands / Sections (level 2)
  SECTION_102: 'section_102',
  SECTION_214: 'section_214',
  SECTION_330: 'section_330',

  // Amenities
  FOOD_NORTH: 'food_north',
  FOOD_SOUTH: 'food_south',
  WASHROOM_NORTH: 'washroom_north',
  WASHROOM_EAST: 'washroom_east',
  MEDICAL_STATION: 'medical_station',
} as const;

/**
 * Build a bidirectional RouteGraph from fetched DB nodes and routes.
 * @param dbNodes - Array of zone/amenity records from Supabase
 * @param dbRoutes - Array of edges from the routes table
 */
export function buildVenueGraph(
  dbNodes: Array<{
    id: string;
    name: string;
    level?: string;
    is_accessible: boolean;
    metadata?: { routing_key?: string; x?: string; y?: string };
    parent_routing_key?: string;
  }>,
  dbRoutes: Array<{
    fromKey: string;
    toKey: string;
    distanceMeters: number;
    is_accessible: boolean;
    type: string;
  }>
): RouteGraph {
  const nodeMap = new Map<string, RouteNode>();

  // Index DB nodes by their routing key
  for (const n of dbNodes) {
    const key = n.metadata?.routing_key;
    if (!key) continue;
    nodeMap.set(key, {
      routingKey: key,
      id: n.id,
      label: n.name,
      level: n.level || '0',
      x: n.metadata?.x || '50%',
      y: n.metadata?.y || '50%',
      accessible: n.is_accessible,
    });
  }

  // Make edges bidirectional
  const allEdges: RouteEdge[] = [];
  
  // 1. Add DB routes (already bidirectional in DB or we can ensure it here just in case)
  for (const edge of dbRoutes) {
    if (edge.fromKey && edge.toKey) {
      allEdges.push({
        fromKey: edge.fromKey,
        toKey: edge.toKey,
        distanceMeters: edge.distanceMeters,
        type: edge.type as any,
        accessible: edge.is_accessible,
      });
    }
  }

  // 2. Add dynamic edges connecting amenities to their parent concourse
  for (const n of dbNodes) {
    const amenityKey = n.metadata?.routing_key;
    const parentKey = n.parent_routing_key;
    if (amenityKey && parentKey && nodeMap.has(parentKey)) {
      // Connect amenity to parent zone bidirectionally
      allEdges.push({
        fromKey: parentKey,
        toKey: amenityKey,
        distanceMeters: 15, // average walking distance from concourse to amenity
        type: 'walk',
        accessible: n.is_accessible, // accessible if amenity is
      });
      allEdges.push({
        fromKey: amenityKey,
        toKey: parentKey,
        distanceMeters: 15,
        type: 'walk',
        accessible: n.is_accessible,
      });
    }
  }

  return { nodes: nodeMap, edges: allEdges };
}
