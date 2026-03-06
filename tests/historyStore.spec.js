/**
 * Unit tests for history save/reset flow, normalization, and robustness.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadHistory,
  saveEstimate,
  deleteEstimate,
  updateEstimate,
  clearHistory,
  normalizeHistoryRecord,
  STATUS_ESTIMATE,
  STATUS_SCHEDULED,
  STATUS_DONE,
  STORAGE_KEY,
} from '../src/features/history/historyStore';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('historyStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearHistory(); // Reset in-memory state
  });

  it('loadHistory returns empty array when no data', () => {
    const items = loadHistory();
    expect(items).toEqual([]);
  });

  it('saveEstimate adds item and persists', () => {
    loadHistory(); // Ensure store is initialized
    const draft = {
      clientName: 'Test',
      quickDents: [],
      total: 5000,
    };
    const saved = saveEstimate(draft);
    expect(saved).toBeDefined();
    expect(saved.id).toBeDefined();
    expect(saved.clientName).toBe('Test');

    const items = loadHistory();
    expect(items.length).toBe(1);
    expect(items[0].clientName).toBe('Test');
  });

  it('deleteEstimate removes item', () => {
    const draft = { clientName: 'A', quickDents: [], total: 1000 };
    const saved = saveEstimate(draft);
    deleteEstimate(saved.id);

    const items = loadHistory();
    expect(items.length).toBe(0);
  });

  it('updateEstimate updates client fields', () => {
    const draft = { clientName: 'Original', quickDents: [], total: 2000 };
    const saved = saveEstimate(draft);
    const updated = updateEstimate(saved.id, {
      client: { clientName: 'Updated' },
      comment: 'New comment',
    });

    expect(updated).toBeDefined();
    expect(updated.client.clientName).toBe('Updated');
    expect(updated.comment).toBe('New comment');

    const items = loadHistory();
    expect(items[0].client.clientName).toBe('Updated');
  });

  it('clearHistory empties storage', () => {
    saveEstimate({ clientName: 'A', quickDents: [], total: 1000 });
    saveEstimate({ clientName: 'B', quickDents: [], total: 2000 });
    clearHistory();

    const items = loadHistory();
    expect(items).toEqual([]);
  });

  describe('normalizeHistoryRecord', () => {
    it('returns null for null or non-object', () => {
      expect(normalizeHistoryRecord(null)).toBeNull();
      expect(normalizeHistoryRecord(undefined)).toBeNull();
      expect(normalizeHistoryRecord('')).toBeNull();
      expect(normalizeHistoryRecord(123)).toBeNull();
    });

    it('guarantees id, createdAt, total, status, client', () => {
      const out = normalizeHistoryRecord({});
      expect(out).not.toBeNull();
      expect(typeof out.id).toBe('string');
      expect(out.id.length).toBeGreaterThan(0);
      expect(typeof out.createdAt).toBe('string');
      expect(new Date(out.createdAt).getTime()).not.toBeNaN();
      expect(typeof out.total).toBe('number');
      expect(out.status).toBe(STATUS_ESTIMATE);
      expect(out.client).toBeDefined();
      expect(out.client.name).toBe('Клиент без имени');
      expect(out.client.phone).toBe('');
    });

    it('repairs invalid createdAt to valid ISO string', () => {
      const out = normalizeHistoryRecord({ createdAt: 'not-a-date' });
      expect(out).not.toBeNull();
      expect(new Date(out.createdAt).getTime()).not.toBeNaN();
    });

    it('maps unknown status to estimate, migrates old statuses', () => {
      expect(normalizeHistoryRecord({ status: 'invalid' }).status).toBe(STATUS_ESTIMATE);
      expect(normalizeHistoryRecord({ status: 'booked' }).status).toBe(STATUS_SCHEDULED);
      expect(normalizeHistoryRecord({ status: 'done' }).status).toBe(STATUS_DONE);
      expect(normalizeHistoryRecord({ status: 'no_booking' }).status).toBe(STATUS_ESTIMATE);
    });

    it('ensures dents has items array', () => {
      const out = normalizeHistoryRecord({ dents: {} });
      expect(Array.isArray(out.dents.items)).toBe(true);
    });

    it('preserves circle type regardless of dimensions (no ratio-based override to strip)', () => {
      const raw = {
        total: 5000,
        client: { name: 'Test', phone: '' },
        dents: {
          items: [
            { id: '1', type: 'circle', shape: 'circle', bboxMm: { width: 100, height: 300 } },
            { id: '2', type: 'circle', shape: 'circle', sizeLengthMm: 50, sizeWidthMm: 400 },
          ],
        },
      };
      const out = normalizeHistoryRecord(raw);
      expect(out.dents.items[0].type).toBe('circle');
      expect(out.dents.items[0].shape).toBe('circle');
      expect(out.dents.items[1].type).toBe('circle');
      expect(out.dents.items[1].shape).toBe('circle');
    });

    it('converts strip to circle when ratio 1:1 (square dimensions)', () => {
      const raw = {
        total: 5000,
        client: { name: 'Test', phone: '' },
        dents: {
          items: [
            { id: '1', type: 'strip', shape: 'strip', bboxMm: { width: 30, height: 30 } },
          ],
        },
      };
      const out = normalizeHistoryRecord(raw);
      expect(out.dents.items[0].type).toBe('circle');
      expect(out.dents.items[0].shape).toBe('circle');
    });
  });

  it('loadHistory dedupes duplicate ids', () => {
    const payload = {
      version: 1,
      items: [
        { id: 'same', total: 100, client: { name: 'A', phone: '' } },
        { id: 'same', total: 200, client: { name: 'B', phone: '' } },
      ],
    };
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(payload));
    const items = loadHistory(true);
    expect(items.length).toBe(2);
    expect(items[0].id).not.toBe(items[1].id);
  });

  it('loadHistory skips malformed records and keeps valid ones', () => {
    const payload = {
      version: 1,
      items: [
        { total: 100, client: { name: 'Good', phone: '' } },
        null,
        { total: 200, client: { name: 'Also good', phone: '' } },
      ],
    };
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(payload));
    const items = loadHistory(true);
    expect(items.length).toBe(2);
  });
});
