<template>
  <div class="admin">
    <div class="admin__header">
      <div class="admin__header-left">
        <span class="admin__logo">DM</span>
        <div class="admin__header-text">
          <div class="admin__title">Admin Panel</div>
          <div class="admin__subtitle">DentMetric Analytics</div>
          <div v-if="stats?.lastStatsSyncAt && !error" class="admin__sync-line">
            Синхронизация: {{ formatTime(stats.lastStatsSyncAt) }}
          </div>
        </div>
      </div>
      <div class="admin__header-actions">
        <button
          class="admin__refresh-btn"
          type="button"
          title="Обновить"
          :disabled="isLoading"
          @click="loadStats"
        >
          <span :class="{ spin: isLoading }">&#8635;</span>
        </button>
        <button
          class="admin__logout-btn"
          type="button"
          title="Выйти"
          @click="logout"
        >
          Выйти
        </button>
      </div>
    </div>

    <div v-if="isLoading && !stats" class="admin__state admin__state--loading">
      <div class="admin__spinner"></div>
      <span>Загрузка данных...</span>
    </div>

    <div v-else-if="error && !stats" class="admin__state admin__state--error">
      <div class="admin__state-icon">&#9888;&#65039;</div>
      <div class="admin__state-title">Нет соединения с сервером</div>
      <div class="admin__state-hint">
        Убедитесь, что API запущен: Vite в dev шлёт запросы на тот же хост, а
        прокси перенаправляет <code class="admin__code">/api</code> на порт 3001.
        Если там никто не слушает — соединение отклоняется (ECONNREFUSED).
      </div>
      <p v-if="isDev" class="admin__state-dev">
        Локально откройте второй терминал и выполните
        <code class="admin__code">npm run server</code>. Если в логе уже есть
        «Running on port 3001», нажмите «Повторить попытку» или обновите страницу
        (F5) — экран не переключается сам, пока не будет нового запроса.
      </p>
      <button class="admin__btn-secondary" type="button" @click="loadStats">
        Повторить попытку
      </button>
    </div>

    <div v-else class="admin__content">
      <div
        v-if="stats && stats.totalUsers === 0 && !error"
        class="admin__empty-banner"
        role="status"
      >
        Нет данных. Дождитесь первых пользователей.
      </div>

      <div class="admin__primary-card">
        <div class="admin__primary-label">Всего пользователей</div>
        <div class="admin__primary-value">
          {{ stats?.totalUsers ?? '—' }}
        </div>
        <div class="admin__primary-sublabel">
          уникальных устройств зарегистрировано
        </div>
        <div class="admin__status-pill" :class="backendStatusClass">
          {{ backendStatusLabel }}
        </div>
      </div>

      <div class="admin__grid">
        <div class="admin__card">
          <div class="admin__card-label">Последний зарегистрированный</div>
          <div class="admin__card-value admin__card-value--time">
            {{ formatLastRegistered }}
          </div>
          <div class="admin__card-hint">
            {{ stats?.lastRegisteredUserAt ? 'зарегистрирован' : 'нет данных' }}
          </div>
        </div>

        <div class="admin__card">
          <div class="admin__card-label">Последняя синхронизация</div>
          <div class="admin__card-value admin__card-value--time">
            {{ formatSyncTime }}
          </div>
          <div class="admin__card-hint">данные с сервера</div>
        </div>
      </div>

      <div class="admin__grid">
        <div class="admin__card admin__card--future">
          <div class="admin__card-label">Расчётов в месяц</div>
          <div class="admin__card-value admin__card-value--placeholder">—</div>
          <div class="admin__card-hint">скоро</div>
        </div>
        <div class="admin__card admin__card--future">
          <div class="admin__card-label">Средний чек</div>
          <div class="admin__card-value admin__card-value--placeholder">—</div>
          <div class="admin__card-hint">скоро</div>
        </div>
      </div>

      <div class="admin__diagnostics">
        <button
          class="admin__diagnostics-toggle"
          type="button"
          @click="toggleDiagnostics"
        >
          <span>Диагностика трекинга</span>
          <span>{{ showDiagnostics ? '\u25B2' : '\u25BC' }}</span>
        </button>

        <div v-if="showDiagnostics" class="admin__diagnostics-body">
          <div class="admin__diag-row">
            <span class="admin__diag-label">User ID (это устройство)</span>
            <span class="admin__diag-value admin__diag-value--mono">
              {{ diagnostics?.userId?.slice(0, 8) }}...
            </span>
          </div>
          <div class="admin__diag-row">
            <span class="admin__diag-label">Зарегистрирован на бэкенде</span>
            <span
              class="admin__diag-value"
              :class="
                diagnostics?.isRegistrationConfirmed
                  ? 'admin__diag-value--ok'
                  : 'admin__diag-value--warn'
              "
            >
              {{
                diagnostics?.isRegistrationConfirmed
                  ? '\u2713 Да'
                  : '\u26A0 Нет'
              }}
            </span>
          </div>
          <div class="admin__diag-row">
            <span class="admin__diag-label">Последняя попытка отправки</span>
            <span class="admin__diag-value">
              {{
                diagnostics?.lastTrackingAttemptAt
                  ? formatTime(diagnostics.lastTrackingAttemptAt)
                  : '—'
              }}
            </span>
          </div>
          <div class="admin__diag-row">
            <span class="admin__diag-label">Последняя успешная отправка</span>
            <span
              class="admin__diag-value"
              :class="
                diagnostics?.lastTrackingSuccessAt
                  ? 'admin__diag-value--ok'
                  : 'admin__diag-value--warn'
              "
            >
              {{
                diagnostics?.lastTrackingSuccessAt
                  ? formatTime(diagnostics.lastTrackingSuccessAt)
                  : '—'
              }}
            </span>
          </div>
          <div class="admin__diag-hint">
            <span class="admin__diag-hint-icon" aria-hidden="true">&#128161;</span>
            Для проверки: откройте приложение в режиме инкогнито — счётчик
            должен вырасти на 1. Перезагрузка той же вкладки счётчик не меняет.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getTrackingDiagnostics,
  type TrackingDiagnostics,
} from '@/services/trackingDiagnostics'
import { adminFetch, clearAdminToken } from '@/services/adminApi'

