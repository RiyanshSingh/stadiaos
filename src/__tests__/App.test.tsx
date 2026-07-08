import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const authState = vi.hoisted(() => ({
  current: {
    isInitialized: true,
    userId: null as string | null,
    role: null as 'fan' | 'ops_manager' | null,
    initAuth: vi.fn(),
  },
}));

const appStoreState = vi.hoisted(() => ({
  current: {
    initSupabase: vi.fn(),
    loadBootstrap: vi.fn(),
    profile: null,
    ticket: null,
    hasBootstrapped: false,
  },
}));

vi.mock('@/services/authService', () => ({
  useAuthService: vi.fn(() => authState.current),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector?: any) => {
    if (typeof selector === 'function') return selector(appStoreState.current);
    return appStoreState.current;
  }),
}));

vi.mock('@/components/layout/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/shared/BottomNav', () => ({
  BottomNav: () => <nav aria-label="Bottom navigation" />,
}));

vi.mock('@/components/shared/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/fan/FanDashboard', () => ({
  FanDashboard: () => <div>Fan Dashboard</div>,
}));

vi.mock('@/app/auth/AuthView', () => ({
  AuthView: () => <div>Fan Auth Page</div>,
}));

vi.mock('@/app/auth/OpsAuthView', () => ({
  OpsAuthView: () => <div>Ops Auth Page</div>,
}));

vi.mock('@/app/fan/TicketSetupView', () => ({
  TicketSetupView: () => <div>Ticket Setup Page</div>,
}));

vi.mock('@/app/ops/OpsDashboard', () => ({
  OpsDashboard: () => <div>Ops Dashboard</div>,
}));

describe('App route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    authState.current = {
      isInitialized: true,
      userId: null,
      role: null,
      initAuth: vi.fn(),
    };
    appStoreState.current = {
      initSupabase: vi.fn(),
      loadBootstrap: vi.fn(),
      profile: null,
      ticket: null,
      hasBootstrapped: false,
    };
  });

  it('redirects unauthenticated fan route access to /auth', async () => {
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth');
    });
    expect(await screen.findByText('Fan Auth Page')).toBeInTheDocument();
  });

  it('redirects unauthenticated /ops access to /opsauth', async () => {
    window.history.pushState({}, '', '/ops');

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/opsauth');
    });
    expect(await screen.findByText('Ops Auth Page')).toBeInTheDocument();
  });

  it('prevents a non-ops user from accessing /ops', async () => {
    window.history.pushState({}, '', '/ops');
    authState.current = {
      ...authState.current,
      userId: 'fan-123',
      role: 'fan',
    };

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/opsauth');
    });
    expect(await screen.findByText('Ops Auth Page')).toBeInTheDocument();
  });

  it('shows loading state while auth is not initialized', () => {
    authState.current = {
      ...authState.current,
      isInitialized: false,
    };

    const { container } = render(<App />);

    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    expect(window.location.pathname).toBe('/');
  });
});
