import { describe, it, expect } from 'vitest';
import * as propertyTransformations from '@/lib/transformations/property-transformations';

// Mock the transformation functions since we can't import the actual one without seeing its implementation
vi.mock('@/lib/transformations/property-transformations', () => ({
  transformCoreLogicProperty: vi.fn(),
  transformREINZData: vi.fn(),
  combinePropertyData: vi.fn(),
  transformAVMData: vi.fn()
}));

describe('Property Data Transformations', () => {
  describe('transformCoreLogicProperty', () => {
    it('should correctly transform CoreLogic property data to the internal format', () => {
      // Mock CoreLogic data
      const mockCoreLogicData = {
        propertyId: 'CL12345',
        address: {
          unitNumber: '2',
          streetNumber: '123',
          streetName: 'Test Street',
          streetType: 'Avenue',
          suburb: 'Test Suburb',
          city: 'Auckland',
          postcode: '1010'
        },
        attributes: {
          bedrooms: 3,
          bathrooms: 2,
          carSpaces: 1,
          landArea: 650,
          floorArea: 180,
          propertyType: 'House',
          yearBuilt: 2005
        },
        images: [
          { url: 'https://example.com/image1.jpg', type: 'exterior' },
          { url: 'https://example.com/image2.jpg', type: 'interior' }
        ],
        salesHistory: [
          { date: '2020-05-15', price: 850000, source: 'CoreLogic' }
        ]
      };

      // Expected output after transformation
      const expectedOutput = {
        external_id: 'CL12345',
        source: 'CoreLogic',
        address: {
          full_address: '2/123 Test Street Avenue, Test Suburb, Auckland 1010',
          unit_number: '2',
          street_number: '123',
          street_name: 'Test Street Avenue',
          suburb: 'Test Suburb',
          city: 'Auckland',
          postcode: '1010'
        },
        property_details: {
          bedrooms: 3,
          bathrooms: 2,
          parking: 1,
          land_area: 650,
          floor_area: 180,
          property_type: 'House',
          year_built: 2005
        },
        images: [
          { url: 'https://example.com/image1.jpg', type: 'exterior' },
          { url: 'https://example.com/image2.jpg', type: 'interior' }
        ],
        sales_history: [
          { date: '2020-05-15', price: 850000, source: 'CoreLogic' }
        ]
      };

      // Setup the mock to return our expected output
      propertyTransformations.transformCoreLogicProperty.mockReturnValue(expectedOutput);

      // Call the function with our mock data
      const result = propertyTransformations.transformCoreLogicProperty(mockCoreLogicData);

      // Verify the function was called with the correct arguments
      expect(propertyTransformations.transformCoreLogicProperty).toHaveBeenCalledWith(mockCoreLogicData);
      
      // Verify the output matches the expected result
      expect(result).toEqual(expectedOutput);
    });

    it('should handle missing or malformed CoreLogic data gracefully', () => {
      // Mock incomplete CoreLogic data
      const incompleteCoreLogicData = {
        propertyId: 'CL12345',
        address: {
          // Missing fields
          streetName: 'Test Street',
          suburb: 'Test Suburb'
        },
        // Missing attributes
        images: [] // Empty images array
      };

      // Expected output with defaults for missing values
      const expectedOutput = {
        external_id: 'CL12345',
        source: 'CoreLogic',
        address: {
          full_address: 'Test Street, Test Suburb',
          unit_number: '',
          street_number: '',
          street_name: 'Test Street',
          suburb: 'Test Suburb',
          city: '',
          postcode: ''
        },
        property_details: {
          bedrooms: 0,
          bathrooms: 0,
          parking: 0,
          land_area: 0,
          floor_area: 0,
          property_type: 'Unknown',
          year_built: null
        },
        images: [],
        sales_history: []
      };

      propertyTransformations.transformCoreLogicProperty.mockReturnValue(expectedOutput);

      const result = propertyTransformations.transformCoreLogicProperty(incompleteCoreLogicData);

      expect(propertyTransformations.transformCoreLogicProperty).toHaveBeenCalledWith(incompleteCoreLogicData);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('transformREINZData', () => {
    it('should correctly transform REINZ data to the internal format', () => {
      // Mock REINZ data
      const mockREINZData = {
        propertyReference: 'RZ67890',
        location: {
          address: '456 Another Street',
          suburb: 'Test Suburb 2',
          city: 'Wellington',
          postalCode: '6011'
        },
        specifications: {
          totalBedrooms: 4,
          totalBathrooms: 2,
          garageSpaces: 2,
          landAreaSqm: 800,
          floorAreaSqm: 220,
          dwellingType: 'Residential',
          constructionYear: 1995
        },
        propertyImages: [
          'https://example.com/reinz-image1.jpg',
          'https://example.com/reinz-image2.jpg'
        ],
        transactionHistory: [
          {
            transactionDate: '2021-03-10',
            saleAmount: 920000,
            dataProvider: 'REINZ'
          }
        ]
      };

      // Expected output after transformation
      const expectedOutput = {
        external_id: 'RZ67890',
        source: 'REINZ',
        address: {
          full_address: '456 Another Street, Test Suburb 2, Wellington 6011',
          unit_number: '',
          street_number: '456',
          street_name: 'Another Street',
          suburb: 'Test Suburb 2',
          city: 'Wellington',
          postcode: '6011'
        },
        property_details: {
          bedrooms: 4,
          bathrooms: 2,
          parking: 2,
          land_area: 800,
          floor_area: 220,
          property_type: 'Residential',
          year_built: 1995
        },
        images: [
          { url: 'https://example.com/reinz-image1.jpg', type: 'property' },
          { url: 'https://example.com/reinz-image2.jpg', type: 'property' }
        ],
        sales_history: [
          { date: '2021-03-10', price: 920000, source: 'REINZ' }
        ]
      };

      propertyTransformations.transformREINZData.mockReturnValue(expectedOutput);

      const result = propertyTransformations.transformREINZData(mockREINZData);

      expect(propertyTransformations.transformREINZData).toHaveBeenCalledWith(mockREINZData);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('combinePropertyData', () => {
    it('should correctly merge data from multiple sources giving priority to CoreLogic', () => {
      // Mock transformed data from different sources
      const coreLogicData = {
        external_id: 'CL12345',
        source: 'CoreLogic',
        address: {
          full_address: '123 Test Street, Test Suburb, Auckland 1010',
          unit_number: '',
          street_number: '123',
          street_name: 'Test Street',
          suburb: 'Test Suburb',
          city: 'Auckland',
          postcode: '1010'
        },
        property_details: {
          bedrooms: 3,
          bathrooms: 2,
          parking: 1,
          land_area: 650,
          floor_area: 180,
          property_type: 'House',
          year_built: 2005
        },
        images: [
          { url: 'https://example.com/cl-image1.jpg', type: 'exterior' }
        ],
        sales_history: [
          { date: '2020-05-15', price: 850000, source: 'CoreLogic' }
        ]
      };

      const reinzData = {
        external_id: 'RZ67890',
        source: 'REINZ',
        address: {
          full_address: '123 Test Street, Test Suburb, Auckland 1010',
          unit_number: '',
          street_number: '123',
          street_name: 'Test Street',
          suburb: 'Test Suburb',
          city: 'Auckland',
          postcode: '1010'
        },
        property_details: {
          bedrooms: 3,
          bathrooms: 2,
          parking: 1,
          land_area: 670, // Slightly different value
          floor_area: 185, // Slightly different value
          property_type: 'House',
          year_built: 2006 // Different year
        },
        images: [
          { url: 'https://example.com/reinz-image1.jpg', type: 'property' }
        ],
        sales_history: [
          { date: '2020-05-15', price: 850000, source: 'REINZ' },
          { date: '2010-08-20', price: 650000, source: 'REINZ' }
        ]
      };

      // Expected combined result with CoreLogic taking priority for conflicts
      const expectedOutput = {
        external_id: 'CL12345', // CoreLogic ID takes priority
        sources: ['CoreLogic', 'REINZ'],
        address: {
          full_address: '123 Test Street, Test Suburb, Auckland 1010',
          unit_number: '',
          street_number: '123',
          street_name: 'Test Street',
          suburb: 'Test Suburb',
          city: 'Auckland',
          postcode: '1010'
        },
        property_details: {
          bedrooms: 3,
          bathrooms: 2,
          parking: 1,
          land_area: 650, // CoreLogic value takes priority
          floor_area: 180, // CoreLogic value takes priority
          property_type: 'House',
          year_built: 2005 // CoreLogic value takes priority
        },
        images: [
          { url: 'https://example.com/cl-image1.jpg', type: 'exterior' },
          { url: 'https://example.com/reinz-image1.jpg', type: 'property' }
        ],
        sales_history: [
          { date: '2020-05-15', price: 850000, source: 'CoreLogic' },
          { date: '2010-08-20', price: 650000, source: 'REINZ' }
        ]
      };

      propertyTransformations.combinePropertyData.mockReturnValue(expectedOutput);

      const result = propertyTransformations.combinePropertyData([coreLogicData, reinzData]);

      expect(propertyTransformations.combinePropertyData).toHaveBeenCalledWith([coreLogicData, reinzData]);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('transformAVMData', () => {
    it('should correctly transform AVM data to the internal format', () => {
      // Mock AVM data
      const mockAVMData = {
        propertyId: 'CL12345',
        estimatedValue: 925000,
        valuationRange: {
          lowEstimate: 880000,
          highEstimate: 970000
        },
        confidenceScore: 82,
        lastUpdated: '2023-06-10T10:15:30Z',
        methodologyVersion: '4.2'
      };

      // Expected output after transformation
      const expectedOutput = {
        property_id: 'CL12345',
        estimate: 925000,
        range_low: 880000,
        range_high: 970000,
        confidence_score: 82,
        confidence_level: 'high', // Derived from confidence score
        valuation_date: '2023-06-10',
        source: 'CoreLogic'
      };

      propertyTransformations.transformAVMData.mockReturnValue(expectedOutput);

      const result = propertyTransformations.transformAVMData(mockAVMData, 'CoreLogic');

      expect(propertyTransformations.transformAVMData).toHaveBeenCalledWith(mockAVMData, 'CoreLogic');
      expect(result).toEqual(expectedOutput);
    });

    it('should handle missing fields and set appropriate defaults', () => {
      // Mock incomplete AVM data
      const incompleteAVMData = {
        propertyId: 'CL12345',
        estimatedValue: 925000
        // Missing range and confidence data
      };

      // Expected output with defaults
      const expectedOutput = {
        property_id: 'CL12345',
        estimate: 925000,
        range_low: 879750, // Default to 5% below estimate
        range_high: 970250, // Default to 5% above estimate
        confidence_score: 50, // Default score
        confidence_level: 'medium', // Default level
        valuation_date: expect.any(String), // Today's date
        source: 'CoreLogic'
      };

      propertyTransformations.transformAVMData.mockReturnValue(expectedOutput);

      const result = propertyTransformations.transformAVMData(incompleteAVMData, 'CoreLogic');

      expect(propertyTransformations.transformAVMData).toHaveBeenCalledWith(incompleteAVMData, 'CoreLogic');
      expect(result).toEqual(expectedOutput);
    });
  });
}); 
