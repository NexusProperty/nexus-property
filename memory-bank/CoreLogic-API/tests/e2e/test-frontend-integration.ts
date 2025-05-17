/**
 * CoreLogic API - Frontend Integration End-to-End Tests
 * 
 * This file contains end-to-end tests that validate the integration between
 * the frontend components and the CoreLogic API services.
 */

import { test, expect } from '@playwright/test';
import { setupMockApiResponses } from './mock-api-helper';
import { StructuredLogger } from '../../monitoring/structured-logger';

const logger = new StructuredLogger('e2e-tests');

// Configure test timeouts (can be overridden in playwright.config.ts)
test.setTimeout(60000);

test.describe('CoreLogic API Frontend Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mocked API responses for consistent testing
    await setupMockApiResponses(page);
    
    // Navigate to the property page
    await page.goto('/property/search');
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('[data-testid="property-search-container"]');
    
    // Log test start
    logger.info('Starting frontend integration test', 'test_start', {
      test: 'CoreLogic API Frontend Integration',
      page: '/property/search'
    });
  });
  
  test('Property search form should submit and display CoreLogic data', async ({ page }) => {
    // Fill in the property search form
    await page.fill('[data-testid="address-input"]', '123 Main Street');
    await page.fill('[data-testid="city-input"]', 'Auckland');
    await page.selectOption('[data-testid="property-type-select"]', 'residential');
    
    // Submit the form
    await page.click('[data-testid="search-button"]');
    
    // Wait for the search results to load
    await page.waitForSelector('[data-testid="property-results"]');
    
    // Verify that CoreLogic data is displayed
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    await expect(propertyCard).toContainText('CoreLogic Data');
    
    // Verify that the property details include CoreLogic attribution
    await propertyCard.click();
    await page.waitForSelector('[data-testid="property-details"]');
    
    const attributionText = page.locator('[data-testid="data-attribution"]');
    await expect(attributionText).toContainText('Powered by CoreLogic');
    
    // Verify that property attributes from CoreLogic are displayed
    const propertyAttributes = page.locator('[data-testid="property-attributes"]');
    await expect(propertyAttributes).toBeVisible();
    await expect(propertyAttributes).toContainText('Land Area');
    await expect(propertyAttributes).toContainText('Year Built');
  });
  
  test('Property details page should load CoreLogic data directly', async ({ page }) => {
    // Navigate directly to a property details page
    await page.goto('/property/detail/P12345678');
    
    // Wait for the property details to load
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Verify that CoreLogic data sections are visible
    const propertySections = [
      'property-attributes',
      'property-valuation',
      'property-history',
      'comparable-properties'
    ];
    
    for (const section of propertySections) {
      const sectionElement = page.locator(`[data-testid="${section}"]`);
      await expect(sectionElement).toBeVisible();
    }
    
    // Verify that CoreLogic API data is displayed correctly
    const valuationSection = page.locator('[data-testid="property-valuation"]');
    await expect(valuationSection).toContainText('Estimated Value');
    
    // Check for proper error handling when data is unavailable
    const noDataSection = page.locator('[data-testid="no-data-message"]');
    expect(await noDataSection.count()).toBeLessThanOrEqual(1);
    
    // If no-data message exists, it should have appropriate content
    if (await noDataSection.count() > 0) {
      await expect(noDataSection).toContainText('Some property data is unavailable');
    }
  });
  
  test('Feature flags should control CoreLogic content visibility', async ({ page }) => {
    // This test checks if feature flags properly control the visibility of CoreLogic data
    
    // Scenario 1: Feature flag enabled (default mock setting)
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    const coreLogicContent = page.locator('[data-testid="corelogic-data-container"]');
    await expect(coreLogicContent).toBeVisible();
    
    // Scenario 2: Simulate feature flag disabled
    // First, override the feature flag response
    await page.evaluate(() => {
      window.localStorage.setItem('mock-feature-flags', JSON.stringify({
        enable_corelogic_property_data: false
      }));
    });
    
    // Reload the page
    await page.reload();
    await page.waitForSelector('[data-testid="property-details"]');
    
    // CoreLogic content should be hidden, and alternative content shown
    const alternativeContent = page.locator('[data-testid="basic-data-container"]');
    await expect(alternativeContent).toBeVisible();
    
    // CoreLogic content should either be hidden or not in the DOM
    const coreLogicContentAfterFlag = page.locator('[data-testid="corelogic-data-container"]');
    const isHidden = (await coreLogicContentAfterFlag.count() === 0) || 
                     !(await coreLogicContentAfterFlag.isVisible());
    expect(isHidden).toBeTruthy();
  });
  
  test('Error handling should work correctly for CoreLogic API failures', async ({ page }) => {
    // Configure mock API to simulate failure
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: true,
        failure_code: 500
      }));
    });
    
    // Navigate to property details
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Verify that error state is shown correctly
    const errorMessage = page.locator('[data-testid="api-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('unable to retrieve property data');
    
    // Verify that retry button is available
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    
    // Restore API to working state
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: false
      }));
    });
    
    // Click retry and verify data loads
    await retryButton.click();
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="property-valuation"]');
    
    // Verify data is now visible
    const valuationSection = page.locator('[data-testid="property-valuation"]');
    await expect(valuationSection).toBeVisible();
    await expect(valuationSection).toContainText('Estimated Value');
  });
}); 