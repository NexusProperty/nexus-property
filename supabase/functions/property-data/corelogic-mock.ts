/**
 * CoreLogic API Mock Implementations
 * 
 * This file provides mock responses for CoreLogic API endpoints.
 * These are used during development or when real API access is unavailable.
 */

import {
  CoreLogicAddressMatchRequest,
  CoreLogicMatchedAddress,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStatsRequest,
  CoreLogicMarketStats
} from "./corelogic-types.ts";

/**
 * Create a mock response for the address match endpoint
 */
export function createMockMatchedAddress(request: CoreLogicAddressMatchRequest): CoreLogicMatchedAddress {
  // Generate a predictable but somewhat random-looking property ID based on the address
  const propertyId = `P${hashString(request.address || "").toString().slice(0, 8)}`;
  
  // Extract street number and name from the address if available
  let streetNumber = "";
  let streetName = "";
  
  if (request.address) {
    const addressParts = request.address.split(" ");
    if (addressParts.length > 1) {
      streetNumber = addressParts[0];
      streetName = addressParts.slice(1).join(" ");
    } else {
      streetName = request.address;
    }
  }
  
  return {
    propertyId,
    fullAddress: `${request.address || ""}, ${request.suburb || ""}, ${request.city || ""} ${request.postcode || ""}`.trim().replace(/,\s*$/, ""),
    address: request.address || "",
    addressComponents: {
      streetNumber,
      streetName,
      streetType: extractStreetType(streetName),
      suburb: request.suburb,
      city: request.city,
      postcode: request.postcode
    },
    confidence: 95 // High confidence score for mock
  };
}

/**
 * Create mock property attributes
 */
export function createMockPropertyAttributes(propertyId: string): CoreLogicPropertyAttributes {
  // Use the property ID to generate consistent mock data
  const hash = Math.abs(hashString(propertyId));
  
  const propertyTypes = [
    "House", "Apartment", "Townhouse", "Unit", "Lifestyle"
  ];
  
  const landUses = [
    "Residential", "Commercial", "Rural", "Mixed Use"
  ];
  
  const features = [
    "Garage", "Deck", "Swimming Pool", "Garden", "Renovated Kitchen",
    "Modern Bathroom", "Air Conditioning", "Fireplace", "Balcony", "Ocean View"
  ];
  
  const constructionMaterials = [
    "Brick", "Weatherboard", "Concrete", "Timber", "Steel"
  ];
  
  const zonings = [
    "Residential", "Commercial", "Industrial", "Rural", "Mixed Use"
  ];
  
  return {
    propertyId,
    propertyType: propertyTypes[hash % propertyTypes.length],
    landUse: landUses[hash % landUses.length],
    landSize: 400 + (hash % 1000), // 400-1400 sqm
    floorArea: 100 + (hash % 200), // 100-300 sqm
    bedrooms: 2 + (hash % 4), // 2-5 bedrooms
    bathrooms: 1 + (hash % 3), // 1-3 bathrooms
    yearBuilt: 1980 + (hash % 42), // 1980-2022
    levels: 1 + (hash % 2), // 1-2 levels
    carSpaces: 1 + (hash % 3), // 1-3 car spaces
    features: selectRandomItems(features, 3 + (hash % 4), hash), // 3-6 features
    constructionMaterials: selectRandomItems(constructionMaterials, 1 + (hash % 2), hash), // 1-2 materials
    zoning: zonings[hash % zonings.length],
    legalDescription: `Lot ${1 + (hash % 100)} DP ${100000 + (hash % 900000)}` // Mock legal description
  };
}

/**
 * Create mock sales history records
 */
export function createMockSalesHistory(propertyId: string): CoreLogicSaleRecord[] {
  const hash = Math.abs(hashString(propertyId));
  const salesCount = 1 + (hash % 4); // 1-4 sales records
  const records: CoreLogicSaleRecord[] = [];
  
  const agencies = [
    "ABC Realty", "XYZ Properties", "City Real Estate", "Prestige Homes", "Coastal Properties"
  ];
  
  const saleTypes = [
    "Private Treaty", "Auction", "Private Sale", "Tender"
  ];
  
  // Current year
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < salesCount; i++) {
    const saleYear = currentYear - i - (hash % 3);
    const saleMonth = 1 + ((hash + i) % 12);
    const saleDay = 1 + ((hash + i * 7) % 28);
    
    const saleDate = `${saleYear}-${saleMonth.toString().padStart(2, '0')}-${saleDay.toString().padStart(2, '0')}`;
    
    // Base price with some pseudo-random variation
    const basePrice = 500000 + (hash % 500000);
    // Prices generally decrease as we go back in time
    const priceMultiplier = 1 - (i * 0.1);
    const salePrice = Math.round(basePrice * priceMultiplier);
    
    records.push({
      saleId: `S${propertyId.slice(1)}${i}`,
      propertyId,
      saleDate,
      salePrice,
      saleType: saleTypes[(hash + i) % saleTypes.length],
      vendor: `Vendor ${String.fromCharCode(65 + (hash % 26))}`,
      purchaser: `Purchaser ${String.fromCharCode(65 + ((hash + i) % 26))}`,
      agency: agencies[(hash + i) % agencies.length],
      settlementDate: i === 0 ? undefined : `${saleYear}-${(saleMonth + 1).toString().padStart(2, '0')}-${saleDay.toString().padStart(2, '0')}`
    });
  }
  
  return records;
}

/**
 * Create mock AVM (Automated Valuation Model) response
 */
