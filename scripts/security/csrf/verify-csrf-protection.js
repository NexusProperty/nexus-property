/**
 * CSRF Protection Verification Script
 * 
 * This script verifies that the CSRF protection implementation is working correctly.
 * It tests:
 * 1. Fetching a CSRF token
 * 2. Making a mutation request without a CSRF token (should fail)
 * 3. Making a mutation request with a valid CSRF token (should succeed)
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

// Configure Supabase client with proper header handling
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': '' // Will be updated later
    }
  },
  auth: {
    persistSession: true
  }
});

// Test user credentials
const testUserEmail = process.env.TEST_USER_EMAIL;
const testUserPassword = process.env.TEST_USER_PASSWORD;

if (!testUserEmail || !testUserPassword) {
  console.error('Error: TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env file');
  process.exit(1);
}

// Test data
let testPropertyId = null;
let csrfToken = null;

// Keep track of test results
const testResults = {
  userSignIn: false,
  profileCreation: false,
  tokenFetch: false,
  noTokenMutation: false,
  invalidTokenMutation: false,
  validTokenMutation: false,
  cleanup: false
};

// Set CSRF token via REST interceptor to ensure it's sent with every request
async function setCsrfTokenInInterceptor(token) {
  // Set in global headers to be used for all requests
  supabase.rest.headers['X-CSRF-Token'] = token || '';
  if (token) {
    console.log(`Set global CSRF token: ${token.substring(0, 10)}...`);
  } else {
    console.log('Cleared CSRF token from headers');
  }
}

async function main() {
  try {
    console.log('Starting CSRF protection verification...');
    
    // Sign in as test user
    console.log('Signing in as test user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });
    
    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`);
    }
    
    console.log('Successfully signed in as test user');
    testResults.userSignIn = true;
    
    // Try to create a profile for the user
    console.log('Creating user profile...');
    try {
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: signInData.user.id,
          email: signInData.user.email,
          full_name: 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createProfileError) {
        // If the error is a unique violation, the profile already exists
        if (createProfileError.code === '23505') {
          console.log('User profile already exists');
          testResults.profileCreation = true;
        } else {
          console.warn(`Warning: Failed to create user profile: ${createProfileError.message}`);
          console.log('Continuing with verification...');
        }
      } else {
        console.log('Successfully created user profile');
        testResults.profileCreation = true;
      }
    } catch (error) {
      console.warn(`Warning: Error during profile creation: ${error.message}`);
      console.log('Continuing with verification...');
    }
    
    // Fetch CSRF token
    console.log('Fetching CSRF token...');
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_csrf_token');
    
    if (tokenError) {
      throw new Error(`Failed to fetch CSRF token: ${tokenError.message}`);
    }
    
    csrfToken = tokenData;
    if (!csrfToken) {
      throw new Error('CSRF token is empty or null');
    }
    
    console.log('Successfully fetched CSRF token');
    testResults.tokenFetch = true;
    
    // Set the token in the interceptor
    await setCsrfTokenInInterceptor('');
    
    // Test mutation request without CSRF token
    console.log('Testing mutation request without CSRF token...');
    
    // Create a test property without CSRF token
    const { error: createError } = await supabase
      .from('properties')
      .insert({
        address: '123 Test Street',
        suburb: 'Test Suburb',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        property_type: 'house',
        square_footage: 2000,
        bedrooms: 3,
        bathrooms: 2,
        year_built: 2000,
        owner_id: signInData.user.id,
      });
    
    if (createError) {
      console.log(`Successfully verified that mutation request without CSRF token fails: ${createError.message}`);
      testResults.noTokenMutation = true;
    } else {
      console.warn('Warning: Mutation request without CSRF token succeeded, which is unexpected.');
      console.warn('This might indicate that CSRF protection is not fully enforced.');
      
      // Try to clean up the created property
      try {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('address', '123 Test Street')
          .eq('owner_id', signInData.user.id);
        
        if (properties && properties.length > 0) {
          await supabase
            .from('properties')
            .delete()
            .eq('id', properties[0].id);
        }
      } catch (cleanupError) {
        console.warn(`Warning: Failed to clean up property: ${cleanupError.message}`);
      }
    }
    
    // Test with an invalid CSRF token
    console.log('Testing mutation request with invalid CSRF token...');
    
    // Set an invalid CSRF token in headers
    await setCsrfTokenInInterceptor('invalid-token');
    
    // Try to create a property with invalid CSRF token
    const { error: invalidTokenError } = await supabase
      .from('properties')
      .insert({
        address: '789 Test Road',
        suburb: 'Test Suburb',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        property_type: 'house',
        square_footage: 3000,
        bedrooms: 5,
        bathrooms: 4,
        year_built: 2020,
        owner_id: signInData.user.id,
      });
    
    if (invalidTokenError) {
      console.log(`Successfully verified that mutation request with invalid CSRF token fails: ${invalidTokenError.message}`);
      testResults.invalidTokenMutation = true;
    } else {
      console.error('Error: Expected mutation request with invalid CSRF token to fail, but it succeeded');
      
      // Try to clean up the created property
      try {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('address', '789 Test Road')
          .eq('owner_id', signInData.user.id);
        
        if (properties && properties.length > 0) {
          await supabase
            .from('properties')
            .delete()
            .eq('id', properties[0].id);
        }
      } catch (cleanupError) {
        console.warn(`Warning: Failed to clean up property: ${cleanupError.message}`);
      }
    }
    
    // Test mutation request with valid CSRF token
    console.log('Testing mutation request with valid CSRF token...');
    
    // Set CSRF token in headers
    await setCsrfTokenInInterceptor(csrfToken);
    
    // Create a test property with CSRF token
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert({
        address: '456 Test Avenue',
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
      })
      .select();
    
    if (propertyError) {
      console.error(`Error: Failed to create test property with CSRF token: ${propertyError.message}`);
    } else {
      testPropertyId = propertyData[0].id;
      console.log('Successfully verified that mutation request with CSRF token succeeds');
      testResults.validTokenMutation = true;
    }
    
    // Clean up test data
    console.log('Cleaning up test data...');
    
    if (testPropertyId) {
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', testPropertyId);
      
      if (deleteError) {
        console.warn(`Warning: Failed to delete test property: ${deleteError.message}`);
      } else {
        console.log('Successfully cleaned up test data');
        testResults.cleanup = true;
      }
    }
    
    // Sign out
    console.log('Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.warn(`Warning: Failed to sign out: ${signOutError.message}`);
    } else {
      console.log('Successfully signed out');
    }
    
    // Display test results summary
    console.log('\n===== CSRF Protection Verification Results =====');
    console.log(`User Sign In: ${testResults.userSignIn ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Profile Creation: ${testResults.profileCreation ? '✅ PASS' : '⚠️ WARNING'}`);
    console.log(`Token Fetching: ${testResults.tokenFetch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`No Token Mutation: ${testResults.noTokenMutation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Invalid Token Mutation: ${testResults.invalidTokenMutation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Valid Token Mutation: ${testResults.validTokenMutation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test Cleanup: ${testResults.cleanup ? '✅ PASS' : '⚠️ WARNING'}`);
    
    const allMandatoryTestsPassed = 
      testResults.userSignIn && 
      testResults.tokenFetch && 
      testResults.noTokenMutation && 
      testResults.invalidTokenMutation && 
      testResults.validTokenMutation;
    
    if (allMandatoryTestsPassed) {
      console.log('\n✅ CSRF protection verification PASSED! All critical tests were successful.');
    } else {
      console.error('\n❌ CSRF protection verification FAILED! Some critical tests did not pass.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 