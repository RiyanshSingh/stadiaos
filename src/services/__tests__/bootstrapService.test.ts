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
import { requireAuthenticatedUser } from '@/lib/authGuards';

// Access the internal mock fns via the mock
const getMaybeSingle = () => (supabase as any).__maybeSingle as ReturnType<typeof vi.fn>;

describe('bootstrapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue('session-user');
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: getMaybeSingle(),
      single: (supabase as any).__single,
    }));
  });

  it('rejects before querying when auth guard rejects', async () => {
    vi.mocked(requireAuthenticatedUser).mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(bootstrapService.loadAppBootstrapData('user-123')).rejects.toThrow('Unauthorized');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('hydrates valid fan bootstrap data with ticket and joined match', async () => {
    const mockProfile = { id: 'user-123', role: 'fan', email: 'fan@test.com', full_name: 'Fan User' };
    const mockTicket = {
      id: 'ticket-123',
      user_id: 'user-123',
      match_id: 'match-123',
      seat_section: 'N101',
      matches: {
        id: 'match-123',
        title: 'Derby Final',
        stadiums: { name: 'Wembley Stadium' },
      },
    };

    getMaybeSingle()
      .mockResolvedValueOnce({ data: mockProfile, error: null })
      .mockResolvedValueOnce({ data: mockTicket, error: null });

    const result = await bootstrapService.loadAppBootstrapData('user-123');

    expect(result.profile).toEqual(mockProfile);
    expect(result.ticket).toEqual(mockTicket);
    expect(result.match?.id).toBe('match-123');
    expect(result.match?.title).toBe('Derby Final');
    expect(result.match?.stadium_name).toBe('Wembley Stadium');
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

  it('throws an error for an unsupported role', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: { id: 'u3', role: 'admin' }, error: null })
    });
    await expect(bootstrapService.loadAppBootstrapData('u3')).rejects.toThrow('Unsupported role: admin');
  });

  it('handles missing joined match/stadium data gracefully', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({ data: { id: 'u1', role: 'fan' }, error: null })
        .mockResolvedValueOnce({
          data: { id: 't1', match_id: 'm1', matches: null }, // no joined match data
          error: null
        })
    });

    const data = await bootstrapService.loadAppBootstrapData('u1');
    expect(data.ticket?.id).toBe('t1');
    expect(data.match).toBeNull();
  });
});
