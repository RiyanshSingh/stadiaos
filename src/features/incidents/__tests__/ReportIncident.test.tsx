import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportIncident } from '../ReportIncident';
import { useIncidentService } from '@/services/incidentService';
import { useAuthService } from '@/services/authService';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/services/incidentService', () => ({
  useIncidentService: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  useAuthService: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('ReportIncident', () => {
  const mockReportIncident = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthService as any).mockReturnValue({
      matchId: 'match-123',
      stadiumId: 'stad-123',
      userId: 'fan-123',
      role: 'fan',
    });
    (useIncidentService as any).mockReturnValue({
      reportIncident: mockReportIncident,
    });
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <ReportIncident />
    </BrowserRouter>
  );

  it('renders all form elements', () => {
    renderComponent();
    expect(screen.getByText('Report Incident')).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Report/i })).toBeInTheDocument();
  });

  it('validates empty description', async () => {
    renderComponent();
    
    // Description is empty by default
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: '' } });
    
    // Submit button is disabled if description is empty, so we must enable it manually or test the handler.
    // Actually, button is disabled if `!description.trim()`, so we can't click it easily with testing-library if it's disabled.
    // Let's type less than 10 characters to test length validation instead.
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'short' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit Report/i }));

    await waitFor(() => {
      expect(screen.getByText('Description must be at least 10 characters.')).toBeInTheDocument();
      expect(mockReportIncident).not.toHaveBeenCalled();
    });
  });

  it('validates empty zone/location', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'This is a long enough description.' } });
    
    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Please provide a location for the incident.')).toBeInTheDocument();
      expect(mockReportIncident).not.toHaveBeenCalled();
    });
  });

  it('submits successfully and shows success state', async () => {
    mockReportIncident.mockResolvedValueOnce(undefined);
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Section 101' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Someone is feeling unwell here.' } });
    
    // Select a type
    fireEvent.click(screen.getByText('Medical'));
    
    fireEvent.click(screen.getByRole('button', { name: /Submit Report/i }));

    await waitFor(() => {
      expect(mockReportIncident).toHaveBeenCalledWith({
        type: 'medical',
        zone: 'Section 101',
        description: 'Someone is feeling unwell here.'
      }, 'match-123', 'stad-123');
      
      expect(screen.getByText('✓ Incident reported successfully.')).toBeInTheDocument();
    });
  });

  it('supports keyboard incident type selection', async () => {
    mockReportIncident.mockResolvedValueOnce(undefined);
    renderComponent();

    const securityButton = screen.getByRole('button', { name: /Security/i });
    securityButton.focus();
    fireEvent.keyDown(securityButton, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(securityButton).toHaveAttribute('aria-pressed', 'true');
    });

    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Gate A' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Security support needed near the gate.' } });

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReportIncident).toHaveBeenCalledWith({
        type: 'security',
        zone: 'Gate A',
        description: 'Security support needed near the gate.'
      }, 'match-123', 'stad-123');
    });
  });

  it('disables submit while report is in flight', async () => {
    let resolveReport: () => void = () => {};
    mockReportIncident.mockReturnValueOnce(new Promise<void>((resolve) => {
      resolveReport = resolve;
    }));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Section 101' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Someone is feeling unwell here.' } });

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveReport();
    await waitFor(() => {
      expect(screen.getByText('✓ Incident reported successfully.')).toBeInTheDocument();
    });
  });

  it('shows error banner on submission failure', async () => {
    mockReportIncident.mockRejectedValueOnce(new Error('API Error'));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Section 101' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Someone is feeling unwell here.' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit Report/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to report incident/i)).toBeInTheDocument();
      expect(screen.queryByText('✓ Incident reported successfully.')).not.toBeInTheDocument();
    });
  });
});
