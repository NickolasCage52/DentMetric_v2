<template>
  <div class="client-view">
    <div class="client-view__brand">
      <span class="client-view__logo">DM</span>
      <span class="client-view__brand-name">DentMetric</span>
    </div>

    <div v-if="photoUrl" class="client-view__photo-wrap" @click="openPhotoFull">
      <img :src="photoUrl" class="client-view__photo" alt="Фото повреждения" >
      <div class="client-view__photo-hint">Нажмите для увеличения</div>
    </div>

    <div v-if="carLine" class="client-view__section">
      <div class="client-view__car">{{ carLine }}</div>
    </div>

    <div v-if="dentsList.length" class="client-view__section">
      <div class="client-view__section-label">Повреждения</div>
      <div
        v-for="(dent, i) in dentsList"
        :key="i"
        class="client-view__dent-row"
      >
        <span class="client-view__dent-badge">{{ i + 1 }}</span>
        <span class="client-view__dent-name">{{ dent.label }}</span>
        <span class="client-view__dent-price">{{ dent.priceFormatted }}</span>
      </div>
    </div>

    <div v-if="repairTimeText" class="client-view__section">
      <div class="client-view__time-row">
        <span class="client-view__time-icon" aria-hidden="true">&#9201;</span>
        <span class="client-view__time-label">Время ремонта</span>
        <span class="client-view__time-value">{{ repairTimeText }}</span>
      </div>
      <div v-if="readyAtText" class="client-view__ready-time">Готово к {{ readyAtText }}</div>
    </div>

    <div class="client-view__total-section">
      <div class="client-view__total-label">К оплате</div>
      <div class="client-view__total-value">{{ animatedTotalFormatted }}</div>
    </div>

    <button
      type="button"
      class="client-view__details-toggle"
      @click="showDetails = !showDetails"
    >
      <span>{{ showDetails ? 'Скрыть детали' : 'Посмотреть детали расчёта' }}</span>
      <span aria-hidden="true">{{ showDetails ? '▲' : '▼' }}</span>
    </button>
    <div v-if="showDetails" class="client-view__details-body">
      <slot name="details" />
    </div>

    <div v-if="masterName?.trim()" class="client-view__master">
      <span class="client-view__master-label">Мастер</span>
      <span class="client-view__master-name">{{ masterName.trim() }}</span>
    </div>

    <div class="client-view__share">
      <ShareButton :record="shareableRecord" />
    </div>

    <Teleport to="body">
      <div
        v-if="photoFullOpen"
        class="client-view__photo-modal"
        @click="photoFullOpen = false"
      >
        <img :src="photoUrl || ''" class="client-view__photo-modal-img" alt="" >
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ShareButton from '@/components/ShareButton.vue';
import type { ShareableRecord } from '@/utils/shareEstimate';
import { formatMoneyWithCurrency, type DisplayCurrency } from '@/utils/regionFormat';

const props = defineProps<{
  photoUrl?: string | null;
  total: number;
  currency?: string;
  dents?: Array<{
    panelElement?: string;
    total?: number;
    color?: string;
    length?: number;
    width?: number;
  }>;
  repairTimeHours?: number | string | null;
  masterName?: string;
  client?: {
    name?: string;
    phone?: string;
    brand?: string;
    model?: string;
    plate?: string;
  };
  comment?: string;
}>();

const moneyCurrency = computed<DisplayCurrency>(() =>
  props.currency === 'BYN' ? 'BYN' : 'RUB'
);

const showDetails = ref(false);
const photoFullOpen = ref(false);

const displayTotal = ref(0);

