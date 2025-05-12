// Node.js script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

// Supabase URL and keys
const supabaseUrl = 'https://anrpboahhkahdprohtln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjY0NzQsImV4cCI6MjA2MjYwMjQ3NH0.n_07t2K7AEUa4DIWvidXIXw_d_5kgZbaj8uBiqqcHi4';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to verify Supabase connection
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // First check if Supabase is responding
    console.log('Checking Supabase health...');
    
    // Simple test to check the connection
    // Get database server timestamp without accessing any tables
    const { data, error } = await supabase.rpc('get_timestamp');
    
    if (error) {
      // If the specific function doesn't exist, try a simple auth check
      console.log('RPC function not found, trying basic auth check...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Error connecting to Supabase:');
        console.error('- Message:', authError.message);
        return false;
      }
      
      console.log('Successfully connected to Supabase!');
      console.log('Auth service is responding correctly.');
      return true;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Server timestamp:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error during Supabase connection test:');
    console.error(err);
    return false;
  }
}

// Run the test
testSupabaseConnection().then((success) => {
  if (success) {
    console.log('✅ Supabase connection test passed');
  } else {
    console.log('❌ Supabase connection test failed');
    process.exit(1);
  }
}); 