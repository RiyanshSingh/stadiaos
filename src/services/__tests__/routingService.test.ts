import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildVenueGraph, ROUTING_KEYS } from '../routing/venueGraph';
import { routingService } from '../routing/routingService';
import { resolveSourceKey, resolveDestinationKey } from '../routing/nodeResolver';

// Mock useAppStore for routingService
vi.mock('@/store/useAppStore', () => ({
  useAppStore: {
    getState: () => ({
      ticket: { seat_section: '214', seat_row: 'F', seat_number: '12' }
    })
  }
}));

// Build a minimal test graph from mock DB nodes
const MOCK_DB_NODES = [
  { id: 'uuid-gate-a',   name: 'Gate A',          level: '0', is_accessible: true,  metadata: { routing_key: 'gate_a',          x: '10%', y: '48%' } },
  { id: 'uuid-north',    name: 'North Concourse',  level: '1', is_accessible: true,  metadata: { routing_key: 'north_concourse',  x: '50%', y: '18%' } },
  { id: 'uuid-east',     name: 'East Concourse',   level: '1', is_accessible: true,  metadata: { routing_key: 'east_concourse',   x: '82%', y: '48%' } },
  { id: 'uuid-west',     name: 'West Concourse',   level: '1', is_accessible: true,  metadata: { routing_key: 'west_concourse',   x: '18%', y: '48%' } },
  { id: 'uuid-south',    name: 'South Concourse',  level: '1', is_accessible: true,  metadata: { routing_key: 'south_concourse',  x: '50%', y: '78%' } },
  { id: 'uuid-esc-n',    name: 'Escalator North',  level: '1', is_accessible: true,  metadata: { routing_key: 'escalator_north',  x: '50%', y: '26%' } },
  { id: 'uuid-esc-s',    name: 'Escalator South',  level: '1', is_accessible: true,  metadata: { routing_key: 'escalator_south',  x: '50%', y: '70%' } },
  { id: 'uuid-elev-e',   name: 'Elevator East',    level: '1', is_accessible: true,  metadata: { routing_key: 'elevator_east',    x: '76%', y: '48%' } },
  { id: 'uuid-s214',     name: 'Section 214',      level: '2', is_accessible: true,  metadata: { routing_key: 'section_214',      x: '32%', y: '32%' } },
  { id: 'uuid-s102',     name: 'Section 102',      level: '2', is_accessible: true,  metadata: { routing_key: 'section_102',      x: '50%', y: '62%' } },
  { id: 'uuid-s330',     name: 'Section 330',      level: '2', is_accessible: false, metadata: { routing_key: 'section_330',      x: '68%', y: '32%' } },
  { id: 'uuid-wash-n',   name: 'Washroom (North)', level: '1', is_accessible: true,  metadata: { routing_key: 'washroom_north',   x: '55%', y: '18%' } },
  { id: 'uuid-food-n',   name: 'Burger Grill',     level: '1', is_accessible: true,  metadata: { routing_key: 'food_north',       x: '45%', y: '18%' } },
  { id: 'uuid-med',      name: 'Medical Station',  level: '1', is_accessible: true,  metadata: { routing_key: 'medical_station',  x: '82%', y: '56%' } },
];

describe('venueGraph', () => {
  it('builds a graph with the expected number of nodes from seeded routing keys', () => {
    const graph = buildVenueGraph(MOCK_DB_NODES);
    // We have 14 mock nodes above, but the graph only includes ones with routing_key
    expect(graph.nodes.size).toBe(14);
    expect(graph.nodes.has(ROUTING_KEYS.SECTION_214)).toBe(true);
    expect(graph.nodes.has(ROUTING_KEYS.GATE_A)).toBe(true);
  });

  it('does not include nodes without routing_key in metadata', () => {
    const graph = buildVenueGraph([
      ...MOCK_DB_NODES,
      { id: 'uuid-no-key', name: 'Mystery Zone', level: '1', is_accessible: true, metadata: {} }
    ]);
    // Node count stays at 14 — the unkeyed one is excluded
    expect(graph.nodes.size).toBe(14);
  });
});

describe('routingService', () => {
  let graph: ReturnType<typeof buildVenueGraph>;
  
  beforeEach(() => {
    graph = buildVenueGraph(MOCK_DB_NODES);
  });

  it('computes a valid route from Section 214 to Gate A (standard mode)', () => {
    const result = routingService.computeRoute(
      {
        source: { kind: 'ticket_seat' }, // resolves to section_214 via mocked ticket
        destination: { kind: 'gate', name: 'gate a' },
        mode: 'standard',
      },
      graph
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.sourceLabel).toBe('Section 214');
    expect(result.destinationLabel).toBe('Gate A');
    expect(result.etaMinutes).toBeGreaterThan(0);
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[result.steps.length - 1].type).toBe('arrive');
    expect(result.polyline.length).toBeGreaterThan(1);
  });

  it('computes a valid route from Section 214 to washroom in standard mode', () => {
    const result = routingService.computeRoute(
      {
        source: { kind: 'ticket_seat' },
        destination: { kind: 'label', label: 'washroom' },
        mode: 'standard',
      },
      graph
    );

    expect(result.ok).toBe(true);
  });

  it('returns an error if no accessible route exists to a stair-only destination', () => {
    // Section 330 is only reachable via stairs (accessible: false edge)
    const result = routingService.computeRoute(
      {
        source: { kind: 'zone', routingKey: ROUTING_KEYS.GATE_A },
        destination: { kind: 'zone', routingKey: ROUTING_KEYS.SECTION_330 },
        mode: 'accessible',
      },
      graph
    );

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.reason).toContain('accessible');
    }
  });

  it('returns ok: false for unknown destination', () => {
    const result = routingService.computeRoute(
      {
        source: { kind: 'ticket_seat' },
        destination: { kind: 'label', label: 'nonexistent-place-xyz' },
        mode: 'standard',
      },
      graph
    );
    expect(result.ok).toBe(false);
  });
});

describe('nodeResolver', () => {
  let graph: ReturnType<typeof buildVenueGraph>;
  
  beforeEach(() => {
    graph = buildVenueGraph(MOCK_DB_NODES);
  });

  it('resolves ticket_seat strategy to section_214 from mocked ticket', () => {
    const mockTicket = { seat_section: '214' } as any;
    const key = resolveSourceKey({ kind: 'ticket_seat' }, mockTicket, graph);
    expect(key).toBe(ROUTING_KEYS.SECTION_214);
  });

  it('resolves label "washroom" to washroom_north', () => {
    const key = resolveDestinationKey({ kind: 'label', label: 'washroom' }, null, graph);
    expect(key).toBe(ROUTING_KEYS.WASHROOM_NORTH);
  });

  it('resolves gate strategy to gate routing key', () => {
    const key = resolveDestinationKey({ kind: 'gate', name: 'gate b' }, null, graph);
    expect(key).toBe(ROUTING_KEYS.GATE_B);
  });
});
