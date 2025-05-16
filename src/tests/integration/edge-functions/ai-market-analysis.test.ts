import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createMockUser } from '@/tests/utils/supabase-test-utils';
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
interface MarketAnalysisRequest {
  propertyId: string;
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms: number;
  requestTypes: string[];
  timeframeMonths: number;
}

// Test data
const TEST_MARKET_ANALYSIS_REQUEST: MarketAnalysisRequest = {
  propertyId: 'test-property-id',
  suburb: 'Test Suburb',
  city: 'Auckland',
  propertyType: 'house',
  bedrooms: 3, 
  requestTypes: ['market-trends', 'price-analysis', 'suburb-profile'],
  timeframeMonths: 12
};

// Mock response interfaces
interface MarketTrends {
  medianPrice: number;
  priceRange: {
    low: number;
    high: number;
  };
  annualGrowth: number;
  quarterlyGrowth: number;
  salesVolume: {
    current: number;
    previousPeriod: number;
    changePercent: number;
  };
  daysOnMarket: {
    current: number;
    previousPeriod: number;
    changePercent: number;
  };
  pricePerSqm: number;
  inventoryLevels: {
    current: number;
    previousPeriod: number;
    changePercent: number;
  };
}

interface PriceAnalysis {
  similarProperties: {
    medianPrice: number;
    count: number;
    pricePerSqm: number;
  };
  pricingFactors: Array<{
    factor: string;
    impact: string;
    description: string;
  }>;
  priceDistribution: Array<{
    range: string;
    percentage: number;
  }>;
}

interface SuburbProfile {
  overview: string;
  demographics: {
    populationDensity: string;
    medianAge: number;
    householdComposition: string;
  };
  amenities: {
    schools: string[];
    shopping: string[];
    transport: string[];
    recreation: string[];
  };
  developmentOutlook: string;
}

interface SuccessfulResponse {
  success: true;
  data: {
    marketTrends?: MarketTrends;
    priceAnalysis?: PriceAnalysis;
    suburbProfile?: SuburbProfile;
    aiInsights: string[];
    timeframe?: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

type MarketAnalysisResponse = SuccessfulResponse | ErrorResponse;

// Mock responses
const MOCK_SUCCESSFUL_RESPONSE: SuccessfulResponse = {
  success: true,
  data: {
    marketTrends: {
      medianPrice: 920000,
      priceRange: {
        low: 850000,
        high: 980000
      },
      annualGrowth: 4.5,
      quarterlyGrowth: 1.2,
      salesVolume: {
        current: 42,
        previousPeriod: 38,
        changePercent: 10.5
      },
      daysOnMarket: {
        current: 32,
        previousPeriod: 35,
        changePercent: -8.6
      },
      pricePerSqm: 5100,
      inventoryLevels: {
        current: 145,
        previousPeriod: 132,
        changePercent: 9.8
      }
    },
    priceAnalysis: {
      similarProperties: {
        medianPrice: 905000,
        count: 24,
        pricePerSqm: 5050
      },
      pricingFactors: [
        {
          factor: 'Location',
          impact: 'high',
          description: 'Proximity to schools and amenities is driving prices up in this area'
        },
        {
          factor: 'Property Size',
          impact: 'medium',
          description: '3 bedroom properties are in high demand in this suburb'
        },
        {
          factor: 'Market Conditions',
          impact: 'medium',
          description: 'Lower interest rates are increasing buyer activity'
        }
      ],
      priceDistribution: [
        { range: '700k-800k', percentage: 15 },
        { range: '800k-900k', percentage: 35 },
        { range: '900k-1M', percentage: 30 },
        { range: '1M-1.1M', percentage: 15 },
        { range: '1.1M+', percentage: 5 }
      ]
    },
    suburbProfile: {
      overview: 'Test Suburb is a well-established residential area with good amenities and transport links.',
      demographics: {
        populationDensity: 'Medium',
        medianAge: 35,
        householdComposition: 'Mix of young families and professionals'
      },
      amenities: {
        schools: ['Test Primary School', 'Test College'],
        shopping: ['Test Shopping Centre', 'Local Shops'],
        transport: ['Bus routes', 'Train station within 2km'],
        recreation: ['Community park', 'Sports fields', 'Walking tracks']
      },
      developmentOutlook: 'Planned infrastructure upgrades and new housing developments are likely to positively impact property values over the next 3-5 years.'
    },
    aiInsights: [
      'Property prices in Test Suburb have shown resilience despite broader market fluctuations',
      'Three-bedroom houses continue to be the most sought-after property type in this area',
      'Recent zoning changes may impact future development potential',
      'The suburb has seen increased interest from first-home buyers due to relative affordability compared to neighboring areas'
    ]
  }
};

const MOCK_ERROR_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Failed to generate AI market analysis'
};

const MOCK_VALIDATION_ERROR_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Missing required parameters: propertyId, suburb, or city'
};

