/**
 * CoreLogic API Type Definitions
 * 
 * This file contains TypeScript interfaces for the CoreLogic API request and response data.
 */

// Authentication configuration
export interface CoreLogicAuthConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

// Address matching
export interface CoreLogicAddressMatchRequest {
  address?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
}

export interface CoreLogicMatchedAddress {
  propertyId: string;
  fullAddress: string;
  address: string;
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

// Property attributes
export interface CoreLogicPropertyAttributes {
  propertyId: string;
  propertyType: string;
  landUse: string;
  landSize: number;
  floorArea: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  levels: number;
  carSpaces: number;
  features: string[];
  constructionMaterials: string[];
  zoning: string;
  legalDescription: string;
}

// Sales history
export interface CoreLogicSaleRecord {
  saleId: string;
  propertyId: string;
  saleDate: string;
  salePrice: number;
  saleType: string;
  vendor: string;
  purchaser: string;
  agency: string;
  settlementDate?: string;
}

// Automated Valuation Model
export interface CoreLogicAVMResponse {
  propertyId: string;
  valuationDate: string;
  estimatedValue: number;
  confidenceScore: number;
  forecastedGrowth: number;
  valuationRange: {
    low: number;
    high: number;
  };
  lastSale: {
    salePrice: number;
    saleDate: string;
    changePercentage: number;
    changeValue: number;
  } | null;
  comparableProperties: Array<{
    propertyId: string;
    address: string;
    salePrice: number;
    saleDate: string;
    similarityScore: number;
    bedrooms: number;
    bathrooms: number;
    landSize: number;
    propertyType: string;
  }>;
}

// Market statistics
export interface CoreLogicMarketStatsRequest {
  suburb: string;
  city: string;
}

export interface CoreLogicMarketStats {
  location: {
    suburb: string;
    city: string;
  };
  medianEstimatedValue: number;
  medianSalePrice: number;
  annualGrowth: number;
  salesVolume: number;
  medianDaysOnMarket: number;
  listingCount: number;
  period: string;
  asOf: string;
}

// Property data response (final transformed output)
export interface PropertyDataResponse {
  success: boolean;
  error?: string;
  data?: {
    propertyId: string;
    propertyDetails: {
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
    };
    comparableProperties: Array<{
      propertyId: string;
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
    }>;
    marketTrends: {
      medianPrice: number;
      annualGrowth: number;
      salesVolume: number;
      daysOnMarket: number;
    };
    valuation: {
      estimatedValue: number;
      valuationRange: {
        low: number;
        high: number;
      };
      confidenceScore: number;
      valuationDate: string;
    };
    salesHistory: Array<{
      saleDate: string;
      salePrice: number;
      saleType: string;
    }>;
  };
} 