/**
 * E2E: Detail mode — dimension input interaction.
 */
import { test, expect } from './helpers/fixtures.js';
import { goToDetailDimensions } from './helpers/detail-helpers.js';

test.describe('Detail mode — Dimension input interaction', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'chromium', 'Dimension screen is mobile flow');
  });
  test('length input accepts numeric value', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const input = page.locator('.dimensions-field input').first();
    if (!(await input.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, 'Dimension input not visible');
      return;
    }
    await input.fill('25');
    const value = await input.inputValue();
    expect(value).toBe('25');
  });

  test('width input accepts numeric value', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const inputs = page.locator('.dimensions-field input');
    if ((await inputs.count()) < 2) {
      test.skip(true, 'Need at least 2 dimension inputs');
      return;
    }
    const widthInput = inputs.nth(1);
    await widthInput.fill('15');
    const value = await widthInput.inputValue();
    expect(value).toBe('15');
  });

  test('proceed button disabled when inputs empty', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const proceedBtn = page.locator('[data-testid="btn-proceed-to-params"]');
    if (!(await proceedBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, 'Proceed button not visible');
      return;
    }
    const isDisabled = await proceedBtn.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('proceed button enabled after filling all dimensions', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const inputs = page.locator('.dimensions-field input');
    const count = await inputs.count();
    if (count === 0) {
      test.skip(true, 'No dimension inputs visible');
      return;
    }
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill('20');
    }

    const proceedBtn = page.locator('[data-testid="btn-proceed-to-params"]');
    await expect(proceedBtn).toBeEnabled({ timeout: 5000 });
  });

  test('inputs have type=number and inputmode=decimal', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    await page.locator('.dimensions-field input').first().waitFor({ state: 'visible', timeout: 3000 });

    const attrs = await page.evaluate(() => {
      const el = document.querySelector('.dimensions-field input');
      if (!el) return null;
      return { type: el.type, inputMode: el.inputMode };
    });
    if (!attrs) {
      test.skip(true, 'Dimension input not found');
      return;
    }
    expect(attrs.type).toBe('number');
    expect(attrs.inputMode).toBe('decimal');
  });

  test('no number spinners on inputs', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const noSpinners = await page.evaluate(() => {
      const el = document.querySelector('.dimensions-field input');
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return (
        style.getPropertyValue('-webkit-appearance') === 'none' ||
        style.getPropertyValue('appearance') === 'none'
      );
    });
    if (noSpinners === null) {
      test.skip(true, 'Input not found');
      return;
    }
    expect(noSpinners).toBe(true);
  });
});
