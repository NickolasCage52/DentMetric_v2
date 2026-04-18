<template>
  <button
    v-if="syncStore.isConfigured"
    type="button"
    class="sync-badge"
    :class="`sync-badge--${syncStore.status}`"
    :disabled="syncStore.isSyncing"
    :title="tooltipText"
    :aria-label="tooltipText"
    @click="handleClick"
  >
    <span class="sync-badge__icon">
      <span v-if="syncStore.isSyncing" class="sync-badge__spinner" aria-hidden="true">{{ glyphs.spin }}</span>
      <span v-else-if="syncStore.status === 'success'" aria-hidden="true">{{ glyphs.cloud }}</span>
      <span v-else-if="syncStore.status === 'error'" aria-hidden="true">{{ glyphs.warn }}</span>
      <span v-else-if="syncStore.status === 'offline'" aria-hidden="true">{{ glyphs.offline }}</span>
      <span v-else aria-hidden="true">{{ glyphs.cloud }}</span>
    </span>
    <span v-if="syncStore.pendingCount > 0" class="sync-badge__count">
      {{ syncStore.pendingCount > 9 ? '9+' : syncStore.pendingCount }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSyncStore } from '@/stores/sync';

const glyphs = {
  spin: '\u27F3',
  cloud: '\u2601',
  warn: '\u26A0',
  offline: '\u2715',
};

const emit = defineEmits<{ 'open-sync': [] }>();
const syncStore = useSyncStore();

const tooltipText = computed(() => {
  switch (syncStore.status) {
    case 'success':
      return `Синхронизировано: ${formatTime(syncStore.lastSyncAt)}`;
    case 'error':
      return `Ошибка синхронизации: ${syncStore.lastError || ''}`;
    case 'offline':
      return 'Нет интернета — данные сохранены локально';
    case 'syncing':
      return 'Синхронизация...';
    case 'disabled':
      return 'Облако не настроено';
    default:
      return `Несинхронизировано: ${syncStore.pendingCount}`;
  }
});

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleClick() {
  if (!syncStore.isSyncing && syncStore.canSync) {
    void syncStore.sync();
  }
  emit('open-sync');
}
</script>

<style scoped>
.sync-badge {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}
.sync-badge:active {
  background: var(--dm-surface, hsl(0 0% 9%));
}
.sync-badge:disabled {
  cursor: default;
}

.sync-badge__icon {
  font-size: 18px;
  line-height: 1;
}
.sync-badge--success .sync-badge__icon {
  color: var(--dm-accent, hsl(78 70% 50%));
}
.sync-badge--error .sync-badge__icon {
  color: var(--dm-danger, hsl(4 82% 56%));
}
.sync-badge--offline .sync-badge__icon {
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}
.sync-badge--syncing .sync-badge__icon {
  color: var(--dm-accent, hsl(78 70% 50%));
}
.sync-badge--idle .sync-badge__icon {
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}

.sync-badge__spinner {
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

.sync-badge__count {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 14px;
  height: 14px;
  background: var(--dm-danger, hsl(4 82% 56%));
  color: hsl(0 0% 100%);
  border-radius: 7px;
  font-size: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
}
</style>
