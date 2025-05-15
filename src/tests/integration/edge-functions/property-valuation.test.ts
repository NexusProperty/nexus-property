import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    functions: {
      invoke: vi.fn()
    }
  })
}));

describe('property-valuation Edge Function', () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createClient<Database>('https://test.supabase.co', 'test-key');
  });

  it('should calculate property valuation with complete data', async () => {
    // Arrange
    const propertyData = {
      address: '123 Test Street',
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2,
      landArea: 500,
      floorArea: 180,
      yearBuilt: 2010,
      recentRenovation: true,
      comparables: [
        { salePrice: 950000, saleDate: '2023-01-15' },
        { salePrice: 920000, saleDate: '2023-02-22' },
        { salePrice: 975000, saleDate: '2023-03-10' }
      ]
    };

    const mockResponse = {
      estimatedValue: 945000,
      confidenceScore: 85,
      valuationRange: {
        min: 925000,
        max: 965000
      },
      comparablesSummary: {
        median: 950000,
        mean: 948333,
        count: 3
      },
      valuationFactors: {
        location: 0.35,
        propertyAttributes: 0.25,
        marketTrends: 0.2,
        propertyCondition: 0.2
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('property-valuation', {
      body: propertyData
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-valuation', {
      body: propertyData
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should calculate property valuation with minimal data', async () => {
    // Arrange
    const propertyData = {
      address: '456 Test Ave',
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1
    };

    const mockResponse = {
      estimatedValue: 680000,
      confidenceScore: 60,
      valuationRange: {
        min: 650000,
        max: 710000
      },
      comparablesSummary: {
        median: 685000,
        mean: 682500,
        count: 4
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('property-valuation', {
      body: propertyData
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-valuation', {
      body: propertyData
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should return error with insufficient property data', async () => {
    // Arrange
    const propertyData = {
      // Missing critical fields
      address: '789 Test Blvd',
      city: 'Auckland'
    };
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { 
        message: 'Insufficient property data for valuation', 
        status: 400,
        details: 'Missing required fields: suburb, propertyType, bedrooms'
      }
    });

    // Act
    const result = await supabase.functions.invoke('property-valuation', {
      body: propertyData
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-valuation', {
      body: propertyData
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Insufficient property data');
  });

  it('should handle server errors gracefully', async () => {
    // Arrange
    const propertyData = {
      address: '123 Test Street',
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2
    };
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { message: 'Internal server error', status: 500 }
    });

    // Act
    const result = await supabase.functions.invoke('property-valuation', {
      body: propertyData
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Internal server error');
  });

  it('should apply weighting to valuation factors when specified', async () => {
    // Arrange
    const propertyData = {
      address: '123 Test Street',
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2,
      valuationFactorWeights: {
        location: 0.4,
        propertyAttributes: 0.3,
        marketTrends: 0.2, 
        propertyCondition: 0.1
      }
    };

    const mockResponse = {
      estimatedValue: 930000,
      confidenceScore: 82,
      valuationRange: {
        min: 915000,
        max: 945000
      },
      valuationFactors: {
        location: 0.4,
        propertyAttributes: 0.3,
        marketTrends: 0.2,
        propertyCondition: 0.1
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('property-valuation', {
      body: propertyData
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-valuation', {
      body: propertyData
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
    expect(result.data?.valuationFactors).toEqual(propertyData.valuationFactorWeights);
  });
}); 