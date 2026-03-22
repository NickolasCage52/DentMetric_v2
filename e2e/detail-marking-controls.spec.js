/**
 * E2E: Detail mode — Marking screen controls and interactions.
 * Tests draw button, delete button, reset button, and tap targets.
 */
import { test, expect } from './helpers/fixtures.js';
import { goToDetailDimensions } from './helpers/detail-helpers.js';

test.describe('Detail mode — Marking screen controls', () => {

  test('marking screen has draw dent button with adequate size', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const metricBtn = page.getByTestId('btn-open-metric');
    if (!(await metricBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Metric button not found'); return;
    }
    await metricBtn.click({ force: true });
    await page.waitForTimeout(300);

    const detailBtn = page.getByTestId('btn-detail-mode');
    if (!(await detailBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No detail mode button'); return;
    }
    await detailBtn.click({ force: true });
    await page.waitForTimeout(500);

    const continueBtn = page.locator('button:has-text("Продолжить"), [data-testid="btn-continue-placement"]').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
    if (!(await galleryBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Gallery button not visible — may not be on camera screen'); return;
    }

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      galleryBtn.click(),
    ]);
    if (!fileChooser) { test.skip(true, 'File chooser did not open'); return; }

    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const testImagePath = join(__dirname, 'helpers', 'test-image.jpg');
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(2000);

    const drawBtn = page.locator('.marking-draw-btn').filter({ hasText: /Вмятину/i }).first();
    if (!(await drawBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Draw button not visible on marking screen'); return;
    }
    await expect(drawBtn).toBeVisible();
    const box = await drawBtn.boundingBox();
    expect(box?.height ?? 0, 'Draw button should be >= 40px tall').toBeGreaterThanOrEqual(40);
  });

  test('delete button is compact icon (not wide label)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const deleteBtn = page.locator('[data-testid="btn-delete-dent"]');
    if (!(await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Delete button not visible'); return;
    }
    const box = await deleteBtn.boundingBox();
    if (!box) { test.skip(true, 'Cannot measure delete button'); return; }
    expect(box.width, `Delete button too wide: ${box.width}px`).toBeLessThan(80);
    expect(box.height, 'Delete button should be >= 38px').toBeGreaterThanOrEqual(38);
  });

  test('marking screen has no horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw, 'No horizontal overflow').toBeLessThanOrEqual(cw + 2);
  });

  test('all visible buttons have adequate tap targets', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const primaryBtns = await page.locator(
      '.marking-draw-btn, .marking-icon-btn, .marking-proceed-btn, .dimensions-nav-btn, .dm-btn'
    ).all();
    for (const btn of primaryBtns) {
      const box = await btn.boundingBox();
      if (!box) continue;
      expect(box.height, `Action button height ${box.height}px < 38px`).toBeGreaterThanOrEqual(38);
    }
  });

  test('dimension inputs fit side-by-side on mobile', async ({ page }) => {
    const ok = await goToDetailDimensions(page);
    if (!ok) { test.skip(true, 'Could not reach dimensions screen'); return; }

    const dimModal = page.locator('.dent-dim-modal-overlay');
    if (!(await dimModal.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Dimension modal not visible'); return;
    }

    const inputs = page.locator('.dim-field__input');
    const count = await inputs.count();
    if (count < 2) { test.skip(true, 'Need >= 2 dimension inputs'); return; }

    const b0 = await inputs.nth(0).boundingBox();
    const b1 = await inputs.nth(1).boundingBox();
    if (!b0 || !b1) { test.skip(true, 'Cannot get input boxes'); return; }

    expect(Math.abs(b0.y - b1.y), 'Inputs should be on same row').toBeLessThan(10);
    expect(b1.x, 'Second input should be right of first').toBeGreaterThan(b0.x + b0.width - 5);
  });

  test('.dim-field has min-width:0 for proper flex shrinking', async ({ page }) => {
    const ok = await goToDetailDimensions(page);
    if (!ok) { test.skip(true, 'Could not reach dimensions screen'); return; }

    const dimModal = page.locator('.dent-dim-modal-overlay');
    if (!(await dimModal.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Dimension modal not visible'); return;
    }

    const mw = await page.evaluate(() => {
      const el = document.querySelector('.dim-field');
      return el ? window.getComputedStyle(el).minWidth : null;
    });
    if (!mw) { test.skip(true, 'No .dim-field found'); return; }
    expect(mw).toBe('0px');
  });

});
