<template>
  <div class="client-profile">
    <div class="client-profile__header">
      <button type="button" class="client-profile__back" @click="$emit('back')">← Назад</button>
      <div class="client-profile__title">Клиент</div>
    </div>

    <div v-if="!profile" class="client-profile__empty">Клиент не найден</div>

    <div v-else class="client-profile__content">
      <div class="client-profile__hero">
        <div class="client-profile__avatar">
          {{ (profile.name || '?')[0].toUpperCase() }}
        </div>
        <div class="client-profile__hero-info">
          <div class="client-profile__name">{{ profile.name || 'Без имени' }}</div>
          <div class="client-profile__phone">{{ profile.phone }}</div>
          <div class="client-profile__car">
            {{ [profile.brand, profile.model].filter(Boolean).join(' ') }}
            {{ profile.plate ? `· ${profile.plate}` : '' }}
          </div>
          <div
            v-if="profile.loyaltyBadge"
            class="client-profile__badge"
            :class="`client-profile__badge--${profile.loyaltyBadge}`"
          >
            {{ profile.loyaltyLabel }}
          </div>
        </div>
        <div v-if="profile.clientMood" class="client-profile__mood" aria-hidden="true">
          {{ moodEmoji(profile.clientMood) }}
        </div>
      </div>

      <div class="client-profile__stats">
        <div class="client-profile__stat">
          <div class="client-profile__stat-value">{{ profile.totalVisits }}</div>
          <div class="client-profile__stat-label">Визитов</div>
        </div>
        <div class="client-profile__stat-div" />
        <div class="client-profile__stat">
          <div class="client-profile__stat-value">{{ formatMoney(profile.lifetimeValue) }}</div>
          <div class="client-profile__stat-label">Всего</div>
        </div>
        <div class="client-profile__stat-div" />
        <div class="client-profile__stat">
          <div class="client-profile__stat-value">{{ formatMoney(profile.avgTicket) }}</div>
          <div class="client-profile__stat-label">Ср. чек</div>
        </div>
      </div>

      <div class="client-profile__info-section">
        <div v-if="profile.lastVisitDate" class="client-profile__info-row">
          <span class="client-profile__info-label">Последний визит</span>
          <span class="client-profile__info-value">{{ formatDate(profile.lastVisitDate) }}</span>
        </div>
        <div v-if="profile.returnFrequencyDays" class="client-profile__info-row">
          <span class="client-profile__info-label">Частота визитов</span>
          <span class="client-profile__info-value">раз в {{ profile.returnFrequencyDays }} дн.</span>
        </div>
        <div v-if="profile.noShowCount > 0" class="client-profile__info-row">
          <span class="client-profile__info-label">Не пришёл</span>
          <span class="client-profile__info-value client-profile__info-value--warn">
            {{ profile.noShowCount }} раз ({{ profile.noShowRate }}%)
          </span>
        </div>
      </div>

      <div class="client-profile__actions">
        <div class="client-profile__section-title">Действия</div>
        <button type="button" class="client-profile__action-btn" @click="callClient">
          {{ GLYPH.phone }} Позвонить
        </button>
        <button
          v-if="profile.phone"
          type="button"
          class="client-profile__action-btn"
          @click="sendFollowUp"
        >
          {{ GLYPH.chat }} Пригласить снова (WhatsApp)
        </button>
        <button
          type="button"
          class="client-profile__action-btn client-profile__action-btn--accent"
          @click="$emit('new-estimate', profile.phone)"
        >
          + Новый расчёт для этого клиента
        </button>
      </div>

      <div class="client-profile__section-title client-profile__section-title--history">
        История ({{ profile.totalVisits }})
      </div>
      <div
        v-for="record in profile.allRecords"
        :key="String(record.id)"
        class="client-profile__record"
        @click="onRecordClick(record)"
      >
        <div class="client-profile__record-left">
          <div class="client-profile__record-date">{{ formatDate(String(record.createdAt ?? '')) }}</div>
          <div class="client-profile__record-element">{{ recordElement(record) }}</div>
        </div>
        <div class="client-profile__record-right">
          <div class="client-profile__record-total">
            {{ formatMoney(recordAmount(record)) }}
          </div>
          <div
            class="client-profile__record-status"
            :class="`client-profile__record-status--${String(record.status ?? '')}`"
          >
            {{ statusLabel(String(record.status ?? '')) }}
          </div>
        </div>
        <span class="client-profile__record-chevron" aria-hidden="true">›</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useHistoryPiniaStore } from '@/stores/history';
