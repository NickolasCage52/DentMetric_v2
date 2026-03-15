/**
 * Helpers for Detail mode E2E — photo-based flow.
 */
import * as path from 'path';
import { expect } from '@playwright/test';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testImagePath = path.join(__dirname, 'test-image.jpg');

/**
 * Navigate to Detail mode placement step (with add-type-circle visible).
 * Requires: photo flow — selects test image via file chooser.
 */
export async function goToDetailPlacement(page) {
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
  if (await galleryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      galleryBtn.click(),
    ]);
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(1500);
    const continueBtn = page.locator('[data-testid="btn-continue"]');
    await continueBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });
}

/**
 * Open a Settings section by header text.
 */
export async function openSettingsSection(page, sectionTitle) {
  const header = page.locator('.dm-section-header').filter({ hasText: sectionTitle });
  await header.click();
  await page.waitForTimeout(300);
}
