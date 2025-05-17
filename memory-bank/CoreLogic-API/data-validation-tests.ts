/**
 * CoreLogic Data Validation Tests
 * 
 * This module contains tests to validate the data formats and transformations
 * between CoreLogic API responses and our application's data model.
 */

import { 
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord, 
  CoreLogicAVMResponse,
  CoreLogicMarketStats,
  CoreLogicMatchedAddress,
  PropertyDataResponse 
} from './corelogic-types';
import { createPropertyDataResponse } from './corelogic-transformers';

/**
 * Validates property details structure and data types
 */
export function validatePropertyDetails(response: PropertyDataResponse): string[] {
  const errors: string[] = [];
  
  if (!response.success) {
    errors.push('Response is not successful');
    return errors;
  }
  
  if (!response.data) {
    errors.push('Response data is missing');
    return errors;
  }
  
  const { propertyDetails } = response.data;
  
  // Required fields
  if (!propertyDetails) {
    errors.push('Property details are missing');
    return errors;
  }
  
  // Validate address information
  if (!propertyDetails.address) errors.push('Property address is missing');
  if (typeof propertyDetails.address !== 'string') errors.push('Property address should be a string');
  
  // Validate optional fields with type checks
  if (propertyDetails.bedrooms !== undefined && typeof propertyDetails.bedrooms !== 'number') 
    errors.push('Bedrooms should be a number');
    
  if (propertyDetails.bathrooms !== undefined && typeof propertyDetails.bathrooms !== 'number') 
    errors.push('Bathrooms should be a number');
    
  if (propertyDetails.landSize !== undefined && typeof propertyDetails.landSize !== 'number') 
    errors.push('Land size should be a number');
    
  if (propertyDetails.floorArea !== undefined && typeof propertyDetails.floorArea !== 'number') 
    errors.push('Floor area should be a number');
    
  if (propertyDetails.yearBuilt !== undefined && typeof propertyDetails.yearBuilt !== 'number') 
    errors.push('Year built should be a number');
    
  // Check property type
  if (propertyDetails.propertyType !== undefined && 
      !['House', 'Apartment', 'Townhouse', 'Unit', 'Land', 'Rural', 'Other'].includes(propertyDetails.propertyType)) {
    errors.push(`Invalid property type: ${propertyDetails.propertyType}`);
  }
  
  return errors;
}

/**
 * Validates comparable properties structure and data types
 */
export function validateComparableProperties(response: PropertyDataResponse): string[] {
  const errors: string[] = [];
  
  if (!response.success || !response.data) {
    errors.push('Response is not successful or data is missing');
    return errors;
  }
  
  const { comparableProperties } = response.data;
  
  if (!Array.isArray(comparableProperties)) {
    errors.push('Comparable properties should be an array');
    return errors;
  }
  
  // Validate each comparable property
  comparableProperties.forEach((property, index) => {
    if (!property.address) errors.push(`Comparable property ${index} is missing address`);
    if (!property.salePrice) errors.push(`Comparable property ${index} is missing sale price`);
    if (!property.saleDate) errors.push(`Comparable property ${index} is missing sale date`);
    
    // Validate date format (YYYY-MM-DD)
    if (property.saleDate && !/^\d{4}-\d{2}-\d{2}$/.test(property.saleDate)) {
      errors.push(`Comparable property ${index} has invalid sale date format: ${property.saleDate}`);
    }
    
    // Validate similarity score is between 0-100
    if (property.similarityScore !== undefined && 
        (property.similarityScore < 0 || property.similarityScore > 100)) {
      errors.push(`Comparable property ${index} has invalid similarity score: ${property.similarityScore}`);
    }
  });
  
  return errors;
}

/**
 * Validates market trends structure and data types
 */