interface AdminStats {
  totalUsers: number
  lastRegisteredUserAt: string | null
  lastStatsSyncAt: string
  trackingStatus: string
  storageStatus: string
}

const router = useRouter()
const isDev = import.meta.env.DEV

const isLoading = ref(true)
const error = ref(false)
const stats = ref<AdminStats | null>(null)
const showDiagnostics = ref(false)
const diagnostics = ref<TrackingDiagnostics | null>(null)

let refreshInterval: ReturnType<typeof setInterval> | null = null

const backendStatusClass = computed(() => {
  if (error.value) return 'admin__status-pill--error'
  if (!stats.value) return 'admin__status-pill--neutral'
  return stats.value.storageStatus === 'ok'
    ? 'admin__status-pill--ok'
    : 'admin__status-pill--error'
})

const backendStatusLabel = computed(() => {
  if (error.value) return '\u26A0 Backend недоступен'
  if (!stats.value) return '— Нет данных'
  return stats.value.storageStatus === 'ok'
    ? '\u2713 Система работает'
    : '\u26A0 Ошибка хранилища'
})

const formatLastRegistered = computed(() => {
  if (!stats.value?.lastRegisteredUserAt) return '—'
  return formatTime(stats.value.lastRegisteredUserAt)
})

const formatSyncTime = computed(() => {
  if (!stats.value?.lastStatsSyncAt) return '—'
  return formatTime(stats.value.lastStatsSyncAt)
})

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function refreshDiagnostics() {
  diagnostics.value = getTrackingDiagnostics()
}

function toggleDiagnostics() {
  showDiagnostics.value = !showDiagnostics.value
  if (showDiagnostics.value) refreshDiagnostics()
}

function ensurePolling() {
  if (refreshInterval != null) return
  refreshInterval = setInterval(() => {
    void loadStats()
  }, 30_000)
}

