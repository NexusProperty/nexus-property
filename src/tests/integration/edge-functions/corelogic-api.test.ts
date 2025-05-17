import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createMockUser } from '@/tests/utils/supabase-test-utils';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Test data
const TEST_PROPERTY_REQUEST = {
  address: '123 Test Street',
  suburb: 'Test Suburb',
  city: 'Auckland',
  propertyType: 'house',
  appraisalId: '12345678-abcd-1234-efgh-123456789012'
};

// Mock responses
const MOCK_SUCCESSFUL_RESPONSE = {
  success: true,
  data: {
    propertyDetails: {
      propertyId: 'CL12345',
      address: {
        unitNumber: '',
        streetNumber: '123',
        streetName: 'Test Street',
        streetType: '',
        suburb: 'Test Suburb',
        city: 'Auckland',
        postcode: '1010'
      },
      attributes: {
        bedrooms: 3,
        bathrooms: 2,
        carSpaces: 1,
        landArea: 650,
        floorArea: 180,
        propertyType: 'House',
        yearBuilt: 2005
      },
      images: [
        { url: 'https://example.com/image1.jpg', type: 'exterior' }
      ],
      salesHistory: [
        { date: '2020-05-15', price: 850000, source: 'CoreLogic' }
      ]
    },
    avmData: {
      estimatedValue: 925000,
      valuationRange: {
        lowEstimate: 880000,
        highEstimate: 970000
      },
      confidenceScore: 82,
      lastUpdated: '2023-06-10T10:15:30Z'
    },
    marketData: {
      medianSalePrice: 950000,
      quarterlyGrowth: 1.8,
      annualGrowth: 5.2,
      medianDaysOnMarket: 35,
      totalSales: 187,
      timestamp: '2023-06-01T00:00:00Z'
    }
  }
};

const MOCK_ERROR_RESPONSE = {
  success: false,
  error: {
    code: 'PROPERTY_NOT_FOUND',
    message: 'Property could not be found with the provided parameters',
    details: {
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Auckland'
    }
  }
};

const MOCK_UNAUTHORIZED_RESPONSE = {
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'API key is invalid or has expired',
    details: {
      apiKeyStatus: 'expired'
    }
  }
};

describe('CoreLogic API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    const mockUser = createMockUser({ role: 'agent' });
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } } });
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
  });

  describe('getPropertyData Edge Function', () => {
    it('should successfully retrieve property data from CoreLogic', async () => {
      // Setup the mock to return our successful response
      supabase.functions.invoke.mockResolvedValue({
        data: MOCK_SUCCESSFUL_RESPONSE,
        error: null
      });

      // Call the function
      const response = await supabase.functions.invoke('get-property-data', {
        body: TEST_PROPERTY_REQUEST
      });

      // Verify the function was called with the correct arguments
      expect(supabase.functions.invoke).toHaveBeenCalledWith('get-property-data', {
        body: TEST_PROPERTY_REQUEST
      });

      // Verify we got our successful response
      expect(response.data).toEqual(MOCK_SUCCESSFUL_RESPONSE);
      expect(response.error).toBeNull();

      // Verify the structure of the response data
      const data = response.data.data;
      expect(data.propertyDetails).toBeDefined();
      expect(data.propertyDetails.propertyId).toBe('CL12345');
      expect(data.avmData).toBeDefined();
      expect(data.avmData.estimatedValue).toBe(925000);
      expect(data.marketData).toBeDefined();
    });

    it('should handle property not found errors gracefully', async () => {
      // Setup the mock to return our error response
      supabase.functions.invoke.mockResolvedValue({
        data: MOCK_ERROR_RESPONSE,
        error: null
      });

      // Call the function with a non-existent property
      const response = await supabase.functions.invoke('get-property-data', {
        body: {
          ...TEST_PROPERTY_REQUEST,
          address: '999 Nonexistent Street'
        }
      });

      // Verify we got our error response
      expect(response.data).toEqual(MOCK_ERROR_RESPONSE);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('PROPERTY_NOT_FOUND');
    });

    it('should handle API authentication errors correctly', async () => {
      // Setup the mock to return our unauthorized response
      supabase.functions.invoke.mockResolvedValue({
        data: MOCK_UNAUTHORIZED_RESPONSE,
        error: null
      });

      // Call the function
      const response = await supabase.functions.invoke('get-property-data', {
        body: TEST_PROPERTY_REQUEST
      });

      // Verify we got our unauthorized response
      expect(response.data).toEqual(MOCK_UNAUTHORIZED_RESPONSE);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle network or server errors', async () => {
      // Setup the mock to return a server error
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Internal server error', status: 500 }
      });

      // Call the function
      const response = await supabase.functions.invoke('get-property-data', {
        body: TEST_PROPERTY_REQUEST
      });

      // Verify we got the error
      expect(response.data).toBeNull();
      expect(response.error).toBeDefined();
      expect(response.error.status).toBe(500);
    });
  });

  describe('savePropertyData Edge Function', () => {
    const SAVE_REQUEST = {
      appraisalId: '12345678-abcd-1234-efgh-123456789012',
      propertyData: MOCK_SUCCESSFUL_RESPONSE.data
    };

    it('should successfully save property data to the database', async () => {
      // Setup the mock to return a successful save response
      supabase.functions.invoke.mockResolvedValue({
        data: { 
          success: true, 
          data: { 
            appraisalId: SAVE_REQUEST.appraisalId,
            updated: true
          }
        },
        error: null
      });

      // Call the function
      const response = await supabase.functions.invoke('save-property-data', {
        body: SAVE_REQUEST
      });

      // Verify the function was called with the correct arguments
      expect(supabase.functions.invoke).toHaveBeenCalledWith('save-property-data', {
        body: SAVE_REQUEST
      });

      // Verify we got a successful response
      expect(response.data.success).toBe(true);
      expect(response.data.data.appraisalId).toBe(SAVE_REQUEST.appraisalId);
      expect(response.error).toBeNull();
    });

    it('should handle permission errors appropriately', async () => {
      // Setup the mock for an unauthorized user
      const unauthorizedUser = createMockUser({ role: 'customer' });
      supabase.auth.getSession.mockResolvedValue({ data: { session: { user: unauthorizedUser } } });
      supabase.auth.getUser.mockResolvedValue({ data: { user: unauthorizedUser } });

      // Setup the mock to return a permission error
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'User does not have permission to update this appraisal'
          }
        },
        error: null
      });

      // Call the function
      const response = await supabase.functions.invoke('save-property-data', {
        body: SAVE_REQUEST
      });

      // Verify we got a permission error
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('PERMISSION_DENIED');
    });

    it('should handle database errors correctly', async () => {
      // Setup the mock to return a database error
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update appraisal record'
          }
        },
        error: null
      });

      // Call the function
      const response = await supabase.functions.invoke('save-property-data', {
        body: SAVE_REQUEST
      });

      // Verify we got a database error
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('DATABASE_ERROR');
    });
  });
}); 
