
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Use environment variables for Supabase configuration
const supabaseUrl = 'https://qjrcdlsnnhiluglcvxla.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcmNkbHNubmhpbHVnbGN2eGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDMyODQsImV4cCI6MjA2MjQxOTI4NH0.7mlBaHJzuaYOqR-8h8nUzqHnxv2pFDOZWR9ac8ytMs8';

// Initialize the Supabase client with proper configuration for auth persistence
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
