/**
 * Pure analytics helpers — no I/O. Feeds on history + bookings arrays from stores.
 */

import { STATUS_DONE } from '@/features/history/historyStore';

export type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export interface DateRange {
  from: Date;
  to: Date;
}

export function getPeriodRange(period: PeriodFilter): DateRange {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  switch (period) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case 'month':
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;
    case 'year':
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    case 'all':
      from.setFullYear(2020, 0, 1);
      from.setHours(0, 0, 0, 0);
      break;
  }
  return { from, to };
}

/** Parse YYYY-MM-DD as local noon to avoid UTC day shift */
function toRangeDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const t = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function inRange(dateStr: string, range: DateRange): boolean {
  const d = toRangeDate(dateStr);
  if (!d) return false;
  return d >= range.from && d <= range.to;
}

function recordDateForFilter(r: Record<string, unknown>): string {
  const created = r.createdAt != null ? String(r.createdAt) : '';
  if (created) return created;
  return '';
}

function bookingDateForFilter(b: Record<string, unknown>): string {
  if (b.date != null && String(b.date).trim()) return String(b.date);
  if (b.createdAt != null) return String(b.createdAt);
  return '';
}

function recordAmount(r: Record<string, unknown>): number {
  const manual = r.manualAdjustedPrice;
  if (manual != null && Number.isFinite(Number(manual))) return Number(manual);
  const t = r.total;
  if (t != null && Number.isFinite(Number(t))) return Number(t);
  const dm = r.dmCalculatedPrice;
  if (dm != null && Number.isFinite(Number(dm))) return Number(dm);
  return 0;
}

