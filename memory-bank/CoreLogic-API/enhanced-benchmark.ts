/**
 * CoreLogic API Enhanced Benchmark
 * 
 * This script benchmarks the optimized transformation functions and compares
 * them with the standard transformation functions.
 */

import { createCoreLogicClient, LogLevel } from './corelogic-service';
import {
  CoreLogicAuthConfig,
  CoreLogicPropertyAttributes,
  CoreLogicSaleRecord,
  CoreLogicAVMResponse,
  CoreLogicMarketStats
} from './corelogic-types';
import { createPropertyDataResponse } from './corelogic-transformers';
import {
  createOptimizedPropertyDataResponse,
  transformComparableProperties,
  transformationBenchmark
} from './optimized-transformers';
import { batchPropertyRequest } from './corelogic-batch';

// Mock data for benchmarking
const mockPropertyIds = Array.from({ length: 20 }, (_, i) => `PROP-${i + 1}`);

const createMockPropertyAttributes = (id: string): CoreLogicPropertyAttributes => ({
  propertyId: id,
  propertyType: 'House',
  landUse: 'Residential',
  bedrooms: 3,
  bathrooms: 2,
  landSize: 500,
  floorArea: 200,
  yearBuilt: 2000,
  carSpaces: 1,
  features: ['Pool', 'AirConditioning']
});

const createMockSalesHistory = (id: string, count: number = 5): CoreLogicSaleRecord[] => {
  return Array.from({ length: count }, (_, i) => ({
    saleId: `SALE-${i + 1}`,
    propertyId: id,
    date: `2022-${String(i + 1).padStart(2, '0')}-01`,
    price: 1000000 - (i * 50000),
    saleType: 'Sale',
    address: `${123 + i} Mock Street`,
    suburb: 'Mock Suburb',
    city: 'Mock City'
  }));
};

const createMockAVM = (id: string): CoreLogicAVMResponse => ({
  propertyId: id,
  valuationDate: '2023-05-01',
  valuationLow: 950000,
  valuationHigh: 1050000,
  valuationEstimate: 1000000,
  confidenceScore: 0.85
});

const createMockMarketStats = (): CoreLogicMarketStats => ({
  medianPrice: 1100000,
  meanPrice: 1150000,
  pricePerSqm: 5500,
  annualGrowth: 5.2,
  quarterlyGrowth: 1.3,
  salesVolume: 120,
  daysOnMarket: 30,
  listingCount: 45
});

/**
 * Measures execution time of a function
 */
const measureTime = async <T>(
  fn: () => Promise<T>,
  iterations: number = 1
): Promise<{ result: T; time: number }> => {
  const start = Date.now();
  let result;

  for (let i = 0; i < iterations; i++) {
    result = await fn();
  }

  const time = Date.now() - start;
  return { result: result as T, time };
};

/**
 * Benchmarks data transformation performance
 */
const benchmarkTransformation = async () => {
  console.log('\n==== Data Transformation Benchmark ====');

  // Sample data
  const propertyId = 'TEST-123';
  const propertyAttributes = createMockPropertyAttributes(propertyId);
  const addressDetails = {
    address: '123 Test Street',
    addressComponents: {
      suburb: 'Test Suburb',
      city: 'Test City',
      postcode: '1234'
    }
  };

  // Test with various sale history sizes
  const saleSizes = [10, 50, 100, 500];
  
  for (const size of saleSizes) {
    console.log(`\nTransforming ${size} sales records:`);
    
    const salesHistory = createMockSalesHistory(propertyId, size);
    const avm = createMockAVM(propertyId);
    const marketStats = createMockMarketStats();
    
    // Standard transformation
    const { time: standardTime } = await measureTime(
      () => createPropertyDataResponse(
        propertyId,
        propertyAttributes,
        addressDetails,
        salesHistory,
        avm,
        marketStats
      ),
      5
    );
    
    // Optimized transformation
    const { time: optimizedTime } = await measureTime(
      () => createOptimizedPropertyDataResponse(
        propertyId,
        propertyAttributes,
        addressDetails,
        salesHistory,
        avm,
        marketStats
      ),
      5
    );
    
    console.log(`Standard transformation: ${standardTime / 5}ms`);
    console.log(`Optimized transformation: ${optimizedTime / 5}ms`);
    console.log(`Improvement: ${((standardTime - optimizedTime) / standardTime * 100).toFixed(2)}%`);
    
    // Detailed benchmark for comparable properties transformer
    console.log('\nDetailed comparable properties transformation benchmark:');
    const results = transformationBenchmark.measure(
      propertyAttributes,
      [size],
      5
    );
    
    console.log(`Average time: ${results[`standard_${size}`].avgTime.toFixed(2)}ms`);
    console.log(`Time per item: ${results[`standard_${size}`].perItemTime.toFixed(3)}ms`);
  }
};

