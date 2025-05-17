/**
 * CoreLogic API Sandbox Configuration
 * 
 * This file contains configuration settings for the CoreLogic API sandbox environment.
 * These settings will be used for testing the integration with the actual CoreLogic API.
 */

import { CoreLogicAuthConfig } from './corelogic-types';

/**
 * Sandbox environment configuration for CoreLogic API
 */
export const sandboxConfig: CoreLogicAuthConfig = {
  apiKey: process.env.CORELOGIC_SANDBOX_API_KEY || '',
  apiSecret: process.env.CORELOGIC_SANDBOX_API_SECRET || '',
  baseUrl: process.env.CORELOGIC_SANDBOX_API_URL || 'https://api-uat.corelogic.asia',
};

/**
 * Test properties for sandbox validation
 * These are known properties in the CoreLogic sandbox that can be used for testing
 */
export const testProperties = {
  // Will be populated with actual test properties provided with sandbox credentials
  validPropertyIds: [
    'SANDBOX-PROP-1',
    'SANDBOX-PROP-2',
    'SANDBOX-PROP-3',
  ],
  
  validAddresses: [
    {
      address: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Auckland',
      postcode: '1010'
    },
    {
      address: '456 Sample Road',
      suburb: 'Sample Suburb',
      city: 'Wellington',
      postcode: '6011'
    }
  ]
};

/**
 * Sandbox test configuration
 * Controls various aspects of the sandbox testing
 */
export const sandboxTestConfig = {
  // Logging configuration for sandbox tests
  logLevel: 'INFO', // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  
  // Caching settings for sandbox tests
  cacheTTL: 3600, // Cache time-to-live in seconds
  
  // Batch processing configuration
  batchSize: 5, // Number of properties to process in a batch
  concurrencyLimit: 2, // Maximum concurrent requests
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms before retrying
  
  // Performance test configuration
  performanceTestIterations: 3, // Number of iterations for performance tests
  largeBatchSize: 20, // Size of large batch for performance testing
};

/**
 * Initialize sandbox environment
 * Sets up the required configuration for sandbox testing
 */
export function initializeSandboxEnvironment(): void {
  console.log('Initializing CoreLogic API sandbox environment');
  
  // Validate configuration
  if (!sandboxConfig.apiKey || !sandboxConfig.apiSecret) {
    console.error('Sandbox API credentials not configured.');
    console.error('Please set the following environment variables:');
    console.error('- CORELOGIC_SANDBOX_API_KEY');
    console.error('- CORELOGIC_SANDBOX_API_SECRET');
    console.error('- CORELOGIC_SANDBOX_API_URL (optional, defaults to UAT URL)');
    throw new Error('Missing sandbox credentials');
  }
  
  console.log('Sandbox environment initialized successfully');
}

/**
 * Converts an object to environment variables string format
 * Useful for generating .env file content
 */
export function generateEnvFileContent(): string {
  return `# CoreLogic API Sandbox Environment Configuration
CORELOGIC_SANDBOX_API_KEY=your-sandbox-api-key
CORELOGIC_SANDBOX_API_SECRET=your-sandbox-api-secret
CORELOGIC_SANDBOX_API_URL=https://api-uat.corelogic.asia
CORELOGIC_USE_MOCK=false

# Test Configuration
CORELOGIC_LOG_LEVEL=INFO
CORELOGIC_CACHE_TTL=3600
CORELOGIC_BATCH_SIZE=5
CORELOGIC_CONCURRENCY_LIMIT=2
CORELOGIC_MAX_RETRIES=3
`;
} 