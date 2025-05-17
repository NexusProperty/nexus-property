/**
 * CoreLogic API Type Definitions
 * 
 * This file contains TypeScript interfaces for CoreLogic API requests and responses.
 * These are based on the API documentation and will be updated as we learn more
 * about the actual API structure during sandbox integration.
 */

/**
 * Authentication
 */
export interface CoreLogicAuthConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

export interface CoreLogicAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Address Suggestion/Validation
 */
export interface CoreLogicAddressSuggestion {
  id: string;
  propertyId: string;
  displayAddress: string;
  fullAddress: string;
  addressComponents: {
    streetNumber?: string;
    streetName?: string;
    streetType?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
  };
  confidence: number;
}

export interface CoreLogicAddressMatchRequest {
  address: string;
  suburb?: string;
  city?: string;
  postcode?: string;
}

export interface CoreLogicMatchedAddress {
  propertyId: string;
  address: string;
  fullAddress: string;
  addressComponents: {
    unitNumber?: string;
    streetNumber: string;
    streetName: string;
    streetType?: string;
    suburb: string;
    city: string;
    postcode?: string;
    state?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
}

/**
 * Property Attributes
 */
export interface CoreLogicCoreAttributes {
  propertyId: string;
  propertyType: string;
  landUse: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  propertyClass?: string;
  zoning?: string;
  legalDescription?: string;
  isStrata?: boolean;
}

export interface CoreLogicAdditionalAttributes {
  carSpaces?: number;
  heatingSources?: string[];
  condition?: string;
  architecturalStyle?: string;
  constructionMaterials?: {
    walls?: string;
    roof?: string;
    floors?: string;
  };
  features?: string[];
  views?: string[];
  renovations?: {
    year?: number;
    description?: string;
  }[];
}

export interface CoreLogicPropertyAttributes extends CoreLogicCoreAttributes, CoreLogicAdditionalAttributes {
  // Combined interface
}

/**
 * Sales History
 */
export interface CoreLogicSaleRecord {
  saleId: string;
  propertyId: string;
  date: string;
  price: number;
  saleType: string;
  sellerName?: string;
  buyerName?: string;
  agency?: string;
  settlementDate?: string;
  listingDate?: string;
  daysOnMarket?: number;
  priceChanges?: {
    date: string;
    price: number;
  }[];
  // Additional fields used in transformers
  address?: string;
  suburb?: string;
  city?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
}

/**
 * Automated Valuation Model (AVM)
 */
export interface CoreLogicAVMResponse {
  propertyId: string;
  valuationDate: string;
  valuationLow: number;
  valuationHigh: number;
  valuationEstimate: number;
  confidenceScore: number; // 0-1
  forecastAnnualGrowth?: number;
  previousValuations?: {
    date: string;
    value: number;
  }[];
  methodology?: string;
}

/**
 * Property Images
 */
export interface CoreLogicImageResponse {
  propertyId: string;
  images: Array<{
    url: string;
    type: string;
    date?: string;
    description?: string;
    width?: number;
    height?: number;
  }>;
}

/**
 * Market Statistics
 */
export interface CoreLogicMarketStatsParams {
  suburb?: string;
  city?: string;
  postcode?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  landSizeMin?: number;
  landSizeMax?: number;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CoreLogicMarketStats {
  medianPrice: number;
  meanPrice: number;
  pricePerSqm: number;
  annualGrowth: number;
  quarterlyGrowth: number;
  salesVolume: number;
  daysOnMarket: number;
  listingCount: number;
  medianRent?: number;
  rentalYield?: number;
  timeSeriesData?: {
    medianPrices: Array<{
      date: string;
      value: number;
    }>;
    salesVolumes: Array<{
      date: string;
      value: number;
    }>;
  };
  demographics?: {
    population: number;
    medianAge: number;
    medianIncome: number;
    // Other demographic data
  };
}

/**
 * Application Interface Types
 * These types match our application's existing interface
 */

export interface PropertyDetails {
  address: string;
  suburb: string;
  city: string;
  postcode?: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  features?: string[];
}

export interface ComparableProperty {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  saleDate?: string;
  salePrice?: number;
  similarityScore: number;
  imageUrl?: string;
}

export interface MarketTrends {
  medianPrice: number;
  annualGrowth: number;
  salesVolume: number;
  daysOnMarket: number;
}

export interface PropertyDataResponse {
  success: boolean;
  error?: string;
  data?: {
    propertyDetails: PropertyDetails;
    comparableProperties: ComparableProperty[];
    marketTrends: MarketTrends;
  };
}
