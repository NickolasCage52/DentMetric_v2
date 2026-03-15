/**
 * Injects a mock Telegram WebApp API for E2E tests (browser context without Telegram).
 */
export function injectTelegramMock(page) {
  return page.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        ready: () => {},
        expand: () => {},
        close: () => {},
        showAlert: (msg) => { if (typeof alert === 'function') alert(msg); },
        showConfirm: (_msg, cb) => { if (typeof cb === 'function') cb(true); },
        MainButton: {
          show: () => {}, hide: () => {}, setText: () => {},
          onClick: () => {}, offClick: () => {}, enable: () => {}, disable: () => {},
          isVisible: false,
        },
        BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
        initData: '',
        initDataUnsafe: { user: { id: 123456789, first_name: 'Test', username: 'testuser' } },
        colorScheme: 'dark',
        themeParams: {},
        isExpanded: true,
        viewportHeight: 844,
        viewportStableHeight: 844,
        platform: 'android',
      },
    };
  });
}
