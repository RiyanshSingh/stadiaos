import { describe, it, expect, vi } from 'vitest';
import { alertService } from '../alertService';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'incidents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                title: 'Lost kid',
                description: 'Timmy is lost',
                incident_type: 'lost_child',
                severity: 'high',
                status: 'reported',
                created_at: '2023-01-01T00:00:00Z'
              },
              {
                id: '2',
                title: 'Crowd crushing',
                description: 'Too many people',
                incident_type: 'crowd_disturbance',
                severity: 'critical',
                status: 'reported',
                created_at: '2023-01-01T00:01:00Z'
              }
            ],
            error: null
          })
        };
      }
      if (table === 'ai_recommendations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: '10',
                title: 'Weather Delay',
                content: 'Match delayed by 30 mins',
                recommendation_type: 'public_advisory',
                created_at: '2023-01-01T00:02:00Z'
              }
            ],
            error: null
          })
        };
      }
      return {};
    })
  }
}));

describe('alertService', () => {
  it('should filter out non-fan-safe incidents and merge with public advisories', async () => {
    const alerts = await alertService.fetchActiveAlerts('match-1');
    
    // Total alerts should be 2: one safe incident, one advisory
    expect(alerts).toHaveLength(2);
    
    // Should be sorted by created_at descending (latest first)
    // 00:02:00 -> Weather Delay
    expect(alerts[0].id).toBe('10');
    expect(alerts[0].type).toBe('advisory');
    expect(alerts[0].title).toBe('Weather Delay');
    
    // 00:01:00 -> Crowd crushing (fan-safe incident)
    expect(alerts[1].id).toBe('2');
    expect(alerts[1].type).toBe('critical');
    expect(alerts[1].title).toBe('Crowd crushing');
    
    // 00:00:00 -> Lost kid (not fan-safe, should be filtered out)
  });
});
