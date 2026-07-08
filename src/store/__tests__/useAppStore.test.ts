import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/supabase', () => {
  const from = vi.fn();
  const getChannels = vi.fn();
  const channel = vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) }));
  return {
    supabase: {
      from,
      getChannels,
      channel,
    },
  };
});

vi.mock('@/services/bootstrapService', () => ({
  bootstrapService: {
    loadAppBootstrapData: vi.fn(),
  },
}));

vi.mock('@/services/triageService', () => ({
  triageService: {
    analyzeIncident: vi.fn(),
  },
}));

import { useAppStore } from '../useAppStore';
import { supabase } from '@/services/supabase';
import { bootstrapService } from '@/services/bootstrapService';
import { triageService } from '@/services/triageService';

describe('useAppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      profile: null,
      match: null,
      ticket: null,
      hasBootstrapped: false,
      incidents: [],
      accessibleRouting: false,
    });
  });

  it('hydrates state correctly', () => {
    useAppStore.setState({
      profile: { id: 'p1', role: 'fan', full_name: 'John Doe' } as any,
      match: { id: 'm1', stadium_id: 's1', status: 'live', title: 'Test Match' } as any,
      ticket: { id: 't1', match_id: 'm1', user_id: 'u1', seat_section: '100', status: 'active' } as any,
      hasBootstrapped: true
    });

    const state = useAppStore.getState();
    expect(state.profile?.full_name).toBe('John Doe');
    expect(state.match?.status).toBe('live');
    expect(state.ticket?.seat_section).toBe('100');
    expect(state.hasBootstrapped).toBe(true);
  });

  it('resets state correctly', () => {
    useAppStore.setState({
      profile: { id: 'p1', role: 'fan', full_name: 'John Doe' } as any,
      hasBootstrapped: true
    });

    useAppStore.setState({ profile: null, match: null, ticket: null, hasBootstrapped: false });
    
    const state = useAppStore.getState();
    expect(state.profile).toBeNull();
    expect(state.hasBootstrapped).toBe(false);
  });

  it('toggles accessible routing', () => {
    useAppStore.setState({ accessibleRouting: false });
    useAppStore.getState().toggleAccessibleRouting();
    expect(useAppStore.getState().accessibleRouting).toBe(true);
    useAppStore.getState().toggleAccessibleRouting();
    expect(useAppStore.getState().accessibleRouting).toBe(false);
  });

  it('logout resets profile, match, ticket, incidents, hasBootstrapped', () => {
    useAppStore.setState({
      profile: { id: 'p1' } as any,
      match: { id: 'm1' } as any,
      ticket: { id: 't1' } as any,
      incidents: [{ id: 'i1' } as any],
      hasBootstrapped: true
    });
    
    useAppStore.getState().logout();
    const state = useAppStore.getState();
    expect(state.profile).toBeNull();
    expect(state.match).toBeNull();
    expect(state.ticket).toBeNull();
    expect(state.incidents).toEqual([]);
    expect(state.hasBootstrapped).toBe(false);
  });

  it('does not update bootstrap when no data is returned', async () => {
    vi.mocked(bootstrapService.loadAppBootstrapData).mockResolvedValue(null as any);

    await useAppStore.getState().loadBootstrap('u1');

    const state = useAppStore.getState();
    expect(state.profile).toBeNull();
    expect(state.hasBootstrapped).toBe(false);
  });

  it('loads bootstrap data when service returns data', async () => {
    vi.mocked(bootstrapService.loadAppBootstrapData).mockResolvedValue({
      profile: { id: 'u1', role: 'fan' } as any,
      match: { id: 'm1', stadium_id: 's1' } as any,
      ticket: { id: 't1', match_id: 'm1' } as any,
    } as any);

    await useAppStore.getState().loadBootstrap('u1');

    const state = useAppStore.getState();
    expect(state.profile?.id).toBe('u1');
    expect(state.match?.id).toBe('m1');
    expect(state.ticket?.id).toBe('t1');
    expect(state.hasBootstrapped).toBe(true);
  });

  it('reportIncident exits early when app context is missing', async () => {
    await useAppStore.getState().reportIncident({
      type: 'spill',
      zone: 'A1',
      description: 'Wet step',
      severity: 'low'
    });

    expect(useAppStore.getState().incidents).toEqual([]);
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
  });

  it('adds an incident and inserts into Supabase when context is present', async () => {
    useAppStore.setState({
      profile: { id: 'u1' } as any,
      match: { id: 'm1', stadium_id: 's1' } as any,
      ticket: { id: 't1' } as any,
      incidents: []
    });

    vi.mocked(triageService.analyzeIncident).mockResolvedValue({
      summary: 'Safe',
      action: 'Monitor',
      severity: 'high'
    } as any);

    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ insert } as any);

    await useAppStore.getState().reportIncident({
      type: 'spill',
      zone: 'A1',
      description: 'Wet step',
      severity: 'low'
    });

    expect(useAppStore.getState().incidents).toHaveLength(1);
    expect(insert).toHaveBeenCalled();
    expect(useAppStore.getState().incidents[0].severity).toBe('high');
  });

  it('logs when incident insert returns an error', async () => {
    useAppStore.setState({
      profile: { id: 'u1' } as any,
      match: { id: 'm1', stadium_id: 's1' } as any,
      ticket: { id: 't1' } as any,
      incidents: []
    });

    vi.mocked(triageService.analyzeIncident).mockResolvedValue({
      summary: 'Safe',
      action: 'Monitor',
      severity: 'low'
    } as any);

    const insert = vi.fn().mockResolvedValue({ error: { message: 'fail' } });
    vi.mocked(supabase.from).mockReturnValue({ insert } as any);

    await useAppStore.getState().reportIncident({
      type: 'spill',
      zone: 'B2',
      description: 'Wet step',
      severity: 'low'
    });

    expect(useAppStore.getState().incidents).toHaveLength(1);
    expect(insert).toHaveBeenCalled();
  });

  it('resolves an incident and updates Supabase', async () => {
    useAppStore.setState({
      incidents: [{ id: 'i1', type: 'spill', severity: 'low', description: 'x', status: 'reported', zone: 'A1', timestamp: new Date() } as any]
    });

    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq } as any);
    vi.mocked(supabase.from).mockReturnValue({ update } as any);

    await useAppStore.getState().resolveIncident('i1');

    expect(useAppStore.getState().incidents[0].status).toBe('resolved');
    expect(update).toHaveBeenCalledWith({ status: 'resolved' });
    expect(eq).toHaveBeenCalledWith('id', 'i1');
  });

  it('does nothing when resolveIncident is called without an id', async () => {
    await useAppStore.getState().resolveIncident('');
    expect(useAppStore.getState().incidents).toEqual([]);
  });

  it('initializes Supabase and registers a subscription when no channel exists', async () => {
    const row = {
      id: 'i2',
      incident_type: 'spill',
      reported_by: 'u1',
      description: 'Location: A1 | Wet step',
      severity: 'low',
      status: 'reported',
      created_at: new Date().toISOString(),
      ai_summary: 'summary',
      ai_recommended_actions: { action: 'check' }
    };

    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    const neq = vi.fn().mockReturnValue({ order } as any);
    const select = vi.fn().mockReturnValue({ neq } as any);
    vi.mocked(supabase.from).mockReturnValue({ select } as any);
    vi.mocked(supabase.getChannels).mockReturnValue([] as any);

    const subscribe = vi.fn();
    const on = vi.fn(() => ({ subscribe }));
    vi.mocked(supabase.channel).mockReturnValue({ on } as any);

    await useAppStore.getState().initSupabase();

    expect(useAppStore.getState().incidents).toHaveLength(1);
    expect(on).toHaveBeenCalled();
  });

  it('does not subscribe when a channel already exists', async () => {
    const row = {
      id: 'i3',
      incident_type: 'spill',
      reported_by: 'u1',
      description: 'Location: A1 | Wet step',
      severity: 'low',
      status: 'reported',
      created_at: new Date().toISOString(),
      ai_summary: 'summary',
      ai_recommended_actions: { action: 'check' }
    };

    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    const neq = vi.fn().mockReturnValue({ order } as any);
    const select = vi.fn().mockReturnValue({ neq } as any);
    vi.mocked(supabase.from).mockReturnValue({ select } as any);
    vi.mocked(supabase.getChannels).mockReturnValue([{ topic: 'realtime:appstore_incidents_channel' }] as any);

    const on = vi.fn(() => ({ subscribe: vi.fn() }));
    vi.mocked(supabase.channel).mockReturnValue({ on } as any);

    await useAppStore.getState().initSupabase();

    expect(on).not.toHaveBeenCalled();
  });

  it('calls the realtime subscription callback when child event fires', async () => {
    const row = {
      id: 'i4',
      incident_type: 'spill',
      reported_by: 'u1',
      description: 'Location: A1 | Wet step',
      severity: 'low',
      status: 'reported',
      created_at: new Date().toISOString(),
      ai_summary: 'summary',
      ai_recommended_actions: { action: 'check' }
    };

    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    const neq = vi.fn().mockReturnValue({ order } as any);
    const select = vi.fn().mockReturnValue({ neq } as any);
    vi.mocked(supabase.from).mockReturnValue({ select } as any);
    vi.mocked(supabase.getChannels).mockReturnValue([] as any);

    let callback: () => Promise<void> = async () => {};
    const subscribe = vi.fn();
    const on = vi.fn((_event, _filter, cb) => {
      callback = cb as () => Promise<void>;
      return { subscribe };
    });
    vi.mocked(supabase.channel).mockReturnValue({ on } as any);

    await useAppStore.getState().initSupabase();
    await callback();

    expect(useAppStore.getState().incidents).toHaveLength(1);
    expect(on).toHaveBeenCalled();
  });

  it('handles reportIncident when triage analysis throws', async () => {
    useAppStore.setState({
      profile: { id: 'u1' } as any,
      match: { id: 'm1', stadium_id: 's1' } as any,
      ticket: { id: 't1' } as any,
      incidents: []
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(triageService.analyzeIncident).mockRejectedValue(new Error('AI failure'));

    await useAppStore.getState().reportIncident({
      type: 'spill',
      zone: 'A1',
      description: 'Wet step',
      severity: 'low'
    });

    expect(useAppStore.getState().incidents).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Supabase Error:', expect.any(Error));
  });

  it('logs Supabase insert error during reportIncident', async () => {
    useAppStore.setState({
      profile: { id: 'u1' } as any,
      match: { id: 'm1', stadium_id: 's1' } as any,
      ticket: { id: 't1' } as any,
      incidents: []
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(triageService.analyzeIncident).mockResolvedValue({
      summary: 'Safe',
      action: 'Monitor',
      severity: 'low'
    } as any);

    const insert = vi.fn().mockResolvedValue({ error: { message: 'fail' } });
    vi.mocked(supabase.from).mockReturnValue({ insert } as any);

    await useAppStore.getState().reportIncident({
      type: 'spill',
      zone: 'B2',
      description: 'Wet step',
      severity: 'low'
    });

    expect(useAppStore.getState().incidents).toHaveLength(1);
    expect(insert).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Supabase insert error:', { message: 'fail' });
  });

  it('handles resolveIncident when update fails', async () => {
    useAppStore.setState({
      incidents: [{ id: 'i1', type: 'spill', severity: 'low', description: 'x', status: 'reported', zone: 'A1', timestamp: new Date() } as any]
    });

    const eq = vi.fn().mockRejectedValue(new Error('update failed'));
    const update = vi.fn().mockReturnValue({ eq } as any);
    vi.mocked(supabase.from).mockReturnValue({ update } as any);

    await useAppStore.getState().resolveIncident('i1');

    expect(useAppStore.getState().incidents[0].status).toBe('resolved');
    expect(update).toHaveBeenCalled();
  });

  it('handles initSupabase when fetchActiveIncidents returns error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const neq = vi.fn().mockReturnValue({ order } as any);
    const select = vi.fn().mockReturnValue({ neq } as any);
    vi.mocked(supabase.from).mockReturnValue({ select } as any);
    vi.mocked(supabase.getChannels).mockReturnValue([] as any);

    const subscribe = vi.fn();
    const on = vi.fn(() => ({ subscribe }));
    vi.mocked(supabase.channel).mockReturnValue({ on } as any);

    await useAppStore.getState().initSupabase();

    expect(useAppStore.getState().incidents).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Failed to load active incidents', { message: 'fail' });
  });

  it('handles initSupabase when fetchActiveIncidents throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(supabase.from).mockImplementation(() => { throw new Error('fail'); });
    vi.mocked(supabase.getChannels).mockReturnValue([] as any);

    await expect(useAppStore.getState().initSupabase()).resolves.not.toThrow();
    expect(console.error).toHaveBeenCalledWith('Failed to init Supabase', expect.any(Error));
  });

  it('updates messages when addMessage is called', () => {
    useAppStore.getState().addMessage({ role: 'user', content: 'Hello' });
    expect(useAppStore.getState().messages).toHaveLength(1);
  });
});
