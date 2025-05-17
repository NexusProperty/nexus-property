/**
 * CoreLogic API Performance Benchmark
 * 
 * This script benchmarks the performance of the CoreLogic API implementation,
 * measuring response times, throughput, and memory usage across different
 * scenarios.
 */

import { createCoreLogicClient, LogLevel, CoreLogicApiClient } from './corelogic-service';
import { createCoreLogicBatchHandler, CoreLogicBatchHandler, PropertyRequest } from './corelogic-batch';
import { CoreLogicAuthConfig, PropertyDataResponse } from './corelogic-types';

// Benchmark configuration
interface BenchmarkConfig {
  iterations: number;
  batchSizes: number[];
  concurrencies: number[];
  withCache: boolean;
  warmupIterations: number;
  cooldownMs: number;
}

// Benchmark result
interface BenchmarkResult {
  name: string;
  averageTimeMs: number;
  medianTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  p95TimeMs: number;
  p99TimeMs: number;
  successRate: number;
  requestsPerSecond: number;
  totalRequests: number;
  totalTimeMs: number;
  memoryUsageMB?: number;
}

/**
 * Run a benchmark test
 * @param name The name of the benchmark test
 * @param fn The function to benchmark
 * @param iterations Number of iterations to run
 * @param warmupIterations Number of warmup iterations (not counted in results)
 * @param cooldownMs Cooldown period between iterations in milliseconds
 * @returns Benchmark results
 */
async function runBenchmark(
  name: string,
  fn: () => Promise<boolean>,
  iterations: number,
  warmupIterations = 0,
  cooldownMs = 0
): Promise<BenchmarkResult> {
  console.log(`\nStarting benchmark: ${name}`);
  console.log(`Warmup iterations: ${warmupIterations}`);
  
  // Warmup phase
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
    if (cooldownMs > 0) {
      await new Promise(resolve => setTimeout(resolve, cooldownMs));
    }
  }
  
  // Record memory usage before the test
  const memoryBefore = process.memoryUsage();
  
  // Benchmark phase
  const times: number[] = [];
  let successCount = 0;
  const totalStartTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    console.log(`Running iteration ${i + 1}/${iterations}`);
    const startTime = Date.now();
    
    try {
      const success = await fn();
      const duration = Date.now() - startTime;
      times.push(duration);
      
      if (success) {
        successCount++;
      }
      
      console.log(`  ✓ Completed in ${duration}ms`);
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
      times.push(Date.now() - startTime);
    }
    
    if (cooldownMs > 0 && i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, cooldownMs));
    }
  }
  
  const totalTimeMs = Date.now() - totalStartTime;
  
  // Record memory usage after the test
  const memoryAfter = process.memoryUsage();
  const memoryUsageMB = (memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024);
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const minTimeMs = times[0];
  const maxTimeMs = times[times.length - 1];
  const totalTime = times.reduce((acc, time) => acc + time, 0);
  const averageTimeMs = totalTime / times.length;
  const medianTimeMs = times[Math.floor(times.length / 2)];
  const p95TimeMs = times[Math.floor(times.length * 0.95)];
  const p99TimeMs = times[Math.floor(times.length * 0.99)];
  const successRate = (successCount / iterations) * 100;
  const requestsPerSecond = (iterations / totalTimeMs) * 1000;
  
  const result: BenchmarkResult = {
    name,
    averageTimeMs,
    medianTimeMs,
    minTimeMs,
    maxTimeMs,
    p95TimeMs,
    p99TimeMs,
    successRate,
    requestsPerSecond,
    totalRequests: iterations,
    totalTimeMs,
    memoryUsageMB
  };
  
  console.log(`\nBenchmark results for: ${name}`);
  console.log(`  Average time: ${averageTimeMs.toFixed(2)}ms`);
  console.log(`  Median time: ${medianTimeMs.toFixed(2)}ms`);
  console.log(`  Min time: ${minTimeMs}ms`);
  console.log(`  Max time: ${maxTimeMs}ms`);
  console.log(`  95th percentile: ${p95TimeMs}ms`);
  console.log(`  99th percentile: ${p99TimeMs}ms`);
  console.log(`  Success rate: ${successRate.toFixed(2)}%`);
  console.log(`  Requests per second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`  Memory usage: ${memoryUsageMB.toFixed(2)}MB`);
  
  return result;
}

/**
 * Benchmark single property requests
 * @param client The CoreLogic API client
 * @param propertyIds Array of property IDs to test
 * @param config Benchmark configuration
 * @returns Benchmark results
 */
async function benchmarkSingleRequests(
  client: CoreLogicApiClient,
  propertyIds: string[],
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  let requestIndex = 0;
  
  const makeRequest = async (): Promise<boolean> => {
    const propertyId = propertyIds[requestIndex % propertyIds.length];
    requestIndex++;
    
    try {
      const attributes = await client.getPropertyAttributes(propertyId);
      const salesHistory = await client.getPropertySalesHistory(propertyId);
      const avm = await client.getPropertyAVM(propertyId);
      return true;
    } catch (error) {
      console.error(`Error fetching property data: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  return runBenchmark(
    'Individual Property Requests (Sequential)',
    makeRequest,
    config.iterations,
    config.warmupIterations,
    config.cooldownMs
  );
}

/**
 * Benchmark batch property requests
 * @param client The CoreLogic API client
 * @param batchHandler The CoreLogic batch handler
 * @param propertyIds Array of property IDs to test
 * @param batchSize Number of properties in each batch
 * @param config Benchmark configuration
 * @returns Benchmark results
 */
