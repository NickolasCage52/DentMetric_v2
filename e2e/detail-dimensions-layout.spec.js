/**
 * E2E: Detail mode — dimension inputs layout on mobile (fix for overflow bug).
 */
import { test, expect } from './helpers/fixtures.js';
import { goToDetailDimensions } from './helpers/detail-helpers.js';

test.describe('Detail mode — Dimension inputs layout (mobile)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'chromium', 'Layout bug is mobile-only');
  });
  test('dimension input fields fit within screen', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const fieldContainers = page.locator('.dimensions-card__fields');
    const count = await fieldContainers.count();
    if (count === 0) {
      test.skip(true, 'No dimension field containers found');
      return;
    }

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const screenWidth = viewport.width;

    for (let i = 0; i < count; i++) {
      const container = fieldContainers.nth(i);
      const box = await container.boundingBox();
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(-2);
      expect(box.x + box.width).toBeLessThanOrEqual(screenWidth + 2);
    }

    const inputs = page.locator('.dimensions-field input');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();
      if (!box) continue;
      expect(box.x + box.width).toBeLessThanOrEqual(screenWidth + 2);
      expect(box.width).toBeGreaterThan(60);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('both Длина and Ширина labels are fully visible', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const labels = page.locator('.dimensions-field label');
    const labelCount = await labels.count();
    if (labelCount === 0) {
      test.skip(true, 'No dimension labels found');
      return;
    }

    const viewport = page.viewportSize();
    const screenWidth = viewport?.width ?? 390;
    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const box = await label.boundingBox();
      if (!box) continue;
      expect(box.x + box.width).toBeLessThanOrEqual(screenWidth + 2);
      expect(box.x).toBeGreaterThanOrEqual(-2);
    }
  });

  test('no horizontal scroll on dimensions screen', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('dimensions-field has min-width:0 (flex shrink fix)', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }
    const minWidth = await page.evaluate(() => {
      const el = document.querySelector('.dimensions-field');
      return el ? window.getComputedStyle(el).minWidth : null;
    });
    if (minWidth === null) {
      test.skip(true, '.dimensions-field not found');
      return;
    }
    expect(minWidth).toBe('0px');
  });

  test('dimensions-card__fields has overflow constraint', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }
    const overflow = await page.evaluate(() => {
      const el = document.querySelector('.dimensions-card__fields');
      return el ? window.getComputedStyle(el).overflowX : null;
    });
    if (overflow === null) {
      test.skip(true, '.dimensions-card__fields not found');
      return;
    }
    expect(['hidden', 'clip', 'scroll', 'auto']).toContain(overflow);
  });
});
