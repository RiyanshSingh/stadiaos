import { describe, it, expect, vi } from 'vitest';
import { queueService } from '../queueService';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: '1', amenity_id: 'a1', match_id: 'm1' },
      error: null
    }),
    then: function(resolve: any) {
      resolve({
        data: [
          { id: '1', amenity_id: 'a1', match_id: 'm1' },
          { id: '2', amenity_id: 'a1', match_id: 'm1' }, // old
          { id: '3', amenity_id: 'a2', match_id: 'm1' }
        ],
        error: null
      });
    }
  }
}));

describe('queueService', () => {
  it('fetches queue metrics and deduplicates to latest per amenity', async () => {
    const metrics = await queueService.fetchQueueMetrics('m1');
    expect(metrics).toHaveLength(2); // a1 and a2
    expect(metrics[0].amenity_id).toBe('a1');
  });

  it('fetches single metric for amenity', async () => {
    const metric = await queueService.fetchQueueMetricForAmenity('m1', 'a1');
    expect(metric?.amenity_id).toBe('a1');
  });
});
