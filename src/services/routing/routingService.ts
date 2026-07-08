import type {
  RouteRequest, RouteOutcome, RouteResult, RouteStep,
  RouteGraph, RouteEdge, RouteMode,
} from '@/lib/types/routing';
import { resolveSourceKey, resolveDestinationKey, resolveNode } from './nodeResolver';
import { useAppStore } from '@/store/useAppStore';

const WALKING_SPEED_MPS = 1.33; // meters per second

// ─── Dijkstra ─────────────────────────────────────────────────────────────────

interface DijkstraResult {
  dist: Map<string, number>;
  prev: Map<string, { key: string; edge: RouteEdge } | null>;
}

function dijkstra(
  graph: RouteGraph,
  startKey: string,
  mode: RouteMode
): DijkstraResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, { key: string; edge: RouteEdge } | null>();
  const visited = new Set<string>();

  // Initialise
  for (const key of graph.nodes.keys()) {
    dist.set(key, Infinity);
    prev.set(key, null);
  }
  dist.set(startKey, 0);

  // Simple priority queue via sorted array (sufficient for small indoor graphs)
  const queue: string[] = [startKey];

  while (queue.length > 0) {
    // Pop minimum-distance node
    queue.sort((a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity));
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const edge of graph.edges) {
      if (edge.fromKey !== current) continue;
      // Skip non-accessible edges if accessibility mode is on
      if (mode === 'accessible' && !edge.accessible) continue;

      const neighbour = edge.toKey;
      if (!graph.nodes.has(neighbour)) continue;
      const newDist = (dist.get(current) ?? Infinity) + edge.distanceMeters;
      if (newDist < (dist.get(neighbour) ?? Infinity)) {
        dist.set(neighbour, newDist);
        prev.set(neighbour, { key: current, edge });
        if (!visited.has(neighbour)) queue.push(neighbour);
      }
    }
  }

  return { dist, prev };
}

// ─── Path reconstruction ───────────────────────────────────────────────────────

interface PathSegment { key: string; edge: RouteEdge | null }

function reconstructPath(
  prev: Map<string, { key: string; edge: RouteEdge } | null>,
  endKey: string
): PathSegment[] {
  const path: PathSegment[] = [];
  let current: string | null = endKey;

  while (current !== null) {
    const entry = prev.get(current);
    path.unshift({ key: current, edge: entry?.edge ?? null });
    current = entry ? entry.key : null;
    if (!entry) break;
  }

  return path;
}

// ─── Step list builder ────────────────────────────────────────────────────────

function edgeTypeVerb(type: RouteEdge['type']): string {
  switch (type) {
    case 'escalator': return 'Take escalator at';
    case 'elevator':  return 'Take elevator at';
    case 'stairs':    return 'Take stairs at';
    case 'ramp':      return 'Take ramp at';
    default:          return 'Walk to';
  }
}

function buildSteps(segments: PathSegment[], graph: RouteGraph): RouteStep[] {
  const steps: RouteStep[] = [];

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const node = resolveNode(seg.key, graph);
    if (!node || !seg.edge) continue;

    steps.push({
      instruction: `${edgeTypeVerb(seg.edge.type)} ${node.label}`,
      distance: `${seg.edge.distanceMeters}m`,
      type: seg.edge.type,
    });
  }

  if (segments.length > 0) {
    const lastKey = segments[segments.length - 1].key;
    const lastNode = resolveNode(lastKey, graph);
    if (lastNode) {
      steps.push({
        instruction: `Arrive at ${lastNode.label}`,
        distance: '',
        type: 'arrive',
      });
    }
  }

  return steps;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const routingService = {
  computeRoute(request: RouteRequest, graph: RouteGraph): RouteOutcome {
    const { ticket } = useAppStore.getState();

    const sourceKey = resolveSourceKey(request.source, ticket, graph);
    const destKey   = resolveDestinationKey(request.destination, ticket, graph);

    if (!sourceKey) return { ok: false, reason: 'Could not resolve source location.' };
    if (!destKey)   return { ok: false, reason: 'Could not resolve destination location.' };
    if (sourceKey === destKey) return { ok: false, reason: 'Source and destination are the same.' };

    if (!graph.nodes.has(sourceKey)) return { ok: false, reason: `Source node "${sourceKey}" not in graph.` };
    if (!graph.nodes.has(destKey))   return { ok: false, reason: `Destination node "${destKey}" not in graph.` };

    const { dist, prev } = dijkstra(graph, sourceKey, request.mode);

    if ((dist.get(destKey) ?? Infinity) === Infinity) {
      return {
        ok: false,
        reason: request.mode === 'accessible'
          ? 'No accessible route found. Try standard route mode.'
          : 'No route found between these locations.',
      };
    }

    const totalMeters = dist.get(destKey)!;
    const segments    = reconstructPath(prev, destKey);
    const steps       = buildSteps(segments, graph);
    const pathNodeKeys = segments.map(s => s.key);

    // Build polyline from node XY coords
    const polyline = pathNodeKeys
      .map(k => resolveNode(k, graph))
      .filter(Boolean)
      .map(n => ({ x: n!.x, y: n!.y }));

    const sourceNode = resolveNode(sourceKey, graph);
    const destNode   = resolveNode(destKey, graph);

    const result: RouteResult = {
      ok: true,
      sourceLabel:      sourceNode?.label ?? sourceKey,
      destinationLabel: destNode?.label   ?? destKey,
      etaMinutes:       Math.ceil(totalMeters / WALKING_SPEED_MPS / 60),
      distanceMeters:   Math.round(totalMeters),
      routeMode:        request.mode,
      steps,
      pathNodeKeys,
      polyline,
    };

    return result;
  },
};
