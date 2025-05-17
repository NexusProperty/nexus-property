/**
 * CoreLogic API Service
 * 
 * This service handles the communication with CoreLogic API for property data,
 * valuations, and market insights. It provides methods to fetch property details,
 * comparable properties, and market statistics.
 */

import {
  CoreLogicAuthConfig,
  CoreLogicAuthResponse,
  CoreLogicAddressSuggestion,
  CoreLogicMatchedAddress,
  CoreLogicAddressMatchRequest,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicImageResponse,
  CoreLogicMarketStatsParams,
  CoreLogicMarketStats
} from './corelogic-types';

// For TypeScript - we'll dynamically import these in mock mode only
import type {
  getMockAddressSuggestions,
  getMockMatchedAddress,
  getMockPropertyAttributes,
  getMockSalesHistory,
  getMockAVM,
  getMockPropertyImages,
  getMockMarketStats
} from './corelogic-mock';

/**
 * Log levels for CoreLogic API client
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

/**
 * Interface for log data
 */
export interface LogData {
  [key: string]: string | number | boolean | undefined | null | Record<string, unknown>;
}

/**
 * CoreLogic API client configuration
 */
export class CoreLogicApiClient {
  private config: CoreLogicAuthConfig;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private useMock: boolean;
  private logLevel: LogLevel;
  private requestTimeoutMs: number;
  private authRetryCount: number = 0;
  private readonly MAX_AUTH_RETRIES = 3;
  private readonly REQUEST_RETRY_DELAY_MS = 1000;

  /**
   * Create a new CoreLogic API client
   * @param config The API configuration including keys and URLs
   * @param useMock Whether to use mock data instead of real API calls
   * @param logLevel The log level for the client
   * @param requestTimeoutMs Request timeout in milliseconds
   */
  constructor(
    config: CoreLogicAuthConfig, 
    useMock = false, 
    logLevel = LogLevel.INFO,
    requestTimeoutMs = 10000
  ) {
    this.config = config;
    this.useMock = useMock;
    this.logLevel = logLevel;
    this.requestTimeoutMs = requestTimeoutMs;
    
    this.log(LogLevel.INFO, 'CoreLogic API client initialized', { 
      baseUrl: this.config.baseUrl, 
      useMock: this.useMock 
    });
  }

  /**
   * Internal logging method
   * @param level The log level
   * @param message The message to log
   * @param data Additional data to log
   */
  private log(level: LogLevel, message: string, data?: LogData) {
    if (level <= this.logLevel) {
      const logFn = level === LogLevel.ERROR ? console.error : 
                   level === LogLevel.WARN ? console.warn : 
                   level === LogLevel.INFO ? console.info : 
                   console.debug;
      
      const timestamp = new Date().toISOString();
      const levelStr = LogLevel[level];
      
      logFn(JSON.stringify({
        timestamp,
        level: levelStr,
        message,
        ...data
      }));
    }
  }

