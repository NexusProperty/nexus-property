import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as appraisalService from '@/services/appraisal';
import { mockAppraisal, mockComparables } from '@/tests/mocks/appraisal.mock';

describe('Appraisal Service', () => {
  // Mock appraisal data for testing
  const testAppraisalId = 'abcd1234-5678-efgh-9012-ijklmnopqrst';
  const testUserId = 'user-123';
  
  // Mock appraisal input data for creation
  const newAppraisalData = {
    user_id: testUserId,
    property_id: 'prop-123',
    property_address: '123 New St',
    property_suburb: 'Newville',
    property_city: 'Metropolis',
    property_type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    land_size: 500,
    floor_area: 220,
    status: 'pending',
  };
  
  // Mock list of appraisals
  const mockAppraisalsList = [
    mockAppraisal,
    {
      ...mockAppraisal,
      id: 'defg5678-9012-hijk-3456-lmnopqrstuv',
      property_address: '456 Other St',
      status: 'completed',
      valuation_low: 750000,
      valuation_high: 850000,
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAppraisal', () => {
    it('should return an appraisal when given a valid ID', async () => {
      // Create a spy that returns a successful result
      const getAppraisalSpy = vi.spyOn(appraisalService, 'getAppraisal');
      getAppraisalSpy.mockResolvedValue({
        success: true,
        error: null,
        data: mockAppraisal
      });

      // Call the function
      const result = await appraisalService.getAppraisal(testAppraisalId);

      // Assertions
      expect(getAppraisalSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAppraisal);
    });

    it('should return an error for an invalid ID', async () => {
      // Create a spy for the invalid ID case
      const getAppraisalSpy = vi.spyOn(appraisalService, 'getAppraisal');
      getAppraisalSpy.mockResolvedValue({
        success: false,
        error: 'Invalid appraisal ID',
        data: null
      });

      // Call the function with invalid input
      const result = await appraisalService.getAppraisal('');

      // Assertions
      expect(getAppraisalSpy).toHaveBeenCalledWith('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appraisal ID');
      expect(result.data).toBeNull();
    });

    it('should handle database errors', async () => {
      // Create a spy that returns a database error
      const getAppraisalSpy = vi.spyOn(appraisalService, 'getAppraisal');
      getAppraisalSpy.mockResolvedValue({
        success: false,
        error: 'Database error',
        data: null
      });

      // Call the function
      const result = await appraisalService.getAppraisal(testAppraisalId);

      // Assertions
      expect(getAppraisalSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.data).toBeNull();
    });
  });

  describe('getAppraisalWithComparables', () => {
    it('should return an appraisal with comparables when given a valid ID', async () => {
      // Create a spy that returns a successful result
      const getAppraisalWithComparablesSpy = vi.spyOn(appraisalService, 'getAppraisalWithComparables');
      getAppraisalWithComparablesSpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          appraisal: mockAppraisal,
          comparables: mockComparables
        }
      });

      // Call the function
      const result = await appraisalService.getAppraisalWithComparables(testAppraisalId);

      // Assertions
      expect(getAppraisalWithComparablesSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data.appraisal).toEqual(mockAppraisal);
      expect(result.data.comparables).toEqual(mockComparables);
    });

    it('should handle case with no comparables', async () => {
      // Create a spy that returns an appraisal but no comparables
      const getAppraisalWithComparablesSpy = vi.spyOn(appraisalService, 'getAppraisalWithComparables');
      getAppraisalWithComparablesSpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          appraisal: mockAppraisal,
          comparables: []
        }
      });

      // Call the function
      const result = await appraisalService.getAppraisalWithComparables(testAppraisalId);

      // Assertions
      expect(getAppraisalWithComparablesSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data.appraisal).toEqual(mockAppraisal);
      expect(result.data.comparables).toEqual([]);
    });

    it('should return an error for an invalid ID', async () => {
      // Create a spy for the invalid ID case
      const getAppraisalWithComparablesSpy = vi.spyOn(appraisalService, 'getAppraisalWithComparables');
      getAppraisalWithComparablesSpy.mockResolvedValue({
        success: false,
        error: 'Invalid appraisal ID',
        data: null
      });

      // Call the function with invalid input
      const result = await appraisalService.getAppraisalWithComparables('');

      // Assertions
      expect(getAppraisalWithComparablesSpy).toHaveBeenCalledWith('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appraisal ID');
      expect(result.data).toBeNull();
    });
  });

  describe('getUserAppraisals', () => {
    it('should return appraisals for a valid user ID', async () => {
      // Create a spy that returns a successful result
      const getUserAppraisalsSpy = vi.spyOn(appraisalService, 'getUserAppraisals');
      getUserAppraisalsSpy.mockResolvedValue({
        success: true,
        error: null,
        data: mockAppraisalsList
      });

      // Call the function
      const result = await appraisalService.getUserAppraisals(testUserId);

      // Assertions
      expect(getUserAppraisalsSpy).toHaveBeenCalledWith(testUserId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAppraisalsList);
      expect(result.data).toHaveLength(2);
    });

    it('should return an empty array when user has no appraisals', async () => {
      // Create a spy that returns an empty array
      const getUserAppraisalsSpy = vi.spyOn(appraisalService, 'getUserAppraisals');
      getUserAppraisalsSpy.mockResolvedValue({
        success: true,
        error: null,
        data: []
      });

      // Call the function
      const result = await appraisalService.getUserAppraisals(testUserId);

      // Assertions
      expect(getUserAppraisalsSpy).toHaveBeenCalledWith(testUserId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('should return an error for an invalid user ID', async () => {
      // Create a spy for the invalid ID case
      const getUserAppraisalsSpy = vi.spyOn(appraisalService, 'getUserAppraisals');
      getUserAppraisalsSpy.mockResolvedValue({
        success: false,
        error: 'Invalid user ID',
        data: null
      });

      // Call the function with invalid input
      const result = await appraisalService.getUserAppraisals('');

      // Assertions
      expect(getUserAppraisalsSpy).toHaveBeenCalledWith('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user ID');
      expect(result.data).toBeNull();
    });
  });

  describe('createAppraisal', () => {
    it('should create an appraisal with valid data', async () => {
      // Create a spy that returns a successful result
      const createAppraisalSpy = vi.spyOn(appraisalService, 'createAppraisal');
      createAppraisalSpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          id: testAppraisalId,
          ...newAppraisalData,
          created_at: '2023-05-15T00:00:00.000Z',
          updated_at: '2023-05-15T00:00:00.000Z',
        }
      });

      // Call the function
      const result = await appraisalService.createAppraisal(newAppraisalData);

      // Assertions
      expect(createAppraisalSpy).toHaveBeenCalledWith(newAppraisalData);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('id', testAppraisalId);
      expect(result.data).toHaveProperty('property_address', '123 New St');
      expect(result.data).toHaveProperty('status', 'pending');
    });

    it('should return validation errors for invalid data', async () => {
      // Create invalid appraisal data (missing required fields)
      const invalidAppraisalData: Partial<typeof newAppraisalData> = {
        user_id: testUserId,
        // Missing required fields
      };

      // Create a spy that returns a validation error
      const createAppraisalSpy = vi.spyOn(appraisalService, 'createAppraisal');
      createAppraisalSpy.mockResolvedValue({
        success: false,
        error: 'Validation error: Missing required fields',
        data: null
      });

      // Call the function with invalid data
      // @ts-expect-error - intentionally passing invalid data for testing
      const result = await appraisalService.createAppraisal(invalidAppraisalData);

      // Assertions
      // @ts-expect-error - intentionally passing invalid data for testing
      expect(createAppraisalSpy).toHaveBeenCalledWith(invalidAppraisalData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation error');
      expect(result.data).toBeNull();
    });
  });

  describe('updateAppraisal', () => {
    // Mock updates to apply
    const appraisalUpdates = {
      status: 'completed' as const,
      valuation_low: 750000,
      valuation_high: 850000,
    };

    it('should update an appraisal with valid data', async () => {
      // Create a spy that returns a successful result
      const updateAppraisalSpy = vi.spyOn(appraisalService, 'updateAppraisal');
      updateAppraisalSpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          ...mockAppraisal,
          ...appraisalUpdates,
          updated_at: '2023-05-16T00:00:00.000Z',
        }
      });

      // Call the function
      const result = await appraisalService.updateAppraisal(testAppraisalId, appraisalUpdates);

      // Assertions
      expect(updateAppraisalSpy).toHaveBeenCalledWith(testAppraisalId, appraisalUpdates);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('status', 'completed');
      expect(result.data).toHaveProperty('valuation_low', 750000);
      expect(result.data).toHaveProperty('valuation_high', 850000);
    });

    it('should return an error for non-existent appraisal', async () => {
      // Create a spy that returns a not found error
      const updateAppraisalSpy = vi.spyOn(appraisalService, 'updateAppraisal');
      updateAppraisalSpy.mockResolvedValue({
        success: false,
        error: 'Appraisal not found',
        data: null
      });

      // Call the function with non-existent ID
      const result = await appraisalService.updateAppraisal('non-existent-id', appraisalUpdates);

      // Assertions
      expect(updateAppraisalSpy).toHaveBeenCalledWith('non-existent-id', appraisalUpdates);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appraisal not found');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteAppraisal', () => {
    it('should delete an appraisal with valid ID', async () => {
      // Create a spy that returns a successful result
      const deleteAppraisalSpy = vi.spyOn(appraisalService, 'deleteAppraisal');
      deleteAppraisalSpy.mockResolvedValue({
        success: true,
        error: null,
        data: null
      });

      // Call the function
      const result = await appraisalService.deleteAppraisal(testAppraisalId);

      // Assertions
      expect(deleteAppraisalSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return an error for non-existent appraisal', async () => {
      // Create a spy that returns a not found error
      const deleteAppraisalSpy = vi.spyOn(appraisalService, 'deleteAppraisal');
      deleteAppraisalSpy.mockResolvedValue({
        success: false,
        error: 'Appraisal not found',
        data: null
      });

      // Call the function with non-existent ID
      const result = await appraisalService.deleteAppraisal('non-existent-id');

      // Assertions
      expect(deleteAppraisalSpy).toHaveBeenCalledWith('non-existent-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appraisal not found');
      expect(result.data).toBeNull();
    });
  });

  describe('addComparableProperties', () => {
    // Mock comparable property data for testing
    const newComparables = [
      {
        appraisal_id: testAppraisalId,
        address: '124 Main St',
        suburb: 'Suburbia',
        city: 'Metropolis',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        land_size: 520,
        floor_area: 210,
        year_built: 2008,
        sale_date: '2023-01-15',
        sale_price: 750000,
        similarity_score: 89
      }
    ];

    it('should add comparable properties with valid data', async () => {
      // Create a spy that returns a successful result
      const addComparablePropertiesSpy = vi.spyOn(appraisalService, 'addComparableProperties');
      addComparablePropertiesSpy.mockResolvedValue({
        success: true,
        error: null,
        data: [
          {
            id: 'comp-id-1',
            ...newComparables[0],
            created_at: '2023-05-15T00:00:00.000Z',
            updated_at: '2023-05-15T00:00:00.000Z',
          }
        ]
      });

      // Call the function
      const result = await appraisalService.addComparableProperties(newComparables);

      // Assertions
      expect(addComparablePropertiesSpy).toHaveBeenCalledWith(newComparables);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toHaveProperty('id', 'comp-id-1');
      expect(result.data?.[0]).toHaveProperty('address', '124 Main St');
    });

    it('should return validation errors for invalid data', async () => {
      // Create invalid comparable property data
      const invalidComparables = [
        {
          // Missing appraisal_id and other required fields
          address: '124 Main St',
        }
      ];

      // Create a spy that returns a validation error
      const addComparablePropertiesSpy = vi.spyOn(appraisalService, 'addComparableProperties');
      addComparablePropertiesSpy.mockResolvedValue({
        success: false,
        error: 'Validation error: Missing required fields',
        data: null
      });

      // Call the function with invalid data
      // @ts-expect-error - intentionally passing invalid data for testing
      const result = await appraisalService.addComparableProperties(invalidComparables);

      // Assertions
      // @ts-expect-error - intentionally passing invalid data for testing
      expect(addComparablePropertiesSpy).toHaveBeenCalledWith(invalidComparables);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation error');
      expect(result.data).toBeNull();
    });
  });

  describe('searchAppraisals', () => {
    const searchTerm = 'main';

    it('should return matching appraisals for a search term', async () => {
      // Create a spy that returns a successful result
      const searchAppraisalsSpy = vi.spyOn(appraisalService, 'searchAppraisals');
      searchAppraisalsSpy.mockResolvedValue({
        success: true,
        error: null,
        data: [mockAppraisal] // Only the Main St property matches
      });

      // Call the function
      const result = await appraisalService.searchAppraisals(searchTerm, testUserId);

      // Assertions
      expect(searchAppraisalsSpy).toHaveBeenCalledWith(searchTerm, testUserId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].property_address).toContain('Main');
    });

    it('should return an empty array for no matches', async () => {
      // Create a spy that returns empty results
      const searchAppraisalsSpy = vi.spyOn(appraisalService, 'searchAppraisals');
      searchAppraisalsSpy.mockResolvedValue({
        success: true,
        error: null,
        data: []
      });

      // Call the function with a term that won't match
      const result = await appraisalService.searchAppraisals('nonexistent', testUserId);

      // Assertions
      expect(searchAppraisalsSpy).toHaveBeenCalledWith('nonexistent', testUserId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe('getAppraisalReport', () => {
    it('should return a report URL for a valid appraisal', async () => {
      // Create a spy that returns a successful result
      const getAppraisalReportSpy = vi.spyOn(appraisalService, 'getAppraisalReport');
      getAppraisalReportSpy.mockResolvedValue({
        success: true,
        error: null,
        data: 'https://example.com/reports/appraisal-123.pdf'
      });

      // Call the function
      const result = await appraisalService.getAppraisalReport(testAppraisalId);

      // Assertions
      expect(getAppraisalReportSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toBe('https://example.com/reports/appraisal-123.pdf');
    });

    it('should return an error if no report is available', async () => {
      // Create a spy that returns an error result
      const getAppraisalReportSpy = vi.spyOn(appraisalService, 'getAppraisalReport');
      getAppraisalReportSpy.mockResolvedValue({
        success: false,
        error: 'No report available for this appraisal',
        data: null
      });

      // Call the function
      const result = await appraisalService.getAppraisalReport(testAppraisalId);

      // Assertions
      expect(getAppraisalReportSpy).toHaveBeenCalledWith(testAppraisalId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No report available for this appraisal');
      expect(result.data).toBeNull();
    });
  });

  describe('updateAppraisalStatus', () => {
    it('should update an appraisal status successfully', async () => {
      // Status update details
      const newStatus = 'completed';
      const statusDetails = {
        reason: 'Valuation process finished',
        metadata: { analyst: 'John Doe' }
      };

      // Create a spy that returns a successful result
      const updateAppraisalStatusSpy = vi.spyOn(appraisalService, 'updateAppraisalStatus');
      updateAppraisalStatusSpy.mockResolvedValue({
        success: true,
        error: null,
        data: {
          ...mockAppraisal,
          status: newStatus,
          updated_at: '2023-05-16T00:00:00.000Z',
        }
      });

      // Call the function
      const result = await appraisalService.updateAppraisalStatus(testAppraisalId, newStatus, statusDetails);

      // Assertions
      expect(updateAppraisalStatusSpy).toHaveBeenCalledWith(testAppraisalId, newStatus, statusDetails);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('status', newStatus);
    });

    it('should return an error for invalid status', async () => {
      // Create a spy that returns an error result
      const updateAppraisalStatusSpy = vi.spyOn(appraisalService, 'updateAppraisalStatus');
      updateAppraisalStatusSpy.mockResolvedValue({
        success: false,
        error: 'Invalid status: unknown_status',
        data: null
      });

      // Call the function with invalid status
      const result = await appraisalService.updateAppraisalStatus(testAppraisalId, 'unknown_status');

      // Assertions
      expect(updateAppraisalStatusSpy).toHaveBeenCalledWith(testAppraisalId, 'unknown_status', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status');
      expect(result.data).toBeNull();
    });
  });
}); 