/**
 * Compares standard vs. optimized transformers
 */
const compareTransformers = async () => {
  console.log('\n==== Standard vs. Optimized Transformers ====');
  
  const propertyId = 'TEST-123';
  const propertyAttributes = createMockPropertyAttributes(propertyId);
  const addressDetails = {
    address: '123 Test Street',
    addressComponents: {
      suburb: 'Test Suburb',
      city: 'Test City',
      postcode: '1234'
    }
  };
  
  // Generate large sales history
  const largeSalesHistory = createMockSalesHistory(propertyId, 1000);
  const avm = createMockAVM(propertyId);
  const marketStats = createMockMarketStats();
  
  console.log('\nLarge dataset (1000 sales) performance:');
  
  // Standard transformation
  const { time: standardTime } = await measureTime(
    () => createPropertyDataResponse(
      propertyId,
      propertyAttributes,
      addressDetails,
      largeSalesHistory,
      avm,
      marketStats
    ),
    1
  );
  
  // Optimized transformation
  const { time: optimizedTime } = await measureTime(
    () => createOptimizedPropertyDataResponse(
      propertyId,
      propertyAttributes,
      addressDetails,
      largeSalesHistory,
      avm,
      marketStats
    ),
    1
  );
  
  console.log(`Standard transformer time: ${standardTime}ms`);
  console.log(`Optimized transformer time: ${optimizedTime}ms`);
  console.log(`Time improvement: ${((standardTime - optimizedTime) / standardTime * 100).toFixed(2)}%`);
  
  // Test with different property counts
  console.log('\nMulti-property batch processing:');
  
  // Mock functions
  const fetchPropertyAttributes = (id: string) => Promise.resolve(createMockPropertyAttributes(id));
  const fetchSalesHistory = (id: string) => Promise.resolve(createMockSalesHistory(id, 20));
  const fetchAVM = (id: string) => Promise.resolve(createMockAVM(id));
  const fetchMarketStats = () => Promise.resolve(createMockMarketStats());
  
  // Test with different batch sizes
  const batchSizes = [5, 10, 20];
  
  for (const batchSize of batchSizes) {
    console.log(`\nProcessing ${batchSize} properties in batch:`);
    
    const ids = mockPropertyIds.slice(0, batchSize);
    
    // Standard batch processing (sequential)
    const { time: standardBatchTime } = await measureTime(async () => {
      interface PropertyResults {
        [propertyId: string]: ReturnType<typeof createPropertyDataResponse>;
      }
      
      const results: PropertyResults = {};
      for (const id of ids) {
        const props = await fetchPropertyAttributes(id);
        const sales = await fetchSalesHistory(id);
        const avm = await fetchAVM(id);
        const stats = await fetchMarketStats();
        
        results[id] = createPropertyDataResponse(
          id,
          props,
          {
            address: `Property ${id}`,
            addressComponents: {
              suburb: 'Test Suburb',
              city: 'Test City',
              postcode: '1234'
            }
          },
          sales,
          avm,
          stats
        );
      }
      return results;
    });
    
    // Optimized batch processing (parallel with caching)
    const { time: optimizedBatchTime } = await measureTime(async () => {
      return batchPropertyRequest(
        ids,
        fetchPropertyAttributes,
        fetchSalesHistory,
        fetchAVM,
        fetchMarketStats,
        5 // concurrency limit
      );
    });
    
    console.log(`Standard sequential processing: ${standardBatchTime}ms`);
    console.log(`Optimized parallel processing: ${optimizedBatchTime}ms`);
    console.log(`Improvement: ${((standardBatchTime - optimizedBatchTime) / standardBatchTime * 100).toFixed(2)}%`);
  }
};

// Run the benchmarks
(async () => {
  console.log('Running CoreLogic API Enhanced Benchmarks...');
  
  try {
    await benchmarkTransformation();
    await compareTransformers();
    
    console.log('\n==== All benchmarks completed successfully ====');
  } catch (error: unknown) {
    console.error('Benchmark failed:', error);
  }
})(); 