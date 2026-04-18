<template>
  <div class="pdc">
    <div class="pdc-head">
      <span class="pdc-head__title">Вмятина ‑{{ index + 1 }}</span>
      <span class="pdc-head__el">{{ row.dent?.panelElement || row.dent?.conditions?.panelElement || '—' }}</span>
    </div>
    <div class="card-metallic rounded-xl pdc-section pdc-dent-card">
      <div class="pdc-row">
        <span class="pdc-row__label">Форма:</span>
        <span class="pdc-row__val pdc-row__val--span2">{{ dentLabel(row.dent) }}</span>
      </div>
      <div class="pdc-row">
        <span class="pdc-row__label">Ориентировочное время:</span>
        <div class="pdc-row__val pdc-row__val--edit pdc-row__val--span2">
          <template v-if="readOnly">
            <span class="pdc-static">{{ timeDisplayLabel(row.dent) }}</span>
          </template>
          <template v-else>
            <template v-if="editingDentTime !== row.dent?.id">
              <button type="button" class="pdc-edit-hit" @click="startDentTimeEdit(row.dent)">
                {{ timeDisplayLabel(row.dent) }} <span class="pdc-pen">✎</span>
              </button>
            </template>
            <div v-else class="pdc-inline">
              <input
                v-model.number="dentTimeEditVal"
                type="number"
                step="0.05"
                min="0"
                class="pdc-num-input"
                @blur="saveDentTime(row.dent)"
                @keyup.enter="saveDentTime(row.dent)"
              >
              <span class="pdc-unit">ч</span>
            </div>
          </template>
        </div>
      </div>
      <div class="pdc-row">
        <span class="pdc-row__label">{{ lengthLabel }}:</span>
        <span class="pdc-row__val pdc-row__val--span2">{{ dim(row.dent?.sizeLengthMm ?? row.dent?.bboxMm?.width) }}</span>
      </div>
      <div class="pdc-row">
        <span class="pdc-row__label">Ширина:</span>
        <span class="pdc-row__val pdc-row__val--span2">{{ dim(row.dent?.sizeWidthMm ?? row.dent?.bboxMm?.height) }}</span>
      </div>
      <div class="pdc-row">
        <span class="pdc-row__label">Базовая стоимость:</span>
        <span class="pdc-row__val pdc-row__val--price pdc-row__val--span2">{{ fmt(row.base) }} {{ moneySuffix }}</span>
      </div>

      <div
        v-for="(br, ri) in breakdownRows"
        :key="ri"
        class="pdc-row pdc-row--breakdown"
      >
        <span class="pdc-row__label pdc-row__label--sm">{{ br.label }}</span>
        <span class="pdc-row__val pdc-row__val--wrap pdc-row__val--sm">{{ br.value }}</span>
        <span class="pdc-row__delta" :class="deltaClass(br.delta)">{{ formatDelta(br.delta) }}</span>
      </div>

      <div class="pdc-row pdc-row--discount">
        <span class="pdc-row__label">Скидка:</span>
        <div class="pdc-row__val pdc-row__val--span2 pdc-row__val--discount">
          <template v-if="readOnly">
            <template v-if="detailUxParity && row.discountPercent > 0">
              <span class="pdc-static">{{ row.discountPercent }}% — −{{ fmt(discountAmountRub) }} {{ moneySuffix }}</span>
            </template>
            <template v-else>
              <span class="pdc-static">{{ row.discountPercent ? row.discountPercent : '—' }}</span>
              <span class="pdc-pct">%</span>
              <span
                v-if="row.discountPercent > 0"
                class="pdc-disc-amt"
              >−{{ fmt(historyDiscountRub) }} {{ moneySuffix }}</span>
            </template>
          </template>
          <template v-else-if="detailUxParity">
            <button
              type="button"
              class="pdc-disc-hit pdc-disc-hit--parity"
              @click="$emit('open-discount', row.dent)"
            >
              <span class="pdc-disc-main">{{ discountPctDisplay }}</span>
              <span class="pdc-pct">%</span>
              <span v-if="discountPctNum > 0" class="pdc-disc-line">— −{{ fmt(discountAmountRub) }} {{ moneySuffix }}</span>
              <span class="pdc-pen">✎</span>
            </button>
          </template>
          <template v-else>
            <button type="button" class="pdc-disc-btn" @click="$emit('open-discount', row.dent)">
              {{ row.discountPercent ? row.discountPercent : '—' }}
            </button>
            <span class="pdc-pct">%</span>
          </template>
        </div>
      </div>

      <div class="pdc-price-block">
        <div class="pdc-row pdc-row--strong">
          <span class="pdc-row__label pdc-row__label--total">Итого по вмятине по системе DentMetric:</span>
          <div class="pdc-row__val pdc-row__val--edit pdc-row__val--span2">
            <template v-if="readOnly">
              <span class="pdc-grand" :class="{ 'dm-total-price': detailUxParity }">{{ fmt(row.displayTotal) }} {{ moneySuffix }}</span>
            </template>
            <template v-else>
              <template v-if="row.hasManual">
                <span class="pdc-strike">{{ fmt(row.dmTotal) }} {{ moneySuffix }}</span>
              </template>
              <template v-if="editingPrice !== row.dent?.id">
                <button type="button" class="pdc-edit-hit" :class="{ 'dm-total-price': detailUxParity }" @click="startPriceEdit(row)">
                  {{ fmt(row.displayTotal) }} {{ moneySuffix }} <span class="pdc-pen">✎</span>
                </button>
              </template>
              <div v-else class="pdc-inline">
                <input
                  v-model.number="priceEditVal"
                  type="number"
                  min="0"
                  class="pdc-num-input pdc-num-input--wide"
                  @blur="savePriceEdit(row)"
                  @keyup.enter="savePriceEdit(row)"
                >
                <span>{{ moneySuffix }}</span>
              </div>
            </template>
          </div>
        </div>
        <div v-if="!readOnly && row.hasManual" class="pdc-row">
          <span class="pdc-row__label">Индивидуальная корректировка стоимости:</span>
          <span class="pdc-row__val pdc-row__val--adj pdc-row__val--span2">
            {{ row.displayTotal > row.dmTotal ? '+' : '' }}{{ fmt(row.displayTotal - row.dmTotal) }} {{ moneySuffix }}
          </span>
        </div>
        <div class="pdc-row">
          <span class="pdc-row__label">Итоговая среднерыночная стоимость:</span>
          <span class="pdc-row__val pdc-row__val--muted pdc-row__val--span2">{{ fmt(row.marketDisplay) }} {{ moneySuffix }}</span>
        </div>
        <PriceBenchmark
          v-if="dentBenchmark"
          :benchmark="dentBenchmark"
          :master-price="Number(row.displayTotal) || 0"
          :city="benchmarkCitySlug"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted, watch } from 'vue';
