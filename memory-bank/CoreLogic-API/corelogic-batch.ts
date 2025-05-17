/**
 * CoreLogic API Batch Request Handler
 * 
 * This module provides functionality for batching multiple CoreLogic API requests
 * to improve performance and reduce API calls. It includes methods for:
 * 
 * 1. Batching multiple property requests
 * 2. Coordinating parallel API calls
 * 3. Rate limiting to prevent API throttling
 * 4. Error handling and retries for failed requests
 */

import { CoreLogicApiClient } from './corelogic-service';
import { 
  PropertyDataResponse,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStats,
  CoreLogicImageResponse,
  PropertyDetails
} from './corelogic-types';
import { createPropertyDataResponse } from './corelogic-transformers';

/**
 * Batch request configuration options
 */
export interface BatchRequestOptions {
  /** Maximum number of concurrent requests */
  maxConcurrent?: number;
  /** Delay between requests in milliseconds */
  requestDelayMs?: number;
  /** Number of retry attempts for failed requests */
  maxRetries?: number;
  /** Whether to continue on individual request errors */
  continueOnError?: boolean;
  /** Timeout for each request in milliseconds */
  timeoutMs?: number;
  /** Whether to wait for all requests to complete before returning */
  waitForAll?: boolean;
}

/**
 * Default batch request options
 */
const DEFAULT_BATCH_OPTIONS: BatchRequestOptions = {
  maxConcurrent: 5,
  requestDelayMs: 100,
  maxRetries: 2,
  continueOnError: true,
  timeoutMs: 10000,
  waitForAll: true
};

/**
 * Property data request parameters
 */
export interface PropertyRequest {
  propertyId: string;
  address?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
}

/**
 * Result of a batch property data operation
 */
export interface BatchPropertyResult {
  propertyId: string;
  response: PropertyDataResponse;
  success: boolean;
  error?: string;
  durationMs?: number;
}

/**
 * Extended property details including image URL
 */
export interface ExtendedPropertyDetails extends PropertyDetails {
  imageUrl?: string;
}

/**
 * Class for handling batched CoreLogic API requests
 */
export class CoreLogicBatchHandler {
  private client: CoreLogicApiClient;
  private options: BatchRequestOptions;
  private activeRequests = 0;
  
  /**
   * Create a new batch handler
   * @param client The CoreLogic API client
   * @param options Batch request options
   */
  constructor(client: CoreLogicApiClient, options?: BatchRequestOptions) {
    this.client = client;
    this.options = { ...DEFAULT_BATCH_OPTIONS, ...options };
  }
  
  /**
   * Fetch property data for multiple properties in a batch
   * @param requests Array of property requests
   * @returns Promise resolving to an array of batch results
   */
  async batchPropertyData(requests: PropertyRequest[]): Promise<BatchPropertyResult[]> {
    if (!requests.length) {
      return [];
    }
    
    console.log(JSON.stringify({
      level: 'info',
      message: 'Starting batch property data request',
      requestCount: requests.length,
      options: this.options
    }));
    
    const results: BatchPropertyResult[] = [];
    let completedCount = 0;
    let inProgress = 0;
    const queue = [...requests];
    
    return new Promise((resolve) => {
      const processQueue = async () => {
        // Check if we're done
        if (completedCount === requests.length) {
          console.log(JSON.stringify({
            level: 'info',
            message: 'Batch property data request completed',
            successCount: results.filter(r => r.success).length,
            errorCount: results.filter(r => !r.success).length
          }));
          resolve(results);
          return;
        }
        
        // Process next items if we have capacity and queue items
        while (inProgress < (this.options.maxConcurrent || 5) && queue.length > 0) {
          const request = queue.shift();
          if (!request) break;
          
          inProgress++;
          
          // Process this request
          this.processPropertyRequest(request)
            .then(result => {
              results.push(result);
              completedCount++;
              inProgress--;
              
              // Optional delay between requests
              if (this.options.requestDelayMs) {
                setTimeout(processQueue, this.options.requestDelayMs);
              } else {
                processQueue();
              }
            })
            .catch(error => {
              console.error(JSON.stringify({
                level: 'error',
                message: 'Error processing request in batch',
                propertyId: request.propertyId,
                error: error instanceof Error ? error.message : String(error)
              }));
              
              results.push({
                propertyId: request.propertyId,
                response: {
                  success: false,
                  error: `Batch processing error: ${error instanceof Error ? error.message : String(error)}`
                },
                success: false,
                error: error instanceof Error ? error.message : String(error)
              });
              
              completedCount++;
              inProgress--;
              processQueue();
            });
        }
      };
      
      // Start processing
      processQueue();
    });
  }
  