export function validateMarketTrends(response: PropertyDataResponse): string[] {
  const errors: string[] = [];
  
  if (!response.success || !response.data) {
    errors.push('Response is not successful or data is missing');
    return errors;
  }
  
  const { marketTrends } = response.data;
  
  if (!marketTrends) {
    errors.push('Market trends are missing');
    return errors;
  }
  
  // Validate required fields
  if (marketTrends.medianPrice === undefined) errors.push('Median price is missing');
  if (marketTrends.annualGrowth === undefined) errors.push('Annual growth is missing');
  
  // Type checks
  if (typeof marketTrends.medianPrice !== 'number') errors.push('Median price should be a number');
  if (typeof marketTrends.annualGrowth !== 'number') errors.push('Annual growth should be a number');
  
  // Optional fields type checks
  if (marketTrends.salesVolume !== undefined && typeof marketTrends.salesVolume !== 'number') 
    errors.push('Sales volume should be a number');
    
  if (marketTrends.daysOnMarket !== undefined && typeof marketTrends.daysOnMarket !== 'number') 
    errors.push('Days on market should be a number');
  
  return errors;
}

/**
 * Test the entire transformation process with sample data
 */
export function testTransformation(): { 
  result: PropertyDataResponse; 
  errors: string[];
} {
  // Create sample CoreLogic data
  const propertyId = 'TEST-123';
  
  const propertyAttributes: CoreLogicPropertyAttributes = {
    propertyId: 'TEST-123',
    propertyType: 'House',
    landUse: 'Residential',
    bedrooms: 3,
    bathrooms: 2,
    landSize: 500,
    floorArea: 200,
    yearBuilt: 2000,
    carSpaces: 1,
    features: ['Pool', 'AirConditioning']
  };
  
  const addressDetails = {
    address: '123 Test Street',
    addressComponents: {
      suburb: 'Test Suburb',
      city: 'Test City',
      postcode: '1234'
    }
  };
  
  const salesHistory: CoreLogicSaleRecord[] = [
    {
      saleId: 'SALE-001',
      propertyId: 'TEST-123',
      date: '2022-01-15',
      price: 950000,
      saleType: 'Sale',
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Test City'
    },
    {
      saleId: 'SALE-002',
      propertyId: 'TEST-123',
      date: '2015-03-20',
      price: 750000,
      saleType: 'Sale',
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Test City'
    }
  ];
  
  const avm: CoreLogicAVMResponse = {
    propertyId: 'TEST-123',
    valuationDate: '2023-05-01',
    valuationLow: 950000,
    valuationHigh: 1050000,
    valuationEstimate: 1000000,
    confidenceScore: 0.85
  };
  
  const marketStats: CoreLogicMarketStats = {
    medianPrice: 1100000,
    meanPrice: 1150000,
    pricePerSqm: 5500,
    annualGrowth: 5.2,
    quarterlyGrowth: 1.3,
    salesVolume: 120,
    daysOnMarket: 30,
    listingCount: 45
  };
  
  // Transform the data
  const result = createPropertyDataResponse(
    propertyId,
    propertyAttributes,
    addressDetails,
    salesHistory,
    avm,
    marketStats
  );
  
  // Validate the transformed data
  const propertyDetailsErrors = validatePropertyDetails(result);
  const comparablePropertiesErrors = validateComparableProperties(result);
  const marketTrendsErrors = validateMarketTrends(result);
  
  // Combine all errors
  const errors = [
    ...propertyDetailsErrors,
    ...comparablePropertiesErrors,
    ...marketTrendsErrors
  ];
  
  return { result, errors };
}

/**
 * Runs all data validation tests and reports results
 */
export function runAllValidationTests(): {
  passed: boolean;
  errors: string[];
  testResult?: PropertyDataResponse;
} {
  try {
    const { result, errors } = testTransformation();
    
    if (errors.length > 0) {
      return {
        passed: false,
        errors,
        testResult: result
      };
    }
    
    return {
      passed: true,
      errors: [],
      testResult: result
    };
  } catch (error) {
    return {
      passed: false,
      errors: [`Transformation test failed: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const testResults = runAllValidationTests();
  
  console.log('Data Validation Test Results:');
  console.log('----------------------------');
  console.log(`Tests Passed: ${testResults.passed}`);
  
  if (testResults.errors.length > 0) {
    console.log('Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('All validation tests passed!');
  }
  
  if (testResults.testResult) {
    console.log('\nSample Transformed Data:');
    console.log(JSON.stringify(testResults.testResult, null, 2));
  }
} 