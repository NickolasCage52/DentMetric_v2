/**
 * E2E: Launch -> Detail mode -> add oval dent -> set sizes -> choose coefficients -> see total
 */
import { test, expect } from '@playwright/test';

test.describe('Detail flow', () => {
  test('Launch -> go Detail -> add oval dent -> set sizes -> choose coefficients -> see total', async ({ page }) => {
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
    const selectInMultiSelectModal = async () => {
      const overlay = page.locator('.select-modal-overlay');
      await overlay.waitFor({ state: 'visible', timeout: 5000 });
      const opt = page.getByTestId('select-option-0');
      await opt.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(250);
      await opt.scrollIntoViewIfNeeded();
      await opt.click();
      await page.getByTestId('select-confirm').click();
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
    await page.waitForTimeout(500);

    const singleSelect = ['detail-param-repair', 'detail-param-risk', 'detail-param-material', 'detail-param-carclass'];
    const multiSelect = ['detail-armaturnaya'];
    for (const tid of singleSelect) {
      const row = page.getByTestId(tid);
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await selectFirstOptionInModal();
    }
    for (const tid of multiSelect) {
      const row = page.getByTestId(tid);
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await selectInMultiSelectModal();
    }

    await page.locator('.graphics-action-bar').getByRole('button', { name: /Рассчитать/i }).click({ force: true });

    const totalEl = page.getByTestId('total-price-graphics');
    await expect(totalEl).toBeVisible({ timeout: 5000 });
    const totalText = await totalEl.textContent();
    expect(totalText).toMatch(/\d[\d\s]*/);
  });
});
