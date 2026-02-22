import { ref } from 'vue';
import { classifyDamageShapeByRatio } from '../../utils/shapeClassification';

export const HISTORY_SCHEMA_VERSION = 1;
export const STORAGE_KEY = `dentmetric_history_v${HISTORY_SCHEMA_VERSION}`;
const MAX_STORAGE_BYTES = 4_500_000;

const historyItems = ref<any[]>([]);
const historyLoaded = ref(false);

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[history] parse failed', e);
    return null;
  }
}

function migrateHistory(payload: any) {
  if (!payload) return { version: HISTORY_SCHEMA_VERSION, items: [] };
  if (Array.isArray(payload)) {
    return { version: HISTORY_SCHEMA_VERSION, items: payload };
  }
  if (payload.version === HISTORY_SCHEMA_VERSION && Array.isArray(payload.items)) {
    return payload;
  }
  if (payload.items && Array.isArray(payload.items)) {
    return { version: HISTORY_SCHEMA_VERSION, items: payload.items };
  }
  return { version: HISTORY_SCHEMA_VERSION, items: [] };
}

const KNOWN_STATUSES = ['no_booking', 'booked', 'done'] as const;

/**
 * Normalize a raw history record for backward compatibility and required fields.
 * Guarantees: id (string), createdAt (valid ISO string), total (number), status (known enum),
 * client.name/phone (string), dents (object with items array). Never throws.
 */
