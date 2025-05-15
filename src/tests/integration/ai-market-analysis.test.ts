import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        match: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { /* Sample property data */ },
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { /* Sample update result */ },
          error: null
        })
      })
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    },
    functions: {
      invoke: vi.fn().mockImplementation((functionName, options) => {
        if (functionName === 'ai-market-analysis') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                marketSummary: "The Auckland housing market has shown moderate growth over the past 12 months with an average price increase of 5.2%. The Testville suburb specifically has outperformed the wider market with a 6.8% annual growth rate. Property demand remains strong with an average time on market of 28 days, down from 35 days last year.",
                priceTrends: {
                  cityMedianPrice: 950000,
                  suburbMedianPrice: 875000,
                  annualGrowthRate: 0.068,
                  quarterlyGrowthRate: 0.021,
                  fiveYearGrowthRate: 0.325,
                  pricePerSqmAverage: 7800,
                  pricePerSqmRange: {
                    min: 6500,
                    max: 9200
                  }
                },
                supplyDemandMetrics: {
                  averageDaysOnMarket: 28,
                  listingsSoldPercentage: 0.72,
                  listingsLastQuarter: 68,
                  listingsYearAgo: 82,
                  inventoryMonths: 2.4
                },
                marketSegmentation: {
                  byPropertyType: [
                    { type: "House", percentage: 0.65 },
                    { type: "Apartment", percentage: 0.22 },
                    { type: "Townhouse", percentage: 0.13 }
                  ],
                  byBedrooms: [
                    { bedrooms: 2, percentage: 0.18 },
                    { bedrooms: 3, percentage: 0.47 },
                    { bedrooms: 4, percentage: 0.29 },
                    { bedrooms: "5+", percentage: 0.06 }
                  ],
                  byPriceRange: [
                    { range: "< 600k", percentage: 0.12 },
                    { range: "600k-800k", percentage: 0.38 },
                    { range: "800k-1M", percentage: 0.32 },
                    { range: "1M-1.5M", percentage: 0.14 },
                    { range: "> 1.5M", percentage: 0.04 }
                  ]
                },
                rentalMarket: {
                  medianWeeklyRent: 620,
                  rentalYield: 0.037,
                  vacancyRate: 0.018,
                  yearOnYearRentGrowth: 0.053
                },
                forecastAndOutlook: {
                  shortTermOutlook: "The Testville market is expected to continue its stable growth over the next 6 months, with projected price increases of 2-3%. Interest rates are anticipated to remain stable, supporting continued buyer demand.",
                  mediumTermForecast: "Medium-term outlook (1-2 years) suggests moderate growth of 4-5% annually, with particular strength in the 3-bedroom house segment which continues to appeal to both investors and owner-occupiers.",
                  investmentPotential: "Properties in this area have demonstrated good rental yields and capital growth potential. The suburb's proximity to amenities and transport links increases its appeal to tenants and potential buyers alike."
                },
                comparableMarkets: [
                  {
                    suburb: "Henderson",
                    medianPrice: 840000,
                    annualGrowth: 0.051,
                    similarityScore: 0.88
                  },
                  {
                    suburb: "Mt Wellington",
                    medianPrice: 920000,
                    annualGrowth: 0.063,
                    similarityScore: 0.84
                  },
                  {
                    suburb: "Northcote",
                    medianPrice: 965000,
                    annualGrowth: 0.072,
                    similarityScore: 0.81
                  }
                ]
              }
            },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: new Error('Function not found') });
      })
    }
  })
}));

