/**
 * E2E: Launch app -> Standard mode -> fill minimal fields -> see total
 */
import { test, expect } from '@playwright/test';

async function selectFirstOptionInModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 5000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  // Wait for enter transition to settle (mobile is stricter about "stable" targets)
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  // Single-select closes immediately on option tap
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

async function fillQuickDentAndConditions(page) {
  await page.getByTestId('quick-step2').waitFor({ state: 'visible', timeout: 5000 });

  // Element
  await page.getByTestId('quick-panel-element').click({ force: true });
  await selectFirstOptionInModal(page);

  // Size (standard pill)
  await page.getByTestId('quick-size-pill-S6').click({ force: true });

  // Conditions (pick first option in each modal; actual pricing math is tested elsewhere)
  for (const tid of ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass']) {
    await page.getByTestId(tid).click({ force: true });
    await selectFirstOptionInModal(page);
  }
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
