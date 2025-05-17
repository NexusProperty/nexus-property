/**
 * CoreLogic API Sandbox Test Runner
 * 
 * This script runs comprehensive tests against the CoreLogic API sandbox environment
 * to validate our implementation with real API responses.
 */

import { createCoreLogicClient, LogLevel } from './corelogic-service';
import { runAllValidationTests } from './data-validation-tests';
import { transformationBenchmark, batchProcessProperties } from './optimized-transformers';
import { 
  sandboxConfig, 
  testProperties, 
  sandboxTestConfig,
  initializeSandboxEnvironment 
} from './sandbox-config';

// Test result interface
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: unknown;
}

// Type for the propertyId in test results
interface PropertyIdResult {
  propertyId: string;
}

// Type for property data response
interface PropertyDataResponse {
  success: boolean;
  error?: string;
}

/**
 * Runs all sandbox tests and returns results
 */
async function runSandboxTests(): Promise<TestResult[]> {
  console.log('Starting CoreLogic API Sandbox Tests');
  const results: TestResult[] = [];
  
  try {
    // Initialize sandbox environment
    initializeSandboxEnvironment();
    
    // Create CoreLogic client with sandbox configuration
    const logLevel = sandboxTestConfig.logLevel === 'DEBUG' 
      ? LogLevel.DEBUG 
      : sandboxTestConfig.logLevel === 'INFO'
      ? LogLevel.INFO
      : sandboxTestConfig.logLevel === 'WARN'
      ? LogLevel.WARN
      : LogLevel.ERROR;
    
    const client = createCoreLogicClient(sandboxConfig, false, logLevel);
    
    // Run API connection test
    results.push(await runTest('API Connection', async () => {
      // Test authentication by calling a simple endpoint
      const matchedAddress = await client.matchAddress({
        address: testProperties.validAddresses[0].address,
        suburb: testProperties.validAddresses[0].suburb,
        city: testProperties.validAddresses[0].city
      });
      
      if (!matchedAddress || !matchedAddress.propertyId) {
        throw new Error('Failed to authenticate with CoreLogic API or address matching failed');
      }
      
      return { propertyId: matchedAddress.propertyId };
    }));
    
    // If API connection failed, stop further tests
    if (!results[0].passed) {
      console.error('API connection test failed. Aborting further tests.');
      return results;
    }
    
    // Get first valid property ID for subsequent tests
    const propertyId = (results[0].details as PropertyIdResult)?.propertyId || testProperties.validPropertyIds[0];
    
    // Run Address Validation test
    results.push(await runTest('Address Validation', async () => {
      const addressResult = await client.matchAddress({
        address: testProperties.validAddresses[1].address,
        suburb: testProperties.validAddresses[1].suburb,
        city: testProperties.validAddresses[1].city
      });
      
      return addressResult;
    }));
    
    // Run Property Attributes test
    results.push(await runTest('Property Attributes', async () => {
      const attributes = await client.getPropertyAttributes(propertyId);
      return attributes;
    }));
    
    // Run Sales History test
    results.push(await runTest('Sales History', async () => {
      const salesHistory = await client.getPropertySalesHistory(propertyId);
      return salesHistory;
    }));
    
    // Run AVM test
    results.push(await runTest('Automated Valuation', async () => {
      const avm = await client.getPropertyAVM(propertyId);
      return avm;
    }));
    
    // Run Market Statistics test
    results.push(await runTest('Market Statistics', async () => {
      const marketStats = await client.getMarketStatistics({
        suburb: testProperties.validAddresses[0].suburb,
        city: testProperties.validAddresses[0].city
      });
      return marketStats;
    }));
    
    // Run Property Image test
    results.push(await runTest('Property Image', async () => {
      const imageResult = await client.getPropertyImage(propertyId);
      return imageResult;
    }));
    
    // Run data transformation tests
    results.push(await runTest('Data Transformation', async () => {
      // First get all required data for a property
      const attributes = await client.getPropertyAttributes(propertyId);
      const salesHistory = await client.getPropertySalesHistory(propertyId);
      const avm = await client.getPropertyAVM(propertyId);
      const marketStats = await client.getMarketStatistics({
        suburb: testProperties.validAddresses[0].suburb,
        city: testProperties.validAddresses[0].city
      });
      
      // Run validation tests with real data
      const validationResults = runAllValidationTests();
      
      if (!validationResults.passed) {
        throw new Error(`Data validation failed: ${validationResults.errors.join(', ')}`);
      }
      
      return validationResults;
    }));
    
    // Run batch processing test
    results.push(await runTest('Batch Processing', async () => {
      // Use the first 3 property IDs for batch testing
      const batchPropertyIds = testProperties.validPropertyIds.slice(0, 3);
      
      const batchResults = await batchProcessProperties(
        batchPropertyIds,
        id => client.getPropertyAttributes(id),
        id => client.getPropertySalesHistory(id),
        id => client.getPropertyAVM(id),
        params => client.getMarketStatistics(params)
      );
      
      return { 
        propertyCount: Object.keys(batchResults).length,
        successCount: Object.values(batchResults).filter(r => r.success).length
      };
    }));
    
    // Run performance test
    results.push(await runTest('Performance Benchmark', async () => {
      // Get property data for benchmark
      const attributes = await client.getPropertyAttributes(propertyId);
      
      // Run the benchmark with a reasonable dataset size
      const benchmarkResults = transformationBenchmark.measure(
        attributes,
        [10, 50], // Test with 10 and 50 sales records
        2 // Only 2 iterations for quick testing
      );
      
      return benchmarkResults;
    }));
    
    console.log('All sandbox tests completed');
    
  } catch (error) {
    console.error('Error running sandbox tests:', error);
    results.push({
      name: 'Sandbox Test Runner',
      passed: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return results;
}

/**
 * Helper function to run a test and measure duration
 */
async function runTest(
  name: string, 
  testFn: () => Promise<unknown>
): Promise<TestResult> {
  console.log(`Running test: ${name}`);
  const startTime = Date.now();
  
  try {
    const details = await testFn();
    const duration = Date.now() - startTime;
    console.log(`Test '${name}' passed in ${duration}ms`);
    
    return {
      name,
      passed: true,
      duration,
      details
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Test '${name}' failed in ${duration}ms:`, error);
    
    return {
      name,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generates a test report in markdown format
 */
function generateTestReport(results: TestResult[]): string {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  let report = `# CoreLogic API Sandbox Test Report\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${totalTests}\n`;
  report += `- **Passed:** ${passedTests}\n`;
  report += `- **Failed:** ${failedTests}\n`;
  report += `- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(2)}%\n\n`;
  
  report += `## Test Results\n\n`;
  
  results.forEach(result => {
    report += `### ${result.name}\n\n`;
    report += `- **Result:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Duration:** ${result.duration}ms\n`;
    
    if (!result.passed && result.error) {
      report += `- **Error:** ${result.error}\n`;
    }
    
    report += '\n';
  });
  
  return report;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const results = await runSandboxTests();
      const report = generateTestReport(results);
      
      console.log('\nTest Report:');
      console.log(report);
      
      // Exit with appropriate code
      const hasFailures = results.some(r => !r.passed);
      process.exit(hasFailures ? 1 : 0);
    } catch (error) {
      console.error('Fatal error running sandbox tests:', error);
      process.exit(1);
    }
  })();
} 