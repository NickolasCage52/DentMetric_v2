<template>
  <Transition name="dm-fade">
    <div
      v-if="modelValue"
      class="drawer-overlay"
      @click="$emit('update:modelValue', false)"
    />
  </Transition>

  <Transition name="dm-drawer">
    <aside
      v-if="modelValue"
      class="drawer"
      aria-label="Меню приложения"
    >
      <div
        class="drawer__user"
        role="button"
        tabindex="0"
        @click="goToProfile"
        @keydown.enter.prevent="goToProfile"
        @keydown.space.prevent="goToProfile"
      >
        <div class="drawer__avatar">
          <img
            v-if="user?.avatarUrl"
            :src="user.avatarUrl"
            alt=""
            class="drawer__avatar-img"
          >
          <span v-else class="drawer__avatar-initials">{{ initials }}</span>
        </div>
        <div class="drawer__user-info">
          <div class="drawer__user-name">{{ displayName }}</div>
          <div class="drawer__user-plan">
            <span
              class="drawer__plan-badge"
              :class="`drawer__plan-badge--${normalizedPlanId}`"
            >{{ planLabel }}</span>
            <span v-if="planExpiryDisplay" class="drawer__plan-expiry">
              до {{ planExpiryDisplay }}
            </span>
          </div>
        </div>
        <span class="drawer__user-chevron" aria-hidden="true">›</span>
      </div>

      <div class="drawer__divider" />

      <nav class="drawer__nav" aria-label="Разделы">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="drawer__nav-item"
          :class="{ 'drawer__nav-item--active': isNavActive(item.id) }"
          @click="navigate(item.id)"
        >
          <span class="drawer__nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="drawer__nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="drawer__nav-badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="drawer__divider" />

      <button type="button" class="drawer__settings-btn" @click="navigate('settings')">
        <span class="drawer__nav-icon" aria-hidden="true">{{ '\u2699\uFE0F' }}</span>
        <span class="drawer__nav-label">Настройки</span>
      </button>

      <div class="drawer__bottom">
        <div class="drawer__version">DentMetric v{{ appVersion }}</div>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAccount } from '@/modules/account/useAccount';
import { useNotificationsStore } from '@/stores/notifications';
import { useAggregatorFeedStore } from '@/stores/aggregatorFeed';
import { canUse } from '@/modules/account/planFeatures';
import type { PlanId } from '@/modules/account/types';

const props = defineProps<{
  modelValue: boolean;
  currentSection?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  navigate: [section: string];
}>();

const authStore = useAuthStore();
const account = useAccount();
const notificationsStore = useNotificationsStore();
const aggregatorFeedStore = useAggregatorFeedStore();

const user = computed(() => authStore.user);
const displayName = computed(() => authStore.displayName);
const planId = computed(() => authStore.planId);

const normalizedPlanId = computed(() => (planId.value || 'free').toLowerCase());

const initials = computed(() => {
  const name = user.value?.name || user.value?.phone || '';
  return String(name).slice(0, 2).toUpperCase() || 'МС';
});

const planLabel = computed(() => {
  const labels: Record<string, string> = {
    free: 'Free',
    master: 'Master',
    pro: 'PRO',
    corporate: 'Corporate',
    demo: 'Demo',
  };
  return labels[normalizedPlanId.value] || normalizedPlanId.value.toUpperCase();
});

const planExpiryDisplay = computed(() => {
  const iso =
    user.value?.planExpiresAt ||
    account.subscription.value?.periodEnd ||
    account.subscription.value?.trialEndsAt;
  if (!iso) return '';
  return formatDate(iso);
});

const appVersion =
  (import.meta.env.VITE_APP_VERSION as string | undefined) || __APP_VERSION__ || '';