import { computeClientProfile, formatMoney } from '@/utils/analyticsEngine';

const GLYPH = {
  phone: '\u{1F4DE}',
  chat: '\u{1F4AC}',
};

const props = defineProps<{ phone: string }>();

const emit = defineEmits<{
  back: [];
  'open-record': [id: string];
  'new-estimate': [phone: string];
}>();

const historyStore = useHistoryPiniaStore();
const { records: historyItems } = storeToRefs(historyStore);

const records = computed(() => historyItems.value ?? []);

const profile = computed(() => computeClientProfile(props.phone, records.value));

onMounted(() => {
  if (!historyStore.isLoaded) historyStore.loadHistory(false);
});

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function moodEmoji(mood: string): string {
  const map: Record<string, string> = {
    good: '\u{1F60A}',
    neutral: '\u{1F610}',
    bad: '\u{1F624}',
    '1': '\u{1F60A}',
    '2': '\u{1F610}',
    '3': '\u{1F624}',
  };
  return map[mood] || '\u{1F610}';
}

function recordElement(record: Record<string, unknown>): string {
  const dents = record.dents as { items?: unknown[] } | undefined;
  const snap = record.lineItemsSnapshot as unknown[] | undefined;
  const items = Array.isArray(dents?.items) ? dents!.items! : Array.isArray(snap) ? snap : [];
  if (items.length === 0) return String(record.calcMode ?? record.mode ?? 'Расчёт');
  const first = items[0] as Record<string, unknown>;
  const el = String(first?.panelElement ?? first?.element ?? 'Вмятина');
  return items.length > 1 ? `${el} +${items.length - 1}` : el;
}

function recordAmount(record: Record<string, unknown>): number {
  const manual = record.manualAdjustedPrice;
  if (manual != null && Number.isFinite(Number(manual))) return Number(manual);
  const t = record.total;
  if (t != null && Number.isFinite(Number(t))) return Number(t);
  return 0;
}

