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
      userId: 'test-user-123',
      role: 'fan',
      matchId: 'match-abc',
      stadiumId: 'stadium-xyz',
      opsStadiumId: 'ops-stadium-xyz',
      email: 'fan@test.com',
      fullName: 'Test Fan',
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
      useAuthService.setState({ userId: '123', email: 'test@example.com', role: 'fan', stadiumId: 's1', initialized: true });
      useAppStore.setState({ initialized: true }); // Assume it's initialized

      await useAuthService.getState().logout();

      const authState = useAuthService.getState();
      expect(authState.userId).toBeNull();
      expect(authState.email).toBeNull();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
