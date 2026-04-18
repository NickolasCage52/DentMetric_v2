<template>
  <div class="sync-settings">
    <div class="sync-settings__header">
      <button type="button" class="sync-settings__back" @click="$emit('back')">← Назад</button>
      <div class="sync-settings__title">Синхронизация</div>
    </div>

    <div class="sync-settings__content">
      <div class="sync-settings__status-card" :class="`sync-settings__status-card--${syncStore.status}`">
        <div class="sync-settings__status-icon">{{ statusIcon }}</div>
        <div class="sync-settings__status-info">
          <div class="sync-settings__status-title">{{ statusTitle }}</div>
          <div class="sync-settings__status-sub">{{ statusSub }}</div>
        </div>
      </div>

      <div v-if="!syncStore.isConfigured" class="sync-settings__notice">
        <div class="sync-settings__notice-title">Облачная синхронизация не настроена</div>
        <div class="sync-settings__notice-body">
          Для включения синхронизации укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файле .env.local и
          пересоберите приложение.
        </div>
      </div>

      <div v-if="syncStore.isConfigured" class="sync-settings__stats">
        <div class="sync-settings__section-label">Статус данных</div>
        <div class="sync-settings__stat-row">
          <span>История расчётов</span>
          <span class="sync-settings__stat-value">{{ historyPendingCount }} несинхр.</span>
        </div>
        <div class="sync-settings__stat-row">
          <span>Записи журнала</span>
          <span class="sync-settings__stat-value">{{ bookingsPendingCount }} несинхр.</span>
        </div>
        <div class="sync-settings__stat-row">
          <span>Сотрудники</span>
          <span class="sync-settings__stat-value">{{ employeesPendingCount }} несинхр.</span>
        </div>
        <div v-if="syncStore.lastSyncAt" class="sync-settings__last-sync">
          Последняя синхронизация: {{ formatDateTime(syncStore.lastSyncAt) }}
        </div>
      </div>

      <div v-if="syncStore.isConfigured" class="sync-settings__actions">
        <button
          type="button"
          class="sync-settings__sync-btn"
          :disabled="!syncStore.canSync"
          @click="handleManualSync"
        >
          <span v-if="syncStore.isSyncing" class="sync-settings__spin" aria-hidden="true">{{ spinGlyph }}</span>
          {{ syncStore.isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас' }}
        </button>
        <div v-if="syncStore.lastError" class="sync-settings__error">Ошибка: {{ syncStore.lastError }}</div>
      </div>

      <div v-if="syncStore.lastResults.length > 0" class="sync-settings__results">
        <div class="sync-settings__section-label">Последний результат</div>
        <div v-for="r in syncStore.lastResults" :key="r.collection" class="sync-settings__result-row">
          <span class="sync-settings__result-col">{{ collectionLabel(r.collection) }}</span>
          <span class="sync-settings__result-stats">
            &uarr;{{ r.pushed }} &darr;{{ r.pulled }}
            <span v-if="r.errors.length" class="sync-settings__result-err">! {{ r.errors.length }}</span>
          </span>
        </div>
      </div>

      <div class="sync-settings__danger">
        <div class="sync-settings__section-label">Сброс</div>
        <button type="button" class="sync-settings__reset-btn" @click="handleResetSync">
          Сбросить метки синхронизации
        </button>
        <div class="sync-settings__reset-hint">
          При следующей синхронизации изменения с сервера подтянутся с учётом курсора last pull.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSyncStore } from '@/stores/sync';
import { useHistoryPiniaStore } from '@/stores/history';
import { useBookingsStore } from '@/stores/bookings';
import { useEmployeesStore } from '@/stores/employees';

defineEmits<{ back: [] }>();

const spinGlyph = '\u27F3';

const syncStore = useSyncStore();
const bookingsStore = useBookingsStore();
const employeesStore = useEmployeesStore();
const historyStore = useHistoryPiniaStore();

const historyPendingCount = computed(() =>
  (historyStore.records || []).filter((r) => {
    const syncedAt = r?.syncedAt != null ? String(r.syncedAt) : '';
    const cu = String(r?.clientUpdatedAt || r?.updatedAt || r?.createdAt || '');
    return !syncedAt || (cu && syncedAt && cu > syncedAt);
  }).length
);

const bookingsPendingCount = computed(() =>
  (bookingsStore.bookings || []).filter((b) => {
    const syncedAt = b.syncedAt != null ? String(b.syncedAt) : '';
    const u = String(b.updatedAt || b.createdAt || '');
    return !syncedAt || (u && syncedAt && u > syncedAt);
  }).length
);

const employeesPendingCount = computed(() =>
  (employeesStore.employees || []).filter((e) => {
    const syncedAt = e.syncedAt != null ? String(e.syncedAt) : '';
    const u = String(e.updatedAt || e.createdAt || '');
    return !syncedAt || (u && syncedAt && u > syncedAt);
  }).length
);

const statusIcon = computed(() => {
  const icons: Record<string, string> = {
    success: '\u2713',
    error: '\u26A0',
    offline: '\u2715',
    syncing: '\u27F3',
    idle: '\u2601',
    disabled: '\u2026',
  };
  return icons[syncStore.status] || '\u2601';
});

const statusTitle = computed(() => {
  const titles: Record<string, string> = {
    success: 'Синхронизировано',
    error: 'Ошибка синхронизации',
    offline: 'Нет подключения',
    syncing: 'Синхронизация...',
    idle: 'Ожидание',
    disabled: 'Не настроено',
  };
  return titles[syncStore.status] || 'Статус неизвестен';
});

const statusSub = computed(() => {
  if (syncStore.status === 'success' && syncStore.lastSyncAt) {
    return `Обновлено ${formatDateTime(syncStore.lastSyncAt)}`;
  }
  if (syncStore.status === 'error') {
    return syncStore.lastError || 'Неизвестная ошибка';
  }
  if (syncStore.status === 'offline') {
    return 'Данные сохраняются локально';
  }
  if (syncStore.pendingCount > 0) {
    return `${syncStore.pendingCount} изменений ожидают отправки`;
  }
  return 'Все данные актуальны';
});

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function collectionLabel(col: string): string {
  const labels: Record<string, string> = {
    history: 'История',
    bookings: 'Записи',
    employees: 'Сотрудники',
    service_data: 'Данные сервиса',
  };
  return labels[col] || col;
}

async function handleManualSync() {
  await syncStore.sync();
}

function handleResetSync() {
  const ok = confirm(
    'Сбросить метки синхронизации? При следующей синхронизации будут подтянуты удалённые на сервере обновления.'
  );
  if (!ok) return;
  syncStore.resetSyncMeta();
  alert('Метки сброшены. Нажмите «Синхронизировать сейчас».');
}
</script>

<style scoped>
.sync-settings {
  position: fixed;
  inset: 0;
  background: var(--dm-bg, hsl(0 0% 6%));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 230;
}
.sync-settings__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
  flex-shrink: 0;
  gap: 8px;
}
.sync-settings__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.sync-settings__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.sync-settings__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 40px;
}

