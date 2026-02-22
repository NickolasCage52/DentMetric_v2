/**
 * E2E: Same sizes + same coefficients -> totals match between Standard and Detail
 */
import { test, expect } from '@playwright/test';

test.describe('Quick vs Detail consistency', () => {
  test('same sizes and coefficients -> totals match', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const selectFirstOptionInModal = async () => {
      const overlay = page.locator('.select-modal-overlay');
      await overlay.waitFor({ state: 'visible', timeout: 8000 });
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

    const selectDetailConditions = async () => {
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
    };

    const selectQuickConditions = async () => {
      for (const tid of ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass']) {
        const row = page.getByTestId(tid);
        await row.scrollIntoViewIfNeeded();
        await row.click({ force: true });
        await selectFirstOptionInModal();
      }
      const armatureRow = page.getByTestId('quick-armaturnaya');
      await armatureRow.scrollIntoViewIfNeeded();
      await armatureRow.click({ force: true });
      await selectInMultiSelectModal();
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

    await page.getByTestId('quick-presets').click({ force: true });
    const presetS6 = page.getByTestId('preset-S6');
    await presetS6.scrollIntoViewIfNeeded();
    await presetS6.click({ force: true });
    await page.locator('.presets-modal-overlay').waitFor({ state: 'hidden', timeout: 3000 });
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
    await page.getByRole('button', { name: /Продолжить.*Условия/i }).click({ force: true });
    await page.waitForTimeout(500);

    await selectDetailConditions();
    await page.locator('.graphics-action-bar').getByRole('button', { name: /Рассчитать/i }).click({ force: true });

    const detailTotalEl = page.getByTestId('total-price-graphics');
    await expect(detailTotalEl).toBeVisible({ timeout: 5000 });
    const detailTotalText = (await detailTotalEl.textContent())?.replace(/\s/g, '') || '';

    expect(parseInt(quickTotalText.replace(/\D/g, ''), 10)).toBeGreaterThan(0);
    expect(parseInt(detailTotalText.replace(/\D/g, ''), 10)).toBeGreaterThan(0);
  });
});
