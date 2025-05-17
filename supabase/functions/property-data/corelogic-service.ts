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
  CoreLogicMarketStats,
  CoreLogicPropertyImages,
  CoreLogicTitleDetail,
  CoreLogicComparableRequest,
  CoreLogicComparableResponse,
  CoreLogicPropertyActivity
} from "./corelogic-types.ts";

// Mock implementations for development without API access
import {
  createMockPropertyAttributes,
  createMockSalesHistory,
  createMockAVMResponse,
  createMockMarketStats,
  createMockMatchedAddress,
  createMockPropertyImages,
  createMockTitleDetail,
  createMockComparableProperties,
  createMockPropertyActivity
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
  private log(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
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
      const data = await this.makeApiRequest<Record<string, unknown>>(`/search/nz/matcher/address?${params.toString()}`);
      
      // Transform the response to our interface format
      const matchedAddress: CoreLogicMatchedAddress = {
        propertyId: data.propertyId as string,
        fullAddress: data.formattedAddress as string,
        address: data.address as string,
        addressComponents: {
          streetNumber: data.streetNumber as string,
          streetName: data.streetName as string,
          streetType: data.streetType as string,
          suburb: data.suburb as string,
          city: data.city as string,
          postcode: data.postcode as string
        },
        confidence: data.confidence as number
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
      const coreData = await this.makeApiRequest<Record<string, unknown>>(
        `/property-details/nz/properties/${propertyId}/attributes/core`
      );
      
      // Make the API request for additional attributes
      const additionalData = await this.makeApiRequest<Record<string, unknown>>(
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
      const data = await this.makeApiRequest<Record<string, unknown>>(
        `/property-details/nz/properties/${propertyId}/sales`
      );

      // Transform the response to our interface format
      const salesHistory: CoreLogicSaleRecord[] = ((data.sales as Array<Record<string, unknown>>) || []).map((sale: Record<string, unknown>) => ({
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
      const data = await this.makeApiRequest<Record<string, unknown>>(
        `/avm/nz/properties/${propertyId}/avm/intellival/consumer/current`
      );

      // Transform the response to our interface format
      const avmResponse: CoreLogicAVMResponse = {
        propertyId,
        valuationDate: data.valuationDate as string,
        estimatedValue: ((data.estimatedValue as Record<string, unknown>)?.value as number) || 0,
        confidenceScore: data.confidenceScore as number || 0,
        forecastedGrowth: ((data.forecastedGrowth as Record<string, unknown>)?.value as number) || 0,
        valuationRange: {
          low: ((data.valuationRange as Record<string, unknown>)?.lowValue as Record<string, unknown>)?.value as number || 0,
          high: ((data.valuationRange as Record<string, unknown>)?.highValue as Record<string, unknown>)?.value as number || 0
        },
        lastSale: data.lastSale ? {
          salePrice: ((data.lastSale as Record<string, unknown>).salePrice as Record<string, unknown>)?.value as number || 0,
          saleDate: (data.lastSale as Record<string, unknown>).saleDate as string,
          changePercentage: ((data.lastSale as Record<string, unknown>).changePercentage as Record<string, unknown>)?.value as number || 0,
          changeValue: ((data.lastSale as Record<string, unknown>).changeValue as Record<string, unknown>)?.value as number || 0
        } : null,
        comparableProperties: ((data.comparableProperties as Array<Record<string, unknown>>) || []).map((comp: Record<string, unknown>) => ({
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
      const data = await this.makeApiRequest<Record<string, unknown>>(
        "/statistics/v1/statistics.json",
        {
          method: "POST",
          body: JSON.stringify(requestBody)
        }
      );

      // Helper function to find a metric value
      const getMetricValue = (metricName: string): number => {
        const metric = (data.metrics as Array<Record<string, unknown>>)?.find((m: Record<string, unknown>) => m.name === metricName);
        return (metric?.value as number) || 0;
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

  /**
   * Get property images for a property
   */
  async getPropertyImages(propertyId: string): Promise<CoreLogicPropertyImages> {
    this.log(LogLevel.INFO, "Getting property images", { propertyId });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock property images");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return createMockPropertyImages(propertyId);
    }

    try {
      // Make the API request
      const data = await this.makeApiRequest<Record<string, unknown>>(
        `/property-details/nz/properties/${propertyId}/images/default`
      );

      // Transform the response to our interface format
      const propertyImages: CoreLogicPropertyImages = {
        propertyId,
        images: ((data.images as Array<Record<string, unknown>>) || []).map((image: Record<string, unknown>) => ({
          propertyId,
          imageId: image.imageId || `img-${Math.random().toString(36).substring(2, 11)}`,
          imageUrl: image.url || "",
          imageType: image.type || "exterior",
          captureDate: image.captureDate,
          description: image.description || "",
          sortOrder: image.sortOrder || 0
        }))
      };

      this.log(LogLevel.INFO, "Property images retrieved successfully", {
        propertyId,
        imageCount: propertyImages.images.length
      });

      return propertyImages;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get property images", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get property images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get title details for a property
   */
  async getTitleDetails(propertyId: string): Promise<CoreLogicTitleDetail> {
    this.log(LogLevel.INFO, "Getting title details", { propertyId });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock title details");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return createMockTitleDetail(propertyId);
    }

    try {
      // Make the API request
      const data = await this.makeApiRequest<Record<string, unknown>>(
        `/property-details/nz/properties/${propertyId}/title`
      );

      // Transform the response to our interface format
      const titleDetail: CoreLogicTitleDetail = {
        propertyId,
        titleReference: data.titleReference as string || "",
        titleType: data.titleType as string || "Freehold",
        landDistrict: data.landDistrict as string || "",
        estateType: data.estateType as string || "Fee Simple",
        registeredOwners: data.registeredOwners as string[] || [],
        legalDescription: data.legalDescription as string || "",
        areaSize: (data.areaSize as Record<string, unknown>)?.value as number || 0,
        areaUnit: ((data.areaSize as Record<string, unknown>)?.unit === "ha" ? "hectares" : "sqm") as "sqm" | "hectares",
        issueDate: data.issueDate as string || "",
        encumbrances: ((data.encumbrances as Array<Record<string, unknown>>) || []).map((enc: Record<string, unknown>) => ({
          type: enc.type || "",
          reference: enc.reference || "",
          dateRegistered: enc.dateRegistered || "",
          description: enc.description || ""
        }))
      };

      this.log(LogLevel.INFO, "Title details retrieved successfully", {
        propertyId,
        titleReference: titleDetail.titleReference
      });

      return titleDetail;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get title details", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get title details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get comparable properties for a property
   */
  async getComparableProperties(request: CoreLogicComparableRequest): Promise<CoreLogicComparableResponse> {
    const propertyId = request.propertyId;
    this.log(LogLevel.INFO, "Getting comparable properties", request);

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock comparable properties");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return createMockComparableProperties(request);
    }

    try {
      // Prepare request parameters
      const params = new URLSearchParams();
      if (request.radius) params.append("radius", request.radius.toString());
      if (request.maxResults) params.append("maxResults", request.maxResults.toString());
      if (request.similarityThreshold) params.append("similarityThreshold", request.similarityThreshold.toString());
      if (request.saleTimeframe) params.append("saleTimeframe", request.saleTimeframe.toString());

      // Make the API request
      const data = await this.makeApiRequest<Record<string, unknown>>(
        `/property-details/nz/properties/${propertyId}/comparables?${params.toString()}`
      );

      // Transform the response to our interface format
      const comparableResponse: CoreLogicComparableResponse = {
        sourcePropertyId: propertyId,
        comparableProperties: ((data.comparables as Array<Record<string, unknown>>) || []).map((comp: Record<string, unknown>) => ({
          propertyId: comp.propertyId || "",
          address: comp.address || "",
          suburb: comp.suburb || "",
          city: comp.city || "",
          propertyType: comp.propertyType || "Unknown",
          bedrooms: comp.bedrooms || 0,
          bathrooms: comp.bathrooms || 0,
          landSize: comp.landArea?.value || 0,
          floorArea: comp.floorArea?.value || 0,
          yearBuilt: comp.yearBuilt,
          saleDate: comp.lastSale?.saleDate,
          salePrice: comp.lastSale?.salePrice?.value || 0,
          distanceFromTarget: comp.distance?.value || 0,
          similarityScore: comp.similarityScore || 0,
          imageUrl: comp.imageUrl
        }))
      };

      this.log(LogLevel.INFO, "Comparable properties retrieved successfully", {
        propertyId,
        comparablesCount: comparableResponse.comparableProperties.length
      });

      return comparableResponse;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get comparable properties", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get comparable properties: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get property activity summary
   */
  async getPropertyActivity(propertyId: string): Promise<CoreLogicPropertyActivity> {
    this.log(LogLevel.INFO, "Getting property activity", { propertyId });

    // If using mock mode, return a mock response
    if (this.options.useMock) {
      this.log(LogLevel.DEBUG, "Using mock property activity");
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return createMockPropertyActivity(propertyId);
    }

    try {
      // Make the API request
      const data = await this.makeApiRequest<Record<string, unknown>>(
        `/property-details/nz/properties/${propertyId}/activity`
      );

      // Transform the response to our interface format
      const propertyActivity: CoreLogicPropertyActivity = {
        propertyId,
        recentSales: data.recentSales || 0,
        averageDaysOnMarket: data.averageDaysOnMarket || 0,
        currentListings: data.currentListings || 0,
        priceMovement: data.priceMovement || "stable",
        timePeriod: data.timePeriod || "last 6 months",
        recentVisits: data.recentVisits || 0
      };

      this.log(LogLevel.INFO, "Property activity retrieved successfully", {
        propertyId
      });

      return propertyActivity;
    } catch (error) {
      this.log(LogLevel.ERROR, "Failed to get property activity", {
        propertyId,
        error: String(error)
      });
      throw new Error(`Failed to get property activity: ${error instanceof Error ? error.message : String(error)}`);
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