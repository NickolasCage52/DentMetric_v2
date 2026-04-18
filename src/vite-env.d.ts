/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

/** Расширение DOM: в ряде браузеров поддерживается для уведомлений. */
interface NotificationOptions {
  vibrate?: number | number[];
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    isVisible: boolean;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    setText(text: string): void;
    setParams(params: Record<string, unknown>): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat?: Record<string, unknown>;
    auth_date: number;
    hash: string;
  };
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  version: string;
  isVersionAtLeast(version: string): boolean;
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;
  showPopup?(params: {
    message: string;
    title?: string;
    buttons?: ReadonlyArray<{ id?: string; type?: string; text?: string }>;
  }): void;
  openInvoice?(url: string, callback?: (status: string) => void): void;
  openLink?(url: string, options?: { try_instant_view?: boolean }): void;
  enableClosingConfirmation?(): void;
  disableClosingConfirmation?(): void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

declare module 'virtual:pwa-register/vue' {
  import type { Ref } from 'vue';
  export function useRegisterSW(options?: {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }): {
    needRefresh: Ref<boolean>;
    offlineReady: Ref<boolean>;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    vfs?: unknown;
    createPdf(documentDefinition: Record<string, unknown>): {
      download(filename?: string): void;
      open(): void;
      print(): void;
      getBuffer(cb: (buffer: ArrayBuffer) => void): void;
      getDataUrl(cb: (dataUrl: string) => void): void;
      getBlob(cb: (blob: Blob) => void): void;
    };
  };
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: {
    pdfMake?: { vfs?: Record<string, string> };
  } & Record<string, unknown>;
  export default pdfFonts;
}
