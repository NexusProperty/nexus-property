/**
 * CSRF Protection Debug Verification Script
 * 
 * This script helps debug why a valid CSRF token might still be rejected.
 * It adds more comprehensive logging and checks at each step.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user credentials
const testUserEmail = process.env.TEST_USER_EMAIL;
const testUserPassword = process.env.TEST_USER_PASSWORD;

if (!testUserEmail || !testUserPassword) {
  console.error('Error: TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env file');
  process.exit(1);
}

async function main() {
  try {
    console.log('📋 Starting CSRF protection debugging...');
    
    // Sign in as test user
    console.log('🔑 Signing in as test user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });
    
    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`);
    }
    
    console.log('✅ Successfully signed in as test user');
    console.log(`👤 User ID: ${signInData.user.id}`);
    
    // Debug request context before getting token
    console.log('\n📊 Debugging request context BEFORE token fetch...');
    const { data: beforeContext, error: beforeError } = await supabase.rpc('debug_request_context');
    
    if (beforeError) {
      console.error(`❌ Error getting request context: ${beforeError.message}`);
    } else {
      console.log(`🔍 Context: ${beforeContext}`);
    }
    
    // Fetch CSRF token
    console.log('\n🔒 Fetching CSRF token...');
    const { data: csrfToken, error: tokenError } = await supabase.rpc('get_csrf_token');
    
    if (tokenError) {
      throw new Error(`Failed to fetch CSRF token: ${tokenError.message}`);
    }
    
    if (!csrfToken) {
      throw new Error('CSRF token is empty or null');
    }
    
    console.log(`✅ Successfully fetched CSRF token: ${csrfToken.substring(0, 10)}...`);
    
    // Debug request context after getting token
    console.log('\n📊 Debugging request context AFTER token fetch...');
    const { data: afterContext, error: afterError } = await supabase.rpc('debug_request_context');
    
    if (afterError) {
      console.error(`❌ Error getting request context: ${afterError.message}`);
    } else {
      console.log(`🔍 Context: ${afterContext}`);
    }
    
    // Clear any existing header
    console.log('\n🧹 Clearing any existing CSRF token header...');
    if (supabase.rest.headers['X-CSRF-Token']) {
      delete supabase.rest.headers['X-CSRF-Token'];
      console.log('✅ Existing X-CSRF-Token header cleared');
    } else {
      console.log('ℹ️ No existing X-CSRF-Token header found');
    }
    
    // Test if the csrf_token is in the session claim
    console.log('\n🔎 Testing if token is in session claim...');
    const { data: tokenCheck, error: checkError } = await supabase.rpc('has_valid_csrf_token');
    
    if (checkError) {
      console.error(`❌ Error checking token: ${checkError.message}`);
    } else {
      console.log(`🔍 Token validation without header: ${tokenCheck === true ? '✅ TRUE (unexpected)' : '❌ FALSE (expected)'}`);
    }
    
    // First try valid token that was just fetched
    console.log('\n🔑 Setting valid token in header...');
    supabase.rest.headers['X-CSRF-Token'] = csrfToken;
    console.log(`✅ Set token in header: ${csrfToken.substring(0, 10)}...`);
    
    // Check header is set
    console.log('\n📊 Debugging request context with valid token in header...');
    const { data: validContext, error: validError } = await supabase.rpc('debug_request_context');
    
    if (validError) {
      console.error(`❌ Error getting request context: ${validError.message}`);
    } else {
      console.log(`🔍 Context: ${validContext}`);
    }
    
    // Test if the csrf_token is valid with header set
    console.log('\n🔎 Testing if token is valid with header set...');
    const { data: validCheck, error: validCheckError } = await supabase.rpc('is_csrf_safe');
    
    if (validCheckError) {
      console.error(`❌ Error checking valid token: ${validCheckError.message}`);
    } else {
      console.log(`🔍 Token validation with valid header: ${validCheck === true ? '✅ TRUE (expected)' : '❌ FALSE (unexpected)'}`);
    }
    
    // Try insert with valid token
    console.log('\n📝 Attempting insert with valid token...');
    const testProperty = {
      address: `Debug Test ${Date.now()}`,
      suburb: 'Test Suburb',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      property_type: 'house',
      square_footage: 2500,
      bedrooms: 4,
      bathrooms: 3,
      year_built: 2010,
      owner_id: signInData.user.id,
    };
    
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert(testProperty)
      .select();
    
    if (propertyError) {
      console.error(`❌ Insert failed with valid token: ${propertyError.message}`);
      console.log('🔍 Debugging the failure...');
      
      // Try with special bypass token
      console.log('\n🔑 Testing with BYPASS token...');
      supabase.rest.headers['X-CSRF-Token'] = 'NEXUS_TESTING_BYPASS_TOKEN';
      console.log(`Setting bypass token: ${supabase.rest.headers['X-CSRF-Token']}`);
      
      const bypassProperty = {
        address: `Bypass Test ${Date.now()}`,
        suburb: 'Test Suburb',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        property_type: 'house',
        square_footage: 2500,
        bedrooms: 4,
        bathrooms: 3,
        year_built: 2010,
        owner_id: signInData.user.id,
      };
      
      const { data: bypassData, error: bypassError } = await supabase
        .from('properties')
        .insert(bypassProperty)
        .select();
      
      if (bypassError) {
        console.error(`❌ Even bypass token failed: ${bypassError.message}`);
        console.log('This suggests the header might not be making it to the database at all');
      } else {
        console.log('✅ Bypass token worked! This confirms the issue is with token transmission');
        console.log(`🆔 Property ID: ${bypassData[0].id}`);
        
        // Clean up
        console.log('🧹 Cleaning up bypass test property...');
        await supabase
          .from('properties')
          .delete()
          .eq('id', bypassData[0].id);
      }
      
      // Try with invalid token as contrast
      console.log('\n🔑 Setting invalid token in header for comparison...');
      const invalidToken = 'invalid-token-' + Date.now();
      supabase.rest.headers['X-CSRF-Token'] = invalidToken;
      console.log(`Setting invalid token: ${invalidToken}`);
      
      // Debug context with invalid token
      const { data: invalidContext, error: invalidContextError } = await supabase.rpc('debug_request_context');
      
      if (invalidContextError) {
        console.error(`❌ Error getting request context with invalid token: ${invalidContextError.message}`);
      } else {
        console.log(`🔍 Context with invalid token: ${invalidContext}`);
      }
      
      // Check if is_csrf_safe with invalid token
      const { data: invalidCheck, error: invalidCheckError } = await supabase.rpc('is_csrf_safe');
      
      if (invalidCheckError) {
        console.error(`❌ Error checking invalid token: ${invalidCheckError.message}`);
      } else {
        console.log(`🔍 is_csrf_safe with invalid token: ${invalidCheck}`);
      }
    } else {
      console.log('✅ Successfully inserted property with valid token!');
      console.log(`🆔 Property ID: ${propertyData[0].id}`);
      
      // Clean up
      console.log('\n🧹 Cleaning up test property...');
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyData[0].id);
      
      if (deleteError) {
        console.error(`❌ Error deleting test property: ${deleteError.message}`);
      } else {
        console.log('✅ Successfully deleted test property');
      }
    }
    
    // Final diagnosis
    console.log('\n📊 Final diagnostic information:');
    console.log('1. Check if CSRF token is properly stored in JWT claim');
    console.log('2. Check if token is properly passed in headers');
    console.log('3. Verify is_csrf_safe() function is correctly comparing tokens');
    console.log('4. Ensure RLS policy is correctly referencing is_csrf_safe()');
    
    // Sign out
    console.log('\n👋 Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Successfully signed out');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 