import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '@/services/auth';
import { supabase } from '@/lib/supabase';

// Create a mock for the Supabase client
vi.mock('@/lib/supabase', () => ({
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
}));

// Mock for CSRF token refresh
vi.mock('@/lib/csrf', () => ({
  refreshCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('signIn', () => {
    it('should call Supabase signInWithPassword with correct parameters', async () => {
      // Set up the mock to return a successful response
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null,
      } as any);
      
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
      // Set up the mock to return an error
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as any);
      
      const result = await authService.signIn('wrong@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
  
  describe('signOut', () => {
    it('should call Supabase signOut and return success', async () => {
      // Set up the mock to return a successful response
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);
      
      const result = await authService.signOut();
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('should handle sign out failure', async () => {
      // Set up the mock to return an error
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Failed to sign out' },
      } as any);
      
      const result = await authService.signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should call Supabase getSession and return session data', async () => {
      // Set up the mock to return a successful response
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      } as any);
      
      const result = await authService.getSession();
      
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
    
    it('should handle failure to get session', async () => {
      // Set up the mock to return an error
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Failed to get session' },
      } as any);
      
      const result = await authService.getSession();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
  
  describe('refreshSession', () => {
    it('should call Supabase refreshSession and return updated session', async () => {
      // Set up the mock to return a successful response
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      } as any);
      
      const result = await authService.refreshSession();
      
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
    
    it('should handle failure to refresh session', async () => {
      // Set up the mock to return an error
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Failed to refresh session' },
      } as any);
      
      const result = await authService.refreshSession();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
}); 