import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../dashboardService';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/services/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }
}));

vi.mock('@/lib/formatters', () => ({
  parseGroqRecommendations: vi.fn(() => [
    { id: '1', recommendation_type: 'food', title: 'Snack Time', content: 'Grab a snack at the west concourse.' },
    { id: '2', recommendation_type: 'crowd', title: 'Less Crowded', content: 'Gate B has the shortest line right now.' }
  ])
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

    it('returns an empty array when matchId is missing', async () => {
      const result = await dashboardService.getDashboardGateStatus('');
      expect(result).toEqual([]);
    });
  });

  describe('getDashboardRecommendations', () => {
    it('returns recommendations from DB if they exist', async () => {
      const mockRecs = [{ id: '1', recommendation_type: 'food', title: 'Food', content: 'Go eat' }];
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRecs, error: null })
      };
      
      (supabase.from as any).mockReturnValue(mockQueryBuilder);

      const result = await dashboardService.getDashboardRecommendations('test-match-id');
      expect(result).toEqual(mockRecs);
    });

    it('generates recommendations via Groq when DB returns no data', async () => {
      const aiRecommendationsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any).mockReturnValue(aiRecommendationsQuery);

      const { groq } = await import('@/services/groq');
      vi.mocked(groq.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: '[{"recommendation_type":"food","title":"Snack Time","content":"Grab a snack at the west concourse."},{"recommendation_type":"crowd","title":"Less Crowded","content":"Gate B has the shortest line right now."}]' } }]
      } as any);

      const result = await dashboardService.getDashboardRecommendations('test-match-id');
      expect(result).toEqual([
        { id: '1', recommendation_type: 'food', title: 'Snack Time', content: 'Grab a snack at the west concourse.' },
        { id: '2', recommendation_type: 'crowd', title: 'Less Crowded', content: 'Gate B has the shortest line right now.' }
      ]);
      expect(aiRecommendationsQuery.insert).toHaveBeenCalled();
    });

    it('returns empty recommendations when matchId is missing', async () => {
      const result = await dashboardService.getDashboardRecommendations('');
      expect(result).toEqual([]);
    });

    it('returns empty recommendations when groq generation fails', async () => {
      const aiRecommendationsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any).mockReturnValue(aiRecommendationsQuery);
      const { groq } = await import('@/services/groq');
      vi.mocked(groq.chat.completions.create).mockRejectedValueOnce(new Error('Groq down'));

      const result = await dashboardService.getDashboardRecommendations('test-match-id');
      expect(result).toEqual([]);
    });
  });

  describe('getLiveStatusCards', () => {
    it('returns live status for gate, food, and washroom', async () => {
      const mockGateData = [
        { density_score: 0.2, estimated_wait_minutes: 5, zones: { name: 'Gate A', zone_type: 'gate' } }
      ];
      
      const mockQueueData = [
        { estimated_wait_minutes: 10, amenities: { name: 'Burger', amenity_type: 'food' } },
        { estimated_wait_minutes: 2, amenities: { name: 'Restroom', amenity_type: 'washroom' } }
      ];

      // We'll intercept the two from() calls based on the table name
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'crowd_metrics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockGateData, error: null })
          };
        }
        if (table === 'queue_metrics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockQueueData, error: null })
          };
        }
        return {};
      });

      const result = await dashboardService.getLiveStatusCards('test-match-id');
      
      expect(result.gate).toEqual({ gate: 'Gate A', crowd: 'Low', waitTime: 5 });
      expect(result.food?.amenities?.name).toBe('Burger');
      expect(result.washroom?.amenities?.name).toBe('Restroom');
    });

    it('returns null cards when matchId is missing', async () => {
      const result = await dashboardService.getLiveStatusCards('');
      expect(result).toEqual({ gate: null, food: null, washroom: null });
    });

    it('handles queue query error gracefully', async () => {
      const mockGateData = [
        { density_score: 0.2, estimated_wait_minutes: 5, zones: { name: 'Gate A', zone_type: 'gate' } }
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'crowd_metrics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockGateData, error: null })
          };
        }
        if (table === 'queue_metrics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Queue DB down') })
          };
        }
        return {};
      });

      const result = await dashboardService.getLiveStatusCards('test-match-id');
      expect(result.gate).toEqual({ gate: 'Gate A', crowd: 'Low', waitTime: 5 });
      expect(result.food).toBeNull();
      expect(result.washroom).toBeNull();
    });
  });
});
