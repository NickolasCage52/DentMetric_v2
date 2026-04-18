<template>
  <div class="notif-settings">
    <div class="notif-settings__header">
      <button type="button" class="notif-settings__back" @click="$emit('back')">← Назад</button>
      <div class="notif-settings__title">Оповещения</div>
    </div>

    <div class="notif-settings__content">
      <div v-if="!pushGranted" class="notif-settings__permission-banner">
        <div class="notif-settings__perm-text">
          <div class="notif-settings__perm-title">Разрешите уведомления</div>
          <div class="notif-settings__perm-sub">Чтобы получать напоминания о записях</div>
        </div>
        <button
          type="button"
          class="notif-settings__perm-btn"
          :disabled="permDenied"
          @click="requestPermission"
        >
          {{ permDenied ? 'Заблокировано' : 'Разрешить' }}
        </button>
      </div>
      <div v-else class="notif-settings__permission-ok">{{ okGlyph }} Уведомления разрешены</div>

      <div class="notif-settings__section-label">Уведомления для мастера</div>

      <NotifToggle
        label="Новая запись"
        description="При добавлении новой записи"
        :value="store.settings.masterNewBooking"
        @update="store.saveSettings({ masterNewBooking: $event })"
      />
      <NotifToggle
        label="Отмена записи"
        description="Когда статус изменён на Отменено"
        :value="store.settings.masterBookingCancelled"
        @update="store.saveSettings({ masterBookingCancelled: $event })"
      />
      <NotifToggle
        label="Напоминание за сутки"
        description="Push примерно за 24 ч до записи"
        :value="store.settings.masterReminder24h"
        @update="store.saveSettings({ masterReminder24h: $event })"
      />
      <NotifToggle
        label="За 2 часа"
        description="Push перед записью"
        :value="store.settings.masterReminder2h"
        @update="store.saveSettings({ masterReminder2h: $event })"
      />
      <NotifToggle
        label="За 30 минут"
        description="Push перед записью"
        :value="store.settings.masterReminder30m"
        @update="store.saveSettings({ masterReminder30m: $event })"
      />
      <NotifToggle
        label="Утренняя сводка"
        description="Список записей на сегодня"
        :value="store.settings.masterDailyReminder"
        @update="store.saveSettings({ masterDailyReminder: $event })"
      />
      <div v-if="store.settings.masterDailyReminder" class="notif-settings__time-row">
        <span class="notif-settings__time-label">Время отправки</span>
        <input
          type="time"
          :value="store.settings.masterDailyReminderTime"
          class="notif-settings__time-input"
          @change="
            store.saveSettings({
              masterDailyReminderTime: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </div>

      <div class="notif-settings__section-label">Напоминания клиентам (WhatsApp)</div>
      <div class="notif-settings__wa-note">
        Ссылки открывают WhatsApp с готовым сообщением. Отправка бесплатная — через ваш WhatsApp.
      </div>

      <NotifToggle
        label="За день до записи"
        description="Шаблон накануне"
        :value="store.settings.clientReminderDayBefore"
        @update="store.saveSettings({ clientReminderDayBefore: $event })"
      />
      <NotifToggle
        label="За 2 часа до записи"
        description="Шаблон в день записи"
        :value="store.settings.clientReminder2h"
        @update="store.saveSettings({ clientReminder2h: $event })"
      />
      <NotifToggle
        label="Автомобиль готов"
        description="Когда статус изменён на Готово"
        :value="store.settings.clientReadyNotification"
        @update="store.saveSettings({ clientReadyNotification: $event })"
      />

      <div class="notif-settings__section-label">Режим отправки</div>
      <div class="notif-settings__mode-card">
        <button
          type="button"
          :class="[
            'notif-settings__mode-btn',
            !store.settings.autoSendClientReminders && 'notif-settings__mode-btn--active',
          ]"
          @click="store.saveSettings({ autoSendClientReminders: false })"
        >
          <div class="notif-settings__mode-icon" aria-hidden="true">{{ manualGlyph }}</div>
          <div class="notif-settings__mode-label">Вручную</div>
          <div class="notif-settings__mode-sub">Кнопка в карточке записи</div>
        </button>
        <button
          type="button"
          :class="[
            'notif-settings__mode-btn',
            store.settings.autoSendClientReminders && 'notif-settings__mode-btn--active',
          ]"
          @click="store.saveSettings({ autoSendClientReminders: true })"
        >
          <div class="notif-settings__mode-icon" aria-hidden="true">{{ autoGlyph }}</div>
          <div class="notif-settings__mode-label">Автоматически</div>
          <div class="notif-settings__mode-sub">При создании записи (WhatsApp)</div>
        </button>
      </div>

      <div class="notif-settings__section-label">Проверка</div>
      <button
        type="button"
        class="notif-settings__test-btn"
        :disabled="!pushGranted"
        @click="sendTestNotification"
      >
        {{ testGlyph }} Отправить тестовое уведомление
      </button>
      <div v-if="testSent" class="notif-settings__test-ok">{{ okGlyph }} Уведомление отправлено</div>

      <div class="notif-settings__section-label">История отправок</div>
      <div v-if="store.notificationHistory.length === 0" class="notif-settings__empty">
        Нет отправленных уведомлений
      </div>
      <div v-else>
        <button type="button" class="notif-settings__clear-btn" @click="store.clearHistory()">
          Очистить историю
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotificationsStore } from '@/stores/notifications';
import {
  requestPushPermission,
  isPushGranted,
  sendLocalPush,
} from '@/services/notificationEngine';
import NotifToggle from '@/components/notifications/NotifToggle.vue';

