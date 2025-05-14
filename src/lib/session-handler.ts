/**
 * Session Handler
 * 
 * This module provides functionality for managing authentication sessions,
 * including automatic token refresh to prevent session expiration.
 */

import { refreshSession } from '@/services/auth';
import { configureSupabaseCsrf } from './csrf';

// Session refresh interval in milliseconds (15 minutes)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

// Track the refresh interval
let refreshIntervalId: number | null = null;

/**
 * Initialize the session handler
 * This should be called when the application starts
 */
export async function initializeSessionHandler(): Promise<void> {
  try {
    // Configure CSRF protection
    await configureSupabaseCsrf();
    
    // Start the token refresh interval
    startTokenRefreshInterval();
    
    console.log('Session handler initialized');
  } catch (error) {
    console.error('Failed to initialize session handler:', error);
  }
}

/**
 * Start the token refresh interval
 * This will periodically refresh the authentication token
 */
export function startTokenRefreshInterval(): void {
  // Clear any existing interval
  if (refreshIntervalId !== null) {
    clearInterval(refreshIntervalId);
  }
  
  // Set up the refresh interval
  refreshIntervalId = window.setInterval(async () => {
    try {
      const result = await refreshSession();
      
      if (!result.success) {
        console.warn('Token refresh failed:', result.error);
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
    }
  }, SESSION_REFRESH_INTERVAL);
  
  console.log('Token refresh interval started');
}

/**
 * Stop the token refresh interval
 * This should be called when the user signs out
 */
export function stopTokenRefreshInterval(): void {
  if (refreshIntervalId !== null) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
    console.log('Token refresh interval stopped');
  }
}

/**
 * Manually trigger a token refresh
 * This can be called after a long period of inactivity
 */
export async function manualTokenRefresh(): Promise<boolean> {
  try {
    const result = await refreshSession();
    return result.success;
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    return false;
  }
} 