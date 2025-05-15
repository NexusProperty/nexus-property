import { test, expect } from '@playwright/test';
import { login, logout, TEST_CREDENTIALS } from './helpers/auth-helpers';

test.describe('Property Management Workflow', () => {
  // Set up test context
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
    
    // Navigate to properties page
    await page.goto('/dashboard/properties');
    await expect(page).toHaveURL(/.*\/dashboard\/properties/);
  });

  test.afterEach(async ({ page }) => {
    // Logout after each test
    await logout(page);
  });

  test('should display property list with search and filter functionality', async ({ page }) => {
    // Verify the property list components are present
    await expect(page.getByRole('heading', { name: /properties/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search properties/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add property/i })).toBeVisible();

    // Test search functionality
    const searchInput = page.getByPlaceholder(/search properties/i);
    await searchInput.fill('test property');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Verify filter components
    await expect(page.getByRole('button', { name: /filter/i })).toBeVisible();
    
    // Open filters
    await page.getByRole('button', { name: /filter/i }).click();
    
    // Verify filter options are visible
    await expect(page.getByText(/property type/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    
    // Test filter application
    await page.getByRole('combobox', { name: /property type/i }).click();
    await page.getByRole('option', { name: /house/i }).click();
    
    // Verify view mode switching
    await expect(page.getByRole('button', { name: /grid view/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list view/i })).toBeVisible();
    
    await page.getByRole('button', { name: /list view/i }).click();
    // The view should switch to list mode
    
    await page.getByRole('button', { name: /grid view/i }).click();
    // The view should switch back to grid mode
  });

  test('should navigate to add property page and back', async ({ page }) => {
    // Click on add property button
    await page.getByRole('button', { name: /add property/i }).click();
    
    // Verify navigation to add property page
    await expect(page).toHaveURL(/.*\/dashboard\/properties\/new/);
    await expect(page.getByRole('heading', { name: /add property/i })).toBeVisible();
    
    // Navigate back to property list
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/properties/);
  });

  test('should navigate to property details', async ({ page }) => {
    // Assuming there's at least one property in the list
    // Click on a property card/row to view details
    await page.getByText(/view details/i).first().click();
    
    // Verify navigation to property details
    await expect(page).toHaveURL(/.*\/dashboard\/properties\/[a-zA-Z0-9-]+/);
    await expect(page.getByRole('heading', { name: /property details/i })).toBeVisible();
    
    // Check if property information is displayed
    await expect(page.getByText(/address/i)).toBeVisible();
    await expect(page.getByText(/property type/i)).toBeVisible();
    
    // Navigate back to property list
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/properties/);
  });

  test('should complete property creation workflow', async ({ page }) => {
    // Click on add property button
    await page.getByRole('button', { name: /add property/i }).click();
    
    // Fill in property details
    await page.getByLabel(/address/i).fill('123 Test Street');
    await page.getByLabel(/suburb/i).fill('Test Suburb');
    await page.getByLabel(/city/i).fill('Test City');
    await page.getByLabel(/postcode/i).fill('1234');
    
    // Select property type
    await page.getByRole('combobox', { name: /property type/i }).click();
    await page.getByRole('option', { name: /house/i }).click();
    
    // Enter bedrooms and bathrooms
    await page.getByLabel(/bedrooms/i).fill('3');
    await page.getByLabel(/bathrooms/i).fill('2');
    
    // Enter floor and land size
    await page.getByLabel(/floor area/i).fill('150');
    await page.getByLabel(/land size/i).fill('500');
    
    // Enter year built
    await page.getByLabel(/year built/i).fill('2010');
    
    // Submit the form
    await page.getByRole('button', { name: /save property/i }).click();
    
    // Verify redirection to property details after creation
    await expect(page).toHaveURL(/.*\/dashboard\/properties\/[a-zA-Z0-9-]+/);
    
    // Verify success message
    await expect(page.getByText(/property created successfully/i)).toBeVisible();
    
    // Verify property details match the entered data
    await expect(page.getByText('123 Test Street')).toBeVisible();
    await expect(page.getByText('Test Suburb')).toBeVisible();
    await expect(page.getByText('Test City')).toBeVisible();
  });

  test('should edit property details', async ({ page }) => {
    // Click on a property card/row to view details
    await page.getByText(/view details/i).first().click();
    
    // Click on edit button
    await page.getByRole('button', { name: /edit/i }).click();
    
    // Update property details
    await page.getByLabel(/address/i).clear();
    await page.getByLabel(/address/i).fill('456 Updated Street');
    
    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();
    
    // Verify success message
    await expect(page.getByText(/property updated successfully/i)).toBeVisible();
    
    // Verify updated details are displayed
    await expect(page.getByText('456 Updated Street')).toBeVisible();
  });

  test('should delete a property', async ({ page }) => {
    // Click on a property card/row to view details
    await page.getByText(/view details/i).first().click();
    
    // Click on delete button
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Confirm deletion in the modal
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify redirection to property list
    await expect(page).toHaveURL(/.*\/dashboard\/properties/);
    
    // Verify success message
    await expect(page.getByText(/property deleted successfully/i)).toBeVisible();
  });
}); 