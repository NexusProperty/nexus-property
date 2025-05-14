/**
 * Supabase client configuration
 * 
 * This file provides the configured Supabase client for use throughout the application.
 * It handles environment-specific configuration and client initialization.
 */
import { createClient, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';

// Mock Database type for example purposes
// In a real application, this would be imported from a generated types file
interface Database {
  public: {
    Tables: {
      health_check: {
        Row: {
          id: string;
          status: string;
        };
      };
      // Add more table definitions as needed
    };
  };
}

// Declare import.meta.env to avoid TypeScript errors with Vite's env variables
declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      [key: string]: string;
    };
  }
}

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

/**
 * Client configuration options
 */
const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Global error handler
  global: {
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      // Here you could add custom fetch logic, such as:
      // - Adding custom headers
      // - Handling specific HTTP errors globally
      // - Adding request/response logging for development
      return fetch(url, init);
    }
  }
};

/**
 * Initialize the Supabase client with proper configuration
 */
let supabaseInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        clientOptions
      );
      
      // Attach global error listener for auth events (e.g., for logging, monitoring)
      supabaseInstance.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear any application state if needed
          console.info(`Auth event: ${event}`);
        }
      });
      
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }
  
  return supabaseInstance;
}

// Export the singleton instance for general use
export const supabase = getSupabaseClient();

/**
 * Helper function to get a fresh client
 * Useful for specific scenarios where you want to bypass the singleton
 */
export function createFreshClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
}

/**
 * Returns the current session from the client
 * Convenience function to avoid direct client access in components
 */
export async function getCurrentSession() {
  return await supabase.auth.getSession();
}

/**
 * Check if the client is properly configured
 * Useful for application startup checks
 */
export async function validateConnection(): Promise<boolean> {
  try {
    // Simple query to validate connection
    const { error } = await supabase.from('health_check').select('*').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection validation failed:', error);
    return false;
  }
} 