.sync-settings__status-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 16px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  background: var(--dm-surface, hsl(0 0% 9%));
}
.sync-settings__status-card--success {
  border-color: hsl(78 70% 50% / 0.3);
  background: hsl(78 70% 50% / 0.06);
}
.sync-settings__status-card--error {
  border-color: hsl(4 82% 56% / 0.3);
  background: hsl(4 82% 56% / 0.06);
}
.sync-settings__status-card--offline {
  border-color: hsl(0 0% 53% / 0.3);
}
.sync-settings__status-icon {
  font-size: 28px;
}
.sync-settings__status-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.sync-settings__status-sub {
  font-size: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-top: 3px;
  line-height: 1.4;
}

.sync-settings__notice {
  margin: 0 16px 12px;
  padding: 14px;
  background: hsl(38 92% 50% / 0.08);
  border: 1px solid hsl(38 92% 50% / 0.25);
  border-radius: 12px;
}
.sync-settings__notice-title {
  font-size: 13px;
  font-weight: 700;
  color: hsl(43 96% 56%);
  margin-bottom: 6px;
}
.sync-settings__notice-body {
  font-size: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  line-height: 1.5;
}

.sync-settings__section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  padding: 14px 16px 4px;
}

.sync-settings__stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  min-height: 44px;
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
  font-size: 14px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.sync-settings__stat-value {
  font-size: 13px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}
.sync-settings__last-sync {
  padding: 10px 16px;
  font-size: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}

.sync-settings__actions {
  padding: 12px 16px;
}
.sync-settings__sync-btn {
  width: 100%;
  height: 52px;
  background: var(--dm-accent, hsl(78 70% 50%));
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.sync-settings__sync-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sync-settings__spin {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.sync-settings__error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--dm-danger, hsl(4 82% 56%));
  text-align: center;
}

.sync-settings__result-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  min-height: 44px;
  align-items: center;
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
}
.sync-settings__result-col {
  font-size: 14px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.sync-settings__result-stats {
  font-size: 13px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}
.sync-settings__result-err {
  color: var(--dm-danger, hsl(4 82% 56%));
  margin-left: 6px;
}

.sync-settings__danger {
  padding: 0 16px 16px;
}
.sync-settings__reset-btn {
  width: 100%;
  height: 48px;
  background: transparent;
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  border-radius: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
}
.sync-settings__reset-hint {
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-top: 6px;
  line-height: 1.5;
}
</style>
