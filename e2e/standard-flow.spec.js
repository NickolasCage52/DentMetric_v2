/**
 * E2E: Launch app -> Standard mode -> fill minimal fields -> see total
 */
import { test, expect } from '@playwright/test';

async function selectFirstOptionInModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 8000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  // Wait for enter transition to settle (mobile is stricter about "stable" targets)
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  // Single-select closes immediately on option tap
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

async function selectInMultiSelectModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 8000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await page.getByTestId('select-confirm').click();
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

async function fillQuickDentAndConditions(page) {
  await page.getByTestId('quick-step2').waitFor({ state: 'visible', timeout: 5000 });

  // Element
  await page.getByTestId('quick-panel-element').click({ force: true });
  await selectFirstOptionInModal(page);

  // Size (presets)
  await page.getByTestId('quick-presets').click({ force: true });
  const presetS6 = page.getByTestId('preset-S6');
  await presetS6.scrollIntoViewIfNeeded();
  await presetS6.click({ force: true });
  await page.locator('.presets-modal-overlay').waitFor({ state: 'hidden', timeout: 3000 });

  // Conditions (pick first option in each modal; actual pricing math is tested elsewhere)
  for (const tid of ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass']) {
    const row = page.getByTestId(tid);
    await row.scrollIntoViewIfNeeded();
    await row.click({ force: true });
    await selectFirstOptionInModal(page);
  }
  const armatureRow = page.getByTestId('quick-armaturnaya');
  await armatureRow.scrollIntoViewIfNeeded();
  await armatureRow.click({ force: true });
  await selectInMultiSelectModal(page);
}

test.describe('Standard flow', () => {
  test('Launch -> switch to Standard -> fill minimal -> see total', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('btn-open-metric').click();
    await page.getByTestId('metric-standard').click();

    await expect(page.getByTestId('step-dots')).toBeVisible();

    const nextBtn = page.getByTestId('btn-go-next');
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click({ force: true });
    }

    await fillQuickDentAndConditions(page);
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
    await nextBtn.click({ force: true });

    const totalEl = page.getByTestId('total-price');
    await expect(totalEl).toBeVisible({ timeout: 5000 });
    const totalText = await totalEl.textContent();
    expect(totalText).toMatch(/\d[\d\s]*/);
  });
});
