<template>
  <div class="settings-hub">
    <div class="settings-hub__header">
      <button type="button" class="settings-hub__back" @click="$emit('back')">
        ← Назад
      </button>
      <div class="settings-hub__title">Настройки</div>
    </div>

    <div class="settings-hub__tiles">
      <button type="button" class="settings-hub__tile" @click="$emit('navigate', 'online-booking')">
        <span class="settings-hub__tile-icon" aria-hidden="true">{{ '\u{1F550}' }}</span>
        <span class="settings-hub__tile-label">Онлайн-запись</span>
      </button>
      <button type="button" class="settings-hub__tile" @click="$emit('navigate', 'notifications')">
        <span class="settings-hub__tile-icon" aria-hidden="true">{{ '\u{1F514}' }}</span>
        <span class="settings-hub__tile-label">Уведомления</span>
      </button>
    </div>

    <div class="settings-hub__list">
      <SettingsHubItem
        v-for="item in mainItems"
        :key="item.id"
        :icon="item.icon"
        :label="item.label"
        :description="item.description"
        :badge="item.badge"
        @click="$emit('navigate', item.id)"
      />

      <div class="settings-hub__more-label">Дополнительно</div>
      <SettingsHubItem
        v-for="item in moreItems"
        :key="item.id"
        :icon="item.icon"
        :label="item.label"
        :description="item.description"
        :badge="item.badge"
        @click="$emit('navigate', item.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SettingsHubItem from '@/components/settings/SettingsHubItem.vue';
import { useAuthStore } from '@/stores/auth';
import { useEmployeesStore } from '@/stores/employees';
import { useSyncStore } from '@/stores/sync';
import { useMarketPricesStore } from '@/stores/marketPrices';

defineEmits<{
  back: [];
  navigate: [section: string];
}>();

const authStore = useAuthStore();
const employeesStore = useEmployeesStore();
const syncStore = useSyncStore();
const marketPricesStore = useMarketPricesStore();

const marketPricesDescription = computed(() => {
  if (!marketPricesStore.consentGranted) return 'Участие отключено';
  if (marketPricesStore.benchmarks.length > 0) {
    return `${marketPricesStore.benchmarks.length} ориентиров`;
  }
  return 'Ориентиры по рынку';
});

const syncDescription = computed(() => {
  if (!syncStore.isConfigured) return 'Не настроена';
  if (syncStore.status === 'success' && syncStore.pendingCount === 0) return 'Синхронизировано';
  if (syncStore.pendingCount > 0) return `${syncStore.pendingCount} изменений в очереди`;
  if (syncStore.status === 'offline') return 'Офлайн, локальное сохранение';
  return 'Облако и резервные копии';
});

function employeeCountLabel(): string {
  const count = employeesStore.activeEmployees.length;
  if (count === 0) return 'Управление командой';
  if (count === 1) return '1 сотрудник';
  if (count >= 2 && count <= 4) return `${count} сотрудника`;
  return `${count} сотрудников`;
}

const proGate = computed(() => {
  const p = (authStore.planId || 'free').toLowerCase();
  return p === 'free' || p === 'master' ? 'PRO' : null;
});

const mainItems = computed(() => {
  const pid = (authStore.planId || 'free').toUpperCase();
  return [
    {
      id: 'profile',
      icon: '\u{1F464}',
      label: 'Профиль',
      description: authStore.user?.name || authStore.user?.phone || 'Данные аккаунта',
      badge: null as string | null,
    },
    {
      id: 'employees',
      icon: '\u{1F465}',
      label: 'Сотрудники',
      description: employeeCountLabel(),
      badge: proGate.value,
    },
    {
      id: 'service-data',
      icon: '\u{1F3E2}',
      label: 'Данные сервиса',
      description: 'Название, адрес, реквизиты',
      badge: null as string | null,
    },
    {
      id: 'analytics',
      icon: '\u{1F4C8}',
      label: 'Аналитика',
      description: 'Выручка, конверсия, зарплаты',
      badge: proGate.value,
    },
    {
      id: 'pricing',
      icon: '\u{1F4B0}',
      label: 'Ценообразование',
      description: 'Базовые цены и коэффициенты',
      badge: null as string | null,
    },
    {
      id: 'market-prices',
      icon: '\u{1F4CA}',
      label: 'Рыночные цены',
      description: marketPricesDescription.value,
      badge: null as string | null,
    },
    {
      id: 'system',
      icon: '\u2699\uFE0F',
      label: 'Настройки системы',
      description: 'Язык, валюта, округление',
      badge: null as string | null,
    },
    {
      id: 'tariffs',
      icon: '\u{1F4E6}',
      label: 'Тарифы',
      description: `Текущий план: ${pid}`,
      badge: null as string | null,
    },
    {
      id: 'sync-settings',
      icon: '\u2601',
      label: 'Синхронизация',
      description: syncDescription.value,
      badge: null as string | null,
    },
    {
      id: 'security',
      icon: '\u{1F512}',
      label: 'Безопасность',
      description: 'Пароль, вход по коду, облако',
      badge: null as string | null,
    },
    {
      id: 'help',
      icon: '\u2753',
      label: 'Помощь',
      description: 'FAQ, связь с разработчиком',
      badge: null as string | null,
    },
  ];
});

const moreItems = computed(() => [
  {
    id: 'client-portal',
    icon: '\u{1F517}',
    label: 'Портал для клиентов',
    description: 'Ссылки на оценки для подтверждения онлайн',
    badge: null as string | null,
  },
  {
    id: 'armature',
    icon: '\u{1F527}',
    label: 'Арматурные работы',
    description: 'Цены и наборы операций',
    badge: null as string | null,
  },
  {
    id: 'client',
    icon: '\u{1F464}',
    label: 'Клиент и быстрый расчёт',
    description: 'Поля клиента, подсказки',
    badge: null as string | null,
  },
  {
    id: 'required',
    icon: '\u{1F4DD}',
    label: 'Обязательные поля',
    description: 'Что спрашивать перед расчётом',
    badge: null as string | null,
  },
  {
    id: 'history',
    icon: '\u{1F4BE}',
    label: 'История',
    description: 'Автосохранение и лимиты',
    badge: null as string | null,
  },
  {
    id: 'masters',
    icon: '\u{1F477}',
    label: 'Мастера',
    description: 'Имена и ставка за час',
    badge: null as string | null,
  },
]);
</script>

<style scoped>
.settings-hub {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 220;
}

.settings-hub__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}

.settings-hub__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}

.settings-hub__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.settings-hub__tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 14px 16px 4px;
  flex-shrink: 0;
}

.settings-hub__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 80px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;
  box-sizing: border-box;
}

.settings-hub__tile:active {
  background: var(--dm-surface-2);
}

.settings-hub__tile-icon {
  font-size: 22px;
}

.settings-hub__tile-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-text-primary);
  text-align: center;
  padding: 0 6px;
}

.settings-hub__list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0;
}

.settings-hub__more-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 16px 16px 8px;
}
</style>
