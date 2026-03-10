/**
 * Поиск клиента по телефону/имени в истории записей DentMetric.
 * Нормализация, поиск, агрегация — PDF стр. 4-6: «Система помнит, но не вмешивается».
 */

export interface HistoryRecord {
  id?: string;
  clientName?: string;
  clientPhone?: string;
  /** Нормализованная структура store: client.phone, client.name */
  client?: { name?: string; phone?: string; company?: string; brand?: string; model?: string; [k: string]: unknown };
  date?: string;
  createdAt?: string;
  status?: string;
  totalPrice?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ClientAggregation {
  totalVisits: number;
  lastVisitDate: string | null;
  avgCompletedPrice: number | null;
  allRecords: HistoryRecord[];
}

export interface PostSaveAnalytics {
  visitNumber: number;
  avgPriceChange: number | null;
  message: string;
}

/** Поля клиента для автоподстановки (только клиентские данные, не расчётные) */
export interface ClientFields {
  clientName?: string;
  clientPhone?: string;
  clientCompany?: string;
  carBrand?: string;
  carModel?: string;
  carPlate?: string;
  inspectDate?: string;
  inspectTime?: string;
}

/**
 * Извлечь клиентские поля из последней записи для автоподстановки.
 * Источник: allRecords[0] (последняя по дате). Поддержка flat и client.*.
 */
export function extractClientFields(records: HistoryRecord[]): ClientFields | null {
  try {
    if (!Array.isArray(records) || records.length === 0) return null;

    const latest = records[0];
    if (!latest || typeof latest !== 'object') return null;

    const safe = (v: unknown): string | null =>
      typeof v === 'string' && v.trim() ? v.trim() : null;

    const c = latest.client as Record<string, unknown> | undefined;
    const name = safe(latest.clientName ?? c?.name);
    const phone = safe(latest.clientPhone ?? c?.phone);
    const company = safe(latest.clientCompany ?? c?.company);
    const brand = safe(latest.carBrand ?? c?.brand);
    const model = safe(latest.carModel ?? c?.model);
    const plate = safe(latest.carPlate ?? c?.plate);
    const date = safe(latest.inspectDate ?? c?.date);
    const time = safe(latest.inspectTime ?? c?.time);

    const fields: ClientFields = {};
    if (name) fields.clientName = name;
    if (phone) fields.clientPhone = phone;
    if (company) fields.clientCompany = company;
    if (brand) fields.carBrand = brand;
    if (model) fields.carModel = model;
    if (plate) fields.carPlate = plate;
    if (date) fields.inspectDate = date;
    if (time) fields.inspectTime = time;

    return Object.keys(fields).length > 0 ? fields : null;
  } catch {
    return null;
  }
}

/**
 * Применить извлечённые поля клиента к форме (estimateDraft).
 * Только клиентские поля, расчётные не трогаем.
 */
export function applyClientFields(draft: Record<string, unknown>, fields: ClientFields): void {
  if (!draft || typeof draft !== 'object') return;
  if (fields.clientName != null) draft.clientName = fields.clientName;
  if (fields.clientPhone != null) draft.clientPhone = fields.clientPhone;
  if (fields.clientCompany != null) draft.clientCompany = fields.clientCompany;
  if (fields.carBrand != null) draft.carBrand = fields.carBrand;
  if (fields.carModel != null) draft.carModel = fields.carModel;
  if (fields.carPlate != null) draft.carPlate = fields.carPlate;
  if (fields.inspectDate != null) draft.inspectDate = fields.inspectDate;
  if (fields.inspectTime != null) draft.inspectTime = fields.inspectTime;
}

/** Извлечь телефон записи (поддержка client.phone и clientPhone) */
function getRecordPhone(r: HistoryRecord): string {
  try {
    return String(r?.clientPhone ?? r?.client?.phone ?? '').trim();
  } catch {
    return '';
  }
}

/** Извлечь имя записи */
function getRecordName(r: HistoryRecord): string {
  try {
    return String(r?.clientName ?? r?.client?.name ?? '').trim();
  } catch {
    return '';
  }
}

/** Извлечь дату записи (createdAt или date) */
function getRecordDate(r: HistoryRecord): string | null {
  try {
    const d = r?.createdAt ?? r?.date;
    return d ? String(d) : null;
  } catch {
    return null;
  }
}

/** Извлечь сумму записи (total или totalPrice) */
function getRecordTotal(r: HistoryRecord): number | null {
  try {
    const v = r?.total ?? r?.totalPrice;
    if (typeof v === 'number' && !isNaN(v) && v > 0) return v;
    return null;
  } catch {
    return null;
  }
}

/**
 * Нормализация телефона:
 * - убрать пробелы, скобки, дефисы, плюс
 * - привести 8XXX и +7XXX к формату 7XXX
 */
export function normalizePhone(phone: string): string {
  const digits = String(phone || '').replace(/[\s()\-+]/g, '').replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) {
    return '7' + digits.slice(1);
  }
  if (digits.startsWith('7') && digits.length >= 11) return digits;
  return digits;
}

