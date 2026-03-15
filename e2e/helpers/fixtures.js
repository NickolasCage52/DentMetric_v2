/**
 * Base Playwright fixture with Telegram WebApp mock injection.
 */
import { test as base } from '@playwright/test';
import { injectTelegramMock } from './telegram-mock.js';

export const test = base.extend({
  page: async ({ page }, use) => {
    await injectTelegramMock(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
