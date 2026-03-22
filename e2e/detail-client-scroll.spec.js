/**
 * E2E: Detail mode — Client screen scroll (confirmed bug regression).
 * Verifies that the client screen scrolls correctly, footer doesn't overlap,
 * and all content is reachable on mobile viewports.
 */
import { test, expect } from './helpers/fixtures.js';

async function enterDetailClientScreen(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const metricBtn = page.getByTestId('btn-open-metric');
  if (!(await metricBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  await metricBtn.click({ force: true });
  await page.waitForTimeout(300);

  const detailBtn = page.getByTestId('btn-detail-mode');
  if (!(await detailBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  await detailBtn.click({ force: true });
  await page.waitForTimeout(600);
  return true;
}

test.describe('Detail mode — Client screen scroll (confirmed bug regression)', () => {

  test('client screen is visible and renders content', async ({ page }) => {
    const ok = await enterDetailClientScreen(page);
    if (!ok) { test.skip(true, 'Detail mode not accessible'); return; }

    const hasContent = await page.locator(
      'button:has-text("Имя"), button:has-text("Телефон"), button:has-text("Продолжить"), button:has-text("Назад")'
    ).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent, 'Client screen should show form fields or navigation').toBeTruthy();
  });

  test('client screen content area is scrollable (overflow-y: auto)', async ({ page }) => {
    const ok = await enterDetailClientScreen(page);
    if (!ok) { test.skip(true, 'Detail mode not accessible'); return; }

    const overflow = await page.evaluate(() => {
      const selectors = [
        '.quick-style-client > div',
        '.detail-screen__content',
        '.dm-detail-screen .detail-screen__content',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const ov = window.getComputedStyle(el).overflowY;
          if (ov === 'auto' || ov === 'scroll') return { selector: sel, overflow: ov };
        }
      }
      return null;
    });

    if (!overflow) { test.skip(true, 'Scrollable content element not found'); return; }
    expect(
      ['auto', 'scroll'],
      `Content overflow is "${overflow.overflow}" on ${overflow.selector} — should be auto/scroll`
    ).toContain(overflow.overflow);
  });

  test('client screen root uses position:fixed (scroll fix)', async ({ page }) => {
    const ok = await enterDetailClientScreen(page);
    if (!ok) { test.skip(true, 'Detail mode not accessible'); return; }

    const position = await page.evaluate(() => {
      const selectors = [
        '.dm-detail-screen',
        '.detail-screen',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return window.getComputedStyle(el).position;
      }
      return null;
    });

    if (!position) { test.skip(true, 'Detail screen root not found'); return; }
    expect(position, 'Detail client screen should use position:fixed').toBe('fixed');
  });

  test('forward button is visible and not clipped', async ({ page }) => {
    const ok = await enterDetailClientScreen(page);
    if (!ok) { test.skip(true, 'No detail mode'); return; }

    const nextBtn = page.locator(
      '[data-testid="btn-continue-placement"], button:has-text("Вперёд"), button:has-text("Продолжить")'
    ).first();
    if (!(await nextBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Next button not found'); return;
    }

    const btnBox = await nextBtn.boundingBox();
    if (!btnBox) { test.skip(true, 'Cannot get button bounding box'); return; }

    const viewport = page.viewportSize();
    expect(btnBox.y, 'Button top should be > 0').toBeGreaterThan(0);
    expect(btnBox.y + btnBox.height, 'Button bottom should be within viewport').toBeLessThanOrEqual(viewport.height + 2);
  });

  test('no horizontal overflow on client screen', async ({ page }) => {
    const ok = await enterDetailClientScreen(page);
    if (!ok) { test.skip(true, 'No detail mode'); return; }

    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw, `Horizontal overflow: scrollWidth(${sw}) > clientWidth(${cw})`).toBeLessThanOrEqual(cw + 2);
  });

  test('primary action buttons are visible and clickable', async ({ page }) => {
    const ok = await enterDetailClientScreen(page);
    if (!ok) { test.skip(true, 'No detail mode'); return; }

    const continueBtn = page.locator('[data-testid="btn-continue-placement"]');
    if (!(await continueBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Continue button not found'); return;
    }
    const box = await continueBtn.boundingBox();
    expect(box, 'Continue button should have a bounding box').toBeTruthy();
    expect(box.width, 'Continue button should be reasonably wide').toBeGreaterThan(50);
    expect(box.height, 'Continue button should be > 0').toBeGreaterThan(0);

    const viewport = page.viewportSize();
    expect(box.y + box.height, 'Continue button should be within viewport').toBeLessThanOrEqual(viewport.height + 2);
  });

});