const STATUS_LABELS: Record<string, string> = {
  estimate: 'Оценка',
  scheduled: 'Записан',
  done: 'Выполнено',
  paid: 'Оплачено',
  rejected: 'Отказ',
  no_show: 'Не пришёл',
  in_progress: 'В работе',
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

function callClient() {
  const p = profile.value?.phone;
  if (!p) return;
  window.location.href = `tel:+${p}`;
}

function sendFollowUp() {
  const p = profile.value?.phone;
  if (!p) return;
  const name = profile.value?.name?.split(' ')[0] || '';
  const greeting = name ? `${name}, ` : '';
  const text = [
    `${greeting}добрый день!`,
    '',
    'Мы делали оценку по вашему автомобилю ранее.',
    'Удобно записаться на ремонт вмятин?',
    '',
    'DentMetric',
  ].join('\n');
  window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function onRecordClick(record: Record<string, unknown>) {
  const id = record.id != null ? String(record.id) : '';
  if (id) emit('open-record', id);
}
</script>

<style scoped>
.client-profile {
  position: fixed;
  inset: 0;
  z-index: 280;
  background: var(--dm-bg, #0f0f0f);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.client-profile__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  flex-shrink: 0;
  gap: 8px;
}
.client-profile__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, #888);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.client-profile__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}
.client-profile__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dm-text-secondary, #888);
}
.client-profile__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
}

.client-profile__hero {
  display: flex;
  gap: 14px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  align-items: flex-start;
}
.client-profile__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--dm-surface-2, #1e1e1e);
  border: 2px solid var(--dm-accent, #a0e040);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--dm-accent, #a0e040);
  flex-shrink: 0;
}
.client-profile__hero-info {
  flex: 1;
}
.client-profile__name {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}
.client-profile__phone {
  font-size: 14px;
  color: var(--dm-text-secondary, #888);
  margin-top: 2px;
}
.client-profile__car {
  font-size: 13px;
  color: var(--dm-text-secondary, #888);
  margin-top: 2px;
}
.client-profile__badge {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
}
.client-profile__badge--vip {
  background: color-mix(in srgb, hsl(38 92% 50%) 18%, transparent);
  color: hsl(43 96% 56%);
  border: 1px solid color-mix(in srgb, hsl(38 92% 50%) 35%, transparent);
}
.client-profile__badge--regular {
  background: color-mix(in srgb, var(--dm-accent, #a0e040) 18%, transparent);
  color: var(--dm-accent, #a0e040);
  border: 1px solid color-mix(in srgb, var(--dm-accent, #a0e040) 35%, transparent);
}
.client-profile__badge--new {
  background: color-mix(in srgb, hsl(239 84% 67%) 18%, transparent);
  color: hsl(250 95% 76%);
  border: 1px solid color-mix(in srgb, hsl(239 84% 67%) 35%, transparent);
}
.client-profile__badge--at_risk {
  background: color-mix(in srgb, var(--dm-danger, #e53935) 12%, transparent);
  color: var(--dm-danger, #e53935);
  border: 1px solid color-mix(in srgb, var(--dm-danger, #e53935) 35%, transparent);
}
.client-profile__mood {
  font-size: 24px;
}

.client-profile__stats {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 4px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.client-profile__stat {
  flex: 1;
  text-align: center;
}
.client-profile__stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--dm-text-primary, #fff);
}
.client-profile__stat-label {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  margin-top: 2px;
}
.client-profile__stat-div {
  width: 1px;
  height: 32px;
  background: var(--dm-border, #2a2a2a);
  flex-shrink: 0;
}

.client-profile__info-section {
  padding: 4px 0;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.client-profile__info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  min-height: 44px;
  align-items: center;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.client-profile__info-label {
  font-size: 14px;
  color: var(--dm-text-secondary, #888);
}
.client-profile__info-value {
  font-size: 14px;
  color: var(--dm-text-primary, #fff);
  font-weight: 500;
}
.client-profile__info-value--warn {
  color: hsl(38 92% 50%);
}

.client-profile__actions {
  padding: 8px 16px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.client-profile__section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary, #888);
  padding: 10px 0 6px;
}
.client-profile__section-title--history {
  padding: 12px 16px 6px;
}
.client-profile__action-btn {
  display: block;
  width: 100%;
  height: 48px;
  margin-bottom: 8px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 12px;
  color: var(--dm-text-primary, #fff);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  padding: 0 16px;
}
.client-profile__action-btn--accent {
  border-color: var(--dm-accent, #a0e040);
  color: var(--dm-accent, #a0e040);
}

.client-profile__record {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  cursor: pointer;
  transition: background 0.15s;
  min-height: 64px;
}
.client-profile__record:active {
  background: var(--dm-surface, #161616);
}
.client-profile__record-left {
  flex: 1;
  min-width: 0;
}
.client-profile__record-date {
  font-size: 13px;
  color: var(--dm-text-secondary, #888);
}
.client-profile__record-element {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-profile__record-right {
  text-align: right;
  flex-shrink: 0;
}
.client-profile__record-total {
  font-size: 14px;
  font-weight: 700;
  color: var(--dm-accent, #a0e040);
}
.client-profile__record-status {
  font-size: 11px;
  margin-top: 2px;
}
.client-profile__record-status--done,
.client-profile__record-status--paid {
  color: var(--dm-accent, #a0e040);
}
.client-profile__record-status--scheduled {
  color: hsl(226 70% 60%);
}
.client-profile__record-status--rejected,
.client-profile__record-status--no_show {
  color: var(--dm-danger, #e53935);
}
.client-profile__record-status--estimate {
  color: hsl(38 92% 50%);
}
.client-profile__record-chevron {
  color: var(--dm-text-secondary, #888);
  font-size: 18px;
  flex-shrink: 0;
}
</style>
