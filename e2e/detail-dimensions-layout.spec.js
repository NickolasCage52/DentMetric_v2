/**
 * E2E: модальное окно размеров (DentDimensionsModal) — поля в ряд, без overflow на мобиле.
 */
import { test, expect } from './helpers/fixtures.js';
import { goToDetailDimensions } from './helpers/detail-helpers.js';

test.describe('Detail mode — Dimension modal layout (mobile)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'chromium', 'Layout проверяется на мобильных вьюпортах');
  });

  async function expectModalVisible(page) {
    const modal = page.locator('.dent-dim-modal-box');
    await expect(modal).toBeVisible({ timeout: 8000 });
    return modal;
  }

  test('поля длина/ширина помещаются во viewport', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions step');
      return;
    }
    const modal = await expectModalVisible(page);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const screenWidth = viewport.width;

    const row = modal.locator('.dim-fields-row').first();
    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(-2);
    expect(box.x + box.width).toBeLessThanOrEqual(screenWidth + 2);

    const inputs = modal.locator('.dim-field__input');
    const n = await inputs.count();
    expect(n).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < Math.min(n, 2); i++) {
      const ib = await inputs.nth(i).boundingBox();
      if (!ib) continue;
      expect(ib.x + ib.width).toBeLessThanOrEqual(screenWidth + 2);
      expect(ib.width).toBeGreaterThan(60);
      expect(ib.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('подписи Длина / Ширина видны целиком', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions step');
      return;
    }
    const modal = await expectModalVisible(page);
    const labels = modal.locator('.dim-field__label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(2);

    const screenWidth = page.viewportSize()?.width ?? 390;
    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const box = await label.boundingBox();
      if (!box) continue;
      expect(box.x + box.width).toBeLessThanOrEqual(screenWidth + 2);
      expect(box.x).toBeGreaterThanOrEqual(-2);
    }
  });

  test('нет горизонтального overflow на документе', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions step');
      return;
    }
    await expectModalVisible(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('.dim-field имеет min-width: 0 (flex-shrink)', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions step');
      return;
    }
    const modal = await expectModalVisible(page);
    const minWidth = await modal.locator('.dim-field').first().evaluate((el) => {
      return window.getComputedStyle(el).minWidth;
    });
    expect(minWidth).toBe('0px');
  });

  test('.dim-fields-row ограничивает overflow по горизонтали', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions step');
      return;
    }
    const modal = await expectModalVisible(page);
    const overflow = await modal.locator('.dim-fields-row').first().evaluate((el) => {
      return window.getComputedStyle(el).overflowX;
    });
    expect(['hidden', 'clip', 'scroll', 'auto']).toContain(overflow);
  });
});
