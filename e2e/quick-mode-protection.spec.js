/**
 * Quick mode: дымовой тест — поток открывается, шаг 1 доступен (регрессия защиты Quick).
 */
import { test, expect } from './helpers/fixtures.js';

test.describe('Quick mode protection (smoke)', () => {
  test('открытие быстрого расчёта и видимость шага клиента', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('btn-quick-mode').click({ force: true });
    await expect(page.getByTestId('btn-next-step').first()).toBeVisible({ timeout: 10000 });
  });
});
