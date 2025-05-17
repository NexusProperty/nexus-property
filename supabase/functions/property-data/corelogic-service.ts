/**
 * CoreLogic API Service
 * 
 * This service provides a client for the CoreLogic API, handling authentication,
 * request formatting, and response parsing.
 */

// @ts-expect-error: Using Deno std modules
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

import {
  CoreLogicAuthConfig,
  CoreLogicAddressMatchRequest,
  CoreLogicMatchedAddress,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStatsRequest,
  CoreLogicMarketStats
} from "./corelogic-types.ts";

// Mock implementations for development without API access
import {
  createMockPropertyAttributes,
  createMockSalesHistory,
  createMockAVMResponse,
  createMockMarketStats,
  createMockMatchedAddress
} from "./corelogic-mock.ts";

// Log levels for the client
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface CoreLogicApiClientOptions {
  logLevel: LogLevel;
  useMock: boolean;
}

// Cache for access tokens to avoid unnecessary auth requests
interface TokenCache {
  token: string;
  expiresAt: number;
}

/**
 * Core implementation of the CoreLogic API client
 */
class CoreLogicApiClient {
  private config: CoreLogicAuthConfig;
  private options: CoreLogicApiClientOptions;
  private tokenCache: TokenCache | null = null;

  constructor(
    config: CoreLogicAuthConfig,
    options: CoreLogicApiClientOptions = { logLevel: LogLevel.INFO, useMock: false }
  ) {
    this.config = config;
    this.options = options;

    // Log initialization
    this.log(LogLevel.INFO, "CoreLogic API client initialized", {
      baseUrl: this.config.baseUrl,
      useMock: this.options.useMock
    });
  }

