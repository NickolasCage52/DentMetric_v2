/**
 * E2E: Mobile viewport - basic navigation
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } });

test.describe('Mobile', () => {
  test('Launch -> open metric -> select Standard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('metric-standard').click({ force: true });

    await expect(page.getByTestId('step-dots')).toBeVisible({ timeout: 5000 });
  });

  test('Freeform touch simulation - use mouse on mobile viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('metric-graphics').click({ force: true });

    await page.getByRole('button', { name: /Продолжить.*Размещение/i }).click({ force: true });

    await page.getByTestId('add-freeform').click({ force: true });

    const canvas = page.locator('.freeform-canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 80, box.y + 80);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 100);
      await page.mouse.move(box.x + 100, box.y + 120);
      await page.mouse.move(box.x + 80, box.y + 80);
      await page.mouse.up();
    }

    await page.getByTestId('freeform-confirm').click({ force: true });
  });
});
