/**
 * Optimized Transformers for CoreLogic API
 * 
 * This module contains optimized transformation functions for converting
 * between CoreLogic API responses and our application's data model,
 * specifically optimized for large datasets.
 */

import {
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStats,
  PropertyDetails,
  ComparableProperty,
  MarketTrends,
  PropertyDataResponse
} from './corelogic-types';

/**
 * Type guard to check if required fields exist in the property attributes
 */
function hasRequiredPropertyFields(
  attributes: CoreLogicPropertyAttributes
): boolean {
  return (
    typeof attributes.propertyId === 'string' &&
    typeof attributes.propertyType === 'string'
  );
}

/**
 * Transform property attributes to our application's property details format
 * Using optimized approach for large datasets
 */
export function transformPropertyDetails(
  propertyId: string,
  propertyAttributes: CoreLogicPropertyAttributes,
  addressDetails: {
    address: string;
    addressComponents: {
      suburb: string;
      city: string;
      postcode?: string;
    };
  }
): PropertyDetails {
  // Validate
  if (!hasRequiredPropertyFields(propertyAttributes)) {
    throw new Error(`Invalid property attributes for property ID: ${propertyId}`);
  }

  // Transform with minimal object creation
  return {
    address: addressDetails.address,
    suburb: addressDetails.addressComponents.suburb,
    city: addressDetails.addressComponents.city,
    postcode: addressDetails.addressComponents.postcode,
    propertyType: propertyAttributes.propertyType,
    bedrooms: propertyAttributes.bedrooms,
    bathrooms: propertyAttributes.bathrooms,
    landSize: propertyAttributes.landSize,
    floorArea: propertyAttributes.floorArea,
    yearBuilt: propertyAttributes.yearBuilt,
    features: propertyAttributes.features
  };
}

/**
 * Calculate similarity score between two properties
 * Optimized for performance
 */
