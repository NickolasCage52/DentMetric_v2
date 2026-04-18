<template>
  <div v-if="benchmark" class="price-benchmark">
    <div class="price-benchmark__label">
      <span class="price-benchmark__icon" aria-hidden="true">{{ '\u{1F4CA}' }}</span>
      Рынок {{ cityLabel }}
    </div>
    <div class="price-benchmark__range">
      <span class="price-benchmark__low">
        {{ formatMoney(benchmark.p25Price) }}
      </span>
      <div class="price-benchmark__bar-wrap">
        <div class="price-benchmark__bar" :style="barStyle" />
        <div
          class="price-benchmark__marker"
          :style="markerStyle"
          :title="`Ваша цена: ${formatMoney(masterPrice)}`"
        />
      </div>
      <span class="price-benchmark__high">
        {{ formatMoney(benchmark.p75Price) }}
      </span>
    </div>
    <div class="price-benchmark__median">
      Медиана: {{ formatMoney(benchmark.medianPrice) }}
      <span class="price-benchmark__samples">
        · {{ benchmark.sampleCount }} данных
      </span>
    </div>
    <div
      v-if="positionLabel"
      class="price-benchmark__position"
      :class="`price-benchmark__position--${positionClass}`"
    >
      {{ positionLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MarketPriceBenchmark } from '@/services/marketPricesService'

const props = defineProps<{
  benchmark: MarketPriceBenchmark | null
  masterPrice: number
  city: string
}>()

const CITY_LABELS: Record<string, string> = {
  msk: 'Москва',
  spb: 'СПб',
  ekb: 'Екб',
  nsk: 'Нск',
  kzn: 'Казань',
  krd: 'Краснодар',
  nnov: 'Н.Новгород',
  rost: 'Ростов',
  ufa: 'Уфа',
  sam: 'Самара',
}

const cityLabel = computed(() => CITY_LABELS[props.city] || props.city || '')

const RUB = '\u20BD'

function formatMoney(amount: number): string {
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)} тыс. ${RUB}`
  }
  return `${amount.toLocaleString('ru-RU')} ${RUB}`
}

const barStyle = computed(() => ({
  width: '100%',
  height: '4px',
  background: `linear-gradient(to right, var(--dm-info, hsl(220 65% 55%)), var(--dm-accent, hsl(78 70% 45%)))`,
  borderRadius: '2px',
}))

const markerStyle = computed(() => {
  if (!props.benchmark) return {}
  const { p25Price, p75Price } = props.benchmark
  const range = p75Price - p25Price
  if (range <= 0) return { left: '50%' }
  const pct = Math.min(100, Math.max(0, ((props.masterPrice - p25Price) / range) * 100))
  return {
    left: `${pct}%`,
    transform: 'translateX(-50%)',
  }
})

const positionClass = computed(() => {
  if (!props.benchmark || !props.masterPrice) return ''
  const { p25Price, p75Price, medianPrice } = props.benchmark
  if (props.masterPrice < p25Price) return 'low'
  if (props.masterPrice > p75Price) return 'high'
  if (Math.abs(props.masterPrice - medianPrice) < medianPrice * 0.1) return 'market'
  return 'ok'
})

const positionLabel = computed(() => {
  switch (positionClass.value) {
    case 'low':
      return '↓ Ниже рынка'
    case 'high':
      return '↑ Выше рынка'
    case 'market':
      return '\u2713 По рынка'
    default:
      return ''
  }
})
</script>

<style scoped>
.price-benchmark {
  padding: 8px 0 4px;
  border-top: 1px dashed var(--dm-border, hsl(0 0% 16%));
  margin-top: 6px;
}
.price-benchmark__label {
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.price-benchmark__icon {
  font-size: 12px;
}
.price-benchmark__range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.price-benchmark__low,
.price-benchmark__high {
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  white-space: nowrap;
  flex-shrink: 0;
}
.price-benchmark__bar-wrap {
  flex: 1;
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
}
.price-benchmark__bar {
  position: absolute;
  left: 0;
  right: 0;
}
.price-benchmark__marker {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dm-accent, hsl(78 70% 45%));
  border: 2px solid var(--dm-bg, hsl(0 0% 6%));
  top: 50%;
  margin-top: -5px;
  z-index: 1;
}
.price-benchmark__median {
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}
.price-benchmark__samples {
  opacity: 0.6;
}
.price-benchmark__position {
  font-size: 11px;
  font-weight: 700;
  margin-top: 3px;
}
.price-benchmark__position--low {
  color: var(--dm-warn, hsl(38 92% 50%));
}
.price-benchmark__position--high {
  color: var(--dm-purple, hsl(258 55% 68%));
}
.price-benchmark__position--market {
  color: var(--dm-accent, hsl(78 70% 45%));
}
.price-benchmark__position--ok {
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}
</style>
