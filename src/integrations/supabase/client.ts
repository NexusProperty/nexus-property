/**
 * Supabase client configuration
 * 
 * This file provides the configured Supabase client for use throughout the application.
 * It handles environment-specific configuration and client initialization.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables from Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

/**
 * Client configuration options
 */
const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
};

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  clientOptions
);

/**
 * Check if the Supabase connection is working
 * @returns Promise<boolean> True if connection is successful
 */
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