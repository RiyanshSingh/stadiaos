import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../dashboardService';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardGateStatus', () => {
    it('returns formatted gate statuses based on crowd metrics', async () => {
      const mockMetrics = [
        {
          density_score: 0.8,
          estimated_wait_minutes: 15,
          zones: { name: 'Gate A', zone_type: 'gate' }
        },
        {
          density_score: 0.5,
          estimated_wait_minutes: 5,
          zones: { name: 'Gate B', zone_type: 'gate' }
        },
        {
          density_score: 0.2,
          estimated_wait_minutes: 2,
          zones: { name: 'Gate C', zone_type: 'gate' }
        },
        {
          density_score: 0.9,
          estimated_wait_minutes: 20,
          zones: { name: 'Section 101', zone_type: 'seating' } // Should be ignored
        }
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockMetrics, error: null })
      };

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await dashboardService.getDashboardGateStatus('test-match-id');

      expect(supabase.from).toHaveBeenCalledWith('crowd_metrics');
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { gate: 'Gate A', crowd: 'High', waitTime: 15 },
        { gate: 'Gate B', crowd: 'Medium', waitTime: 5 },
        { gate: 'Gate C', crowd: 'Low', waitTime: 2 }
      ]);
    });

    it('returns an empty array on error', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
      };

      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await dashboardService.getDashboardGateStatus('test-match-id');
      expect(result).toEqual([]);
    });
  });
});