import { applyPriceRoundingCeil } from '../../utils/priceRounding';
import { resolveDentShapeType } from '../../utils/resolveDentShapeType';
import { formatBreakdownDelta, deltaClass as deltaClassFn } from '../../utils/buildDetailedBreakdown';
import { formatRepairTime } from '../../utils/formatRepairTime';
import { clampDiscount } from '../../utils/discount';
import { formatRubForDisplay, currencySuffix } from '../../utils/regionFormat';
import PriceBenchmark from '@/components/analytics/PriceBenchmark.vue';
import { useMarketPricesStore } from '@/stores/marketPrices';
import { useAuthStore } from '@/stores/auth';
import { useAccount } from '@/modules/account/useAccount';
import { isSupabaseConfigured } from '@/services/supabase';
import { normalizeCitySlug } from '@/services/marketPricesService';

const props = defineProps({
  index: { type: Number, required: true },
  row: { type: Object, required: true },
  breakdownRows: { type: Array, default: () => [] },
  userSettings: { type: Object, required: true },
  engineLineItems: { type: Array, default: () => [] },
  readOnly: { type: Boolean, default: false },
  /** Detail / History parity: длина, время, скидка в ₽, стиль итого, инлайн-скидка */
  detailUxParity: { type: Boolean, default: false },
  estimateDraft: { type: Object, default: null },
  /** RUB | BYN — просмотр записи истории (значения всё равно в рублях в данных) */
  historyDisplayCurrency: { type: String, default: null },
});

defineEmits(['open-discount']);

const marketPricesStore = useMarketPricesStore();
const authStore = useAuthStore();
const account = useAccount();

const benchmarkCitySlug = computed(() => {
  const c = authStore.user?.city;
  return c ? normalizeCitySlug(String(c)) : '';
});

const panelElForBenchmark = computed(
  () => props.row.dent?.panelElement || props.row.dent?.conditions?.panelElement || '',
);

const carClassForBenchmark = computed(() => props.row.dent?.conditions?.carClassCode || 'C');

const priceBenchmarkReady = computed(
  () =>
    isSupabaseConfigured() &&
    marketPricesStore.consentGranted &&
    account.can('marketPrices') &&
    !!authStore.user?.city?.trim(),
);

const dentBenchmark = computed(() => {
  if (!priceBenchmarkReady.value || !panelElForBenchmark.value) return null;
  return marketPricesStore.getBenchmark(panelElForBenchmark.value, carClassForBenchmark.value);
});

