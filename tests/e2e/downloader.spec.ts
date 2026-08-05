import { test, expect } from '@playwright/test';

test.describe('Media Analysis & Downloader Flow', () => {
  test('should render home page with search form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Universal Media Downloader');
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should analyze YouTube URL and render metadata format selection', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="text"]');
    await input.fill('https://www.youtube.com/watch?v=-NVcoSWEF08');
    await page.click('button:has-text("Analyze")');

    // Verify metadata container appears
    await expect(page.locator('text=Select Stream Format')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Download")')).toBeEnabled();
  });

  test('should switch between combined, video, and audio quality tabs', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="text"]');
    await input.fill('https://www.youtube.com/watch?v=-NVcoSWEF08');
    await page.click('button:has-text("Analyze")');

    await expect(page.locator('text=Select Stream Format')).toBeVisible({ timeout: 15000 });

    // Switch tab to audio
    await page.click('button:has-text("audio")');
    await expect(page.locator('button:has-text("audio")')).toHaveClass(/bg-indigo-600/);

    // Switch tab to video
    await page.click('button:has-text("video")');
    await expect(page.locator('button:has-text("video")')).toHaveClass(/bg-indigo-600/);
  });
});
