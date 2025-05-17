/**
 * CoreLogic API - Mock Data for E2E Tests
 * 
 * This file contains mock property data for end-to-end testing.
 * The data mimics the structure returned by the CoreLogic API.
 */

/**
 * Property data interface
 */
export interface PropertyData {
  propertyId: string;
  address: {
    street: string;
    suburb: string;
    city: string;
    postcode: string;
    region: string;
    country: string;
  };
  attributes: {
    landArea?: number | null;
    floorArea?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    carSpaces?: number | null;
    propertyType: string;
    yearBuilt?: number | null;
    landUse?: string;
    zoning?: string;
    lotSize?: string;
  };
  valuation: {
    estimatedValue: number;
    valuationRange: {
      low: number;
      high: number;
    };
    confidence: string;
    lastUpdated: string;
    methodology?: string;
  } | null;
  sales?: Array<{
    date: string;
    price: number;
    type: string;
    source: string;
  }>;
  comparableProperties?: Array<{
    propertyId: string;
    address: string;
    saleDate: string;
    salePrice: number;
    attributes: {
      bedrooms: number;
      bathrooms: number;
      landArea: number;
      floorArea: number;
    };
    distanceKm: number;
  }>;
  marketStats?: {
    medianPrice: number;
    averagePrice: number;
    salesVolume: number;
    daysOnMarket: number;
    yearOnYearChange: number;
    quarterlyChange: number;
    region: string;
    period: string;
  };
  propertyHistory?: Array<{
    date: string;
    event: string;
    price?: number;
    details: string;
  }>;
  metadata: {
    source: string;
    dataVersion: string;
    timestamp: string;
    requestId: string;
    limitations?: string[];
  };
}

/**
 * Mock property data for testing
 */
export const mockPropertyData: Record<string, PropertyData> = {
  // Default property data
  default: {
    propertyId: 'P12345678',
    address: {
      street: '123 Main Street',
      suburb: 'Auckland Central',
      city: 'Auckland',
      postcode: '1010',
      region: 'Auckland',
      country: 'New Zealand'
    },
    attributes: {
      landArea: 450,
      floorArea: 180,
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 2,
      propertyType: 'Single Family',
      yearBuilt: 2005,
      landUse: 'Residential',
      zoning: 'Residential',
      lotSize: '450 sqm'
    },
    valuation: {
      estimatedValue: 1250000,
      valuationRange: {
        low: 1150000,
        high: 1350000
      },
      confidence: 'high',
      lastUpdated: '2023-09-15',
      methodology: 'Comparable Sales'
    },
    sales: [
      {
        date: '2018-06-10',
        price: 980000,
        type: 'Market Sale',
        source: 'CoreLogic'
      }
    ],
    comparableProperties: [
      {
        propertyId: 'P87654321',
        address: '125 Main Street, Auckland',
        saleDate: '2023-05-20',
        salePrice: 1275000,
        attributes: {
          bedrooms: 3,
          bathrooms: 2,
          landArea: 465,
          floorArea: 185
        },
        distanceKm: 0.2
      },
      {
        propertyId: 'P87654322',
        address: '52 Park Avenue, Auckland',
        saleDate: '2023-04-15',
        salePrice: 1225000,
        attributes: {
          bedrooms: 3,
          bathrooms: 2,
          landArea: 440,
          floorArea: 175
        },
        distanceKm: 0.5
      },
      {
        propertyId: 'P87654323',
        address: '18 Oak Street, Auckland',
        saleDate: '2023-06-02',
        salePrice: 1290000,
        attributes: {
          bedrooms: 4,
          bathrooms: 2,
          landArea: 470,
          floorArea: 195
        },
        distanceKm: 0.7
      }
    ],
    marketStats: {
      medianPrice: 1235000,
      averagePrice: 1275000,
      salesVolume: 78,
      daysOnMarket: 32,
      yearOnYearChange: 5.2,
      quarterlyChange: 1.8,
      region: 'Auckland Central',
      period: 'Q3 2023'
    },
    propertyHistory: [
      {
        date: '2018-06-10',
        event: 'Sale',
        price: 980000,
        details: 'Market Sale'
      },
      {
        date: '2018-06-25',
        event: 'Ownership Change',
        details: 'Transfer of Title'
      },
      {
        date: '2019-04-12',
        event: 'Building Consent',
        details: 'Renovation (Kitchen and Bathroom)'
      }
    ],
    metadata: {
      source: 'CoreLogic',
      dataVersion: '2023.09',
      timestamp: '2023-09-20T10:15:30Z',
      requestId: 'req-123456789'
    }
  },
  
  // Specific property - with minimal data
  'P87654321': {
    propertyId: 'P87654321',
    address: {
      street: '125 Main Street',
      suburb: 'Auckland Central',
      city: 'Auckland',
      postcode: '1010',
      region: 'Auckland',
      country: 'New Zealand'
    },
    attributes: {
      landArea: 465,
      floorArea: 185,
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,
      propertyType: 'Single Family',
      yearBuilt: 2002
    },
    valuation: {
      estimatedValue: 1275000,
      valuationRange: {
        low: 1200000,
        high: 1350000
      },
      confidence: 'high',
      lastUpdated: '2023-09-10'
    },
    metadata: {
      source: 'CoreLogic',
      dataVersion: '2023.09',
      timestamp: '2023-09-20T10:20:15Z',
      requestId: 'req-123456790'
    }
  },
  
  // Property with limited data (for testing partial data scenarios)
  'P99999999': {
    propertyId: 'P99999999',
    address: {
      street: '42 New Street',
      suburb: 'Newmarket',
      city: 'Auckland',
      postcode: '1023',
      region: 'Auckland',
      country: 'New Zealand'
    },
    attributes: {
      propertyType: 'Apartment',
      yearBuilt: null,
      floorArea: null,
      bedrooms: 2,
      bathrooms: 1
    },
    valuation: null, // No valuation data available
    metadata: {
      source: 'CoreLogic',
      dataVersion: '2023.09',
      timestamp: '2023-09-20T10:25:45Z',
      requestId: 'req-123456791',
      limitations: ['Insufficient data for valuation', 'Limited property history']
    }
  }
}; 