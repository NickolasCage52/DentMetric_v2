<template>
  <div class="stats-dash">
    <div class="stats-dash__header">
      <button type="button" class="stats-dash__back" @click="$emit('back')">← Назад</button>
      <div class="stats-dash__title">Аналитика</div>
    </div>

    <div v-if="!hasAnalytics" class="stats-dash__paywall">
      <div class="stats-dash__paywall-icon" aria-hidden="true">{{ GLYPH.chart }}</div>
      <div class="stats-dash__paywall-title">Аналитика доступна в PRO</div>
      <div class="stats-dash__paywall-sub">
        Отслеживайте выручку, конверсию и рост бизнеса
      </div>
      <button type="button" class="stats-dash__paywall-btn" @click="$emit('navigate', 'tariffs')">
        Перейти на PRO →
      </button>
      <div class="stats-dash__paywall-preview">
        <div class="stats-dash__preview-card stats-dash__preview-card--blur">
          <div class="stats-dash__metric-label">ВЫРУЧКА</div>
                   <div class="stats-dash__metric-value">{{ previewMoney }}</div>
        </div>
        <div class="stats-dash__preview-card stats-dash__preview-card--blur">
          <div class="stats-dash__metric-label">КОНВЕРСИЯ</div>
          <div class="stats-dash__metric-value">67%</div>
        </div>
      </div>
    </div>

    <div v-else class="stats-dash__content">
      <div class="stats-dash__period-row">
        <button
          v-for="p in PERIODS"
          :key="p.value"
          type="button"
          :class="['stats-dash__period-btn', period === p.value && 'stats-dash__period-btn--active']"
          @click="period = p.value"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="stats-dash__primary-card">
        <div class="stats-dash__primary-label">ФАКТИЧЕСКАЯ ВЫРУЧКА</div>
        <div class="stats-dash__primary-value">{{ formatMoney(stats.actualRevenue) }}</div>
        <div class="stats-dash__primary-sub">
          Потенциал: {{ formatMoney(stats.potentialRevenue) }}
          · {{ stats.estimatesCount }} оценок
        </div>
      </div>

      <div class="stats-dash__grid">
        <StatCard
          :label="'Средний чек'"
          :value="formatMoney(stats.avgTicket)"
          :icon="GLYPH.money"
        />
        <StatCard
          :label="'Конверсия'"
          :value="formatPercent(stats.conversionRate)"
          :icon="GLYPH.bar"
          :highlight="stats.conversionRate >= 70"
        />
        <StatCard
          :label="'Выполнено'"
          :value="String(stats.completedCount)"
          :icon="GLYPH.check"
          :sub="`из ${stats.estimatesCount} оценок`"
        />
        <StatCard
          :label="'Доходимость'"
          :value="formatPercent(stats.showUpRate)"
          :icon="GLYPH.person"
          :sub="'клиентов пришли'"
        />
        <StatCard
          :label="'Среднее время'"
          :value="formatRepairTime(stats.avgRepairHours)"
          :icon="GLYPH.clock"
        />
        <StatCard
          :label="'Предоплата'"
          :value="formatMoney(stats.prepaymentTotal)"
          :icon="GLYPH.card"
        />
      </div>

      <div class="stats-dash__sparkline-section">
        <div class="stats-dash__sparkline-title">Выручка по неделям</div>
        <RevenueSparkline :data="stats.weeklyRevenue" />
      </div>

      <div v-if="stats.topElements.length > 0" class="stats-dash__top-section">
        <div class="stats-dash__section-title">Топ элементов</div>
        <div
          v-for="(el, i) in stats.topElements"
          :key="el.element"
          class="stats-dash__top-row"
        >
          <span class="stats-dash__top-rank">{{ i + 1 }}</span>
          <span class="stats-dash__top-name">{{ el.element }}</span>
          <div class="stats-dash__top-bar-wrap">
            <div
              class="stats-dash__top-bar"
              :style="{ width: `${(el.count / stats.topElements[0].count) * 100}%` }"
            />
          </div>
          <span class="stats-dash__top-count">{{ el.count }}</span>
        </div>
      </div>

      <div v-if="employees.length > 0" class="stats-dash__salary-section">
        <div class="stats-dash__section-title">Зарплата сотрудников</div>
        <div v-for="salary in salaryResults" :key="salary.employeeId" class="stats-dash__salary-row">
          <div class="stats-dash__salary-name">{{ salary.employeeName }}</div>
          <div class="stats-dash__salary-details">
            <span class="stats-dash__salary-work">
              {{ salary.completedCount }} работ · {{ formatMoney(salary.completedRevenue) }}
            </span>
            <span class="stats-dash__salary-amount">
              {{
                salary.salaryType === 'percent'
                  ? `${salary.salaryValue}% = `
                  : 'Фикс: '
              }}{{ formatMoney(salary.earnedAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useHistoryPiniaStore } from '@/stores/history';
import { useBookingsStore } from '@/stores/bookings';
import { useEmployeesStore } from '@/stores/employees';
import { TARIFF_BYPASS_ENABLED } from '@/modules/account/planFeatures';
import {
  computeMasterStats,
  computeEmployeeSalary,
  getPeriodRange,
  formatMoney,
  formatPercent,
  formatRepairTime,
  type PeriodFilter,
} from '@/utils/analyticsEngine';
import StatCard from '@/components/analytics/StatCard.vue';
import RevenueSparkline from '@/components/analytics/RevenueSparkline.vue';

const previewMoney = '32\u00a0000\u00a0\u20bd';

const GLYPH = {
  chart: '\u{1F4C8}',
  money: '\u{1F4B0}',
  bar: '\u{1F4CA}',
  check: '\u2705',
  person: '\u{1F464}',
  clock: '\u23F1',
  card: '\u{1F4B3}',
};

defineEmits<{
  back: [];
  navigate: [section: string];
}>();

const authStore = useAuthStore();
const historyStore = useHistoryPiniaStore();
const { records: historyItems } = storeToRefs(historyStore);
const bookingsStore = useBookingsStore();
const { bookings } = storeToRefs(bookingsStore);
const employeesStore = useEmployeesStore();

const hasAnalytics = computed(() => {
  if (import.meta.env.VITE_TARIFF_BYPASS === 'true') return true;
  if (TARIFF_BYPASS_ENABLED) return true;
  const plan = (authStore.planId || 'free').toLowerCase();
  return plan === 'pro' || plan === 'corporate';
});

const PERIODS: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
  { value: 'all', label: 'Всё время' },
];

const period = ref<PeriodFilter>('month');

const stats = computed(() => {
  const range = getPeriodRange(period.value);
  const records = historyItems.value ?? [];
  return computeMasterStats(records, bookings.value, range);
});

const employees = computed(() => employeesStore.activeEmployees);

const salaryResults = computed(() => {
  const range = getPeriodRange(period.value);
  return employees.value.map((emp) =>
    computeEmployeeSalary(
      { id: emp.id, name: emp.name, salary: emp.salary },
      bookings.value,
      range
    )
  );
});

onMounted(() => {
  historyStore.loadHistory(false);
  employeesStore.loadEmployees();
  bookingsStore.loadBookings();
});
</script>

<style scoped>
.stats-dash {
  position: fixed;
  inset: 0;
  z-index: 280;
  background: var(--dm-bg, #0f0f0f);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.stats-dash__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  flex-shrink: 0;
  gap: 8px;
}
.stats-dash__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, #888);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.stats-dash__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}

.stats-dash__paywall {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 24px;
  text-align: center;
  gap: 12px;
  overflow-y: auto;
}
.stats-dash__paywall-icon {
  font-size: 48px;
}
.stats-dash__paywall-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--dm-text-primary, #fff);
}
.stats-dash__paywall-sub {
  font-size: 14px;
  color: var(--dm-text-secondary, #888);
  max-width: 260px;
  line-height: 1.5;
}
.stats-dash__paywall-btn {
  padding: 14px 32px;
  background: var(--dm-accent, #a0e040);
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  margin-top: 8px;
  min-height: 48px;
}
.stats-dash__paywall-preview {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.stats-dash__preview-card {
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 14px;
  padding: 20px;
  min-width: 130px;
}
.stats-dash__preview-card--blur {
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
}

.stats-dash__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
}

.stats-dash__period-row {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.stats-dash__period-row::-webkit-scrollbar {
  display: none;
}
.stats-dash__period-btn {
  padding: 8px 16px;
  border-radius: 20px;
  flex-shrink: 0;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  color: var(--dm-text-secondary, #888);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 40px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.stats-dash__period-btn--active {
  background: var(--dm-accent, #a0e040);
  border-color: var(--dm-accent, #a0e040);
  color: #000;
}

.stats-dash__primary-card {
  margin: 0 16px 12px;
  padding: 20px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 16px;
}
.stats-dash__primary-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--dm-text-secondary, #888);
  margin-bottom: 8px;
}
.stats-dash__primary-value {
  font-size: 36px;
  font-weight: 900;
  color: var(--dm-accent, #a0e040);
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 6px;
}
.stats-dash__primary-sub {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
}

.stats-dash__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 16px 12px;
}

.stats-dash__sparkline-section {
  margin: 0 16px 12px;
  padding: 16px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 14px;
}
.stats-dash__sparkline-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  margin-bottom: 12px;
}

.stats-dash__top-section {
  margin: 0 16px 12px;
  padding: 16px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 14px;
}
.stats-dash__section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  margin-bottom: 12px;
}
.stats-dash__top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.stats-dash__top-rank {
  font-size: 11px;
  font-weight: 700;
  color: var(--dm-text-secondary, #888);
  min-width: 16px;
}
.stats-dash__top-name {
  font-size: 13px;
  color: var(--dm-text-primary, #fff);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stats-dash__top-bar-wrap {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  background: var(--dm-surface-2, #1e1e1e);
  flex-shrink: 0;
}
.stats-dash__top-bar {
  height: 100%;
  border-radius: 2px;
  background: var(--dm-accent, #a0e040);
  transition: width 0.4s ease;
}
.stats-dash__top-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-text-secondary, #888);
  min-width: 20px;
  text-align: right;
}

.stats-dash__salary-section {
  margin: 0 16px 12px;
  padding: 16px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 14px;
}
.stats-dash__salary-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.stats-dash__salary-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  margin-bottom: 4px;
}
.stats-dash__salary-details {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.stats-dash__salary-work {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
}
.stats-dash__salary-amount {
  font-size: 13px;
  font-weight: 700;
  color: var(--dm-accent, #a0e040);
}

.stats-dash__metric-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--dm-text-secondary, #888);
  margin-bottom: 6px;
}
.stats-dash__metric-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--dm-accent, #a0e040);
}
</style>
