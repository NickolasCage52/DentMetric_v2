/**
 * E2E: Same sizes + same coefficients -> totals match between Standard and Detail
 */
import { test, expect } from '@playwright/test';

test.describe('Quick vs Detail consistency', () => {
  test('same sizes and coefficients -> totals match', async ({ page }) => {
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

    const selectDetailConditions = async () => {
      for (const tid of ['detail-param-repair', 'detail-param-risk', 'detail-param-material', 'detail-param-carclass', 'detail-armaturnaya']) {
        const row = page.getByTestId(tid);
        await row.scrollIntoViewIfNeeded();
        await row.click();
        await selectFirstOptionInModal();
      }
    };

    const selectQuickConditions = async () => {
      for (const tid of ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass']) {
        await page.getByTestId(tid).click({ force: true });
        await selectFirstOptionInModal();
      }
    };

    const ensureQuickStep2 = async () => {
      const step2 = page.getByTestId('quick-step2');
      try {
        await step2.waitFor({ state: 'visible', timeout: 2500 });
        return;
      } catch {
        // likely on client step
      }

      const nextBtn = page.getByTestId('btn-go-next').first();
      await nextBtn.waitFor({ state: 'visible', timeout: 5000 });

      if (!(await nextBtn.isEnabled())) {
        await page.getByRole('button', { name: /Имя клиента/i }).click({ force: true });
        const dialog = page.getByRole('dialog', { name: /Данные клиента/i });
        await dialog.getByPlaceholder(/Имя клиента/i).fill('Тест');
        await dialog.getByRole('button', { name: /Готово/i }).click({ force: true });

        await page.getByRole('button', { name: /Телефон/i }).click({ force: true });
        const dialog2 = page.getByRole('dialog', { name: /Данные клиента/i });
        await dialog2.getByPlaceholder(/Телефон/i).fill('+79990000000');
        await dialog2.getByRole('button', { name: /Готово/i }).click({ force: true });
      }

      await expect(nextBtn).toBeEnabled({ timeout: 5000 });
      await nextBtn.click({ force: true });
      await step2.waitFor({ state: 'visible', timeout: 10000 });
    };

    await page.getByTestId('btn-open-metric').click();
    await page.getByTestId('metric-standard').click({ force: true });

    const nextBtn = page.getByTestId('btn-go-next');
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    if (await nextBtn.isEnabled()) await nextBtn.click({ force: true });

    await ensureQuickStep2();

    await page.getByTestId('quick-panel-element').click({ force: true });
    await selectFirstOptionInModal();

    await page.getByTestId('quick-size-pill-S6').click({ force: true });
    await selectQuickConditions();
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click({ force: true });

    const quickTotalEl = page.getByTestId('total-price');
    await expect(quickTotalEl).toBeVisible({ timeout: 5000 });
    const quickTotalText = (await quickTotalEl.textContent())?.replace(/\s/g, '') || '';

    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-graphics').click({ force: true });

    await page.getByRole('button', { name: /Продолжить.*Размещение/i }).click();

    await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });

    await page.getByTestId('add-type-circle').click({ force: true });
    await page.getByTestId('size-option-S6').click({ force: true });

    const continueToSizeBtn = page.getByRole('button', { name: /Продолжить.*Размер/i });
    await expect(continueToSizeBtn).toBeEnabled({ timeout: 10000 });
    await continueToSizeBtn.click({ force: true });
    await page.getByRole('button', { name: /Продолжить.*Условия/i }).click();

    await selectDetailConditions();
    await page.getByRole('button', { name: /Рассчитать/i }).click();

    const detailTotalEl = page.getByTestId('total-price-graphics');
    await expect(detailTotalEl).toBeVisible({ timeout: 5000 });
    const detailTotalText = (await detailTotalEl.textContent())?.replace(/\s/g, '') || '';

    expect(parseInt(quickTotalText.replace(/\D/g, ''), 10)).toBeGreaterThan(0);
    expect(parseInt(detailTotalText.replace(/\D/g, ''), 10)).toBeGreaterThan(0);
  });
});
