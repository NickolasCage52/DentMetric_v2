import { ref } from 'vue';
export const RECORD_SCHEMA_VERSION = 2;
export const HISTORY_SCHEMA_VERSION = 1;
export const STORAGE_KEY = `dentmetric_history_v${HISTORY_SCHEMA_VERSION}`;
const MAX_STORAGE_BYTES = 4_500_000;

/** Новые статусы для фильтрации и метрик (schema v2) */
export const STATUS_ESTIMATE = 'estimate';
export const STATUS_SCHEDULED = 'scheduled';
export const STATUS_DONE = 'done';
export const STATUS_REJECTED = 'rejected';

/** Маппинг старой схемы → новая */
const OLD_TO_NEW_STATUS: Record<string, string> = {
  no_booking: STATUS_ESTIMATE,
  booked: STATUS_SCHEDULED,
  done: STATUS_DONE,
  rejected: STATUS_REJECTED,
  estimate: STATUS_ESTIMATE,
  scheduled: STATUS_SCHEDULED,
};

const KNOWN_STATUSES_NEW = [STATUS_ESTIMATE, STATUS_SCHEDULED, STATUS_DONE, STATUS_REJECTED] as const;

const historyItems = ref<any[]>([]);
const historyLoaded = ref(false);

function safeParse(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[DentMetric] history parse failed', e);
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

export function generateRecordId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dm_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Нормализует сырую запись к схеме v2.
 * Гарантии: id, createdAt, total, status (estimate|scheduled|done|rejected),
 * client, dents, attachments, schemaVersion.
 */
// AUDIT: OK — normalizeRecord (normalizeHistoryRecord) подставляет дефолты для id, schemaVersion, createdAt, client, dents, attachments, status, comment, master
export function normalizeHistoryRecord(raw: any): any | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const normalized: Record<string, unknown> = { ...raw };
    if (!normalized.id || typeof normalized.id !== 'string') {
      normalized.id = generateRecordId();
    }
    const schemaVer = raw.schemaVersion ?? 1;
    normalized.schemaVersion = RECORD_SCHEMA_VERSION;

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

    const total = raw.total ?? raw.totalPrice ?? raw.totalEstimate;
    normalized.total = typeof total === 'string' ? parseFloat(total) || 0 : (Number(total) || 0);
    if (normalized.rawTotal == null) normalized.rawTotal = normalized.total;
    // Manual price overlay (Rule 3): preserve DM calculation, allow user override
    const dmPrice = raw.dmCalculatedPrice ?? raw.total ?? raw.totalPrice ?? raw.totalEstimate;
    normalized.dmCalculatedPrice = typeof dmPrice === 'string' ? parseFloat(dmPrice) || 0 : (Number(dmPrice) || 0);
    normalized.manualAdjustedPrice = raw.manualAdjustedPrice != null ? (typeof raw.manualAdjustedPrice === 'string' ? parseFloat(raw.manualAdjustedPrice) : Number(raw.manualAdjustedPrice)) : null;
    normalized.isPriceManuallyAdjusted = raw.isPriceManuallyAdjusted === true;
    if (normalized.isPriceManuallyAdjusted && normalized.manualAdjustedPrice != null) {
      normalized.total = Number(normalized.manualAdjustedPrice) || normalized.total;
    }
    if (typeof normalized.rawTotal === 'string') normalized.rawTotal = parseFloat(normalized.rawTotal as string) || 0;
    if (normalized.totalActual == null) normalized.totalActual = null;

    let status = String(normalized.status ?? 'estimate');
    if (OLD_TO_NEW_STATUS[status]) status = OLD_TO_NEW_STATUS[status];
    normalized.status = KNOWN_STATUSES_NEW.includes(status as any) ? status : STATUS_ESTIMATE;

    if (!normalized.client || typeof normalized.client !== 'object') {
      normalized.client = {
        name: raw.clientName ?? (raw.client && (raw.client as any).name) ?? 'Клиент без имени',
        phone: raw.clientPhone ?? (raw.client && (raw.client as any).phone) ?? '',
        company: raw.clientCompany ?? (raw.client && (raw.client as any).company) ?? '',
        brand: raw.carBrand ?? (raw.client && (raw.client as any).brand) ?? '',
        model: raw.carModel ?? (raw.client && (raw.client as any).model) ?? '',
        plate: raw.carPlate ?? (raw.client && (raw.client as any).plate) ?? '',
        date: raw.inspectDate ?? (raw.client && (raw.client as any).date) ?? '',
        time: raw.inspectTime ?? (raw.client && (raw.client as any).time) ?? '',
      };
    } else {
      const c = normalized.client as Record<string, any>;
      if (c.name == null || typeof c.name !== 'string') c.name = 'Клиент без имени';
      if (c.phone == null) c.phone = '';
      else if (typeof c.phone !== 'string') c.phone = String(c.phone);

      const pickStr = (v: unknown) => (v == null ? '' : String(v));
      if (!pickStr(c.name).trim() && raw.clientName != null) c.name = String(raw.clientName);
      if (!pickStr(c.phone).trim() && raw.clientPhone != null) c.phone = String(raw.clientPhone);

      if (!pickStr(c.company).trim()) {
        c.company = pickStr(c.clientCompany ?? raw.clientCompany);
      } else {
        c.company = pickStr(c.company);
      }
      if (!pickStr(c.brand).trim()) {
        c.brand = pickStr(c.carBrand ?? raw.carBrand);
      } else {
        c.brand = pickStr(c.brand);
      }
      if (!pickStr(c.model).trim()) {
        c.model = pickStr(c.carModel ?? raw.carModel);
      } else {
        c.model = pickStr(c.model);
      }
      if (!pickStr(c.plate).trim()) {
        c.plate = pickStr(c.carPlate ?? raw.carPlate);
      } else {
        c.plate = pickStr(c.plate);
      }
      if (!pickStr(c.date).trim()) c.date = pickStr(c.inspectDate ?? raw.inspectDate);
      if (!pickStr(c.time).trim()) c.time = pickStr(c.inspectTime ?? raw.inspectTime);
    }

    if (normalized.comment == null) normalized.comment = '';
    if (normalized.attachments == null || !Array.isArray(normalized.attachments)) {
      normalized.attachments = [];
    }
    if (normalized.recordAttachments == null || !Array.isArray(normalized.recordAttachments)) {
      normalized.recordAttachments = raw.recordAttachments ?? raw.attachments ?? [];
    }
    if (normalized.photoAssets == null || !Array.isArray(normalized.photoAssets)) {
      normalized.photoAssets = [];
    }
    if (normalized.master == null) normalized.master = '';

    if (!normalized.dents || typeof normalized.dents !== 'object') {
      const legacyDents = raw.dent != null ? [raw.dent] : (Array.isArray(raw.quickDents) ? raw.quickDents : []);
      normalized.dents = { count: legacyDents.length, items: Array.isArray(legacyDents) ? legacyDents : [] };
    } else {
      const d = normalized.dents as Record<string, unknown>;
      if (!Array.isArray(d.items)) d.items = [];
    }

    for (const dent of (normalized.dents as any)?.items ?? []) {
      if (!dent || typeof dent !== 'object') continue;
      // Business rule: Stripe tables ONLY when user explicitly chose Полоса/Царапина.
      // Do NOT infer strip from aspect ratio — when ambiguous, use circle/oval.
      // Only correct strip→circle when ratio 1:1 (square dimensions).
      const w = Number(dent.bboxMm?.width ?? dent.sizeLengthMm) || 0;
      const h = Number(dent.bboxMm?.height ?? dent.sizeWidthMm) || 0;
      const curType = dent.type ?? dent.shape;
      if (curType === 'strip' && w > 0 && h > 0) {
        const L = Math.max(w, h);
        const H = Math.min(w, h);
        const ratio = H > 0 ? L / H : 1;
        if (Math.abs(ratio - 1) < 0.001) {
          dent.type = 'circle';
          dent.shape = 'circle';
        }
      } else if (!curType || curType === 'circle' || curType === 'strip') {
        // Preserve existing type; do not override to strip based on ratio
      }
      if (dent.photoAssetKey == null) dent.photoAssetKey = null;
    }

    if (normalized.mode == null) normalized.mode = 'quick';
    if (normalized.discountPercent == null) normalized.discountPercent = 0;
    else normalized.discountPercent = Number(normalized.discountPercent) || 0;

    normalized.clientMood = normalized.clientMood ?? null;
    normalized.orderDiscount = normalized.orderDiscount ?? { enabled: false, value: 0 };

    if (normalized.lineItemsSnapshot == null && raw.lineItemsSnapshot != null) {
      normalized.lineItemsSnapshot = raw.lineItemsSnapshot;
    }
    if (normalized.calculatedAt == null) normalized.calculatedAt = raw.calculatedAt ?? raw.createdAt ?? null;

    const dentsObj = normalized.dents as Record<string, unknown>;
    if (dentsObj?.items && Array.isArray(dentsObj.items)) {
      (dentsObj.items as any[]) = (dentsObj.items as any[]).map((d) => {
        if (!d || typeof d !== 'object') return d;
        return { ...d, dentDiscount: d.dentDiscount ?? { enabled: false, value: 0 } };
      });
    }

    // Правка 11 — предоплата
    if (!normalized.prepayment || typeof normalized.prepayment !== 'object') {
      normalized.prepayment = { amount: 0, method: null };
    } else {
      const p = normalized.prepayment as Record<string, unknown>;
      normalized.prepayment = {
        amount: Number(p.amount) || 0,
        method: ['cash', 'transfer', 'card'].includes(String(p.method || '')) ? p.method : null,
      };
    }

    if (!Array.isArray((normalized as any).additionalWorks)) {
      (normalized as any).additionalWorks = [];
    }
    if ((normalized as any).masterName == null) (normalized as any).masterName = '';
    if ((normalized as any).recordRepairTimeHours === undefined) {
      (normalized as any).recordRepairTimeHours = raw.recordRepairTimeHours ?? null;
    }

    return normalized as any;
  } catch (_e) {
    if (import.meta.env?.DEV) console.warn('[DentMetric] normalizeHistoryRecord threw', _e);
    return null;
  }
}

