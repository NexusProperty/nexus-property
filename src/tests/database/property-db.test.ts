import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createIsolatedTestClient, seedTestData, cleanupTestDatabase } from '../../lib/test-utils/database-test-utils';
import { SupabaseClient } from '@supabase/supabase-js';

// Test data
const testProperties = [
  {
    id: '1',
    address: '123 Test Street, Auckland',
    owner_id: 'user1',
    bedrooms: 3,
    bathrooms: 2,
    land_area: 450,
    floor_area: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    address: '456 Sample Avenue, Wellington',
    owner_id: 'user1',
    bedrooms: 4,
    bathrooms: 2.5,
    land_area: 600,
    floor_area: 220,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const testUser = {
  id: 'user1',
  email: 'test@example.com',
  role: 'user'
};

describe('Property Database Operations', () => {
  let supabase: SupabaseClient;
  let schema: string;

  beforeEach(async () => {
    // Set up a unique test database for each test
    schema = `test_${Date.now()}`;
    supabase = await createIsolatedTestClient({
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      schema
    });

    // Create a test user
    await supabase.rpc('test_create_user', {
      user_id: testUser.id,
      email: testUser.email,
      role: testUser.role
    });

    // Seed test data
    await seedTestData(supabase, 'properties', testProperties);
  });

  afterEach(async () => {
    // Clean up the test database after each test
    await cleanupTestDatabase(supabase, schema);
  });

  it('should retrieve properties by owner_id', async () => {
    // Test retrieval of properties by owner
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', 'user1');

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data?.[0].address).toBe('123 Test Street, Auckland');
    expect(data?.[1].address).toBe('456 Sample Avenue, Wellington');
  });

  it('should insert a new property', async () => {
    const newProperty = {
      address: '789 New Road, Christchurch',
      owner_id: 'user1',
      bedrooms: 2,
      bathrooms: 1,
      land_area: 350,
      floor_area: 120
    };

    // Insert new property
    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert(newProperty)
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(insertData).not.toBeNull();
    expect(insertData?.address).toBe('789 New Road, Christchurch');

    // Verify the new property count
    const { data: allProperties } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', 'user1');

    expect(allProperties).toHaveLength(3);
  });

  it('should update an existing property', async () => {
    const updates = {
      bedrooms: 4,
      bathrooms: 3
    };

    // Update property
    const { error: updateError } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', '1');

    expect(updateError).toBeNull();

    // Verify the update
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', '1')
      .single();

    expect(property).not.toBeNull();
    expect(property?.bedrooms).toBe(4);
    expect(property?.bathrooms).toBe(3);
  });

  it('should delete a property', async () => {
    // Delete property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', '2');

    expect(deleteError).toBeNull();

    // Verify deletion
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', 'user1');

    expect(properties).toHaveLength(1);
    expect(properties?.[0].id).toBe('1');
  });

  it('should enforce Row Level Security policies', async () => {
    // Create a different user client
    await supabase.rpc('test_create_user', {
      user_id: 'user2',
      email: 'another@example.com',
      role: 'user'
    });

    // Simulate signing in as the second user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'another@example.com',
      password: 'password123'
    });

    // Using the second user's client to try to access first user's properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', 'user1');

    // Should either return no results due to RLS or an error depending on RLS implementation
    if (error) {
      expect(error.code).toBe('PGRST301'); // Permission denied
    } else {
      expect(properties).toHaveLength(0); // No rows returned due to RLS
    }
  });
}); 