const navItems = computed(() => {
  const u = notificationsStore.unreadCount;
  const badge = u > 0 ? (u > 9 ? '9+' : String(u)) : '';
  const aggrOn = canUse('aggregatorFeed', (planId.value || 'free') as PlanId);
  const aggrN = aggregatorFeedStore.openJobsCount;
  const aggrBadge = aggrOn && aggrN > 0 ? (aggrN > 9 ? '9+' : String(aggrN)) : '';
  const items: { id: string; icon: string; label: string; badge: string }[] = [
    { id: 'home', icon: '🏠', label: 'Главная', badge: '' },
    { id: 'metric', icon: '📊', label: 'Метрика', badge: '' },
    { id: 'history', icon: '📋', label: 'История', badge: '' },
    { id: 'journal', icon: '📅', label: 'Журнал записи', badge: '' },
  ];
  if (aggrOn) {
    items.push({
      id: 'aggregator',
      icon: '🏢',
      label: 'Заявки',
      badge: aggrBadge,
    });
  }
  items.push(
    { id: 'notifications', icon: '🔔', label: 'Уведомления', badge },
    { id: 'analytics', icon: '📈', label: 'Аналитика', badge: '' },
  );
  return items;
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isNavActive(id: string): boolean {
  const cur = props.currentSection || '';
  if (id === 'home' && cur === 'home') return true;
  if (id === 'metric' && cur === 'metric') return true;
  if (id === 'history' && cur === 'history') return true;
  if (id === 'notifications' && cur === 'notifications') return true;
  if ((id === 'journal' && cur === 'journal') || (id === 'analytics' && cur === 'analytics')) return true;
  if (id === 'aggregator' && cur === 'aggregator') return true;
  if (id === 'settings' && (cur === 'settings' || cur === 'settings-hub')) return true;
  return false;
}

function navigate(section: string) {
  emit('navigate', section);
  emit('update:modelValue', false);
}

function goToProfile() {
  navigate('profile');
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 260;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(80vw, 300px);
  background: var(--dm-surface);
  border-right: 1px solid var(--dm-border);
  z-index: 261;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.drawer__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 52px 16px 20px;
  cursor: pointer;
  min-height: 44px;
}

.drawer__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--dm-surface-2);
  border: 2px solid var(--dm-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.drawer__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drawer__avatar-initials {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-accent);
}

.drawer__user-info {
  flex: 1;
  min-width: 0;
}

.drawer__user-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--dm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drawer__user-plan {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.drawer__plan-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.drawer__plan-badge--free {
  background: var(--dm-surface-2);
  color: var(--dm-text-secondary);
  border: 1px solid var(--dm-border);
}

.drawer__plan-badge--master {
  background: color-mix(in srgb, var(--dm-accent) 15%, transparent);
  color: var(--dm-accent);
  border: 1px solid color-mix(in srgb, var(--dm-accent) 30%, transparent);
}

.drawer__plan-badge--pro {
  background: color-mix(in srgb, var(--dm-text-primary) 12%, transparent);
  color: var(--dm-text-primary);
  border: 1px solid color-mix(in srgb, var(--dm-accent) 35%, transparent);
}

.drawer__plan-badge--corporate {
  background: color-mix(in srgb, var(--dm-warn) 15%, transparent);
  color: var(--dm-warn);
  border: 1px solid color-mix(in srgb, var(--dm-warn) 30%, transparent);
}

.drawer__plan-badge--demo {
  background: var(--dm-surface-2);
  color: var(--dm-accent);
  border: 1px solid var(--dm-border);
}

.drawer__plan-expiry {
  font-size: 11px;
  color: var(--dm-text-secondary);
}

.drawer__user-chevron {
  color: var(--dm-text-secondary);
  font-size: 18px;
}

.drawer__divider {
  height: 1px;
  background: var(--dm-border);
  margin: 4px 0;
}

.drawer__nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.drawer__nav-item,
.drawer__settings-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  min-height: 52px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s;
  box-sizing: border-box;
}

.drawer__nav-item:active,
.drawer__settings-btn:active {
  background: var(--dm-surface-2);
}

.drawer__nav-item--active {
  background: color-mix(in srgb, var(--dm-accent) 8%, transparent);
}

.drawer__nav-icon {
  font-size: 18px;
  width: 24px;
  flex-shrink: 0;
  text-align: center;
}

.drawer__nav-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--dm-text-primary);
}

.drawer__nav-item--active .drawer__nav-label {
  color: var(--dm-accent);
  font-weight: 600;
}

.drawer__nav-badge {
  font-size: 11px;
  font-weight: 700;
  background: var(--dm-accent);
  color: #000;
  padding: 2px 7px;
  border-radius: 10px;
}

.drawer__bottom {
  margin-top: auto;
  padding: 16px;
}

.drawer__version {
  font-size: 11px;
  color: var(--dm-text-secondary);
}

.dm-fade-enter-active,
.dm-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
}

.dm-drawer-enter-active,
.dm-drawer-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.dm-drawer-enter-from,
.dm-drawer-leave-to {
  transform: translateX(-100%);
}
</style>
