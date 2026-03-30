/**
 * Helpers for Detail mode E2E — photo-based flow.
 */
import * as path from 'path';
import { expect } from '@playwright/test';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testImagePath = path.join(__dirname, 'test-image.jpg');

/**
 * Navigate to Detail mode placement step (with add-type-circle visible).
 * Requires: photo flow — selects test image via file chooser.
 */
export async function goToDetailPlacement(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('btn-open-metric').click({ force: true });
  await page.getByTestId('btn-detail-mode').click({ force: true });
  await page.waitForTimeout(500);

  const continuePlacementBtn = page
    .getByRole('button', { name: /Продолжить.*Размещение/i })
    .or(page.getByTestId('btn-continue-placement'));
  if (await continuePlacementBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await continuePlacementBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
  if (await galleryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      galleryBtn.click(),
    ]);
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(1500);
    const continueBtn = page.locator('[data-testid="btn-continue"]');
    await continueBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });
}

/**
 * Open a Settings section by header text.
 */
export async function openSettingsSection(page, sectionTitle) {
  const header = page.locator('.dm-section-header').filter({ hasText: sectionTitle });
  await header.click();
  await page.waitForTimeout(300);
}

/**
 * Navigate to Detail mode dimensions step (marking flow).
 * Flow: Detail -> client skip -> gallery -> draw dent -> "Задать размеры".
 * Returns true if dimensions screen is reached, false if we need to skip the test.
 */
export async function goToDetailDimensions(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('btn-open-metric').click({ force: true });
  await page.getByTestId('btn-detail-mode').click({ force: true });
  await page.waitForTimeout(500);

  const fwd = page.getByTestId('btn-continue-placement');
  const fwdAlt = page.getByRole('button', { name: /Продолжить|Далее|Вперёд/i });
  const clientNext = (await fwd.isVisible({ timeout: 2000 }).catch(() => false)) ? fwd : fwdAlt;
  if (await clientNext.isVisible({ timeout: 2000 }).catch(() => false)) {
    if (await clientNext.isDisabled().catch(() => false)) {
      await page.getByRole('button', { name: /Телефон/i }).click({ force: true }).catch(() => {});
      const dialog = page.getByRole('dialog', { name: /Данные клиента/i });
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dialog.getByPlaceholder(/Телефон/i).fill('+79991112233');
        await dialog.getByRole('button', { name: /Готово/i }).click();
        await page.waitForTimeout(400);
      }
    }
    await page.getByTestId('btn-continue-placement').click({ force: true }).catch(async () => {
      await page.getByRole('button', { name: /Вперёд/i }).click({ force: true });
    });
    await page.waitForTimeout(600);
  }

  const galleryBtn = page.locator('[data-testid="btn-photo-from-gallery"]');
  if (!(await galleryBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 5000 }),
    galleryBtn.click(),
  ]);
  await fileChooser.setFiles(testImagePath);
  await page.waitForTimeout(2000);

  const drawBtn = page.locator('.marking-draw-btn').filter({ hasText: /Вмятину/i });
  if (!(await drawBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  await drawBtn.click();
  await page.waitForTimeout(400);

  const canvasArea = page.locator('.marking-canvas-area');
  if (!(await canvasArea.isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }
  const box = await canvasArea.boundingBox();
  if (!box) return false;

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx - 40, cy - 40);
  await page.mouse.down();
  await page.mouse.move(cx - 20, cy - 30);
  await page.mouse.move(cx + 20, cy - 20);
  await page.mouse.move(cx + 40, cy + 30);
  await page.mouse.move(cx - 40, cy + 20);
  await page.mouse.move(cx - 40, cy - 40);
  await page.mouse.up();
  await page.waitForTimeout(600);

  const goToDimsBtn = page.locator('[data-testid="btn-go-to-dimensions"]');
  if (!(await goToDimsBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  await goToDimsBtn.click();
  await page.waitForTimeout(500);
  return true;
}
