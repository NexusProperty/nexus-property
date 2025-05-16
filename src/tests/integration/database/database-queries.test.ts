import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { setupTestDatabase, safeDbQuery } from '@/tests/utils/database-test-utils';
import { createMockUser } from '@/tests/utils/supabase-test-utils';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}));

describe('Database Queries Integration Tests', () => {
  // Set up test database
  let testDb: Awaited<ReturnType<typeof setupTestDatabase>>;

  beforeEach(async () => {
    vi.resetAllMocks();
    testDb = await setupTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('Property Queries', () => {
    it('should retrieve a property by ID', async () => {
      // Arrange - Authentication setup
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: createMockUser({ user_metadata: { role: 'agent' } })
          }
        },
        error: null
      });

      // Act - Query for property
      const result = await safeDbQuery(
        () => supabase.from('properties').select().eq('id', 'test-property-id-1').single(),
        'Failed to get property'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('test-property-id-1');
      expect(result.address).toBe('123 Test Street');
    });

    it('should return all properties for a user', async () => {
      // Arrange
      const userId = 'test-user-id-1';
      
      // Seed additional test data for this test
      await testDb.seedData('properties', [
        ...testDb.getMockData('properties'),
        {
          id: 'test-property-id-3',
          address: '789 User Street',
          city: 'Auckland',
          bedrooms: 2,
          bathrooms: 1,
          land_size: 400,
          user_id: userId,
          created_at: '2023-01-03T00:00:00.000Z',
        }
      ]);

      // Act
      const result = await safeDbQuery(
        () => supabase.from('properties').select().eq('user_id', userId),
        'Failed to get user properties'
      );

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(prop => prop.user_id === userId)).toBe(true);
    });

    it('should create a new property', async () => {
      // Arrange
      const newProperty = {
        address: '456 New Street',
        suburb: 'New Suburb',
        city: 'Wellington',
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        land_size: 0, // apartment
        floor_area: 85,
        year_built: 2015,
        user_id: 'test-user-id-1'
      };

      // Act
      const result = await safeDbQuery(
        () => supabase.from('properties').insert(newProperty),
        'Failed to create property'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.address).toBe(newProperty.address);
      expect(result.city).toBe(newProperty.city);
      
      // Verify property was added to the database
      const properties = testDb.getMockData('properties');
      const createdProperty = properties.find(p => p.address === newProperty.address);
      expect(createdProperty).toBeDefined();
    });

    it('should update a property', async () => {
      // Arrange
      const propertyId = 'test-property-id-1';
      const updates = {
        address: '123 Updated Street',
        bedrooms: 4
      };

      // Act
      const result = await safeDbQuery(
        () => supabase.from('properties').update(updates).eq('id', propertyId),
        'Failed to update property'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(propertyId);
      expect(result.address).toBe(updates.address);
      expect(result.bedrooms).toBe(updates.bedrooms);
      
      // Verify property was updated in the database
      const properties = testDb.getMockData('properties');
      const updatedProperty = properties.find(p => p.id === propertyId);
      expect(updatedProperty?.address).toBe(updates.address);
      expect(updatedProperty?.bedrooms).toBe(updates.bedrooms);
    });

    it('should delete a property', async () => {
      // Arrange
      const propertyId = 'test-property-id-2';
      
      // Act
      const result = await safeDbQuery(
        () => supabase.from('properties').delete().eq('id', propertyId),
        'Failed to delete property'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(propertyId);
      
      // Verify property was deleted from the database
      const properties = testDb.getMockData('properties');
      const deletedProperty = properties.find(p => p.id === propertyId);
      expect(deletedProperty).toBeUndefined();
    });
  });

  describe('Appraisal Queries', () => {
    it('should retrieve an appraisal by ID', async () => {
      // Act
      const result = await safeDbQuery(
        () => supabase.from('appraisals').select().eq('id', 'test-appraisal-id-1').single(),
        'Failed to get appraisal'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('test-appraisal-id-1');
      expect(result.property_id).toBe('test-property-id-1');
    });

    it('should retrieve all appraisals for a property', async () => {
      // Arrange
      const propertyId = 'test-property-id-1';

      // Seed additional test data for this test
      await testDb.seedData('appraisals', [
        ...testDb.getMockData('appraisals'),
        {
          id: 'test-appraisal-id-3',
          property_id: propertyId,
          user_id: 'test-user-id-1',
          status: 'pending',
          created_at: '2023-02-03T00:00:00.000Z',
        }
      ]);

      // Act
      const result = await safeDbQuery(
        () => supabase.from('appraisals').select().eq('property_id', propertyId),
        'Failed to get property appraisals'
      );

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(1);
      expect(result.every(appraisal => appraisal.property_id === propertyId)).toBe(true);
    });
    
    it('should create a new appraisal', async () => {
      // Arrange
      const newAppraisal = {
        property_id: 'test-property-id-2',
        user_id: 'test-user-id-1',
        status: 'pending',
        notes: 'Test appraisal notes'
      };

      // Act
      const result = await safeDbQuery(
        () => supabase.from('appraisals').insert(newAppraisal),
        'Failed to create appraisal'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.property_id).toBe(newAppraisal.property_id);
      expect(result.status).toBe(newAppraisal.status);
      
      // Verify appraisal was added to the database
      const appraisals = testDb.getMockData('appraisals');
      const createdAppraisal = appraisals.find(a => 
        a.property_id === newAppraisal.property_id && 
        a.user_id === newAppraisal.user_id && 
        a.status === newAppraisal.status
      );
      expect(createdAppraisal).toBeDefined();
    });

    it('should update an appraisal status', async () => {
      // Arrange
      const appraisalId = 'test-appraisal-id-2';
      const updates = {
        status: 'completed',
        valuation_low: 700000,
        valuation_high: 780000,
        valuation_confidence: 80
      };

      // Act
      const result = await safeDbQuery(
        () => supabase.from('appraisals').update(updates).eq('id', appraisalId),
        'Failed to update appraisal'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(appraisalId);
      expect(result.status).toBe(updates.status);
      expect(result.valuation_low).toBe(updates.valuation_low);
      
      // Verify appraisal was updated in the database
      const appraisals = testDb.getMockData('appraisals');
      const updatedAppraisal = appraisals.find(a => a.id === appraisalId);
      expect(updatedAppraisal?.status).toBe(updates.status);
      expect(updatedAppraisal?.valuation_low).toBe(updates.valuation_low);
    });
  });

  describe('Comparable Properties Queries', () => {
    it('should retrieve comparable properties for an appraisal', async () => {
      // Arrange
      const appraisalId = 'test-appraisal-id-1';
      
      // Act
      const result = await safeDbQuery(
        () => supabase.from('comparable_properties').select().eq('appraisal_id', appraisalId),
        'Failed to get comparable properties'
      );
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // We expect 2 from our test data
      expect(result.every(prop => prop.appraisal_id === appraisalId)).toBe(true);
    });
    
    it('should add a comparable property to an appraisal', async () => {
      // Arrange
      const appraisalId = 'test-appraisal-id-1';
      const newComparable = {
        appraisal_id: appraisalId,
        address: '132 Comp Street',
        city: 'Auckland',
        sale_price: 850000,
        sale_date: '2023-02-01T00:00:00.000Z',
        similarity_score: 87
      };
      
      // Act
      const result = await safeDbQuery(
        () => supabase.from('comparable_properties').insert(newComparable),
        'Failed to add comparable property'
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result.address).toBe(newComparable.address);
      expect(result.sale_price).toBe(newComparable.sale_price);
      
      // Verify comparable was added to the database
      const comparables = testDb.getMockData('comparable_properties');
      expect(comparables.length).toBe(3); // 2 existing + 1 new
      
      const addedComparable = comparables.find(c => c.address === newComparable.address);
      expect(addedComparable).toBeDefined();
      expect(addedComparable?.appraisal_id).toBe(appraisalId);
    });
  });

  describe('Reports Queries', () => {
    it('should retrieve reports for an appraisal', async () => {
      // Arrange
      const appraisalId = 'test-appraisal-id-1';
      
      // Act
      const result = await safeDbQuery(
        () => supabase.from('reports').select().eq('appraisal_id', appraisalId),
        'Failed to get appraisal reports'
      );
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1); // We expect 1 from our test data
      expect(result[0].appraisal_id).toBe(appraisalId);
    });
    
    it('should create a new report', async () => {
      // Arrange
      const newReport = {
        appraisal_id: 'test-appraisal-id-2',
        user_id: 'test-user-id-2',
        url: 'https://example.com/reports/new-report.pdf',
        created_at: '2023-02-15T00:00:00.000Z',
        expires_at: '2023-03-15T00:00:00.000Z'
      };
      
      // Act
      const result = await safeDbQuery(
        () => supabase.from('reports').insert(newReport),
        'Failed to create report'
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result.appraisal_id).toBe(newReport.appraisal_id);
      expect(result.url).toBe(newReport.url);
      
      // Verify report was added to the database
      const reports = testDb.getMockData('reports');
      expect(reports.length).toBe(2); // 1 existing + 1 new
      
      const createdReport = reports.find(r => r.appraisal_id === newReport.appraisal_id);
      expect(createdReport).toBeDefined();
      expect(createdReport?.url).toBe(newReport.url);
    });
  });
}); 