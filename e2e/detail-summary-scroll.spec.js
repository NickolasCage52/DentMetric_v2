/**
 * E2E: Detail summary step scroll keeps comment reachable on small viewport.
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testImagePath = path.join(__dirname, 'helpers', 'test-image.jpg');

test.use({ viewport: { width: 360, height: 840 } });

async function selectFirstOptionInModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 8000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

async function selectInMultiSelectModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 5000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await page.getByTestId('select-confirm').click();
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

test.describe('Detail summary scroll', () => {
  test('can scroll to comment and open modal', async ({ page }) => {
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
      test.skip(true, 'Photo step not shown — photo-based flow requires file');
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

    await page.getByTestId('add-type-circle').click({ force: true });
    await page.waitForTimeout(500);

    const continueToSizeBtn = page.getByRole('button', { name: /Продолжить.*Размер/i });
    await expect(continueToSizeBtn).toBeEnabled({ timeout: 10000 });
    await continueToSizeBtn.click({ force: true });
    await page.waitForTimeout(500);

    await page.getByTestId('quick-presets').click({ force: true });
    const presetS6 = page.getByTestId('preset-S6');
    await presetS6.scrollIntoViewIfNeeded();
    await presetS6.click({ force: true });
    await page.locator('.presets-modal-overlay').waitFor({ state: 'hidden', timeout: 3000 });
    await page.waitForTimeout(500);

    const singleSelect = ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass'];
    const multiSelect = ['quick-armaturnaya'];
    for (const tid of singleSelect) {
      const row = page.getByTestId(tid);
      await row.scrollIntoViewIfNeeded();
      await row.click({ force: true });
      await selectFirstOptionInModal(page);
    }
    for (const tid of multiSelect) {
      const row = page.getByTestId(tid);
      await row.scrollIntoViewIfNeeded();
      await row.click({ force: true });
      await selectInMultiSelectModal(page);
    }

    await page.getByRole('button', { name: /Рассчитать.*Итог/i }).click({ force: true });
    await expect(page.getByTestId('total-price-graphics')).toBeVisible({ timeout: 8000 });

    const scroll = page.locator('.quick-style-final .overflow-y-auto, .summary-scroll, [class*="overflow-y-auto"]').first();
    await scroll.waitFor({ state: 'visible', timeout: 5000 });
    await scroll.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }));

    const commentBtn = page.locator('.card-metallic').filter({ hasText: 'Комментарий' }).locator('button').first();
    await commentBtn.waitFor({ state: 'visible', timeout: 5000 });
    await commentBtn.scrollIntoViewIfNeeded();
    await commentBtn.click({ force: true });

    const dialog = page.getByRole('dialog', { name: /Комментарий/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});
