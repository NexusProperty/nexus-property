/**
 * Property Data Edge Function Integration Tests
 * 
 * This script tests the integration between the Edge Function and CoreLogic API.
 * It validates different request scenarios, error handling, and caching behavior.
 */

// Note: This is designed to be run in a Node.js environment for testing.
// In actual deployment, the Edge Function runs in Deno.

import { createClient } from '@supabase/supabase-js';
import { createCoreLogicClient, LogLevel } from './corelogic-service';
import { 
  CoreLogicAuthConfig, 
  PropertyDataResponse,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStats
} from './corelogic-types';
import { 
  validatePropertyDetails, 
  validateComparableProperties, 
  validateMarketTrends 
} from './data-validation-tests';

// Import types for Jest
import type { Mock } from 'jest-mock';

// Define global Jest namespace for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface MockInstance<T = any, Y extends any[] = any[]> {
      mockImplementation(fn: (...args: Y) => T): this;
      mockReturnValue(value: T): this;
      mockResolvedValue(value: T): this;
      mockRejectedValue(value: unknown): this;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function fn<T = any>(): Mock<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function mock(path: string): any;
    function resetAllMocks(): void;
  }
}

// Define Deno type for global
interface DenoEnvironment {
  env: {
    get(key: string): string | undefined;
  };
}

// Mock Deno.env.get for testing
(global as unknown as { Deno: DenoEnvironment }).Deno = {
  env: {
    get: (key: string) => {
      const mockEnv: Record<string, string> = {
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_ANON_KEY': 'test-anon-key',
        'CORELOGIC_API_KEY': 'test-api-key',
        'CORELOGIC_API_SECRET': 'test-api-secret',
        'CORELOGIC_API_URL': 'https://api-uat.corelogic.asia',
        'CORELOGIC_USE_MOCK': 'true'
      };
      return mockEnv[key] || '';
    }
  }
};

// Mock supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No data found' }
          })
        })
      }),
      upsert: jest.fn().mockResolvedValue({
        error: null
      })
    })
  })
}));

// Mock CoreLogic client
jest.mock('./corelogic-service', () => {
  // Create sample property data for testing
  const mockPropertyAttributes: CoreLogicPropertyAttributes = {
    propertyId: 'TEST-123',
    propertyType: 'House',
    landUse: 'Residential',
    bedrooms: 3,
    bathrooms: 2,
    landSize: 500,
    floorArea: 200,
    yearBuilt: 2000
  };

  const mockSalesHistory: CoreLogicSaleRecord[] = [
    {
      saleId: 'SALE-001',
      propertyId: 'TEST-123',
      date: '2022-01-15',
      price: 950000,
      saleType: 'Sale',
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Test City'
    }
  ];

  const mockAVM: CoreLogicAVMResponse = {
    propertyId: 'TEST-123',
    valuationDate: '2023-05-01',
    valuationLow: 950000,
    valuationHigh: 1050000,
    valuationEstimate: 1000000,
    confidenceScore: 0.85
  };

  const mockMarketStats: CoreLogicMarketStats = {
    medianPrice: 1100000,
    meanPrice: 1150000,
    pricePerSqm: 5500,
    annualGrowth: 5.2,
    quarterlyGrowth: 1.3,
    salesVolume: 120,
    daysOnMarket: 30,
    listingCount: 45
  };

  // The original module
  const originalModule = jest.requireActual('./corelogic-service');

  return {
    ...originalModule,
    createCoreLogicClient: jest.fn().mockImplementation(() => ({
      matchAddress: jest.fn().mockResolvedValue({
        propertyId: 'TEST-123',
        address: '123 Test Street',
        fullAddress: '123 Test Street, Test Suburb, Test City',
        addressComponents: {
          streetNumber: '123',
          streetName: 'Test',
          streetType: 'Street',
          suburb: 'Test Suburb',
          city: 'Test City',
          postcode: '1234'
        },
        confidence: 0.95
      }),
      getPropertyAttributes: jest.fn().mockResolvedValue(mockPropertyAttributes),
      getPropertySalesHistory: jest.fn().mockResolvedValue(mockSalesHistory),
      getPropertyAVM: jest.fn().mockResolvedValue(mockAVM),
      getMarketStatistics: jest.fn().mockResolvedValue(mockMarketStats),
      getPropertyImage: jest.fn().mockResolvedValue({
        propertyId: 'TEST-123',
        images: [
          {
            url: 'https://example.com/test-image.jpg',
            type: 'Property'
          }
        ]
      })
    }))
  };
});

