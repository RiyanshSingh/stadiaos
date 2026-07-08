import { ROUTING_KEYS } from './venueGraph';
import type { RouteGraph, RouteNode, RouteSourceStrategy, RouteDestinationStrategy } from '@/lib/types/routing';
import type { Ticket } from '@/lib/types/domain';

/**
 * Map ticket seat sections to routing keys.
 * This keeps the resolution logic isolated and easy to extend.
 */
const SECTION_TO_ROUTING_KEY: Record<string, string> = {
  '102': ROUTING_KEYS.SECTION_102,
  '214': ROUTING_KEYS.SECTION_214,
  '330': ROUTING_KEYS.SECTION_330,
  'Section 102': ROUTING_KEYS.SECTION_102,
  'Section 214': ROUTING_KEYS.SECTION_214,
  'Section 330': ROUTING_KEYS.SECTION_330,
};

/** Map common amenity type / label to routing keys */
const LABEL_TO_ROUTING_KEY: Record<string, string> = {
  'food':              ROUTING_KEYS.FOOD_NORTH,
  'cafeteria':         ROUTING_KEYS.FOOD_NORTH,
  'concession':        ROUTING_KEYS.FOOD_NORTH,
  'concessions':       ROUTING_KEYS.FOOD_NORTH,
  'burger grill':      ROUTING_KEYS.FOOD_NORTH,
  'coffee':            ROUTING_KEYS.FOOD_SOUTH,
  'washroom':          ROUTING_KEYS.WASHROOM_NORTH,
  'washroom (north)':  ROUTING_KEYS.WASHROOM_NORTH,
  'washroom north':    ROUTING_KEYS.WASHROOM_NORTH,
  'washroom east':     ROUTING_KEYS.WASHROOM_EAST,
  'medical':           ROUTING_KEYS.MEDICAL_STATION,
  'medical station':   ROUTING_KEYS.MEDICAL_STATION,
  'gate a':            ROUTING_KEYS.GATE_A,
  'gate b':            ROUTING_KEYS.GATE_B,
  'gate c':            ROUTING_KEYS.GATE_C,
  'exit':              ROUTING_KEYS.GATE_A,
  'seat':              ROUTING_KEYS.SECTION_214,  // default if no ticket
  'my seat':           ROUTING_KEYS.SECTION_214,
  'section 102':       ROUTING_KEYS.SECTION_102,
  'section 214':       ROUTING_KEYS.SECTION_214,
  'section 330':       ROUTING_KEYS.SECTION_330,
};

/**
 * Resolve a RouteSourceStrategy to a concrete routingKey.
 * Returns null if resolution fails.
 */
export function resolveSourceKey(
  source: RouteSourceStrategy,
  ticket: Ticket | null,
  graph: RouteGraph
): string | null {
  switch (source.kind) {
    case 'ticket_seat': {
      if (!ticket) return ROUTING_KEYS.NORTH_CONCOURSE; // safe fallback
      const key =
        SECTION_TO_ROUTING_KEY[ticket.seat_section] ||
        SECTION_TO_ROUTING_KEY[`Section ${ticket.seat_section}`];
      return key || ROUTING_KEYS.NORTH_CONCOURSE;
    }
    case 'zone':
    case 'amenity':
      return graph.nodes.has(source.routingKey) ? source.routingKey : null;
    case 'gate': {
      const key = LABEL_TO_ROUTING_KEY[source.name.toLowerCase()];
      return key ?? null;
    }
    case 'label':
      return resolveLabel(source.label, graph);
  }
}

/**
 * Resolve a RouteDestinationStrategy to a concrete routingKey.
 */
export function resolveDestinationKey(
  destination: RouteDestinationStrategy,
  ticket: Ticket | null,
  graph: RouteGraph
): string | null {
  switch (destination.kind) {
    case 'ticket_seat':
      return resolveSourceKey({ kind: 'ticket_seat' }, ticket, graph);
    case 'zone':
    case 'amenity':
      return graph.nodes.has(destination.routingKey) ? destination.routingKey : null;
    case 'gate': {
      const key = LABEL_TO_ROUTING_KEY[destination.name.toLowerCase()];
      return key ?? null;
    }
    case 'label':
      return resolveLabel(destination.label, graph);
  }
}

/**
 * Fuzzy label resolution — tries exact match first, then substring.
 */
function resolveLabel(label: string, graph: RouteGraph): string | null {
  const normalized = label.toLowerCase().trim();

  // 1. direct lookup in static map
  if (LABEL_TO_ROUTING_KEY[normalized]) {
    const key = LABEL_TO_ROUTING_KEY[normalized];
    if (graph.nodes.has(key)) return key;
  }

  // 2. partial match on label
  for (const [k, v] of Object.entries(LABEL_TO_ROUTING_KEY)) {
    if (normalized.includes(k) || k.includes(normalized)) {
      if (graph.nodes.has(v)) return v;
    }
  }

  // 3. match on graph node label
  for (const [, node] of graph.nodes) {
    if (node.label.toLowerCase().includes(normalized)) return node.routingKey;
  }

  return null;
}

/**
 * Resolve a routingKey to the full RouteNode, with fallback.
 */
export function resolveNode(key: string, graph: RouteGraph): RouteNode | null {
  return graph.nodes.get(key) ?? null;
}
