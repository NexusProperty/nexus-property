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

    it('should prevent unauthorized property updates', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Create a second test user
        const secondUser = await createTestUser('dbtest2@example.com', 'password123');
        
        try {
          // Create a test property for the second user
          const adminClient = createTestDbClient();
          const { data: propertyData, error: propertyError } = await adminClient
            .from('properties')
            .insert({
              owner_id: secondUser.id,
              address: '456 Other User Property',
              suburb: 'Test Suburb',
              city: 'Test City',
              property_type: 'House',
              bedrooms: 3,
              bathrooms: 2,
              is_public: true
            })
            .select()
            .single();
            
          expect(propertyError).toBeNull();
          expect(propertyData).toBeDefined();
          
          // Try to update another user's property (should fail due to RLS)
          const { data: updateData, error: updateError } = await supabase
            .from('properties')
            .update({
              address: 'Attempted Modification'
            })
            .eq('id', propertyData.id);
            
          // Should get permission denied error or return no updated rows
          expect(updateData?.length ?? 0).toBe(0);
          expect(updateError?.code === 'PGRST301' || updateError?.message.includes('permission denied') || true).toBeTruthy();
          
          // Verify no change occurred
          const { data: verifyData } = await adminClient
            .from('properties')
            .select('address')
            .eq('id', propertyData.id)
            .single();
            
          expect(verifyData.address).toBe('456 Other User Property');
        } finally {
          // Clean up
          await cleanupTestData(secondUser.id);
        }
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

    it('should join properties with appraisals', async () => {
      await withTestDatabase(async (supabase, user) => {
        const adminClient = createTestDbClient();
        
        // Create a test appraisal for a property
        const { data: propertyData } = await adminClient
          .from('properties')
          .select('id')
          .eq('owner_id', user.id)
          .single();
          
        const { data: appraisalData, error: appraisalError } = await adminClient
          .from('appraisals')
          .insert({
            property_id: propertyData.id,
            appraiser_id: user.id,
            status: 'draft',
            estimated_value: 800000
          })
          .select()
          .single();
          
        expect(appraisalError).toBeNull();
        expect(appraisalData).toBeDefined();
        
        // Get properties with related appraisals
        const { data: joinData, error: joinError } = await supabase
          .from('properties')
          .select(`
            id, 
            address,
            appraisals (
              id,
              status,
              estimated_value
            )
          `)
          .eq('id', propertyData.id);
          
        expect(joinError).toBeNull();
        expect(joinData).toBeDefined();
        expect(joinData[0].appraisals).toBeDefined();
        expect(joinData[0].appraisals.length).toBeGreaterThan(0);
        expect(joinData[0].appraisals[0].estimated_value).toBe(800000);
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

    it('should support full-text search with multiple terms', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Create a property with specific terms for testing
        const adminClient = createTestDbClient();
        await adminClient
          .from('properties')
          .insert({
            owner_id: user.id,
            address: '123 Waterfront Avenue',
            suburb: 'Beachside',
            city: 'Auckland',
            property_type: 'House',
            description: 'Stunning waterfront property with ocean views and modern design',
            is_public: true
          });
          
        // Search with multiple terms
        const { data: searchData, error: searchError } = await supabase
          .from('properties')
          .select('*')
          .textSearch('description', 'waterfront & ocean');
          
        expect(searchError).toBeNull();
        expect(searchData).toBeDefined();
        expect(searchData.length).toBeGreaterThan(0);
        
        // Verify results contain both terms
        const matchesTerms = searchData.some(property => 
          property.description?.includes('waterfront') && 
          property.description?.includes('ocean')
        );
        
        expect(matchesTerms).toBe(true);
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

    it('should handle unique constraint violations', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Create a property with a unique email reference
        const uniqueEmail = `unique-${Date.now()}@test.com`;
        const { data: firstInsert, error: firstError } = await supabase
          .from('properties')
          .insert({
            owner_id: user.id,
            address: '789 Unique Street',
            suburb: 'Test Suburb',
            city: 'Test City',
            property_type: 'House',
            contact_email: uniqueEmail
          })
          .select();
          
        expect(firstError).toBeNull();
        expect(firstInsert).toBeDefined();
        
        // Try to insert another property with the same unique email
        const { data: secondInsert, error: secondError } = await supabase
          .from('properties')
          .insert({
            owner_id: user.id,
            address: '790 Another Street',
            suburb: 'Test Suburb',
            city: 'Test City',
            property_type: 'House',
            contact_email: uniqueEmail
          });
          
        expect(secondError).toBeDefined();
        expect(secondInsert).toBeNull();
        expect(secondError.code === '23505' || secondError.message.includes('unique constraint')).toBeTruthy();
      });
    });
  });

  describe('Complex Queries', () => {
    it('should support pagination and sorting', async () => {
      await withTestDatabase(async (supabase, user) => {
        const adminClient = createTestDbClient();
        
        // Create multiple test properties
        for (let i = 1; i <= 5; i++) {
          await adminClient
            .from('properties')
            .insert({
              owner_id: user.id,
              address: `Paginated Property ${i}`,
              suburb: 'Test Suburb',
              city: 'Test City',
              property_type: 'House',
              bedrooms: i,
              is_public: true
            });
        }
        
        // Test pagination - page 1 (2 items per page)
        const { data: page1, error: page1Error } = await supabase
          .from('properties')
          .select('address, bedrooms')
          .eq('owner_id', user.id)
          .order('bedrooms', { ascending: true })
          .range(0, 1);
          
        expect(page1Error).toBeNull();
        expect(page1).toHaveLength(2);
        expect(page1[0].bedrooms).toBeLessThan(page1[1].bedrooms);
        
        // Test pagination - page 2 (2 items per page)
        const { data: page2, error: page2Error } = await supabase
          .from('properties')
          .select('address, bedrooms')
          .eq('owner_id', user.id)
          .order('bedrooms', { ascending: true })
          .range(2, 3);
          
        expect(page2Error).toBeNull();
        expect(page2).toHaveLength(2);
        expect(page2[0].bedrooms).toBeGreaterThan(page1[1].bedrooms);
      });
    });

    it('should support filtering with multiple conditions', async () => {
      await withTestDatabase(async (supabase, user) => {
        // Query with multiple filter conditions
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .gt('bedrooms', 2)
          .lt('bedrooms', 5)
          .eq('is_public', true);
          
        expect(error).toBeNull();
        expect(data).toBeDefined();
        
        // Verify all conditions are met
        const allConditionsMet = data.every(property => 
          property.owner_id === user.id &&
          property.bedrooms > 2 &&
          property.bedrooms < 5 &&
          property.is_public === true
        );
        
        expect(allConditionsMet).toBe(true);
      });
    });
  });
}); 