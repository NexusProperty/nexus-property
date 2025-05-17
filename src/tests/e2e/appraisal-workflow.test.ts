import { test, expect } from '@playwright/test';

test.describe('Appraisal Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in
    await page.goto('/');
    await page.fill('[data-test="email-input"]', 'test@example.com');
    await page.fill('[data-test="password-input"]', 'TestPassword123!');
    await page.click('[data-test="login-button"]');
    
    // Wait for login to complete and dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should complete an end-to-end appraisal workflow', async ({ page }) => {
    // Step 1: Create a new appraisal
    await page.click('[data-test="new-appraisal-button"]');
    await page.waitForURL('/appraisals/new');

    // Fill in property details form
    await page.fill('[data-test="property-address-input"]', '123 Test Street');
    await page.fill('[data-test="property-suburb-input"]', 'Test Suburb');
    await page.fill('[data-test="property-city-input"]', 'Auckland');
    await page.selectOption('[data-test="property-type-select"]', 'house');
    await page.fill('[data-test="bedrooms-input"]', '3');
    await page.fill('[data-test="bathrooms-input"]', '2');
    await page.fill('[data-test="land-size-input"]', '650');
    
    // Submit the form to create the appraisal
    await page.click('[data-test="create-appraisal-button"]');
    
    // Wait for the form to be submitted and redirected to the appraisal details page
    await page.waitForURL(/\/appraisals\/[a-f0-9-]+$/);
    
    // Get the appraisal ID from the URL
    const url = page.url();
    const appraisalId = url.split('/').pop();
    
    // Step 2: Verify appraisal was created successfully
    const title = await page.textContent('h1');
    expect(title).toContain('123 Test Street');
    
    // Step 3: Fetch property data from CoreLogic
    await page.click('[data-test="fetch-property-data-button"]');
    
    // Wait for data to be fetched (this might take a while in a real app)
    await page.waitForSelector('[data-test="loading-indicator"]', { state: 'hidden', timeout: 30000 });
    
    // Verify the data was fetched successfully
    const propertyDetails = await page.isVisible('[data-test="property-details-card"]');
    expect(propertyDetails).toBe(true);
    
    // Step 4: Review and edit property details if needed
    await page.click('[data-test="edit-property-details-button"]');
    
    // Make some edits to the property details
    await page.fill('[data-test="year-built-input"]', '2006');
    await page.click('[data-test="save-property-details-button"]');
    
    // Wait for changes to be saved
    await page.waitForSelector('[data-test="save-success-message"]');
    
    // Step 5: Generate valuation
    await page.click('[data-test="generate-valuation-button"]');
    
    // Wait for valuation to be generated
    await page.waitForSelector('[data-test="loading-indicator"]', { state: 'hidden', timeout: 30000 });
    
    // Verify valuation was generated
    const valuationDetails = await page.isVisible('[data-test="valuation-card"]');
    expect(valuationDetails).toBe(true);
    
    // Check that we have a valuation range
    const valuationRange = await page.textContent('[data-test="valuation-range"]');
    expect(valuationRange).toMatch(/\$[0-9,]+ - \$[0-9,]+/);
    
    // Step 6: Generate appraisal report
    await page.click('[data-test="generate-report-button"]');
    
    // Wait for report generation
    await page.waitForSelector('[data-test="loading-indicator"]', { state: 'hidden', timeout: 60000 });
    
    // Verify report was generated
    const reportLink = await page.isVisible('[data-test="download-report-link"]');
    expect(reportLink).toBe(true);
    
    // Step 7: Download the report (we won't actually download in the test)
    const downloadHref = await page.getAttribute('[data-test="download-report-link"]', 'href');
    expect(downloadHref).toBeTruthy();
    expect(downloadHref).toContain('.pdf');
    
    // Step 8: Share the appraisal (if feature is available)
    if (await page.isVisible('[data-test="share-appraisal-button"]')) {
      await page.click('[data-test="share-appraisal-button"]');
      
      // Fill in sharing details
      await page.fill('[data-test="recipient-email-input"]', 'client@example.com');
      await page.fill('[data-test="share-message-input"]', 'Here is your property appraisal');
      
      // Submit the share form
      await page.click('[data-test="confirm-share-button"]');
      
      // Wait for confirmation
      await page.waitForSelector('[data-test="share-success-message"]');
    }
    
    // Step 9: Return to dashboard
    await page.click('[data-test="back-to-dashboard-button"]');
    await page.waitForURL('/dashboard');
    
    // Verify the new appraisal appears in the dashboard list
    const appraisalInList = await page.isVisible(`[data-test="appraisal-list-item-${appraisalId}"]`);
    expect(appraisalInList).toBe(true);
  });
  
  test('should handle property data not found gracefully', async ({ page }) => {
    // Create a new appraisal with a fake address that won't be found
    await page.click('[data-test="new-appraisal-button"]');
    await page.waitForURL('/appraisals/new');
    
    // Fill in property details with a non-existent address
    await page.fill('[data-test="property-address-input"]', '999 Nonexistent Street');
    await page.fill('[data-test="property-suburb-input"]', 'Fake Suburb');
    await page.fill('[data-test="property-city-input"]', 'Auckland');
    await page.selectOption('[data-test="property-type-select"]', 'house');
    
    // Submit the form
    await page.click('[data-test="create-appraisal-button"]');
    await page.waitForURL(/\/appraisals\/[a-f0-9-]+$/);
    
    // Try to fetch property data
    await page.click('[data-test="fetch-property-data-button"]');
    
    // Wait for error message
    await page.waitForSelector('[data-test="property-not-found-message"]');
    
    // Verify error message is displayed
    const errorMessage = await page.textContent('[data-test="property-not-found-message"]');
    expect(errorMessage).toContain('not found');
    
    // Verify manual data entry option is shown
    const manualEntryOption = await page.isVisible('[data-test="manual-data-entry-button"]');
    expect(manualEntryOption).toBe(true);
    
    // Test manual data entry as fallback
    await page.click('[data-test="manual-data-entry-button"]');
    
    // Fill in manual property details
    await page.fill('[data-test="bedrooms-input"]', '4');
    await page.fill('[data-test="bathrooms-input"]', '2');
    await page.fill('[data-test="land-size-input"]', '700');
    await page.fill('[data-test="floor-area-input"]', '200');
    await page.fill('[data-test="year-built-input"]', '2000');
    
    // Save manual data
    await page.click('[data-test="save-property-details-button"]');
    
    // Verify data was saved
    await page.waitForSelector('[data-test="save-success-message"]');
    
    // Ensure we can still proceed with valuation
    await page.click('[data-test="generate-valuation-button"]');
    await page.waitForSelector('[data-test="loading-indicator"]', { state: 'hidden', timeout: 30000 });
    
    // Verify valuation still works with manual data
    const valuationDetails = await page.isVisible('[data-test="valuation-card"]');
    expect(valuationDetails).toBe(true);
  });
}); 