describe('AI Market Analysis Edge Function', () => {
  let supabase;
  
  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    
    // Create a fresh Supabase client for each test
    supabase = createClient('http://localhost:54321', 'fake-key');
  });

  it('should return a successful market analysis with all required components', async () => {
    // Arrange
    const propertyData = {
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2,
      landSize: 500
    };
    
    // Act
    const response = await supabase.functions.invoke('ai-market-analysis', {
      body: {
        propertyData,
        includeRentalMarket: true,
        includeForecast: true,
        includeComparableMarkets: true
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check market analysis structure
    const marketData = response.data.data;
    expect(marketData).toBeDefined();
    expect(typeof marketData.marketSummary).toBe('string');
    
    // Check price trends
    expect(marketData.priceTrends).toBeDefined();
    expect(typeof marketData.priceTrends.cityMedianPrice).toBe('number');
    expect(typeof marketData.priceTrends.suburbMedianPrice).toBe('number');
    expect(typeof marketData.priceTrends.annualGrowthRate).toBe('number');
    expect(typeof marketData.priceTrends.pricePerSqmAverage).toBe('number');
    
    // Check supply/demand metrics
    expect(marketData.supplyDemandMetrics).toBeDefined();
    expect(typeof marketData.supplyDemandMetrics.averageDaysOnMarket).toBe('number');
    expect(typeof marketData.supplyDemandMetrics.listingsSoldPercentage).toBe('number');
    
    // Check market segmentation
    expect(marketData.marketSegmentation).toBeDefined();
    expect(Array.isArray(marketData.marketSegmentation.byPropertyType)).toBe(true);
    expect(Array.isArray(marketData.marketSegmentation.byBedrooms)).toBe(true);
    expect(Array.isArray(marketData.marketSegmentation.byPriceRange)).toBe(true);
    
    // Check rental market
    expect(marketData.rentalMarket).toBeDefined();
    expect(typeof marketData.rentalMarket.medianWeeklyRent).toBe('number');
    expect(typeof marketData.rentalMarket.rentalYield).toBe('number');
    
    // Check forecast and outlook
    expect(marketData.forecastAndOutlook).toBeDefined();
    expect(typeof marketData.forecastAndOutlook.shortTermOutlook).toBe('string');
    expect(typeof marketData.forecastAndOutlook.mediumTermForecast).toBe('string');
    
    // Check comparable markets
    expect(Array.isArray(marketData.comparableMarkets)).toBe(true);
    expect(marketData.comparableMarkets.length).toBeGreaterThan(0);
    marketData.comparableMarkets.forEach(market => {
      expect(market.suburb).toBeDefined();
      expect(typeof market.medianPrice).toBe('number');
      expect(typeof market.annualGrowth).toBe('number');
      expect(typeof market.similarityScore).toBe('number');
    });
  });

  it('should return market analysis without optional components when not requested', async () => {
    // Arrange - Mock response without optional components
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          marketSummary: "The Auckland housing market has shown moderate growth...",
          priceTrends: {
            cityMedianPrice: 950000,
            suburbMedianPrice: 875000,
            annualGrowthRate: 0.068
          },
          supplyDemandMetrics: {
            averageDaysOnMarket: 28,
            listingsSoldPercentage: 0.72
          },
          marketSegmentation: {
            byPropertyType: [
              { type: "House", percentage: 0.65 },
              { type: "Apartment", percentage: 0.22 }
            ]
          }
        }
      },
      error: null
    });
    
    // Act
    const response = await supabase.functions.invoke('ai-market-analysis', {
      body: {
        propertyData: {
          suburb: 'Testville',
          city: 'Auckland'
        },
        includeRentalMarket: false,
        includeForecast: false,
        includeComparableMarkets: false
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check core components are present
    const marketData = response.data.data;
    expect(marketData.marketSummary).toBeDefined();
    expect(marketData.priceTrends).toBeDefined();
    expect(marketData.supplyDemandMetrics).toBeDefined();
    expect(marketData.marketSegmentation).toBeDefined();
    
    // Check optional components are not present
    expect(marketData.rentalMarket).toBeUndefined();
    expect(marketData.forecastAndOutlook).toBeUndefined();
    expect(marketData.comparableMarkets).toBeUndefined();
  });

  it('should handle errors when invalid location data is provided', async () => {
    // Arrange - Mock an error response
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Failed to generate market analysis: Location not found in database'
      },
      error: null
    });

    // Act - Call with invalid location
    const response = await supabase.functions.invoke('ai-market-analysis', {
      body: {
        propertyData: {
          suburb: 'Non-existent Suburb',
          city: 'Unknown City'
        }
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(false);
    expect(response.data.error).toContain('Failed to generate market analysis');
  });
}); 