async function benchmarkBatchRequests(
  client: CoreLogicApiClient,
  batchHandler: CoreLogicBatchHandler,
  propertyIds: string[],
  batchSize: number,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  let batchIndex = 0;
  
  const makeBatchRequest = async (): Promise<boolean> => {
    // Create a batch of property requests
    const requests: PropertyRequest[] = [];
    for (let i = 0; i < batchSize; i++) {
      const index = (batchIndex * batchSize + i) % propertyIds.length;
      requests.push({ propertyId: propertyIds[index] });
    }
    batchIndex++;
    
    try {
      const results = await batchHandler.batchPropertyData(requests);
      const successCount = results.filter(r => r.success).length;
      return successCount === requests.length;
    } catch (error) {
      console.error(`Error in batch request: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  return runBenchmark(
    `Batch Property Requests (Size: ${batchSize})`,
    makeBatchRequest,
    config.iterations,
    config.warmupIterations,
    config.cooldownMs
  );
}

/**
 * Benchmark parallel property requests
 * @param client The CoreLogic API client
 * @param propertyIds Array of property IDs to test
 * @param concurrency Number of concurrent requests
 * @param config Benchmark configuration
 * @returns Benchmark results
 */
async function benchmarkParallelRequests(
  client: CoreLogicApiClient,
  propertyIds: string[],
  concurrency: number,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  let requestIndex = 0;
  
  const makeParallelRequests = async (): Promise<boolean> => {
    const requests: Promise<unknown>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      const propertyId = propertyIds[(requestIndex + i) % propertyIds.length];
      requests.push(client.getPropertyAttributes(propertyId));
    }
    
    requestIndex += concurrency;
    
    try {
      await Promise.all(requests);
      return true;
    } catch (error) {
      console.error(`Error in parallel requests: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  return runBenchmark(
    `Parallel Property Requests (Concurrency: ${concurrency})`,
    makeParallelRequests,
    config.iterations,
    config.warmupIterations,
    config.cooldownMs
  );
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  // Sample property IDs for testing
  const propertyIds = [
    'PROP001', 'PROP002', 'PROP003', 'PROP004', 'PROP005',
    'PROP006', 'PROP007', 'PROP008', 'PROP009', 'PROP010'
  ];
  
  // Benchmark configuration
  const config: BenchmarkConfig = {
    iterations: 10,
    batchSizes: [2, 5, 10],
    concurrencies: [2, 5, 10],
    withCache: true,
    warmupIterations: 2,
    cooldownMs: 500
  };
  
  // Create CoreLogic client with mock mode
  const corelogicConfig: CoreLogicAuthConfig = {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    baseUrl: 'https://api-uat.corelogic.asia'
  };
  
  console.log('\n=== CORELOGIC API PERFORMANCE BENCHMARK ===\n');
  console.log('Configuration:');
  console.log(`  Iterations: ${config.iterations}`);
  console.log(`  Batch sizes: ${config.batchSizes.join(', ')}`);
  console.log(`  Concurrencies: ${config.concurrencies.join(', ')}`);
  console.log(`  With cache: ${config.withCache}`);
  console.log(`  Warmup iterations: ${config.warmupIterations}`);
  console.log(`  Cooldown between iterations: ${config.cooldownMs}ms`);
  console.log(`  Mock mode: true`);
  console.log(`  Sample property count: ${propertyIds.length}`);
  
  const client = createCoreLogicClient(corelogicConfig, true, LogLevel.ERROR);
  const batchHandler = createCoreLogicBatchHandler(client, {
    maxConcurrent: 10,
    requestDelayMs: 100,
    maxRetries: 1
  });
  
  const results: BenchmarkResult[] = [];
  
  // Benchmark 1: Single property requests
  results.push(await benchmarkSingleRequests(client, propertyIds, config));
  
  // Benchmark 2: Batch property requests (various sizes)
  for (const batchSize of config.batchSizes) {
    results.push(await benchmarkBatchRequests(client, batchHandler, propertyIds, batchSize, config));
  }
  
  // Benchmark 3: Parallel property requests (various concurrencies)
  for (const concurrency of config.concurrencies) {
    results.push(await benchmarkParallelRequests(client, propertyIds, concurrency, config));
  }
  
  // Print summary
  console.log('\n=== BENCHMARK SUMMARY ===\n');
  console.log('| Test | Avg Time (ms) | Median Time (ms) | Requests/sec | Success Rate |');
  console.log('|------|--------------|-----------------|--------------|--------------|');
  
  for (const result of results) {
    console.log(
      `| ${result.name.padEnd(30)} | ` +
      `${result.averageTimeMs.toFixed(2).padStart(12)} | ` +
      `${result.medianTimeMs.toFixed(2).padStart(15)} | ` +
      `${result.requestsPerSecond.toFixed(2).padStart(12)} | ` +
      `${result.successRate.toFixed(2).padStart(12)}% |`
    );
  }
  
  // Determine the fastest approach
  const sortedByAvg = [...results].sort((a, b) => a.averageTimeMs - b.averageTimeMs);
  const sortedByThroughput = [...results].sort((a, b) => b.requestsPerSecond - a.requestsPerSecond);
  
  console.log('\nFastest by average response time:');
  console.log(`  ${sortedByAvg[0].name}: ${sortedByAvg[0].averageTimeMs.toFixed(2)}ms`);
  
  console.log('\nHighest throughput:');
  console.log(`  ${sortedByThroughput[0].name}: ${sortedByThroughput[0].requestsPerSecond.toFixed(2)} requests/sec`);
  
  console.log('\nBenchmark completed!');
}

// Run the benchmark if this file is executed directly
if (require.main === module) {
  runAllBenchmarks().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

export { runBenchmark, benchmarkSingleRequests, benchmarkBatchRequests, benchmarkParallelRequests }; 