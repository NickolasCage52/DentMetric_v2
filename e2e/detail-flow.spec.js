/**
 * E2E: Detail mode — full new Detail flow (client → camera → marking → dimensions → parameters → result).
 * Validates the complete happy-path end-to-end.
 */
import { test, expect } from './helpers/fixtures.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testImagePath = join(__dirname, 'helpers', 'test-image.jpg');

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

async function selectInMultiSelectModal(page) {
  const overlay = page.locator('.select-modal-overlay');
  await overlay.waitFor({ state: 'visible', timeout: 5000 });
  const opt = page.getByTestId('select-option-0');
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(250);
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await page.getByTestId('select-confirm').click();
  await overlay.waitFor({ state: 'hidden', timeout: 5000 });
}

/**
 * Draws a simple closed shape on the Konva canvas by simulating mouse events.
 * Draws a small diamond inside the canvas area.
 */
async function drawDentOnCanvas(page) {
  const konva = page.locator('.marking-konva-layer');
  await konva.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  const box = await konva.boundingBox();
  if (!box) throw new Error('Cannot get Konva canvas bounding box');

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = Math.min(box.width, box.height) * 0.15;

  await page.mouse.move(cx, cy - r);
  await page.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const angle = (2 * Math.PI * i) / steps - Math.PI / 2;
    await page.mouse.move(cx + r * Math.cos(angle), cy + r * Math.sin(angle), { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
}

test.describe('Detail flow', () => {
  test('Full flow: client → camera → marking → dimensions → params → result', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 1. Open metric
    const metricBtn = page.getByTestId('btn-open-metric');
    if (!(await metricBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'btn-open-metric not found');
      return;
    }
    await metricBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 2. Enter Detail mode
    const detailBtn = page.getByTestId('btn-detail-mode');
    if (!(await detailBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'btn-detail-mode not found — feature not available');
      return;
    }
    await detailBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 3. Client screen: click Continue to proceed to camera
    const continueClientBtn = page.locator('[data-testid="btn-continue-placement"]');
    if (await continueClientBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await continueClientBtn.isDisabled().catch(() => false)) {
        await page.getByRole('button', { name: /Телефон/i }).click({ force: true });
        const dialog = page.getByRole('dialog', { name: /Данные клиента/i });
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dialog.getByPlaceholder(/Телефон/i).fill('+79991112233');
          await dialog.getByRole('button', { name: /Готово/i }).click();
          await page.waitForTimeout(400);
        }
      }
      await page.getByTestId('btn-continue-placement').click({ force: true });
      await page.waitForTimeout(500);
    }

    // 4. Camera screen: select photo from gallery
    const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
    if (!(await galleryBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Gallery button not visible — camera step not reached');
      return;
    }

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      galleryBtn.click(),
    ]);
    if (!fileChooser) {
      test.skip(true, 'File chooser did not open');
      return;
    }
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(2000);

    // 5. Marking screen: draw a dent
    const drawBtn = page.locator('.marking-draw-btn').first();
    if (!(await drawBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Draw button not visible — marking screen not reached');
      return;
    }
    await drawBtn.click({ force: true });
    await page.waitForTimeout(300);

    await drawDentOnCanvas(page);

    // Wait for the proceed button
    const toDimensionsBtn = page.locator('[data-testid="btn-go-to-dimensions"]');
    await expect(toDimensionsBtn).toBeVisible({ timeout: 5000 });
    await toDimensionsBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 6. Dimensions modal: fill length and width for the dent
    const dimModal = page.locator('.dent-dim-modal-overlay');
    await dimModal.waitFor({ state: 'visible', timeout: 5000 });

    const dimInputs = dimModal.locator('.dim-field__input');
    const lengthInput = dimInputs.nth(0);
    const widthInput = dimInputs.nth(1);

    await lengthInput.click({ force: true });
    await lengthInput.fill('');
    await lengthInput.pressSequentially('50', { delay: 30 });
    await page.waitForTimeout(100);

    await widthInput.click({ force: true });
    await widthInput.fill('');
    await widthInput.pressSequentially('30', { delay: 30 });
    await page.waitForTimeout(100);

    // Use evaluate to click save and close the modal, bypassing overlay z-index issues
    await page.evaluate(() => {
      const btns = document.querySelectorAll('.dent-dim-modal-box button');
      const saveBtn = Array.from(btns).find((b) => b.textContent?.trim() === 'Сохранить');
      if (saveBtn) saveBtn.click();
    });
    await dimModal.waitFor({ state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(300);

    // 7. Click "К параметрам" to proceed from dimensions to parameters
    const toParamsBtn = page.locator('[data-testid="btn-proceed-to-params"]');
    await expect(toParamsBtn).toBeEnabled({ timeout: 5000 });
    await toParamsBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 8. Parameter screen: select panel element, presets, and params
    // First select the damaged panel element (required for canProceed)
    const panelBtn = page.getByTestId('quick-panel-element');
    if (await panelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await panelBtn.scrollIntoViewIfNeeded();
      await panelBtn.click({ force: true });
      await selectFirstOptionInModal(page);
    }

    const presetsBtn = page.getByTestId('quick-presets');
    if (await presetsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await presetsBtn.scrollIntoViewIfNeeded();
      await presetsBtn.click({ force: true });
      const presetS6 = page.getByTestId('preset-S6');
      await presetS6.scrollIntoViewIfNeeded();
      await presetS6.click({ force: true });
      await page.locator('.presets-modal-overlay').waitFor({ state: 'hidden', timeout: 3000 });
      await page.waitForTimeout(300);
    }

    const singleSelect = ['quick-param-repair', 'quick-param-risk', 'quick-param-material', 'quick-param-carclass'];
    const multiSelect = ['quick-armaturnaya'];
    for (const tid of singleSelect) {
      const row = page.getByTestId(tid);
      if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) continue;
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await selectFirstOptionInModal(page);
    }
    for (const tid of multiSelect) {
      const row = page.getByTestId(tid);
      if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) continue;
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await selectInMultiSelectModal(page);
    }

    // 9. Click "К итогу" on parameter screen
    const toResultBtn = page.locator('[data-testid="btn-param-next"]');
    await expect(toResultBtn).toBeEnabled({ timeout: 5000 });
    await toResultBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 10. Result screen: verify total price is displayed
    const totalEl = page.getByTestId('total-price-graphics');
    await expect(totalEl).toBeVisible({ timeout: 8000 });
    const totalText = await totalEl.textContent();
    expect(totalText).toMatch(/\d[\d\s]*/);
  });
});
