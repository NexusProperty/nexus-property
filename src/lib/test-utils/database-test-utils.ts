import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';

// Configuration for the test database
interface TestDatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  schema?: string;
}

// Create a unique schema name for test isolation
export const generateUniqueSchemaName = () => {
  return `test_${uuidv4().replace(/-/g, '_')}`;
};

// Create an isolated test database client with a unique schema
export const createIsolatedTestClient = async (config: TestDatabaseConfig): Promise<SupabaseClient> => {
  const schema = config.schema || generateUniqueSchemaName();
  
  // Create a Supabase client
  const supabase = createClient(
    config.supabaseUrl,
    config.supabaseKey
  );
  
  // Create a new schema for this test run
  await supabase.rpc('create_test_schema', { schema_name: schema });
  
  // Clone the structure from public schema to test schema
  await supabase.rpc('clone_schema_structure', { 
    source_schema: 'public', 
    target_schema: schema 
  });
  
  // Configure the client to use the test schema
  const testClient = createClient(
    config.supabaseUrl,
    config.supabaseKey,
    {
      db: {
        schema
      }
    }
  );
  
  return testClient;
};

// Seed test data into the isolated database
export const seedTestData = async <T extends Record<string, unknown>>(
  client: SupabaseClient,
  tableName: string,
  data: T[]
): Promise<boolean> => {
  const { error } = await client.from(tableName).insert(data);
  if (error) {
    throw new Error(`Error seeding test data: ${error.message}`);
  }
  return true;
};

// Clean up test database schema after tests
export const cleanupTestDatabase = async (
  client: SupabaseClient,
  schema: string
): Promise<boolean> => {
  await client.rpc('drop_test_schema', { schema_name: schema });
  return true;
};

// Utility function to set up a test database, run tests, and clean up
export const withTestDatabase = async (
  config: TestDatabaseConfig,
  testFn: (client: SupabaseClient) => Promise<void>
): Promise<void> => {
  const schema = generateUniqueSchemaName();
  const testConfig = { ...config, schema };
  const client = await createIsolatedTestClient(testConfig);
  
  try {
    // Run the test function with the test client
    await testFn(client);
  } finally {
    // Always clean up, even if tests fail
    await cleanupTestDatabase(client, schema);
  }
};

// Create a test user in the database
export const createTestUser = async (
  client: SupabaseClient,
  userData: {
    id?: string;
    email: string;
    role?: string;
  }
): Promise<{
  id: string;
  email: string;
  role: string;
}> => {
  const userId = userData.id || uuidv4();
  const role = userData.role || 'user';
  
  // Create auth.users entry (mock)
  await client.rpc('test_create_user', {
    user_id: userId,
    email: userData.email,
    role
  });
  
  return { id: userId, email: userData.email, role };
};

// Example stored procedures that would need to be created in Supabase
/*
CREATE OR REPLACE FUNCTION create_test_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION clone_schema_structure(source_schema TEXT, target_schema TEXT)
RETURNS VOID AS $$
DECLARE
  object record;
BEGIN
  -- Clone tables
  FOR object IN 
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = source_schema
    AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE 'CREATE TABLE ' || quote_ident(target_schema) || '.' || quote_ident(object.table_name) || ' (LIKE ' || quote_ident(source_schema) || '.' || quote_ident(object.table_name) || ' INCLUDING ALL)';
    
    -- Copy RLS policies
    -- Note: This would require a more complex function to properly implement
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION drop_test_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(schema_name) || ' CASCADE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION test_create_user(user_id UUID, email TEXT, role TEXT)
RETURNS VOID AS $$
BEGIN
  -- This is a simplified version - in a real implementation, 
  -- you would add entries to auth.users and profiles tables
  EXECUTE 'INSERT INTO auth.users (id, email) VALUES ($1, $2)' USING user_id, email;
  EXECUTE 'INSERT INTO public.profiles (id, email, role) VALUES ($1, $2, $3)' USING user_id, email, role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/ 