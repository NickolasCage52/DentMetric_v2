import type { Booking } from '@/types/booking';
import {
  NOTIFICATION_SETTINGS_STORAGE_KEY,
  normalizeNotificationSettings,
  type NotificationSettings,
  type NotificationTrigger,
} from '@/types/notification';
import { useNotificationsStore } from '@/stores/notifications';

const NOTIF_ICON = `${import.meta.env.BASE_URL || '/'}dm-logo.svg`;

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
    return normalizeNotificationSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeNotificationSettings(null);
  }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function isPushGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export async function sendLocalPush(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!isPushGranted()) return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: NOTIF_ICON,
          badge: NOTIF_ICON,
          data,
          vibrate: [100, 50, 100],
        });
        return;
      }
    }
    new Notification(title, { body });
  } catch (err) {
    console.warn('[DentMetric notifications]', err);
  }
}

const SCHEDULED_KEY = 'dm_scheduled_notifications_v1';
const DIGEST_LAST_KEY = 'dm_daily_digest_last_date_v1';

interface ScheduledNotification {
  id: string;
  fireAt: number;
  title: string;
  body: string;
  bookingId?: string;
  sent: boolean;
}

export function scheduleNotification(
  id: string,
  fireAt: Date,
  title: string,
  body: string,
  bookingId?: string
): void {
  const scheduled = loadScheduled();
  const filtered = scheduled.filter((n) => n.id !== id);
  filtered.push({
    id,
    fireAt: fireAt.getTime(),
    title,
    body,
    bookingId,
    sent: false,
  });
  try {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(filtered));
  } catch {
    /* quota */
  }
}

export function cancelScheduledNotification(id: string): void {
  const scheduled = loadScheduled().filter((n) => n.id !== id);
  try {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(scheduled));
  } catch {
    /* quota */
  }
}

export function cancelBookingNotifications(bookingId: string): void {
  const scheduled = loadScheduled().filter((n) => n.bookingId !== bookingId);
  try {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(scheduled));
  } catch {
    /* quota */
  }
}

function loadScheduled(): ScheduledNotification[] {
  try {
    const raw = localStorage.getItem(SCHEDULED_KEY);
    return raw ? (JSON.parse(raw) as ScheduledNotification[]) : [];
  } catch {
    return [];
  }
}

function triggerFromScheduleId(id: string): NotificationTrigger {
  if (id.endsWith('_day_before')) return 'booking_reminder_day';
  if (id.endsWith('_2h')) return 'booking_reminder_2h';
  if (id.endsWith('_30m')) return 'booking_reminder_30m';
  return 'manual';
}

function logPushToHistory(
  title: string,
  body: string,
  bookingId: string | undefined,
  trigger: NotificationTrigger
): void {
  try {
    useNotificationsStore().addNotification({
      trigger,
      recipient: 'master',
      channel: 'push',
      title,
      body: body.slice(0, 500),
      bookingId,
      sent: true,
      sentAt: new Date().toISOString(),
    });
  } catch {
    /* store inactive */
  }
}

export async function checkAndFireDueNotifications(): Promise<ScheduledNotification[]> {
  if (!isPushGranted()) return [];
  const now = Date.now();
  const scheduled = loadScheduled();
  const due = scheduled.filter((n) => !n.sent && n.fireAt <= now);
  const fired: ScheduledNotification[] = [];

  for (const notif of due) {
    try {
      await sendLocalPush(notif.title, notif.body, { bookingId: notif.bookingId });
      logPushToHistory(
        notif.title,
        notif.body,
        notif.bookingId,
        triggerFromScheduleId(notif.id)
      );
      notif.sent = true;
      fired.push(notif);
    } catch {
      /* silent */
    }
  }

  if (fired.length > 0) {
    const updated = scheduled.map((n) =>
      fired.find((f) => f.id === n.id) ? { ...n, sent: true } : n
    );
    try {
      localStorage.setItem(SCHEDULED_KEY, JSON.stringify(updated));
    } catch {
      /* quota */
    }
  }

  return fired;
}

export function bookingStartMs(booking: Booking): number {
  const t = (booking.startTime || '00:00').slice(0, 5);
  const parts = booking.date.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return NaN;
  const [y, mo, d] = parts;
  const [hh, mm] = t.split(':').map((x) => Number(x));
  return new Date(y, mo - 1, d, hh || 0, mm || 0, 0, 0).getTime();
}

export function scheduleBookingNotifications(
  booking: Booking,
  opts: {
    masterDayBefore: boolean;
    master2h: boolean;
    master30m: boolean;
  }
): void {
  const bookingMs = bookingStartMs(booking);
  if (!Number.isFinite(bookingMs)) return;

  const clientName = booking.client.name || 'Клиент';
  const car = [booking.client.brand, booking.client.model].filter(Boolean).join(' ') || '';

  if (opts.masterDayBefore) {
    const fireAt = new Date(bookingMs - 24 * 60 * 60 * 1000);
    if (fireAt.getTime() > Date.now()) {
      scheduleNotification(
        `${booking.id}_day_before`,
        fireAt,
        'Запись завтра',
        `${clientName}${car ? ` — ${car}` : ''} в ${booking.startTime}`,
        booking.id
      );
    }
  }

  if (opts.master2h) {
    const fireAt = new Date(bookingMs - 2 * 60 * 60 * 1000);
    if (fireAt.getTime() > Date.now()) {
      scheduleNotification(
        `${booking.id}_2h`,
        fireAt,
        'Запись через 2 часа',
        `${clientName}${car ? ` — ${car}` : ''} в ${booking.startTime}`,
        booking.id
      );
    }
  }

  if (opts.master30m) {
    const fireAt = new Date(bookingMs - 30 * 60 * 1000);
    if (fireAt.getTime() > Date.now()) {
      scheduleNotification(
        `${booking.id}_30m`,
        fireAt,
        'Запись через 30 минут',
        `${clientName}${car ? ` — ${car}` : ''} в ${booking.startTime}`,
        booking.id
      );
    }
  }
}

