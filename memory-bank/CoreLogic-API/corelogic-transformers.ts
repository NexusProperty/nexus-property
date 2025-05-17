/**
 * CoreLogic API Data Transformers
 * 
 * This file contains functions to transform CoreLogic API data into
 * formats expected by our application.
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
 * Transform CoreLogic property attributes to our PropertyDetails format
 * @param attributes The CoreLogic property attributes
 * @param address The property address
 * @param suburb The property suburb
 * @param city The property city
 * @param postcode The property postcode
 * @returns The transformed PropertyDetails object
 */
export function transformPropertyDetails(
  attributes: CoreLogicPropertyAttributes,
  address: string,
  suburb: string,
  city: string,
  postcode?: string
): PropertyDetails {
  if (!attributes) {
    throw new Error('Property attributes are required for transformation');
  }
  
  if (!address || !suburb || !city) {
    throw new Error('Address, suburb, and city are required for property details transformation');
  }
  
  return {
    address,
    suburb,
    city,
    postcode,
    propertyType: attributes.propertyType || 'unknown',
    bedrooms: attributes.bedrooms,
    bathrooms: attributes.bathrooms,
    landSize: attributes.landSize,
    floorArea: attributes.floorArea,
    yearBuilt: attributes.yearBuilt,
    features: attributes.features || []
  };
}

/**
 * Calculate similarity score between two properties
 * @param subject The subject property
 * @param comparable The comparable property
 * @returns A similarity score between 0 and 100
 */
function calculateSimilarityScore(
  subject: PropertyDetails,
  comparable: Partial<PropertyDetails>
): number {
  if (!subject || !comparable) {
    return 0; // Return minimum score if either property is missing
  }
  
  let score = 100;
  let factorsConsidered = 0;
  
  // Location factor - suburb match is important
  if (subject.suburb === comparable.suburb) {
    score += 20;
  } else {
    score -= 20;
  }
  factorsConsidered++;
  
  // Property type
  if (subject.propertyType === comparable.propertyType) {
    score += 15;
  } else {
    score -= 15;
  }
  factorsConsidered++;
  
  // Bedrooms
  if (subject.bedrooms !== undefined && comparable.bedrooms !== undefined) {
    const bedroomDiff = Math.abs(subject.bedrooms - comparable.bedrooms);
    if (bedroomDiff === 0) {
      score += 15;
    } else if (bedroomDiff === 1) {
      score += 5;
    } else {
      score -= 5 * bedroomDiff;
    }
    factorsConsidered++;
  }
  
  // Bathrooms
  if (subject.bathrooms !== undefined && comparable.bathrooms !== undefined) {
    const bathroomDiff = Math.abs(subject.bathrooms - comparable.bathrooms);
    if (bathroomDiff === 0) {
      score += 10;
    } else if (bathroomDiff <= 0.5) {
      score += 5;
    } else {
      score -= 5 * bathroomDiff;
    }
    factorsConsidered++;
  }
  
  // Land size
  if (subject.landSize !== undefined && comparable.landSize !== undefined) {
    const landSizeRatio = comparable.landSize / subject.landSize;
    if (landSizeRatio >= 0.9 && landSizeRatio <= 1.1) {
      score += 10;
    } else if (landSizeRatio >= 0.8 && landSizeRatio <= 1.2) {
      score += 5;
    } else {
      score -= 5 * Math.abs(landSizeRatio - 1) * 10;
    }
    factorsConsidered++;
  }
  
  // Floor area
  if (subject.floorArea !== undefined && comparable.floorArea !== undefined) {
    const floorAreaRatio = comparable.floorArea / subject.floorArea;
    if (floorAreaRatio >= 0.9 && floorAreaRatio <= 1.1) {
      score += 10;
    } else if (floorAreaRatio >= 0.8 && floorAreaRatio <= 1.2) {
      score += 5;
    } else {
      score -= 5 * Math.abs(floorAreaRatio - 1) * 10;
    }
    factorsConsidered++;
  }
  
  // Year built
  if (subject.yearBuilt !== undefined && comparable.yearBuilt !== undefined) {
    const ageDiff = Math.abs(subject.yearBuilt - comparable.yearBuilt);
    if (ageDiff <= 5) {
      score += 10;
    } else if (ageDiff <= 10) {
      score += 5;
    } else {
      score -= Math.min(10, ageDiff / 5);
    }
    factorsConsidered++;
  }
  
  // Normalize score to ensure it's between 0 and 100
  score = Math.max(0, Math.min(100, score / (1 + factorsConsidered * 0.2)));
  
  return Math.round(score);
}

/**
 * Transform CoreLogic sales records to our ComparableProperty format
 * @param salesRecords The CoreLogic sales records
 * @param propertyAttributes The subject property attributes
 * @param subjectProperty The subject property details
 * @returns Array of comparable properties
 */