function maybeFetchMarketPrices() {
  if (priceBenchmarkReady.value) {
    void marketPricesStore.fetchForCurrentCity();
  }
}

onMounted(() => {
  maybeFetchMarketPrices();
});

watch(priceBenchmarkReady, (ready) => {
  if (ready) void marketPricesStore.fetchForCurrentCity();
});

const lengthLabel = computed(() => (props.detailUxParity ? 'Длина' : 'Диаметр'));

const historyDiscountRub = computed(() => {
  const r = props.row;
  if (r.discountAmount != null && Number.isFinite(Number(r.discountAmount))) {
    return Math.round(Number(r.discountAmount));
  }
  const pre = Number(r.preDiscountTotal) || 0;
  const post = Number(r.displayTotal ?? r.appliedTotal) || 0;
  return Math.max(0, Math.round(pre - post));
});

const discountAmountRub = computed(() => {
  const pre = Number(props.row.preDiscountTotal) || 0;
  const pct = Number(props.row.discountPercent) || 0;
  const step = roundStep();
  const raw = pre * (pct / 100);
  if (step > 0) return applyPriceRoundingCeil(raw, step);
  return Math.round(raw);
});

const displayCurrency = computed(() => (props.historyDisplayCurrency === 'BYN' ? 'BYN' : 'RUB'));
const moneySuffix = computed(() => currencySuffix(displayCurrency.value));

const discountPctNum = computed(() => clampDiscount(Number(props.row.discountPercent) || 0));

const discountPctDisplay = computed(() => {
  const p = discountPctNum.value;
  return p > 0 ? String(p) : '—';
});

const roundStep = () => props.userSettings.priceRoundStep ?? 0;

function fmt(n) {
  return formatRubForDisplay(Number(n) || 0, displayCurrency.value);
}

function dim(mm) {
  const v = Number(mm) || 0;
  if (props.userSettings.sizeUnit === 'cm') return `${(v / 10).toFixed(1)} см`;
  return `${v.toFixed(0)} мм`;
}

function dentLabel(dent) {
  if (!dent) return '—';
  if (dent.type === 'freeform' || dent.shape === 'freeform') return 'Произвольная';
  const l = Number(dent?.sizeLengthMm ?? dent?.bboxMm?.width) || 0;
  const w = Number(dent?.sizeWidthMm ?? dent?.bboxMm?.height) || 0;
  if (l > 0 && w > 0) {
    return resolveDentShapeType(l, w) === 'stripe' ? 'Полоса' : 'Круг/овал';
  }
  return dent?.shape === 'circle' || dent?.type === 'circle' ? 'Круг/овал' : 'Полоса';
}

function formatDelta(d) {
  return formatBreakdownDelta(d, displayCurrency.value);
}

function deltaClass(delta) {
  return deltaClassFn(delta);
}

const editingPrice = ref(null);
const priceEditVal = ref(0);

function startPriceEdit(row) {
  editingPrice.value = row.dent?.id;
  priceEditVal.value = row.displayTotal;
  nextTick(() => {});
}

function savePriceEdit(row) {
  const dent = row.dent;
  if (!dent) {
    editingPrice.value = null;
    return;
  }
  const n = Number(priceEditVal.value);
  if (!Number.isFinite(n) || n < 0) {
    editingPrice.value = null;
    return;
  }
  const step = roundStep();
  const rounded = step > 0 ? applyPriceRoundingCeil(n, step) : Math.round(n);
  if (rounded === row.dmTotal) {
    dent.manualLineTotal = null;
  } else {
    dent.manualLineTotal = rounded;
  }
  editingPrice.value = null;
}

const editingDentTime = ref(null);
const dentTimeEditVal = ref(0);

function dentRepairHours(dent) {
  const o = dent?.manualRepairTimeHours;
  if (o != null && o !== '' && Number.isFinite(Number(o))) return Number(o);
  const line = props.engineLineItems.find((i) => i.dent?.id === dent?.id);
  const price = line?.appliedTotal ?? 0;
  const rate = props.userSettings.hourlyRate > 0 ? props.userSettings.hourlyRate : 4000;
  if (price <= 0 || rate <= 0) return 0;
  return Math.round((price / rate) * 100) / 100;
}

function timeDisplayLabel(dent) {
  return formatRepairTime(dentRepairHours(dent));
}

function startDentTimeEdit(dent) {
  editingDentTime.value = dent?.id;
  dentTimeEditVal.value = dentRepairHours(dent);
}

