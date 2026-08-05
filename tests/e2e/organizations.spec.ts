import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Organizations & Projects', () => {
  test('should render organization dashboard routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard|\/login/);
  });

  test('should navigate to organization management route', async ({ page }) => {
    await page.goto('/orgs/acme-corp');
    await expect(page.locator('body')).toBeVisible();
  });
});