function prepaymentAmount(r: Record<string, unknown>): number {
  const p = r.prepayment;
  if (p && typeof p === 'object' && p !== null && 'amount' in p) {
    const n = Number((p as { amount?: unknown }).amount);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// ============================================================
// MASTER STATS
// ============================================================

export interface MasterStats {
  estimatesCount: number;
  bookingsCount: number;
  completedCount: number;
  potentialRevenue: number;
  actualRevenue: number;
  prepaymentTotal: number;
  avgTicket: number;
  avgEstimate: number;
  conversionRate: number;
  showUpRate: number;
  totalRepairHours: number;
  avgRepairHours: number;
  topElements: Array<{ element: string; count: number }>;
  weeklyRevenue: Array<{ week: string; amount: number }>;
}

function isHistoryCompleted(status: string): boolean {
  return status === STATUS_DONE || status === 'done' || status === 'paid' || status === 'completed';
}

export function computeMasterStats(
  records: unknown[],
  bookings: unknown[],
  range: DateRange,
  masterId?: string
): MasterStats {
  const filteredRecords = records.filter((raw) => {
    const r = raw as Record<string, unknown>;
    const ds = recordDateForFilter(r);
    const inDate = inRange(ds, range);
    const mid = masterId;
    const matchMaster = mid
      ? r.masterId === mid || r.masterName === mid || String(r.master || '') === mid
      : true;
    return inDate && matchMaster;
  }) as Record<string, unknown>[];

  const filteredBookings = bookings.filter((raw) => {
    const b = raw as Record<string, unknown>;
    const ds = bookingDateForFilter(b);
    const inDate = inRange(ds, range);
    const matchMaster = masterId ? b.masterId === masterId : true;
    return inDate && matchMaster;
  }) as Record<string, unknown>[];

  const estimatesCount = filteredRecords.length;
  const bookingsCount = filteredBookings.length;

  const completedRecords = filteredRecords.filter((r) =>
    isHistoryCompleted(String(r.status ?? ''))
  );

  const historyDoneRevenue = completedRecords.reduce((sum, r) => sum + recordAmount(r), 0);

  const bookingDoneRevenue = filteredBookings
    .filter((b) => ['done', 'paid'].includes(String(b.status ?? '')))
    .reduce((sum, b) => {
      const pay = b.payment as { total?: number } | undefined;
      const total = pay && Number.isFinite(Number(pay.total)) ? Number(pay.total) : 0;
      const est = Number(b.estimateTotal);
      return sum + (total > 0 ? total : Number.isFinite(est) ? est : 0);
    }, 0);

  const actualRevenue = historyDoneRevenue + bookingDoneRevenue;
  const completedCount = completedRecords.length;

  const potentialRevenue = filteredRecords.reduce((sum, r) => sum + recordAmount(r), 0);

  const prepaymentTotal = filteredRecords.reduce((sum, r) => sum + prepaymentAmount(r), 0);

  const avgTicket =
    completedCount > 0 ? Math.round(historyDoneRevenue / completedCount) : 0;
  const avgEstimate = estimatesCount > 0 ? Math.round(potentialRevenue / estimatesCount) : 0;

  const conversionRate =
    estimatesCount > 0 ? Math.round((completedCount / estimatesCount) * 100) : 0;

  const scheduledBookings = filteredBookings.filter((b) =>
    ['done', 'paid', 'in_progress', 'no_show'].includes(String(b.status ?? ''))
  );
  const arrivedBookings = scheduledBookings.filter((b) =>
    ['done', 'paid', 'in_progress'].includes(String(b.status ?? ''))
  );
  const showUpRate =
    scheduledBookings.length > 0
      ? Math.round((arrivedBookings.length / scheduledBookings.length) * 100)
      : 0;

  const repairHours = filteredRecords
    .map((r) => Number(r.recordRepairTimeHours))
    .filter((h) => Number.isFinite(h) && h > 0);
  const totalRepairHours = repairHours.reduce((s, h) => s + h, 0);
  const avgRepairHours =
    repairHours.length > 0 ? totalRepairHours / repairHours.length : 0;

  const elementCounts: Record<string, number> = {};
  for (const r of filteredRecords) {
    const dents = r.dents as { items?: unknown[] } | undefined;
    const snap = r.lineItemsSnapshot as unknown[] | undefined;
    const items = Array.isArray(dents?.items) ? dents!.items! : Array.isArray(snap) ? snap : [];
    for (const item of items) {
      const row = item as Record<string, unknown>;
      const el = String(row.panelElement ?? row.element ?? 'Не указан');
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    }
  }
  const topElements = Object.entries(elementCounts)
    .map(([element, count]) => ({ element, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const weeklyRevenue: Array<{ week: string; amount: number }> = [];
  const allRecs = records as Record<string, unknown>[];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekRecords = allRecs.filter((r) => {
      const d = new Date(String(r.createdAt ?? ''));
      return (
        Number.isFinite(d.getTime()) &&
        d >= weekStart &&
        d <= weekEnd &&
        isHistoryCompleted(String(r.status ?? ''))
      );
    });
    const amount = weekRecords.reduce((sum, r) => sum + recordAmount(r), 0);
    weeklyRevenue.push({
      week: weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      amount,
    });
  }

  return {
    estimatesCount,
    bookingsCount,
    completedCount,
    potentialRevenue,
    actualRevenue,
    prepaymentTotal,
    avgTicket,
    avgEstimate,
    conversionRate,
    showUpRate,
    totalRepairHours,
    avgRepairHours,
    topElements,
    weeklyRevenue,
  };
}

// ============================================================
// CLIENT PROFILE
// ============================================================

export interface ClientProfile {
  phone: string;
  name?: string;
  company?: string;
  brand?: string;
  model?: string;
  plate?: string;
  clientMood?: string | null;
  totalVisits: number;
  completedVisits: number;
  lifetimeValue: number;
  avgTicket: number;
  lastVisitDate?: string;
  firstVisitDate?: string;
  returnFrequencyDays?: number;
  noShowCount: number;
  noShowRate: number;
  loyaltyBadge?: 'vip' | 'regular' | 'new' | 'at_risk';
  loyaltyLabel: string;
  allRecords: Record<string, unknown>[];
}

export function computeClientProfile(
  phone: string,
  records: unknown[]
): ClientProfile | null {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length < 4) return null;

  const clientRecords = records.filter((raw) => {
    const r = raw as Record<string, unknown>;
    const c = r.client as Record<string, unknown> | undefined;
    const rPhone = String(c?.phone ?? r.clientPhone ?? '').replace(/\D/g, '');
    return rPhone === normalizedPhone && rPhone.length >= 4;
  }) as Record<string, unknown>[];

  if (clientRecords.length === 0) return null;

  const sorted = [...clientRecords].sort(
    (a, b) =>
      new Date(String(b.createdAt ?? 0)).getTime() -
      new Date(String(a.createdAt ?? 0)).getTime()
  );

  const latest = sorted[0];
  const client = (latest.client as Record<string, unknown>) || {};

  const completed = clientRecords.filter((r) => isHistoryCompleted(String(r.status ?? '')));
  const noShows = clientRecords.filter((r) => String(r.status ?? '') === 'no_show');

  const lifetimeValue = completed.reduce((s, r) => s + recordAmount(r), 0);
  const avgTicket =
    completed.length > 0 ? Math.round(lifetimeValue / completed.length) : 0;

  let returnFrequencyDays: number | undefined;
  if (sorted.length >= 2) {
    const dates = sorted
      .map((r) => new Date(String(r.createdAt ?? 0)).getTime())
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let j = 1; j < dates.length; j++) {
      gaps.push((dates[j] - dates[j - 1]) / (1000 * 60 * 60 * 24));
    }
    returnFrequencyDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
  }

  let loyaltyBadge: ClientProfile['loyaltyBadge'];
  let loyaltyLabel = '';

  if (lifetimeValue >= 50000 || clientRecords.length >= 5) {
    loyaltyBadge = 'vip';
    loyaltyLabel = 'VIP клиент';
  } else if (clientRecords.length >= 3) {
    loyaltyBadge = 'regular';
    loyaltyLabel = 'Постоянный';
  } else if (clientRecords.length === 1) {
    loyaltyBadge = 'new';
    loyaltyLabel = 'Новый';
  }

  const lastVisit = sorted[0]?.createdAt != null ? String(sorted[0].createdAt) : undefined;
  if (lastVisit) {
    const daysSince =
      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 90 && clientRecords.length >= 2) {
      loyaltyBadge = 'at_risk';
      loyaltyLabel = 'Давно не был';
    }
  }

  const noShowRate =
    clientRecords.length > 0 ? Math.round((noShows.length / clientRecords.length) * 100) : 0;

  return {
    phone: normalizedPhone,
    name: client.name != null ? String(client.name) : undefined,
    company: client.company != null ? String(client.company) : undefined,
    brand: client.brand != null ? String(client.brand) : undefined,
    model: client.model != null ? String(client.model) : undefined,
    plate: client.plate != null ? String(client.plate) : undefined,
    clientMood:
      latest.clientMood != null && latest.clientMood !== ''
        ? String(latest.clientMood)
        : undefined,
    totalVisits: clientRecords.length,
    completedVisits: completed.length,
    lifetimeValue,
    avgTicket,
    lastVisitDate: sorted[0]?.createdAt != null ? String(sorted[0].createdAt) : undefined,
    firstVisitDate:
      sorted[sorted.length - 1]?.createdAt != null
        ? String(sorted[sorted.length - 1].createdAt)
        : undefined,
    returnFrequencyDays,
    noShowCount: noShows.length,
    noShowRate,
    loyaltyBadge,
    loyaltyLabel,
    allRecords: sorted,
  };
}

// ============================================================
// SALARY
// ============================================================

export interface EmployeeSalaryResult {
  employeeId: string;
  employeeName: string;
  salaryType: 'percent' | 'fixed';
  salaryValue: number;
  completedCount: number;
  completedRevenue: number;
  earnedAmount: number;
  period: string;
}

export function computeEmployeeSalary(
  employee: {
    id: string;
    name: string;
    salary: { type: 'percent' | 'fixed'; value: number };
  },
  bookings: unknown[],
  range: DateRange
): EmployeeSalaryResult {
  const empBookings = bookings.filter((raw) => {
    const b = raw as Record<string, unknown>;
    const ds = bookingDateForFilter(b);
    if (!inRange(ds, range)) return false;
    if (!['done', 'paid'].includes(String(b.status ?? ''))) return false;
    return b.masterId === employee.id;
  }) as Record<string, unknown>[];

  const completedRevenue = empBookings.reduce((sum, b) => {
    const pay = b.payment as { total?: number } | undefined;
    const t = pay && Number.isFinite(Number(pay.total)) ? Number(pay.total) : 0;
    const est = Number(b.estimateTotal);
    return sum + (t > 0 ? t : Number.isFinite(est) ? est : 0);
  }, 0);

  const earnedAmount =
    employee.salary.type === 'percent'
      ? Math.round((completedRevenue * employee.salary.value) / 100)
      : Math.round(employee.salary.value);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    salaryType: employee.salary.type,
    salaryValue: employee.salary.value,
    completedCount: empBookings.length,
    completedRevenue,
    earnedAmount,
    period: `${range.from.toLocaleDateString('ru-RU')} – ${range.to.toLocaleDateString('ru-RU')}`,
  };
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ru-RU')}\u00a0\u20bd`;
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatRepairTime(hours: number): string {
  if (!hours || hours <= 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
