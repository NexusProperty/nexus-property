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
        if (functionName === 'property-valuation') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                valuationLow: 800000,
                valuationHigh: 950000,
                valuationConfidence: 0.85,
                adjustedComparables: [
                  {
                    id: 'comp-1',
                    address: '123 Test St',
                    salePrice: 850000,
                    adjustedPrice: 875000,
                    adjustmentFactor: 1.03,
                    weight: 0.4,
                    isOutlier: false
                  },
                  {
                    id: 'comp-2',
                    address: '456 Sample Ave',
                    salePrice: 820000,
                    adjustedPrice: 840000,
                    adjustmentFactor: 1.02,
                    weight: 0.35,
                    isOutlier: false
                  },
                  {
                    id: 'comp-3',
                    address: '789 Example Rd',
                    salePrice: 900000,
                    adjustedPrice: 890000,
                    adjustmentFactor: 0.99,
                    weight: 0.25,
                    isOutlier: false
                  }
                ],
                valuationFactors: {
                  bedroomValue: 50000,
                  bathroomValue: 30000,
                  landSizeValue: 20000,
                  floorAreaValue: 2000,
                  locationFactor: 1.1,
                  ageAdjustment: 0.95
                },
                marketTrends: {
                  medianPrice: 860000,
                  pricePerSqm: 7500,
                  annualGrowth: 0.05
                }
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

describe('Property Valuation Edge Function', () => {
  let supabase;
  
  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    
    // Create a fresh Supabase client for each test
    supabase = createClient('http://localhost:54321', 'fake-key');
  });

  it('should return a successful valuation result with all required fields', async () => {
    // Arrange
    const appraisalId = 'test-appraisal-id';
    const propertyDetails = {
      address: '100 Test Avenue',
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2,
      landSize: 500,
      floorArea: 180,
      yearBuilt: 2005
    };
    
    const comparableProperties = [
      {
        id: 'comp-1',
        address: '123 Test St',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        landSize: 520,
        floorArea: 185,
        yearBuilt: 2006,
        saleDate: '2023-01-15',
        salePrice: 850000,
        similarityScore: 0.92,
        distanceKm: 0.5
      },
      {
        id: 'comp-2',
        address: '456 Sample Ave',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 1,
        landSize: 490,
        floorArea: 175,
        yearBuilt: 2000,
        saleDate: '2023-02-20',
        salePrice: 820000,
        similarityScore: 0.88,
        distanceKm: 0.8
      },
      {
        id: 'comp-3',
        address: '789 Example Rd',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 2,
        landSize: 550,
        floorArea: 200,
        yearBuilt: 2010,
        saleDate: '2023-03-10',
        salePrice: 900000,
        similarityScore: 0.85,
        distanceKm: 1.2
      }
    ];

    // Act
    const response = await supabase.functions.invoke('property-valuation', {
      body: {
        appraisalId,
        propertyDetails,
        comparableProperties
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check valuation data structure
    const valuationData = response.data.data;
    expect(valuationData).toBeDefined();
    expect(typeof valuationData.valuationLow).toBe('number');
    expect(typeof valuationData.valuationHigh).toBe('number');
    expect(valuationData.valuationLow).toBeLessThan(valuationData.valuationHigh);
    expect(valuationData.valuationConfidence).toBeGreaterThan(0);
    expect(valuationData.valuationConfidence).toBeLessThanOrEqual(1);
    
    // Check adjusted comparables
    expect(Array.isArray(valuationData.adjustedComparables)).toBe(true);
    expect(valuationData.adjustedComparables.length).toBe(3);
    valuationData.adjustedComparables.forEach(comp => {
      expect(comp.id).toBeDefined();
      expect(comp.address).toBeDefined();
      expect(typeof comp.salePrice).toBe('number');
      expect(typeof comp.adjustedPrice).toBe('number');
      expect(typeof comp.adjustmentFactor).toBe('number');
      expect(typeof comp.weight).toBe('number');
      expect(typeof comp.isOutlier).toBe('boolean');
    });
    
    // Check valuation factors
    expect(valuationData.valuationFactors).toBeDefined();
    expect(typeof valuationData.valuationFactors.bedroomValue).toBe('number');
    expect(typeof valuationData.valuationFactors.bathroomValue).toBe('number');
    expect(typeof valuationData.valuationFactors.landSizeValue).toBe('number');
    expect(typeof valuationData.valuationFactors.floorAreaValue).toBe('number');
    expect(typeof valuationData.valuationFactors.locationFactor).toBe('number');
    expect(typeof valuationData.valuationFactors.ageAdjustment).toBe('number');
    
    // Check market trends
    expect(valuationData.marketTrends).toBeDefined();
    expect(typeof valuationData.marketTrends.medianPrice).toBe('number');
    expect(typeof valuationData.marketTrends.pricePerSqm).toBe('number');
    expect(typeof valuationData.marketTrends.annualGrowth).toBe('number');
  });

  it('should handle valuation requests with minimal comparable properties', async () => {
    // Arrange - Setup with minimal comparable properties
    const appraisalId = 'test-appraisal-id';
    const propertyDetails = {
      address: '100 Test Avenue',
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2
    };
    
    const comparableProperties = [
      {
        id: 'comp-1',
        address: '123 Test St',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        salePrice: 850000,
        similarityScore: 0.92
      },
      {
        id: 'comp-2',
        address: '456 Sample Ave',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        salePrice: 820000,
        similarityScore: 0.88
      }
    ];

    // Act
    const response = await supabase.functions.invoke('property-valuation', {
      body: {
        appraisalId,
        propertyDetails,
        comparableProperties
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    expect(response.data.data.valuationLow).toBeDefined();
    expect(response.data.data.valuationHigh).toBeDefined();
  });

  it('should handle errors when invalid data is provided', async () => {
    // Arrange - Mock an error response
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Failed to calculate valuation: No valid comparable properties with sale prices'
      },
      error: null
    });

    // Act - Call with invalid data (no sale prices)
    const response = await supabase.functions.invoke('property-valuation', {
      body: {
        appraisalId: 'test-appraisal-id',
        propertyDetails: {
          address: '100 Test Avenue',
          suburb: 'Testville',
          city: 'Auckland',
          propertyType: 'House'
        },
        comparableProperties: [
          {
            id: 'comp-1',
            address: '123 Test St',
            suburb: 'Testville',
            city: 'Auckland',
            propertyType: 'House',
            // Missing salePrice
            similarityScore: 0.92
          }
        ]
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(false);
    expect(response.data.error).toContain('Failed to calculate valuation');
  });
}); 