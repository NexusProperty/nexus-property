/**
 * REINZ API Type Definitions
 * 
 * This file contains TypeScript interfaces for the REINZ API request and response data.
 */

// Authentication configuration
export interface ReinzAuthConfig {
  apiKey: string;
  baseUrl: string;
}

// Market data request
export interface MarketDataRequest {
  suburb: string;
  city: string;
  propertyType?: string;
  bedrooms?: number;
  period?: number; // In months
}

// Historical market data
export interface HistoricalMarketDataRequest extends MarketDataRequest {
  period: number; // In months
}

// Market snapshot request
export interface MarketSnapshotRequest extends MarketDataRequest {}

// Suburb comparison request
export interface SuburbComparisonRequest extends MarketDataRequest {
  numberOfSuburbs: number;
}

// Trend analysis request
export interface TrendAnalysisRequest extends MarketDataRequest {
  historicalData: HistoricalMarketData;
}

// Historical market data response
export interface HistoricalMarketData {
  medianSalePrices: Array<{
    date: string; // ISO date string (YYYY-MM)
    medianPrice: number;
    volume: number;
  }>;
  medianRentPrices?: Array<{
    date: string; // ISO date string (YYYY-MM)
    medianRent: number;
    volume: number;
  }>;
  daysOnMarket: Array<{
    date: string; // ISO date string (YYYY-MM)
    medianDays: number;
  }>;
  listingVolumes: Array<{
    date: string; // ISO date string (YYYY-MM)
    newListings: number;
    totalListings: number;
  }>;
}

// Market snapshot response
export interface MarketSnapshot {
  asOf: string; // ISO date string (YYYY-MM)
  medianSalePrice: number;
  medianRent?: number;
  medianDaysOnMarket: number;
  totalProperties: number;
  activeListings: number;
  newListings: number;
  salesVolume: number;
  rentYield?: number;
  priceChangeQoQ: number; // Quarter-over-Quarter percentage
  priceChangeYoY: number; // Year-over-Year percentage
}

// Suburb comparison response
export interface SuburbComparison {
  asOf: string; // ISO date string (YYYY-MM)
  targetSuburb: {
    name: string;
    medianPrice: number;
    priceChangeYoY: number;
    activeListings: number;
  };
  comparisonSuburbs: Array<{
    name: string;
    medianPrice: number;
    priceChangeYoY: number;
    activeListings: number;
    priceDifference: number; // Percentage difference from target suburb
  }>;
}

// Trend analysis response
export interface TrendAnalysis {
  priceTrend: {
    current: 'rising' | 'falling' | 'stable';
    magnitude: number; // 0-10 scale
    forecast: 'increase' | 'decrease' | 'stable';
    confidence: number; // 0-1 scale
  };
  marketActivity: {
    current: 'high' | 'moderate' | 'low';
    trend: 'increasing' | 'decreasing' | 'stable';
    relativeTo: 'historical' | 'regional';
  };
  supplyDemand: {
    balance: 'supply' | 'demand' | 'balanced';
    strength: number; // 0-10 scale
    trend: 'widening' | 'narrowing' | 'stable';
  };
  seasonalAdjustment: {
    factor: number; // 0-1 scale
    appliedTo: string[]; // Fields to which seasonal adjustment was applied
  };
}

// Combined market data response
export interface MarketDataResponse {
  success: boolean;
  error?: string;
  data?: {
    historical: HistoricalMarketData;
    currentSnapshot: MarketSnapshot;
    suburbComparison: SuburbComparison;
    trendAnalysis: TrendAnalysis;
    datasource: {
      dataProvider: string;
      lastUpdated: string; // ISO date string (YYYY-MM-DD)
      reportPeriod: string; // ISO date string (YYYY-MM)
    };
  };
}
 