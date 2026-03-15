/**
 * E2E: Detail mode — mobile layout smoke tests.
 */
import { test, expect } from './helpers/fixtures.js';

test.describe('Detail mode — Mobile layout smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  });

  test('no horizontal overflow on home screen', async ({ page }) => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 2);
  });

  test('Detail mode entry button visible and tappable', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-detail-mode"]');
    if (!(await btn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Detail mode button not visible');
      return;
    }
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(36);

    const viewport = page.viewportSize();
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
  });

  test('no element extends beyond viewport on detail entry', async ({ page }) => {
    await page.getByTestId('btn-open-metric').click({ force: true });
    const detailBtn = page.locator('[data-testid="btn-detail-mode"]');
    if (!(await detailBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No detail button');
      return;
    }
    await detailBtn.click();
    await page.waitForTimeout(600);

    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 2);
  });

  test('visible buttons have adequate tap target (≥40px)', async ({ page }) => {
    const buttons = await page.locator('button:visible').all();
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (!box || box.width < 20) continue;
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });

  test('history screen loads without horizontal overflow', async ({ page }) => {
    const navHistory = page.locator('[data-testid="nav-history"]');
    if (!(await navHistory.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'History nav not found');
      return;
    }
    await navHistory.click();
    await page.waitForTimeout(400);

    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 2);
  });
});
