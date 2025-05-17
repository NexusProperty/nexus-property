/**
 * CoreLogic API Mock Implementation
 * 
 * This file provides mock data for CoreLogic API endpoints during development.
 * It allows testing the integration without actual API access.
 */

import {
  CoreLogicAddressSuggestion,
  CoreLogicMatchedAddress,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicImageResponse,
  CoreLogicMarketStats
} from './corelogic-types';

/**
 * Get mock address suggestions
 * @param query The search query
 * @returns Array of address suggestions
 */
export function getMockAddressSuggestions(query: string): CoreLogicAddressSuggestion[] {
  // Create mock suggestions based on the query
  return [
    {
      id: '1',
      propertyId: 'prop123',
      displayAddress: `${query}, Auckland`,
      fullAddress: `${query}, Auckland, 1010`,
      addressComponents: {
        streetNumber: '123',
        streetName: query,
        streetType: 'Street',
        suburb: 'Auckland Central',
        city: 'Auckland',
        postcode: '1010'
      },
      confidence: 0.95
    },
    {
      id: '2',
      propertyId: 'prop456',
      displayAddress: `${query}, Wellington`,
      fullAddress: `${query}, Wellington, 6011`,
      addressComponents: {
        streetNumber: '456',
        streetName: query,
        streetType: 'Road',
        suburb: 'Wellington Central',
        city: 'Wellington',
        postcode: '6011'
      },
      confidence: 0.85
    },
    {
      id: '3',
      propertyId: 'prop789',
      displayAddress: `${query}, Christchurch`,
      fullAddress: `${query}, Christchurch, 8011`,
      addressComponents: {
        streetNumber: '789',
        streetName: query,
        streetType: 'Avenue',
        suburb: 'Christchurch Central',
        city: 'Christchurch',
        postcode: '8011'
      },
      confidence: 0.75
    }
  ];
}

/**
 * Get a mock matched address
 * @param address The address to match
 * @param suburb The suburb
 * @param city The city
 * @returns The matched address with propertyId
 */
export function getMockMatchedAddress(address: string, suburb: string, city: string): CoreLogicMatchedAddress {
  return {
    propertyId: 'prop123456',
    address: address,
    fullAddress: `${address}, ${suburb}, ${city}`,
    addressComponents: {
      unitNumber: '',
      streetNumber: '123',
      streetName: address.replace(/^\d+\s+/, ''),
      streetType: 'Street',
      suburb,
      city,
      postcode: '1010',
      state: 'Auckland'
    },
    coordinates: {
      latitude: -36.8509,
      longitude: 174.7645
    },
    confidence: 0.95
  };
}

/**
 * Get mock property attributes
 * @param propertyId The property ID
 * @returns The property attributes
 */
export function getMockPropertyAttributes(propertyId: string): CoreLogicPropertyAttributes {
  return {
    propertyId,
    propertyType: 'house',
    landUse: 'residential',
    bedrooms: 3,
    bathrooms: 2,
    landSize: 650,
    floorArea: 180,
    yearBuilt: 2005,
    propertyClass: 'residential',
    zoning: 'residential',
    legalDescription: 'Lot 123 DP 456789',
    isStrata: false,
    carSpaces: 2,
    heatingSources: ['Heat Pump', 'Gas'],
    condition: 'Good',
    architecturalStyle: 'Contemporary',
    constructionMaterials: {
      walls: 'Brick',
      roof: 'Tile',
      floors: 'Timber'
    },
    features: ['Garage', 'Garden', 'Renovated Kitchen'],
    views: ['City'],
    renovations: [
      {
        year: 2018,
        description: 'Kitchen renovation'
      },
      {
        year: 2020,
        description: 'Bathroom update'
      }
    ]
  };
}

/**
 * Get mock sales history
 * @param propertyId The property ID
 * @returns Array of sale records
 */