// AUDIT: OK — дубли id получают crypto.randomUUID
function dedupeIds(items: any[]): any[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    if (!item || typeof item !== 'object') return item;
    let id = item.id != null ? String(item.id) : generateRecordId();
    if (seen.has(id)) id = generateRecordId();
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
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('[DentMetric] History save failed:', e);
    return;
  }
  historyItems.value = items;
}

// AUDIT: OK — safeLoadHistory/safeSaveHistory wrap loadHistory/persist with STORAGE_KEY
/** Безопасная загрузка: try-catch JSON.parse, фильтрация битых записей */
export function safeLoadHistory(): any[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = migrateHistory(safeParse(raw));
  const items: any[] = [];
  for (const item of Array.isArray(parsed?.items) ? parsed.items : []) {
    try {
      const norm = normalizeHistoryRecord(item);
      if (norm && norm.id) items.push(norm);
    } catch (_e) {
      /* AUDIT: OK — битые записи фильтруются */
    }
  }
  return dedupeIds(items);
}

/** Безопасное сохранение: try-catch localStorage.setItem */
export function safeSaveHistory(records: any[]): boolean {
  try {
    const payload = { version: HISTORY_SCHEMA_VERSION, items: records };
    let serialized = JSON.stringify(payload);
    if (serialized.length > MAX_STORAGE_BYTES) {
      const trimmed = [...records];
      while (trimmed.length > 0 && (serialized = JSON.stringify({ version: HISTORY_SCHEMA_VERSION, items: trimmed })).length > MAX_STORAGE_BYTES) {
        trimmed.pop();
      }
      records = trimmed;
    }
    localStorage.setItem(STORAGE_KEY, serialized);
    historyItems.value = records;
    historyLoaded.value = true;
    return true;
  } catch (e) {
    console.error('[DentMetric] History save failed:', e);
    return false;
  }
}

