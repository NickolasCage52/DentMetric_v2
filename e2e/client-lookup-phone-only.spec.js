/**
 * Detail: экран клиента открывается (поиск по телефону — контракт в tests/detailClientPhoneSearch.contract.spec.js).
 */
import { test, expect } from './helpers/fixtures.js';

test.describe('Client lookup — Detail smoke', () => {
  test('Detail client screen отображается', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('btn-detail-mode').click({ force: true });
    await expect(page.locator('.dm-detail-screen').or(page.locator('.detail-client-screen'))).toBeVisible({
      timeout: 10000,
    });
  });
});
