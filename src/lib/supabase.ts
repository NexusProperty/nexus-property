import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Initialize the Supabase client with public env vars only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create a single instance of the Supabase client to use throughout the app
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
); 