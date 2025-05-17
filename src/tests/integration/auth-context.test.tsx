import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services/auth';
import * as userService from '@/services/user';

// Mock the auth service
vi.mock('@/services/auth', () => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

// Mock the user service
vi.mock('@/services/user', () => ({
  getProfile: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'test-profile-id',
      user_id: 'test-user-id',
      full_name: 'Test User',
      role: 'agent',
    },
    error: null,
  }),
}));

// Mock session handler
vi.mock('@/lib/session-handler', () => ({
  initializeSessionHandler: vi.fn().mockResolvedValue(undefined),
  stopTokenRefreshInterval: vi.fn(),
  manualTokenRefresh: vi.fn().mockResolvedValue(true),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div data-testid="user-email">
          {user.email}
        </div>
      )}
      {profile && (
        <div data-testid="profile-name">
          {profile.full_name}
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    vi.mocked(authService.getSession).mockResolvedValue({
      success: false,
      data: null,
      error: null,
    });
    
    vi.mocked(authService.getUser).mockResolvedValue({
      data: {
        user: null,
      },
    });
    
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });
  
  it('should show unauthenticated state initially', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // User email and profile name should not be present
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-name')).not.toBeInTheDocument();
  });
  
  it('should show authenticated state when session exists', async () => {
    // Mock authenticated session
    vi.mocked(authService.getSession).mockResolvedValue({
      success: true,
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      } as import('@supabase/supabase-js').Session,
      error: null,
    });
    
    vi.mocked(authService.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        } as import('@supabase/supabase-js').User,
      },
    });
    
    // Explicitly mock the user profile service
    vi.mocked(userService.getProfile).mockResolvedValue({
      success: true,
      data: {
        id: 'test-profile-id',
        user_id: 'test-user-id',
        full_name: 'Test User',
        role: 'agent',
      },
      error: null,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    
    // User email should be present
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    
    // Wait for profile to load and check if profile name is present
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
    }, { timeout: 2000 });
  });
}); 