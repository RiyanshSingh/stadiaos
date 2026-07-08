import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';
import { describe, it, expect } from 'vitest';

describe('BottomNav', () => {
  it('renders navigation items correctly', () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /copilot/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
  });
});
