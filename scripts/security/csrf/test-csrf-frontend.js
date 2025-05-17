// Frontend CSRF Testing Script
// This script demonstrates how to implement CSRF protection in your frontend app

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main testing function
async function testCsrfProtection() {
  console.log('======= CSRF Frontend Testing =======');
  
  // Step 1: Sign in to get an authenticated session
  console.log('Step 1: Sign in to get an authenticated session');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',  // Replace with a valid test user
    password: 'password123'     // Replace with the correct password
  });
  
  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    return;
  }
  
  console.log('Successfully signed in as:', signInData.user.email);
  
  // Step 2: Generate a CSRF token
  console.log('\nStep 2: Generating CSRF token');
  const { data: tokenData, error: tokenError } = await supabase.rpc('generate_csrf_token');
  
  if (tokenError) {
    console.error('Failed to generate token:', tokenError.message);
    return;
  }
  
  const csrfToken = tokenData;
  console.log('Successfully generated token:', csrfToken);
  
  // Step 3: Test a protected mutation WITH the token (should succeed)
  console.log('\nStep 3: Testing protected mutation WITH token (should succeed)');
  
  // Example: Creating a new property with CSRF token
  const { data: insertData, error: insertError } = await supabase
    .from('properties')
    .insert({
      owner_id: signInData.user.id,
      address: '123 Test Street',
      suburb: 'Testville',
      city: 'Testing City',
      property_type: 'House',
      bedrooms: 3,
      bathrooms: 2,
      status: 'active'
    })
    .select()
    .headers({
      'x-csrf-token': csrfToken
    });
  
  if (insertError) {
    console.error('Protected mutation failed even with token:', insertError.message);
  } else {
    console.log('Protected mutation succeeded with token:', insertData);
  }
  
  // Step 4: Test a protected mutation WITHOUT the token (should fail)
  console.log('\nStep 4: Testing protected mutation WITHOUT token (should fail)');
  
  // Generate new token but don't use it - to ensure we're not reusing the previous token
  const { data: newTokenData } = await supabase.rpc('generate_csrf_token');
  
  const { data: insertData2, error: insertError2 } = await supabase
    .from('properties')
    .insert({
      owner_id: signInData.user.id,
      address: '456 Test Avenue',
      suburb: 'Testville',
      city: 'Testing City',
      property_type: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      status: 'active'
    })
    .select();
  
  if (insertError2) {
    console.log('Protected mutation correctly failed without token:', insertError2.message);
  } else {
    console.error('ERROR: Protected mutation succeeded without token!', insertData2);
  }
  
  // Step 5: Test a read operation (should succeed regardless of token)
  console.log('\nStep 5: Testing read operation (should succeed regardless of token)');
  
  const { data: selectData, error: selectError } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', signInData.user.id)
    .limit(5);
  
  if (selectError) {
    console.error('Read operation failed:', selectError.message);
  } else {
    console.log('Read operation succeeded, returned', selectData.length, 'properties');
  }
  
  console.log('\n======= CSRF Frontend Testing Complete =======');
}

// Run the test
testCsrfProtection()
  .catch(err => console.error('Test failed with error:', err))
  .finally(() => console.log('Testing completed'));

// To run this script:
// 1. Save as test-csrf-frontend.js
// 2. Replace Supabase URL and key with your actual values
// 3. Run with: node test-csrf-frontend.js 