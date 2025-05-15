import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createTestDbClient, 
  createTestUser, 
  cleanupTestData,
  withTestDatabase
} from './database-test-config';

// Skip these tests by default since they require a real Supabase instance
// Run with `npm test -- -t "Isolated Database Tests" --no-skip` to execute
describe.skip('Isolated Database Tests', () => {
  // This test suite requires a running Supabase instance
  // It will interact with a real database using environment variables
  
  describe('Basic Database Operations', () => {
    let testUserId: string;
    
    // Set up test user before tests
    beforeAll(async () => {
      try {
        const testUser = await createTestUser('dbtest@example.com', 'password123');
        testUserId = testUser.id;
      } catch (err) {
        console.error('Failed to create test user:', err);
        throw err;
      }
    });
    
    // Clean up test user after tests
    afterAll(async () => {
      if (testUserId) {
        await cleanupTestData(testUserId);
      }
    });
    
    // Test basic database operations
    it('should create, read, update, and delete a property', async () => {
      const supabase = createTestDbClient();
      
      // 1. CREATE: Insert a test property
      const propertyData = {
        owner_id: testUserId,
        address: '789 Test Boulevard',
        suburb: 'Test Suburb',
        city: 'Test City',
        property_type: 'Townhouse',
        bedrooms: 3,
        bathrooms: 2
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(insertData).toBeDefined();
      expect(insertData.address).toBe('789 Test Boulevard');
      
      const propertyId = insertData.id;
      
      // 2. READ: Fetch the created property
      const { data: readData, error: readError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      expect(readError).toBeNull();
      expect(readData).toBeDefined();
      expect(readData.id).toBe(propertyId);
      expect(readData.address).toBe('789 Test Boulevard');
      
      // 3. UPDATE: Modify the property
      const { data: updateData, error: updateError } = await supabase
        .from('properties')
        .update({
          address: '789 Modified Boulevard',
          bedrooms: 4
        })
        .eq('id', propertyId)
        .select()
        .single();
      
      expect(updateError).toBeNull();
      expect(updateData).toBeDefined();
      expect(updateData.address).toBe('789 Modified Boulevard');
      expect(updateData.bedrooms).toBe(4);
      
      // 4. DELETE: Remove the property
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      expect(deleteError).toBeNull();
      
      // Verify deletion
      const { data: verifyData, error: verifyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId);
      
      expect(verifyError).toBeNull();
      expect(verifyData).toHaveLength(0);
    });
  });
  
  describe('Row Level Security', () => {
    it('should enforce RLS policies', async () => {
      await withTestDatabase(async (supabase, user) => {
        // First, get all public properties (should succeed)
        const { data: publicData, error: publicError } = await supabase
          .from('properties')
          .select('*')
          .eq('is_public', true);
          
        expect(publicError).toBeNull();
        expect(publicData).toBeDefined();
        expect(publicData.length).toBeGreaterThan(0);
        
        // Try to get non-public properties of another user (should return empty)
        const { data: otherUserData, error: otherUserError } = await supabase
          .from('properties')
          .select('*')
          .eq('is_public', false)
          .neq('owner_id', user.id);
          
        expect(otherUserError).toBeNull();
        expect(otherUserData).toHaveLength(0); // RLS should prevent seeing these
        
        // Try to get own private properties (should succeed)
        const { data: privateData, error: privateError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .eq('is_public', false);
          
        expect(privateError).toBeNull();
        expect(privateData).toBeDefined();
        expect(privateData.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Database Joins', () => {
    it('should correctly join related tables', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Get properties with user profiles data
        const { data: joinData, error: joinError } = await supabase
          .from('properties')
          .select(`
            id, 
            address,
            profiles:owner_id (
              id,
              email
            )
          `)
          .eq('owner_id', user.id);
          
        expect(joinError).toBeNull();
        expect(joinData).toBeDefined();
        expect(joinData.length).toBeGreaterThan(0);
        
        // Check join worked correctly
        const property = joinData[0];
        expect(property.profiles).toBeDefined();
        expect(property.profiles.id).toBe(user.id);
      });
    });
  });
  
  describe('Text Search', () => {
    it('should correctly perform text search', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Search for properties by text
        const { data: searchData, error: searchError } = await supabase
          .from('properties')
          .select('*')
          .textSearch('address', 'Test');
          
        expect(searchError).toBeNull();
        expect(searchData).toBeDefined();
        expect(searchData.length).toBeGreaterThan(0);
        
        // Verify search results
        const matchesTest = searchData.every(property => 
          property.address.includes('Test')
        );
        
        expect(matchesTest).toBe(true);
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should handle database constraint errors correctly', async () => {
      await withTestDatabase(async (supabase) => {
        // Attempt to create property with missing required fields
        const { data, error } = await supabase
          .from('properties')
          .insert({
            // Missing owner_id, address, and other required fields
            suburb: 'Test Suburb'
          });
          
        expect(error).toBeDefined();
        expect(data).toBeNull();
        expect(error.code).toBeDefined();
      });
    });
  });
}); 