function saveDentTime(dent) {
  if (!dent) {
    editingDentTime.value = null;
    return;
  }
  const n = Number(dentTimeEditVal.value);
  const defH = (() => {
    const line = props.engineLineItems.find((i) => i.dent?.id === dent?.id);
    const price = line?.appliedTotal ?? 0;
    const rate = props.userSettings.hourlyRate > 0 ? props.userSettings.hourlyRate : 4000;
    if (price <= 0 || rate <= 0) return 0;
    return Math.round((price / rate) * 100) / 100;
  })();
  if (!Number.isFinite(n) || n < 0) {
    editingDentTime.value = null;
    return;
  }
  if (Math.abs(n - defH) < 0.001) dent.manualRepairTimeHours = null;
  else dent.manualRepairTimeHours = n;
  editingDentTime.value = null;
}
</script>

<style scoped>
.pdc-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 4px 0;
}
.pdc-head__title {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}
.pdc-head__el {
  font-size: 14px;
  font-weight: 600;
  color: #d1d5db;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pdc-section {
  padding: 12px 14px;
}
.pdc-dent-card {
  margin-bottom: 4px;
}
.pdc-row {
  display: grid;
  grid-template-columns: 1fr minmax(0, 1.15fr) auto;
  align-items: baseline;
  gap: 6px 8px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
}
.pdc-row--breakdown {
  grid-template-columns: 1fr minmax(0, 1.05fr) auto;
  font-size: 11px;
}
.pdc-row:last-child {
  border-bottom: none;
}
.pdc-row__val--span2 {
  grid-column: 2 / -1;
}
.pdc-row__val--discount {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}
.pdc-row:not(.pdc-row--breakdown) .pdc-row__label {
  grid-column: 1;
}
.pdc-row:not(.pdc-row--breakdown) .pdc-row__val--span2 {
  grid-column: 2 / -1;
  text-align: right;
}
.pdc-row--discount .pdc-row__val--span2 {
  flex-direction: row;
  justify-content: flex-end;
}
.pdc-row__label {
  color: #9ca3af;
  min-width: 0;
  text-align: left;
}
.pdc-row__label--sm {
  font-size: 10px;
  line-height: 1.25;
}
.pdc-row__val {
  color: #e5e7eb;
  text-align: right;
  min-width: 0;
}
.pdc-row__val--sm {
  font-size: 10px;
  line-height: 1.3;
}
.pdc-row__val--wrap {
  white-space: normal;
}
.pdc-row__val--price {
  font-weight: 700;
  color: #88e523;
}
.pdc-row__delta {
  font-size: 9px;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
  min-width: 52px;
}
.pdc-row__val--edit {
  text-align: right;
}
.pdc-row--strong .pdc-row__label {
  font-weight: 600;
  color: #fff;
}
.pdc-row__label--total {
  font-size: 10px;
  line-height: 1.25;
  padding-right: 4px;
}
.pdc-row--discount {
  align-items: center;
}
.pdc-row__val--adj {
  color: #f59e0b;
  font-weight: 700;
}
.pdc-row__val--muted {
  color: #6b7280;
  font-style: italic;
}
.pdc-edit-hit {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
  text-align: right;
}
.pdc-static {
  font-weight: 700;
}
.pdc-grand {
  font-size: 15px;
  font-weight: 800;
  color: #88e523;
}
.dm-total-price {
  color: var(--dm-accent, #a0e040) !important;
  font-size: 17px !important;
  font-weight: 700 !important;
}
.pdc-disc-hit {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 8px;
  min-height: 44px;
  min-width: 0;
  padding: 8px 2px 8px 10px;
  margin: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  text-align: right;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.pdc-disc-hit--parity {
  width: 100%;
  box-sizing: border-box;
}
.pdc-disc-hit:active {
  opacity: 0.88;
}
.pdc-disc-main {
  font-variant-numeric: tabular-nums;
}
.pdc-disc-line {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--dm-text-secondary, #888888);
  white-space: nowrap;
}
.pdc-pen {
  font-size: 11px;
  opacity: 0.45;
  margin-left: 4px;
}
.pdc-strike {
  text-decoration: line-through;
  color: #6b7280;
  font-size: 12px;
  margin-right: 6px;
}
.pdc-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}
.pdc-num-input {
  width: 72px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #88e523;
  background: #0a0a0a;
  color: #fff;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  padding: 0 6px;
}
.pdc-num-input--wide {
  width: 96px;
}
.pdc-unit {
  font-size: 12px;
  color: #9ca3af;
}
.pdc-disc-btn {
  min-width: 36px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #151515;
  color: #fff;
  font-weight: 600;
}
.pdc-pct {
  margin-left: 2px;
  color: #6b7280;
  font-size: 12px;
}
.pdc-disc-amt {
  margin-left: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fbbf24;
  white-space: nowrap;
}
.pdc-price-block {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