/**
 * Проверить что телефон содержит достаточно цифр для поиска
 * (минимум 5 значимых цифр после нормализации)
 */
export function isPhoneSearchable(phone: string): boolean {
  return normalizePhone(phone).length >= 5;
}

/**
 * Найти все записи клиента по телефону (точное и частичное)
 * @returns { exact: HistoryRecord[], partial: HistoryRecord[] }
 */
export function searchClientByPhone(
  phone: string,
  allRecords: HistoryRecord[]
): { exact: HistoryRecord[]; partial: HistoryRecord[] } {
  const normalized = normalizePhone(phone);
  if (normalized.length < 5) return { exact: [], partial: [] };

  const exact: HistoryRecord[] = [];
  const partial: HistoryRecord[] = [];

  for (const record of allRecords) {
    try {
      const recPhone = getRecordPhone(record);
      if (!recPhone) continue;
      const recNorm = normalizePhone(recPhone);
      if (recNorm === normalized) {
        exact.push(record);
      } else if (recNorm.length >= normalized.length && recNorm.slice(0, normalized.length) === normalized) {
        partial.push(record);
      } else if (normalized.length >= recNorm.length && normalized.slice(0, recNorm.length) === recNorm) {
        partial.push(record);
      }
    } catch {
      /* битая запись — пропустить тихо */
    }
  }
  return { exact, partial };
}

/**
 * Найти записи по имени (fuzzy, case-insensitive, минимум 2 символа)
 */
export function searchClientByName(
  name: string,
  allRecords: HistoryRecord[]
): HistoryRecord[] {
  if (!name || String(name).trim().length < 2) return [];
  const query = String(name).trim().toLowerCase();
  return allRecords.filter((r) => {
    try {
      return getRecordName(r).toLowerCase().includes(query);
    } catch {
      return false;
    }
  });
}

/**
 * Проверить статус "Выполнено" с учётом всех вариантов написания
 */
function isCompletedStatus(status?: string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'выполнено' || s === 'done' || s === 'completed' || s === 'выполнен';
}

/**
 * Агрегировать данные клиента из списка записей
 */
export function aggregateClientData(records: HistoryRecord[]): ClientAggregation {
  const sorted = [...records]
    .filter((r) => getRecordDate(r))
    .sort((a, b) => {
      try {
        const da = new Date(getRecordDate(a)!).getTime();
        const db = new Date(getRecordDate(b)!).getTime();
        return db - da;
      } catch {
        return 0;
      }
    });

  const completedRecords = records.filter((r) => {
    try {
      return isCompletedStatus(r?.status);
    } catch {
      return false;
    }
  });

  const prices = completedRecords
    .map((r) => getRecordTotal(r))
    .filter((p): p is number => typeof p === 'number' && p > 0);

  const avgPrice =
    prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : null;

  return {
    totalVisits: records.length,
    lastVisitDate: sorted[0] ? getRecordDate(sorted[0]) : null,
    avgCompletedPrice: avgPrice,
    allRecords: sorted
  };
}

/**
 * Форматировать дату для отображения
 */
export function formatVisitDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch {
    return dateStr;
  }
}

/**
 * Форматировать сумму
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  return Number(price).toLocaleString('ru-RU') + ' ₽';
}

/**
 * Вычислить аналитику после сохранения новой записи
 */
export function calcPostSaveAnalytics(
  newPrice: number,
  previousRecords: HistoryRecord[]
): PostSaveAnalytics {
  const visitNumber = previousRecords.length + 1;

  const completedPrices = previousRecords
    .filter((r) => isCompletedStatus(r?.status))
    .map((r) => getRecordTotal(r))
    .filter((p): p is number => typeof p === 'number' && p > 0);

  let avgPriceChange: number | null = null;
  if (completedPrices.length > 0 && newPrice > 0) {
    const prevAvg = completedPrices.reduce((s, p) => s + p, 0) / completedPrices.length;
    avgPriceChange = Math.round(((newPrice - prevAvg) / prevAvg) * 100);
  }

  let message = `Это ${visitNumber}-е обращение клиента`;
  if (avgPriceChange !== null) {
    const sign = avgPriceChange >= 0 ? 'вырос' : 'снизился';
    message += `. Средний чек ${sign} на ${Math.abs(avgPriceChange)}%`;
  }

  return { visitNumber, avgPriceChange, message };
}
