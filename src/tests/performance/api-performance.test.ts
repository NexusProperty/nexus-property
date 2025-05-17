import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../lib/types/database.types';
import { performance } from 'perf_hooks';

// Configuration for the test
const API_TIME_THRESHOLD_MS = 300; // Maximum acceptable time in milliseconds
const NUM_ITERATIONS = 5; // Number of times to run each test for averaging
const CONCURRENT_USERS = 3; // Simulate concurrent user requests

// Helper function to measure API call performance
const measureApiPerformance = async <T>(
  apiCall: () => Promise<T>, 
  iterations: number = NUM_ITERATIONS
): Promise<{ averageTime: number; maxTime: number; minTime: number }> => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await apiCall();
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    maxTime: Math.max(...times),
    minTime: Math.min(...times)
  };
};

// Helper function to simulate concurrent API calls
const simulateConcurrentRequests = async <T>(
  apiCall: () => Promise<T>, 
  numUsers: number = CONCURRENT_USERS
): Promise<{ averageTime: number; maxTime: number; minTime: number }> => {
  const start = performance.now();
  await Promise.all(Array(numUsers).fill(0).map(() => apiCall()));
  const end = performance.now();
  
  // Calculate time per request (total time / number of requests)
  const timePerRequest = (end - start) / numUsers;
  
  return {
    averageTime: timePerRequest,
    maxTime: end - start, // Total time for all requests
    minTime: timePerRequest // Assuming ideal parallel execution
  };
};

describe('API Performance Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  
  beforeAll(() => {
    // Initialize Supabase client
    supabase = createClient(
      process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
  });
  
  afterAll(() => {
    // Cleanup if needed
  });
  
  // Test performance of property retrieval
  it('should retrieve properties with acceptable performance', async () => {
    const result = await measureApiPerformance(async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(10);
        
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
    
    console.log(`Properties retrieval performance: Avg ${result.averageTime.toFixed(2)}ms, Max ${result.maxTime.toFixed(2)}ms, Min ${result.minTime.toFixed(2)}ms`);
    
    expect(result.averageTime).toBeLessThan(API_TIME_THRESHOLD_MS);
  });
  
  // Test performance of appraisal retrieval
  it('should retrieve appraisals with acceptable performance', async () => {
    const result = await measureApiPerformance(async () => {
      const { data, error } = await supabase
        .from('appraisals')
        .select('*')
        .limit(10);
        
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
    
    console.log(`Appraisals retrieval performance: Avg ${result.averageTime.toFixed(2)}ms, Max ${result.maxTime.toFixed(2)}ms, Min ${result.minTime.toFixed(2)}ms`);
    
    expect(result.averageTime).toBeLessThan(API_TIME_THRESHOLD_MS);
  });
  
  // Test performance of property search by address
  it('should search properties by address with acceptable performance', async () => {
    const result = await measureApiPerformance(async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .ilike('address', '%Auckland%')
        .limit(10);
        
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
    
    console.log(`Property search performance: Avg ${result.averageTime.toFixed(2)}ms, Max ${result.maxTime.toFixed(2)}ms, Min ${result.minTime.toFixed(2)}ms`);
    
    expect(result.averageTime).toBeLessThan(API_TIME_THRESHOLD_MS);
  });
  
  // Test performance of complex joined query
  it('should perform complex queries with acceptable performance', async () => {
    const result = await measureApiPerformance(async () => {
      const { data, error } = await supabase
        .from('appraisals')
        .select(`
          id, 
          valuation,
          property:properties (id, address, bedrooms, bathrooms),
          comparable_properties (id, address, sale_price)
        `)
        .limit(5);
        
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
    
    console.log(`Complex query performance: Avg ${result.averageTime.toFixed(2)}ms, Max ${result.maxTime.toFixed(2)}ms, Min ${result.minTime.toFixed(2)}ms`);
    
    // More complex queries might need a higher threshold
    expect(result.averageTime).toBeLessThan(API_TIME_THRESHOLD_MS * 1.5);
  });
  
  // Test concurrent requests performance
  it('should handle concurrent requests with acceptable performance', async () => {
    const result = await simulateConcurrentRequests(async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(10);
        
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
    
    console.log(`Concurrent requests performance: Avg per request ${result.averageTime.toFixed(2)}ms, Total ${result.maxTime.toFixed(2)}ms`);
    
    // Threshold might be higher for concurrent requests
    expect(result.averageTime).toBeLessThan(API_TIME_THRESHOLD_MS * 1.2);
  });
  
  // Test Edge Function performance if available
  it('should call Edge Functions with acceptable performance', async () => {
    // Skip if not running against actual Supabase instance
    if (!process.env.RUN_EDGE_FUNCTION_TESTS) {
      console.log('Skipping Edge Function tests - not enabled');
      return;
    }
    
    const result = await measureApiPerformance(async () => {
      const { data, error } = await supabase.functions.invoke('property-data', {
        body: { propertyId: '1' }
      });
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
    
    console.log(`Edge Function performance: Avg ${result.averageTime.toFixed(2)}ms, Max ${result.maxTime.toFixed(2)}ms, Min ${result.minTime.toFixed(2)}ms`);
    
    // Edge functions might be slower than direct DB queries
    expect(result.averageTime).toBeLessThan(API_TIME_THRESHOLD_MS * 2);
  });
}); 