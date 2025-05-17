/**
 * CoreLogic API - Error Handling End-to-End Tests
 * 
 * This file contains end-to-end tests that verify the error handling capabilities
 * of the CoreLogic API integration.
 */

import { test, expect } from '@playwright/test';
import { setupMockApiResponses } from './mock-api-helper';
import { StructuredLogger } from '../../monitoring/structured-logger';

const logger = new StructuredLogger('e2e-tests-error-handling');

test.describe('CoreLogic API Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mocked API responses for consistent testing
    await setupMockApiResponses(page);
    
    // Log test start
    logger.info('Starting error handling test', 'test_start', {
      test: 'CoreLogic API Error Handling'
    });
  });
  
  test('API authentication errors should be handled properly', async ({ page }) => {
    // Set up authentication error
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: true,
        failure_code: 401,
        failure_type: 'authentication'
      }));
    });
    
    // Navigate to property details
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Check for authentication error message
    const errorMessage = page.locator('[data-testid="auth-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('authentication');
    
    // Check for "Contact Support" button
    const contactSupportButton = page.locator('[data-testid="contact-support-button"]');
    await expect(contactSupportButton).toBeVisible();
    
    // Verify error is logged to console (this would be hard to test in real E2E, but including for completeness)
    // In a real test, we might use a more sophisticated approach to verify logs
  });
  
  test('API rate limiting should be handled gracefully', async ({ page }) => {
    // Set up rate limit error
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: true,
        failure_code: 429,
        failure_type: 'rate_limit'
      }));
    });
    
    // Navigate to property details
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Check for rate limit error message
    const errorMessage = page.locator('[data-testid="rate-limit-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('rate limit');
    
    // Should have a retry after period message
    const retryMessage = page.locator('[data-testid="retry-after-message"]');
    await expect(retryMessage).toBeVisible();
    
    // Should have an automatic retry countdown
    const retryCountdown = page.locator('[data-testid="retry-countdown"]');
    await expect(retryCountdown).toBeVisible();
    
    // Verify cached data is shown if available
    const cachedDataIndicator = page.locator('[data-testid="cached-data-indicator"]');
    
    // May or may not exist depending on cache state
    if (await cachedDataIndicator.count() > 0) {
      await expect(cachedDataIndicator).toContainText('cached');
    } else {
      // If no cached data, should show a fallback message
      const noDataMessage = page.locator('[data-testid="no-data-message"]');
      await expect(noDataMessage).toBeVisible();
    }
  });
  
  test('API timeout errors should be handled with retry options', async ({ page }) => {
    // Set up timeout error
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: true,
        failure_code: 504,
        failure_type: 'timeout'
      }));
    });
    
    // Navigate to property details
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Check for timeout error message
    const errorMessage = page.locator('[data-testid="timeout-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('taking longer than expected');
    
    // Should have a manual retry button
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    
    // Reset to working state
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: false
      }));
    });
    
    // Click retry and verify it works
    await retryButton.click();
    
    // Should now load properly
    await page.waitForSelector('[data-testid="property-valuation"]');
    const valuationSection = page.locator('[data-testid="property-valuation"]');
    await expect(valuationSection).toBeVisible();
  });
  
  test('Circuit breaker should prevent hammering failing API', async ({ page }) => {
    // Set up persistent server error
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: true,
        failure_code: 500,
        failure_type: 'server_error',
        persistent: true
      }));
    });
    
    // Navigate to property details several times to trigger circuit breaker
    for (let i = 0; i < 5; i++) {
      await page.goto('/property/detail/P12345678');
      await page.waitForSelector('[data-testid="property-details"]');
      
      // Force a retry to increment failure count
      if (await page.locator('[data-testid="retry-button"]').count() > 0) {
        await page.click('[data-testid="retry-button"]');
        await page.waitForTimeout(500); // Wait for the retry to happen
      }
    }
    
    // After several failures, should see circuit breaker message
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    const circuitBreakerMessage = page.locator('[data-testid="circuit-breaker-message"]');
    await expect(circuitBreakerMessage).toBeVisible();
    await expect(circuitBreakerMessage).toContainText('temporarily unavailable');
    
    // Should see cached data if available
    const cachedDataIndicator = page.locator('[data-testid="cached-data-indicator"]');
    
    if (await cachedDataIndicator.count() > 0) {
      await expect(cachedDataIndicator).toContainText('cached');
    }
    
    // Should have a "Try Again Later" message
    const tryAgainMessage = page.locator('[data-testid="try-again-later"]');
    await expect(tryAgainMessage).toBeVisible();
    
    // Circuit breaker should eventually allow a test request (half-open state)
    // In a real test, we might need to manipulate the circuit breaker timeout
    // For now, we'll reset the mock behavior and force a reset of the circuit breaker
    
    await page.evaluate(() => {
      window.localStorage.setItem('mock-api-behavior', JSON.stringify({
        corelogic_api_should_fail: false
      }));
      
      // In a real app, we might have a way to reset the circuit breaker for testing
      window.localStorage.setItem('reset-circuit-breaker', 'true');
    });
    
    // Refresh the page
    await page.reload();
    
    // After circuit breaker reset and API working, data should load
    await page.waitForSelector('[data-testid="property-valuation"]');
    const valuationSection = page.locator('[data-testid="property-valuation"]');
    await expect(valuationSection).toBeVisible();
  });
  
  test('Feature flag disabled should fall back to basic data', async ({ page }) => {
    // Disable CoreLogic feature flag
    await page.evaluate(() => {
      window.localStorage.setItem('mock-feature-flags', JSON.stringify({
        enable_corelogic_property_data: false
      }));
    });
    
    // Navigate to property details
    await page.goto('/property/detail/P12345678');
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Should not see CoreLogic specific UI
    const coreLogicDataContainer = page.locator('[data-testid="corelogic-data-container"]');
    expect(await coreLogicDataContainer.count()).toBe(0);
    
    // Should see basic data instead
    const basicDataContainer = page.locator('[data-testid="basic-data-container"]');
    await expect(basicDataContainer).toBeVisible();
    
    // No error messages should be displayed
    const errorMessages = page.locator('[data-testid$="error-message"]');
    expect(await errorMessages.count()).toBe(0);
    
    // Enable the feature flag
    await page.evaluate(() => {
      window.localStorage.setItem('mock-feature-flags', JSON.stringify({
        enable_corelogic_property_data: true
      }));
    });
    
    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="property-details"]');
    
    // Now CoreLogic data should appear
    const coreLogicDataContainerAfter = page.locator('[data-testid="corelogic-data-container"]');
    await expect(coreLogicDataContainerAfter).toBeVisible();
  });
}); 