import { describe, it, expect, vi } from 'vitest';
import { mapService } from '../mapService';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'zones') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [
            { id: 'z1', name: 'Zone 1', level: '1', is_accessible: true, metadata: { x: '0', y: '0', routing_key: 'zone-1' }, zone_type: 'gate' }
          ], error: null })
        };
      }
      if (table === 'amenities') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [
            { id: 'a1', name: 'Food Stall', is_accessible: false, metadata: { x: '1', y: '1', routing_key: 'amenity-1' }, zone: { metadata: { routing_key: 'zone-1' } } }
          ], error: null })
        };
      }
      if (table === 'routes') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [
            { from_zone: { metadata: { routing_key: 'zone-1' } }, to_zone: { metadata: { routing_key: 'amenity-1' } }, distance: 20, is_accessible: false }
          ], error: null })
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
    })
  }
}));

describe('mapService route graph', () => {
  it('builds a route graph from zones amenities and routes', async () => {
    const graph = await mapService.fetchRouteGraph('stadium-1');
    expect(graph.nodes).toBeDefined();
    expect(graph.nodes.has('zone-1')).toBe(true);
    expect(graph.edges).toBeDefined();
    expect(graph.edges.some((edge: any) => edge.fromKey === 'zone-1' && edge.toKey === 'amenity-1')).toBe(true);
  });
});
