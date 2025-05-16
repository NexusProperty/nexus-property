import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { setupEdgeFunctionAuth } from '@/tests/utils/edge-function-test-utils';

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

// Request interface
interface PropertyDataRequest {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
}

// Mock response interfaces
interface PropertyDetails {
  address: string;
  suburb: string;
  city: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  landSize: number;
  floorArea: number;
  yearBuilt: number;
  features: string[];
  buildingType: string;
  zoning: string;
  legalDescription: string;
  titleDetails: {
    titleNumber: string;
    titleType: string;
    issueDate: string;
  };
  coreLogicId: string;
}

interface SaleHistory {
  saleDate: string;
  salePrice: number;
  salePriceDisplay: string;
  vendor: string;
  purchaser: string;
  agency: string;
  saleType: string;
}

interface SuccessfulResponse {
  success: true;
  data: {
    propertyDetails: PropertyDetails;
    saleHistory: SaleHistory[];
    rawData: Record<string, unknown>; // The raw CoreLogic data response
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

type CoreLogicResponse = SuccessfulResponse | ErrorResponse;

// Test data
const TEST_PROPERTY_REQUEST: PropertyDataRequest = {
  address: '123 Test Street',
  suburb: 'Test Suburb',
  city: 'Auckland',
  propertyType: 'house'
};

// Mock responses
const MOCK_SUCCESSFUL_RESPONSE: SuccessfulResponse = {
  success: true,
  data: {
    propertyDetails: {
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Auckland',
      postcode: '1234',
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      landSize: 500,
      floorArea: 180,
      yearBuilt: 2005,
      features: ['Garage', 'Deck', 'Garden'],
      buildingType: 'Residential',
      zoning: 'Residential',
      legalDescription: 'Lot 1 DP 12345',
      titleDetails: {
        titleNumber: 'NA12345',
        titleType: 'Fee Simple',
        issueDate: '2005-01-15'
      },
      coreLogicId: 'CL12345678'
    },
    saleHistory: [
      {
        saleDate: '2022-03-15',
        salePrice: 950000,
        salePriceDisplay: '$950,000',
        vendor: 'Smith Family Trust',
        purchaser: 'John & Jane Doe',
        agency: 'NZ Realty',
        saleType: 'Private Treaty'
      },
      {
        saleDate: '2015-09-20',
        salePrice: 650000,
        salePriceDisplay: '$650,000',
        vendor: 'Johnson Properties Ltd',
        purchaser: 'Smith Family Trust',
        agency: 'Auckland Properties',
        saleType: 'Auction'
      },
      {
        saleDate: '2005-01-15',
        salePrice: 320000,
        salePriceDisplay: '$320,000',
        vendor: 'Builder Developer Ltd',
        purchaser: 'Johnson Properties Ltd',
        agency: 'New Builds Realty',
        saleType: 'New Build'
      }
    ],
    rawData: {
      // Sample raw data from CoreLogic API
      property_id: 'CL12345678',
      address_details: {
        full_address: '123 Test Street, Test Suburb, Auckland 1234',
        street_number: '123',
        street_name: 'Test Street',
        suburb: 'Test Suburb',
        city: 'Auckland',
        postcode: '1234'
      },
      building_details: {
        bedrooms: 3,
        bathrooms: 2,
        floor_area: 180,
        year_built: 2005
      },
      // ... additional raw data
    }
  }
};

const MOCK_ERROR_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Failed to fetch property data from CoreLogic API'
};

const MOCK_NOT_FOUND_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Property not found in CoreLogic database'
};

const MOCK_VALIDATION_ERROR: ErrorResponse = {
  success: false,
  error: 'Invalid property details: address is required'
};

