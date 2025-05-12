// Node.js script to test Supabase service role connection
import { createClient } from '@supabase/supabase-js';

// Supabase URL and keys
const supabaseUrl = 'https://anrpboahhkahdprohtln.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNjQ3NCwiZXhwIjoyMDYyNjAyNDc0fQ.NPX8AFgZe_6h1Cxf2TfiycJYDKS_hU99_1-4QV-FlyE';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Role Key:', supabaseServiceRoleKey.substring(0, 10) + '...');

// Create the Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Test function to verify Supabase service role connection
async function testSupabaseServiceRole() {
  console.log('Testing Supabase service role connection...');
  
  try {
    // First check if Supabase is responding
    console.log('Checking Supabase health with service role...');
    
    // List all tables in the public schema
    console.log('Retrieving database schema information...');
    
    // This is a PostgreSQL query that will list all tables in the public schema
    // It will work even if no tables exist yet
    const { data, error } = await supabaseAdmin.rpc('get_schema_info');
    
    if (error) {
      // If the function doesn't exist, try listing users which requires service role
      console.log('RPC function not found, trying to list auth users...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error connecting with service role:');
        console.error('- Message:', authError.message);
        return false;
      }
      
      console.log('Successfully connected with service role!');
      console.log('Auth admin API is accessible, users count:', authData.users.length);
      return true;
    }
    
    console.log('Successfully connected with service role!');
    console.log('Schema information:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error during service role test:');
    console.error(err);
    return false;
  }
}

// Run the test
testSupabaseServiceRole().then((success) => {
  if (success) {
    console.log('✅ Supabase service role test passed');
  } else {
    console.log('❌ Supabase service role test failed');
    process.exit(1);
  }
}); 