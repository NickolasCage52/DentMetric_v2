/**
 * E2E: Mobile viewport - basic navigation
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testImagePath = path.join(__dirname, 'helpers', 'test-image.jpg');

test.use({ viewport: { width: 375, height: 667 } });

test.describe('Mobile', () => {
  test('Launch -> open metric -> select Standard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('btn-quick-mode').click({ force: true });

    await expect(page.getByTestId('step-dots')).toBeVisible({ timeout: 5000 });
  });

  test('Freeform touch simulation - use mouse on mobile viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('btn-detail-mode').click({ force: true });
    await page.waitForTimeout(500);

    const continuePlacementBtn = page.getByRole('button', { name: /Продолжить.*Размещение/i });
    if (await continuePlacementBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continuePlacementBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
    if (!(await galleryBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, 'Photo step not shown — cannot reach placement without photo');
      return;
    }

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      galleryBtn.click(),
    ]);
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(1500);

    await page.locator('[data-testid="btn-continue"]').click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });

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
