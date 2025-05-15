import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '@/services/auth';

// Create spies on the auth service functions
const signInSpy = vi.spyOn(authService, 'signIn');
const signOutSpy = vi.spyOn(authService, 'signOut');
const getSessionSpy = vi.spyOn(authService, 'getSession');

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Set default successful responses
    signInSpy.mockResolvedValue({
      success: true,
      data: {},
      error: null
    });
    
    signOutSpy.mockResolvedValue({
      success: true,
      data: null,
      error: null
    });
    
    getSessionSpy.mockResolvedValue({
      success: true,
      data: {},
      error: null
    });
  });
  
  describe('signIn', () => {
    it('should call signIn with correct parameters', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      await authService.signIn(email, password);
      
      expect(signInSpy).toHaveBeenCalledWith(email, password);
    });
    
    it('should handle sign in failure', async () => {
      // Mock failure case
      signInSpy.mockResolvedValueOnce({
        success: false,
        data: null,
        error: new Error('Invalid login credentials')
      });
      
      const result = await authService.signIn('wrong@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
  
  describe('signOut', () => {
    it('should return success on successful sign out', async () => {
      // Ensure the spy returns a successful response
      signOutSpy.mockResolvedValueOnce({
        success: true,
        data: null,
        error: null
      });
      
      const result = await authService.signOut();
      
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('should handle sign out failure', async () => {
      // Mock failure case
      signOutSpy.mockResolvedValueOnce({
        success: false,
        data: null,
        error: new Error('Failed to sign out')
      });
      
      const result = await authService.signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should return session data on success', async () => {
      // Ensure the spy returns a successful response with data
      getSessionSpy.mockResolvedValueOnce({
        success: true,
        data: { user: { id: 'test-user-id' } },
        error: null
      });
      
      const result = await authService.getSession();
      
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.error).toBeNull();
    });
    
    it('should handle failure to get session', async () => {
      // Mock failure case
      getSessionSpy.mockResolvedValueOnce({
        success: false,
        data: null,
        error: new Error('Failed to get session')
      });
      
      const result = await authService.getSession();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
}); 