/**
 * Карточка записи в истории: 4 вкладки ResultFourTabs.
 */
import { test, expect } from './helpers/fixtures.js';

const HISTORY_KEY = 'dentmetric_history_v1';

test.describe('Record detail — four tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      const payload = {
        version: 1,
        items: [
          {
            id: 'e2e_record_four_tabs',
            schemaVersion: 2,
            createdAt: new Date().toISOString(),
            total: 1500,
            rawTotal: 1500,
            dmCalculatedPrice: 1500,
            status: 'estimate',
            mode: 'quick',
            element: 'E2E',
            client: { name: 'E2E Tabs', phone: '+79990001122' },
            dents: [],
            attachments: [],
            comment: '',
            breakdown: [],
            lineItemsSnapshot: [],
            additionalWorks: [],
            discountPercent: 0,
          },
        ],
      };
      localStorage.setItem(key, JSON.stringify(payload));
    }, HISTORY_KEY);
  });

  test('видны вкладки Расчёт / Клиент / Файлы / Демонстрация после выбора записи', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('btn-history').click({ force: true });
    await page.getByTestId('history-list').waitFor({ state: 'visible', timeout: 10000 });

    const card = page.getByTestId('history-item-e2e_record_four_tabs');
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.click({ force: true });

    await expect(page.getByTestId('record-tab-calculation')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('record-tab-client')).toBeVisible();
    await expect(page.getByTestId('record-tab-files')).toBeVisible();
    await expect(page.getByTestId('record-tab-demo')).toBeVisible();
  });
});
