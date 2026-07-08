import { describe, it, expect, vi, beforeEach } from 'vitest';
import { opsService } from '../opsService';
import { supabase } from '../supabase';
import { dashboardService } from '../dashboardService';
import { queueService } from '../queueService';
import { facilityService } from '../facilityService';
import { requireOpsSession } from '@/lib/authGuards';

vi.mock('@/lib/authGuards', () => ({
  requireOpsSession: vi.fn().mockResolvedValue('ops-123'),
  requireFanSession: vi.fn().mockResolvedValue('fan-123'),
}));

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
    vi.mocked(requireOpsSession).mockResolvedValue('ops-123');
  });

  describe('fetchCommandCenterSnapshot', () => {
    it('rejects when ops session is missing', async () => {
      vi.mocked(requireOpsSession).mockRejectedValueOnce(new Error('Forbidden'));

      await expect(opsService.fetchCommandCenterSnapshot('match-123')).rejects.toThrow('Forbidden');
      expect(supabase.from).not.toHaveBeenCalled();
      expect(dashboardService.getDashboardGateStatus).not.toHaveBeenCalled();
      expect(queueService.fetchQueueMetrics).not.toHaveBeenCalled();
    });

    it('rejects when matchId is invalid', async () => {
      await expect(opsService.fetchCommandCenterSnapshot('')).rejects.toThrow('Invalid snapshot context.');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('aggregates data correctly from multiple sources', async () => {
      // Mock supabase count responses
      const _mockSelect = vi.fn().mockReturnThis();
      const _mockEq = vi.fn().mockReturnThis();
      const _mockNeq = vi.fn().mockResolvedValueOnce({ count: 5, error: null }) // incidents
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
    it('rejects when ops session is missing', async () => {
      vi.mocked(requireOpsSession).mockRejectedValueOnce(new Error('Forbidden'));

      await expect(opsService.publishPublicAdvisory('match-1', 'stad-1', 'Test Alert', 'Test Content'))
        .rejects.toThrow('Forbidden');
      expect(supabase.from).not.toHaveBeenCalled();
    });

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

  it('publishes a public advisory successfully', async () => {
    // 1. Mock insert
    (supabase.from as any).mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: null })
    });

    await expect(opsService.publishPublicAdvisory('match-1', 'stadium-1', 'Test Title', 'Test Content'))
      .resolves.not.toThrow();
  });

  it('throws error when public advisory publishing fails', async () => {
    // 1. Mock insert failure
    (supabase.from as any).mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') })
    });

    await expect(opsService.publishPublicAdvisory('match-1', 'stadium-1', 'Test Title', 'Test Content'))
      .rejects.toThrow('Insert failed');
  });

  describe('fetchCommandCenterSnapshot edge cases', () => {
    it('handles empty state fallback when counts return null', async () => {
      const mockFrom = vi.fn((table) => {
        if (table === 'incidents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis().mockReturnValueOnce({
              neq: vi.fn().mockResolvedValue({ count: null, error: null })
            })
          };
        }
        if (table === 'ai_recommendations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis().mockReturnValueOnce({
              eq: vi.fn().mockResolvedValue({ count: null, error: null })
            })
          };
        }
      });
      (supabase.from as any) = mockFrom;

      (dashboardService.getDashboardGateStatus as any).mockResolvedValue([]);
      (queueService.fetchQueueMetrics as any).mockResolvedValue([]);

      const snapshot = await opsService.fetchCommandCenterSnapshot('match-123');

      expect(snapshot.activeIncidentsCount).toBe(0);
      expect(snapshot.activeAdvisoriesCount).toBe(0);
      expect(snapshot.congestedGatesCount).toBe(0);
      expect(snapshot.highQueueFacilitiesCount).toBe(0);
    });
  });

  describe('fetchOperationsHotspots', () => {
    it('rejects when ops session is missing', async () => {
      vi.mocked(requireOpsSession).mockRejectedValueOnce(new Error('Forbidden'));

      await expect(opsService.fetchOperationsHotspots('match-1', 'stad-1')).rejects.toThrow('Forbidden');
      expect(dashboardService.getDashboardGateStatus).not.toHaveBeenCalled();
      expect(facilityService.fetchFacilities).not.toHaveBeenCalled();
    });

    it('fetches hotspots successfully and sorts by crowd', async () => {
      (dashboardService.getDashboardGateStatus as any).mockResolvedValue([
        { gate: 'Gate A', crowd: 'High', waitTime: 15 }
      ]);
      (facilityService.fetchFacilities as any).mockResolvedValue([
        { id: '1', crowd: 'Low' },
        { id: '2', crowd: 'High' },
        { id: '3', crowd: 'Medium' }
      ]);

      const data = await opsService.fetchOperationsHotspots('match-1', 'stad-1');
      expect(data.gates.length).toBe(1);
      // High (id 2) should be first, Medium (id 3) second, Low (id 1) last
      expect(data.facilities[0].id).toBe('2');
      expect(data.facilities[1].id).toBe('3');
      expect(data.facilities[2].id).toBe('1');
    });

    it('rejects when hotspot context is invalid', async () => {
      await expect(opsService.fetchOperationsHotspots('', 'stad-1')).rejects.toThrow('Invalid operations hotspots context.');
      await expect(opsService.fetchOperationsHotspots('match-1', '')).rejects.toThrow('Invalid operations hotspots context.');
    });

    it('handles failure when facility service throws error', async () => {
      (dashboardService.getDashboardGateStatus as any).mockResolvedValue([]);
      (facilityService.fetchFacilities as any).mockRejectedValue(new Error('Facility error'));

      await expect(opsService.fetchOperationsHotspots('match-1', 'stad-1')).rejects.toThrow('Facility error');
    });
  });
});
