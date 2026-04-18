import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  normalizeBooking,
  createDefaultBooking,
  type Booking,
  type BookingStatus,
} from '@/types/booking';
import {
  scheduleBookingNotifications,
  cancelBookingNotifications,
  sendLocalPush,
  loadNotificationSettings,
  buildWhatsAppReminder,
} from '@/services/notificationEngine';
import { useNotificationsStore } from '@/stores/notifications';
import { scheduleBackgroundSync } from '@/services/syncTrigger';

const STORAGE_KEY = 'dm_bookings_v1';

function syncPushSchedule(b: Booking): void {
  const s = loadNotificationSettings();
  if (!['scheduled', 'in_progress'].includes(b.status)) {
    cancelBookingNotifications(b.id);
    return;
  }
  cancelBookingNotifications(b.id);
  scheduleBookingNotifications(b, {
    masterDayBefore: s.masterReminder24h !== false,
    master2h: s.masterReminder2h !== false,
    master30m: s.masterReminder30m !== false,
  });
}

function notifyNewBookingPush(b: Booking): void {
  const s = loadNotificationSettings();
  if (!s.masterNewBooking) return;
  void sendLocalPush(
    'Новая запись',
    `${b.client.name || 'Клиент'} · ${b.startTime}`.slice(0, 120),
    { bookingId: b.id }
  );
  try {
    useNotificationsStore().addNotification({
      trigger: 'manual',
      recipient: 'master',
      channel: 'push',
      title: 'Новая запись',
      body: `${b.client.name || ''} ${b.startTime}`.trim(),
      bookingId: b.id,
      sent: true,
      sentAt: new Date().toISOString(),
    });
  } catch {
    /* pinia inactive */
  }
}

function notifyCancelledPush(b: Booking): void {
  const s = loadNotificationSettings();
  if (!s.masterBookingCancelled) return;
  void sendLocalPush('Запись отменена', b.client.name || b.id, { bookingId: b.id });
}

function maybeAutoClientWhatsApp(b: Booking): void {
  const s = loadNotificationSettings();
  if (!s.autoSendClientReminders || !b.client.phone) return;
  const tmpl = buildWhatsAppReminder(b, 'day_before', undefined, undefined);
  if (!tmpl) return;
  if (typeof window !== 'undefined') {
    window.open(tmpl.url, '_blank', 'noopener');
  }
  try {
    useNotificationsStore().addNotification({
      trigger: 'manual',
      recipient: 'client',
      channel: 'whatsapp',
      title: tmpl.name,
      body: tmpl.body.slice(0, 100),
      bookingId: b.id,
      whatsappUrl: tmpl.url,
      sent: true,
      sentAt: new Date().toISOString(),
    });
  } catch {
    /* pinia inactive */
  }
}

function mergeBooking(cur: Booking, changes: Partial<Booking>): Booking {
  const nextClient = changes.client ? { ...cur.client, ...changes.client } : cur.client;
  const nextPayment = changes.payment ? { ...cur.payment, ...changes.payment } : cur.payment;
  return {
    ...cur,
    ...changes,
    id: cur.id,
    client: nextClient,
    payment: nextPayment,
    updatedAt: new Date().toISOString(),
  };
}

export const useBookingsStore = defineStore('bookings', () => {
  const bookings = ref<Booking[]>([]);
  const isLoaded = ref(false);

  function getByDate(date: string): Booking[] {
    return bookings.value
      .filter((b) => b.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function getByDateAndMaster(date: string, masterId?: string): Booking[] {
    return getByDate(date).filter((b) =>
      masterId ? b.masterId === masterId : !b.masterId
    );
  }

  function getById(id: string): Booking | undefined {
    return bookings.value.find((b) => b.id === id);
  }

  function getByEstimateId(estimateId: string): Booking | undefined {
    return bookings.value.find((b) => b.estimateId === estimateId);
  }

  const todayBookings = computed(() => {
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    const d = String(new Date().getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;
    return getByDate(today);
  });

  function loadBookings(force = false): void {
    if (isLoaded.value && !force) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      bookings.value = parsed
        .filter((row) => row && typeof row === 'object')
        .map((row) => normalizeBooking(row as Record<string, unknown>));
    } catch {
      bookings.value = [];
    }
    isLoaded.value = true;
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings.value));
    } catch {
      /* ignore quota */
    }
  }

  function replaceAllFromSync(next: Booking[]): void {
    bookings.value = next.map((row) => normalizeBooking(row as unknown as Record<string, unknown>));
    saveToStorage();
    isLoaded.value = true;
  }

  function addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Booking {
    const now = new Date().toISOString();
    const newBooking = normalizeBooking({
      ...(booking as unknown as Record<string, unknown>),
      id: undefined,
      createdAt: now,
      updatedAt: now,
    });
    bookings.value.push(newBooking);
    saveToStorage();
    scheduleBackgroundSync();
    notifyNewBookingPush(newBooking);
    syncPushSchedule(newBooking);
    maybeAutoClientWhatsApp(newBooking);
    return newBooking;
  }

  function updateBooking(id: string, changes: Partial<Booking>): void {
    const index = bookings.value.findIndex((b) => b.id === id);
    if (index === -1) return;
    const prev = bookings.value[index];
    const prevStatus = prev.status;
    const merged = mergeBooking(prev, changes);
    bookings.value[index] = merged;
    saveToStorage();
    scheduleBackgroundSync();
    if (prevStatus !== 'cancelled' && merged.status === 'cancelled') {
      cancelBookingNotifications(id);
      notifyCancelledPush(merged);
    } else {
      syncPushSchedule(merged);
    }
  }

  function updateStatus(id: string, status: BookingStatus): void {
    updateBooking(id, { status });
  }

  function deleteBooking(id: string): void {
    cancelBookingNotifications(id);
    bookings.value = bookings.value.filter((b) => b.id !== id);
    saveToStorage();
    scheduleBackgroundSync();
  }

  function createFromEstimate(
    estimateId: string,
    estimateTotal: number,
    client: Booking['client'],
    date: string,
    startTime: string,
    masterId?: string,
    masterName?: string
  ): Booking {
    const base = createDefaultBooking(date, startTime, masterId, masterName);
    return addBooking({
      ...base,
      estimateId,
      estimateTotal,
      client: { ...client },
      payment: { total: estimateTotal, paid: 0 },
    });
  }

  return {
    bookings,
    isLoaded,
    todayBookings,
    getByDate,
    getByDateAndMaster,
    getById,
    getByEstimateId,
    loadBookings,
    addBooking,
    updateBooking,
    updateStatus,
    deleteBooking,
    createFromEstimate,
    replaceAllFromSync,
  };
});
