// Журнал записи (Stage 4). Цвета — hsl(), без сырых hex в новых файлах.

export type BookingStatus =
  | 'scheduled'
  | 'in_progress'
  | 'done'
  | 'paid'
  | 'cancelled'
  | 'no_show';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface BookingPayment {
  total: number;
  paid: number;
  method?: PaymentMethod;
  paidAt?: string;
}

export interface BookingReminder {
  enabled: boolean;
  minutesBefore: number;
  sent: boolean;
}

export interface Booking {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  masterId?: string;
  masterName?: string;
  client: {
    name?: string;
    phone?: string;
    brand?: string;
    model?: string;
    plate?: string;
    isNew?: boolean;
  };
  serviceName: string;
  serviceDescription?: string;
  status: BookingStatus;
  confirmedVisit?: boolean;
  arrivedAt?: string;
  estimateId?: string;
  estimateTotal?: number;
  payment: BookingPayment;
  comment?: string;
  attachments?: string[];
  promoCode?: string;
  reminder?: BookingReminder;
  reviewRequested?: boolean;
  colorTag?: string;
  /** Облачная синхронизация (Stage 8): время последнего успешного push */
  syncedAt?: string;
}

const BOOKING_STATUSES: BookingStatus[] = [
  'scheduled',
  'in_progress',
  'done',
  'paid',
  'cancelled',
  'no_show',
];

function isBookingStatus(s: string): s is BookingStatus {
  return (BOOKING_STATUSES as string[]).includes(s);
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: 'Записан',
  in_progress: 'В работе',
  done: 'Готово',
  paid: 'Оплачено',
  cancelled: 'Отменено',
  no_show: 'Не пришёл',
};

/** Цвета в hsl для карточек и акцентов */
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  scheduled: 'hsl(228 88% 66%)',
  in_progress: 'hsl(38 92% 50%)',
  done: 'hsl(84 72% 57%)',
  paid: 'hsl(160 84% 39%)',
  cancelled: 'hsl(0 0% 53%)',
  no_show: 'hsl(4 82% 56%)',
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function generateBookingId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultBooking(
  date: string,
  startTime: string,
  masterId?: string,
  masterName?: string
): Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> {
  const [h = 9, m = 0] = startTime.split(':').map((x) => Number(x));
  const startMin = (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0);
  const endTotal = Math.min(startMin + 60, 23 * 60 + 59);
  const eh = Math.floor(endTotal / 60);
  const em = endTotal % 60;
  const endTime = `${pad2(eh)}:${pad2(em)}`;

  return {
    date,
    startTime: `${pad2(Number.isFinite(h) ? h : 9)}:${pad2(Number.isFinite(m) ? m : 0)}`,
    endTime,
    durationMinutes: 60,
    masterId,
    masterName,
    client: {},
    serviceName: 'Удаление вмятин без покраски',
    status: 'scheduled',
    payment: { total: 0, paid: 0 },
  };
}

export function normalizeBooking(raw: Record<string, unknown>): Booking {
  const st = raw.status != null ? String(raw.status) : 'scheduled';
  const status: BookingStatus = isBookingStatus(st) ? st : 'scheduled';
  const pay = raw.payment as BookingPayment | undefined;
  const clientRaw = raw.client as Booking['client'] | undefined;

  return {
    id: (raw.id as string) || generateBookingId(),
    createdAt: (raw.createdAt as string) || new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) || new Date().toISOString(),
    date: (raw.date as string) || new Date().toISOString().slice(0, 10),
    startTime: (raw.startTime as string) || '09:00',
    endTime: (raw.endTime as string) || '10:00',
    durationMinutes:
      raw.durationMinutes != null && Number.isFinite(Number(raw.durationMinutes))
        ? Number(raw.durationMinutes)
        : 60,
    masterId:
      raw.masterId != null && String(raw.masterId).trim() !== ''
        ? String(raw.masterId)
        : undefined,
    masterName: raw.masterName != null ? String(raw.masterName) : undefined,
    client: clientRaw && typeof clientRaw === 'object' ? { ...clientRaw } : {},
    serviceName: (raw.serviceName as string) || 'Удаление вмятин без покраски',
    serviceDescription: raw.serviceDescription != null ? String(raw.serviceDescription) : undefined,
    status,
    confirmedVisit: raw.confirmedVisit != null ? Boolean(raw.confirmedVisit) : false,
    arrivedAt: raw.arrivedAt != null ? String(raw.arrivedAt) : undefined,
    estimateId: raw.estimateId != null ? String(raw.estimateId) : undefined,
    estimateTotal:
      raw.estimateTotal != null && Number.isFinite(Number(raw.estimateTotal))
        ? Number(raw.estimateTotal)
        : undefined,
    payment: {
      total: pay?.total != null && Number.isFinite(Number(pay.total)) ? Number(pay.total) : 0,
      paid: pay?.paid != null && Number.isFinite(Number(pay.paid)) ? Number(pay.paid) : 0,
      method: pay?.method,
      paidAt: pay?.paidAt != null ? String(pay.paidAt) : undefined,
    },
    comment: raw.comment != null ? String(raw.comment) : undefined,
    attachments: Array.isArray(raw.attachments) ? [...(raw.attachments as string[])] : [],
    promoCode: raw.promoCode != null ? String(raw.promoCode) : undefined,
    reminder: raw.reminder as BookingReminder | undefined,
    reviewRequested: raw.reviewRequested != null ? Boolean(raw.reviewRequested) : false,
    colorTag: raw.colorTag != null ? String(raw.colorTag) : undefined,
    syncedAt: raw.syncedAt != null ? String(raw.syncedAt) : undefined,
  };
}
