/**
 * Supabase client configuration for server contexts
 * 
 * This file provides Supabase clients for both client-side and server-side usage.
 * The server-side client with service role key should ONLY be used in secure contexts.
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { configureSupabaseCsrf, getCsrfToken } from './csrf';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  console.error('Missing environment variable: VITE_SUPABASE_URL');
  throw new Error('Supabase URL is required');
}

if (!supabaseAnonKey) {
  console.error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
  throw new Error('Supabase anonymous key is required');
}

// Create the main Supabase client with anonymous key (for client-side usage)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    // Add global options like custom fetch if needed
    fetch: undefined,
    // Add CSRF token to all requests
    headers: {
      'X-CSRF-Token': '', // Will be set dynamically
    },
  },
  // Add retry logic for better resilience
  db: {
    schema: 'public',
  },
});

// Create an admin client with the service role key (for server-side operations)
// This client is only created if the service role key is available
// WARNING: This should ONLY be used in secure server contexts (like Edge Functions)
// NEVER expose or use this client in browser-facing code
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Add global options like custom fetch if needed
        fetch: undefined,
      },
      db: {
        schema: 'public',
      },
    })
  : null;

// Helper function to check if Supabase connection is working
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking Supabase connection:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Unexpected error during Supabase connection check:', err);
    return false;
  }
}

// Helper function to validate admin client connection
// Only use this in secure server contexts
export async function checkAdminConnection() {
  if (!supabaseAdmin) {
    console.error('Admin client not available - missing service role key');
    return false;
  }
  
  try {
    // Simple query to check connection
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Error checking admin connection:', error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error during admin connection check:', err);
    return false;
  }
}

// Initialize CSRF protection for the Supabase client
export async function initializeCsrfProtection() {
  try {
    await configureSupabaseCsrf();
    
    // Set up a listener to update the CSRF token when the auth state changes
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        // Refresh the CSRF token when the user signs in
        await configureSupabaseCsrf();
      }
    });
    
    console.log('CSRF protection initialized for Supabase client');
    return true;
  } catch (error) {
    console.error('Failed to initialize CSRF protection:', error);
    return false;
  }
} 