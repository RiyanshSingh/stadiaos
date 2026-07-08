import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';
import { describe, it, expect } from 'vitest';

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders navigation items with accessible labels', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /copilot/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
  });

  it('renders exactly 4 navigation links', () => {
    renderNav();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('renders a semantic nav landmark with an accessible label', () => {
    const { container } = renderNav();
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
  });

  it('all nav links have aria-label attributes for screen readers', () => {
    renderNav();
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
