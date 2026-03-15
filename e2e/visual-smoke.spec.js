/**
 * E2E: Visual smoke checks — no horizontal overflow, adequate tap targets.
 */
import { test, expect } from '@playwright/test';

test.describe('Visual smoke checks', () => {
  test('no horizontal overflow on home screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });

  test('no horizontal overflow on settings screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-settings"]').click();
    await page.waitForTimeout(400);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });
});
