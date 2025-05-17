/**
 * CoreLogic API - Mock API Helper for E2E Tests
 * 
 * This file provides utilities to set up mock API responses for end-to-end tests.
 * It intercepts API requests and returns consistent mock responses for reliable testing.
 */

import { Page } from '@playwright/test';
import { mockPropertyData } from './mock-data';

/**
 * Set up mock API responses for consistent E2E testing
 */
export async function setupMockApiResponses(page: Page): Promise<void> {
  // Set up intercepts for API calls
  await setupPropertyDataApiIntercept(page);
  await setupFeatureFlagsIntercept(page);
  
  // Set up initial local storage values for mocks
  await page.evaluate(() => {
    // Default mock API behavior
    window.localStorage.setItem('mock-api-behavior', JSON.stringify({
      corelogic_api_should_fail: false
    }));
    
    // Default feature flags (enabled)
    window.localStorage.setItem('mock-feature-flags', JSON.stringify({
      enable_corelogic_property_data: true,
      enable_corelogic_market_stats: true
    }));
  });
}

/**
 * Set up intercept for property data API calls
 */
async function setupPropertyDataApiIntercept(page: Page): Promise<void> {
  await page.route('**/api/properties/**', async (route) => {
    // Check if we should simulate a failure
    const shouldFailStr = await page.evaluate(() => 
      window.localStorage.getItem('mock-api-behavior')
    );
    
    const shouldFail = shouldFailStr ? 
      JSON.parse(shouldFailStr).corelogic_api_should_fail : false;
    
    const failureCode = shouldFailStr && JSON.parse(shouldFailStr).failure_code ?
      JSON.parse(shouldFailStr).failure_code : 500;
    
    if (shouldFail) {
      // Simulate API failure
      return route.fulfill({
        status: failureCode,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'API Error',
          message: 'Simulated API failure for testing',
          code: 'CORELOGIC_API_ERROR'
        })
      });
    }
    
    // Extract property ID from URL
    const url = route.request().url();
    const match = url.match(/\/properties\/([^/]+)/);
    const propertyId = match ? match[1] : 'P12345678';
    
    // Get mock data for this property
    const mockData = mockPropertyData[propertyId] || mockPropertyData.default;
    
    // Add 300-500ms random delay to simulate real API latency
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });
}

/**
 * Set up intercept for feature flags API calls
 */
async function setupFeatureFlagsIntercept(page: Page): Promise<void> {
  await page.route('**/api/feature-flags', async (route) => {
    // Get mock feature flags from localStorage or use defaults
    const featureFlagsStr = await page.evaluate(() => 
      window.localStorage.getItem('mock-feature-flags')
    );
    
    const featureFlags = featureFlagsStr ? 
      JSON.parse(featureFlagsStr) : 
      {
        enable_corelogic_property_data: true,
        enable_corelogic_market_stats: true
      };
    
    // Add slight delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        flags: [
          {
            id: 'enable_corelogic_property_data',
            name: 'CoreLogic Property Data',
            description: 'Enables real CoreLogic property data',
            enabled: featureFlags.enable_corelogic_property_data ?? true,
            percentage: 100
          },
          {
            id: 'enable_corelogic_market_stats',
            name: 'CoreLogic Market Statistics',
            description: 'Enables CoreLogic market statistics',
            enabled: featureFlags.enable_corelogic_market_stats ?? true,
            percentage: 100
          }
        ]
      })
    });
  });
} 