  /**
   * Process a single property request with retries
   * @param request The property request
   * @returns Promise resolving to the batch result
   */
  private async processPropertyRequest(
    request: PropertyRequest,
    attemptNumber = 1
  ): Promise<BatchPropertyResult> {
    const startTime = Date.now();
    
    try {
      console.log(JSON.stringify({
        level: 'info',
        message: 'Processing property request',
        propertyId: request.propertyId,
        attemptNumber
      }));
      
      // Get property data through parallel requests
      let propertyAttributes: CoreLogicPropertyAttributes;
      
      // First, get property attributes as we need this for further processing
      try {
        propertyAttributes = await this.client.getPropertyAttributes(request.propertyId);
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to get property attributes',
          propertyId: request.propertyId,
          error: error instanceof Error ? error.message : String(error)
        }));
        
        // Critical failure, can't proceed without attributes
        throw new Error(`Failed to get property attributes: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Initialize variables for parallel requests
      let salesHistory: CoreLogicSaleRecord[] = [];
      let avm: CoreLogicAVMResponse = {
        propertyId: request.propertyId,
        valuationDate: new Date().toISOString(),
        valuationEstimate: 0,
        valuationLow: 0,
        valuationHigh: 0,
        confidenceScore: 0
      };
      let marketStats: CoreLogicMarketStats = {
        medianPrice: 0,
        meanPrice: 0,
        pricePerSqm: 0,
        annualGrowth: 0,
        quarterlyGrowth: 0,
        salesVolume: 0,
        daysOnMarket: 0,
        listingCount: 0
      };
      let images: CoreLogicImageResponse = { 
        propertyId: request.propertyId, 
        images: [] 
      };
      
      // Now fetch the rest in parallel
      try {
        const [salesHistoryResult, avmResult, marketStatsResult, imagesResult] = await Promise.all([
          this.client.getPropertySalesHistory(request.propertyId),
          this.client.getPropertyAVM(request.propertyId),
          this.client.getMarketStatistics({
            suburb: request.suburb || '',
            city: request.city || '',
            postcode: request.postcode || ''
          }),
          this.client.getPropertyImage(request.propertyId)
        ]);
        
        // Update variables with results
        salesHistory = salesHistoryResult;
        avm = avmResult;
        marketStats = marketStatsResult;
        images = imagesResult;
      } catch (error) {
        console.warn(JSON.stringify({
          level: 'warn',
          message: 'Partial failure in parallel requests',
          propertyId: request.propertyId,
          error: error instanceof Error ? error.message : String(error)
        }));
        // Variables already have default values, so we can continue
      }
      
      // Get address details from request or extract from other data
      // In the actual CoreLogicPropertyAttributes, these would be 
      // available in a different structure, so we'll use request values as fallback
      const suburb = request.suburb || '';
      const city = request.city || '';
      const postcode = request.postcode || '';
      
      // Create address details object
      const addressDetails = {
        address: request.address || `Property ${request.propertyId}`,
        addressComponents: {
          suburb,
          city,
          postcode
        }
      };
      
      // Transform the data into our response format
      const propertyData = createPropertyDataResponse(
        request.propertyId,
        propertyAttributes,
        addressDetails,
        salesHistory,
        avm,
        marketStats
      );
      
      // Add image URLs to comparable properties if available
      if (propertyData.success && propertyData.data && images.images.length > 0) {
        const mainImageUrl = images.images[0].url;
        
        // Cast to our extended interface that includes imageUrl
        (propertyData.data.propertyDetails as ExtendedPropertyDetails).imageUrl = mainImageUrl;
      }
      
      const durationMs = Date.now() - startTime;
      
      return {
        propertyId: request.propertyId,
        response: propertyData,
        success: propertyData.success,
        durationMs
      };
      
    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      // Retry if we have attempts left
      if (attemptNumber < (this.options.maxRetries || 2)) {
        console.warn(JSON.stringify({
          level: 'warn',
          message: 'Retrying failed property request',
          propertyId: request.propertyId,
          attemptNumber,
          error: error instanceof Error ? error.message : String(error)
        }));
        
        // Exponential backoff for retries
        const delay = Math.pow(2, attemptNumber) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.processPropertyRequest(request, attemptNumber + 1);
      }
      
      console.error(JSON.stringify({
        level: 'error',
        message: 'Property request failed after all retry attempts',
        propertyId: request.propertyId,
        error: error instanceof Error ? error.message : String(error),
        durationMs
      }));
      
      return {
        propertyId: request.propertyId,
        response: {
          success: false,
          error: `Failed to get property data after ${attemptNumber} attempts: ${error instanceof Error ? error.message : String(error)}`
        },
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs
      };
    }
  }
  
  /**
   * Fetch market statistics for multiple suburbs/cities in a batch
   * @param requests Array of market statistics requests
   * @returns Promise resolving to market statistics
   */
  async batchMarketStats(
    requests: Array<{ suburb: string; city: string; postcode?: string }>
  ): Promise<Record<string, CoreLogicMarketStats>> {
    const results: Record<string, CoreLogicMarketStats> = {};
    let completedCount = 0;
    const uniqueRequests = this.deduplicateMarketRequests(requests);
    
    console.log(JSON.stringify({
      level: 'info',
      message: 'Starting batch market stats request',
      requestCount: uniqueRequests.length,
      options: this.options
    }));
    
    for (const request of uniqueRequests) {
      const key = this.getMarketStatsKey(request);
      
      try {
        results[key] = await this.client.getMarketStatistics({
          suburb: request.suburb,
          city: request.city,
          postcode: request.postcode
        });
        
        completedCount++;
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to get market stats',
          request,
          error: error instanceof Error ? error.message : String(error)
        }));
        
        results[key] = {
          medianPrice: 0,
          meanPrice: 0,
          pricePerSqm: 0,
          annualGrowth: 0,
          quarterlyGrowth: 0,
          salesVolume: 0,
          daysOnMarket: 0,
          listingCount: 0
        };
        
        completedCount++;
      }
      
      // Add delay between requests
      if (this.options.requestDelayMs && completedCount < uniqueRequests.length) {
        await new Promise(resolve => setTimeout(resolve, this.options.requestDelayMs));
      }
    }
    
    console.log(JSON.stringify({
      level: 'info',
      message: 'Batch market stats request completed',
      completedCount,
      uniqueRequestCount: uniqueRequests.length
    }));
    
    return results;
  }
  
  /**
   * Deduplicate market stats requests to avoid redundant API calls
   * @param requests Array of market stats requests
   * @returns Deduplicated array of requests
   */
  private deduplicateMarketRequests(
    requests: Array<{ suburb: string; city: string; postcode?: string }>
  ): Array<{ suburb: string; city: string; postcode?: string }> {
    const uniqueKeys = new Set<string>();
    const uniqueRequests: Array<{ suburb: string; city: string; postcode?: string }> = [];
    
    for (const request of requests) {
      const key = this.getMarketStatsKey(request);
      
      if (!uniqueKeys.has(key)) {
        uniqueKeys.add(key);
        uniqueRequests.push(request);
      }
    }
    
    return uniqueRequests;
  }
  
  /**
   * Get a unique key for a market stats request
   * @param request The market stats request
   * @returns A unique key string
   */
  private getMarketStatsKey(
    request: { suburb: string; city: string; postcode?: string }
  ): string {
    return `${request.suburb}|${request.city}|${request.postcode || ''}`;
  }
}

/**
 * Create a new CoreLogic batch handler
 * @param client The CoreLogic API client
 * @param options Batch request options
 * @returns A configured CoreLogic batch handler
 */
export function createCoreLogicBatchHandler(
  client: CoreLogicApiClient,
  options?: BatchRequestOptions
): CoreLogicBatchHandler {
  return new CoreLogicBatchHandler(client, options);
} 