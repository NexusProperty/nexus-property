import { vi } from 'vitest';

// Mock Supabase auth context
export const mockAuthContext = (isAuthenticated = true, userRole = 'agent') => {
  return {
    session: isAuthenticated ? { 
      user: { 
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { role: userRole }
      } 
    } : null,
    user: isAuthenticated ? { 
      id: 'test-user-id',
      email: 'test@example.com',
      role: userRole
    } : null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false,
  };
};

// Helper to wait for promises to resolve
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0)); 
