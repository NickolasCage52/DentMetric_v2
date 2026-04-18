import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  normalizeNotificationSettings,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
  type NotificationSettings,
  type NotificationItem,
} from '@/types/notification';

const HISTORY_KEY = 'dm_notification_history_v1';
const MAX_HISTORY = 100;

export const useNotificationsStore = defineStore('notifications', () => {
  const settings = ref<NotificationSettings>(loadSettings());
  const notificationHistory = ref<NotificationItem[]>(loadHistory());

  function loadSettings(): NotificationSettings {
    try {
      const raw = localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
      return normalizeNotificationSettings(raw ? JSON.parse(raw) : null);
    } catch {
      return normalizeNotificationSettings(null);
    }
  }

  function saveSettings(updates: Partial<NotificationSettings>): void {
    settings.value = normalizeNotificationSettings({
      ...(settings.value as unknown as Record<string, unknown>),
      ...updates,
    });
    try {
      localStorage.setItem(
        NOTIFICATION_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings.value)
      );
    } catch {
      /* quota */
    }
  }

  function loadHistory(): NotificationItem[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as NotificationItem[]) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(): void {
    const trimmed = notificationHistory.value.slice(-MAX_HISTORY);
    notificationHistory.value = trimmed;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      /* quota */
    }
  }

  function addNotification(
    item: Omit<NotificationItem, 'id' | 'createdAt'>
  ): NotificationItem {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    notificationHistory.value.unshift(newItem);
    saveHistory();
    return newItem;
  }

  function markRead(id: string): void {
    const item = notificationHistory.value.find((n) => n.id === id);
    if (item && !item.readAt) {
      item.readAt = new Date().toISOString();
      saveHistory();
    }
  }

  function markAllRead(): void {
    const now = new Date().toISOString();
    let changed = false;
    notificationHistory.value.forEach((n) => {
      if (!n.readAt) {
        n.readAt = now;
        changed = true;
      }
    });
    if (changed) saveHistory();
  }

  function clearHistory(): void {
    notificationHistory.value = [];
    saveHistory();
  }

  const unreadCount = computed(
    () => notificationHistory.value.filter((n) => !n.readAt).length
  );

  const hasUnread = computed(() => unreadCount.value > 0);

  return {
    settings,
    notificationHistory,
    unreadCount,
    hasUnread,
    saveSettings,
    addNotification,
    markRead,
    markAllRead,
    clearHistory,
  };
});
