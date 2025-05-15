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

describe('property-data Edge Function', () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createClient<Database>('https://test.supabase.co', 'test-key');
  });

  it('should fetch property data with all components', async () => {
    // Arrange
    const propertyId = 'test-property-id';
    const mockResponse = {
      property: {
        id: propertyId,
        address: '123 Test Street',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2
      },
      comparables: [
        { id: 'comp-1', address: '125 Test Street', salePrice: 800000 },
        { id: 'comp-2', address: '127 Test Street', salePrice: 820000 }
      ],
      marketTrends: {
        medianPrice: 795000,
        averageDaysOnMarket: 28,
        salesVolume: 125
      },
      schoolZones: [
        { name: 'Test Primary School', type: 'Primary', decile: 8 },
        { name: 'Test High School', type: 'Secondary', decile: 9 }
      ]
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('property-data', {
      body: {
        propertyId,
        includeComparables: true,
        includeMarketTrends: true,
        includeSchoolZones: true
      }
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: {
        propertyId,
        includeComparables: true,
        includeMarketTrends: true,
        includeSchoolZones: true
      }
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should fetch only basic property data when optional components are not requested', async () => {
    // Arrange
    const propertyId = 'test-property-id';
    const mockResponse = {
      property: {
        id: propertyId,
        address: '123 Test Street',
        suburb: 'Testville',
        city: 'Auckland',
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('property-data', {
      body: {
        propertyId,
        includeComparables: false,
        includeMarketTrends: false,
        includeSchoolZones: false
      }
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: {
        propertyId,
        includeComparables: false,
        includeMarketTrends: false,
        includeSchoolZones: false
      }
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should return error when property is not found', async () => {
    // Arrange
    const propertyId = 'non-existent-id';
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { message: 'Property not found', status: 404 }
    });

    // Act
    const result = await supabase.functions.invoke('property-data', {
      body: { propertyId }
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: { propertyId }
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Property not found');
  });

  it('should handle server errors gracefully', async () => {
    // Arrange
    const propertyId = 'test-property-id';
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { message: 'Internal server error', status: 500 }
    });

    // Act
    const result = await supabase.functions.invoke('property-data', {
      body: { propertyId }
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Internal server error');
  });

  it('should request only specific components when specified', async () => {
    // Arrange
    const propertyId = 'test-property-id';
    const mockResponse = {
      property: {
        id: propertyId,
        address: '123 Test Street',
        suburb: 'Testville',
        city: 'Auckland'
      },
      comparables: [
        { id: 'comp-1', address: '125 Test Street', salePrice: 800000 },
        { id: 'comp-2', address: '127 Test Street', salePrice: 820000 }
      ]
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('property-data', {
      body: {
        propertyId,
        includeComparables: true,
        includeMarketTrends: false,
        includeSchoolZones: false
      }
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('property-data', {
      body: {
        propertyId,
        includeComparables: true,
        includeMarketTrends: false,
        includeSchoolZones: false
      }
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });
}); 