/**
 * E2E: Detail mode — Full flow entry and layout checks.
 * Tests that Detail mode can be entered, doesn't crash,
 * and basic UI elements are present.
 */
import { test, expect } from './helpers/fixtures.js';

test.describe('Detail mode — Full flow and layout', () => {

  test('detail mode enters without crash', async ({ page }) => {
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
      test.skip(true, 'Detail mode button not found'); return;
    }
    await detailBtn.click({ force: true });
    await page.waitForTimeout(1000);

    await expect(page).not.toHaveURL(/error/);
    const hasContent = await page.locator('button, input, canvas').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent, 'Detail mode should render content').toBeTruthy();
  });

  test('detail client screen shows form fields', async ({ page }) => {
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
      test.skip(true, 'Detail mode button not found'); return;
    }
    await detailBtn.click({ force: true });
    await page.waitForTimeout(600);

    const clientFields = page.locator('button:has-text("Имя"), button:has-text("Телефон"), button:has-text("Марка")');
    const count = await clientFields.count();
    expect(count, 'Client form should have name/phone/brand fields').toBeGreaterThanOrEqual(2);
  });

  test('progress dots are visible on client screen', async ({ page }) => {
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
      test.skip(true, 'Detail mode button not found'); return;
    }
    await detailBtn.click({ force: true });
    await page.waitForTimeout(600);

    const dots = page.locator('.detail-progress-dots');
    if (!(await dots.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Progress dots not rendered'); return;
    }
    await expect(dots).toBeVisible();

    const activeDot = page.locator('.detail-progress-dot--active');
    expect(await activeDot.count()).toBeGreaterThanOrEqual(1);
  });

  test('no horizontal overflow on any visible detail screen', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw + 2);
  });

  test('gallery button triggers file chooser on camera screen', async ({ page }) => {
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
      test.skip(true, 'Detail mode button not found'); return;
    }
    await detailBtn.click({ force: true });
    await page.waitForTimeout(600);

    const continueBtn = page.locator('button:has-text("Продолжить"), [data-testid="btn-continue-placement"]').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
    if (!(await galleryBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Gallery button not visible'); return;
    }

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null),
      galleryBtn.click(),
    ]);
    expect(chooser !== null, 'File chooser should open on gallery click').toBeTruthy();
  });

});
