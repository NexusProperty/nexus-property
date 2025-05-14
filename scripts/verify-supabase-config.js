/**
 * Supabase Configuration Verification Script
 * 
 * This script verifies that the Supabase client can connect using environment variables.
 * It checks both regular and admin client functionality if available.
 * 
 * Run with: node scripts/verify-supabase-config.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL in environment');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ Error: Missing VITE_SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

console.log('🔍 Testing Supabase configuration...');
console.log(`URL: ${supabaseUrl}`);
console.log(`ANON KEY: ${supabaseAnonKey.substring(0, 10)}...`);

// Create a client for testing
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// Test the client connection
async function checkClientConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error checking client connection:', error.message);
      return false;
    }
    
    console.log('✅ Client connection successful');
    return true;
  } catch (err) {
    console.error('❌ Unexpected error during client connection check:', err);
    return false;
  }
}

// Test admin client if service role key is available
async function checkAdminConnection() {
  if (!supabaseServiceRoleKey) {
    console.log('⚠️ Admin client not tested - VITE_SUPABASE_SERVICE_ROLE_KEY not provided');
    return false;
  }
  
  console.log(`SERVICE ROLE KEY: ${supabaseServiceRoleKey.substring(0, 10)}...`);
  
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
  
  try {
    const { data, error } = await adminClient.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('❌ Error checking admin connection:', error.message);
      return false;
    }
    
    console.log('✅ Admin connection successful');
    return true;
  } catch (err) {
    console.error('❌ Unexpected error during admin connection check:', err);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('\n📋 Starting Supabase configuration verification...\n');
  
  const clientTestResult = await checkClientConnection();
  const adminTestResult = await checkAdminConnection();
  
  console.log('\n📊 Results Summary:');
  console.log(`Client Connection: ${clientTestResult ? '✅ Success' : '❌ Failed'}`);
  console.log(`Admin Connection: ${adminTestResult ? '✅ Success' : adminTestResult === false && !supabaseServiceRoleKey ? '⚠️ Not Tested' : '❌ Failed'}`);
  
  if (clientTestResult) {
    console.log('\n🎉 Supabase client configuration is working correctly!');
  } else {
    console.log('\n❌ Supabase client configuration has issues. Please check your configuration.');
    process.exit(1);
  }
}

runTests(); 