export function createMockAVMResponse(propertyId: string): CoreLogicAVMResponse {
  const hash = Math.abs(hashString(propertyId));
  
  // Base estimated value
  const estimatedValue = 600000 + (hash % 900000); // $600k - $1.5M
  
  // Confidence score between 65-95
  const confidenceScore = 65 + (hash % 31);
  
  // Range width depends on confidence (lower confidence = wider range)
  const rangePercentage = 0.2 - (confidenceScore / 500); // 0.07-0.17 range width
  
  // Calculate low and high range values
  const lowValue = Math.round(estimatedValue * (1 - rangePercentage));
  const highValue = Math.round(estimatedValue * (1 + rangePercentage));
  
  // Forecasted growth between 1% and 7%
  const forecastedGrowth = 1 + (hash % 6);
  
  // Current date for valuation date
  const today = new Date();
  const valuationDate = today.toISOString().split('T')[0];
  
  // Create mock comparable properties
  const comparableProperties = [];
  const comparableCount = 3 + (hash % 4); // 3-6 comparable properties
  
  for (let i = 0; i < comparableCount; i++) {
    const simHash = hash + (i * 1000);
    const similarity = 95 - (i * 5) - (hash % 5); // 70-95% similarity
    const compPrice = estimatedValue * (0.9 + (0.2 * (simHash % 10) / 10)); // ±10% of the estimated value
    
    // Sale date in the last 6 months
    const saleMonthsAgo = (hash + i) % 6;
    const saleDate = new Date();
    saleDate.setMonth(saleDate.getMonth() - saleMonthsAgo);
    
    comparableProperties.push({
      propertyId: `P${(hash + (i * 1000)).toString().slice(0, 8)}`,
      address: `${10 + (simHash % 90)} ${streetNames[simHash % streetNames.length]} ${streetTypes[simHash % streetTypes.length]}`,
      salePrice: Math.round(compPrice),
      saleDate: saleDate.toISOString().split('T')[0],
      similarityScore: similarity,
      bedrooms: 2 + (simHash % 4), // 2-5 bedrooms
      bathrooms: 1 + (simHash % 3), // 1-3 bathrooms
      landSize: 400 + (simHash % 800), // 400-1200 sqm
      propertyType: i === 0 ? "House" : (i === 1 ? "Townhouse" : "Apartment") // Mix of property types
    });
  }
  
  // Last sale information (from sales history)
  const lastSale = {
    salePrice: estimatedValue * 0.85, // 85% of current value
    saleDate: new Date(today.getFullYear() - 2, (hash % 12), 1 + (hash % 28)).toISOString().split('T')[0],
    changePercentage: 15 + (hash % 10), // 15-25% growth since last sale
    changeValue: estimatedValue - (estimatedValue * 0.85) // Change in absolute terms
  };
  
  return {
    propertyId,
    valuationDate,
    estimatedValue,
    confidenceScore,
    forecastedGrowth,
    valuationRange: {
      low: lowValue,
      high: highValue
    },
    lastSale,
    comparableProperties
  };
}

/**
 * Create mock market statistics
 */
export function createMockMarketStats(request: CoreLogicMarketStatsRequest): CoreLogicMarketStats {
  const hash = Math.abs(hashString(`${request.suburb}${request.city}`));
  
  // Calculate mock statistics
  const medianPrice = 650000 + (hash % 850000); // $650k - $1.5M
  const annualGrowth = 2 + (hash % 9); // 2-10%
  const salesVolume = 20 + (hash % 80); // 20-100 sales
  const daysOnMarket = 15 + (hash % 46); // 15-60 days
  const listingCount = 10 + (hash % 50); // 10-60 listings
  
  return {
    location: {
      suburb: request.suburb,
      city: request.city
    },
    medianEstimatedValue: medianPrice + (hash % 50000), // Slightly higher than median sale price
    medianSalePrice: medianPrice,
    annualGrowth,
    salesVolume,
    medianDaysOnMarket: daysOnMarket,
    listingCount,
    period: "ThreeMonths",
    asOf: new Date().toISOString().split('T')[0]
  };
}

// Helper function to create a hash from a string
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash;
}

// Helper function to select random items from an array based on a seed
function selectRandomItems<T>(items: T[], count: number, seed: number): T[] {
  const selected: T[] = [];
  const availableIndices = Array.from({ length: items.length }, (_, i) => i);
  
  for (let i = 0; i < count && availableIndices.length > 0; i++) {
    const randomIndex = (seed + i * 17) % availableIndices.length;
    const selectedIndex = availableIndices[randomIndex];
    selected.push(items[selectedIndex]);
    availableIndices.splice(randomIndex, 1);
  }
  
  return selected;
}

// Extract street type from a street name string
function extractStreetType(streetName: string): string {
  const streetTypesRegex = /\b(street|st|road|rd|avenue|ave|drive|dr|place|pl|way|court|ct|terrace|tce|crescent|cres|boulevard|blvd|lane|close|cl)\b$/i;
  
  const match = streetName.match(streetTypesRegex);
  return match ? match[0] : "";
}

// Sample street names for mocking
const streetNames = [
  "Park", "Main", "High", "Church", "Mill", "Station", "Victoria", "Green", "Manor",
  "Kings", "Queens", "Albert", "York", "Grove", "Forest", "Meadow", "River", "Lake",
  "Hill", "Mountain", "Ocean", "Harbor", "Bay", "Spring", "Autumn", "Winter", "Summer"
];

// Sample street types for mocking
const streetTypes = [
  "Street", "Road", "Avenue", "Drive", "Place", "Way", "Court", "Terrace",
  "Lane", "Close", "Crescent", "Boulevard"
]; 