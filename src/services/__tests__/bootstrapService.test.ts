/**
 * bootstrapService.test.ts
 * Tests the bootstrap data loading: profile null handling,
 * missing ticket graceful handling, and ops role behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/authGuards', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

// Mock supabase using a factory function (no top-level vars, vitest hoists vi.mock)
vi.mock('@/services/supabase', () => {
  const maybySingle = vi.fn();
  const single = vi.fn();
  const chainable = {
    select: () => chainable,
    eq: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    maybeSingle: maybySingle,
    single: single,
  };
  return {
    supabase: {
      from: vi.fn(() => chainable),
      __maybeSingle: maybySingle,
      __single: single,
    },
  };
});

import { bootstrapService } from '@/services/bootstrapService';
import { supabase } from '@/services/supabase';

// Access the internal mock fns via the mock
const getMaybeSingle = () => (supabase as any).__maybeSingle as ReturnType<typeof vi.fn>;

describe('bootstrapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error when profile fetch throws an error', async () => {
    getMaybeSingle().mockRejectedValueOnce(new Error('DB connection failed'));
    await expect(bootstrapService.loadAppBootstrapData('user-123')).rejects.toThrow('DB connection failed');
  });

  it('throws an error when profile is not found', async () => {
    getMaybeSingle().mockResolvedValueOnce({ data: null, error: null });
    await expect(bootstrapService.loadAppBootstrapData('user-123')).rejects.toThrow('Profile not found. Re-authentication required.');
  });

  it('returns profile with null ticket when fan has no tickets', async () => {
    const mockProfile = { id: 'user-123', role: 'fan', email: 'fan@test.com', full_name: 'Fan User' };
    getMaybeSingle()
      .mockResolvedValueOnce({ data: mockProfile, error: null }) // profile
      .mockResolvedValueOnce({ data: null, error: null });       // ticket

    const result = await bootstrapService.loadAppBootstrapData('user-123');
    expect(result?.profile).toEqual(mockProfile);
    expect(result?.ticket).toBeNull();
    expect(result?.match).toBeNull();
  });

  it('returns profile with null ticket/match for ops_manager role', async () => {
    const mockOpsProfile = { id: 'ops-123', role: 'ops_manager', email: 'ops@test.com', full_name: 'Ops User' };
    getMaybeSingle().mockResolvedValueOnce({ data: mockOpsProfile, error: null });

    const result = await bootstrapService.loadAppBootstrapData('ops-123');
    expect(result?.profile?.role).toBe('ops_manager');
    expect(result?.ticket).toBeNull();
    expect(result?.match).toBeNull();
  });

  it('hydrates match data from joined ticket.matches correctly', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
        // profile
        .mockResolvedValueOnce({
          data: { id: 'u1', role: 'fan' },
          error: null
        })
        // ticket
        .mockResolvedValueOnce({
          data: { 
            id: 't1', 
            match_id: 'm1',
            matches: {
              id: 'm1',
              title: null,
              stadiums: { name: 'Wembley' }
            }
          },
          error: null
        })
    });

    const data = await bootstrapService.loadAppBootstrapData('u1');
    expect(data.match?.title).toBe('Wembley Match');
    expect(data.match?.stadium_name).toBe('Wembley');
  });
});

