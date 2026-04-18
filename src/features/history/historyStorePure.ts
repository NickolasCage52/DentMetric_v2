export const RECORD_SCHEMA_VERSION = 2;
export const HISTORY_SCHEMA_VERSION = 1;
export const STORAGE_KEY = `dentmetric_history_v${HISTORY_SCHEMA_VERSION}`;
export const MAX_STORAGE_BYTES = 4_500_000;

export class StorageFullError extends Error {
  constructor(
    public usedBytes: number,
    public maxBytes: number
  ) {
    super(`Storage full: ${usedBytes} bytes used, ${maxBytes} bytes maximum`);
    this.name = 'StorageFullError';
  }
}

export interface HistorySaveOptions {
  allowEviction?: boolean;
}

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

    let rc: 'RU' | 'BY' | null =
      raw.recordCountry === 'BY' || raw.recordCountry === 'RU' ? raw.recordCountry : null;
    const rcurRaw =
      raw.recordCurrency === 'BYN' || raw.recordCurrency === 'RUB' ? raw.recordCurrency : null;
    if (rc == null && rcurRaw === 'BYN') rc = 'BY';
    (normalized as any).recordCountry = rc ?? 'RU';
    const rcur =
      rcurRaw ?? ((normalized as any).recordCountry === 'BY' ? 'BYN' : 'RUB');
    (normalized as any).recordCurrency = rcur;

    if ((normalized as any).annotatedPhotoUrl != null) {
      (normalized as any).annotatedPhotoUrl = String((normalized as any).annotatedPhotoUrl);
    }
    if ((normalized as any).clientUpdatedAt == null || (normalized as any).clientUpdatedAt === '') {
      (normalized as any).clientUpdatedAt = String(
        (normalized as any).updatedAt || (normalized as any).createdAt || new Date().toISOString()
      );
    }

    if ((normalized as any).annotatedPhotoRef && (normalized as any).annotatedPhotoDataUrl) {
      (normalized as any).annotatedPhotoDataUrl = null;
    }
    if ((normalized as any).annotatedPhotoRef === undefined) {
      (normalized as any).annotatedPhotoRef = raw.annotatedPhotoRef ?? null;
    }
    if ((normalized as any).syncedAt === undefined) {
      (normalized as any).syncedAt = raw.syncedAt ?? null;
    }
    if ((normalized as any).serverId === undefined) {
      (normalized as any).serverId = raw.serverId ?? null;
    }
    if ((normalized as any).teamId === undefined) {
      (normalized as any).teamId = raw.teamId ?? null;
    }

    return normalized as any;
  } catch (_e) {
    if (import.meta.env?.DEV) console.warn('[DentMetric] normalizeHistoryRecord threw', _e);
    return null;
  }
}

// AUDIT: OK — дубли id получают crypto.randomUUID
export function dedupeIds(items: any[]): any[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    if (!item || typeof item !== 'object') return item;
    let id = item.id != null ? String(item.id) : generateRecordId();
    if (seen.has(id)) id = generateRecordId();
    seen.add(id);
    return { ...item, id };
  });
}

/** Запись payload в localStorage. Возвращает фактически сохранённый массив (после eviction). */
export function writeHistoryPayloadToStorage(items: any[], options: HistorySaveOptions = {}): any[] {
  const { allowEviction = false } = options;
  let rec = [...items];
  let serialized: string;
  try {
    serialized = JSON.stringify({ version: HISTORY_SCHEMA_VERSION, items: rec });
  } catch (e) {
    console.error('[DentMetric] History serialization failed:', e);
    return rec;
  }

  if (serialized.length > MAX_STORAGE_BYTES) {
    if (!allowEviction) {
      throw new StorageFullError(serialized.length, MAX_STORAGE_BYTES);
    }
    console.warn(
      `[DentMetric] Storage eviction: ${serialized.length} bytes, limit ${MAX_STORAGE_BYTES}. Removing oldest records.`
    );
    const trimmed = [...rec];
    while (
      trimmed.length > 1 &&
      JSON.stringify({ version: HISTORY_SCHEMA_VERSION, items: trimmed }).length > MAX_STORAGE_BYTES
    ) {
      trimmed.pop();
    }
    rec = trimmed;
    serialized = JSON.stringify({ version: HISTORY_SCHEMA_VERSION, items: rec });
  }

  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('[DentMetric] History save failed:', e);
    throw e;
  }
  return rec;
}

/** Чтение и нормализация истории из localStorage (как тело loadHistory без флагов). */
export function readNormalizedHistoryFromStorage(): any[] {
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
  return dedupeIds(items);
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

/**
 * Только диск (для devAudit и внешних утилит). Не обновляет Pinia.
 */
export function safeSaveHistory(records: any[], options: HistorySaveOptions = {}): boolean {
  try {
    writeHistoryPayloadToStorage(records, options);
    return true;
  } catch (e) {
    if (e instanceof StorageFullError) throw e;
    console.error('[DentMetric] History save failed:', e);
    return false;
  }
}

/** Alias для совместимости с devAudit */
export const normalizeRecord = normalizeHistoryRecord;

/** Маппинг статусов для входящих данных (сохранение): booked → scheduled при save */
export function mapStatusForSave(status: string | undefined): string {
  if (!status) return STATUS_ESTIMATE;
  if (OLD_TO_NEW_STATUS[status]) return OLD_TO_NEW_STATUS[status];
  return KNOWN_STATUSES_NEW.includes(status as any) ? status : STATUS_ESTIMATE;
}

/** Возвращает статус для отображения (поддержка старого UI: booked/done) */
export function getDisplayStatus(record: any): 'no_booking' | 'booked' | 'done' {
  const s = record?.status;
  if (s === STATUS_SCHEDULED) return 'booked';
  if (s === STATUS_DONE) return 'done';
  return 'no_booking';
}