function runCountUp() {
  const target = Number(props.total) || 0;
  displayTotal.value = 0;
  if (target <= 0) return;
  const duration = 700;
  const start = Date.now();
  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    displayTotal.value = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

watch(() => props.total, runCountUp, { immediate: true });

const animatedTotalFormatted = computed(() =>
  formatMoneyWithCurrency(displayTotal.value, moneyCurrency.value)
);

const carLine = computed(() => {
  const parts = [props.client?.brand, props.client?.model].filter(Boolean);
  const plate = props.client?.plate;
  if (!parts.length && !plate) return '';
  return [parts.join(' '), plate].filter(Boolean).join(' · ');
});

const dentsList = computed(() =>
  (props.dents || []).map((d, i) => ({
    label: d.panelElement || `Вмятина ${i + 1}`,
    priceFormatted: formatMoneyWithCurrency(Number(d.total) || 0, moneyCurrency.value),
  }))
);

const repairTimeText = computed(() => {
  const hRaw = props.repairTimeHours;
  if (hRaw == null || hRaw === '' || !Number.isFinite(Number(hRaw)) || Number(hRaw) <= 0) return '';
  const hNum = Number(hRaw);
  const h = Math.floor(hNum);
  const m = Math.round((hNum - h) * 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
});

const readyAtText = computed(() => {
  const hRaw = props.repairTimeHours;
  if (hRaw == null || hRaw === '' || !Number.isFinite(Number(hRaw)) || Number(hRaw) <= 0) return '';
  const ready = new Date(Date.now() + Number(hRaw) * 3600 * 1000);
  return ready.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

function openPhotoFull() {
  if (props.photoUrl) photoFullOpen.value = true;
}

const shareableRecord = computed<ShareableRecord>(() => ({
  client: props.client,
  total: Number(props.total) || 0,
  currency: moneyCurrency.value,
  dents: props.dents,
  repairTimeHours:
    props.repairTimeHours != null &&
    props.repairTimeHours !== '' &&
    Number.isFinite(Number(props.repairTimeHours))
      ? Number(props.repairTimeHours)
      : undefined,
  masterName: props.masterName,
  comment: props.comment,
}));
</script>

<style scoped>
.client-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--dm-bg);
  min-height: 100%;
  padding-bottom: 32px;
  max-width: 100%;
  overflow-x: hidden;
}

.client-view__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 8px;
}
.client-view__logo {
  font-size: 18px;
  font-weight: 900;
  color: var(--dm-accent);
  letter-spacing: -0.5px;
}
.client-view__brand-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-secondary);
}

.client-view__photo-wrap {
  position: relative;
  width: 100%;
  cursor: pointer;
  background: var(--dm-bg);
}
.client-view__photo {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
}
.client-view__photo-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  color: color-mix(in srgb, var(--dm-text-primary) 60%, transparent);
  background: color-mix(in srgb, var(--dm-bg) 40%, transparent);
  padding: 3px 8px;
  border-radius: 10px;
}

.client-view__section {
  padding: 16px 16px 0;
}
.client-view__section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dm-text-secondary);
  margin-bottom: 10px;
}

.client-view__car {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.client-view__dent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--dm-border);
}
.client-view__dent-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--dm-bg);
  background: var(--dm-accent);
  flex-shrink: 0;
}
.client-view__dent-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--dm-text-primary);
}
.client-view__dent-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary);
  flex-shrink: 0;
}

.client-view__time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px;
}
.client-view__time-icon {
  font-size: 16px;
}
.client-view__time-label {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-secondary);
}
.client-view__time-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.client-view__ready-time {
  font-size: 13px;
  color: var(--dm-accent);
  padding: 2px 0 8px 26px;
}

.client-view__total-section {
  margin: 20px 16px 0;
  padding: 20px 16px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 16px;
  text-align: center;
}
.client-view__total-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dm-text-secondary);
  margin-bottom: 8px;
}
.client-view__total-value {
  font-size: clamp(28px, 12vw, 48px);
  font-weight: 900;
  color: var(--dm-accent);
  letter-spacing: -2px;
  line-height: 1;
  word-break: break-word;
}

.client-view__details-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  margin-top: 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--dm-text-secondary);
  min-height: 44px;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  box-sizing: border-box;
}
.client-view__details-body {
  padding: 0 16px 8px;
  max-width: 100%;
  overflow-x: hidden;
}

.client-view__master {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px 0;
  font-size: 13px;
  gap: 8px;
}
.client-view__master-label {
  color: var(--dm-text-secondary);
}
.client-view__master-name {
  color: var(--dm-text-primary);
  font-weight: 600;
  text-align: right;
}

.client-view__share {
  padding: 16px 16px 0;
}
.client-view__share :deep(.share-btn) {
  width: 100%;
  justify-content: center;
  background: var(--dm-accent);
  border-color: var(--dm-accent);
  color: var(--dm-bg);
  font-size: 15px;
  height: 48px;
  max-width: 100%;
}

.client-view__photo-modal {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--dm-bg) 95%, transparent);
  z-index: 10060;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.client-view__photo-modal-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
