import { test, expect } from '@playwright/test';
import { mockLogin, mockBackendData } from './fixtures/userRoles';

test.describe('Appraisal Request and Report Generation', () => {
  test('user can submit appraisal request and generate report', async ({ page }) => {
    await mockLogin(page, 'user');
    await page.goto('/appraisals/new');
    await page.fill('[data-testid="property-address-input"]', '789 Main St');
    await page.fill('[data-testid="property-details-input"]', '3 bed, 2 bath');
    await page.fill('[data-testid="additional-notes-input"]', 'Test notes');
    await page.click('[data-testid="submit-appraisal-button"]');
    await expect(page.locator('[data-testid="appraisal-success"]')).toBeVisible();

    // Mock backend for report generation
    await mockBackendData(page, '**/api/reports/*', { reportId: 1, status: 'ready' });
    await page.click('[data-testid="generate-report-button"]');
    await expect(page.locator('[data-testid="report-ready"]')).toBeVisible();
  });

  test('shows validation error if required fields are missing', async ({ page }) => {
    await mockLogin(page, 'user');
    await page.goto('/appraisals/new');
    await page.click('[data-testid="submit-appraisal-button"]');
    await expect(page.locator('[data-testid="property-address-error"]')).toBeVisible();
  });
}); 