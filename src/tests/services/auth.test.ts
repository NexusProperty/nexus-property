import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '@/services/auth';
import { supabase } from '@/lib/supabase';

// Mock the entire supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        getUser: vi.fn(),
        refreshSession: vi.fn(),
      },
    },
  };
});

// Mock for CSRF token refresh
vi.mock('@/lib/csrf', () => ({
  refreshCsrfToken: vi.fn(() => Promise.resolve()),
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('signIn', () => {
    it('should call Supabase signInWithPassword with correct parameters', async () => {
      // Set up the mock using type assertion
      const mockAuthResponse = {
        data: { 
          user: { id: 'test-user-id' }, 
          session: { access_token: 'test-token' } 
        },
        error: null,
      };
      
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => 
        Promise.resolve(mockAuthResponse)
      );
      
      const email = 'test@example.com';
      const password = 'password123';
      
      const result = await authService.signIn(email, password);
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('should handle sign in failure', async () => {
      // Set up the mock using type assertion
      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      };
      
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => 
        Promise.resolve(mockAuthResponse)
      );
      
      const result = await authService.signIn('wrong@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
  
  describe('signOut', () => {
    it('should call Supabase signOut and return success', async () => {
      const mockResponse = {
        error: null,
      };
      
      vi.mocked(supabase.auth.signOut).mockImplementation(() => 
        Promise.resolve(mockResponse)
      );
      
      const result = await authService.signOut();
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('should handle sign out failure', async () => {
      const mockResponse = {
        error: { message: 'Failed to sign out' },
      };
      
      vi.mocked(supabase.auth.signOut).mockImplementation(() => 
        Promise.resolve(mockResponse)
      );
      
      const result = await authService.signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should call Supabase getSession and return session data', async () => {
      const mockResponse = {
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      };
      
      vi.mocked(supabase.auth.getSession).mockImplementation(() => 
        Promise.resolve(mockResponse)
      );
      
      const result = await authService.getSession();
      
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
    
    it('should handle failure to get session', async () => {
      const mockResponse = {
        data: { session: null },
        error: { message: 'Failed to get session' },
      };
      
      vi.mocked(supabase.auth.getSession).mockImplementation(() => 
        Promise.resolve(mockResponse)
      );
      
      const result = await authService.getSession();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
  
  describe('refreshSession', () => {
    it('should call Supabase refreshSession and return updated session', async () => {
      const mockResponse = {
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      };
      
      vi.mocked(supabase.auth.refreshSession).mockImplementation(() => 
        Promise.resolve(mockResponse)
      );
      
      const result = await authService.refreshSession();
      
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
    
    it('should handle failure to refresh session', async () => {
      const mockResponse = {
        data: { session: null },
        error: { message: 'Failed to refresh session' },
      };
      
      vi.mocked(supabase.auth.refreshSession).mockImplementation(() => 
        Promise.resolve(mockResponse)
      );
      
      const result = await authService.refreshSession();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
}); 