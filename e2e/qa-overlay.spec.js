/**
 * Semi-automated QA smoke using DEV-only ?qa=1 overlay.
 * Verifies:
 * - no horizontal overflow
 * - no fixed-bar overlaps (nav vs CTA bars)
 * - CLS stays reasonable during basic navigation
 *
 * This is intentionally conservative to avoid flakiness.
 */
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE', w: 375, h: 667 },
  { name: 'iPhone 12/13/14', w: 390, h: 844 },
  { name: 'iPhone Pro Max', w: 430, h: 932 },
  { name: 'Android small', w: 360, h: 740 },
  { name: 'Android tall 800', w: 360, h: 800 },
  { name: 'Android tall 860', w: 360, h: 860 },
  { name: 'Landscape sanity', w: 740, h: 360 },
];

async function waitQa(page) {
  await page.waitForFunction(() => window.__dmQa?.ready === true, null, { timeout: 5000 });
}

async function scanAndGet(page) {
  await page.evaluate(() => window.__dmQa?.scanNow?.());
  return await page.evaluate(() => window.__dmQa?.getState?.());
}

async function expectClean(page, label) {
  const s = await scanAndGet(page);
  expect(s, `${label}: QA overlay state missing`).toBeTruthy();
  if (s.overflowIssues.length) {
    throw new Error(`${label}: horizontal overflow issues\n` + s.overflowIssues.map((x) => `- ${x.label}`).join('\n'));
  }
  if (s.overlapIssues.length) {
    throw new Error(`${label}: fixed-bar overlaps\n` + s.overlapIssues.map((x) => `- ${x}`).join('\n'));
  }
  expect(s.clsTotal, `${label}: CLS too high`).toBeLessThan(0.3);
}

test.describe('QA overlay smoke', () => {
  test('viewport matrix: no overflow/overlap on key screens', async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h });

      // Home
      await page.goto('/?qa=1', { waitUntil: 'domcontentloaded' });
      await waitQa(page);
      await page.evaluate(() => window.__dmQa?.resetCls?.());
      await page.waitForTimeout(250);
      await expectClean(page, `${vp.name} home`);

      // Mode selection
      await page.getByTestId('nav-metric').click({ force: true });
      await page.getByTestId('btn-quick-mode').waitFor({ state: 'visible', timeout: 5000 });
      await page.evaluate(() => window.__dmQa?.resetCls?.());
      await page.waitForTimeout(200);
      await expectClean(page, `${vp.name} mode selection`);

      // Quick calc screen (Step 1 or Step 2 layout)
      await page.getByTestId('btn-quick-mode').click({ force: true });
      await page.getByTestId('step-dots').waitFor({ state: 'visible', timeout: 5000 });
      await page.evaluate(() => window.__dmQa?.resetCls?.());
      await page.waitForTimeout(250);
      await expectClean(page, `${vp.name} quick calc entry`);

      const nextBtn = page.getByTestId('btn-next-step');
      await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
      if (await nextBtn.isEnabled()) await nextBtn.click({ force: true });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__dmQa?.resetCls?.());
      await page.waitForTimeout(150);
      await expectClean(page, `${vp.name} quick calc step`);

      // History + Settings
      await page.getByRole('navigation').getByRole('button', { name: /История/i }).click({ force: true });
      await page.evaluate(() => window.__dmQa?.resetCls?.());
      await page.waitForTimeout(200);
      await expectClean(page, `${vp.name} history`);

      await page.getByRole('navigation').getByRole('button', { name: /Настройки/i }).click({ force: true });
      await page.waitForTimeout(250);
      await page.evaluate(() => window.__dmQa?.resetCls?.());
      await page.waitForTimeout(150);
      await expectClean(page, `${vp.name} settings`);
    }
  });

  test('E2E flows (subset): quick calc + detail wizard are stable', async ({ page }) => {
    // Representative viewport
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/?qa=1', { waitUntil: 'domcontentloaded' });
    await waitQa(page);
    await page.evaluate(() => window.__dmQa?.resetCls?.());
    await page.waitForTimeout(250);

    // Quick calc: reach Step 2 and open a couple of modals (layout/scroll stability)
    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('btn-quick-mode').click({ force: true });
    const nextBtn = page.getByTestId('btn-next-step');
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    if (await nextBtn.isEnabled()) await nextBtn.click({ force: true });
    await page.getByTestId('quick-step2').waitFor({ state: 'visible', timeout: 5000 });
    await page.evaluate(() => window.__dmQa?.resetCls?.());
    await page.waitForTimeout(200);
    await expectClean(page, 'quick step2 before modals');

    // Detail wizard: open and wait for Konva init (no crashes outside Telegram)
    await page.getByTestId('nav-metric').click({ force: true });
    await page.getByTestId('btn-detail-mode').click({ force: true });
    await page.getByRole('button', { name: /Продолжить.*Размещение/i }).click({ force: true });
    await expect(page.getByTestId('graphics-konva')).toHaveAttribute('data-ready', '1', { timeout: 15000 });
    await expectClean(page, 'detail step placement');
  });
});

