import { test, expect } from '@playwright/test';
import { login, logout, TEST_CREDENTIALS } from './helpers/auth-helpers';

// Test roles
const AGENT_CREDENTIALS = {
  email: 'agent@example.com',
  password: 'Password123!'
};

const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'Password123!'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Password123!'
};

test.describe('User Role Flows', () => {
  test.describe('Agent Portal Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login as agent before each test
      await login(page, AGENT_CREDENTIALS.email, AGENT_CREDENTIALS.password);
      
      // Verify we're on the agent dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.getByText(/agent dashboard/i)).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
      // Logout after each test
      await logout(page);
    });

    test('should navigate through agent dashboard and view key metrics', async ({ page }) => {
      // Verify key dashboard elements are displayed
      await expect(page.getByText(/total appraisals/i)).toBeVisible();
      await expect(page.getByText(/new leads/i)).toBeVisible();
      await expect(page.getByText(/completed this month/i)).toBeVisible();
      await expect(page.getByText(/recent appraisals/i)).toBeVisible();
      await expect(page.getByText(/latest leads/i)).toBeVisible();
    });

    test('should navigate to appraisals section and view list', async ({ page }) => {
      // Navigate to appraisals section
      await page.getByRole('link', { name: /appraisals/i }).click();
      
      // Verify we're on the appraisals page
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals/);
      await expect(page.getByRole('heading', { name: /appraisals/i })).toBeVisible();
      
      // Verify appraisal list functionality
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /filter/i })).toBeVisible();
    });

    test('should navigate to clients section and manage client list', async ({ page }) => {
      // Navigate to clients section
      await page.getByRole('link', { name: /clients/i }).click();
      
      // Verify we're on the clients page
      await expect(page).toHaveURL(/.*\/dashboard\/clients/);
      await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
      
      // Verify add client button is present
      await expect(page.getByRole('button', { name: /add client/i })).toBeVisible();
      
      // Test add client navigation
      await page.getByRole('button', { name: /add client/i }).click();
      await expect(page).toHaveURL(/.*\/dashboard\/clients\/new/);
      
      // Verify form fields
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/phone/i)).toBeVisible();
      
      // Navigate back to clients list
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page).toHaveURL(/.*\/dashboard\/clients/);
    });

    test('should navigate to properties section and manage properties', async ({ page }) => {
      // Navigate to properties section
      await page.getByRole('link', { name: /properties/i }).click();
      
      // Verify we're on the properties page
      await expect(page).toHaveURL(/.*\/dashboard\/properties/);
      await expect(page.getByRole('heading', { name: /properties/i })).toBeVisible();
      
      // Verify add property button is present
      await expect(page.getByRole('button', { name: /add property/i })).toBeVisible();
    });
  });

  test.describe('Customer Portal Tests', () => {
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

    test('should display customer dashboard with appraisal options', async ({ page }) => {
      // Verify key dashboard elements are displayed
      await expect(page.getByText(/start a new property appraisal/i)).toBeVisible();
      await expect(page.getByText(/your recent appraisals/i)).toBeVisible();
      await expect(page.getByText(/connect with real estate professionals/i)).toBeVisible();
      
      // Verify start appraisal button is present
      await expect(page.getByRole('button', { name: /start free appraisal/i })).toBeVisible();
    });

    test('should navigate to properties section', async ({ page }) => {
      // Navigate to properties section
      await page.getByRole('link', { name: /my properties/i }).click();
      
      // Verify we're on the properties page
      await expect(page).toHaveURL(/.*\/dashboard\/properties/);
      await expect(page.getByRole('heading', { name: /my properties/i })).toBeVisible();
      
      // Verify add property button is present
      await expect(page.getByRole('button', { name: /add property/i })).toBeVisible();
    });

    test('should navigate to appraisals section', async ({ page }) => {
      // Navigate to appraisals section
      await page.getByRole('link', { name: /my appraisals/i }).click();
      
      // Verify we're on the appraisals page
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals/);
      await expect(page.getByRole('heading', { name: /my appraisals/i })).toBeVisible();
    });

    test('should start a new appraisal flow', async ({ page }) => {
      // Click on start appraisal button
      await page.getByRole('button', { name: /start free appraisal/i }).click();
      
      // Verify navigation to appraisal wizard
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals\/new/);
      await expect(page.getByText(/new property appraisal/i)).toBeVisible();
      
      // Verify wizard steps
      await expect(page.getByText(/property details/i)).toBeVisible();
    });
  });

  test.describe('Admin Portal Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin before each test
      await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
      
      // Verify we're on the admin dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.getByText(/admin dashboard/i)).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
      // Logout after each test
      await logout(page);
    });

    test('should display admin dashboard with system metrics', async ({ page }) => {
      // Verify key dashboard elements are displayed
      await expect(page.getByText(/total users/i)).toBeVisible();
      await expect(page.getByText(/total agents/i)).toBeVisible();
      await expect(page.getByText(/total customers/i)).toBeVisible();
      await expect(page.getByText(/monthly appraisals/i)).toBeVisible();
      
      // Verify system health section
      await expect(page.getByText(/system health/i)).toBeVisible();
      await expect(page.getByText(/api status/i)).toBeVisible();
      await expect(page.getByText(/database/i)).toBeVisible();
      
      // Verify recent activity section
      await expect(page.getByText(/recent activity/i)).toBeVisible();
    });

    test('should navigate to user management section', async ({ page }) => {
      // Navigate to users section
      await page.getByRole('link', { name: /users/i }).click();
      
      // Verify we're on the users page
      await expect(page).toHaveURL(/.*\/admin\/users/);
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
      
      // Verify add user button is present
      await expect(page.getByRole('button', { name: /add user/i })).toBeVisible();
    });

    test('should navigate to system settings', async ({ page }) => {
      // Navigate to settings section
      await page.getByRole('link', { name: /settings/i }).click();
      
      // Verify we're on the settings page
      await expect(page).toHaveURL(/.*\/admin\/settings/);
      await expect(page.getByRole('heading', { name: /system settings/i })).toBeVisible();
      
      // Verify settings sections are present
      await expect(page.getByText(/general settings/i)).toBeVisible();
      await expect(page.getByText(/api configuration/i)).toBeVisible();
    });

    test('should access system logs', async ({ page }) => {
      // Navigate to logs section
      await page.getByRole('link', { name: /logs/i }).click();
      
      // Verify we're on the logs page
      await expect(page).toHaveURL(/.*\/admin\/logs/);
      await expect(page.getByRole('heading', { name: /system logs/i })).toBeVisible();
      
      // Verify log filters are present
      await expect(page.getByText(/filter logs/i)).toBeVisible();
    });
  });
}); 