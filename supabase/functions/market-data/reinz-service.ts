/**
 * REINZ API Service Implementation
 * 
 * This file provides both real and mock implementations for the REINZ API.
 */

import {
  ReinzAuthConfig,
  HistoricalMarketDataRequest,
  MarketSnapshotRequest,
  SuburbComparisonRequest,
  TrendAnalysisRequest,
  HistoricalMarketData,
  MarketSnapshot,
  SuburbComparison,
  TrendAnalysis
} from './reinz-types.ts';

// Logging levels for service
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Interface for REINZ client
interface ReinzClient {
  getHistoricalMarketData(request: HistoricalMarketDataRequest): Promise<HistoricalMarketData>;
  getCurrentMarketSnapshot(request: MarketSnapshotRequest): Promise<MarketSnapshot>;
  getSuburbComparison(request: SuburbComparisonRequest): Promise<SuburbComparison>;
  getTrendAnalysis(request: TrendAnalysisRequest): Promise<TrendAnalysis>;
}

/**
 * Create a REINZ API client
 * @param config Auth configuration
 * @param useMock Whether to use mock data
 * @param logLevel Logging level
 * @returns REINZ client implementation
 */
export function createReinzClient(
  config: ReinzAuthConfig,
  useMock: boolean = false,
  logLevel: LogLevel = LogLevel.INFO
): ReinzClient {
  if (useMock || !config.apiKey) {
    return new MockReinzClient(logLevel);
  }
  return new RealReinzClient(config, logLevel);
}

/**
 * Real implementation of REINZ API client
 */
class RealReinzClient implements ReinzClient {
  private apiKey: string;
  private baseUrl: string;
  private logLevel: LogLevel;

