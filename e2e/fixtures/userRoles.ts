import { test as base, expect, Page, BrowserContext } from '@playwright/test';

export async function mockLogin(page: Page, role: 'user' | 'admin' | 'agent', userData?: Record<string, unknown>) {
  // Intercept login API and mock response
  await page.route('**/auth/v1/token', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user', role, ...userData },
      }),
    });
  });
}

export async function mockBackendData(page: Page, endpoint: string, data: unknown) {
  await page.route(endpoint, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

// Example usage in a test:
// import { mockLogin, mockBackendData } from './userRoles';
// test('admin flow', async ({ page }) => {
//   await mockLogin(page, 'admin');
//   await mockBackendData(page, '**/api/admin/*', { ... });
//   ...
// }); 