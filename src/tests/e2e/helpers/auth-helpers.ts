import { Page, expect } from '@playwright/test';

/**
 * Authentication helpers for E2E tests
 */

/**
 * Test credentials for authentication tests
 */
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'Password123!',
  fullName: 'Test User'
};

/**
 * Fill the login form with the provided credentials
 */
export async function fillLoginForm(page: Page, email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
}

/**
 * Fill the registration form with the provided credentials
 */
export async function fillRegistrationForm(
  page: Page, 
  email = TEST_CREDENTIALS.email, 
  password = TEST_CREDENTIALS.password,
  fullName = TEST_CREDENTIALS.fullName
) {
  await page.getByLabel('Full Name').fill(fullName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
}

/**
 * Login using the UI flow
 */
export async function login(page: Page, email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill the login form
  await fillLoginForm(page, email, password);
  
  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for navigation to dashboard
  await page.waitForURL(/.*dashboard/);
  
  // Verify we're logged in
  await expect(page.getByText(/dashboard/i)).toBeVisible();
}

/**
 * Register a new user using the UI flow
 */
export async function register(
  page: Page, 
  email = `test-${Date.now()}@example.com`, 
  password = TEST_CREDENTIALS.password,
  fullName = TEST_CREDENTIALS.fullName
) {
  // Navigate to registration page
  await page.goto('/register');
  
  // Fill the registration form
  await fillRegistrationForm(page, email, password, fullName);
  
  // Submit the form
  await page.getByRole('button', { name: /sign up/i }).click();
  
  // Wait for navigation to dashboard
  await page.waitForURL(/.*dashboard/);
  
  // Verify we're logged in
  await expect(page.getByText(/dashboard/i)).toBeVisible();
  
  return { email, password, fullName };
}

/**
 * Logout using the UI flow
 */
export async function logout(page: Page) {
  // Click on user menu
  await page.getByTestId('user-menu').click();
  
  // Click logout
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  
  // Verify we're logged out (login button is visible)
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
} 