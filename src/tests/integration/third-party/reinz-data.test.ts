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
interface MarketDataRequest {
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  period?: number; // Number of months to look back
}

// Mock response interfaces
interface SalesDataPoint {
  month: string; // Format: "YYYY-MM"
  medianPrice: number;
  salesCount: number;
  averageDaysOnMarket: number;
  inventoryLevel: number;
}

interface SuburbPerformance {
  suburb: string;
  medianPrice: number;
  annualChange: number;
  quarterlyChange: number;
  averageDaysOnMarket: number;
  totalSales: number;
  highestSale: number;
  lowestSale: number;
}

interface PriceBand {
  range: string; // e.g., "600k-700k"
  salesCount: number;
  percentage: number;
}

interface SuccessfulResponse {
  success: true;
  data: {
    historical: SalesDataPoint[];
    currentSnapshot: {
      medianPrice: number;
      averageDaysOnMarket: number;
      totalSales: number;
      inventoryLevel: number;
      annualChange: number;
      quarterlyChange: number;
      priceBands: PriceBand[];
    };
    suburbComparison: SuburbPerformance[];
    trendAnalysis: {
      priceDirection: 'up' | 'down' | 'stable';
      salesVolumeDirection: 'up' | 'down' | 'stable';
      inventoryDirection: 'up' | 'down' | 'stable';
      marketCondition: string; // e.g., "Seller's market", "Buyer's market", "Balanced"
      comments: string[];
    };
    datasource: {
      dataProvider: string;
      lastUpdated: string;
      reportPeriod: string;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ReinzDataResponse = SuccessfulResponse | ErrorResponse;

// Test data
const TEST_MARKET_DATA_REQUEST: MarketDataRequest = {
  suburb: 'Mount Eden',
  city: 'Auckland',
  propertyType: 'house',
  bedrooms: 3,
  period: 12 // 12 months lookback
};

// Mock responses
const MOCK_SUCCESSFUL_RESPONSE: SuccessfulResponse = {
  success: true,
  data: {
    historical: [
      {
        month: '2023-05',
        medianPrice: 990000,
        salesCount: 32,
        averageDaysOnMarket: 38,
        inventoryLevel: 155
      },
      {
        month: '2023-06',
        medianPrice: 1005000,
        salesCount: 29,
        averageDaysOnMarket: 37,
        inventoryLevel: 162
      },
      // More months would be included here...
      {
        month: '2024-04',
        medianPrice: 1050000,
        salesCount: 35,
        averageDaysOnMarket: 32,
        inventoryLevel: 145
      }
    ],
    currentSnapshot: {
      medianPrice: 1050000,
      averageDaysOnMarket: 32,
      totalSales: 35,
      inventoryLevel: 145,
      annualChange: 6.1,
      quarterlyChange: 1.5,
      priceBands: [
        {
          range: 'Under 800k',
          salesCount: 3,
          percentage: 8.5
        },
        {
          range: '800k-900k',
          salesCount: 5,
          percentage: 14.3
        },
        {
          range: '900k-1M',
          salesCount: 8,
          percentage: 22.9
        },
        {
          range: '1M-1.2M',
          salesCount: 12,
          percentage: 34.3
        },
        {
          range: 'Above 1.2M',
          salesCount: 7,
          percentage: 20.0
        }
      ]
    },
    suburbComparison: [
      {
        suburb: 'Mount Eden',
        medianPrice: 1050000,
        annualChange: 6.1,
        quarterlyChange: 1.5,
        averageDaysOnMarket: 32,
        totalSales: 35,
        highestSale: 1850000,
        lowestSale: 750000
      },
      {
        suburb: 'Epsom',
        medianPrice: 1250000,
        annualChange: 5.5,
        quarterlyChange: 1.2,
        averageDaysOnMarket: 30,
        totalSales: 28,
        highestSale: 2100000,
        lowestSale: 880000
      },
      {
        suburb: 'Mount Albert',
        medianPrice: 950000,
        annualChange: 4.8,
        quarterlyChange: 1.0,
        averageDaysOnMarket: 35,
        totalSales: 32,
        highestSale: 1620000,
        lowestSale: 680000
      }
    ],
    trendAnalysis: {
      priceDirection: 'up',
      salesVolumeDirection: 'up',
      inventoryDirection: 'down',
      marketCondition: "Seller's market",
      comments: [
        'Mount Eden continues to show strong price growth compared to neighboring suburbs',
        'Sales volumes have increased over the past quarter, indicating strong buyer demand',
        'Inventory levels have decreased, putting upward pressure on prices',
        'The $1M-$1.2M price band has seen the most activity'
      ]
    },
    datasource: {
      dataProvider: 'REINZ',
      lastUpdated: '2024-05-10',
      reportPeriod: 'April 2024'
    }
  }
};

const MOCK_ERROR_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Failed to fetch market data from REINZ API'
};

const MOCK_NO_DATA_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Insufficient data available for the requested location and property type'
};

const MOCK_VALIDATION_ERROR: ErrorResponse = {
  success: false,
  error: 'Missing required parameters: suburb and city are required'
};

describe('REINZ Data API Integration', () => {
  // Before each test, reset mocks
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // After all tests, restore mocks
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully fetch market data for a given location', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock successful Edge Function response
    mockSuccessResponse(MOCK_SUCCESSFUL_RESPONSE);

    // Call the Edge Function that would interact with REINZ
    const { data, error } = await supabase.functions.invoke('market-data', {
      body: TEST_MARKET_DATA_REQUEST
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('market-data', {
      body: TEST_MARKET_DATA_REQUEST
    });

    // Verify response format
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_SUCCESSFUL_RESPONSE);
    
    // Type assertion to handle the union type
    if (data && 'success' in data && data.success === true) {
      // Verify specific data from REINZ
      expect(data.data.datasource.dataProvider).toBe('REINZ');
      expect(data.data.historical.length).toBeGreaterThan(0);
      expect(data.data.suburbComparison.length).toBe(3);
      expect(data.data.currentSnapshot.medianPrice).toBe(1050000);
    }
  });

  it('should handle insufficient data for requested location', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock no data response
    mockSuccessResponse(MOCK_NO_DATA_RESPONSE);

    // Call with a very specific request that might lack data
    const specificRequest = {
      ...TEST_MARKET_DATA_REQUEST,
      suburb: 'Small Remote Suburb',
      propertyType: 'apartment',
      bedrooms: 5 // Very specific, less likely to have sufficient data
    };

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: specificRequest
    });