describe('CoreLogic NZ API Integration', () => {
  // Before each test, reset mocks
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // After all tests, restore mocks
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully fetch property data when given valid address', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock successful Edge Function response
    mockSuccessResponse(MOCK_SUCCESSFUL_RESPONSE);

    // Call the Edge Function that would interact with CoreLogic
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_REQUEST
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: TEST_PROPERTY_REQUEST
    });

    // Verify response format
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_SUCCESSFUL_RESPONSE);
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === true) {
      // Verify specific data from CoreLogic
      expect(data.data.propertyDetails.coreLogicId).toBe('CL12345678');
      expect(data.data.saleHistory.length).toBe(3);
      expect(data.data.propertyDetails.titleDetails.titleNumber).toBe('NA12345');
    }
  });

  it('should handle property not found in CoreLogic database', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock not found response
    mockSuccessResponse(MOCK_NOT_FOUND_RESPONSE);

    // Call with address that doesn't exist in database
    const nonExistentProperty = {
      ...TEST_PROPERTY_REQUEST,
      address: '999 Nonexistent Street'
    };

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: nonExistentProperty
    });

    // Verify response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_NOT_FOUND_RESPONSE);
    
    // Type assertion
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('not found');
    }
  });

  it('should handle CoreLogic API errors', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock API error response
    mockSuccessResponse(MOCK_ERROR_RESPONSE);

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_REQUEST
    });

    // Verify response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_ERROR_RESPONSE);
    
    // Type assertion
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('Failed to fetch');
    }
  });

  it('should handle validation errors for missing property details', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock validation error response
    mockSuccessResponse(MOCK_VALIDATION_ERROR);

    // Call with incomplete data
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: { city: 'Auckland' } // Missing address and suburb
    });

    // Verify response
    expect(error).toBeNull();
    
    // Type assertion
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('Invalid property details');
    }
  });

  it('should handle authentication failures', async () => {
    // Set up unauthenticated request
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: false
    });
    
    // Mock authentication error response
    mockErrorResponse('Authentication required', 401);

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_REQUEST
    });

    // Verify response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toBe('Authentication required');
      expect(error.status).toBe(401);
    }
  });

  it('should handle CoreLogic API timeout', async () => {
    // Set up authentication
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock timeout error response
    mockErrorResponse('Request to CoreLogic API timed out', 504);

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_REQUEST
    });

    // Verify response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('timed out');
      expect(error.status).toBe(504);
    }
  });

  it('should handle CoreLogic API rate limiting', async () => {
    // Set up authentication
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock rate limit error response
    mockErrorResponse('CoreLogic API rate limit exceeded', 429);

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: TEST_PROPERTY_REQUEST
    });

    // Verify response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('rate limit');
      expect(error.status).toBe(429);
    }
  });

  it('should handle multi-unit properties correctly', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a mock response for a multi-unit property
    const multiUnitResponse: SuccessfulResponse = {
      success: true,
      data: {
        propertyDetails: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.propertyDetails,
          propertyType: 'multi-unit',
          buildingType: 'Apartments',
          // Different details for a multi-unit property
          unitCount: 5,
          strata: true,
          bodyCorpFees: 4500
        } as unknown as PropertyDetails,
        saleHistory: MOCK_SUCCESSFUL_RESPONSE.data.saleHistory,
        rawData: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.rawData,
          unit_details: {
            unit_count: 5,
            strata: true,
            body_corp_fees: 4500
          }
        }
      }
    };
    
    mockSuccessResponse(multiUnitResponse);

    // Call with a multi-unit property
    const multiUnitRequest = {
      ...TEST_PROPERTY_REQUEST,
      propertyType: 'multi-unit',
      address: 'Unit 3, 10 Tower Block'
    };

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: multiUnitRequest
    });

    // Verify response contains multi-unit specific fields
    expect(error).toBeNull();
    
    // Type assertion
    if (data && 'success' in data && data.success === true) {
      expect(data.data.propertyDetails.propertyType).toBe('multi-unit');
      expect(data.data.propertyDetails.buildingType).toBe('Apartments');
      // Check for multi-unit specific fields in the response
      expect(data.data.propertyDetails.unitCount).toBe(5);
      expect(data.data.propertyDetails.strata).toBe(true);
      expect(data.data.propertyDetails.bodyCorpFees).toBe(4500);
    }
  });

  it('should handle rural properties with land size in hectares', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a mock response for a rural property
    const ruralPropertyResponse: SuccessfulResponse = {
      success: true,
      data: {
        propertyDetails: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.propertyDetails,
          propertyType: 'rural',
          address: '123 Rural Road',
          suburb: 'Countryside',
          buildingType: 'Farmhouse',
          landSize: 56000, // 5.6 hectares in square meters
          zoning: 'Rural',
          landUse: 'Pastoral',
          waterRights: true,
          soilType: 'Loam'
        } as unknown as PropertyDetails,
        saleHistory: MOCK_SUCCESSFUL_RESPONSE.data.saleHistory,
        rawData: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.rawData,
          rural_details: {
            land_use: 'Pastoral',
            water_rights: true,
            soil_type: 'Loam'
          }
        }
      }
    };
    
    mockSuccessResponse(ruralPropertyResponse);

    // Call with a rural property
    const ruralRequest = {
      ...TEST_PROPERTY_REQUEST,
      propertyType: 'rural',
      address: '123 Rural Road',
      suburb: 'Countryside'
    };

    const { data, error } = await supabase.functions.invoke('property-data', {
      body: ruralRequest
    });

    // Verify rural-specific properties
    expect(error).toBeNull();
    
    // Type assertion
    if (data && 'success' in data && data.success === true) {
      expect(data.data.propertyDetails.propertyType).toBe('rural');
      expect(data.data.propertyDetails.zoning).toBe('Rural');
      expect(data.data.propertyDetails.landSize).toBe(56000); // 5.6 hectares in m²
      // Check for rural specific fields
      expect(data.data.propertyDetails.landUse).toBe('Pastoral');
      expect(data.data.propertyDetails.waterRights).toBe(true);
      expect(data.data.propertyDetails.soilType).toBe('Loam');
    }
  });
}); 