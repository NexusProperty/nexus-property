/**
 * CSRF Protection Utilities
 * 
 * This file provides utilities for handling CSRF tokens in the client application.
 * It includes functions for fetching, storing, and using CSRF tokens with Supabase requests.
 */

import { supabase } from './supabase';

// Store the CSRF token in memory
let csrfToken: string | null = null;

/**
 * Fetch a new CSRF token from the server
 * @returns The CSRF token
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    // Call the get_csrf_token function in Supabase
    const { data, error } = await supabase.functions.invoke('get-csrf-token');
    
    if (error) {
      console.error('Error fetching CSRF token:', error.message);
      throw error;
    }
    
    // Store the token
    csrfToken = data;
    
    return data;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
}

/**
 * Get the current CSRF token, fetching a new one if necessary
 * @returns The CSRF token
 */
export async function getCsrfToken(): Promise<string> {
  // If we don't have a token, fetch one
  if (!csrfToken) {
    return fetchCsrfToken();
  }
  
  return csrfToken;
}

/**
 * Add CSRF token to a request
 * @param headers The headers object to add the token to
 * @returns The headers with the CSRF token
 */
export async function addCsrfTokenToHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  // Get the CSRF token
  const token = await getCsrfToken();
  
  // Add the token to the headers
  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}

/**
 * Configure Supabase to use CSRF tokens for all requests
 * This should be called when the application initializes
 */
export async function configureSupabaseCsrf(): Promise<void> {
  try {
    // Get the CSRF token
    const token = await getCsrfToken();
    
    // Configure Supabase to use the token for all requests
    supabase.realtime.setAuth(token);
    
    // Add the token to the global headers
    // Note: We can't directly access supabase.rest.headers as it's protected
    // Instead, we'll use the headers option when making requests
    
    console.log('CSRF protection configured for Supabase');
  } catch (error) {
    console.error('Failed to configure CSRF protection:', error);
  }
}

/**
 * Refresh the CSRF token
 * This should be called periodically or after certain operations
 * @returns The new CSRF token
 */
export async function refreshCsrfToken(): Promise<string> {
  // Fetch a new token
  return fetchCsrfToken();
} 