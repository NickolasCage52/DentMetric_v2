<template>
  <div class="emp-list">
    <div class="emp-list__header">
      <button type="button" class="emp-list__back" @click="$emit('back')">← Назад</button>
      <div class="emp-list__title">Сотрудники</div>
    </div>

    <div v-if="showLimitBanner" class="emp-list__limit-banner">
      <span>
        Лимит: {{ store.employeeCount }} из {{ Math.max(0, store.getEmployeeLimit() - 1) }}
        доп. мастеров
      </span>
      <button type="button" class="emp-list__upgrade-btn" @click="$emit('navigate', 'tariffs')">
        Расширить →
      </button>
    </div>

    <div v-if="!store.isLoaded" class="emp-list__loading">Загрузка...</div>

    <div
      v-else-if="store.employees.length === 0"
      class="emp-list__empty"
    >
      <div class="emp-list__empty-icon" aria-hidden="true">{{ '\u{1F465}' }}</div>
      <div class="emp-list__empty-title">Нет сотрудников</div>
      <div class="emp-list__empty-sub">Добавьте мастеров для совместной работы</div>
      <button type="button" class="emp-list__empty-btn" @click="onAddClick">
        + Добавить сотрудника
      </button>
    </div>

    <div v-else class="emp-list__scroll">
      <button
        v-for="emp in store.employees"
        :key="emp.id"
        type="button"
        class="emp-list__card"
        @click="openEmployee(emp.id)"
      >
        <div class="emp-list__avatar" :style="{ background: avatarColor(emp.id) }">
          <img v-if="emp.photo" :src="emp.photo" alt="" class="emp-list__avatar-img">
          <span v-else class="emp-list__avatar-initials">{{ initials(emp) }}</span>
        </div>
        <div class="emp-list__info">
          <div class="emp-list__name">{{ emp.name }} {{ emp.surname || '' }}</div>
          <div class="emp-list__role">{{ roleLabel(emp.role) }}</div>
          <div
            v-if="emp.schedule.filledUntil"
            class="emp-list__schedule"
          >
            График заполнен до {{ formatDate(emp.schedule.filledUntil) }}
          </div>
          <div v-else class="emp-list__schedule emp-list__schedule--empty">
            График не заполнен
          </div>
        </div>
        <div class="emp-list__status" :class="`emp-list__status--${emp.status}`" aria-hidden="true" />
        <span class="emp-list__chevron" aria-hidden="true">›</span>
      </button>
    </div>

    <button
      v-if="store.isLoaded && store.employees.length > 0 && store.canAddEmployee()"
      type="button"
      class="emp-list__fab"
      aria-label="Добавить сотрудника"
      @click="$emit('create-employee')"
    >
      +
    </button>

    <button
      v-else-if="store.isLoaded && store.employees.length > 0 && !store.canAddEmployee()"
      type="button"
      class="emp-list__paywall-fab"
      @click="$emit('navigate', 'tariffs')"
    >
      {{ '\u{1F512}' }} Добавить мастера
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeesStore } from '@/stores/employees';
import type { Employee } from '@/types/employee';

const emit = defineEmits<{
  back: [];
  navigate: [section: string];
  'open-employee': [id: string];
  'create-employee': [];
}>();

const store = useEmployeesStore();

onMounted(() => {
  if (!store.isLoaded) store.loadEmployees();
});

const showLimitBanner = computed(
  () =>
    store.employeeCount >= Math.max(0, store.getEmployeeLimit() - 1) &&
    store.getEmployeeLimit() > 1
);

const HUES = [220, 340, 45, 160, 270, 195, 25, 85];

function avatarColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = HUES[Math.abs(hash) % HUES.length];
  return `hsl(${hue} 55% 42%)`;
}

function initials(emp: Employee): string {
  const parts = [emp.name, emp.surname].filter(Boolean) as string[];
  return parts.map((p) => p[0].toUpperCase()).join('').slice(0, 2) || 'МС';
}

function roleLabel(role: string): string {
  return role === 'admin' ? 'Администратор' : 'Мастер';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
  });
}

function openEmployee(id: string) {
  emit('open-employee', id);
}

function onAddClick() {
  if (!store.canAddEmployee()) {
    emit('navigate', 'tariffs');
    return;
  }
  emit('create-employee');
}
</script>

<style scoped>
.emp-list {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 220;
}

.emp-list__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}

.emp-list__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}

.emp-list__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.emp-list__limit-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  background: color-mix(in srgb, var(--dm-warn) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--dm-warn) 35%, transparent);
  font-size: 12px;
  color: var(--dm-warn);
  flex-shrink: 0;
}

.emp-list__upgrade-btn {
  background: transparent;
  border: none;
  color: var(--dm-warn);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
  flex-shrink: 0;
}

.emp-list__loading,
.emp-list__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
}

.emp-list__empty-icon {
  font-size: 48px;
}

.emp-list__empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.emp-list__empty-sub {
  font-size: 14px;
  color: var(--dm-text-secondary);
  max-width: 240px;
}

.emp-list__empty-btn {
  margin-top: 8px;
  padding: 14px 28px;
  background: var(--dm-accent);
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  min-height: 44px;
}

.emp-list__scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(var(--app-footer-height, 64px) + 88px);
}

.emp-list__card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dm-border);
  cursor: pointer;
  transition: background 0.15s;
  min-height: 72px;
  width: 100%;
  background: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  color: inherit;
  text-align: left;
  box-sizing: border-box;
}

.emp-list__card:active {
  background: var(--dm-surface);
}

.emp-list__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.emp-list__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.emp-list__avatar-initials {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.emp-list__info {
  flex: 1;
  min-width: 0;
}

.emp-list__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--dm-text-primary);
}

.emp-list__role {
  font-size: 12px;
  color: var(--dm-text-secondary);
  margin-top: 2px;
}

.emp-list__schedule {
  font-size: 11px;
  color: var(--dm-text-secondary);
  margin-top: 3px;
}

.emp-list__schedule--empty {
  color: var(--dm-danger);
}

.emp-list__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.emp-list__status--active {
  background: var(--dm-accent);
}

.emp-list__status--inactive {
  background: var(--dm-text-secondary);
}

.emp-list__chevron {
  color: var(--dm-text-secondary);
  font-size: 18px;
}

.emp-list__fab {
  position: fixed;
  bottom: calc(var(--app-footer-height, 64px) + 16px);
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--dm-accent);
  border: none;
  font-size: 28px;
  color: #000;
  font-weight: 300;
  cursor: pointer;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--dm-accent) 35%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 221;
}

.emp-list__paywall-fab {
  position: fixed;
  bottom: calc(var(--app-footer-height, 64px) + 16px);
  right: 16px;
  padding: 14px 18px;
  border-radius: 28px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-secondary);
  cursor: pointer;
  z-index: 221;
  min-height: 48px;
}
</style>
