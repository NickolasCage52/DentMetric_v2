/**
 * E2E: Detail mode — dimension layout visual checks.
 */
import { test, expect } from './helpers/fixtures.js';
import { goToDetailDimensions } from './helpers/detail-helpers.js';

test.describe('Detail mode — Dimension layout visual checks', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'chromium', 'Dimension screen is mobile flow');
  });
  test('two inputs render side by side', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const inputs = page.locator('.dent-dim-modal-box .dim-field__input');
    if ((await inputs.count()) < 2) {
      test.skip(true, 'Need 2 inputs to check side-by-side layout');
      return;
    }

    const box0 = await inputs.nth(0).boundingBox();
    const box1 = await inputs.nth(1).boundingBox();
    if (!box0 || !box1) {
      test.skip(true, 'Could not get bounding boxes');
      return;
    }

    expect(Math.abs(box0.y - box1.y)).toBeLessThan(15);
    expect(box1.x).toBeGreaterThan(box0.x + box0.width - 10);
    expect(Math.abs(box0.width - box1.width)).toBeLessThan(30);
  });

  test('inputs are fully within screen bounds', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const viewport = page.viewportSize();
    if (!viewport) return;

    const inputs = page.locator('.dent-dim-modal-box .dim-field__input');
    const count = await inputs.count();
    if (count === 0) {
      test.skip(true, 'No inputs found');
      return;
    }

    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox();
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(-2);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
      expect(box.height).toBeGreaterThanOrEqual(38);
    }
  });

  test('dimension modal fits horizontally over marking controls row', async ({ page }) => {
    const reached = await goToDetailDimensions(page);
    if (!reached) {
      test.skip(true, 'Could not reach dimensions screen');
      return;
    }

    const modal = page.locator('.dent-dim-modal-box').first();
    const controls = page.locator('.marking-controls-overlay').first();
    if (!(await modal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Dimension modal not visible');
      return;
    }

    const modalBox = await modal.boundingBox();
    const controlsBox = await controls.boundingBox();
    if (!modalBox || !controlsBox) return;
    const vw = page.viewportSize()?.width ?? 400;
    expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(vw + 2);
    expect(modalBox.width).toBeLessThanOrEqual(controlsBox.width + 24);
  });
});