/** Alias для совместимости с devAudit */
export const normalizeRecord = normalizeHistoryRecord;

/**
 * Безопасная загрузка истории: не падает при битых записях/JSON.
 */
export function loadHistory(forceReload = false) {
  if (historyLoaded.value && !forceReload) return historyItems.value;
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = migrateHistory(safeParse(raw));
  const items: any[] = [];
  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  for (const item of rawItems) {
    try {
      const norm = normalizeHistoryRecord(item);
      if (norm && norm.id) items.push(norm);
      else if (import.meta.env?.DEV) console.warn('[DentMetric] skipping malformed record', item);
    } catch (_e) {
      if (import.meta.env?.DEV) console.warn('[DentMetric] normalize record error', item);
    }
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

/** Маппинг статусов для входящих данных (сохранение): booked → scheduled при save */
function mapStatusForSave(status: string | undefined): string {
  if (!status) return STATUS_ESTIMATE;
  if (OLD_TO_NEW_STATUS[status]) return OLD_TO_NEW_STATUS[status];
  return KNOWN_STATUSES_NEW.includes(status as any) ? status : STATUS_ESTIMATE;
}

export function saveEstimate(estimateDraft: any) {
  if (!estimateDraft) return null;
  const id = estimateDraft.id || generateRecordId();
  const status = mapStatusForSave(estimateDraft.status ?? 'estimate');
  const raw = {
    ...estimateDraft,
    id,
    createdAt: estimateDraft.createdAt || new Date().toISOString(),
    status,
    attachments: estimateDraft.attachments ?? []
  };
  const cloned = JSON.parse(JSON.stringify(raw));
  const norm = normalizeHistoryRecord(cloned);
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
  return updateEstimate(id, { status: mapStatusForSave(status), bookingAt: bookingAt ?? null });
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
    if (partial.status != null) merged.status = mapStatusForSave(partial.status);
    if (partial.bookingAt !== undefined) merged.bookingAt = partial.bookingAt;
    if (partial.attachments !== undefined) merged.attachments = partial.attachments;
    if (partial.recordAttachments !== undefined) merged.recordAttachments = partial.recordAttachments;
    if (partial.clientMood !== undefined) merged.clientMood = partial.clientMood;
    if (partial.orderDiscount !== undefined) merged.orderDiscount = partial.orderDiscount;
    if (partial.discountPercent !== undefined) merged.discountPercent = Number(partial.discountPercent) || 0;
    if (partial.dents !== undefined) merged.dents = partial.dents;
    if (partial.prepayment !== undefined) merged.prepayment = partial.prepayment;
    if (partial.dmCalculatedPrice !== undefined) merged.dmCalculatedPrice = partial.dmCalculatedPrice;
    if (partial.manualAdjustedPrice !== undefined) merged.manualAdjustedPrice = partial.manualAdjustedPrice;
    if (partial.isPriceManuallyAdjusted !== undefined) merged.isPriceManuallyAdjusted = partial.isPriceManuallyAdjusted;
    if (merged.isPriceManuallyAdjusted && merged.manualAdjustedPrice != null) {
      merged.total = Number(merged.manualAdjustedPrice) || merged.total;
    }
    return merged;
  });
  persist(items);
  return items.find((item) => item?.id === id) || null;
}

export function clearHistory() {
  persist([]);
}

/** Возвращает статус для отображения (поддержка старого UI: booked/done) */
export function getDisplayStatus(record: any): 'no_booking' | 'booked' | 'done' {
  const s = record?.status;
  if (s === STATUS_SCHEDULED) return 'booked';
  if (s === STATUS_DONE) return 'done';
  return 'no_booking';
}

export function useHistoryStore() {
  return {
    historyItems,
    loadHistory,
    saveEstimate,
    updateEstimate,
    deleteEstimate,
    clearHistory,
    getDisplayStatus
  };
}
