import { MAX_STORAGE_BYTES, STORAGE_KEY } from '@/features/history/historyStorePure';

export type StorageStatus = 'ok' | 'warning' | 'critical';

export interface StorageInfo {
  usedBytes: number;
  maxBytes: number;
  percent: number;
  status: StorageStatus;
  formattedUsed: string;
  formattedMax: string;
  recordCount: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

/** История: размер JSON в localStorage относительно лимита истории. */
export function getHistoryStorageInfo(): StorageInfo {
  let usedBytes = 0;
  let recordCount = 0;

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    usedBytes = new Blob([raw]).size;
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    recordCount = Array.isArray(items) ? items.length : 0;
  } catch {
    /* fallback zeros */
  }

  const percent = Math.min(100, Math.round((usedBytes / MAX_STORAGE_BYTES) * 100));
  let status: StorageStatus = 'ok';
  if (percent >= 95) status = 'critical';
  else if (percent >= 80) status = 'warning';

  return {
    usedBytes,
    maxBytes: MAX_STORAGE_BYTES,
    percent,
    status,
    formattedUsed: formatBytes(usedBytes),
    formattedMax: formatBytes(MAX_STORAGE_BYTES),
    recordCount,
  };
}

const TOTAL_KEYS = [
  STORAGE_KEY,
  'dm_bookings_v1',
  'dm_employees_v1',
  'dm_service_data_v1',
  'dm_notification_history_v1',
  'dm_notification_settings_v1',
  'dm_scheduled_notifications_v1',
  'dm_market_prices_queue_v1',
  'dm_portal_links_v1',
];

/** Суммарный размер выбранных ключей localStorage (оценка). */
export function getTotalStorageInfo(): StorageInfo {
  let totalBytes = 0;
  try {
    for (const key of TOTAL_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) totalBytes += new Blob([raw]).size;
    }
  } catch {
    /* silent */
  }

  const percent = Math.min(100, Math.round((totalBytes / MAX_STORAGE_BYTES) * 100));
  let status: StorageStatus = 'ok';
  if (percent >= 95) status = 'critical';
  else if (percent >= 80) status = 'warning';

  return {
    usedBytes: totalBytes,
    maxBytes: MAX_STORAGE_BYTES,
    percent,
    status,
    formattedUsed: formatBytes(totalBytes),
    formattedMax: formatBytes(MAX_STORAGE_BYTES),
    recordCount: 0,
  };
}
