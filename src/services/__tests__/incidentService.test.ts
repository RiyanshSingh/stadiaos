import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIncidentService } from '../incidentService';
import { supabase } from '../supabase';

vi.mock('@/lib/authGuards', () => ({
  requireOpsSession: vi.fn().mockResolvedValue('ops-123'),
  requireFanSession: vi.fn().mockResolvedValue('fan-123'),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
    getChannels: vi.fn().mockReturnValue([]),
    channel: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  },
}));

vi.mock('../triageService', () => ({
  triageService: {
    analyzeIncident: vi.fn().mockResolvedValue({ severity: 'high', summary: 'AI summary' })
  }
}));

describe('incidentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIncidentService.setState({ incidents: [
      { id: '1', status: 'reported', assigned_team: null } as any
    ] });
  });

  it('updateIncidentStatus updates state and calls supabase', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'incidents') return { update: mockUpdate, eq: mockEq };
      if (table === 'incident_updates') return { insert: mockInsert };
      return {};
    });

    const { updateIncidentStatus } = useIncidentService.getState();
    await updateIncidentStatus('1', 'reported', 'in_progress');

    // State updated optimistically
    expect(useIncidentService.getState().incidents[0].status).toBe('in_progress');

    // Supabase called correctly
    expect(supabase.from).toHaveBeenCalledWith('incidents');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_progress' });
    expect(mockEq).toHaveBeenCalledWith('id', '1');

    expect(supabase.from).toHaveBeenCalledWith('incident_updates');
    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
      incident_id: '1',
      old_status: 'reported',
      new_status: 'in_progress'
    })]);
  });

  it('assignIncidentTeam updates state and logs update', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'incidents') return { update: mockUpdate, eq: mockEq };
      if (table === 'incident_updates') return { insert: mockInsert };
      return {};
    });

    const { assignIncidentTeam } = useIncidentService.getState();
    await assignIncidentTeam('1', 'medical');

    expect(useIncidentService.getState().incidents[0].assigned_team).toBe('medical');

    expect(mockUpdate).toHaveBeenCalledWith({ assigned_team: 'medical' });
    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
      incident_id: '1',
      note: 'Assigned to team: medical'
    })]);
  });
});
