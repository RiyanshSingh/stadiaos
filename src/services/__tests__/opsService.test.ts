import { describe, it, expect, vi, beforeEach } from 'vitest';
import { opsService } from '../opsService';
import { supabase } from '../supabase';
import { dashboardService } from '../dashboardService';
import { queueService } from '../queueService';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../dashboardService', () => ({
  dashboardService: {
    getDashboardGateStatus: vi.fn(),
  },
}));

vi.mock('../queueService', () => ({
  queueService: {
    fetchQueueMetrics: vi.fn(),
  },
}));

vi.mock('../facilityService', () => ({
  facilityService: {
    fetchFacilities: vi.fn(),
  },
}));

describe('opsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCommandCenterSnapshot', () => {
    it('aggregates data correctly from multiple sources', async () => {
      // Mock supabase count responses
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockNeq = vi.fn().mockResolvedValueOnce({ count: 5, error: null }) // incidents
                           .mockResolvedValueOnce({ count: 2, error: null }); // advisories (it won't hit neq but eq)
      
      const mockFrom = vi.fn((table) => {
        if (table === 'incidents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis().mockReturnValueOnce({
              neq: vi.fn().mockResolvedValue({ count: 5, error: null })
            })
          };
        }
        if (table === 'ai_recommendations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis().mockReturnValueOnce({
              eq: vi.fn().mockResolvedValue({ count: 2, error: null })
            })
          };
        }
      });
      (supabase.from as any) = mockFrom;

      // Mock dashboard/queue services
      (dashboardService.getDashboardGateStatus as any).mockResolvedValue([
        { gate: 'Gate A', crowd: 'High', waitTime: 15 },
        { gate: 'Gate B', crowd: 'Low', waitTime: 2 },
        { gate: 'Gate C', crowd: 'Medium', waitTime: 10 }
      ]);

      (queueService.fetchQueueMetrics as any).mockResolvedValue([
        { amenity_id: '1', queue_score: 0.8 }, // High
        { amenity_id: '2', queue_score: 0.5 }, // Not high
        { amenity_id: '3', queue_score: 0.9 }, // High
      ]);

      const snapshot = await opsService.fetchCommandCenterSnapshot('match-123');

      expect(snapshot.activeIncidentsCount).toBe(5);
      expect(snapshot.activeAdvisoriesCount).toBe(2);
      expect(snapshot.congestedGatesCount).toBe(2); // High + Medium
      expect(snapshot.highQueueFacilitiesCount).toBe(2); // > 0.7 score
    });
  });

  describe('publishPublicAdvisory', () => {
    it('inserts a public advisory into ai_recommendations', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        insert: mockInsert
      });

      await opsService.publishPublicAdvisory('match-1', 'stad-1', 'Test Alert', 'Test Content');

      expect(supabase.from).toHaveBeenCalledWith('ai_recommendations');
      expect(mockInsert).toHaveBeenCalledWith([{
        match_id: 'match-1',
        stadium_id: 'stad-1',
        recommendation_type: 'public_advisory',
        title: 'Test Alert',
        content: 'Test Content',
        generated_by: 'ops_manager'
      }]);
    });
  });
});
