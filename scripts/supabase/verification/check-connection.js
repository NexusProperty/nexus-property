// Simple script to check Supabase connection
import { createClient } from '@supabase/supabase-js';

// Supabase URL and keys
const supabaseUrl = 'https://anrpboahhkahdprohtln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjY0NzQsImV4cCI6MjA2MjYwMjQ3NH0.n_07t2K7AEUa4DIWvidXIXw_d_5kgZbaj8uBiqqcHi4';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple connection test function
async function testConnection() {
  try {
    // Check auth service
    console.log('Checking auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return false;
    } else {
      console.log('Auth service is accessible ✅');
    }
    
    // Test if we can get health info from Supabase
    console.log('Checking service health...');
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`);
    
    if (healthResponse.ok) {
      console.log('REST API is accessible ✅');
    } else {
      console.error('REST API error:', healthResponse.statusText);
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error during connection test:', err);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('✅ Connection test completed');
  } else {
    console.log('❌ Connection test failed');
    process.exit(1);
  }
}); 