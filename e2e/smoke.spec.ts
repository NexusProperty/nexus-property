import { test, expect } from '@playwright/test';\ntest('smoke: homepage loads', async ({ page }) => {\n  await page.goto('');\n  await expect(page).toHaveTitle(/AppraisalHub|Nexus Property/i);\n});
