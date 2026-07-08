import { describe, it, expect, vi } from 'vitest';
import { queueService } from '../queueService';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'queue_metrics') {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(() => chain),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };
        // Ensure order can continue the chain as well
        chain.order.mockReturnValue(chain);
        return chain;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };
    })
  }
}));

describe('queueService error cases', () => {
  it('returns empty array when queue fetch fails', async () => {
    const { fetchQueueMetrics } = queueService;
    const metrics = await fetchQueueMetrics('m1');
    expect(metrics).toEqual([]);
  });

  it('returns null for missing amenity metric', async () => {
    const metric = await queueService.fetchQueueMetricForAmenity('m1', 'a1');
    expect(metric).toBeNull();
  });
});
