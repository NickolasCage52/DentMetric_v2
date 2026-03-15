/**
 * E2E: App boot and basic navigation.
 */
import { test, expect } from '@playwright/test';

test.describe('App boot', () => {
  test('loads without crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows mode selection or home screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator(
      '[data-testid="btn-quick-mode"], [data-testid="btn-detail-mode"], [data-testid="nav-home"]'
    ).first().isVisible({ timeout: 8000 });
    expect(hasContent).toBeTruthy();
  });

  test('bottom navigation is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="nav-history"]')).toBeVisible();
  });
});
