// Уведомления (Stage 6)

export type NotificationChannel = 'push' | 'whatsapp' | 'in_app';

export type NotificationTrigger =
  | 'booking_reminder_day'
  | 'booking_reminder_2h'
  | 'booking_reminder_30m'
  | 'booking_status_changed'
  | 'booking_payment_due'
  | 'estimate_followup'
  | 'manual'
  | 'booking_digest';

export type NotificationRecipient = 'master' | 'client';

export interface NotificationItem {
  id: string;
  createdAt: string;
  readAt?: string;
  trigger: NotificationTrigger;
  recipient: NotificationRecipient;
  channel: NotificationChannel;
  title: string;
  body: string;
  bookingId?: string;
  estimateId?: string;
  whatsappUrl?: string;
  sent: boolean;
  sentAt?: string;
}

export interface NotificationSettings {
  masterNewBooking: boolean;
  masterBookingCancelled: boolean;
  masterDailyReminder: boolean;
  masterDailyReminderTime: string;
  /** Локальный push мастеру за ~24 ч до записи */
  masterReminder24h: boolean;
  /** За 2 ч */
  masterReminder2h: boolean;
  /** За 30 мин */
  masterReminder30m: boolean;
  clientReminderDayBefore: boolean;
  clientReminder2h: boolean;
  clientReadyNotification: boolean;
  autoSendClientReminders: boolean;
}

export const NOTIFICATION_SETTINGS_STORAGE_KEY = 'dm_notification_settings_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterNewBooking: true,
  masterBookingCancelled: true,
  masterDailyReminder: false,
  masterDailyReminderTime: '08:00',
  masterReminder24h: true,
  masterReminder2h: true,
  masterReminder30m: true,
  clientReminderDayBefore: true,
  clientReminder2h: false,
  clientReadyNotification: true,
  autoSendClientReminders: false,
};

export function normalizeNotificationSettings(raw: unknown): NotificationSettings {
  const def = DEFAULT_NOTIFICATION_SETTINGS;
  if (!raw || typeof raw !== 'object') return { ...def };
  const r = raw as Record<string, unknown>;
  return {
    masterNewBooking: (r.masterNewBooking as boolean) ?? def.masterNewBooking,
    masterBookingCancelled:
      (r.masterBookingCancelled as boolean) ?? def.masterBookingCancelled,
    masterDailyReminder: (r.masterDailyReminder as boolean) ?? def.masterDailyReminder,
    masterDailyReminderTime:
      (r.masterDailyReminderTime as string) ?? def.masterDailyReminderTime,
    masterReminder24h: (r.masterReminder24h as boolean) ?? def.masterReminder24h,
    masterReminder2h: (r.masterReminder2h as boolean) ?? def.masterReminder2h,
    masterReminder30m: (r.masterReminder30m as boolean) ?? def.masterReminder30m,
    clientReminderDayBefore:
      (r.clientReminderDayBefore as boolean) ?? def.clientReminderDayBefore,
    clientReminder2h: (r.clientReminder2h as boolean) ?? def.clientReminder2h,
    clientReadyNotification:
      (r.clientReadyNotification as boolean) ?? def.clientReadyNotification,
    autoSendClientReminders:
      (r.autoSendClientReminders as boolean) ?? def.autoSendClientReminders,
  };
}
