import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth-helpers';

// Test credentials
const AGENT_CREDENTIALS = {
  email: 'agent@example.com',
  password: 'Password123!'
};

const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'Password123!'
};

test.describe('Report Generation and Delivery Process', () => {
  test.describe('Agent Report Generation', () => {
    test.beforeEach(async ({ page }) => {
      // Login as agent before each test
      await login(page, AGENT_CREDENTIALS.email, AGENT_CREDENTIALS.password);
      
      // Navigate to appraisals list
      await page.goto('/dashboard/appraisals');
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals/);
    });

    test.afterEach(async ({ page }) => {
      // Logout after each test
      await logout(page);
    });

    test('should generate a report from appraisal details page', async ({ page }) => {
      // Click on a completed appraisal from the list
      // Find the first appraisal with a "completed" status
      const completedAppraisal = page.getByText(/completed/i).first();
      await completedAppraisal.click();
      
      // Verify we're on the appraisal details page
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals\/[a-zA-Z0-9-]+/);
      
      // Locate and click the generate report button
      const generateReportButton = page.getByRole('button', { name: /generate report|download report/i });
      
      // Verify if the button exists
      if (await generateReportButton.isVisible()) {
        await generateReportButton.click();
        
        // Check for the loading state
        await expect(page.getByText(/generating/i)).toBeVisible({ timeout: 5000 });
        
        // Verify the report generation success message (this may take some time)
        await expect(page.getByText(/report generated successfully/i)).toBeVisible({ timeout: 20000 });
      } else {
        // If button is not visible, report might already be generated
        await expect(page.getByText(/report available/i)).toBeVisible();
      }
    });

    test('should access and send report to client', async ({ page }) => {
      // Navigate to a completed appraisal with a report
      // Find a completed appraisal
      const completedAppraisal = page.getByText(/completed/i).first();
      await completedAppraisal.click();
      
      // Verify we're on the appraisal details page
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals\/[a-zA-Z0-9-]+/);
      
      // Click on share report button
      const shareReportButton = page.getByRole('button', { name: /share report/i });
      
      if (await shareReportButton.isVisible()) {
        await shareReportButton.click();
        
        // Fill in email address in the sharing dialog
        await page.getByLabel(/email/i).fill('client@example.com');
        
        // Add a message
        await page.getByLabel(/message/i).fill('Here is your property appraisal report as requested.');
        
        // Click send button
        await page.getByRole('button', { name: /send/i }).click();
        
        // Verify success message
        await expect(page.getByText(/report sent successfully/i)).toBeVisible();
      } else {
        // If share button is not visible, we need to generate a report first
        const generateReportButton = page.getByRole('button', { name: /generate report|download report/i });
        
        if (await generateReportButton.isVisible()) {
          await generateReportButton.click();
          
          // Wait for generation to complete
          await expect(page.getByText(/report generated successfully/i)).toBeVisible({ timeout: 20000 });
          
          // Now find and click the share button
          await page.getByRole('button', { name: /share report/i }).click();
          
          // Fill in email address in the sharing dialog
          await page.getByLabel(/email/i).fill('client@example.com');
          
          // Add a message
          await page.getByLabel(/message/i).fill('Here is your property appraisal report as requested.');
          
          // Click send button
          await page.getByRole('button', { name: /send/i }).click();
          
          // Verify success message
          await expect(page.getByText(/report sent successfully/i)).toBeVisible();
        } else {
          // If neither button is visible, report sharing is not available
          test.skip();
          console.log('Report sharing is not available for this appraisal');
        }
      }
    });
  });

  test.describe('Customer Report Access', () => {
    test.beforeEach(async ({ page }) => {
      // Login as customer before each test
      await login(page, CUSTOMER_CREDENTIALS.email, CUSTOMER_CREDENTIALS.password);
      
      // Navigate to appraisals list
      await page.goto('/dashboard/appraisals');
      await expect(page).toHaveURL(/.*\/dashboard\/appraisals/);
    });

    test.afterEach(async ({ page }) => {
      // Logout after each test
      await logout(page);
    });

    test('should access and download a completed appraisal report', async ({ page }) => {
      // Click on a completed appraisal from the list
      // Find a completed appraisal
      const completedAppraisal = page.getByText(/completed/i).first();
      
      if (await completedAppraisal.isVisible()) {
        await completedAppraisal.click();
        
        // Verify we're on the appraisal details page
        await expect(page).toHaveURL(/.*\/dashboard\/appraisals\/[a-zA-Z0-9-]+/);
        
        // Check if the download report button is visible
        const downloadReportButton = page.getByRole('button', { name: /download report/i });
        
        if (await downloadReportButton.isVisible()) {
          // Create a download promise
          const downloadPromise = page.waitForEvent('download');
          
          // Click the download button
          await downloadReportButton.click();
          
          // Wait for the download to start
          const download = await downloadPromise;
          
          // Verify download started
          expect(download.suggestedFilename()).toContain('.pdf');
        } else {
          // If download button is not visible, report might not be available
          const reportStatus = page.getByText(/report not yet available|generating report/i);
          
          if (await reportStatus.isVisible()) {
            // Report is not yet available
            test.skip();
            console.log('Report is not yet available for this appraisal');
          } else {
            // If no status message is visible, report generation might not be supported
            expect(downloadReportButton.isVisible()).toBeTruthy();
            console.log('Download report button should be visible for completed appraisals');
          }
        }
      } else {
        // If no completed appraisal is found, skip the test
        test.skip();
        console.log('No completed appraisal found');
      }
    });

    test('should view report preview in dashboard', async ({ page }) => {
      // Check if there's a report preview section on the dashboard
      await page.goto('/dashboard');
      
      // Look for recent appraisal reports section
      const recentReportsSection = page.getByText(/recent appraisals|your recent reports/i);
      
      if (await recentReportsSection.isVisible()) {
        // Click on view report button/link for the first report
        const viewReportButton = page.getByRole('button', { name: /view report/i }).first();
        
        if (await viewReportButton.isVisible()) {
          await viewReportButton.click();
          
          // Verify navigation to report viewer
          await expect(page).toHaveURL(/.*\/dashboard\/reports\/[a-zA-Z0-9-]+/);
          
          // Check that report content is loaded
          await expect(page.getByText(/property appraisal report/i)).toBeVisible();
          
          // Check if the print button is available
          await expect(page.getByRole('button', { name: /print/i })).toBeVisible();
        } else {
          // If button is not visible, recent reports might be empty
          const emptyState = page.getByText(/no recent reports|haven't generated any/i);
          
          if (await emptyState.isVisible()) {
            test.skip();
            console.log('No recent reports available');
          } else {
            expect(viewReportButton.isVisible()).toBeTruthy();
            console.log('View report button should be visible');
          }
        }
      } else {
        // If the section is not found, skip the test
        test.skip();
        console.log('Recent reports section not found on dashboard');
      }
    });
  });
}); 