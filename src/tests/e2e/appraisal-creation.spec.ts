import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth-helpers';

// Test credentials
const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'Password123!'
};

test.describe('Appraisal Creation Process', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer before each test
    await login(page, CUSTOMER_CREDENTIALS.email, CUSTOMER_CREDENTIALS.password);
    
    // Verify we're on the customer dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/get your free appraisal/i)).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Logout after each test
    await logout(page);
  });

  test('should complete the entire appraisal creation process', async ({ page }) => {
    // Click on start appraisal button from dashboard
    await page.getByRole('button', { name: /start free appraisal/i }).click();
    
    // Verify navigation to appraisal wizard
    await expect(page).toHaveURL(/.*\/dashboard\/appraisals\/new/);
    await expect(page.getByText(/new property appraisal/i)).toBeVisible();
    
    // Step 1: Property Details
    await expect(page.getByText(/property details/i)).toBeVisible();
    
    // Fill in property details
    // Check if there's a property selection step or direct input
    if (await page.getByText(/select a property/i).isVisible()) {
      // If properties exist, select the first one
      await page.getByText(/select this property/i).first().click();
    } else {
      // Otherwise, enter property details manually
      await page.getByLabel(/address/i).fill('123 Test Street');
      await page.getByLabel(/suburb/i).fill('Test Suburb');
      await page.getByLabel(/city/i).fill('Test City');
      await page.getByLabel(/postcode/i).fill('1234');
      
      // Select property type
      await page.getByRole('combobox', { name: /property type/i }).click();
      await page.getByRole('option', { name: /house/i }).click();
    }
    
    // Click next to proceed to the next step
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 2: Property Features
    await expect(page.getByText(/property features/i)).toBeVisible();
    
    // Fill in property features
    await page.getByLabel(/bedrooms/i).fill('3');
    await page.getByLabel(/bathrooms/i).fill('2');
    await page.getByLabel(/floor area/i).fill('150');
    await page.getByLabel(/land size/i).fill('500');
    await page.getByLabel(/year built/i).fill('2010');
    
    // Select property condition
    await page.getByRole('combobox', { name: /condition/i }).click();
    await page.getByRole('option', { name: /good/i }).click();
    
    // Check any relevant features checkboxes
    await page.getByLabel(/garage/i).check();
    await page.getByLabel(/deck/i).check();
    
    // Click next to proceed to the next step
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 3: Appraisal Parameters
    await expect(page.getByText(/appraisal parameters/i)).toBeVisible();
    
    // Select appraisal type
    await page.getByRole('combobox', { name: /appraisal type/i }).click();
    await page.getByRole('option', { name: /market value/i }).click();
    
    // Select urgency
    await page.getByRole('combobox', { name: /urgency/i }).click();
    await page.getByRole('option', { name: /standard/i }).click();
    
    // Add any notes
    await page.getByLabel(/notes/i).fill('This is a test appraisal for E2E testing.');
    
    // Click next to proceed to the next step
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 4: Review & Submit
    await expect(page.getByText(/review & submit/i)).toBeVisible();
    
    // Verify property details are displayed correctly in the summary
    await expect(page.getByText('123 Test Street')).toBeVisible();
    await expect(page.getByText('Test Suburb')).toBeVisible();
    await expect(page.getByText('Test City')).toBeVisible();
    
    // Submit the appraisal
    await page.getByRole('button', { name: /submit appraisal/i }).click();
    
    // Verify success message and redirection
    await expect(page.getByText(/appraisal submitted successfully/i)).toBeVisible();
    await expect(page).toHaveURL(/.*\/dashboard\/appraisals\/[a-zA-Z0-9-]+/);
    
    // Verify appraisal details page is displayed
    await expect(page.getByText(/appraisal details/i)).toBeVisible();
    await expect(page.getByText(/pending/i)).toBeVisible();
    
    // Verify property details are displayed
    await expect(page.getByText('123 Test Street')).toBeVisible();
    await expect(page.getByText('Test Suburb')).toBeVisible();
    await expect(page.getByText('Test City')).toBeVisible();
  });
  
  test('should handle data validation in appraisal creation', async ({ page }) => {
    // Start a new appraisal
    await page.getByRole('button', { name: /start free appraisal/i }).click();
    
    // Try to proceed without entering required fields
    await page.getByRole('button', { name: /next/i }).click();
    
    // Verify validation errors
    await expect(page.getByText(/address is required/i)).toBeVisible();
    
    // Fill in minimum required fields
    await page.getByLabel(/address/i).fill('123 Test Street');
    await page.getByLabel(/suburb/i).fill('Test Suburb');
    await page.getByLabel(/city/i).fill('Test City');
    
    // Try again to proceed
    await page.getByRole('button', { name: /next/i }).click();
    
    // Verify we can now proceed to the next step
    await expect(page.getByText(/property features/i)).toBeVisible();
  });
  
  test('should allow saving appraisal as draft', async ({ page }) => {
    // Start a new appraisal
    await page.getByRole('button', { name: /start free appraisal/i }).click();
    
    // Fill in property details
    await page.getByLabel(/address/i).fill('Draft Property');
    await page.getByLabel(/suburb/i).fill('Draft Suburb');
    await page.getByLabel(/city/i).fill('Draft City');
    
    // Save as draft rather than proceeding
    await page.getByRole('button', { name: /save as draft/i }).click();
    
    // Verify success message
    await expect(page.getByText(/saved as draft/i)).toBeVisible();
    
    // Verify redirection to appraisals list
    await expect(page).toHaveURL(/.*\/dashboard\/appraisals/);
    
    // Verify the draft appears in the list
    await expect(page.getByText('Draft Property')).toBeVisible();
    await expect(page.getByText(/draft/i)).toBeVisible();
  });
  
  test('should allow canceling appraisal creation', async ({ page }) => {
    // Start a new appraisal
    await page.getByRole('button', { name: /start free appraisal/i }).click();
    
    // Fill in some details
    await page.getByLabel(/address/i).fill('Cancel Test');
    
    // Click cancel button
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Confirm cancellation in dialog
    await page.getByRole('button', { name: /yes, cancel/i }).click();
    
    // Verify redirection to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
}); 