import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useAppStore.setState({
      profile: null,
      match: null,
      ticket: null,
      initialized: false
    });
  });

  it('hydrates state correctly', () => {
    useAppStore.setState({
      profile: { id: 'p1', role: 'fan', full_name: 'John Doe' } as any,
      match: { id: 'm1', stadium_id: 's1', status: 'live', title: 'Test Match' } as any,
      ticket: { id: 't1', match_id: 'm1', user_id: 'u1', seat_section: '100', status: 'active' } as any,
      initialized: true
    });

    const state = useAppStore.getState();
    expect(state.profile?.full_name).toBe('John Doe');
    expect(state.match?.status).toBe('live');
    expect(state.ticket?.seat_section).toBe('100');
    expect(state.initialized).toBe(true);
  });

  it('resets state correctly', () => {
    useAppStore.setState({
      profile: { id: 'p1', role: 'fan', full_name: 'John Doe' } as any,
      initialized: true
    });

    useAppStore.setState({ profile: null, match: null, ticket: null, initialized: false });
    
    const state = useAppStore.getState();
    expect(state.profile).toBeNull();
    expect(state.initialized).toBe(false);
  });
});
