import { normalizeHistoryRecord, STORAGE_KEY } from '@/features/history/historyStore';

declare const __APP_VERSION__: string;

const BACKUP_PREFIX = 'dentmetric_history_backup_';

export interface HistoryExportPayload {
  version: string;
  exportedAt: string;
  recordCount: number;
  records: unknown[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

export async function exportHistoryToJSON(records: unknown[]): Promise<void> {
  const payload: HistoryExportPayload = {
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    records,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dentmetric-history-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importHistoryFromJSON(
  file: File,
  mode: 'merge' | 'replace',
  currentRecords: unknown[],
  storageKey: string
): Promise<{ records: unknown[]; result: ImportResult }> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: 0,
    errorMessages: [],
  };

  let payload: HistoryExportPayload;
  try {
    const text = await file.text();
    payload = JSON.parse(text);
  } catch {
    result.errors++;
    result.errorMessages.push('Файл повреждён или неверный формат JSON');
    return { records: currentRecords, result };
  }

  if (!payload?.records || !Array.isArray(payload.records)) {
    result.errors++;
    result.errorMessages.push('Неверная структура файла — поле records не найдено');
    return { records: currentRecords, result };
  }

  if (mode === 'replace') {
    const backupKey = `${BACKUP_PREFIX}${Date.now()}`;
    try {
      const current = localStorage.getItem(storageKey) || '[]';
      localStorage.setItem(backupKey, current);
    } catch {
      console.warn('[HistoryIO] Backup before replace failed');
    }
  }

  const existingIds = new Set(
    (currentRecords as Array<{ id?: string }>).map((r) => r?.id).filter(Boolean) as string[]
  );

  const normalizedImported: unknown[] = [];

  for (const raw of payload.records) {
    try {
      const normalized = normalizeHistoryRecord(raw);
      if (!(normalized as { id?: string })?.id) {
        result.errors++;
        result.errorMessages.push('Запись без ID пропущена');
        continue;
      }
      const nid = (normalized as { id: string }).id;
      if (mode === 'merge' && existingIds.has(nid)) {
        result.skipped++;
        continue;
      }
      normalizedImported.push(normalized);
      result.imported++;
    } catch (err: unknown) {
      result.errors++;
      result.errorMessages.push(
        `Ошибка обработки записи: ${err instanceof Error ? err.message : 'unknown'}`
      );
    }
  }

  let finalRecords: unknown[];
  if (mode === 'replace') {
    finalRecords = normalizedImported;
  } else {
    finalRecords = [...currentRecords, ...normalizedImported];
  }

  finalRecords.sort((a: any, b: any) => {
    const ta = new Date(a?.createdAt || 0).getTime();
    const tb = new Date(b?.createdAt || 0).getTime();
    return tb - ta;
  });

  return { records: finalRecords, result };
}

export function cleanupImportBackups(): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(BACKUP_PREFIX)) continue;
      const timestamp = parseInt(key.replace(BACKUP_PREFIX, ''), 10);
      if (!Number.isNaN(timestamp) && timestamp < cutoff) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* silent */
  }
}

export { STORAGE_KEY };