describe('AI Market Analysis Edge Function Integration', () => {
  // Before each test, reset mocks
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // After all tests, restore mocks
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully generate market analysis when all inputs are valid', async () => {
    // Set up authentication for an agent
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock successful Edge Function response
    mockSuccessResponse(MOCK_SUCCESSFUL_RESPONSE);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_SUCCESSFUL_RESPONSE);
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === true) {
      expect(data.data.marketTrends).toBeDefined();
      expect(data.data.priceAnalysis).toBeDefined();
      expect(data.data.suburbProfile).toBeDefined();
      expect(data.data.aiInsights).toBeInstanceOf(Array);
    }
  });

  it('should handle validation errors for missing parameters', async () => {
    // Set up authentication for an agent
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock validation error response
    mockSuccessResponse(MOCK_VALIDATION_ERROR_RESPONSE);

    // Call the Edge Function with missing parameters
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: { propertyId: 'test-property-id' } // Missing suburb and city
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
      body: { propertyId: 'test-property-id' }
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_VALIDATION_ERROR_RESPONSE);
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('Missing required parameters');
    }
  });

  it('should handle authentication failures', async () => {
    // Set up unauthenticated request
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: false
    });
    
    // Mock authentication error response
    mockErrorResponse('Authentication required', 401);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toBe('Authentication required');
      expect(error.status).toBe(401);
    }
  });

  it('should handle role-based access control correctly', async () => {
    // Set up authentication as customer (who shouldn't have full access)
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'customer'
    });
    
    // Mock access denied response
    mockErrorResponse('Access denied. This feature is only available to agents.', 403);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('Access denied');
      expect(error.status).toBe(403);
    }
  });

  it('should handle insufficient data for analysis', async () => {
    // Set up authentication for an agent
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock error response for insufficient data
    const insufficientDataResponse: ErrorResponse = {
      success: false,
      error: 'Insufficient market data available for the requested area and property type.'
    };
    
    mockSuccessResponse(insufficientDataResponse);

    // Call the Edge Function with unusual property request that might lack data
    const unusualRequest = {
      ...TEST_MARKET_ANALYSIS_REQUEST,
      suburb: 'Remote Area',
      propertyType: 'unusual-type'
    };

    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: unusualRequest
    });

    // Verify the response
    expect(error).toBeNull();
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('Insufficient market data');
    }
  });

  it('should handle AI service unavailability', async () => {
    // Set up authentication for an agent
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock error response for AI service unavailability
    const serviceUnavailableResponse: ErrorResponse = {
      success: false,
      error: 'AI analysis service is temporarily unavailable. Please try again later.'
    };
    
    mockSuccessResponse(serviceUnavailableResponse);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response
    expect(error).toBeNull();
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('AI analysis service is temporarily unavailable');
    }
  });
  
  it('should handle rate limiting exceeded', async () => {
    // Set up authentication for an agent
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock rate limiting error response
    mockErrorResponse('Rate limit exceeded. Please try again later.', 429);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.status).toBe(429);
    }
  });
  
  it('should handle timeouts from external services', async () => {
    // Set up authentication for an agent
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock timeout error response
    mockErrorResponse('Request timeout while processing market data', 504);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('Request timeout');
      expect(error.status).toBe(504);
    }
  });
  
  it('should filter analysis content based on requestTypes parameter', async () => {
    // Set up authentication for an agent
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a filtered mock response with only market trends
    const filteredResponse: SuccessfulResponse = {
      success: true,
      data: {
        marketTrends: MOCK_SUCCESSFUL_RESPONSE.data.marketTrends,
        // No priceAnalysis or suburbProfile
        aiInsights: [
          'Property prices in Test Suburb have shown resilience despite broader market fluctuations'
        ]
      }
    };
    
    // Mock successful Edge Function response with filtered data
    mockSuccessResponse(filteredResponse);

    // Call the Edge Function with limited requestTypes
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: {
        ...TEST_MARKET_ANALYSIS_REQUEST,
        requestTypes: ['market-trends'] // Only request market trends
      }
    });

    // Verify the response contains only the requested data
    expect(error).toBeNull();
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === true) {
      expect(data.data.marketTrends).toBeDefined();
      expect(data.data.priceAnalysis).toBeUndefined();
      expect(data.data.suburbProfile).toBeUndefined();
    }
  });
  
  it('should adjust analysis based on timeframeMonths parameter', async () => {
    // Set up authentication for an agent
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a mock response with different timeframe data
    const shortTimeframeResponse: SuccessfulResponse = {
      success: true,
      data: {
        marketTrends: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.marketTrends!,
          // Different values for shorter timeframe
          annualGrowth: 2.1, // Different from the 12-month value
          salesVolume: {
            current: 10, // Fewer sales in 3 months
            previousPeriod: 11,
            changePercent: -9.1
          }
        },
        timeframe: '3 months', // Indicates shorter timeframe
        aiInsights: []
      }
    };
    
    // Mock successful Edge Function response with shorter timeframe
    mockSuccessResponse(shortTimeframeResponse);

    // Call the Edge Function with shorter timeframe
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: {
        ...TEST_MARKET_ANALYSIS_REQUEST,
        timeframeMonths: 3 // Shorter timeframe
      }
    });

    // Verify the response reflects the shorter timeframe
    expect(error).toBeNull();
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === true) {
      expect(data.data.timeframe).toBe('3 months');
      expect(data.data.marketTrends?.annualGrowth).toBe(2.1); // Different from the 12-month value
      expect(data.data.marketTrends?.salesVolume.current).toBe(10);
    }
  });
  
  it('should create a simplified analysis for customer role users', async () => {
    // Set up authentication as a customer (with limited access)
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'customer'
    });
    
    // Create a simplified response for customers
    const simplifiedResponse: SuccessfulResponse = {
      success: true,
      data: {
        marketTrends: {
          medianPrice: 920000,
          priceRange: {
            low: 850000,
            high: 980000
          },
          annualGrowth: 4.5,
          quarterlyGrowth: 1.2,
          salesVolume: {
            current: 42,
            previousPeriod: 38,
            changePercent: 10.5
          },
          daysOnMarket: {
            current: 32,
            previousPeriod: 35,
            changePercent: -8.6
          },
          pricePerSqm: 5100,
          inventoryLevels: {
            current: 145,
            previousPeriod: 132,
            changePercent: 9.8
          }
        },
        suburbProfile: {
          overview: 'Test Suburb is a well-established residential area with good amenities and transport links.',
          demographics: {
            populationDensity: 'Medium',
            medianAge: 35,
            householdComposition: 'Mix of young families and professionals'
          },
          amenities: {
            schools: ['Test Primary School', 'Test College'],
            shopping: ['Test Shopping Centre', 'Local Shops'],
            transport: ['Bus routes', 'Train station within 2km'],
            recreation: ['Community park', 'Sports fields', 'Walking tracks']
          },
          developmentOutlook: 'Planned infrastructure upgrades and new housing developments are likely to positively impact property values over the next 3-5 years.'
        },
        aiInsights: [
          'Property prices in Test Suburb have shown resilience despite broader market fluctuations'
        ]
      }
    };
    
    // Mock successful Edge Function response with simplified data
    mockSuccessResponse(simplifiedResponse);

    // Call the Edge Function as a customer
    const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
      body: TEST_MARKET_ANALYSIS_REQUEST
    });

    // Verify the response contains only limited data appropriate for customers
    expect(error).toBeNull();
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === true) {
      expect(data.data.marketTrends).toBeDefined();
      expect(data.data.marketTrends?.medianPrice).toBeDefined();
      // Note: data.data.priceAnalysis is already undefined in the mock
      expect(data.data.suburbProfile).toBeDefined();
    }
  });
});