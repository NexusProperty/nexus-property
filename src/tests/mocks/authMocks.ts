import { vi } from 'vitest';
import { Session, User } from '@supabase/supabase-js';
import type { AuthResult } from '@/services/auth';
import * as authService from '@/services/auth';

/**
 * Creates a mock Session object for testing
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: createMockUser(),
    ...overrides
  } as Session;
}

/**
 * Creates a mock User object for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'mock-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    ...overrides
  } as User;
}

/**
 * Setup mock for successful auth service responses
 */
export function setupAuthServiceMocks() {
  // Create mocks for auth service functions
  const mockSession = createMockSession();
  
  // Create spies on the auth service functions
  const signInSpy = vi.spyOn(authService, 'signIn');
  const signOutSpy = vi.spyOn(authService, 'signOut');
  const getSessionSpy = vi.spyOn(authService, 'getSession');
  
  // Reset mocks
  vi.resetAllMocks();
  
  // Setup default successful responses
  signInSpy.mockImplementation(async () => ({
    success: true,
    data: { session: mockSession },
    error: null
  }));
  
  signOutSpy.mockImplementation(async () => ({
    success: true,
    data: null,
    error: null
  }));
  
  getSessionSpy.mockImplementation(async () => ({
    success: true,
    data: mockSession,
    error: null
  }));
  
  return {
    mockSignInFailure: () => {
      signInSpy.mockImplementationOnce(async () => ({
        success: false,
        data: null,
        error: new Error('Invalid login credentials')
      }));
    },
    
    mockSignOutFailure: () => {
      signOutSpy.mockImplementationOnce(async () => ({
        success: false,
        data: null,
        error: new Error('Failed to sign out')
      }));
    },
    
    mockGetSessionFailure: () => {
      getSessionSpy.mockImplementationOnce(async () => ({
        success: false,
        data: null,
        error: new Error('Failed to get session')
      }));
    },
    
    resetMocks: () => {
      vi.resetAllMocks();
      
      // Re-setup default successful responses
      signInSpy.mockImplementation(async () => ({
        success: true,
        data: { session: mockSession },
        error: null
      }));
      
      signOutSpy.mockImplementation(async () => ({
        success: true,
        data: null,
        error: null
      }));
      
      getSessionSpy.mockImplementation(async () => ({
        success: true,
        data: mockSession,
        error: null
      }));
    }
  };
} 