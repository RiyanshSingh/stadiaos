import { describe, it, expect, vi } from 'vitest';
import { mapService } from '../mapService';

// We mock supabase queries since it hits DB
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation((col, _val) => {
      // Return a chainable object that eventually resolves or allows neq
      const chain = {
        neq: vi.fn().mockResolvedValue({
          data: [{ id: 'inc1', title: 'Test Inc', zone: { metadata: { x: '100', y: '200' } } }],
          error: null
        }),
        then: function(resolve: any) {
          if (col === 'stadium_id') {
            resolve({
              data: [
                { id: '1', kind: 'concourse', zone_type: 'gate', name: 'Zone 1', metadata: { x: '100', y: '200' } }
              ],
              error: null
            });
          } else {
            resolve({ data: [], error: null });
          }
        }
      };
      return chain;
    }),
  }
}));

// Mock alert service
vi.mock('../alertService', () => ({
  alertService: {
    fetchActiveAlerts: vi.fn().mockResolvedValue([
      { id: 'a1', type: 'crowd', metadata: { zone_id: 'z1', coordinates: [100, 200] } }
    ])
  }
}));

describe('mapService', () => {
  it('fetches base explore points from zones and amenities', async () => {
    const points = await mapService.fetchExplorePoints('s1', 'm1');
    expect(points.length).toBeGreaterThan(0);
    // Since we mocked supabase eq to return 1 zone
    expect(points.some(p => p.type === 'gate')).toBe(true);
  });

  it('fetches live overlays from alerts', async () => {
    const overlays = await mapService.fetchLiveOverlays('m1', 's1');
    expect(overlays.length).toBe(1);
    expect(overlays[0].type).toBe('live_incident');
    expect(overlays[0].x).toEqual('100');
  });
});
