import { test, expect } from '@playwright/test';
import { 
  TEST_CREDENTIALS, 
  fillLoginForm, 
  fillRegistrationForm, 
  login, 
  logout 
} from './helpers/auth-helpers';

test.describe('Authentication E2E Tests', () => {
  test('should display login form with required fields', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Verify form elements are visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Verify navigation links are present
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });
  
  test('should show validation errors for empty login form', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Submit without filling the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
  
  test('should navigate to forgot password page', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Click on forgot password link
    await page.getByRole('link', { name: /forgot password/i }).click();
    
    // Verify we're on the forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);
    await expect(page.getByText(/reset your password/i)).toBeVisible();
  });
  
  test('should navigate to registration page', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Click on sign up link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Verify we're on the registration page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByText(/create an account/i)).toBeVisible();
  });
  
  test('should display registration form with required fields', async ({ page }) => {
    // Go to registration page
    await page.goto('/register');
    
    // Verify form elements are visible
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    
    // Verify navigation links are present
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
  
  test('should show validation errors for empty registration form', async ({ page }) => {
    // Go to registration page
    await page.goto('/register');
    
    // Submit without filling the form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Verify validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
  
  test('should show validation error when passwords do not match', async ({ page }) => {
    // Go to registration page
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.getByLabel('Full Name').fill(TEST_CREDENTIALS.fullName);
    await page.getByLabel('Email').fill(TEST_CREDENTIALS.email);
    await page.getByLabel('Password').fill(TEST_CREDENTIALS.password);
    await page.getByLabel(/confirm password/i).fill('DifferentPassword123!');
    
    // Submit the form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Verify validation error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
  
  test('should show error for invalid email format', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Fill form with invalid email
    await fillLoginForm(page, 'invalid-email', TEST_CREDENTIALS.password);
    
    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
  
  test('should successfully log in and redirect to dashboard', async ({ page }) => {
    // Use the login helper
    await login(page);
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Cleanup
    await logout(page);
  });
  
  test('should successfully log out', async ({ page }) => {
    // Login first
    await login(page);
    
    // Use the logout helper
    await logout(page);
    
    // Verify we're logged out (back on home page)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
  
  test('should protect routes and redirect to login when not authenticated', async ({ page }) => {
    // Try to access a protected route directly
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
}); 