import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentTriageDesk } from '../IncidentTriageDesk';
import { useIncidentService } from '@/services/incidentService';
import { useAuthService } from '@/services/authService';

vi.mock('@/services/incidentService', () => ({
  useIncidentService: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  useAuthService: vi.fn(),
}));

describe('IncidentTriageDesk', () => {
  const mockUpdateIncidentStatus = vi.fn();
  const mockAssignIncidentTeam = vi.fn();
  const mockAddIncidentNote = vi.fn();

  const mockIncidents = [
    {
      id: 'inc-1',
      title: 'Medical Emergency',
      incident_type: 'medical',
      description: 'Location: Section 101 | Needs help',
      severity: 'critical',
      status: 'reported',
      created_at: '2023-01-01T10:00:00Z',
      ai_summary: 'AI says critical',
      assigned_team: null,
    },
    {
      id: 'inc-2',
      title: 'Spill',
      incident_type: 'maintenance',
      description: 'Location: Gate A | Water spill',
      severity: 'low',
      status: 'in_progress',
      created_at: '2023-01-01T10:10:00Z',
      assigned_team: 'medical',
    },
    {
      id: 'inc-3',
      title: 'Resolved Issue',
      incident_type: 'security',
      description: 'Location: Gate B | Resolved',
      severity: 'low',
      status: 'resolved',
      created_at: '2023-01-01T10:20:00Z',
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthService as any).mockReturnValue({
      matchId: 'match-123',
    });
    (useIncidentService as any).mockReturnValue({
      incidents: mockIncidents,
      updateIncidentStatus: mockUpdateIncidentStatus,
      assignIncidentTeam: mockAssignIncidentTeam,
      addIncidentNote: mockAddIncidentNote,
    });
  });

  const renderComponent = () => render(<IncidentTriageDesk />);

  it('renders only active incidents', () => {
    renderComponent();
    expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
    expect(screen.getByText('Spill')).toBeInTheDocument();
    expect(screen.queryByText('Resolved Issue')).not.toBeInTheDocument(); // Filtered out
  });

  it('shows empty state when no active incidents exist', () => {
    (useIncidentService as any).mockReturnValue({
      incidents: [],
      updateIncidentStatus: mockUpdateIncidentStatus,
      assignIncidentTeam: mockAssignIncidentTeam,
      addIncidentNote: mockAddIncidentNote,
    });
    renderComponent();
    expect(screen.getByText('Triage Queue Clear')).toBeInTheDocument();
  });

  it('expands incident to show actions', () => {
    renderComponent();
    
    expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument();
    
    // Click on incident card to expand
    fireEvent.click(screen.getByText('Medical Emergency'));
    
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('AI says critical')).toBeInTheDocument();
  });

  it('calls assignIncidentTeam when assigning a team', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Medical Emergency')); // Expand
    
    const securityBtn = await screen.findByText(/Security/i, { selector: 'button' });
    fireEvent.click(securityBtn);
    expect(mockAssignIncidentTeam).toHaveBeenCalledWith('inc-1', 'security');
  });

  it('calls updateIncidentStatus when changing status to in_progress', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Medical Emergency')); // Expand
    
    const progressBtn = await screen.findByText(/In Progress/i, { selector: 'button' });
    fireEvent.click(progressBtn);
    expect(mockUpdateIncidentStatus).toHaveBeenCalledWith('inc-1', 'reported', 'in_progress');
  });

  it('calls updateIncidentStatus when resolving incident', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Medical Emergency')); // Expand
    
    const resolveBtn = await screen.findByText(/Resolve/i, { selector: 'button' });
    fireEvent.click(resolveBtn);
    expect(mockUpdateIncidentStatus).toHaveBeenCalledWith('inc-1', 'reported', 'resolved');
  });

  it('calls addIncidentNote when submitting a note', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Medical Emergency')); // Expand
    
    const input = screen.getByPlaceholderText('Record an update or action taken...');
    fireEvent.change(input, { target: { value: 'Dispatched security.' } });
    
    const sendButton = screen.getByRole('button', { name: /Send note/i });
    fireEvent.click(sendButton);
    
    expect(mockAddIncidentNote).toHaveBeenCalledWith('inc-1', 'Dispatched security.');
  });
});
