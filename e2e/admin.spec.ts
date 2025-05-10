import { test, expect } from '@playwright/test';
import { mockLogin, mockBackendData } from './fixtures/userRoles';

test.describe('Admin Flows', () => {
  test('admin can view and approve users', async ({ page }) => {
    await mockLogin(page, 'admin');
    await mockBackendData(page, '**/api/admin/users', [{ id: 1, email: 'user1@example.com', status: 'pending' }]);
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="user-row-1"]')).toBeVisible();
    await page.click('[data-testid="approve-user-1"]');
    await expect(page.locator('[data-testid="user-status-1"]')).toHaveText('approved');
  });

  test('admin can delete a user', async ({ page }) => {
    await mockLogin(page, 'admin');
    await mockBackendData(page, '**/api/admin/users', [{ id: 2, email: 'user2@example.com', status: 'active' }]);
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="user-row-2"]')).toBeVisible();
    await page.click('[data-testid="delete-user-2"]');
    await expect(page.locator('[data-testid="user-row-2"]')).not.toBeVisible();
  });

  test('admin can view, approve, and reject reports', async ({ page }) => {
    await mockLogin(page, 'admin');
    await mockBackendData(page, '**/api/admin/reports', [{ id: 1, status: 'pending' }]);
    await page.goto('/admin/reports');
    await expect(page.locator('[data-testid="report-row-1"]')).toBeVisible();
    await page.click('[data-testid="approve-report-1"]');
    await expect(page.locator('[data-testid="report-status-1"]')).toHaveText('approved');
    await page.click('[data-testid="reject-report-1"]');
    await expect(page.locator('[data-testid="report-status-1"]')).toHaveText('rejected');
  });
}); 