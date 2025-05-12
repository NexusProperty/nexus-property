import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Supabase URL and keys
const supabaseUrl = 'https://anrpboahhkahdprohtln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjY0NzQsImV4cCI6MjA2MjYwMjQ3NH0.n_07t2K7AEUa4DIWvidXIXw_d_5kgZbaj8uBiqqcHi4';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNjQ3NCwiZXhwIjoyMDYyNjAyNDc0fQ.NPX8AFgZe_6h1Cxf2TfiycJYDKS_hU99_1-4QV-FlyE';

// Create the main Supabase client with anonymous key (for client-side usage)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create an admin client with the service role key (for server-side operations)
// WARNING: This should ONLY be used in secure server contexts (like Edge Functions)
// NEVER expose or use this client in browser-facing code
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey); 