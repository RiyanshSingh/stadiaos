import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuthenticatedUser, requireFanSession, requireOpsSession, requireActiveTicketContext } from '../authGuards';
import { supabase } from '@/services/supabase';

vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('authGuards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuthenticatedUser', () => {
    it('should throw an error if no user is authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as any);
      await expect(requireAuthenticatedUser()).rejects.toThrow('Unauthorized: Authentication required.');
    });

    it('should return the userId if authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      await expect(requireAuthenticatedUser()).resolves.toBe('user123');
    });
  });

  describe('requireFanSession', () => {
    it('should throw an error if user is not a fan', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'ops_manager' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      
      await expect(requireFanSession()).rejects.toThrow('Forbidden: Fan role required.');
    });

    it('should return the userId if user is a fan', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'fan' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      
      await expect(requireFanSession()).resolves.toBe('user123');
    });

    it('should throw an error if profile is missing', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      const mockSingle = vi.fn().mockResolvedValue({ data: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      
      await expect(requireFanSession()).rejects.toThrow('Forbidden: Fan role required.');
    });
  });

  describe('requireOpsSession', () => {
    it('should throw an error if user is not an ops manager', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'fan' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      
      await expect(requireOpsSession()).rejects.toThrow('Forbidden: Ops manager role required.');
    });

    it('should return the userId if user is an ops manager', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'ops_manager' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      
      await expect(requireOpsSession()).resolves.toBe('user123');
    });

    it('should throw an error if profile is missing', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user123' } }, error: null } as any);
      const mockSingle = vi.fn().mockResolvedValue({ data: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      
      await expect(requireOpsSession()).rejects.toThrow('Forbidden: Ops manager role required.');
    });
  });

  describe('requireActiveTicketContext', () => {
    it('should throw an error if ticket context is incomplete', () => {
      expect(() => requireActiveTicketContext(null, {}, {})).toThrow('Forbidden: Active ticket context required.');
      expect(() => requireActiveTicketContext({}, null, {})).toThrow('Forbidden: Active ticket context required.');
    });

    it('should return the context if valid', () => {
      const context = requireActiveTicketContext({ id: 1 }, { id: 2 }, { id: 3 });
      expect(context.ticket.id).toBe(1);
    });
  });
});
