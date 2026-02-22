/**
 * E2E: Settings toggles must affect behavior (functional wiring).
 */
import { test, expect } from '@playwright/test';

test.describe('Settings toggles', () => {
  test('showClientQuick OFF skips quick client step', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('navigation').getByRole('button', { name: /Настройки/i }).click({ force: true });

    // OFF
    const toggle = page.getByTestId('settings-show-client-quick');
    await toggle.setChecked(false);

    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-standard').click({ force: true });

    await expect(page.getByTestId('quick-step2')).toBeVisible({ timeout: 8000 });
  });

  test('showClientDetail OFF skips detail client step', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('navigation').getByRole('button', { name: /Настройки/i }).click({ force: true });

    const toggle = page.getByTestId('settings-show-client-detail');
    await toggle.setChecked(false);

    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-graphics').click({ force: true });

    // Step 0 client screen should not appear at all
    await expect(page.getByText(/Данные клиента/i)).not.toBeVisible({ timeout: 2000 });
  });

  test('clientRequired ON blocks next until required fields filled', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('navigation').getByRole('button', { name: /Настройки/i }).click({ force: true });
    await page.getByTestId('settings-client-required').setChecked(true);
    await page.getByTestId('settings-require-phone').setChecked(true);
    await page.getByTestId('settings-require-name').setChecked(true);

    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-standard').click({ force: true });

    const nextBtn = page.getByTestId('btn-go-next').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await expect(nextBtn).toBeDisabled();

    // Fill name + phone via modals
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
    await page.getByRole('navigation').getByRole('button', { name: /Настройки/i }).click({ force: true });
    await page.getByTestId('settings-show-tooltips').setChecked(false);

    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-standard').click({ force: true });

    // InfoIcon has aria-label "Подсказка"
    await expect(page.getByRole('button', { name: 'Подсказка' })).toHaveCount(0);
  });

  test('optional fields toggles hide corresponding rows in quick and detail', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('navigation').getByRole('button', { name: /Настройки/i }).click({ force: true });
    await page.getByTestId('settings-show-client-quick').setChecked(false);
    await page.getByTestId('settings-show-paint-material').setChecked(false);
    await page.getByTestId('settings-show-sound-insulation').setChecked(false);

    // Quick: go to step 2 (client step skipped) and ensure rows not present
    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-standard').click({ force: true });
    // If client step exists, skip it
    const nextBtn = page.getByTestId('btn-go-next').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    if (await nextBtn.isEnabled()) await nextBtn.click({ force: true });
    await page.getByTestId('quick-step2').waitFor({ state: 'visible', timeout: 8000 });
    await expect(page.getByText('МАТЕРИАЛ ЛКП')).toHaveCount(0);
    await expect(page.getByText('ШУМОИЗОЛЯЦИЯ')).toHaveCount(0);

    // Detail: open conditions step and ensure rows hidden
    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('metric-graphics').click({ force: true });
    await page.getByRole('button', { name: /Продолжить.*Размещение/i }).click({ force: true });
    await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });
    await page.getByTestId('add-type-circle').click({ force: true });
    await page.getByTestId('size-option-S6').click({ force: true });

    const continueToSizeBtn = page.getByRole('button', { name: /Продолжить.*Размер/i });
    await expect(continueToSizeBtn).toBeEnabled({ timeout: 10000 });
    await continueToSizeBtn.click({ force: true });
    await page.getByRole('button', { name: /Продолжить.*Условия/i }).click({ force: true });
    await expect(page.getByTestId('detail-param-paint')).toHaveCount(0);
    await expect(page.getByTestId('detail-param-sound')).toHaveCount(0);
  });
});

