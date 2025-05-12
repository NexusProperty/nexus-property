// Script to set up Supabase environment variables for Edge Functions
import { execSync } from 'child_process';

// Supabase URL and keys
const supabaseUrl = 'https://anrpboahhkahdprohtln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjY0NzQsImV4cCI6MjA2MjYwMjQ3NH0.n_07t2K7AEUa4DIWvidXIXw_d_5kgZbaj8uBiqqcHi4';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNjQ3NCwiZXhwIjoyMDYyNjAyNDc0fQ.NPX8AFgZe_6h1Cxf2TfiycJYDKS_hU99_1-4QV-FlyE';

console.log('Setting up Supabase environment variables for Edge Functions...');

try {
  // Set Supabase URL
  console.log('Setting SUPABASE_URL...');
  execSync(`supabase secrets set SUPABASE_URL="${supabaseUrl}"`, { stdio: 'inherit' });
  
  // Set Supabase service role key
  console.log('Setting SUPABASE_SERVICE_ROLE_KEY...');
  execSync(`supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceRoleKey}"`, { stdio: 'inherit' });
  
  // Set Supabase anon key (optional, but can be useful)
  console.log('Setting SUPABASE_ANON_KEY...');
  execSync(`supabase secrets set SUPABASE_ANON_KEY="${supabaseAnonKey}"`, { stdio: 'inherit' });
  
  console.log('✅ Supabase environment variables set successfully!');
} catch (error) {
  console.error('❌ Error setting Supabase environment variables:');
  console.error(error.message);
  process.exit(1);
} 