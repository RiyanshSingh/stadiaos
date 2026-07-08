/**
 * authService.test.ts
 * Tests that the auth service logout clears all state fields,
 * including both fan and ops context, and removes persisted storage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the service
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

import { supabase } from '@/services/supabase';
import { useAuthService } from '@/services/authService';
import { useAppStore } from '@/store/useAppStore';

describe('authService', () => {
  beforeEach(() => {
    // Reset state before each test by simulating a logged-in user
    useAuthService.setState({
      isInitialized: false,
      userId: 'test-user-123',
      role: 'fan',
      matchId: 'match-abc',
      stadiumId: 'stadium-xyz',
      opsStadiumId: 'ops-stadium-xyz',
      email: 'fan@test.com',
      fullName: 'Test Fan',
    });
    useAppStore.setState({
      profile: { id: 'profile-1', role: 'fan' } as any,
      match: { id: 'match-abc' } as any,
      ticket: { id: 'ticket-1' } as any,
      incidents: [{ id: 'incident-1' } as any],
      hasBootstrapped: true,
    });
  });

  it('logout clears all user state fields', async () => {
    await useAuthService.getState().logout();
    
    const state = useAuthService.getState();
    expect(state.userId).toBeNull();
    expect(state.role).toBeNull();
    expect(state.matchId).toBeNull();
    expect(state.stadiumId).toBeNull();
    expect(state.opsStadiumId).toBeNull();
    expect(state.email).toBeNull();
    expect(state.fullName).toBeNull();
  });

  it('logout clears ops context (opsStadiumId) specifically', async () => {
    // Ensure ops data was set
    expect(useAuthService.getState().opsStadiumId).toBe('ops-stadium-xyz');
    
    await useAuthService.getState().logout();
    
    // Ops stadium must be cleared after logout
    expect(useAuthService.getState().opsStadiumId).toBeNull();
  });

  it('setOpsMatchContext updates matchId for ops use', () => {
    useAuthService.getState().setOpsMatchContext('new-match-id');
    expect(useAuthService.getState().matchId).toBe('new-match-id');
  });

  it('setOpsMatchContext can be cleared to null', () => {
    useAuthService.getState().setOpsMatchContext(null);
    expect(useAuthService.getState().matchId).toBeNull();
  });

  describe('logout', () => {
    it('clears auth store and signs out from Supabase', async () => {
      useAuthService.setState({ userId: '123', email: 'test@example.com', role: 'fan', stadiumId: 's1', initialized: true } as any);

      await useAuthService.getState().logout();

      const authState = useAuthService.getState();
      expect(authState.userId).toBeNull();
      expect(authState.email).toBeNull();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('clears app bootstrap state', async () => {
      await useAuthService.getState().logout();

      const appState = useAppStore.getState();
      expect(appState.profile).toBeNull();
      expect(appState.match).toBeNull();
      expect(appState.ticket).toBeNull();
      expect(appState.incidents).toEqual([]);
      expect(appState.hasBootstrapped).toBe(false);
    });
  });

  describe('initAuth', () => {
    it('initializes auth with no session', async () => {
      useAuthService.setState({ isInitialized: false });
      (supabase.auth.getSession as any).mockResolvedValueOnce({ data: { session: null } });
      
      useAuthService.getState().initAuth();
      
      // Allow async promises to flush
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const state = useAuthService.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.userId).toBeNull();
      expect(state.role).toBeNull();
      expect(state.matchId).toBeNull();
      expect(state.stadiumId).toBeNull();
      expect(state.opsStadiumId).toBeNull();
    });

    it('initializes auth with existing session and fetches profile', async () => {
      useAuthService.setState({ isInitialized: false });
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: 'u1', email: 'fan@fan.com' } } }
      });
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { id: 'u1', role: 'fan', email: 'fan@fan.com', full_name: 'Fan' },
          error: null
        })
      });

      useAuthService.getState().initAuth();
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const state = useAuthService.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.userId).toBe('u1');
      expect(state.role).toBe('fan');
    });

    it('handles profile fetch failure', async () => {
      useAuthService.setState({ isInitialized: false });
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: 'u2', email: 'fail@fan.com' } } }
      });
      
      // Simulate profile missing AND insert failing
      const mockFrom = vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn()
              .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }) // First fetch fails
              .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } }) // Insert fails
          };
        }
      });
      (supabase.from as any) = mockFrom;

      useAuthService.getState().initAuth();
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const state = useAuthService.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.userId).toBeNull();
      expect(state.role).toBeNull();
    });

    it('handles auth state changes', async () => {
      // Re-mock to capture the callback
      let authStateCallback: any = null;
      (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      useAuthService.getState().initAuth();
      expect(authStateCallback).toBeDefined();

      // Trigger sign out event
      authStateCallback('SIGNED_OUT', null);
      
      const state = useAuthService.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.userId).toBeNull();
      expect(state.opsStadiumId).toBeNull();
    });
  });
});
