# Database Testing Guide for AppraisalHub

This document provides a comprehensive guide to database testing in the AppraisalHub application, including mock-based testing and isolated database testing.

## Overview

The AppraisalHub application uses Supabase as its primary database provider. Our testing strategy for database interactions follows two main approaches:

1. **Mock-based testing** - Uses mock implementations of the Supabase client for most unit and integration tests
2. **Isolated database testing** - Connects to a real Supabase instance for comprehensive integration testing

## Mock-Based Database Testing

Mock-based testing is our primary approach for testing database interactions during development and in CI pipelines. This approach is fast, doesn't require an actual database connection, and allows for precise control over test scenarios.

### Implementation

We use Vitest's mocking capabilities to create a mock Supabase client that simulates database operations without making actual network requests. The mock implementation is available in `src/tests/integration/database-queries.test.ts`.

### Example Mock Structure

```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: [{ id: 'test-id', name: 'Test Item' }],
          error: null
        }),
        // ...other query methods
      }),
      insert: vi.fn().mockReturnValue({
        // ...insert response
      }),
      // ...other database methods
    }),
    // ...other Supabase client methods
  })
}));
```

### Testing Database Queries

Using the mock Supabase client, we can test various database operations:

#### SELECT Queries

```typescript
it('should correctly format select queries', async () => {
  const selectSpy = vi.spyOn(supabase.from('properties'), 'select');
  
  await supabase
    .from('properties')
    .select('id, address, city');
  
  expect(selectSpy).toHaveBeenCalledWith('id, address, city');
});
```

#### INSERT Queries

```typescript
it('should correctly format insert queries', async () => {
  const insertSpy = vi.spyOn(supabase.from('properties'), 'insert');
  
  await supabase
    .from('properties')
    .insert({ /* property data */ });
  
  expect(insertSpy).toHaveBeenCalledWith({ /* expected data */ });
});
```

#### Filtering and Complex Queries

```typescript
it('should handle combining multiple filters', async () => {
  const selectSpy = vi.spyOn(supabase.from('properties'), 'select');
  const eqSpy = vi.spyOn(supabase.from('properties').select(), 'eq');
  const gteSpy = vi.spyOn(supabase.from('properties').select(), 'gte');
  
  await supabase
    .from('properties')
    .select('*')
    .eq('city', 'Auckland')
    .gte('bedrooms', 3);
  
  expect(selectSpy).toHaveBeenCalledWith('*');
  expect(eqSpy).toHaveBeenCalledWith('city', 'Auckland');
  expect(gteSpy).toHaveBeenCalledWith('bedrooms', 3);
});
```

## Isolated Database Testing

While mock-based testing is valuable for most scenarios, testing against a real database provides stronger guarantees about the correctness of our code, especially for complex queries, Row Level Security (RLS) policies, and database constraints.

### Configuration

We've implemented a configuration for isolated database testing in `src/tests/integration/database-test-config.ts`. This configuration handles:

1. Connection to a test Supabase instance
2. Test user creation and authentication
3. Test data setup and cleanup
4. Utility functions for database testing

### Environment Variables

To run isolated database tests, you need to set the following environment variables:

```
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key
TEST_SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=secure-test-password
```

For local development, you can use the local Supabase instance running on `http://localhost:54321`.

### Test Utilities

The database test configuration provides several utilities:

- `createTestDbClient()`: Creates a Supabase client for the test database
- `createTestAdminClient()`: Creates a service role client for admin operations
- `createTestUser()`: Creates a test user in the auth system
- `cleanupTestData()`: Removes test data after tests
- `withTestDatabase()`: Helper function that sets up and tears down a test environment

### Sample Test Structure

```typescript
describe('Isolated Database Tests', () => {
  // Skip by default to avoid requiring a real database for regular tests
  describe.skip('Basic Database Operations', () => {
    it('should create, read, update, and delete a property', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Test code using real database connection
        // ...
      });
    });
  });
});
```

### Testing Row Level Security (RLS)

One of the primary benefits of isolated database testing is the ability to test Row Level Security policies:

```typescript
it('should enforce RLS policies', async () => {
  await withTestDatabase(async (supabase, user) => {
    // First, get all public properties (should succeed)
    const { data: publicData, error: publicError } = await supabase
      .from('properties')
      .select('*')
      .eq('is_public', true);
      
    expect(publicError).toBeNull();
    expect(publicData.length).toBeGreaterThan(0);
    
    // Try to get private properties of another user (should return empty)
    const { data: otherUserData, error: otherUserError } = await supabase
      .from('properties')
      .select('*')
      .eq('is_public', false)
      .neq('owner_id', user.id);
      
    expect(otherUserError).toBeNull();
    expect(otherUserData).toHaveLength(0); // RLS should prevent seeing these
  });
});
```

## Integration with pgTAP for Database Testing

For testing database components like triggers, functions, and RLS policies directly, we use pgTAP, a PostgreSQL extension for unit testing. These tests are stored in the `supabase/tests` directory.

### Sample pgTAP Test

```sql
BEGIN;

-- Load the pgTAP extension
SELECT plan(3);

-- Create test users
SELECT lives_ok(
  $$
    INSERT INTO auth.users VALUES 
    ('test-user-id', 'test@example.com');
  $$,
  'Create test user'
);

-- Test RLS policy
SELECT results_eq(
  $$
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = 'test-user-id';
    SELECT count(*) FROM properties WHERE owner_id = 'test-user-id';
  $$,
  $$SELECT 1::bigint$$,
  'Owner can view their own property'
);

-- Finish the test
SELECT * FROM finish();
ROLLBACK;
```

### Running pgTAP Tests

pgTAP tests can be run using the Supabase CLI:

```bash
supabase test db --test-name properties_rls_policies
```

## Best Practices

1. **Use mock-based testing for most scenarios**: Mock-based testing is faster and doesn't require a database connection.

2. **Use isolated database testing for complex scenarios**: Use isolated database testing for complex queries, RLS policies, and database constraints.

3. **Use pgTAP for database-specific testing**: Use pgTAP for testing database components directly.

4. **Clean up test data**: Always clean up test data after tests to avoid polluting the database.

5. **Isolate test environments**: Use separate databases for development, testing, and production.

6. **Test RLS policies thoroughly**: RLS policies are critical for data security and should be tested thoroughly.

7. **Test error handling**: Test how the application handles database errors.

## Conclusion

A comprehensive database testing strategy is essential for ensuring the reliability and security of the AppraisalHub application. By combining mock-based testing, isolated database testing, and pgTAP, we can ensure that our database interactions work correctly in all scenarios. 