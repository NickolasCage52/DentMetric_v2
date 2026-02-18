/**
 * E2E: Detail summary step scroll keeps comment reachable on small viewport.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

test.describe('Detail summary scroll', () => {
  test('can scroll to comment and open modal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const selectFirstOptionInModal = async () => {
      const overlay = page.locator('.select-modal-overlay');
      await overlay.waitFor({ state: 'visible', timeout: 5000 });
      const opt = page.getByTestId('select-option-0');
      await opt.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(250);
      await opt.scrollIntoViewIfNeeded();
      await opt.click();
      await overlay.waitFor({ state: 'hidden', timeout: 5000 });
    };

    await page.getByTestId('btn-open-metric').click({ force: true });
    await page.getByTestId('metric-graphics').click({ force: true });
    await page.getByRole('button', { name: /Продолжить.*Размещение/i }).click({ force: true });
    await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });

    await page.getByTestId('add-type-circle').click({ force: true });
    await page.getByTestId('size-option-S6').click({ force: true });

    const continueToSizeBtn = page.getByRole('button', { name: /Продолжить.*Размер/i });
    await expect(continueToSizeBtn).toBeEnabled({ timeout: 10000 });
    await continueToSizeBtn.click({ force: true });
    await page.getByRole('button', { name: /Продолжить.*Условия/i }).click({ force: true });

    for (const tid of ['detail-param-repair', 'detail-param-risk', 'detail-param-material', 'detail-param-carclass', 'detail-armaturnaya']) {
      const row = page.getByTestId(tid);
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await selectFirstOptionInModal();
    }

    await page.getByRole('button', { name: /Рассчитать/i }).click({ force: true });
    await expect(page.getByTestId('total-price-graphics')).toBeVisible({ timeout: 8000 });

    const scroll = page.locator('.summary-scroll');
    await scroll.waitFor({ state: 'visible', timeout: 5000 });
    await scroll.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }));

    // Comment row is inside scroll and should be reachable
    const commentBtn = page.getByRole('button', { name: /Комментарий/i }).first();
    await commentBtn.scrollIntoViewIfNeeded();
    await commentBtn.click({ force: true });

    const dialog = page.getByRole('dialog', { name: /Комментарий/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

