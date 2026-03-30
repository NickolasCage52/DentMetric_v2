/**
 * История: горизонтальный свайп по .hs-root меняет период (useSwipeNavigation).
 */
import { test, expect } from './helpers/fixtures.js';

test.describe('History — period swipe', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name === 'chromium',
      'Touch swipe проверяется на мобильных проектах'
    );
  });

  test('swipe left переключает с «Сегодня» на «Вчера»', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('btn-history').click({ force: true });
    await page.locator('.hs-root').waitFor({ state: 'visible', timeout: 10000 });

    await page.locator('.hs-range-tab').filter({ hasText: 'Сегодня' }).click({ force: true });
    await page.waitForTimeout(200);

    const ok = await page.evaluate(() => {
      const el = document.querySelector('.hs-root');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const x0 = r.left + r.width * 0.78;
      const x1 = r.left + r.width * 0.18;
      const yy = r.top + 48;
      const mk = (x) =>
        new Touch({
          identifier: 0,
          target: el,
          clientX: x,
          clientY: yy,
          pageX: x,
          pageY: yy,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: 0.5,
        });
      const t0 = mk(x0);
      const t1 = mk(x1);
      el.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [t0],
          targetTouches: [t0],
          changedTouches: [t0],
        })
      );
      el.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: [t1],
        })
      );
      return true;
    });

    if (!ok) {
      test.skip(true, '.hs-root не найден');
      return;
    }

    await page.waitForTimeout(250);
    await expect(page.locator('.hs-range-tab--active').filter({ hasText: 'Вчера' })).toBeVisible({
      timeout: 3000,
    });
  });
});