function stopPolling() {
  if (refreshInterval != null) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

function logout() {
  clearAdminToken()
  void router.replace({ name: 'admin-login' })
}

async function loadStats() {
  isLoading.value = true
  error.value = false
  try {
    const response = await adminFetch('/admin/stats')
    if (response.status === 401) {
      clearAdminToken()
      await router.replace({ name: 'admin-login' })
      return
    }
    if (!response.ok) throw new Error('Server error')
    stats.value = await response.json()
    ensurePolling()
  } catch {
    error.value = true
    if (!stats.value) {
      stopPolling()
    }
  } finally {
    isLoading.value = false
    refreshDiagnostics()
  }
}

onMounted(() => {
  void loadStats()
  refreshDiagnostics()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.admin {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--dm-bg, #0f0f0f);
  color: var(--dm-text-primary, #ffffff);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: inherit;
}

.admin__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 16px 14px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  flex-shrink: 0;
  gap: 12px;
}
.admin__header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}
.admin__header-text {
  min-width: 0;
}
.admin__logo {
  font-size: 20px;
  font-weight: 900;
  color: var(--dm-accent, #a0e040);
  letter-spacing: -1px;
  line-height: 1;
  flex-shrink: 0;
}
.admin__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}
.admin__subtitle {
  font-size: 11px;
  color: var(--dm-text-secondary, #888888);
  margin-top: 1px;
}
.admin__sync-line {
  font-size: 10px;
  color: var(--dm-text-secondary, #888888);
  margin-top: 6px;
}
.admin__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.admin__refresh-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dm-surface-2, #1e1e1e);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 10px;
  color: var(--dm-text-secondary, #888888);
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
}
.admin__refresh-btn:not(:disabled):hover {
  color: var(--dm-accent, #a0e040);
}
.admin__logout-btn {
  min-height: 44px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 10px;
  color: var(--dm-text-secondary, #888888);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}
.admin__logout-btn:hover {
  color: var(--dm-accent, #a0e040);
  border-color: var(--dm-accent, #a0e040);
}
.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.admin__state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
}
.admin__state-icon {
  font-size: 32px;
}
.admin__state-title {
  font-size: 16px;
  font-weight: 600;
}
.admin__state-hint {
  font-size: 13px;
  color: var(--dm-text-secondary, #888888);
  max-width: 320px;
  line-height: 1.5;
}
.admin__state-dev {
  margin: 0;
  font-size: 12px;
  color: var(--dm-text-secondary, #888888);
  max-width: 320px;
  line-height: 1.5;
  text-align: center;
}
.admin__code {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: var(--dm-accent, #a0e040);
  word-break: break-all;
}
.admin__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--dm-surface-2, #1e1e1e);
  border-top-color: var(--dm-accent, #a0e040);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.admin__btn-secondary {
  margin-top: 8px;
  padding: 10px 24px;
  background: transparent;
  border: 1px solid var(--dm-accent, #a0e040);
  color: var(--dm-accent, #a0e040);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  font-weight: 600;
}

.admin__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
}

.admin__empty-banner {
  font-size: 13px;
  color: var(--dm-text-secondary, #888888);
  text-align: center;
  padding: 12px 14px;
  background: var(--dm-surface-2, #1e1e1e);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 12px;
  line-height: 1.4;
}

.admin__primary-card {
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 16px;
  padding: 24px 20px 20px;
  position: relative;
}
.admin__primary-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: var(--dm-text-secondary, #888888);
  text-transform: uppercase;
  margin-bottom: 10px;
}
.admin__primary-value {
  font-size: 56px;
  font-weight: 900;
  color: var(--dm-accent, #a0e040);
  line-height: 1;
  letter-spacing: -2px;
  margin-bottom: 6px;
}
.admin__primary-sublabel {
  font-size: 13px;
  color: var(--dm-text-secondary, #888888);
  margin-bottom: 16px;
}

.admin__status-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.admin__status-pill--ok {
  background: rgba(160, 224, 64, 0.12);
  color: var(--dm-accent, #a0e040);
  border: 1px solid rgba(160, 224, 64, 0.3);
}
.admin__status-pill--error {
  background: rgba(229, 57, 53, 0.12);
  color: var(--dm-danger, #e53935);
  border: 1px solid rgba(229, 57, 53, 0.3);
}
.admin__status-pill--neutral {
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-secondary, #888888);
  border: 1px solid var(--dm-border, #2a2a2a);
}

.admin__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.admin__card {
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 12px;
  padding: 16px 14px;
}
.admin__card--future {
  opacity: 0.45;
}
.admin__card-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary, #888888);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.admin__card-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--dm-text-primary, #ffffff);
  line-height: 1.2;
  margin-bottom: 4px;
}
.admin__card-value--time {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}
.admin__card-value--placeholder {
  color: var(--dm-text-secondary, #888888);
}
.admin__card-hint {
  font-size: 11px;
  color: var(--dm-text-secondary, #888888);
}

.admin__diagnostics {
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 12px;
  overflow: hidden;
}
.admin__diagnostics-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: transparent;
  color: var(--dm-text-secondary, #888888);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  min-height: 44px;
  text-align: left;
}
.admin__diagnostics-body {
  border-top: 1px solid var(--dm-border, #2a2a2a);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.admin__diag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.admin__diag-label {
  font-size: 12px;
  color: var(--dm-text-secondary, #888888);
  flex: 1;
}
.admin__diag-value {
  font-size: 12px;
  color: var(--dm-text-primary, #ffffff);
  font-weight: 600;
  text-align: right;
}
.admin__diag-value--mono {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}
.admin__diag-value--ok {
  color: var(--dm-accent, #a0e040);
}
.admin__diag-value--warn {
  color: var(--dm-warn, #f59e0b);
}
.admin__diag-hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--dm-text-secondary, #888888);
  line-height: 1.6;
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 8px;
  padding: 10px 12px;
}
.admin__diag-hint-icon {
  margin-right: 4px;
}

@media (min-width: 640px) {
  .admin__content {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
  }
  .admin__primary-value {
    font-size: 72px;
  }
}
</style>
