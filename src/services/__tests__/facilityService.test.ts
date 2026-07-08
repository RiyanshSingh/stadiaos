import { describe, it, expect, vi } from 'vitest';
import { facilityService } from '../facilityService';

// Mock Supabase to return fake amenities
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'amenity-1',
          name: 'Burger Stand',
          amenity_type: 'food',
          is_accessible: true,
          zone: { name: 'Section 102' }
        }
      ],
      error: null
    })
  }
}));

// Mock queueService to return mock queue metrics
vi.mock('../queueService', () => ({
  queueService: {
    fetchQueueMetrics: vi.fn().mockResolvedValue([
      {
        amenity_id: 'amenity-1',
        estimated_wait_minutes: 15,
        queue_score: 0.8
      }
    ])
  }
}));

describe('facilityService', () => {
  it('should map db amenities and queue metrics to FacilityViewModel correctly', async () => {
    const facilities = await facilityService.fetchFacilities('stadium-1', 'match-1');
    
    expect(facilities).toHaveLength(1);
    expect(facilities[0].name).toBe('Burger Stand');
    expect(facilities[0].zone).toBe('Section 102');
    
    // Check queue derivations
    expect(facilities[0].wait).toBe('15 mins');
    expect(facilities[0].crowd).toBe('High'); // Because score is 0.8 > 0.7
  });
});
