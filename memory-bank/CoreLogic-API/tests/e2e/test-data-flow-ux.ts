/**
 * CoreLogic API - Data Flow and UX End-to-End Tests
 * 
 * This file contains end-to-end tests that validate the data flow and user experience
 * when using the CoreLogic API integration.
 */

import { test, expect } from '@playwright/test';
import { setupMockApiResponses } from './mock-api-helper';
import { StructuredLogger } from '../../monitoring/structured-logger';

const logger = new StructuredLogger('e2e-tests-data-flow');

test.describe('CoreLogic API Data Flow and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mocked API responses for consistent testing
    await setupMockApiResponses(page);
    
    // Log test start
    logger.info('Starting data flow and UX test', 'test_start', {
      test: 'CoreLogic API Data Flow and UX'
    });
  });
  
  test('Property data should flow correctly through the application', async ({ page }) => {
    // Navigate to the property search page
    await page.goto('/property/search');
    await page.waitForSelector('[data-testid="property-search-container"]');
    
    // Fill out the property search form
    await page.fill('[data-testid="address-input"]', '123 Main Street');
    await page.fill('[data-testid="city-input"]', 'Auckland');
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results to load
    await page.waitForSelector('[data-testid="property-results"]');
    
    // Click on the first property to view details
    await page.click('[data-testid="property-card"]');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Verify data flow through application
    // 1. Check that property ID is consistently used in URLs and UI
    const url = page.url();
    expect(url).toContain('/property/detail/P');
    
    const propertyIdElement = page.locator('[data-testid="property-id"]');
    const propertyIdText = await propertyIdElement.textContent();
    const propertyId = propertyIdText?.trim().replace('ID: ', '');
    
    expect(url).toContain(propertyId);
    
    // 2. Check that property attributes are consistent across views
    const streetAddressElement = page.locator('[data-testid="street-address"]');
    const streetAddress = await streetAddressElement.textContent();
    expect(streetAddress).toContain('Main Street');
    
    // 3. Verify CoreLogic data is properly attributed
    const attributionElements = page.locator('[data-testid="data-attribution"]');
    expect(await attributionElements.count()).toBeGreaterThan(0);
    
    // 4. Check that valuation data is properly formatted
    const valuationElement = page.locator('[data-testid="property-valuation-value"]');
    const valuationText = await valuationElement.textContent();
    
    // Should be formatted as currency with commas
    expect(valuationText).toMatch(/\$[0-9,]+/);
    
    // 5. Check that confidence indicator matches valuation data
    const confidenceElement = page.locator('[data-testid="valuation-confidence"]');
    await expect(confidenceElement).toBeVisible();
  });
  
  test('Property report generation flow should work properly', async ({ page }) => {
    // Navigate directly to property details page
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Click generate report button
    await page.click('[data-testid="generate-report-button"]');
    
    // Should see report options dialog
    await page.waitForSelector('[data-testid="report-options-dialog"]');
    
    // Select report type
    await page.click('[data-testid="report-type-comprehensive"]');
    
    // Click generate
    await page.click('[data-testid="confirm-report-generation"]');
    
    // Should see generating indicator
    await page.waitForSelector('[data-testid="report-generating-indicator"]');
    
    // Wait for report to be ready (in our mock it will be ready quickly)
    await page.waitForSelector('[data-testid="report-ready-notification"]', { timeout: 10000 });
    
    // Click view report
    await page.click('[data-testid="view-report-button"]');
    
    // Should navigate to report view
    await page.waitForSelector('[data-testid="property-report-view"]');
    
    // Verify report content includes CoreLogic data
    const reportContent = page.locator('[data-testid="report-content"]');
    await expect(reportContent).toContainText('Property Valuation');
    await expect(reportContent).toContainText('CoreLogic');
    
    // Verify PDF download option works
    const downloadButton = page.locator('[data-testid="download-pdf-button"]');
    await expect(downloadButton).toBeVisible();
    
    // We would normally test the actual download but for this mock test we'll just check the button is there
  });
  
  test('UX for CoreLogic data loading states should be user-friendly', async ({ page }) => {
    // Slow down the API responses to test loading states
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_delay: true,
        delay_ms: 2000 // 2 second delay
      }));
    });
    
    // Navigate to property details
    await page.goto('/property/detail/P12345678');
    
    // Should see loading indicators right away
    const loadingIndicators = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicators.first()).toBeVisible();
    
    // There should be loading indicators with appropriate messages
    const loadingTexts = await loadingIndicators.allTextContents();
    expect(loadingTexts.some(text => text.includes('Loading property data'))).toBeTruthy();
    
    // Eventually the data should load and replace loading indicators
    await page.waitForSelector('[data-testid="property-valuation"]');
    
    // Loading indicators should disappear
    await expect(loadingIndicators).toHaveCount(0);
    
    // Now check progressive loading behavior
    await page.reload();
    
    // Check if the page loads critical content first
    await page.waitForSelector('[data-testid="property-basic-info"]');
    
    // Basic info should be visible while detailed sections are still loading
    const basicInfo = page.locator('[data-testid="property-basic-info"]');
    await expect(basicInfo).toBeVisible();
    
    // Now wait for detailed content to load
    await page.waitForSelector('[data-testid="property-valuation"]');
    
    // All sections should eventually be loaded
    const detailedSections = [
      'property-valuation',
      'property-attributes',
      'comparable-properties'
    ];
    
    for (const section of detailedSections) {
      const sectionElement = page.locator(`[data-testid="${section}"]`);
      await expect(sectionElement).toBeVisible();
    }
  });
  
  test('Error states should be user-friendly and provide recovery options', async ({ page }) => {
    // Configure mock API to fail with different error codes
    const errorCodes = [404, 500, 403];
    
    for (const errorCode of errorCodes) {
      // Set the error code
      await page.evaluate((code) => {
        window.localStorage.setItem('mock-api-behavior', JSON.stringify({
          corelogic_api_should_fail: true,
          failure_code: code
        }));
      }, errorCode);
      
      // Navigate to property details
      await page.goto('/property/detail/P12345678');
      await page.waitForSelector('[data-testid="property-details"]');
      
      // Should see error state
      const errorState = page.locator('[data-testid="api-error-message"]');
      await expect(errorState).toBeVisible();
      
      // Error message should be user-friendly and not expose raw error codes
      const errorText = await errorState.textContent();
      expect(errorText).not.toContain('Error ' + errorCode); // Should not show raw error code
      
      // Should have a retry button
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();
      
      // For 404, should suggest search instead of retry
      if (errorCode === 404) {
        const searchSuggestion = page.locator('[data-testid="search-suggestion"]');
        await expect(searchSuggestion).toBeVisible();
      }
    }
    
    // Test recovery from error state
    // First reset to working state
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: false
      }));
    });
    
    // Then reload with error and click retry
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: true,
        failure_code: 500
      }));
    });
    
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Reset to working before clicking retry
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: false
      }));
    });
    
    // Click retry
    await page.click('[data-testid="retry-button"]');
    
    // Should recover and show data
    await page.waitForSelector('[data-testid="property-valuation"]');
    const valuationSection = page.locator('[data-testid="property-valuation"]');
    await expect(valuationSection).toBeVisible();
  });
}); 