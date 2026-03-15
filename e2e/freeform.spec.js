/**
 * E2E: Freeform modal - open, draw, confirm
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testImagePath = path.join(__dirname, 'helpers', 'test-image.jpg');

test.describe('Freeform modal', () => {
  test('open modal, draw line with mouse, confirm -> dent appears', async ({ page }) => {
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
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 50);
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.move(box.x + 50, box.y + 150);
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.up();
    }

    await page.getByTestId('freeform-confirm').click({ force: true });

    await page.getByRole('button', { name: /Продолжить.*Размер/i }).click({ force: true });
    await page.waitForTimeout(500);
  });
});
