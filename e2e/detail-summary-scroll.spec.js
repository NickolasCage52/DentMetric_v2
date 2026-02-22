/**
 * E2E: Detail summary step scroll keeps comment reachable on small viewport.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 360, height: 840 } });

test.describe('Detail summary scroll', () => {
  test('can scroll to comment and open modal', async ({ page }) => {
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
      await row.click({ force: true });
      await selectFirstOptionInModal();
    }
    for (const tid of multiSelect) {
      const row = page.getByTestId(tid);
      await row.scrollIntoViewIfNeeded();
      await row.click({ force: true });
      await selectInMultiSelectModal();
    }

    await page.locator('.graphics-action-bar').getByRole('button', { name: /Рассчитать/i }).click({ force: true });
    await expect(page.getByTestId('total-price-graphics')).toBeVisible({ timeout: 8000 });

    // Scroll container: .summary-scroll (Step4SummaryPanel) or .qc-step3 (QuickStyleFinalSection)
    const scroll = page.locator('.summary-scroll, .quick-style-final .overflow-y-auto').first();
    await scroll.waitFor({ state: 'visible', timeout: 5000 });
    await scroll.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }));

    // Comment: card with "Комментарий" label contains the button (works for QuickStyleFinalSection and Step4SummaryPanel)
    const commentBtn = page.locator('.card-metallic:has-text("Комментарий"), .summary-comment-card').getByRole('button').first();
    await commentBtn.scrollIntoViewIfNeeded();
    await commentBtn.click({ force: true });

    const dialog = page.getByRole('dialog', { name: /Комментарий/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

