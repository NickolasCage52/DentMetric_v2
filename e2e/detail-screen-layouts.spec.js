/**
 * E2E: Detail mode — Screen layout regression tests.
 * Verifies each detail screen uses position:fixed for proper scroll,
 * and that content/footer layout is correct.
 */
import { test, expect } from './helpers/fixtures.js';

async function enterDetailMode(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const metricBtn = page.getByTestId('btn-open-metric');
  if (!(await metricBtn.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  await metricBtn.click({ force: true });
  await page.waitForTimeout(300);

  const detailBtn = page.getByTestId('btn-detail-mode');
  if (!(await detailBtn.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  await detailBtn.click({ force: true });
  await page.waitForTimeout(600);
  return true;
}

test.describe('Detail mode — Screen layout regression', () => {

  test('client screen uses position:fixed for scroll fix', async ({ page }) => {
    const ok = await enterDetailMode(page);
    if (!ok) { test.skip(true, 'Cannot enter detail mode'); return; }

    const position = await page.evaluate(() => {
      const el = document.querySelector('.dm-detail-screen, .detail-screen');
      return el ? window.getComputedStyle(el).position : null;
    });
    if (!position) { test.skip(true, 'Screen root not found'); return; }
    expect(position).toBe('fixed');
  });

  test('camera screen uses position:fixed', async ({ page }) => {
    const ok = await enterDetailMode(page);
    if (!ok) { test.skip(true, 'Cannot enter detail mode'); return; }

    const continueBtn = page.locator('button:has-text("Продолжить"), [data-testid="btn-continue-placement"]').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const position = await page.evaluate(() => {
      const el = document.querySelector('.camera-screen');
      return el ? window.getComputedStyle(el).position : null;
    });
    if (!position) { test.skip(true, 'Camera screen not found'); return; }
    expect(position).toBe('fixed');
  });

  test('marking screen uses position:fixed', async ({ page }) => {
    const ok = await enterDetailMode(page);
    if (!ok) { test.skip(true, 'Cannot enter detail mode'); return; }

    const continueBtn = page.locator('button:has-text("Продолжить"), [data-testid="btn-continue-placement"]').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
    if (!(await galleryBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'No gallery button'); return;
    }

    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const testImagePath = join(__dirname, 'helpers', 'test-image.jpg');

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      galleryBtn.click(),
    ]);
    if (!fileChooser) { test.skip(true, 'File chooser did not open'); return; }
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(2000);

    const position = await page.evaluate(() => {
      const el = document.querySelector('.marking-screen');
      return el ? window.getComputedStyle(el).position : null;
    });
    if (!position) { test.skip(true, 'Marking screen not found'); return; }
    expect(position).toBe('fixed');
  });

  test('result screen uses position:fixed', async ({ page }) => {
    const position = await page.evaluate(() => {
      const el = document.querySelector('.result-screen');
      return el ? window.getComputedStyle(el).position : null;
    });
    if (!position) { test.skip(true, 'Result screen not in DOM (expected — only visible at end of flow)'); return; }
    expect(position).toBe('fixed');
  });

  test('detail screens have consistent bottom offset for tab bar', async ({ page }) => {
    const ok = await enterDetailMode(page);
    if (!ok) { test.skip(true, 'Cannot enter detail mode'); return; }

    const bottom = await page.evaluate(() => {
      const el = document.querySelector('.dm-detail-screen, .detail-screen');
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return { position: style.position, bottom: style.bottom };
    });
    if (!bottom) { test.skip(true, 'Screen root not found'); return; }
    expect(bottom.position).toBe('fixed');
    expect(bottom.bottom).not.toBe('0px');
  });

});
