import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';

// Mock the AuthContext hook
vi.mock('@/contexts/AuthContext');

// Don't mock react-router-dom as we need to use the actual components
// Just mock the useLocation hook separately
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn().mockReturnValue({ pathname: '/protected' }),
  };
});

// Test components
const DashboardComponent = () => <div data-testid="dashboard">Dashboard Content</div>;
const UnauthorizedComponent = () => <div data-testid="unauthorized">Unauthorized Content</div>;
const LoginComponent = () => <div data-testid="login">Login Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading spinner when authentication is in progress', () => {
    // Mock loading state
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      profile: null,
      session: null,
      user: null,
      isAuthenticating: false,
      isLoadingProfile: false,
      error: null,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      refreshAuthToken: vi.fn().mockResolvedValue(true),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      profile: null,
      session: null,
      user: null,
      isAuthenticating: false,
      isLoadingProfile: false,
      error: null,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      refreshAuthToken: vi.fn().mockResolvedValue(true),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to login page
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('renders outlet when user is authenticated with no role requirement', () => {
    // Mock authenticated state
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      profile: {
        id: 'profile-id',
        user_id: 'user-id',
        full_name: 'Test User',
        role: 'agent',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        email: 'test@example.com',
        avatar_url: '',
        phone: '',
        organization: '',
        settings: {},
      },
      session: {} as any,
      user: {} as any,
      isAuthenticating: false,
      isLoadingProfile: false,
      error: null,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      refreshAuthToken: vi.fn().mockResolvedValue(true),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />}>
            <Route index element={<DashboardComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Should render the dashboard component (outlet)
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('renders outlet when user is authenticated with matching role', () => {
    // Mock authenticated state with agent role
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      profile: {
        id: 'profile-id',
        user_id: 'user-id',
        full_name: 'Test User',
        role: 'agent',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        email: 'test@example.com',
        avatar_url: '',
        phone: '',
        organization: '',
        settings: {},
      },
      session: {} as any,
      user: {} as any,
      isAuthenticating: false,
      isLoadingProfile: false,
      error: null,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      refreshAuthToken: vi.fn().mockResolvedValue(true),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute requiredRole="agent" />}>
            <Route index element={<DashboardComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Should render the dashboard component (outlet) since roles match
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('redirects to unauthorized when user has incorrect role', () => {
    // Mock authenticated state with customer role
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      profile: {
        id: 'profile-id',
        user_id: 'user-id',
        full_name: 'Test User',
        role: 'customer',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        email: 'test@example.com',
        avatar_url: '',
        phone: '',
        organization: '',
        settings: {},
      },
      session: {} as any,
      user: {} as any,
      isAuthenticating: false,
      isLoadingProfile: false,
      error: null,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      refreshAuthToken: vi.fn().mockResolvedValue(true),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedComponent />} />
          <Route path="/protected" element={<ProtectedRoute requiredRole="admin" />}>
            <Route index element={<DashboardComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to unauthorized page since roles don't match
    expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
  });
}); 