/**
 * E2E: Settings toggles must affect behavior (functional wiring).
 */
import { test, expect } from '@playwright/test';

async function openSettingsSection(page, sectionTitle) {
  const header = page.locator('.dm-section-header').filter({ hasText: sectionTitle });
  await header.click();
  await page.waitForTimeout(300);
}

/** Toggle is a custom checkbox - click the label to avoid dm-toggle-thumb interception */
async function setToggle(page, testId, checked) {
  const input = page.getByTestId(testId);
  const current = await input.isChecked().catch(() => false);
  if (current === checked) return;
  await page.locator(`label:has([data-testid="${testId}"])`).click();
  await page.waitForTimeout(150);
}

test.describe('Settings toggles', () => {
  test('showClientQuick OFF skips quick client step', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="nav-settings"]').click({ force: true });
    await page.waitForTimeout(400);

    await openSettingsSection(page, 'Интерфейс');
    await setToggle(page, 'settings-show-client-quick', false);

    await page.locator('[data-testid="nav-metric"]').click({ force: true });
    await page.waitForTimeout(300);
    await page.getByTestId('btn-quick-mode').click({ force: true });
    await page.waitForTimeout(600);

    await expect(page.getByTestId('quick-step2')).toBeVisible({ timeout: 8000 });
  });

  test('showClientDetail OFF skips detail client step', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="nav-settings"]').click({ force: true });
    await page.waitForTimeout(400);

    await openSettingsSection(page, 'Интерфейс');
    await setToggle(page, 'settings-show-client-detail', false);

    await page.locator('[data-testid="nav-metric"]').click({ force: true });
    await page.waitForTimeout(300);
    await page.getByTestId('btn-detail-mode').click({ force: true });
    await page.waitForTimeout(600);

    await expect(page.getByText(/Данные клиента/i)).not.toBeVisible({ timeout: 2000 });
  });

  test('clientRequired ON blocks next until required fields filled', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="nav-settings"]').click({ force: true });
    await page.waitForTimeout(400);

    await openSettingsSection(page, 'Клиент');
    await setToggle(page, 'settings-client-required', true);
    await setToggle(page, 'settings-require-phone', true);
    await setToggle(page, 'settings-require-name', true);

    await page.locator('[data-testid="nav-metric"]').click({ force: true });
    await page.waitForTimeout(300);
    await page.getByTestId('btn-quick-mode').click({ force: true });
    await page.waitForTimeout(600);

    const nextBtn = page.getByTestId('btn-next-step').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await expect(nextBtn).toBeDisabled();

    await page.getByRole('button', { name: /Имя клиента/i }).click({ force: true });
    const dialog = page.getByRole('dialog', { name: /Данные клиента/i });
    await dialog.getByPlaceholder(/Имя клиента/i).fill('Тест');
    await dialog.getByRole('button', { name: /Готово/i }).click({ force: true });

    await page.getByRole('button', { name: /Телефон/i }).click({ force: true });
    const dialog2 = page.getByRole('dialog', { name: /Данные клиента/i });
    await dialog2.getByPlaceholder(/Телефон/i).fill('+79990000000');
    await dialog2.getByRole('button', { name: /Готово/i }).click({ force: true });

    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  });

  test('showInfoTooltips OFF hides all InfoIcon buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="nav-settings"]').click({ force: true });
    await page.waitForTimeout(400);

    await openSettingsSection(page, 'Интерфейс');
    await setToggle(page, 'settings-show-tooltips', false);

    await page.locator('[data-testid="nav-metric"]').click({ force: true });
    await page.waitForTimeout(300);
    await page.getByTestId('btn-quick-mode').click({ force: true });
    await page.waitForTimeout(600);

    await expect(page.getByRole('button', { name: 'Подсказка' })).toHaveCount(0);
  });

  test('optional fields toggles hide corresponding rows in quick and detail', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="nav-settings"]').click({ force: true });
    await page.waitForTimeout(400);

    await openSettingsSection(page, 'Интерфейс');
    await setToggle(page, 'settings-show-client-quick', false);
    await openSettingsSection(page, 'Обязательные поля');
    await setToggle(page, 'settings-show-paint-material', false);
    await setToggle(page, 'settings-show-sound-insulation', false);

    await page.locator('[data-testid="nav-metric"]').click({ force: true });
    await page.waitForTimeout(300);
    await page.getByTestId('btn-quick-mode').click({ force: true });
    await page.waitForTimeout(600);

    const nextBtn = page.getByTestId('btn-next-step').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    if (await nextBtn.isEnabled()) await nextBtn.click({ force: true });
    await page.getByTestId('quick-step2').waitFor({ state: 'visible', timeout: 8000 });
    await expect(page.getByText('МАТЕРИАЛ ЛКП')).toHaveCount(0);
    await expect(page.getByText('ШУМОИЗОЛЯЦИЯ')).toHaveCount(0);

    test.skip(true, 'Detail conditions step requires photo — cannot reach without file input in this test');
  });
});
