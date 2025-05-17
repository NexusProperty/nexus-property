/**
 * CoreLogic API Data Transformers
 * 
 * This file contains functions for transforming CoreLogic API responses
 * into the format expected by the Nexus Property frontend.
 */

import {
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStats,
  CoreLogicPropertyImages,
  CoreLogicTitleDetail,
  CoreLogicComparableResponse,
  CoreLogicPropertyActivity,
  PropertyDataResponse
} from "./corelogic-types.ts";

/**
 * Create a PropertyDataResponse from CoreLogic API responses
 */
export function createPropertyDataResponse(
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
  marketStats: CoreLogicMarketStats,
  propertyImages?: CoreLogicPropertyImages,
  titleDetails?: CoreLogicTitleDetail,
  comparableProperties?: CoreLogicComparableResponse,
  propertyActivity?: CoreLogicPropertyActivity
): PropertyDataResponse {
  try {
    // Transform property details
    const propertyDetails = {
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

    // Select the comparable properties source - prefer the dedicated API if available
    const transformedComparables = comparableProperties 
      ? comparableProperties.comparableProperties.map(comp => ({
          propertyId: comp.propertyId,
          address: comp.address,
          suburb: comp.suburb,
          city: comp.city,
          propertyType: comp.propertyType,
          bedrooms: comp.bedrooms,
          bathrooms: comp.bathrooms,
          landSize: comp.landSize,
          floorArea: comp.floorArea,
          yearBuilt: comp.yearBuilt,
          saleDate: comp.saleDate,
          salePrice: comp.salePrice,
          similarityScore: comp.similarityScore,
          distanceFromTarget: comp.distanceFromTarget,
          imageUrl: comp.imageUrl
        }))
      : avm.comparableProperties.map(comp => ({
          propertyId: comp.propertyId,
          address: comp.address,
          suburb: addressDetails.addressComponents.suburb, // Use same suburb as the main property
          city: addressDetails.addressComponents.city, // Use same city as the main property
          propertyType: comp.propertyType,
          bedrooms: comp.bedrooms,
          bathrooms: comp.bathrooms,
          landSize: comp.landSize,
          saleDate: comp.saleDate,
          salePrice: comp.salePrice,
          similarityScore: comp.similarityScore,
          // We don't have images in the API response, so use a placeholder
          imageUrl: `https://placehold.co/600x400/e5e7eb/a1a1aa?text=Property+${comp.propertyId}`
        }));

    // Transform market trends
    const marketTrends = {
      medianPrice: marketStats.medianSalePrice,
      annualGrowth: marketStats.annualGrowth,
      salesVolume: marketStats.salesVolume,
      daysOnMarket: marketStats.medianDaysOnMarket
    };

    // Transform valuation
    const valuation = {
      estimatedValue: avm.estimatedValue,
      valuationRange: avm.valuationRange,
      confidenceScore: avm.confidenceScore,
      valuationDate: avm.valuationDate
    };

    // Transform sales history
    const transformedSalesHistory = salesHistory.map(sale => ({
      saleDate: sale.saleDate,
      salePrice: sale.salePrice,
      saleType: sale.saleType
    }));

    // Construct the final response
    return {
      success: true,
      data: {
        propertyId,
        propertyDetails,
        propertyImages: propertyImages?.images,
        titleDetails: titleDetails,
        comparableProperties: transformedComparables,
        marketTrends,
        valuation,
        salesHistory: transformedSalesHistory,
        propertyActivity
      }
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error transforming property data',
      error: error instanceof Error ? error.message : String(error),
      propertyId
    }));

    return {
      success: false,
      error: `Error transforming property data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Helper function to format an address
 */
export function formatAddress(
  streetNumber?: string,
  streetName?: string,
  suburb?: string,
  city?: string,
  postcode?: string
): string {
  // Build address components
  let addressParts: string[] = [];
  
  // Street address
  if (streetNumber || streetName) {
    const streetAddress = `${streetNumber || ''} ${streetName || ''}`.trim();
    if (streetAddress) addressParts.push(streetAddress);
  }
  
  // Suburb
  if (suburb) addressParts.push(suburb);
  
  // City and postcode
  if (city || postcode) {
    const cityPostcode = `${city || ''} ${postcode || ''}`.trim();
    if (cityPostcode) addressParts.push(cityPostcode);
  }
  
  return addressParts.join(', ');
} 