<template>
  <div class="notif-center">
    <div class="notif-center__header">
      <button type="button" class="notif-center__back" @click="$emit('back')">← Назад</button>
      <div class="notif-center__title">Уведомления</div>
      <button
        v-if="store.hasUnread"
        type="button"
        class="notif-center__read-all"
        @click="store.markAllRead()"
      >
        Прочитать все
      </button>
    </div>

    <div class="notif-center__content">
      <div v-if="store.notificationHistory.length === 0" class="notif-center__empty">
        <div class="notif-center__empty-icon" aria-hidden="true">{{ '\u{1F514}' }}</div>
        <div class="notif-center__empty-title">Нет уведомлений</div>
        <div class="notif-center__empty-sub">Здесь появятся напоминания о записях</div>
      </div>

      <button
        v-for="item in store.notificationHistory"
        :key="item.id"
        type="button"
        class="notif-center__item"
        :class="{ 'notif-center__item--unread': !item.readAt }"
        @click="handleItemClick(item)"
      >
        <div class="notif-center__item-icon" aria-hidden="true">{{ channelIcon(item.channel) }}</div>
        <div class="notif-center__item-content">
          <div class="notif-center__item-title">{{ item.title }}</div>
          <div class="notif-center__item-body">{{ item.body }}</div>
          <div class="notif-center__item-time">{{ formatTime(item.createdAt) }}</div>
        </div>
        <div v-if="!item.readAt" class="notif-center__item-dot" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotificationsStore } from '@/stores/notifications';
import type { NotificationItem, NotificationChannel } from '@/types/notification';

const emit = defineEmits<{
  back: [];
  'open-booking': [id: string];
}>();

const store = useNotificationsStore();

onMounted(() => {
  store.markAllRead();
});

function channelIcon(channel: NotificationChannel): string {
  const icons: Record<NotificationChannel, string> = {
    push: '\u{1F4F1}',
    whatsapp: '\u{1F4AC}',
    in_app: '\u{1F514}',
  };
  return icons[channel] || '\u{1F514}';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

function handleItemClick(item: NotificationItem) {
  store.markRead(item.id);
  if (item.bookingId) {
    emit('open-booking', item.bookingId);
  }
}
</script>

<style scoped>
.notif-center {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 215;
}
.notif-center__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}
.notif-center__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.notif-center__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.notif-center__read-all {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 13px;
  cursor: pointer;
  min-height: 44px;
}
.notif-center__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.notif-center__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
}
.notif-center__empty-icon {
  font-size: 48px;
}
.notif-center__empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.notif-center__empty-sub {
  font-size: 14px;
  color: var(--dm-text-secondary);
  max-width: 240px;
}
.notif-center__item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dm-border);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  width: 100%;
  text-align: left;
  background: transparent;
  color: inherit;
  font: inherit;
}
.notif-center__item:active {
  background: var(--dm-surface);
}
.notif-center__item--unread {
  background: hsl(var(--dm-accent-h, 84) 81% 44% / 0.06);
}
.notif-center__item-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.notif-center__item-content {
  flex: 1;
  min-width: 0;
}
.notif-center__item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary);
}
.notif-center__item-body {
  font-size: 13px;
  color: var(--dm-text-secondary);
  margin-top: 3px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.notif-center__item-time {
  font-size: 11px;
  color: var(--dm-text-secondary);
  margin-top: 4px;
}
.notif-center__item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dm-accent);
  flex-shrink: 0;
  margin-top: 4px;
}
</style>
