import { ref } from 'vue';

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

/**
 * Normalize a raw history record for backward compatibility and required fields.
 * Converts legacy single-dent records to damages array; ensures id, createdAt, totalPrice, status.
 */
export function normalizeHistoryRecord(raw: any): any | null {
  if (!raw || typeof raw !== 'object') return null;
  const normalized = { ...raw };
  if (!normalized.id) normalized.id = `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = raw.createdAt != null ? raw.createdAt : new Date().toISOString();
  normalized.createdAt = typeof createdAt === 'number' ? new Date(createdAt).toISOString() : String(createdAt);
  const total = raw.total ?? raw.totalPrice;
  normalized.total = typeof total === 'string' ? parseFloat(total) || 0 : (Number(total) || 0);
  if (normalized.rawTotal == null) normalized.rawTotal = normalized.total;
  if (typeof normalized.rawTotal === 'string') normalized.rawTotal = parseFloat(normalized.rawTotal) || 0;
  if (normalized.status == null) normalized.status = 'no_booking';
  if (!normalized.client && (raw.clientName != null || raw.clientPhone != null || raw.carBrand != null)) {
    normalized.client = {
      name: raw.clientName ?? raw.client?.name,
      phone: raw.clientPhone ?? raw.client?.phone,
      company: raw.clientCompany ?? raw.client?.company,
      brand: raw.carBrand ?? raw.client?.brand,
      model: raw.carModel ?? raw.client?.model,
      plate: raw.carPlate ?? raw.client?.plate,
      date: raw.inspectDate ?? raw.client?.date,
      time: raw.inspectTime ?? raw.client?.time
    };
  }
  if (normalized.comment == null) normalized.comment = '';
  if (!normalized.dents && (raw.dent != null || raw.quickDents != null)) {
    const legacyDents = raw.dent != null ? [raw.dent] : (Array.isArray(raw.quickDents) ? raw.quickDents : []);
    normalized.dents = { count: legacyDents.length, items: legacyDents };
  }
  if (normalized.mode == null) normalized.mode = 'quick';
  if (normalized.discountPercent == null) normalized.discountPercent = 0;
  else normalized.discountPercent = Number(normalized.discountPercent) || 0;
  return normalized;
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
  for (const item of parsed.items || []) {
    const norm = normalizeHistoryRecord(item);
    if (norm) items.push(norm);
    else if (import.meta.env?.DEV) console.warn('[history] skipping malformed record', item);
  }
  historyItems.value = items;
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