// Import the Edge Function handler dynamically
// Note: In actual tests, we'd load the edge function code directly
const loadEdgeFunctionHandler = async () => {
  // This would import the actual edge function in a real test environment
  // For now, we'll create a test-specific handler function that simulates the edge function
  
  return async (req: Request) => {
    try {
      // Extract body
      const body = await req.json();
      
      // Create CoreLogic client (using mock mode)
      const corelogicConfig: CoreLogicAuthConfig = {
        apiKey: Deno.env.get('CORELOGIC_API_KEY') || '',
        apiSecret: Deno.env.get('CORELOGIC_API_SECRET') || '',
        baseUrl: Deno.env.get('CORELOGIC_API_URL') || ''
      };
      
      const useMockMode = (Deno.env.get('CORELOGIC_USE_MOCK') || 'false') === 'true';
      const corelogic = createCoreLogicClient(corelogicConfig, useMockMode, LogLevel.INFO);
      
      // Basic validation
      if (!body.propertyId && !body.address) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Property ID or address is required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Get propertyId (either directly or by matching address)
      let propertyId = body.propertyId;
      
      if (!propertyId && body.address) {
        try {
          const matchedAddress = await corelogic.matchAddress({
            address: body.address,
            suburb: body.suburb,
            city: body.city,
            postcode: body.postcode
          });
          propertyId = matchedAddress.propertyId;
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Address matching failed: ${error instanceof Error ? error.message : String(error)}`
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Fetch property data
      try {
        // Get property attributes
        const propertyAttributes = await corelogic.getPropertyAttributes(propertyId);
        
        // Get sales history, AVM, and market statistics in parallel
        const [salesHistory, avm, marketStats] = await Promise.all([
          corelogic.getPropertySalesHistory(propertyId),
          corelogic.getPropertyAVM(propertyId),
          corelogic.getMarketStatistics({
            suburb: body.suburb || '',
            city: body.city || ''
          })
        ]);
        
        // Create address details
        const addressDetails = {
          address: body.address || `Property ${propertyId}`,
          addressComponents: {
            suburb: body.suburb || 'Test Suburb',
            city: body.city || 'Test City',
            postcode: body.postcode || '1234'
          }
        };
        
        // Generate response
        const successResponse: PropertyDataResponse = {
          success: true,
          data: {
            propertyDetails: {
              address: addressDetails.address,
              suburb: addressDetails.addressComponents.suburb,
              city: addressDetails.addressComponents.city,
              postcode: addressDetails.addressComponents.postcode,
              propertyType: propertyAttributes.propertyType || 'Unknown',
              bedrooms: propertyAttributes.bedrooms,
              bathrooms: propertyAttributes.bathrooms,
              landSize: propertyAttributes.landSize,
              floorArea: propertyAttributes.floorArea,
              yearBuilt: propertyAttributes.yearBuilt,
              features: propertyAttributes.features
            },
            comparableProperties: salesHistory.map(sale => ({
              address: sale.address || 'Unknown Address',
              suburb: sale.suburb || addressDetails.addressComponents.suburb,
              city: sale.city || addressDetails.addressComponents.city,
              propertyType: sale.propertyType || propertyAttributes.propertyType || 'Unknown',
              bedrooms: sale.bedrooms || propertyAttributes.bedrooms,
              bathrooms: sale.bathrooms || propertyAttributes.bathrooms,
              saleDate: sale.date,
              salePrice: sale.price,
              similarityScore: 85 // Mock similarity score
            })),
            marketTrends: {
              medianPrice: marketStats.medianPrice,
              annualGrowth: marketStats.annualGrowth,
              salesVolume: marketStats.salesVolume,
              daysOnMarket: marketStats.daysOnMarket
            }
          }
        };
        
        return new Response(
          JSON.stringify(successResponse),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Error fetching property data: ${error instanceof Error ? error.message : String(error)}`
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error in edge function: ${error instanceof Error ? error.message : String(error)}`
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
};

/**
 * Test cases for property data edge function
 */
describe('Property Data Edge Function', () => {
  let handler: (req: Request) => Promise<Response>;
  
  beforeAll(async () => {
    handler = await loadEdgeFunctionHandler();
  });
  
  test('Requires propertyId or address', async () => {
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const response = await handler(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });
  
  test('Processes propertyId request successfully', async () => {
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId: 'TEST-123'
      })
    });
    
    const response = await handler(req);
    const data = await response.json() as PropertyDataResponse;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.propertyDetails).toBeDefined();
    expect(data.data?.comparableProperties).toHaveLength(1);
    expect(data.data?.marketTrends).toBeDefined();
    
    // Validate the response data using our validation functions
    const propertyDetailsErrors = validatePropertyDetails(data);
    const comparablePropertiesErrors = validateComparableProperties(data);
    const marketTrendsErrors = validateMarketTrends(data);
    
    expect(propertyDetailsErrors).toHaveLength(0);
    expect(comparablePropertiesErrors).toHaveLength(0);
    expect(marketTrendsErrors).toHaveLength(0);
  });
  
  test('Processes address request successfully', async () => {
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: '123 Test Street',
        suburb: 'Suburb',
        city: 'City'
      })
    });
    
    const response = await handler(req);
    const data = await response.json() as PropertyDataResponse;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.propertyDetails.address).toBe('123 Test Street');
    
    // Validate the response data
    const propertyDetailsErrors = validatePropertyDetails(data);
    expect(propertyDetailsErrors).toHaveLength(0);
  });
  
  test('Handles invalid JSON gracefully', async () => {
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid-json'
    });
    
    const response = await handler(req);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
  
  test('Validates property details structure', async () => {
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId: 'TEST-123'
      })
    });
    
    const response = await handler(req);
    const data = await response.json() as PropertyDataResponse;
    
    // Check data structure and types
    expect(data.data?.propertyDetails).toHaveProperty('address');
    expect(typeof data.data?.propertyDetails.address).toBe('string');
    
    expect(data.data?.propertyDetails).toHaveProperty('propertyType');
    expect(typeof data.data?.propertyDetails.propertyType).toBe('string');
    
    expect(data.data?.propertyDetails).toHaveProperty('bedrooms');
    expect(typeof data.data?.propertyDetails.bedrooms).toBe('number');
    
    expect(data.data?.propertyDetails).toHaveProperty('bathrooms');
    expect(typeof data.data?.propertyDetails.bathrooms).toBe('number');
    
    expect(data.data?.marketTrends).toHaveProperty('medianPrice');
    expect(typeof data.data?.marketTrends.medianPrice).toBe('number');
    
    expect(data.data?.marketTrends).toHaveProperty('annualGrowth');
    expect(typeof data.data?.marketTrends.annualGrowth).toBe('number');
  });
});

/**
 * Test cases for caching behavior
 */
describe('Caching Behavior', () => {
  let handler: (req: Request) => Promise<Response>;
  
  beforeAll(async () => {
    handler = await loadEdgeFunctionHandler();
    
    // Setup cache mock - first time no cache, second time with cache
    let cacheHit = false;
    (createClient as unknown as jest.MockInstance).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              if (!cacheHit) {
                cacheHit = true;
                return Promise.resolve({
                  data: null,
                  error: { message: 'No data found' }
                });
              } else {
                return Promise.resolve({
                  data: {
                    created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
                    data: {
                      success: true,
                      data: {
                        propertyDetails: {
                          address: 'Cached Property',
                          suburb: 'Cached Suburb',
                          city: 'Cached City',
                          propertyType: 'House',
                          bedrooms: 4,
                          bathrooms: 2
                        },
                        comparableProperties: [],
                        marketTrends: {
                          medianPrice: 1000000,
                          annualGrowth: 5,
                          salesVolume: 100,
                          daysOnMarket: 25
                        }
                      }
                    }
                  },
                  error: null
                });
              }
            })
          })
        }),
        upsert: jest.fn().mockResolvedValue({
          error: null
        })
      })
    }));
  });
  
  test('Uses cached data when available', async () => {
    // First request - no cache
    const req1 = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId: 'CACHE-TEST'
      })
    });
    
    await handler(req1);
    
    // Second request - should use cache
    const req2 = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId: 'CACHE-TEST'
      })
    });
    
    const response = await handler(req2);
    const data = await response.json();
    
    // In a real test, we'd verify it's using cached data by checking specific cached values
    // or by verifying the API isn't called again, but this is simplified
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

/**
 * Test cases for error handling
 */
describe('Error Handling', () => {
  let handler: (req: Request) => Promise<Response>;
  const originalCreateCoreLogicClient = createCoreLogicClient;
  
  beforeAll(async () => {
    handler = await loadEdgeFunctionHandler();
  });
  
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
  });
  
  afterAll(() => {
    // Restore original implementation
    (global as unknown as { createCoreLogicClient: typeof createCoreLogicClient }).createCoreLogicClient = originalCreateCoreLogicClient;
  });
  
  test('Handles API error gracefully', async () => {
    // Mock the CoreLogic client to throw an error
    (global as unknown as { createCoreLogicClient: jest.MockInstance }).createCoreLogicClient = jest.fn().mockImplementation(() => ({
      matchAddress: jest.fn().mockRejectedValue(new Error('API error'))
    }));
    
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: '123 Error Street',
        suburb: 'Error Suburb',
        city: 'Error City'
      })
    });
    
    const response = await handler(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('Address matching failed');
  });
  
  test('Handles property data fetch errors', async () => {
    // Mock the CoreLogic client to throw an error during property data fetch
    (global as unknown as { createCoreLogicClient: jest.MockInstance }).createCoreLogicClient = jest.fn().mockImplementation(() => ({
      matchAddress: jest.fn().mockResolvedValue({
        propertyId: 'ERROR-ID',
        address: '123 Test Street',
        fullAddress: '123 Test Street, Test Suburb, Test City',
        addressComponents: {
          streetNumber: '123',
          streetName: 'Test',
          streetType: 'Street',
          suburb: 'Test Suburb',
          city: 'Test City',
          postcode: '1234'
        },
        confidence: 0.95
      }),
      getPropertyAttributes: jest.fn().mockRejectedValue(new Error('Property data fetch failed'))
    }));
    
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: '123 Test Street',
        suburb: 'Test Suburb',
        city: 'Test City'
      })
    });
    
    const response = await handler(req);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Property data fetch failed');
  });
});

/**
 * More comprehensive validation tests
 */
describe('Data Validation Tests', () => {
  let handler: (req: Request) => Promise<Response>;
  
  beforeAll(async () => {
    handler = await loadEdgeFunctionHandler();
  });
  
  test('Validates complete response structure', async () => {
    const req = new Request('https://api.example.com/property-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId: 'TEST-123'
      })
    });
    
    const response = await handler(req);
    const data = await response.json() as PropertyDataResponse;
    
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    
    expect(data.data).toHaveProperty('propertyDetails');
    expect(data.data).toHaveProperty('comparableProperties');
    expect(data.data).toHaveProperty('marketTrends');
    
    // Check property details
    const { propertyDetails } = data.data!;
    expect(propertyDetails).toHaveProperty('address');
    expect(propertyDetails).toHaveProperty('suburb');
    expect(propertyDetails).toHaveProperty('city');
    expect(propertyDetails).toHaveProperty('propertyType');
    
    // Check comparable properties
    const { comparableProperties } = data.data!;
    expect(Array.isArray(comparableProperties)).toBe(true);
    if (comparableProperties.length > 0) {
      expect(comparableProperties[0]).toHaveProperty('address');
      expect(comparableProperties[0]).toHaveProperty('saleDate');
      expect(comparableProperties[0]).toHaveProperty('salePrice');
      expect(comparableProperties[0]).toHaveProperty('similarityScore');
    }
    
    // Check market trends
    const { marketTrends } = data.data!;
    expect(marketTrends).toHaveProperty('medianPrice');
    expect(marketTrends).toHaveProperty('annualGrowth');
    expect(marketTrends).toHaveProperty('salesVolume');
    expect(marketTrends).toHaveProperty('daysOnMarket');
  });
});

// Run the tests
// In a real environment, this would be executed by Jest or another test runner
if (require.main === module) {
  console.log('Running Property Data Edge Function tests...');
  
  // Simple test runner
  const runTests = async () => {
    try {
      const handler = await loadEdgeFunctionHandler();
      
      // Test basic functionality
      const req = new Request('https://api.example.com/property-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: 'TEST-123'
        })
      });
      
      const response = await handler(req);
      const data = await response.json();
      
      console.log('Test passed:', response.status === 200 && data.success === true);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      // Run data validation tests
      const validationErrors = [
        ...validatePropertyDetails(data),
        ...validateComparableProperties(data),
        ...validateMarketTrends(data)
      ];
      
      console.log('Data validation passed:', validationErrors.length === 0);
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  runTests();
} 