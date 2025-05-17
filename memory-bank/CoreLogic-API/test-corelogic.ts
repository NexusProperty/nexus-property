/**
 * CoreLogic API Integration Test
 * 
 * This script tests the CoreLogic API integration using mock data.
 * It verifies that the API client, type definitions, transformers,
 * and mock implementations work together correctly.
 */

import { createCoreLogicClient, LogLevel } from './corelogic-service';
import { createPropertyDataResponse } from './corelogic-transformers';
import { CoreLogicAuthConfig } from './corelogic-types';

async function testCoreLogicIntegration() {
  console.log('============================================');
  console.log('CoreLogic API Integration Test');
  console.log('============================================');
  
  try {
    // Create a mock configuration
    const config: CoreLogicAuthConfig = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      baseUrl: 'https://api-uat.corelogic.asia'
    };
    
    // Create a client with mock data enabled
    console.log('Creating CoreLogic API client with mock data...');
    const client = createCoreLogicClient(config, true, LogLevel.INFO);
    
    // Test address suggestion
    console.log('\n1. Testing address suggestion...');
    const suggestions = await client.suggestAddress('123 Main');
    console.log(`Received ${suggestions.length} address suggestions`);
    console.log(`First suggestion: ${suggestions[0]?.displayAddress}`);
    
    // Test address matching
    console.log('\n2. Testing address matching...');
    const matchedAddress = await client.matchAddress({
      address: '123 Main Street',
      suburb: 'Auckland',
      city: 'Auckland'
    });
    console.log(`Matched address: ${matchedAddress.fullAddress}`);
    console.log(`Property ID: ${matchedAddress.propertyId}`);
    
    // Use the matched property ID for further tests
    const propertyId = matchedAddress.propertyId;
    
    // Test property attributes
    console.log('\n3. Testing property attributes...');
    const attributes = await client.getPropertyAttributes(propertyId);
    console.log(`Property type: ${attributes.propertyType}`);
    console.log(`Bedrooms: ${attributes.bedrooms}`);
    console.log(`Bathrooms: ${attributes.bathrooms}`);
    console.log(`Land size: ${attributes.landSize} sqm`);
    
    // Test sales history
    console.log('\n4. Testing sales history...');
    const salesHistory = await client.getPropertySalesHistory(propertyId);
    console.log(`Received ${salesHistory.length} sales records`);
    console.log(`Most recent sale: ${salesHistory[0]?.date} for $${salesHistory[0]?.price}`);
    
    // Test AVM
    console.log('\n5. Testing automated valuation model...');
    const avm = await client.getPropertyAVM(propertyId);
    console.log(`Valuation estimate: $${avm.valuationEstimate}`);
    console.log(`Valuation range: $${avm.valuationLow} - $${avm.valuationHigh}`);
    console.log(`Confidence score: ${avm.confidenceScore * 100}%`);
    
    // Test property images
    console.log('\n6. Testing property images...');
    const images = await client.getPropertyImage(propertyId);
    console.log(`Received ${images.images.length} images`);
    console.log(`First image URL: ${images.images[0]?.url}`);
    
    // Test market statistics
    console.log('\n7. Testing market statistics...');
    const marketStats = await client.getMarketStatistics({
      suburb: 'Auckland Central',
      city: 'Auckland'
    });
    console.log(`Median price: $${marketStats.medianPrice}`);
    console.log(`Annual growth: ${marketStats.annualGrowth * 100}%`);
    console.log(`Days on market: ${marketStats.daysOnMarket}`);
    
    // Test data transformation
    console.log('\n8. Testing data transformation...');
    const propertyData = createPropertyDataResponse(
      propertyId,
      attributes,
      matchedAddress,
      salesHistory,
      avm,
      marketStats
    );
    
    if (propertyData.success && propertyData.data) {
      console.log('Property data transformation successful!');
      console.log(`Property details: ${propertyData.data.propertyDetails.address}`);
      console.log(`Comparable properties: ${propertyData.data.comparableProperties.length}`);
      console.log(`Market trends - median price: $${propertyData.data.marketTrends.medianPrice}`);
    } else {
      console.error(`Property data transformation failed: ${propertyData.error}`);
    }
    
    console.log('\n============================================');
    console.log('CoreLogic API Integration Test Completed Successfully!');
    console.log('============================================');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testCoreLogicIntegration().catch(error => {
  console.error('Unhandled error during test:', error);
  process.exit(1);
}); 