export function normalizeHistoryRecord(raw: any): any | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const normalized: Record<string, unknown> = { ...raw };
    if (!normalized.id || typeof normalized.id !== 'string') {
      normalized.id = `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    let createdAt: string;
    const rawCreated = raw.createdAt != null ? raw.createdAt : new Date().toISOString();
    if (typeof rawCreated === 'number') {
      const d = new Date(rawCreated);
      createdAt = Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
    } else {
      const d = new Date(String(rawCreated));
      createdAt = Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
    }
    normalized.createdAt = createdAt;
    const total = raw.total ?? raw.totalPrice;
    normalized.total = typeof total === 'string' ? parseFloat(total) || 0 : (Number(total) || 0);
    if (normalized.rawTotal == null) normalized.rawTotal = normalized.total;
    if (typeof normalized.rawTotal === 'string') normalized.rawTotal = parseFloat(normalized.rawTotal as string) || 0;
    const status = normalized.status == null ? 'no_booking' : String(normalized.status);
    normalized.status = KNOWN_STATUSES.includes(status as any) ? status : 'no_booking';
    if (!normalized.client || typeof normalized.client !== 'object') {
      normalized.client = {
        name: raw.clientName ?? (raw.client && (raw.client as any).name) ?? 'Клиент без имени',
        phone: raw.clientPhone ?? (raw.client && (raw.client as any).phone) ?? '',
        company: raw.clientCompany ?? (raw.client && (raw.client as any).company) ?? '',
        brand: raw.carBrand ?? (raw.client && (raw.client as any).brand) ?? '',
        model: raw.carModel ?? (raw.client && (raw.client as any).model) ?? '',
        plate: raw.carPlate ?? (raw.client && (raw.client as any).plate) ?? '',
        date: raw.inspectDate ?? (raw.client && (raw.client as any).date) ?? '',
        time: raw.inspectTime ?? (raw.client && (raw.client as any).time) ?? ''
      };
    } else {
      const c = normalized.client as Record<string, unknown>;
      if (c.name == null || typeof c.name !== 'string') c.name = 'Клиент без имени';
      if (c.phone == null) c.phone = '';
      else if (typeof c.phone !== 'string') c.phone = String(c.phone);
    }
    if (normalized.comment == null) normalized.comment = '';
    if (!normalized.dents || typeof normalized.dents !== 'object') {
      const legacyDents = raw.dent != null ? [raw.dent] : (Array.isArray(raw.quickDents) ? raw.quickDents : []);
      normalized.dents = { count: legacyDents.length, items: Array.isArray(legacyDents) ? legacyDents : [] };
    } else {
      const d = normalized.dents as Record<string, unknown>;
      if (!Array.isArray(d.items)) d.items = [];
    }
    // Backward compat: old oval_long (R>=3) → stripe; normalize dent type on load
    const dentItems = (normalized.dents as any)?.items ?? [];
    for (const dent of dentItems) {
      if (!dent || typeof dent !== 'object') continue;
      const w = Number(dent.bboxMm?.width ?? dent.sizeLengthMm) || 0;
      const h = Number(dent.bboxMm?.height ?? dent.sizeWidthMm) || 0;
      if (w > 0 && h > 0 && classifyDamageShapeByRatio(w, h) === 'stripe') {
        dent.type = 'strip';
        dent.shape = 'strip';
      }
    }
    if (normalized.mode == null) normalized.mode = 'quick';
    if (normalized.discountPercent == null) normalized.discountPercent = 0;
    else normalized.discountPercent = Number(normalized.discountPercent) || 0;
    return normalized as any;
  } catch (_e) {
    if (import.meta.env?.DEV) console.warn('[history] normalizeHistoryRecord threw', _e);
    return null;
  }
}

/** Ensure all items have unique ids (dedupe by appending -index when duplicate). */
function dedupeIds(items: any[]): any[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    if (!item || typeof item !== 'object') return item;
    let id = item.id != null ? String(item.id) : `unknown_${index}`;
    if (seen.has(id)) id = `${id}-${index}`;
    seen.add(id);
    return { ...item, id };
  });
}

function persist(items: any[]) {
  const payload = { version: HISTORY_SCHEMA_VERSION, items };
  let serialized = JSON.stringify(payload);
  if (serialized.length > MAX_STORAGE_BYTES) {
    const trimmed = [...items];
    while (trimmed.length > 0 && serialized.length > MAX_STORAGE_BYTES) {
      trimmed.pop();
      serialized = JSON.stringify({ version: HISTORY_SCHEMA_VERSION, items: trimmed });
    }
    items = trimmed;
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[history] persist failed', e);
    return;
  }
  historyItems.value = items;
}

export function loadHistory(forceReload = false) {
  if (historyLoaded.value && !forceReload) return historyItems.value;
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = migrateHistory(safeParse(raw));
  const items: any[] = [];
  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  for (const item of rawItems) {
    const norm = normalizeHistoryRecord(item);
    if (norm) items.push(norm);
    else if (import.meta.env?.DEV) console.warn('[history] skipping malformed record', item);
  }
  historyItems.value = dedupeIds(items);
  historyLoaded.value = true;
  return historyItems.value;
}

export function loadFromStorage() {
  return loadHistory(true);
}

export function saveToStorage() {
  persist(historyItems.value);
}

export function saveEstimate(estimateDraft: any) {
  if (!estimateDraft) return null;
  const id = estimateDraft.id || `est_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const norm = normalizeHistoryRecord({
    ...estimateDraft,
    id,
    createdAt: estimateDraft.createdAt || new Date().toISOString(),
    status: estimateDraft.status ?? 'no_booking'
  });
  if (!norm) return null;
  const items = [...historyItems.value];
  items.unshift(norm);
  persist(items);
  return norm;
}

export function addRecord(recordDraft: any) {
  return saveEstimate(recordDraft);
}

export function updateRecordStatus(id: string, status: string, bookingAt?: string | null) {
  return updateEstimate(id, { status, bookingAt: bookingAt ?? null });
}

export function deleteEstimate(id: string) {
  if (!id) return;
  const items = historyItems.value.filter((item) => item?.id !== id);
  persist(items);
}

export function updateEstimate(id: string, partial: any) {
  if (!id || !partial) return null;
  const items = historyItems.value.map((item) => {
    if (item?.id !== id) return item;
    const merged: any = {
      ...item,
      updatedAt: new Date().toISOString()
    };
    if (partial.client) merged.client = { ...(item.client || {}), ...partial.client };
    if (partial.comment != null) merged.comment = partial.comment;
    if (partial.status != null) merged.status = partial.status;
    if (partial.bookingAt !== undefined) merged.bookingAt = partial.bookingAt;
    return merged;
  });
  persist(items);
  return items.find((item) => item?.id === id) || null;
}

export function clearHistory() {
  persist([]);
}

export function useHistoryStore() {
  return {
    historyItems,
    loadHistory,
    saveEstimate,
    updateEstimate,
    deleteEstimate,
    clearHistory
  };
}