export function calculateSimilarityScore(
  reference: CoreLogicPropertyAttributes,
  comparison: CoreLogicSaleRecord
): number {
  // Use a weighted scoring system for faster calculation
  let score = 100; // Start with perfect score
  let factors = 0;

  // Fast property type check
  if (comparison.propertyType && reference.propertyType) {
    score -= comparison.propertyType !== reference.propertyType ? 20 : 0;
    factors++;
  }

  // Fast bedroom comparison
  if (comparison.bedrooms !== undefined && reference.bedrooms !== undefined) {
    const bedroomDiff = Math.abs(comparison.bedrooms - reference.bedrooms);
    score -= bedroomDiff * 5; // 5 points per bedroom difference
    factors++;
  }

  // Fast bathroom comparison
  if (comparison.bathrooms !== undefined && reference.bathrooms !== undefined) {
    const bathroomDiff = Math.abs(comparison.bathrooms - reference.bathrooms);
    score -= bathroomDiff * 5; // 5 points per bathroom difference
    factors++;
  }

  // Land size comparison (only if both are available and significant in size)
  if (
    comparison.landSize !== undefined &&
    reference.landSize !== undefined &&
    reference.landSize > 0
  ) {
    const landSizeDiff = Math.abs(comparison.landSize - reference.landSize);
    const landSizePercentDiff = (landSizeDiff / reference.landSize) * 100;
    
    // Apply penalty based on percentage difference
    if (landSizePercentDiff > 30) {
      score -= 15;
    } else if (landSizePercentDiff > 15) {
      score -= 10;
    } else if (landSizePercentDiff > 5) {
      score -= 5;
    }
    
    factors++;
  }

  // Floor area comparison
  if (
    comparison.floorArea !== undefined &&
    reference.floorArea !== undefined &&
    reference.floorArea > 0
  ) {
    const floorAreaDiff = Math.abs(comparison.floorArea - reference.floorArea);
    const floorAreaPercentDiff = (floorAreaDiff / reference.floorArea) * 100;
    
    // Apply penalty based on percentage difference
    if (floorAreaPercentDiff > 30) {
      score -= 15;
    } else if (floorAreaPercentDiff > 15) {
      score -= 10;
    } else if (floorAreaPercentDiff > 5) {
      score -= 5;
    }
    
    factors++;
  }

  // Age/year built comparison
  if (
    comparison.yearBuilt !== undefined &&
    reference.yearBuilt !== undefined
  ) {
    const yearDiff = Math.abs(comparison.yearBuilt - reference.yearBuilt);
    
    // Apply penalty based on age difference
    if (yearDiff > 20) {
      score -= 15;
    } else if (yearDiff > 10) {
      score -= 10;
    } else if (yearDiff > 5) {
      score -= 5;
    }
    
    factors++;
  }

  // If we don't have enough comparison factors, reduce confidence
  if (factors < 3) {
    score -= (3 - factors) * 10;
  }

  // Ensure the score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Transform sales history to comparable properties
 * Using batch processing for optimization
 */
export function transformComparableProperties(
  referenceProperty: CoreLogicPropertyAttributes,
  salesHistory: CoreLogicSaleRecord[],
  limit: number = 5
): ComparableProperty[] {
  if (!salesHistory || !Array.isArray(salesHistory) || salesHistory.length === 0) {
    return [];
  }

  // Prepare calculations with pre-allocated array for speed
  const comparables: ComparableProperty[] = [];
  const scoredSales: Array<{sale: CoreLogicSaleRecord, score: number}> = [];
  
  // First pass: calculate scores (can be parallel for large datasets)
  for (const sale of salesHistory) {
    const score = calculateSimilarityScore(referenceProperty, sale);
    if (score >= 50) { // Only consider properties with reasonable similarity
      scoredSales.push({ sale, score });
    }
  }
  
  // Sort by score (descending)
  scoredSales.sort((a, b) => b.score - a.score);
  
  // Take top matches up to the limit
  const topMatches = scoredSales.slice(0, limit);
  
  // Second pass: transform the data for top matches only
  for (const { sale, score } of topMatches) {
    comparables.push({
      address: sale.address || 'Unknown',
      suburb: sale.suburb || 'Unknown',
      city: sale.city || 'Unknown',
      propertyType: sale.propertyType || referenceProperty.propertyType,
      bedrooms: sale.bedrooms || referenceProperty.bedrooms,
      bathrooms: sale.bathrooms || referenceProperty.bathrooms,
      landSize: sale.landSize,
      floorArea: sale.floorArea,
      yearBuilt: sale.yearBuilt,
      saleDate: sale.date,
      salePrice: sale.price,
      similarityScore: score
    });
  }
  
  return comparables;
}

/**
 * Transform market statistics to our application's market trends format
 * Optimized for speed
 */
export function transformMarketTrends(marketStats: CoreLogicMarketStats): MarketTrends {
  return {
    medianPrice: marketStats.medianPrice,
    annualGrowth: marketStats.annualGrowth,
    salesVolume: marketStats.salesVolume,
    daysOnMarket: marketStats.daysOnMarket
  };
}

/**
 * Create a property data response using optimized transformations
 * Handles large datasets more efficiently
 */
export function createOptimizedPropertyDataResponse(
  propertyId: string,
  propertyAttributes: CoreLogicPropertyAttributes,
  addressDetails: {
    address: string;
    addressComponents: {
      suburb: string;
      city: string;
      postcode?: string;
    };
  },
  salesHistory: CoreLogicSaleRecord[],
  avm: CoreLogicAVMResponse,
  marketStats: CoreLogicMarketStats
): PropertyDataResponse {
  try {
    // Process property details
    const propertyDetails = transformPropertyDetails(
      propertyId,
      propertyAttributes,
      addressDetails
    );
    
    // Process comparable properties with optimized algorithm
    const comparableProperties = transformComparableProperties(
      propertyAttributes,
      salesHistory
    );
    
    // Process market trends
    const marketTrends = transformMarketTrends(marketStats);
    
    // Return the formatted response
    return {
      success: true,
      data: {
        propertyDetails,
        comparableProperties,
        marketTrends
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error transforming property data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Batch process multiple properties
 * This is optimized for large datasets by:
 * 1. Reusing market statistics for the same suburb/city
 * 2. Parallel processing each property
 * 3. Memory-efficient transformation
 */
export async function batchProcessProperties(
  propertyIds: string[],
  fetchPropertyAttributes: (propertyId: string) => Promise<CoreLogicPropertyAttributes>,
  fetchSalesHistory: (propertyId: string) => Promise<CoreLogicSaleRecord[]>,
  fetchAVM: (propertyId: string) => Promise<CoreLogicAVMResponse>,
  fetchMarketStats: (params: { suburb: string; city: string }) => Promise<CoreLogicMarketStats>
): Promise<Record<string, PropertyDataResponse>> {
  const results: Record<string, PropertyDataResponse> = {};
  
  // Cache for market statistics to prevent redundant API calls
  const marketStatsCache: Record<string, CoreLogicMarketStats> = {};
  
  // Process properties in parallel
  await Promise.all(
    propertyIds.map(async (propertyId) => {
      try {
        // Fetch property attributes first
        const propertyAttributes = await fetchPropertyAttributes(propertyId);
        
        // Fetch address details from first sale record or create default
        // This assumes we'll have at least one sale record with address info
        // or we would need a separate API call to get address details
        const salesHistory = await fetchSalesHistory(propertyId);
        const firstSale = salesHistory.length > 0 ? salesHistory[0] : null;
        
        // Extract address details from sale history or create default
        const addressDetails = {
          address: firstSale?.address || `Property ${propertyId}`,
          addressComponents: {
            suburb: firstSale?.suburb || 'Unknown',
            city: firstSale?.city || 'Unknown',
            postcode: undefined
          }
        };
        
        // Fetch AVM in parallel with sales history
        const avm = await fetchAVM(propertyId);
        
        // Get market statistics (using cache when possible)
        const cacheKey = `${addressDetails.addressComponents.suburb}|${addressDetails.addressComponents.city}`;
        let marketStats: CoreLogicMarketStats;
        
        if (marketStatsCache[cacheKey]) {
          marketStats = marketStatsCache[cacheKey];
        } else {
          marketStats = await fetchMarketStats({
            suburb: addressDetails.addressComponents.suburb,
            city: addressDetails.addressComponents.city
          });
          marketStatsCache[cacheKey] = marketStats;
        }
        
        // Transform the data
        results[propertyId] = createOptimizedPropertyDataResponse(
          propertyId,
          propertyAttributes,
          addressDetails,
          salesHistory,
          avm,
          marketStats
        );
      } catch (error) {
        // Handle errors for individual properties
        results[propertyId] = {
          success: false,
          error: `Error processing property: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    })
  );
  
  return results;
}

/**
 * Benchmark object for measuring transformation performance
 */
export const transformationBenchmark = {
  /**
   * Measure transformation performance with various dataset sizes
   */
  measure: (
    propertyAttributes: CoreLogicPropertyAttributes,
    salesHistorySizes: number[],
    iterations: number = 10
  ): Record<string, { avgTime: number; perItemTime: number }> => {
    // Generate a large sales history dataset
    const generateSalesHistory = (count: number): CoreLogicSaleRecord[] => {
      const result: CoreLogicSaleRecord[] = [];
      for (let i = 0; i < count; i++) {
        result.push({
          saleId: `SALE-${i}`,
          propertyId: `PROP-${i}`,
          date: '2023-01-01',
          price: 1000000 + (i * 10000),
          saleType: 'Sale',
          address: `${i} Test Street`,
          suburb: 'Test Suburb',
          city: 'Test City',
          propertyType: ['House', 'Apartment', 'Townhouse'][i % 3],
          bedrooms: 2 + (i % 4),
          bathrooms: 1 + (i % 3),
          landSize: 500 + (i * 20),
          floorArea: 200 + (i * 10)
        });
      }
      return result;
    };
    
    const results: Record<string, { avgTime: number; perItemTime: number }> = {};
    
    // Run benchmarks for each dataset size
    for (const size of salesHistorySizes) {
      const salesHistory = generateSalesHistory(size);
      
      // Measure standard transformer
      let standardTotal = 0;
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        transformComparableProperties(propertyAttributes, salesHistory);
        standardTotal += (Date.now() - start);
      }
      
      results[`standard_${size}`] = {
        avgTime: standardTotal / iterations,
        perItemTime: (standardTotal / iterations) / size
      };
    }
    
    return results;
  }
};

// Export all common types for convenience
export type {
  PropertyDetails,
  ComparableProperty,
  MarketTrends,
  PropertyDataResponse
} from './corelogic-types'; 