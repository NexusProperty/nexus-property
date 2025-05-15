/**
 * Database Test Configuration
 * 
 * This file contains configuration for connecting to an isolated test database
 * for integration testing with Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Test database connection details
export const TEST_DB_CONFIG = {
  // Use environment variables for test database connection
  // These should be set in the CI environment or local development environment
  supabaseUrl: process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.TEST_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  testUserEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
  testUserPassword: process.env.TEST_USER_PASSWORD || 'password123',
  adminKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY
};

/**
 * Creates a Supabase client connected to the test database
 */
export function createTestDbClient() {
  return createClient<Database>(
    TEST_DB_CONFIG.supabaseUrl,
    TEST_DB_CONFIG.supabaseKey
  );
}

/**
 * Creates a Supabase admin client with service role permissions
 * for test setup tasks like creating test users
 */
export function createTestAdminClient() {
  if (!TEST_DB_CONFIG.adminKey) {
    throw new Error('Admin key not provided for test database. Set TEST_SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  
  return createClient<Database>(
    TEST_DB_CONFIG.supabaseUrl,
    TEST_DB_CONFIG.adminKey
  );
}

/**
 * Test utility to create a test user in the database
 */
export async function createTestUser(email: string = TEST_DB_CONFIG.testUserEmail, password: string = TEST_DB_CONFIG.testUserPassword) {
  const adminClient = createTestAdminClient();
  
  // Create a test user
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (userError) {
    throw new Error(`Failed to create test user: ${userError.message}`);
  }
  
  return userData.user;
}

/**
 * Test utility to authenticate as the test user
 */
export async function signInTestUser(email: string = TEST_DB_CONFIG.testUserEmail, password: string = TEST_DB_CONFIG.testUserPassword) {
  const client = createTestDbClient();
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`);
  }
  
  return { user: data.user, client };
}

/**
 * Test utility to clean up test data after tests
 */
export async function cleanupTestData(userId: string) {
  const adminClient = createTestAdminClient();
  
  // Delete test user created properties
  const { error: deleteError } = await adminClient
    .from('properties')
    .delete()
    .eq('owner_id', userId);
  
  if (deleteError) {
    console.error(`Error cleaning up test properties: ${deleteError.message}`);
  }
  
  // Delete test user
  const { error: userDeleteError } = await adminClient.auth.admin.deleteUser(userId);
  
  if (userDeleteError) {
    console.error(`Error deleting test user: ${userDeleteError.message}`);
  }
}

/**
 * Setup test database with initial test data
 */
export async function setupTestDatabase() {
  const adminClient = createTestAdminClient();
  
  // Create test users if they don't exist
  const testUser = await createTestUser();
  
  // Create test data
  const { error: insertError } = await adminClient
    .from('properties')
    .insert([
      {
        owner_id: testUser.id,
        address: '123 Test Street',
        suburb: 'Test Suburb',
        city: 'Test City',
        property_type: 'House',
        bedrooms: 3,
        bathrooms: 2,
        is_public: true
      },
      {
        owner_id: testUser.id,
        address: '456 Test Avenue',
        suburb: 'Another Suburb',
        city: 'Test City',
        property_type: 'Apartment',
        bedrooms: 2,
        bathrooms: 1,
        is_public: false
      }
    ]);
  
  if (insertError) {
    throw new Error(`Failed to insert test data: ${insertError.message}`);
  }
  
  return testUser;
}

/**
 * Execute a test with a clean database
 * 
 * This function sets up a test database, runs the test function,
 * and then cleans up after the test is complete.
 */
export async function withTestDatabase(testFn: (client: ReturnType<typeof createTestDbClient>, user: any) => Promise<void>) {
  let testUser;
  
  try {
    // Setup test database
    testUser = await setupTestDatabase();
    
    // Sign in as test user
    const { client, user } = await signInTestUser();
    
    // Run the test
    await testFn(client, user);
  } catch (error) {
    console.error('Test error:', error);
    throw error;
  } finally {
    // Clean up test data
    if (testUser) {
      await cleanupTestData(testUser.id);
    }
  }
} 