defineEmits<{ back: [] }>();

const okGlyph = '\u2713';
const manualGlyph = '\u{1F446}';
const autoGlyph = '\u26A1';
const testGlyph = '\u{1F4F2}';

const store = useNotificationsStore();
const pushGranted = ref(isPushGranted());
const permDenied = ref(false);
const testSent = ref(false);

onMounted(() => {
  pushGranted.value = isPushGranted();
  if ('Notification' in window) {
    permDenied.value = Notification.permission === 'denied';
  }
});

async function requestPermission() {
  const result = await requestPushPermission();
  pushGranted.value = result === 'granted';
  permDenied.value = result === 'denied';
}

async function sendTestNotification() {
  await sendLocalPush('DentMetric', '\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u043e');
  testSent.value = true;
  setTimeout(() => {
    testSent.value = false;
  }, 3000);
}
</script>

<style scoped>
.notif-settings {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 210;
}
.notif-settings__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}
.notif-settings__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.notif-settings__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.notif-settings__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 40px;
}
.notif-settings__permission-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 16px;
  padding: 14px;
  background: hsl(84 81% 44% / 0.08);
  border: 1px solid hsl(84 81% 44% / 0.25);
  border-radius: 12px;
}
.notif-settings__perm-text {
  flex: 1;
}
.notif-settings__perm-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.notif-settings__perm-sub {
  font-size: 12px;
  color: var(--dm-text-secondary);
  margin-top: 2px;
}
.notif-settings__perm-btn {
  background: var(--dm-accent);
  border: none;
  border-radius: 10px;
  color: hsl(0 0% 0%);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
  min-height: 44px;
  flex-shrink: 0;
}
.notif-settings__perm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.notif-settings__permission-ok {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--dm-accent);
}
.notif-settings__section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 14px 16px 4px;
}
.notif-settings__wa-note {
  padding: 0 16px 8px;
  font-size: 12px;
  color: var(--dm-text-secondary);
  line-height: 1.5;
}
.notif-settings__time-row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
  background: var(--dm-surface);
}
.notif-settings__time-label {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-secondary);
}
.notif-settings__time-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  font-size: 15px;
  outline: none;
  min-height: 44px;
  padding: 4px 0;
  text-align: right;
  cursor: pointer;
}
.notif-settings__mode-card {
  display: flex;
  gap: 10px;
  padding: 8px 16px;
}
.notif-settings__mode-btn {
  flex: 1;
  padding: 14px 10px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: border-color 0.15s, background 0.15s;
}
.notif-settings__mode-btn--active {
  border-color: var(--dm-accent);
  background: hsl(84 81% 44% / 0.08);
}
.notif-settings__mode-icon {
  font-size: 22px;
}
.notif-settings__mode-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.notif-settings__mode-sub {
  font-size: 11px;
  color: var(--dm-text-secondary);
  text-align: center;
}
.notif-settings__test-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 0 16px;
  height: 52px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 12px;
  color: var(--dm-text-primary);
  font-size: 14px;
  cursor: pointer;
}
.notif-settings__test-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.notif-settings__test-ok {
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: var(--dm-accent);
}
.notif-settings__empty {
  padding: 16px;
  font-size: 13px;
  color: var(--dm-text-secondary);
  text-align: center;
}
.notif-settings__clear-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 8px 16px;
  height: 44px;
  background: transparent;
  border: none;
  color: var(--dm-danger);
  font-size: 13px;
  cursor: pointer;
}
</style>
