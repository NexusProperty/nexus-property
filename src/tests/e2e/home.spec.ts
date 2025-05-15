import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Verify that the page loaded
  await expect(page).toHaveTitle(/AppraisalHub/);
});

test('should display login option when not logged in', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Verify login button is visible
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('should navigate to login page when login button is clicked', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Click the login button
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Verify we're on the login page
  await expect(page).toHaveURL(/.*login/);
}); 