  constructor(config: ReinzAuthConfig, logLevel: LogLevel) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.logLevel = logLevel;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level <= this.logLevel) {
      const levelString = LogLevel[level];
      console.log(JSON.stringify({
        level: levelString.toLowerCase(),
        message,
        ...data && { data }
      }));
    }
  }

  private async fetchWithAuth(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };

    this.log(LogLevel.DEBUG, `Making API request to ${url}`, { method });

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.log(LogLevel.DEBUG, 'API response received', { statusCode: response.status });
      return data;
    } catch (error) {
      this.log(LogLevel.ERROR, 'API request failed', { 
        error: error instanceof Error ? error.message : String(error),
        endpoint 
      });
      throw error;
    }
  }

  async getHistoricalMarketData(request: HistoricalMarketDataRequest): Promise<HistoricalMarketData> {
    this.log(LogLevel.INFO, 'Fetching historical market data', { request });
    
    const { suburb, city, propertyType, bedrooms, period } = request;
    
    const params = new URLSearchParams();
    params.append('suburb', suburb);
    params.append('city', city);
    if (propertyType) params.append('propertyType', propertyType);
    if (bedrooms) params.append('bedrooms', bedrooms.toString());
    params.append('period', period.toString());
    
    const endpoint = `/v1/market-data/historical?${params.toString()}`;
    
    try {
      const data = await this.fetchWithAuth(endpoint);
      
      // Transform the response to match our interface
      const historicalData: HistoricalMarketData = {
        medianSalePrices: data.sales.map((item: any) => ({
          date: item.period,
          medianPrice: item.medianPrice,
          volume: item.count
        })),
        medianRentPrices: data.rents?.map((item: any) => ({
          date: item.period,
          medianRent: item.medianRent,
          volume: item.count
        })),
        daysOnMarket: data.daysOnMarket.map((item: any) => ({
          date: item.period,
          medianDays: item.medianDays
        })),
        listingVolumes: data.listings.map((item: any) => ({
          date: item.period,
          newListings: item.newListings,
          totalListings: item.totalListings
        }))
      };
      
      return historicalData;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to fetch historical market data', { 
        error: error instanceof Error ? error.message : String(error),
        request 
      });
      throw new Error(`Failed to fetch historical market data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCurrentMarketSnapshot(request: MarketSnapshotRequest): Promise<MarketSnapshot> {
    this.log(LogLevel.INFO, 'Fetching current market snapshot', { request });
    
    const { suburb, city, propertyType, bedrooms } = request;
    
    const params = new URLSearchParams();
    params.append('suburb', suburb);
    params.append('city', city);
    if (propertyType) params.append('propertyType', propertyType);
    if (bedrooms) params.append('bedrooms', bedrooms.toString());
    
    const endpoint = `/v1/market-data/current?${params.toString()}`;
    
    try {
      const data = await this.fetchWithAuth(endpoint);
      
      // Transform the response to match our interface
      const snapshot: MarketSnapshot = {
        asOf: data.asOf,
        medianSalePrice: data.medianSalePrice,
        medianRent: data.medianRent,
        medianDaysOnMarket: data.medianDaysOnMarket,
        totalProperties: data.totalProperties,
        activeListings: data.activeListings,
        newListings: data.newListings,
        salesVolume: data.salesVolume,
        rentYield: data.rentYield,
        priceChangeQoQ: data.priceChangeQoQ,
        priceChangeYoY: data.priceChangeYoY
      };
      
      return snapshot;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to fetch current market snapshot', { 
        error: error instanceof Error ? error.message : String(error),
        request 
      });
      throw new Error(`Failed to fetch current market snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getSuburbComparison(request: SuburbComparisonRequest): Promise<SuburbComparison> {
    this.log(LogLevel.INFO, 'Fetching suburb comparison data', { request });
    
    const { suburb, city, propertyType, numberOfSuburbs } = request;
    
    const params = new URLSearchParams();
    params.append('suburb', suburb);
    params.append('city', city);
    if (propertyType) params.append('propertyType', propertyType);
    params.append('count', numberOfSuburbs.toString());
    
    const endpoint = `/v1/market-data/suburb-comparison?${params.toString()}`;
    
    try {
      const data = await this.fetchWithAuth(endpoint);
      
      // Transform the response to match our interface
      const comparison: SuburbComparison = {
        asOf: data.asOf,
        targetSuburb: {
          name: data.targetSuburb.name,
          medianPrice: data.targetSuburb.medianPrice,
          priceChangeYoY: data.targetSuburb.priceChangeYoY,
          activeListings: data.targetSuburb.activeListings
        },
        comparisonSuburbs: data.comparisonSuburbs.map((item: any) => ({
          name: item.name,
          medianPrice: item.medianPrice,
          priceChangeYoY: item.priceChangeYoY,
          activeListings: item.activeListings,
          priceDifference: item.priceDifference
        }))
      };
      
      return comparison;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to fetch suburb comparison data', { 
        error: error instanceof Error ? error.message : String(error),
        request 
      });
      throw new Error(`Failed to fetch suburb comparison data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTrendAnalysis(request: TrendAnalysisRequest): Promise<TrendAnalysis> {
    this.log(LogLevel.INFO, 'Fetching trend analysis', { request });
    
    const { suburb, city, propertyType } = request;
    
    const params = new URLSearchParams();
    params.append('suburb', suburb);
    params.append('city', city);
    if (propertyType) params.append('propertyType', propertyType);
    
    const endpoint = `/v1/market-data/trend-analysis?${params.toString()}`;
    
    try {
      const data = await this.fetchWithAuth(endpoint);
      
      // Transform the response to match our interface
      const analysis: TrendAnalysis = {
        priceTrend: {
          current: data.priceTrend.current,
          magnitude: data.priceTrend.magnitude,
          forecast: data.priceTrend.forecast,
          confidence: data.priceTrend.confidence
        },
        marketActivity: {
          current: data.marketActivity.current,
          trend: data.marketActivity.trend,
          relativeTo: data.marketActivity.relativeTo
        },
        supplyDemand: {
          balance: data.supplyDemand.balance,
          strength: data.supplyDemand.strength,
          trend: data.supplyDemand.trend
        },
        seasonalAdjustment: {
          factor: data.seasonalAdjustment.factor,
          appliedTo: data.seasonalAdjustment.appliedTo
        }
      };
      
      return analysis;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to fetch trend analysis', { 
        error: error instanceof Error ? error.message : String(error),
        request 
      });
      throw new Error(`Failed to fetch trend analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Mock implementation of REINZ API client for development
 */
class MockReinzClient implements ReinzClient {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level <= this.logLevel) {
      const levelString = LogLevel[level];
      console.log(JSON.stringify({
        level: levelString.toLowerCase(),
        message: `[MOCK] ${message}`,
        ...data && { data }
      }));
    }
  }

  // Helper to generate a stable random number based on a string
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Helper to generate a random number within a range, based on a seed
  private seededRandom(seed: number, min: number, max: number): number {
    const rnd = (seed * 9301 + 49297) % 233280;
    const result = min + (rnd / 233280) * (max - min);
    return Math.round(result * 100) / 100; // Round to 2 decimal places
  }

  async getHistoricalMarketData(request: HistoricalMarketDataRequest): Promise<HistoricalMarketData> {
    this.log(LogLevel.INFO, 'Fetching mock historical market data', { request });
    
    const seedValue = this.hashString(`${request.suburb}${request.city}${request.propertyType || ''}${request.bedrooms || ''}`);
    const currentDate = new Date();
    const result: HistoricalMarketData = {
      medianSalePrices: [],
      medianRentPrices: [],
      daysOnMarket: [],
      listingVolumes: []
    };
    
    // Base values that will be adjusted for each period
    const baseMedianPrice = this.seededRandom(seedValue, 400000, 1200000);
    const baseMedianRent = this.seededRandom(seedValue, 400, 1000);
    const baseDaysOnMarket = this.seededRandom(seedValue, 14, 60);
    const baseNewListings = this.seededRandom(seedValue, 5, 30);
    const baseTotalListings = this.seededRandom(seedValue, 20, 100);
    
    // Generate data for each period
    for (let i = 0; i < request.period; i++) {
      const dateObj = new Date(currentDate);
      dateObj.setMonth(currentDate.getMonth() - (request.period - i));
      const periodDate = dateObj.toISOString().substring(0, 7); // YYYY-MM format
      
      // Add some variation with a trend
      const trend = 1 + (i / request.period) * 0.2; // Gradually increase by up to 20%
      const seasonalFactor = 1 + 0.1 * Math.sin((i / 12) * 2 * Math.PI); // Seasonal variation
      const randomFactor = this.seededRandom(seedValue + i, 0.9, 1.1); // Random ±10%
      
      // Calculate values with the factors applied
      const priceMultiplier = trend * seasonalFactor * randomFactor;
      const volumeMultiplier = (1 + (i / request.period) * 0.15) * seasonalFactor * this.seededRandom(seedValue + i + 100, 0.85, 1.15);
      
      // Add data points
      result.medianSalePrices.push({
        date: periodDate,
        medianPrice: Math.round(baseMedianPrice * priceMultiplier),
        volume: Math.round(this.seededRandom(seedValue + i + 200, 10, 30) * volumeMultiplier)
      });
      
      result.medianRentPrices?.push({
        date: periodDate,
        medianRent: Math.round(baseMedianRent * priceMultiplier),
        volume: Math.round(this.seededRandom(seedValue + i + 300, 15, 45) * volumeMultiplier)
      });
      
      result.daysOnMarket.push({
        date: periodDate,
        medianDays: Math.round(baseDaysOnMarket * (1 / priceMultiplier)) // Inverse relationship to price
      });
      
      result.listingVolumes.push({
        date: periodDate,
        newListings: Math.round(baseNewListings * volumeMultiplier),
        totalListings: Math.round(baseTotalListings * volumeMultiplier)
      });
    }
    
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return result;
  }

  async getCurrentMarketSnapshot(request: MarketSnapshotRequest): Promise<MarketSnapshot> {
    this.log(LogLevel.INFO, 'Fetching mock current market snapshot', { request });
    
    const seedValue = this.hashString(`${request.suburb}${request.city}${request.propertyType || ''}${request.bedrooms || ''}`);
    const currentDate = new Date();
    const asOfDate = currentDate.toISOString().substring(0, 7); // YYYY-MM format
    
    // Generate realistic but mock data
    const medianSalePrice = Math.round(this.seededRandom(seedValue, 450000, 1500000));
    const medianRent = Math.round(this.seededRandom(seedValue + 100, 450, 1200));
    const medianDaysOnMarket = Math.round(this.seededRandom(seedValue + 200, 15, 65));
    const totalProperties = Math.round(this.seededRandom(seedValue + 300, 1000, 10000));
    const activeListings = Math.round(this.seededRandom(seedValue + 400, 20, 200));
    const newListings = Math.round(this.seededRandom(seedValue + 500, 5, 50));
    const salesVolume = Math.round(this.seededRandom(seedValue + 600, 10, 80));
    
    // Calculate derived metrics
    const rentYield = Math.round((medianRent * 52 / medianSalePrice) * 1000) / 10; // In percent
    const priceChangeQoQ = Math.round(this.seededRandom(seedValue + 700, -5, 8) * 10) / 10; // In percent
    const priceChangeYoY = Math.round(this.seededRandom(seedValue + 800, -10, 15) * 10) / 10; // In percent
    
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      asOf: asOfDate,
      medianSalePrice,
      medianRent,
      medianDaysOnMarket,
      totalProperties,
      activeListings,
      newListings,
      salesVolume,
      rentYield,
      priceChangeQoQ,
      priceChangeYoY
    };
  }

  async getSuburbComparison(request: SuburbComparisonRequest): Promise<SuburbComparison> {
    this.log(LogLevel.INFO, 'Fetching mock suburb comparison data', { request });
    
    const { suburb, city, numberOfSuburbs } = request;
    const seedValue = this.hashString(`${suburb}${city}${request.propertyType || ''}`);
    const currentDate = new Date();
    const asOfDate = currentDate.toISOString().substring(0, 7); // YYYY-MM format
    
    // Generate target suburb data
    const targetMedianPrice = Math.round(this.seededRandom(seedValue, 450000, 1500000));
    const targetPriceChangeYoY = Math.round(this.seededRandom(seedValue + 100, -8, 15) * 10) / 10; // In percent
    const targetActiveListings = Math.round(this.seededRandom(seedValue + 200, 20, 200));
    
    // Generate mock neighboring suburbs
    const comparisonSuburbs = [];
    const neighborhoodNames = [
      "North", "South", "East", "West", "Central", 
      "Heights", "Valley", "Park", "Beach", "Village"
    ];
    
    for (let i = 0; i < Math.min(numberOfSuburbs, neighborhoodNames.length); i++) {
      const suburbName = `${suburb} ${neighborhoodNames[i]}`;
      const priceDifference = Math.round(this.seededRandom(seedValue + i * 1000, -30, 30) * 10) / 10; // In percent
      const medianPrice = Math.round(targetMedianPrice * (1 + priceDifference / 100));
      const priceChangeYoY = Math.round(this.seededRandom(seedValue + i * 1000 + 100, -10, 18) * 10) / 10; // In percent
      const activeListings = Math.round(this.seededRandom(seedValue + i * 1000 + 200, 15, 250));
      
      comparisonSuburbs.push({
        name: suburbName,
        medianPrice,
        priceChangeYoY,
        activeListings,
        priceDifference
      });
    }
    
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 180));
    
    return {
      asOf: asOfDate,
      targetSuburb: {
        name: suburb,
        medianPrice: targetMedianPrice,
        priceChangeYoY: targetPriceChangeYoY,
        activeListings: targetActiveListings
      },
      comparisonSuburbs
    };
  }

  async getTrendAnalysis(request: TrendAnalysisRequest): Promise<TrendAnalysis> {
    this.log(LogLevel.INFO, 'Generating mock trend analysis', { request });
    
    const seedValue = this.hashString(`${request.suburb}${request.city}${request.propertyType || ''}`);
    
    // Analyze the historical data to determine trends
    const recentPrices = request.historicalData.medianSalePrices
      .slice(-6) // Last 6 months
      .map(item => item.medianPrice);
    
    const firstHalf = recentPrices.slice(0, 3);
    const secondHalf = recentPrices.slice(-3);
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    // Determine price trend based on percent change
    let priceTrendCurrent: 'rising' | 'falling' | 'stable';
    if (percentChange > 2) {
      priceTrendCurrent = 'rising';
    } else if (percentChange < -2) {
      priceTrendCurrent = 'falling';
    } else {
      priceTrendCurrent = 'stable';
    }
    
    const magnitude = Math.min(10, Math.abs(percentChange) * 1.5);
    
    // Determine forecast based on a combination of current trend and a random factor
    const forecastRnd = this.seededRandom(seedValue, 0, 1);
    let forecast: 'increase' | 'decrease' | 'stable';
    
    if (priceTrendCurrent === 'rising' && forecastRnd > 0.3) {
      forecast = 'increase';
    } else if (priceTrendCurrent === 'falling' && forecastRnd > 0.3) {
      forecast = 'decrease';
    } else if (forecastRnd > 0.7) {
      forecast = 'increase';
    } else if (forecastRnd > 0.4) {
      forecast = 'stable';
    } else {
      forecast = 'decrease';
    }
    
    // Calculate confidence based on consistency of trend
    const priceVariability = this.calculateVariability(recentPrices);
    const confidence = Math.max(0.3, Math.min(0.95, 1 - priceVariability / 20));
    
    // Market activity assessment
    const recentListings = request.historicalData.listingVolumes
      .slice(-6)
      .map(item => item.newListings);
    
    const avgListings = recentListings.reduce((a, b) => a + b, 0) / recentListings.length;
    let marketActivity: 'high' | 'moderate' | 'low';
    
    if (avgListings > 25) {
      marketActivity = 'high';
    } else if (avgListings > 10) {
      marketActivity = 'moderate';
    } else {
      marketActivity = 'low';
    }
    
    const listingsTrend = this.calculateTrend(recentListings);
    let activityTrend: 'increasing' | 'decreasing' | 'stable';
    
    if (listingsTrend > 0.1) {
      activityTrend = 'increasing';
    } else if (listingsTrend < -0.1) {
      activityTrend = 'decreasing';
    } else {
      activityTrend = 'stable';
    }
    
    // Supply and demand analysis
    const recentDays = request.historicalData.daysOnMarket
      .slice(-6)
      .map(item => item.medianDays);
    
    const avgDays = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
    let supplyDemandBalance: 'supply' | 'demand' | 'balanced';
    
    if (avgDays < 25 && avgListings > 15) {
      supplyDemandBalance = 'demand';
    } else if (avgDays > 40) {
      supplyDemandBalance = 'supply';
    } else {
      supplyDemandBalance = 'balanced';
    }
    
    const daysVariability = this.calculateVariability(recentDays);
    const supplyDemandStrength = 10 - Math.min(10, daysVariability);
    
    const daysTrend = this.calculateTrend(recentDays);
    let supplyDemandTrend: 'widening' | 'narrowing' | 'stable';
    
    if (daysTrend > 0.1) {
      supplyDemandTrend = 'widening'; // Days increasing = supply growing
    } else if (daysTrend < -0.1) {
      supplyDemandTrend = 'narrowing'; // Days decreasing = demand growing
    } else {
      supplyDemandTrend = 'stable';
    }
    
    // Seasonal adjustment
    const month = currentDate.getMonth();
    const seasonalFactor = 0.5 + 0.5 * Math.sin((month / 12) * 2 * Math.PI);
    
    // Add a small delay to simulate computation time
    await new Promise(resolve => setTimeout(resolve, 220));
    
    return {
      priceTrend: {
        current: priceTrendCurrent,
        magnitude,
        forecast,
        confidence
      },
      marketActivity: {
        current: marketActivity,
        trend: activityTrend,
        relativeTo: 'historical'
      },
      supplyDemand: {
        balance: supplyDemandBalance,
        strength: supplyDemandStrength,
        trend: supplyDemandTrend
      },
      seasonalAdjustment: {
        factor: seasonalFactor,
        appliedTo: ['priceTrend', 'marketActivity']
      }
    };
  }

  // Helper to calculate variability (coefficient of variation)
  private calculateVariability(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return (stdDev / mean) * 100; // As a percentage
  }

  // Helper to calculate trend as a normalized slope
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }
}

// Current date for mock data generation
const currentDate = new Date(); 