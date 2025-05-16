import { vi, expect } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createMockUser } from './supabase-test-utils';

/**
 * Setup authentication for Edge Function tests
 * @param isAuthenticated Whether the user should be authenticated
 * @param userRole The role of the authenticated user
 * @param userId The ID of the authenticated user
 * @returns Mock setup helper functions
 */
export function setupEdgeFunctionAuth({
  isAuthenticated = true,
  userRole = 'agent',
  userId = 'mock-user-id',
} = {}) {
  // Create a mock session if authenticated
  if (isAuthenticated) {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ 
            id: userId,
            user_metadata: { role: userRole } 
          })
        }
      },
      error: null
    });
  } else {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });
  }

  // Helper function to mock a successful Edge Function response
  const mockSuccessResponse = <T>(response: T) => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: response,
      error: null
    });
  };

  // Helper function to mock an error Edge Function response
  const mockErrorResponse = (message: string, status = 400) => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message, status }
    });
  };

  // Helper function to mock a failed Edge Function response (not HTTP error, but failure in function)
  const mockFailureResponse = (errorMessage: string) => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: false,
        error: errorMessage
      },
      error: null
    });
  };

  return {
    mockSuccessResponse,
    mockErrorResponse,
    mockFailureResponse
  };
}

// Type for properties that can be overridden in test objects
type PropertyOverrides = Record<string, unknown>;

/**
 * Generate a test appraisal object for testing
 * @param overrides Properties to override in the default appraisal
 * @returns A mock appraisal object
 */
export function createTestAppraisal(overrides: PropertyOverrides = {}) {
  return {
    id: 'test-appraisal-id',
    property_address: '123 Test Street',
    property_suburb: 'Test Suburb',
    property_city: 'Test City',
    property_type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    land_size: 500,
    floor_area: 180,
    year_built: 2005,
    status: 'pending',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    user_id: 'mock-user-id',
    property_id: 'test-property-id',
    valuation_low: null,
    valuation_high: null,
    valuation_confidence: null,
    ...overrides
  };
}

/**
 * Generate test comparable properties for testing
 * @param count Number of comparable properties to generate
 * @param baseOverrides Properties to override in all comparable properties
 * @returns An array of mock comparable properties
 */
export function createTestComparables(count = 3, baseOverrides: PropertyOverrides = {}) {
  const comparables = [];
  
  for (let i = 0; i < count; i++) {
    comparables.push({
      id: `comp-${i}`,
      address: `${125 + i} Test Street`,
      suburb: 'Test Suburb',
      city: 'Test City',
      property_type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      land_size: 600 - (i * 20),
      floor_area: 175 + (i * 10),
      year_built: 2005 - i,
      sale_date: `2023-${10 - i}-15`,
      sale_price: 950000 - (i * 25000),
      similarity_score: 95 - (i * 5),
      ...baseOverrides
    });
  }
  
  return comparables;
}

/**
 * Mock Edge Function call and verify it was called correctly
 * @param functionName Name of the Edge Function
 * @param body Request body to send to the function
 * @param mockResponse Response to mock
 * @returns Promise that resolves to the mocked response
 */
export async function mockAndVerifyEdgeFunction<T, R>(
  functionName: string,
  body: T,
  mockResponse: R
) {
  // Mock the Edge Function response
  vi.mocked(supabase.functions.invoke).mockResolvedValue({
    data: mockResponse,
    error: null
  });
  
  // Call the Edge Function
  const result = await supabase.functions.invoke(functionName, { body });
  
  // Verify the function was called with the correct parameters
  expect(supabase.functions.invoke).toHaveBeenCalledWith(functionName, {
    body
  });
  
  return result;
}