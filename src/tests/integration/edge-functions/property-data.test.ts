import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createMockUser, mockEdgeFunction } from '@/tests/utils/supabase-test-utils';

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
const TEST_PROPERTY_DATA = {
  address: '123 Test Street',
  suburb: 'Test Suburb',
  city: 'Auckland',
  propertyType: 'house'
};

// Mock responses
const MOCK_SUCCESSFUL_RESPONSE = {
  success: true,
  data: {
    propertyDetails: {
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Auckland',
      postcode: '1010',
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      landSize: 650,
      floorArea: 180,
      yearBuilt: 2005,
      features: ['Garage', 'Garden', 'Renovated Kitchen']
    },
    comparableProperties: [
      {
        address: '21 Sample Street',
        suburb: 'Test Suburb',
        city: 'Auckland',
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        landSize: 620,
        floorArea: 175,
        yearBuilt: 2007,
        saleDate: '2023-11-15',
        salePrice: 950000,
        similarityScore: 95,
        imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233'
      }
    ],
    marketTrends: {
      medianPrice: 980000,
      annualGrowth: 5.2,
      salesVolume: 45,
      daysOnMarket: 28
    }
  }
};

const MOCK_ERROR_RESPONSE = {
  success: false,
  error: 'Failed to fetch property data'
};

const MOCK_VALIDATION_ERROR_RESPONSE = {
  success: false,
  error: 'Missing required fields: address, suburb, city, or propertyType'
};

describe('Property Data Edge Function Integration', () => {
  // Before each test, reset mocks
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // After all tests, restore mocks
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully fetch property data when all inputs are valid', async () => {
    // Mock authentication
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

    // Mock successful Edge Function response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: MOCK_SUCCESSFUL_RESPONSE,
      error: null
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_DATA
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: TEST_PROPERTY_DATA
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_SUCCESSFUL_RESPONSE);
    expect(data?.success).toBe(true);
    expect(data?.data?.propertyDetails.address).toBe('123 Test Street');
    expect(data?.data?.comparableProperties.length).toBeGreaterThan(0);
    expect(data?.data?.marketTrends).toBeDefined();
  });

  it('should handle validation errors for missing fields', async () => {
    // Mock authentication
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

    // Mock validation error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: MOCK_VALIDATION_ERROR_RESPONSE,
      error: null
    });

    // Call the Edge Function with missing fields
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: { address: '123 Test Street' } // Missing suburb, city, propertyType
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: { address: '123 Test Street' }
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_VALIDATION_ERROR_RESPONSE);
    expect(data?.success).toBe(false);
    expect(data?.error).toContain('Missing required fields');
  });

  it('should handle authentication failures', async () => {
    // Mock authentication failure
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    // Mock authentication error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Authentication required', status: 401 }
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_DATA
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toBe('Authentication required');
    expect(error?.status).toBe(401);
  });

  it('should handle internal server errors', async () => {
    // Mock authentication
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

    // Mock server error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Internal server error', status: 500 }
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_DATA
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toBe('Internal server error');
    expect(error?.status).toBe(500);
  });

  it('should verify CSRF protection is working', async () => {
    // Mock authentication
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

    // Mock CSRF error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'CSRF token validation failed', status: 403 }
    });

    // Call the Edge Function without CSRF token
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_DATA
      // No CSRF token header
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toBe('CSRF token validation failed');
    expect(error?.status).toBe(403);
  });

  it('should handle role-based access control correctly', async () => {
    // Mock authentication as customer (who shouldn't have access)
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ user_metadata: { role: 'customer' } })
        }
      },
      error: null
    });

    // Mock access denied response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Access denied. Insufficient permissions.', status: 403 }
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_DATA
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toBe('Access denied. Insufficient permissions.');
    expect(error?.status).toBe(403);
  });
});