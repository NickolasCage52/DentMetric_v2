<template>
  <div class="stats-root">
    <div class="stats-header">
      <div class="stats-title">Статистика</div>
      <div class="stats-period-tabs">
        <button
          v-for="p in periods"
          :key="p.value"
          type="button"
          class="spt-btn"
          :class="{ 'spt-btn--active': period === p.value }"
          @click="period = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="!can('analyticsBasic')" class="stats-locked card-metallic rounded-2xl p-8 text-center">
      <div class="stats-locked__icon">📊</div>
      <div class="stats-locked__text">Статистика доступна с тарифа Demo</div>
      <button type="button" class="btn-primary mt-4 py-3 px-6 rounded-xl bg-metric-green text-black font-semibold" @click="$emit('upgrade')">
        Улучшить тариф
      </button>
    </div>

    <template v-else>
      <div class="stats-kpi-grid">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="kpi-card card-metallic rounded-2xl p-5"
        >
          <div class="kpi-card__value">{{ kpi.value }}</div>
          <div class="kpi-card__label">{{ kpi.label }}</div>
        </div>
      </div>

      <div v-if="can('profitCalc')" class="stats-profit card-metallic rounded-2xl p-5">
        <div class="stats-profit__title">Прибыль за период</div>
        <div class="stats-profit__amount">{{ formatMoney(stats.profit) }} ₽</div>
        <div class="stats-profit__sub">Расчёт на основе выполненных оценок</div>
      </div>

      <div
        v-else
        class="stats-profit-locked card-metallic rounded-2xl p-5 flex items-center gap-4 cursor-pointer"
        @click="$emit('upgrade')"
      >
        <div class="spl-icon text-3xl">💰</div>
        <div class="spl-text flex-1">
          <div class="spl-title font-semibold">Расчёт прибыли</div>
          <div class="spl-sub text-sm text-gray-500">Доступно с тарифа PRO</div>
        </div>
        <div class="spl-lock text-xl opacity-50">🔒</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAccount } from '../useAccount'
import { loadHistory, STATUS_DONE } from '../../../features/history/historyStore'

const emit = defineEmits(['upgrade'])
const { can } = useAccount()
const period = ref('month')

const periods = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
]

const stats = ref({
  totalEstimates: 0,
  completedEstimates: 0,
  conversionRate: 0,
  avgCheck: 0,
  profit: 0,
})

function loadStatsFromHistory() {
  try {
    const records = loadHistory(true)
    const now = Date.now()
    const periodMs =
      { week: 7, month: 30, year: 365 }[period.value] * 86400000
    const filtered = records.filter((r) => {
      const created = r.createdAt ? new Date(r.createdAt).getTime() : 0
      return now - created <= periodMs
    })

    const completed = filtered.filter((r) => r.status === STATUS_DONE)
    const total = filtered.length

    const profitSum = completed.reduce(
      (s, r) => s + (r.totalActual ?? r.total ?? 0),
      0
    )

    stats.value = {
      totalEstimates: total,
      completedEstimates: completed.length,
      conversionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      avgCheck:
        completed.length > 0
          ? Math.round(profitSum / completed.length)
          : 0,
      profit: profitSum,
    }
  } catch {
    /* ignore */
  }
}

const kpis = computed(() => [
  { label: 'Оценок', value: stats.value.totalEstimates },
  { label: 'Выполнено', value: stats.value.completedEstimates },
  { label: 'Конверсия', value: stats.value.conversionRate + '%' },
  { label: 'Средний чек', value: formatMoney(stats.value.avgCheck) + ' ₽' },
])

function formatMoney(n) {
  return (n ?? 0).toLocaleString('ru-RU')
}

watch(period, loadStatsFromHistory)
onMounted(loadStatsFromHistory)
</script>

<style scoped>
.stats-root {
  padding: 1rem;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.stats-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
}

.stats-period-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}

.spt-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
}

.spt-btn--active {
  background: rgba(136, 229, 35, 0.1);
  border-color: var(--metric-green);
  color: var(--metric-green);
}

.stats-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 1rem;
}

.kpi-card__value {
  font-size: 24px;
  font-weight: 700;
  color: var(--metric-green);
}

.kpi-card__label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.stats-profit__title {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-profit__amount {
  font-size: 28px;
  font-weight: 700;
  color: var(--metric-green);
  margin-top: 4px;
}

.stats-profit__sub {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.stats-locked__icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.stats-locked__text {
  font-size: 15px;
  color: #888;
}
</style>
