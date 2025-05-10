import { test, expect } from '@playwright/test';
import { mockLogin } from './fixtures/userRoles';

test.describe('Login and Authentication', () => {
  test('successful login as regular user redirects to user dashboard', async ({ page }) => {
    await mockLogin(page, 'user');
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/dashboard|user/i);
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
  });

  test('successful login as admin redirects to admin dashboard', async ({ page }) => {
    await mockLogin(page, 'admin');
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/admin/);
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('failed login shows error message', async ({ page }) => {
    // Mock login API to return error
    await page.route('**/auth/v1/token', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'baduser@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });
}); 