  /**
   * Get an authentication token for CoreLogic API
   * @returns The authentication token
   */
  private async getAuthToken(): Promise<string> {
    // Check if we have a valid token
    if (this.authToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      this.log(LogLevel.DEBUG, 'Using cached auth token', {
        expiresIn: Math.round((this.tokenExpiry.getTime() - Date.now()) / 1000)
      });
      return this.authToken;
    }

    try {
      // If using mock, return a dummy token
      if (this.useMock) {
        this.log(LogLevel.DEBUG, 'Using mock auth token');
        this.authToken = 'mock-auth-token';
        this.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour expiry
        return this.authToken;
      }

      // Make an actual authentication request
      this.log(LogLevel.INFO, 'Requesting new auth token');
      
      // This will depend on the specific authentication mechanism CoreLogic uses
      // For example, OAuth 2.0 client credentials flow:
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/oauth/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.config.apiKey,
            client_secret: this.config.apiSecret,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${errorText}`);
      }

      const authResponse: CoreLogicAuthResponse = await response.json();
      this.authToken = authResponse.access_token;
      this.tokenExpiry = new Date(Date.now() + (authResponse.expires_in * 1000));
      
      this.log(LogLevel.INFO, 'Auth token obtained', {
        expiresIn: authResponse.expires_in,
        tokenType: authResponse.token_type
      });
      
      // Reset retry counter on success
      this.authRetryCount = 0;
      
      return this.authToken;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Authentication error', { 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Simple retry mechanism
      if (this.authRetryCount < this.MAX_AUTH_RETRIES) {
        this.authRetryCount++;
        this.log(LogLevel.WARN, `Retrying authentication (${this.authRetryCount}/${this.MAX_AUTH_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, this.REQUEST_RETRY_DELAY_MS));
        return this.getAuthToken();
      }
      
      throw new Error(`Failed to authenticate with CoreLogic API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Fetch with timeout
   * @param url The URL to fetch
   * @param options Fetch options
   * @returns The fetch response
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a request to the CoreLogic API
   * @param endpoint The API endpoint to call
   * @param params Optional query parameters
   * @param method HTTP method (GET by default)
   * @param body Optional request body for POST requests
   * @returns The parsed response data
   */
  private async request<T, P = Record<string, string | number | boolean | undefined | null>>(
    endpoint: string,
    params?: P,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 10);
    
    try {
      this.log(LogLevel.INFO, `API request initiated`, { 
        requestId,
        endpoint, 
        method,
        params: this.logLevel >= LogLevel.DEBUG ? params : undefined
      });
      
      // Get auth token
      const token = await this.getAuthToken();

      // If using mock, return mock data
      if (this.useMock) {
        this.log(LogLevel.INFO, `Using mock data`, { requestId, endpoint });
        
        // Note: dynamic imports are supported in newer Node.js versions and modern browsers
        try {
          // Using an async dynamic import to ensure this works in Edge Functions
          const mockModule = await import('./corelogic-mock');
          
          let mockResult: unknown;
          
          // Handle different endpoints using the imported mock functions
          if (endpoint === '/property/nz/v2/suggest.json' && (params as Record<string, unknown>)?.q) {
            mockResult = mockModule.getMockAddressSuggestions((params as Record<string, unknown>).q as string);
          } else if (endpoint === '/search/nz/matcher/address') {
            const addressParams = params as unknown as CoreLogicAddressMatchRequest;
            mockResult = mockModule.getMockMatchedAddress(
              addressParams.address || '', 
              addressParams.suburb || '', 
              addressParams.city || ''
            );
          } else if (endpoint.match(/\/property-details\/nz\/properties\/.*\/attributes\/core/)) {
            const propertyId = endpoint.split('/').slice(-3)[0];
            mockResult = mockModule.getMockPropertyAttributes(propertyId);
          } else if (endpoint.match(/\/property-details\/nz\/properties\/.*\/attributes\/additional/)) {
            const propertyId = endpoint.split('/').slice(-3)[0];
            mockResult = mockModule.getMockPropertyAttributes(propertyId);
          } else if (endpoint.match(/\/property-details\/nz\/properties\/.*\/sales/)) {
            const propertyId = endpoint.split('/').slice(-2)[0];
            mockResult = mockModule.getMockSalesHistory(propertyId);
          } else if (endpoint.match(/\/avm\/nz\/properties\/.*\/avm\/intellival\/consumer\/current/)) {
            const propertyId = endpoint.split('/').slice(-4)[0];
            mockResult = mockModule.getMockAVM(propertyId);
          } else if (endpoint.match(/\/property-details\/nz\/properties\/.*\/images\/default/)) {
            const propertyId = endpoint.split('/').slice(-3)[0];
            mockResult = mockModule.getMockPropertyImages(propertyId);
          } else if (endpoint === '/statistics/v1/statistics.json') {
            const statsParams = params as unknown as CoreLogicMarketStatsParams;
            mockResult = mockModule.getMockMarketStats(
              statsParams.suburb || '', 
              statsParams.city || ''
            );
          } else {
            // Default fallback if no match
            this.log(LogLevel.WARN, `No mock implementation for endpoint`, { 
              requestId, 
              endpoint 
            });
            mockResult = {} as T;
          }
          
          const responseTime = Date.now() - startTime;
          this.log(LogLevel.INFO, `Mock API request completed`, { 
            requestId, 
            endpoint, 
            responseTime,
            resultSize: JSON.stringify(mockResult).length
          });
          
          return mockResult as T;
        } catch (mockError) {
          this.log(LogLevel.ERROR, `Error using mock implementation`, { 
            requestId, 
            endpoint, 
            error: mockError instanceof Error ? mockError.message : String(mockError)
          });
          return {} as T;
        }
      }

      // Build URL with query parameters
      const url = new URL(`${this.config.baseUrl}${endpoint}`);
      if (params && method === 'GET') {
        Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      this.log(LogLevel.DEBUG, `Making ${method} request`, { 
        requestId, 
        url: url.toString() 
      });

      // Make the request
      const response = await this.fetchWithTimeout(url.toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : method === 'POST' && params ? JSON.stringify(params) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const responseData = await response.json() as T;
      const responseTime = Date.now() - startTime;
      
      this.log(LogLevel.INFO, `API request completed successfully`, { 
        requestId, 
        endpoint, 
        status: response.status, 
        responseTime,
        resultSize: JSON.stringify(responseData).length
      });
      
      return responseData;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.log(LogLevel.ERROR, `Error calling CoreLogic API`, { 
        requestId, 
        endpoint, 
        error: error instanceof Error ? error.message : String(error),
        responseTime
      });
      throw new Error(`Failed to call CoreLogic API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper method to extract property ID from endpoint URL
   * @param endpoint The API endpoint
   * @param position Position of the property ID in the path
   * @returns The extracted property ID
   */
  private extractPropertyIdFromEndpoint(endpoint: string, position: number): string {
    const parts = endpoint.split('/');
    return parts.length > position ? parts[parts.length - position] : 'unknown';
  }

  /**
   * Get address suggestions based on a search query
   * @param query The address search query
   * @returns Array of address suggestions
   */
  async suggestAddress(query: string): Promise<CoreLogicAddressSuggestion[]> {
    if (!query || query.trim().length < 3) {
      this.log(LogLevel.WARN, 'Address suggestion query too short', { query });
      return [];
    }
    
    return this.request<CoreLogicAddressSuggestion[]>(
      '/property/nz/v2/suggest.json',
      { q: query }
    );
  }

  /**
   * Match an address to get a propertyId
   * @param addressDetails The address details to match
   * @returns The matched address with propertyId
   */
  async matchAddress(addressDetails: CoreLogicAddressMatchRequest): Promise<CoreLogicMatchedAddress> {
    if (!addressDetails.address) {
      throw new Error('Address is required for address matching');
    }
    
    return this.request<CoreLogicMatchedAddress>(
      '/search/nz/matcher/address',
      addressDetails
    );
  }

  /**
   * Get property attributes from CoreLogic
   * @param propertyId The CoreLogic property ID
   * @returns The property attributes
   */
  async getPropertyAttributes(propertyId: string): Promise<CoreLogicPropertyAttributes> {
    if (!propertyId) {
      throw new Error('Property ID is required to fetch property attributes');
    }
    
    try {
      // Get core attributes
      const coreAttributes = await this.request<CoreLogicPropertyAttributes>(
        `/property-details/nz/properties/${propertyId}/attributes/core`
      );
      
      // Get additional attributes
      const additionalAttributes = await this.request<CoreLogicPropertyAttributes>(
        `/property-details/nz/properties/${propertyId}/attributes/additional`
      );
      
      // Combine the attributes
      const combinedAttributes = {
        ...coreAttributes,
        ...additionalAttributes,
        propertyId // Ensure propertyId is included
      };
      
      return combinedAttributes;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error fetching property attributes', { 
        propertyId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to get property attributes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get property sales history
   * @param propertyId The CoreLogic property ID
   * @returns Array of sale records
   */
  async getPropertySalesHistory(propertyId: string): Promise<CoreLogicSaleRecord[]> {
    if (!propertyId) {
      throw new Error('Property ID is required to fetch sales history');
    }
    
    return this.request<CoreLogicSaleRecord[]>(
      `/property-details/nz/properties/${propertyId}/sales`
    );
  }

  /**
   * Get property automated valuation model (AVM) data
   * @param propertyId The CoreLogic property ID
   * @returns The AVM data
   */
  async getPropertyAVM(propertyId: string): Promise<CoreLogicAVMResponse> {
    if (!propertyId) {
      throw new Error('Property ID is required to fetch AVM data');
    }
    
    return this.request<CoreLogicAVMResponse>(
      `/avm/nz/properties/${propertyId}/avm/intellival/consumer/current`
    );
  }

  /**
   * Get property images
   * @param propertyId The CoreLogic property ID
   * @returns The property images
   */
  async getPropertyImage(propertyId: string): Promise<CoreLogicImageResponse> {
    if (!propertyId) {
      throw new Error('Property ID is required to fetch property images');
    }
    
    return this.request<CoreLogicImageResponse>(
      `/property-details/nz/properties/${propertyId}/images/default`
    );
  }

  /**
   * Get market statistics
   * @param params The market statistics parameters
   * @returns The market statistics
   */
  async getMarketStatistics(params: CoreLogicMarketStatsParams): Promise<CoreLogicMarketStats> {
    if (!params.suburb && !params.city && !params.postcode) {
      throw new Error('At least one location parameter (suburb, city, or postcode) is required');
    }
    
    return this.request<CoreLogicMarketStats>(
      '/statistics/v1/statistics.json',
      params,
      'POST'
    );
  }
}

/**
 * Create a CoreLogic API client with the provided configuration
 * @param config The API configuration
 * @param useMock Whether to use mock data
 * @param logLevel The log level for the client
 * @param requestTimeoutMs Request timeout in milliseconds
 * @returns A configured CoreLogic API client
 */
export function createCoreLogicClient(
  config: CoreLogicAuthConfig,
  useMock = false,
  logLevel = LogLevel.INFO,
  requestTimeoutMs = 10000
): CoreLogicApiClient {
  return new CoreLogicApiClient(config, useMock, logLevel, requestTimeoutMs);
}
