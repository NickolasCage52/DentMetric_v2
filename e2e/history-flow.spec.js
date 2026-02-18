/**
 * E2E: History save -> auto navigate -> history contains item
 */
import { test, expect } from '@playwright/test';

async function selectFirstOptionInModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 5000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

async function ensureQuickStep2(page) {
  const step2 = page.getByTestId('quick-step2');
  try {
    await step2.waitFor({ state: 'visible', timeout: 2500 });
    return;
  } catch {
    // likely on client step (Step 1)
  }

  const nextBtn = page.getByTestId('btn-go-next').first();
  await nextBtn.waitFor({ state: 'visible', timeout: 5000 });

  if (!(await nextBtn.isEnabled())) {
    // Fill minimal required fields via InputModal (no inline typing)
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
}

async function fillQuickDentAndConditions(page) {
  await ensureQuickStep2(page);

  await page.getByTestId('quick-panel-element').click({ force: true });
  await selectFirstOptionInModal(page);

  await page.getByTestId('quick-size-pill-S6').click({ force: true });

  for (const tid of ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass']) {
    await page.getByTestId(tid).click({ force: true });
    await selectFirstOptionInModal(page);
  }
}

test.describe('History flow', () => {
  test('save to history -> navigate -> history contains item', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('btn-open-metric').click();
    await page.getByTestId('metric-standard').click();

    const nextBtn = page.getByTestId('btn-go-next');
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    if (await nextBtn.isEnabled()) await nextBtn.click({ force: true });

    await fillQuickDentAndConditions(page);
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click({ force: true });

    await expect(page.getByTestId('total-price')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('btn-save-estimate').click({ force: true });

    // saveCurrentEstimate auto-navigates to history section after 400ms
    const historyItems = page.locator('[data-testid^="history-item-"]');
    await expect(historyItems.first()).toBeVisible({ timeout: 8000 });
  });
});
