import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketSetupView } from '../TicketSetupView';
import { useAuthService } from '@/services/authService';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/services/supabase';
import { validateTicketData } from '@/lib/ticketValidation';
import { requireFanSession } from '@/lib/authGuards';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/services/authService', () => ({
  useAuthService: vi.fn(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/ticketValidation', () => ({
  validateTicketData: vi.fn(),
}));

vi.mock('@/lib/authGuards', () => ({
  requireFanSession: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('TicketSetupView', () => {
  const mockLoadBootstrap = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthService as any).mockReturnValue({
      userId: 'fan-123',
      role: 'fan',
    });
    (useAppStore as any).mockReturnValue(mockLoadBootstrap);
    // Specifically mock useAppStore.setState for the success path
    (useAppStore as any).setState = vi.fn();
    (requireFanSession as any).mockResolvedValue('fan-123');
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <TicketSetupView />
    </BrowserRouter>
  );

  it('renders stadium list initially', () => {
    renderComponent();
    expect(screen.getByText('Select Stadium')).toBeInTheDocument();
    expect(screen.getByText('Wembley Stadium')).toBeInTheDocument();
  });

  it('redirects ops_manager to /ops', () => {
    (useAuthService as any).mockReturnValue({
      userId: 'ops-123',
      role: 'ops_manager',
    });
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/ops', { replace: true });
  });

  it('handles dependency flow: stadium -> section -> row -> seat', async () => {
    renderComponent();
    
    // Select stadium
    fireEvent.click(screen.getByText('Wembley Stadium'));
    
    // Step 2 should be active
    await waitFor(() => {
      expect(screen.getByText('Enter Seat Details')).toBeInTheDocument();
    });
    expect(screen.getByText('Wembley Stadium')).toBeInTheDocument();

    const sectionSelect = screen.getByLabelText(/Section/i);
    const rowSelect = screen.getByLabelText(/Row/i);
    const seatSelect = screen.getByLabelText(/Seat/i);

    expect(rowSelect).toBeDisabled();
    expect(seatSelect).toBeDisabled();

    // Select section
    fireEvent.change(sectionSelect, { target: { value: 'N101' } });
    expect(rowSelect).not.toBeDisabled();
    expect(seatSelect).toBeDisabled(); // Still disabled because row is empty

    // Select row
    fireEvent.change(rowSelect, { target: { value: 'A' } });
    expect(seatSelect).not.toBeDisabled();
    
    // Select seat
    fireEvent.change(seatSelect, { target: { value: '1' } });
    expect(seatSelect).toHaveValue('1');
  });

  it('shows error on invalid combination (validation failure)', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Wembley Stadium'));
    
    (validateTicketData as any).mockImplementationOnce(() => {
      throw new Error('Invalid seat configuration');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Section/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Section/i), { target: { value: 'N101' } });
    fireEvent.change(screen.getByLabelText(/Row/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Seat/i), { target: { value: '1' } });

    fireEvent.submit(screen.getByRole('button', { name: /Save & Enter App/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid seat configuration')).toBeInTheDocument();
    });
  });

  it('shows guard error and does not write when fan session is missing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (requireFanSession as any).mockRejectedValueOnce(new Error('Unauthorized'));

    renderComponent();
    fireEvent.click(screen.getByText('Wembley Stadium'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Section/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Section/i), { target: { value: 'N101' } });
    fireEvent.change(screen.getByLabelText(/Row/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Seat/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /Save & Enter App/i }));

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
    expect(supabase.from).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('saves ticket successfully and navigates to dashboard', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Wembley Stadium'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Section/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Section/i), { target: { value: 'N101' } });
    fireEvent.change(screen.getByLabelText(/Row/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Seat/i), { target: { value: '1' } });

    // Mock DB calls
    const mockSelectStadium = vi.fn().mockReturnThis();
    const mockEqStadium = vi.fn().mockResolvedValue({ data: [{ id: 'stad-1' }] });
    
    const mockSelectMatch = vi.fn().mockReturnThis();
    const mockEqMatch = vi.fn().mockReturnThis();
    const mockOrderMatch = vi.fn().mockResolvedValue({ data: [{ id: 'match-1' }] });

    const mockInsertTicket = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'stadiums') return { select: mockSelectStadium, eq: mockEqStadium };
      if (table === 'matches') return { select: mockSelectMatch, eq: mockEqMatch, order: mockOrderMatch };
      if (table === 'tickets') return { insert: mockInsertTicket };
      return {};
    });

    fireEvent.submit(screen.getByRole('button', { name: /Save & Enter App/i }));

    await waitFor(() => {
      expect(mockInsertTicket).toHaveBeenCalledWith([expect.objectContaining({
        user_id: 'fan-123',
        match_id: 'match-1',
        seat_section: 'N101',
        seat_row: 'A',
        seat_number: '1',
      })]);
      expect(mockLoadBootstrap).toHaveBeenCalledWith('fan-123');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('disables submit while saving', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Wembley Stadium'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Section/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Section/i), { target: { value: 'N101' } });
    fireEvent.change(screen.getByLabelText(/Row/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Seat/i), { target: { value: '1' } });

    let resolveInsert: (value: { error: null }) => void = () => {};
    const insertPromise = new Promise<{ error: null }>((resolve) => {
      resolveInsert = resolve;
    });
    const mockSelectStadium = vi.fn().mockReturnThis();
    const mockEqStadium = vi.fn().mockResolvedValue({ data: [{ id: 'stad-1' }] });
    const mockSelectMatch = vi.fn().mockReturnThis();
    const mockEqMatch = vi.fn().mockReturnThis();
    const mockOrderMatch = vi.fn().mockResolvedValue({ data: [{ id: 'match-1' }] });
    const mockInsertTicket = vi.fn().mockReturnValue(insertPromise);

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'stadiums') return { select: mockSelectStadium, eq: mockEqStadium };
      if (table === 'matches') return { select: mockSelectMatch, eq: mockEqMatch, order: mockOrderMatch };
      if (table === 'tickets') return { insert: mockInsertTicket };
      return {};
    });

    const submitButton = screen.getByRole('button', { name: /Save & Enter App/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveInsert({ error: null });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('shows error on save failure', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Wembley Stadium'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Section/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Section/i), { target: { value: 'N101' } });
    fireEvent.change(screen.getByLabelText(/Row/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Seat/i), { target: { value: '1' } });

    const mockSelectStadium = vi.fn().mockReturnThis();
    const mockEqStadium = vi.fn().mockResolvedValue({ data: [{ id: 'stad-1' }] });
    const mockSelectMatch = vi.fn().mockReturnThis();
    const mockEqMatch = vi.fn().mockReturnThis();
    const mockOrderMatch = vi.fn().mockResolvedValue({ data: [{ id: 'match-1' }] });
    
    const mockInsertTicket = vi.fn().mockResolvedValue({ error: new Error('DB Insert Failed') });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'stadiums') return { select: mockSelectStadium, eq: mockEqStadium };
      if (table === 'matches') return { select: mockSelectMatch, eq: mockEqMatch, order: mockOrderMatch };
      if (table === 'tickets') return { insert: mockInsertTicket };
      return {};
    });

    fireEvent.submit(screen.getByRole('button', { name: /Save & Enter App/i }));

    await waitFor(() => {
      expect(screen.getByText('DB Insert Failed')).toBeInTheDocument();
    });
  });
});
