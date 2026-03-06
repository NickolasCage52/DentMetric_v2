/**
 * DEV-самопроверка: история, вложения, нормализация.
 * Запускается только в import.meta.env.DEV.
 */
import {
  safeLoadHistory,
  safeSaveHistory,
  normalizeRecord,
  STORAGE_KEY
} from '../features/history/historyStore';
import { saveAttachment, getAttachment, deleteAttachment } from './attachmentStorage';

export async function runDevAudit() {
  if (!import.meta.env?.DEV) return;
  console.group('[DentMetric DevAudit]');

  // 1. normalizeRecord: дефолты для всех полей
  try {
    const empty = normalizeRecord({});
    if (!empty) throw new Error('normalizeRecord returned null');
    const required = ['id', 'schemaVersion', 'createdAt', 'total', 'status', 'client', 'dents', 'attachments', 'comment', 'master'];
    for (const k of required) {
      if (empty[k] === undefined) throw new Error(`Missing field: ${k}`);
    }
    console.log('normalizeRecord defaults: OK');
  } catch (e) {
    console.error('normalizeRecord FAILED:', e);
  }

  // 1b. normalizeRecord: prepayment migration (Правка 11)
  try {
    const oldRecord = { id: 'old', dents: { count: 0, items: [] } };
    const normalized = normalizeRecord(oldRecord);
    if (!normalized) throw new Error('normalizeRecord returned null');
    if (normalized.prepayment === undefined) throw new Error('prepayment field missing');
    if (normalized.prepayment.amount !== 0) throw new Error('prepayment.amount default should be 0');
    if (normalized.prepayment.method !== null) throw new Error('prepayment.method default should be null');
    console.log('normalizeRecord prepayment migration: OK');
  } catch (e) {
    console.error('prepayment migration FAILED:', e);
  }

  // 2. safeLoadHistory: не падает при битых данных, возвращает массив
  try {
    const backup = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, '[{"id":"a"},null,{}]');
    const loaded = safeLoadHistory();
    if (typeof backup === 'string') localStorage.setItem(STORAGE_KEY, backup);
    else if (backup === null) localStorage.removeItem(STORAGE_KEY);
    if (!Array.isArray(loaded)) throw new Error('Expected array');
    console.log('Broken history graceful: OK');
  } catch (e) {
    console.error('Broken history FAILED:', e);
  }

  // 3. safeLoadHistory всегда возвращает массив
  try {
    const loaded = safeLoadHistory();
    if (!Array.isArray(loaded)) throw new Error('safeLoadHistory must return array');
    if (!loaded.every((r) => !r || (r && r.id))) throw new Error('All records must have id');
    console.log('safeLoadHistory: OK');
  } catch (e) {
    console.error('safeLoadHistory FAILED:', e);
  }

  // 4. IndexedDB вложение
  try {
    const testBlob = new Blob(['test'], { type: 'image/png' });
    const key = `dm_audit_${Date.now()}`;
    await saveAttachment(key, testBlob);
    const retrieved = await getAttachment(key);
    if (!retrieved) throw new Error('getAttachment returned null');
    await deleteAttachment(key);
    const after = await getAttachment(key);
    if (after != null) throw new Error('Deleted attachment still found');
    console.log('IndexedDB attachment: OK');
  } catch (e) {
    console.error('IDB test FAILED:', e);
  }

  console.groupEnd();
}