  /**
   * Get an authentication token for the CoreLogic API
   */
  private async getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      this.log(LogLevel.DEBUG, "Using cached auth token");
      return this.tokenCache.token;
    }

    // If using mock mode, return a fake token
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock auth token");
      this.tokenCache = {
        token: "mock-token-12345",
        expiresAt: Date.now() + 3600000 // 1 hour
      };
      return this.tokenCache.token;
    }

    try {
      // Create the auth credentials string
      const credentials = `${this.config.apiKey}:${this.config.apiSecret}`;
      // Convert to base64
      const encodedCredentials = base64Encode(new TextEncoder().encode(credentials));

      this.log(LogLevel.DEBUG, "Requesting auth token");

      // Make the auth request to get a token
      const response = await fetch(`${this.config.baseUrl}/auth/v1/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${encodedCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the token with expiry time (subtract 5 minutes for safety margin)
      this.tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000) - 300000
      };

      this.log(LogLevel.INFO, "Auth token obtained successfully");
      return this.tokenCache.token;
    } catch (error) {
      this.log(LogLevel.ERROR, "Authentication failed", { error: String(error) });
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Make an authenticated request to the CoreLogic API
   */
  private async makeApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    // If using mock mode, throw an error as this should not be called directly in mock mode
    if (this.options.useMock) {
      throw new Error("makeApiRequest should not be called directly when using mock mode");
    }

    try {
      // Get an auth token
      const token = await this.getAuthToken();

      // Set up the default headers
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers
      };

      // Make the API request
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        ...options,
        headers
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Parse the response as JSON
      const data = await response.json();
      return data as T;
    } catch (error) {
      this.log(LogLevel.ERROR, "API request failed", {
        path,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Log a message with the specified log level
   */
  private log(level: LogLevel, message: string, data: any = {}): void {
    if (level <= this.options.logLevel) {
      const levelName = LogLevel[level];
      console.log(JSON.stringify({
        level: levelName.toLowerCase(),
        service: "corelogic-api",
        message,
        ...data
      }));
    }
  }

  /**
   * Match an address to get a property ID
   */
  async matchAddress(request: CoreLogicAddressMatchRequest): Promise<CoreLogicMatchedAddress> {
    this.log(LogLevel.INFO, "Matching address", { address: request.address });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock address match");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return createMockMatchedAddress(request);
    }

    // Construct the query string
    const params = new URLSearchParams();
    if (request.address) params.append("address", request.address);
    if (request.suburb) params.append("suburb", request.suburb);
    if (request.city) params.append("city", request.city);
    if (request.postcode) params.append("postcode", request.postcode);

    try {
      // Make the API request
      const data = await this.makeApiRequest<any>(`/search/nz/matcher/address?${params.toString()}`);
      
      // Transform the response to our interface format
      const matchedAddress: CoreLogicMatchedAddress = {
        propertyId: data.propertyId,
        fullAddress: data.formattedAddress,
        address: data.address,
        addressComponents: {
          streetNumber: data.streetNumber,
          streetName: data.streetName,
          streetType: data.streetType,
          suburb: data.suburb,
          city: data.city,
          postcode: data.postcode
        },
        confidence: data.confidence
      };

      this.log(LogLevel.INFO, "Address matched successfully", {
        address: request.address,
        propertyId: matchedAddress.propertyId
      });

      return matchedAddress;
    } catch (error) {
      this.log(LogLevel.ERROR, "Address matching failed", {
        address: request.address,
        error: String(error)
      });
      throw new Error(`Failed to match address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get property attributes for a property
   */
  async getPropertyAttributes(propertyId: string): Promise<CoreLogicPropertyAttributes> {
    this.log(LogLevel.INFO, "Getting property attributes", { propertyId });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock property attributes");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return createMockPropertyAttributes(propertyId);
    }

    try {
      // Make the API request for core attributes
      const coreData = await this.makeApiRequest<any>(
        `/property-details/nz/properties/${propertyId}/attributes/core`
      );
      
      // Make the API request for additional attributes
      const additionalData = await this.makeApiRequest<any>(
        `/property-details/nz/properties/${propertyId}/attributes/additional`
      );

      // Combine and transform the responses to our interface format
      const propertyAttributes: CoreLogicPropertyAttributes = {
        propertyId,
        propertyType: coreData.propertyType || "Unknown",
        landUse: coreData.landUse || "Unknown",
        landSize: coreData.landArea?.value || 0,
        floorArea: coreData.floorArea?.value || 0,
        bedrooms: coreData.bedrooms || 0,
        bathrooms: coreData.bathrooms || 0,
        yearBuilt: coreData.yearBuilt || 0,
        levels: coreData.levels || 1,
        carSpaces: coreData.carSpaces || 0,
        features: additionalData.features || [],
        constructionMaterials: additionalData.constructionMaterials || [],
        zoning: additionalData.zoning || "Unknown",
        legalDescription: additionalData.legalDescription || ""
      };

      this.log(LogLevel.INFO, "Property attributes retrieved successfully", {
        propertyId,
        propertyType: propertyAttributes.propertyType
      });

      return propertyAttributes;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get property attributes", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get property attributes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get sales history for a property
   */
  async getPropertySalesHistory(propertyId: string): Promise<CoreLogicSaleRecord[]> {
    this.log(LogLevel.INFO, "Getting property sales history", { propertyId });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock sales history");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return createMockSalesHistory(propertyId);
    }

    try {
      // Make the API request
      const data = await this.makeApiRequest<any>(
        `/property-details/nz/properties/${propertyId}/sales`
      );

      // Transform the response to our interface format
      const salesHistory: CoreLogicSaleRecord[] = (data.sales || []).map((sale: any) => ({
        saleId: sale.saleId,
        propertyId,
        saleDate: sale.saleDate,
        salePrice: sale.salePrice?.value || 0,
        saleType: sale.saleType || "Unknown",
        vendor: sale.vendor || "Unknown",
        purchaser: sale.purchaser || "Unknown",
        agency: sale.agency || "Unknown",
        settlementDate: sale.settlementDate
      }));

      this.log(LogLevel.INFO, "Sales history retrieved successfully", {
        propertyId,
        salesCount: salesHistory.length
      });

      return salesHistory;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get sales history", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get sales history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get AVM (Automated Valuation Model) estimate for a property
   */
  async getPropertyAVM(propertyId: string): Promise<CoreLogicAVMResponse> {
    this.log(LogLevel.INFO, "Getting property AVM", { propertyId });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock AVM");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return createMockAVMResponse(propertyId);
    }

    try {
      // Make the API request
      const data = await this.makeApiRequest<any>(
        `/avm/nz/properties/${propertyId}/avm/intellival/consumer/current`
      );

      // Transform the response to our interface format
      const avmResponse: CoreLogicAVMResponse = {
        propertyId,
        valuationDate: data.valuationDate,
        estimatedValue: data.estimatedValue?.value || 0,
        confidenceScore: data.confidenceScore || 0,
        forecastedGrowth: data.forecastedGrowth?.value || 0,
        valuationRange: {
          low: data.valuationRange?.lowValue?.value || 0,
          high: data.valuationRange?.highValue?.value || 0
        },
        lastSale: data.lastSale ? {
          salePrice: data.lastSale.salePrice?.value || 0,
          saleDate: data.lastSale.saleDate,
          changePercentage: data.lastSale.changePercentage?.value || 0,
          changeValue: data.lastSale.changeValue?.value || 0
        } : null,
        comparableProperties: (data.comparableProperties || []).map((comp: any) => ({
          propertyId: comp.propertyId,
          address: comp.address,
          salePrice: comp.salePrice?.value || 0,
          saleDate: comp.saleDate,
          similarityScore: comp.similarityScore || 0,
          bedrooms: comp.bedrooms || 0,
          bathrooms: comp.bathrooms || 0,
          landSize: comp.landArea?.value || 0,
          propertyType: comp.propertyType || "Unknown"
        }))
      };

      this.log(LogLevel.INFO, "AVM retrieved successfully", {
        propertyId,
        estimatedValue: avmResponse.estimatedValue
      });

      return avmResponse;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get AVM", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get AVM: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get market statistics for a location
   */
  async getMarketStatistics(params: CoreLogicMarketStatsRequest): Promise<CoreLogicMarketStats> {
    this.log(LogLevel.INFO, "Getting market statistics", params);

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock market statistics");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 900));
      
      return createMockMarketStats(params);
    }

    try {
      // Prepare the request body
      const requestBody = {
        location: {
          suburb: params.suburb,
          city: params.city
        },
        metrics: [
          "MedianEstimatedValue",
          "MedianSalePrice",
          "AnnualGrowth",
          "SalesVolume",
          "MedianDaysOnMarket",
          "ListingCount"
        ],
        period: "ThreeMonths"
      };

      // Make the API request
      const data = await this.makeApiRequest<any>(
        "/statistics/v1/statistics.json",
        {
          method: "POST",
          body: JSON.stringify(requestBody)
        }
      );

      // Helper function to find a metric value
      const getMetricValue = (metricName: string): number => {
        const metric = data.metrics?.find((m: any) => m.name === metricName);
        return metric?.value || 0;
      };

      // Transform the response to our interface format
      const marketStats: CoreLogicMarketStats = {
        location: {
          suburb: params.suburb,
          city: params.city
        },
        medianEstimatedValue: getMetricValue("MedianEstimatedValue"),
        medianSalePrice: getMetricValue("MedianSalePrice"),
        annualGrowth: getMetricValue("AnnualGrowth"),
        salesVolume: getMetricValue("SalesVolume"),
        medianDaysOnMarket: getMetricValue("MedianDaysOnMarket"),
        listingCount: getMetricValue("ListingCount"),
        period: "ThreeMonths",
        asOf: data.asOf
      };

      this.log(LogLevel.INFO, "Market statistics retrieved successfully", {
        suburb: params.suburb,
        city: params.city
      });

      return marketStats;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get market statistics", {
        location: params,
        error: String(error)
      });
      throw new Error(`Failed to get market statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Create a CoreLogic API client instance
 */
export function createCoreLogicClient(
  config: CoreLogicAuthConfig,
  useMock: boolean = false,
  logLevel: LogLevel = LogLevel.INFO
): CoreLogicApiClient {
  return new CoreLogicApiClient(config, { logLevel, useMock });
}

/**
 * Export the CoreLogic API client class and related types
 */
export {
  CoreLogicApiClient,
  LogLevel
}; 