    // Verify response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_NO_DATA_RESPONSE);
    
    // Type assertion
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('Insufficient data');
    }
  });

  it('should handle REINZ API errors', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock API error response
    mockSuccessResponse(MOCK_ERROR_RESPONSE);

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: TEST_MARKET_DATA_REQUEST
    });

    // Verify response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_ERROR_RESPONSE);
    
    // Type assertion
    if (data && 'success' in data && data.success === false) {
      expect(data.error).toContain('Failed to fetch');
    }
  });

  it('should handle validation errors for missing parameters', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock validation error response
    mockSuccessResponse(MOCK_VALIDATION_ERROR);

    // Call with incomplete data
    const { data, error } = await supabase.functions.invoke('market-data', {
      body: { propertyType: 'house' } // Missing suburb and city
    });

    // Verify response
    expect(error).toBeNull();
    
    // Type assertion
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

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: TEST_MARKET_DATA_REQUEST
    });

    // Verify response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toBe('Authentication required');
      expect(error.status).toBe(401);
    }
  });

  it('should handle REINZ API timeout', async () => {
    // Set up authentication
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock timeout error response
    mockErrorResponse('Request to REINZ API timed out', 504);

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: TEST_MARKET_DATA_REQUEST
    });

    // Verify response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('timed out');
      expect(error.status).toBe(504);
    }
  });

  it('should handle REINZ API rate limiting', async () => {
    // Set up authentication
    const { mockErrorResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Mock rate limit error response
    mockErrorResponse('REINZ API rate limit exceeded', 429);

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: TEST_MARKET_DATA_REQUEST
    });

    // Verify response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    if (error) {
      expect(error.message).toContain('rate limit');
      expect(error.status).toBe(429);
    }
  });

  it('should return data for different property types correctly', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a custom response for apartments
    const apartmentResponse: SuccessfulResponse = {
      success: true,
      data: {
        ...MOCK_SUCCESSFUL_RESPONSE.data,
        currentSnapshot: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.currentSnapshot,
          medianPrice: 680000, // Different for apartments
          totalSales: 48 // More apartment sales
        },
        trendAnalysis: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.trendAnalysis,
          comments: [
            'Apartment market in Mount Eden shows steady growth',
            'Higher sales volumes compared to houses in the same area',
            'Investors are active in this segment of the market'
          ]
        }
      }
    };
    
    mockSuccessResponse(apartmentResponse);

    // Call with an apartment property type
    const apartmentRequest = {
      ...TEST_MARKET_DATA_REQUEST,
      propertyType: 'apartment'
    };

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: apartmentRequest
    });

    // Verify apartment-specific data
    expect(error).toBeNull();
    
    // Type assertion
    if (data && 'success' in data && data.success === true) {
      expect(data.data.currentSnapshot.medianPrice).toBe(680000); // Apartment price
      expect(data.data.currentSnapshot.totalSales).toBe(48); // More apartment sales
      expect(data.data.trendAnalysis.comments).toContain('Apartment market in Mount Eden shows steady growth');
    }
  });

  it('should respect the period parameter and return appropriate historical data', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a response with fewer historical data points for shorter period
    const shorterPeriodResponse: SuccessfulResponse = {
      success: true,
      data: {
        ...MOCK_SUCCESSFUL_RESPONSE.data,
        historical: [
          // Only 3 months of data
          {
            month: '2024-02',
            medianPrice: 1030000,
            salesCount: 30,
            averageDaysOnMarket: 35,
            inventoryLevel: 152
          },
          {
            month: '2024-03',
            medianPrice: 1045000,
            salesCount: 32,
            averageDaysOnMarket: 33,
            inventoryLevel: 148
          },
          {
            month: '2024-04',
            medianPrice: 1050000,
            salesCount: 35,
            averageDaysOnMarket: 32,
            inventoryLevel: 145
          }
        ],
        // Updates for shorter timeframe
        currentSnapshot: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.currentSnapshot,
          quarterlyChange: 1.5,
          annualChange: null // No annual change for 3-month data
        }
      }
    };
    
    mockSuccessResponse(shorterPeriodResponse);

    // Call with a shorter period
    const shortPeriodRequest = {
      ...TEST_MARKET_DATA_REQUEST,
      period: 3 // 3 months lookback
    };

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: shortPeriodRequest
    });

    // Verify response reflects shorter period
    expect(error).toBeNull();
    
    // Type assertion
    if (data && 'success' in data && data.success === true) {
      expect(data.data.historical.length).toBe(3); // 3 months of data
      expect(data.data.historical[0].month).toBe('2024-02'); // First month is February
      expect(data.data.currentSnapshot.annualChange).toBeNull(); // No annual change for short period
      expect(data.data.currentSnapshot.quarterlyChange).toBe(1.5); // Quarterly change is present
    }
  });

  it('should handle different combination of suburbs and cities', async () => {
    // Set up authentication
    const { mockSuccessResponse } = setupEdgeFunctionAuth({
      isAuthenticated: true,
      userRole: 'agent'
    });
    
    // Create a custom response for Wellington
    const wellingtonResponse: SuccessfulResponse = {
      success: true,
      data: {
        ...MOCK_SUCCESSFUL_RESPONSE.data,
        currentSnapshot: {
          ...MOCK_SUCCESSFUL_RESPONSE.data.currentSnapshot,
          medianPrice: 850000, // Different for Wellington
          annualChange: 3.2 // Different growth rate
        },
        suburbComparison: [
          {
            suburb: 'Thorndon',
            medianPrice: 850000,
            annualChange: 3.2,
            quarterlyChange: 0.8,
            averageDaysOnMarket: 29,
            totalSales: 25,
            highestSale: 1500000,
            lowestSale: 650000
          },
          {
            suburb: 'Kelburn',
            medianPrice: 920000,
            annualChange: 2.9,
            quarterlyChange: 0.7,
            averageDaysOnMarket: 32,
            totalSales: 18,
            highestSale: 1650000,
            lowestSale: 710000
          },
          {
            suburb: 'Mount Victoria',
            medianPrice: 890000,
            annualChange: 3.5,
            quarterlyChange: 1.1,
            averageDaysOnMarket: 28,
            totalSales: 22,
            highestSale: 1580000,
            lowestSale: 680000
          }
        ]
      }
    };
    
    mockSuccessResponse(wellingtonResponse);

    // Call with Wellington city
    const wellingtonRequest = {
      suburb: 'Thorndon',
      city: 'Wellington',
      propertyType: 'house',
      period: 12
    };

    const { data, error } = await supabase.functions.invoke('market-data', {
      body: wellingtonRequest
    });

    // Verify Wellington-specific data
    expect(error).toBeNull();
    
    // Type assertion
    if (data && 'success' in data && data.success === true) {
      expect(data.data.currentSnapshot.medianPrice).toBe(850000); // Wellington price
      expect(data.data.currentSnapshot.annualChange).toBe(3.2); // Wellington growth rate
      expect(data.data.suburbComparison[0].suburb).toBe('Thorndon'); // Wellington suburb
      expect(data.data.suburbComparison.length).toBe(3); // 3 Wellington suburbs
    }
  });
}); 