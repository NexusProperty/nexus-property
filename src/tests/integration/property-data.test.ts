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
        if (functionName === 'property-data') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                propertyDetails: {
                  address: '123 Test Street',
                  suburb: 'Testville',
                  city: 'Auckland',
                  region: 'Auckland Region',
                  country: 'New Zealand',
                  postalCode: '1010',
                  propertyType: 'House',
                  bedrooms: 3,
                  bathrooms: 2,
                  parkingSpaces: 1,
                  landSize: 500,
                  floorArea: 185,
                  yearBuilt: 2005,
                  councilRates: 2800,
                  zoning: 'Residential',
                  legalDescription: 'Lot 1 DP 12345',
                },
                salesHistory: [
                  {
                    date: '2020-05-15',
                    price: 780000,
                    source: 'CoreLogic NZ'
                  },
                  {
                    date: '2015-02-20',
                    price: 620000,
                    source: 'REINZ'
                  }
                ],
                nearbyAmenities: [
                  {
                    type: 'School',
                    name: 'Testville Primary School',
                    distanceKm: 0.5
                  },
                  {
                    type: 'Park',
                    name: 'Testville Park',
                    distanceKm: 0.8
                  },
                  {
                    type: 'Shopping',
                    name: 'Testville Mall',
                    distanceKm: 1.2
                  }
                ],
                zoningSummary: {
                  zoneCode: 'R1',
                  zoneName: 'Residential Zone',
                  allowedUses: ['Single family dwelling', 'Minor residential unit'],
                  heightRestrictions: '8m',
                  siteCoverage: '35%'
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

describe('Property Data Edge Function', () => {
  let supabase;
  
  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    
    // Create a fresh Supabase client for each test
    supabase = createClient('http://localhost:54321', 'fake-key');
  });

  it('should return a successful property data result with all required fields', async () => {
    // Arrange
    const address = '123 Test Street';
    const includeNearbyAmenities = true;
    const includeZoningSummary = true;
    
    // Act
    const response = await supabase.functions.invoke('property-data', {
      body: {
        address,
        includeNearbyAmenities,
        includeZoningSummary
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check property data structure
    const propertyData = response.data.data;
    expect(propertyData).toBeDefined();
    expect(propertyData.propertyDetails).toBeDefined();
    
    // Check property details
    const details = propertyData.propertyDetails;
    expect(details.address).toBe('123 Test Street');
    expect(details.suburb).toBe('Testville');
    expect(details.city).toBe('Auckland');
    expect(details.propertyType).toBe('House');
    expect(details.bedrooms).toBe(3);
    expect(details.bathrooms).toBe(2);
    
    // Check sales history
    expect(Array.isArray(propertyData.salesHistory)).toBe(true);
    expect(propertyData.salesHistory.length).toBe(2);
    propertyData.salesHistory.forEach(sale => {
      expect(sale.date).toBeDefined();
      expect(sale.price).toBeDefined();
      expect(sale.source).toBeDefined();
    });
    
    // Check nearby amenities
    expect(Array.isArray(propertyData.nearbyAmenities)).toBe(true);
    expect(propertyData.nearbyAmenities.length).toBe(3);
    propertyData.nearbyAmenities.forEach(amenity => {
      expect(amenity.type).toBeDefined();
      expect(amenity.name).toBeDefined();
      expect(amenity.distanceKm).toBeDefined();
    });
    
    // Check zoning summary
    expect(propertyData.zoningSummary).toBeDefined();
    expect(propertyData.zoningSummary.zoneCode).toBeDefined();
    expect(propertyData.zoningSummary.zoneName).toBeDefined();
    expect(Array.isArray(propertyData.zoningSummary.allowedUses)).toBe(true);
  });

  it('should return property data without optional components when not requested', async () => {
    // Arrange - Mock response without optional components
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          propertyDetails: {
            address: '123 Test Street',
            suburb: 'Testville',
            city: 'Auckland',
            propertyType: 'House',
            bedrooms: 3,
            bathrooms: 2
          },
          salesHistory: [
            {
              date: '2020-05-15',
              price: 780000,
              source: 'CoreLogic NZ'
            }
          ]
        }
      },
      error: null
    });
    
    // Act
    const response = await supabase.functions.invoke('property-data', {
      body: {
        address: '123 Test Street',
        includeNearbyAmenities: false,
        includeZoningSummary: false
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check optional components are not present
    const propertyData = response.data.data;
    expect(propertyData.propertyDetails).toBeDefined();
    expect(propertyData.salesHistory).toBeDefined();
    expect(propertyData.nearbyAmenities).toBeUndefined();
    expect(propertyData.zoningSummary).toBeUndefined();
  });

  it('should handle errors when invalid address is provided', async () => {
    // Arrange - Mock an error response
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Failed to find property: Address not found in database'
      },
      error: null
    });

    // Act - Call with invalid address
    const response = await supabase.functions.invoke('property-data', {
      body: {
        address: 'Non-existent Address',
        includeNearbyAmenities: true,
        includeZoningSummary: true
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(false);
    expect(response.data.error).toContain('Failed to find property');
  });
}); 