export function transformComparableProperties(
  salesRecords: CoreLogicSaleRecord[],
  propertyAttributes: CoreLogicPropertyAttributes,
  subjectProperty: PropertyDetails
): ComparableProperty[] {
  if (!salesRecords || !Array.isArray(salesRecords)) {
    console.warn('No valid sales records provided for comparable properties transformation');
    return [];
  }
  
  if (!subjectProperty) {
    throw new Error('Subject property details are required for comparable properties transformation');
  }
  
  // Sort by date (most recent first)
  const sortedRecords = [...salesRecords].sort((a, b) => {
    // Handle invalid dates
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Transform to comparable properties
  return sortedRecords.map(record => {
    // Validate record has required fields
    if (!record.price) {
      console.warn(`Sale record missing price, using default value`, { saleId: record.saleId });
    }
    
    // Ensure the address is never undefined
    const recordAddress = record.address || `Property ${record.propertyId || 'unknown'}`;
    
    // Create a partial property details object for the comparable
    const comparableDetails: Partial<PropertyDetails> = {
      address: recordAddress,
      suburb: record.suburb || subjectProperty.suburb, // Default to subject suburb if not specified
      city: record.city || subjectProperty.city, // Default to subject city if not specified
      propertyType: record.propertyType || propertyAttributes.propertyType || 'Unknown',
      bedrooms: record.bedrooms !== undefined ? record.bedrooms : propertyAttributes.bedrooms,
      bathrooms: record.bathrooms !== undefined ? record.bathrooms : propertyAttributes.bathrooms,
      landSize: record.landSize !== undefined ? record.landSize : propertyAttributes.landSize,
      floorArea: record.floorArea !== undefined ? record.floorArea : propertyAttributes.floorArea,
      yearBuilt: record.yearBuilt !== undefined ? record.yearBuilt : propertyAttributes.yearBuilt
    };
    
    // Calculate similarity score
    const similarityScore = calculateSimilarityScore(subjectProperty, comparableDetails);
    
    // Create the comparable property
    return {
      address: comparableDetails.address || 'Unknown address', // Ensure address is never undefined
      suburb: comparableDetails.suburb || '',
      city: comparableDetails.city || '',
      propertyType: comparableDetails.propertyType || 'Unknown',
      bedrooms: comparableDetails.bedrooms,
      bathrooms: comparableDetails.bathrooms,
      landSize: comparableDetails.landSize,
      floorArea: comparableDetails.floorArea,
      yearBuilt: comparableDetails.yearBuilt,
      saleDate: record.date,
      salePrice: record.price || 0, // Ensure salePrice is never undefined
      similarityScore,
      imageUrl: undefined // Will be filled in later with image data
    };
  });
}

/**
 * Transform CoreLogic market statistics to our MarketTrends format
 * @param stats The CoreLogic market statistics
 * @returns The transformed MarketTrends object
 */
export function transformMarketTrends(stats: CoreLogicMarketStats): MarketTrends {
  if (!stats) {
    throw new Error('Market statistics are required for transformation');
  }
  
  return {
    medianPrice: stats.medianPrice || 0,
    annualGrowth: (stats.annualGrowth || 0) * 100, // Convert to percentage
    salesVolume: stats.salesVolume || 0,
    daysOnMarket: stats.daysOnMarket || 0
  };
}

/**
 * Transform CoreLogic AVM data to a valuation range
 * @param avm The CoreLogic AVM response
 * @returns An object with low and high valuation
 */
export function transformValuationRange(avm: CoreLogicAVMResponse): {
  valuationLow: number;
  valuationHigh: number;
  valuationConfidence: number;
} {
  if (!avm) {
    throw new Error('AVM data is required for valuation range transformation');
  }
  
  return {
    valuationLow: avm.valuationLow || 0,
    valuationHigh: avm.valuationHigh || 0,
    valuationConfidence: avm.confidenceScore || 0
  };
}

/**
 * Function to create a complete property response from CoreLogic data
 * @param propertyId The CoreLogic property ID
 * @param propertyAttributes The property attributes
 * @param address The property address details
 * @param salesHistory The sales history records
 * @param avm The AVM data
 * @param marketStats The market statistics
 * @returns A complete property data response
 */
export function createPropertyDataResponse(
  propertyId: string,
  propertyAttributes: CoreLogicPropertyAttributes,
  address: { address: string; addressComponents: { suburb: string; city: string; postcode?: string } },
  salesHistory: CoreLogicSaleRecord[],
  avm: CoreLogicAVMResponse,
  marketStats: CoreLogicMarketStats
): PropertyDataResponse {
  try {
    if (!propertyId) {
      throw new Error('Property ID is required for property data response');
    }
    
    if (!propertyAttributes) {
      throw new Error('Property attributes are required for property data response');
    }
    
    if (!address || !address.address || !address.addressComponents) {
      throw new Error('Address details are required for property data response');
    }
    
    // Transform property details
    const propertyDetails = transformPropertyDetails(
      propertyAttributes,
      address.address,
      address.addressComponents.suburb,
      address.addressComponents.city,
      address.addressComponents.postcode
    );
    
    // Transform comparable properties
    const comparableProperties = transformComparableProperties(
      salesHistory || [],
      propertyAttributes,
      propertyDetails
    );
    
    // Transform market trends
    const marketTrends = transformMarketTrends(marketStats);
    
    return {
      success: true,
      data: {
        propertyDetails,
        comparableProperties,
        marketTrends
      }
    };
  } catch (error) {
    console.error('Error creating property data response:', error);
    return {
      success: false,
      error: `Failed to process property data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
