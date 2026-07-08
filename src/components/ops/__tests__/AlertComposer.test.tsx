import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertComposer } from '../AlertComposer';
import { opsService } from '@/services/opsService';
import { useAuthService } from '@/services/authService';

vi.mock('@/services/opsService', () => ({
  opsService: {
    publishPublicAdvisory: vi.fn(),
  },
}));

vi.mock('@/services/authService', () => ({
  useAuthService: vi.fn(),
}));

describe('AlertComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthService as any).mockReturnValue({
      matchId: 'match-123',
      opsStadiumId: 'stad-123',
    });
  });

  const renderComponent = () => render(<AlertComposer />);

  it('renders correctly and submit is disabled initially', () => {
    renderComponent();
    expect(screen.getByText('Public Advisory Broadcast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Broadcast Advisory/i })).toBeDisabled();
  });

  it('enables submit when title and content are provided', () => {
    renderComponent();
    
    const titleInput = screen.getByLabelText(/Headline/i);
    const contentInput = screen.getByLabelText(/Message/i);
    const submitBtn = screen.getByRole('button', { name: /Broadcast Advisory/i });

    fireEvent.change(titleInput, { target: { value: 'Delays' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(contentInput, { target: { value: 'There are some delays at Gate A.' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls publishPublicAdvisory and resets state on success', async () => {
    (opsService.publishPublicAdvisory as any).mockResolvedValueOnce(undefined);
    renderComponent();
    
    const titleInput = screen.getByLabelText(/Headline/i);
    const contentInput = screen.getByLabelText(/Message/i);
    const submitBtn = screen.getByRole('button', { name: /Broadcast Advisory/i });

    fireEvent.change(titleInput, { target: { value: 'Delays' } });
    fireEvent.change(contentInput, { target: { value: 'Gate A delays.' } });
    
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled(); // Disabled while publishing

    await waitFor(() => {
      expect(opsService.publishPublicAdvisory).toHaveBeenCalledWith('match-123', 'stad-123', 'Delays', 'Gate A delays.');
      expect(screen.getByText('Broadcast Sent')).toBeInTheDocument();
    });

    // Verify inputs were reset
    expect(titleInput).toHaveValue('');
    expect(contentInput).toHaveValue('');
  });

  it('shows error banner on failure', async () => {
    (opsService.publishPublicAdvisory as any).mockRejectedValueOnce(new Error('Publish failed!'));
    renderComponent();
    
    const titleInput = screen.getByLabelText(/Headline/i);
    const contentInput = screen.getByLabelText(/Message/i);
    const submitBtn = screen.getByRole('button', { name: /Broadcast Advisory/i });

    fireEvent.change(titleInput, { target: { value: 'Delays' } });
    fireEvent.change(contentInput, { target: { value: 'Gate A delays.' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Publish failed!')).toBeInTheDocument();
    });
    
    // Inputs should NOT be reset on error
    expect(titleInput).toHaveValue('Delays');
  });
});