export interface WhatsAppTemplate {
  name: string;
  body: string;
  url: string;
}

export function buildWhatsAppReminder(
  booking: Booking,
  template: 'day_before' | '2h' | 'ready' | 'followup',
  masterName?: string,
  serviceName?: string
): WhatsAppTemplate | null {
  const phone = booking.client.phone?.replace(/\D/g, '');
  if (!phone || phone.length < 10) return null;

  const clientName = booking.client.name ? booking.client.name.split(' ')[0] : '';
  const greeting = clientName ? `${clientName}, ` : '';
  const car = [booking.client.brand, booking.client.model].filter(Boolean).join(' ');
  const service = serviceName || 'DentMetric';
  const master = masterName ? `Мастер: ${masterName}` : '';

  let text = '';
  let name = '';

  switch (template) {
    case 'day_before':
      name = 'Напоминание (за день)';
      text = [
        `${greeting}добрый день!`,
        '',
        `Напоминаем о записи на завтра: ${formatBookingDate(booking.date)}, ${booking.startTime}`,
        car ? `\u{1F697} ${car}` : '',
        `\u{1F527} ${booking.serviceName}`,
        master,
        '',
        'Если планы изменились, пожалуйста, сообщите заранее.',
        '',
        service,
      ]
        .filter((l) => l !== '')
        .join('\n');
      break;

    case '2h':
      name = 'Напоминание (за 2 часа)';
      text = [
        `${greeting}напоминаем — `,
        `запись сегодня в ${booking.startTime}`,
        car ? `Автомобиль: ${car}` : '',
        master,
        service,
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'ready':
      name = 'Автомобиль готов';
      text = [
        `${greeting}ваш автомобиль готов!`,
        '',
        car ? `\u{1F697} ${car}` : '',
        `Стоимость: ${booking.payment.total.toLocaleString('ru-RU')}\u00a0\u20bd`,
        booking.payment.paid < booking.payment.total
          ? `К оплате: ${(booking.payment.total - booking.payment.paid).toLocaleString('ru-RU')}\u00a0\u20bd`
          : '\u2713 Оплачено',
        '',
        'Спасибо, что выбрали нас!',
        service,
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'followup':
      name = 'Приглашение';
      text = [
        `${greeting}добрый день!`,
        '',
        `Мы делали оценку по вашему автомобилю${car ? ` (${car})` : ''}.`,
        'Удобно записаться на ремонт?',
        '',
        service,
      ]
        .filter(Boolean)
        .join('\n');
      break;
  }

  return {
    name,
    body: text,
    url: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
  };
}

function formatBookingDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function buildDailyDigest(bookings: Booking[], date: string): string {
  const dayBookings = bookings
    .filter((b) => b.date === date && b.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (dayBookings.length === 0) return 'На сегодня записей нет.';

  const headerStr = formatBookingDate(date);

  const lines = [`\u{1F4CB} Расписание на ${headerStr}:`, ''];

  for (const b of dayBookings) {
    const client = b.client.name || b.client.phone || 'Клиент';
    const car = [b.client.brand, b.client.model].filter(Boolean).join(' ');
    lines.push(`${b.startTime} — ${client}${car ? ` (${car})` : ''}`);
  }

  lines.push('', `Итого записей: ${dayBookings.length}`);
  return lines.join('\n');
}

/** Утренняя сводка — не чаще одного раза в календарный день */
export function tryFireDailyDigest(bookings: Booking[], settings: NotificationSettings): void {
  if (!settings.masterDailyReminder || !isPushGranted()) return;

  const raw = (settings.masterDailyReminderTime || '08:00').split(':');
  const h = Number(raw[0]);
  const m = Number(raw[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return;

  const now = new Date();
  if (now.getHours() !== h || now.getMinutes() !== m) return;

  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayKey = `${y}-${mo}-${d}`;

  if (localStorage.getItem(DIGEST_LAST_KEY) === todayKey) return;

  const text = buildDailyDigest(bookings, todayKey);
  void sendLocalPush('DentMetric — записи на сегодня', text.slice(0, 180));
  logPushToHistory('Сводка на сегодня', text, undefined, 'booking_digest');

  try {
    localStorage.setItem(DIGEST_LAST_KEY, todayKey);
  } catch {
    /* quota */
  }
}

export function rescheduleAllActiveBookings(bookings: Booking[]): void {
  const s = loadNotificationSettings();
  for (const b of bookings) {
    if (['scheduled', 'in_progress'].includes(b.status)) {
      cancelBookingNotifications(b.id);
      scheduleBookingNotifications(b, {
        masterDayBefore: s.masterReminder24h !== false,
        master2h: s.masterReminder2h !== false,
        master30m: s.masterReminder30m !== false,
      });
    } else {
      cancelBookingNotifications(b.id);
    }
  }
}