export function getMockSalesHistory(propertyId: string): CoreLogicSaleRecord[] {
  // Create a date 5 years ago
  const baseDate = new Date();
  baseDate.setFullYear(baseDate.getFullYear() - 5);
  
  // Generate sale records with increasing prices and dates
  return [
    {
      saleId: 'sale1',
      propertyId,
      date: new Date(baseDate.getTime()).toISOString().split('T')[0],
      price: 750000,
      saleType: 'normal',
      agency: 'Auckland Real Estate',
      settlementDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      listingDate: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysOnMarket: 60,
      priceChanges: [
        {
          date: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 780000
        },
        {
          date: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 765000
        }
      ]
    },
    {
      saleId: 'sale2',
      propertyId,
      date: new Date(baseDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 850000,
      saleType: 'normal',
      agency: 'Auckland Property Group',
      settlementDate: new Date(baseDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      listingDate: new Date(baseDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000 - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysOnMarket: 45,
      priceChanges: []
    },
    {
      saleId: 'sale3',
      propertyId,
      date: new Date(baseDate.getTime() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 950000,
      saleType: 'normal',
      agency: 'Premium Real Estate',
      settlementDate: new Date(baseDate.getTime() + 4 * 365 * 24 * 60 * 60 * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      listingDate: new Date(baseDate.getTime() + 4 * 365 * 24 * 60 * 60 * 1000 - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysOnMarket: 30,
      priceChanges: []
    }
  ];
}

/**
 * Get mock automated valuation model data
 * @param propertyId The property ID
 * @returns The AVM data
 */
export function getMockAVM(propertyId: string): CoreLogicAVMResponse {
  return {
    propertyId,
    valuationDate: new Date().toISOString().split('T')[0],
    valuationLow: 920000,
    valuationHigh: 980000,
    valuationEstimate: 950000,
    confidenceScore: 0.85,
    forecastAnnualGrowth: 0.03,
    previousValuations: [
      {
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 930000
      },
      {
        date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 900000
      }
    ],
    methodology: 'comparative'
  };
}

/**
 * Get mock property images
 * @param propertyId The property ID
 * @returns The property images
 */
export function getMockPropertyImages(propertyId: string): CoreLogicImageResponse {
  return {
    propertyId,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
        type: 'exterior',
        date: new Date().toISOString().split('T')[0],
        description: 'Front of property',
        width: 1200,
        height: 800
      },
      {
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
        type: 'exterior',
        date: new Date().toISOString().split('T')[0],
        description: 'Rear of property',
        width: 1200,
        height: 800
      },
      {
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
        type: 'interior',
        date: new Date().toISOString().split('T')[0],
        description: 'Living room',
        width: 1200,
        height: 800
      }
    ]
  };
}

/**
 * Get mock market statistics
 * @param suburb The suburb
 * @param city The city
 * @returns The market statistics
 */
export function getMockMarketStats(suburb: string, city: string): CoreLogicMarketStats {
  // Create time series data for the last 24 months
  const timeSeriesData = {
    medianPrices: [] as { date: string; value: number }[],
    salesVolumes: [] as { date: string; value: number }[]
  };
  
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 24);
  
  let basePrice = 900000;
  let baseSales = 40;
  
  for (let i = 0; i < 24; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    // Add some random variation
    const priceVariation = Math.random() * 20000 - 10000;
    const salesVariation = Math.round(Math.random() * 10 - 5);
    
    basePrice = basePrice * (1 + 0.003) + priceVariation; // 3.6% annual growth plus variation
    baseSales = Math.max(20, baseSales + salesVariation);
    
    timeSeriesData.medianPrices.push({
      date: currentDate.toISOString().split('T')[0],
      value: Math.round(basePrice)
    });
    
    timeSeriesData.salesVolumes.push({
      date: currentDate.toISOString().split('T')[0],
      value: Math.round(baseSales)
    });
  }
  
  return {
    medianPrice: 980000,
    meanPrice: 1050000,
    pricePerSqm: 7500,
    annualGrowth: 0.052,
    quarterlyGrowth: 0.012,
    salesVolume: 45,
    daysOnMarket: 28,
    listingCount: 120,
    medianRent: 750,
    rentalYield: 0.04,
    timeSeriesData,
    demographics: {
      population: 12000,
      medianAge: 35,
      medianIncome: 85000
    }
  };
}
