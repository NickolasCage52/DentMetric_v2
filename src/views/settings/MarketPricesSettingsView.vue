<template>
  <div class="mp-settings">
    <div class="mp-settings__header">
      <button type="button" class="mp-settings__back" @click="$emit('back')">
        ← Назад
      </button>
      <div class="mp-settings__title">Рыночные цены</div>
    </div>

    <div class="mp-settings__content">
      <div class="mp-settings__section-label">Участие</div>
      <div class="mp-settings__toggle-row">
        <div class="mp-settings__toggle-info">
          <div class="mp-settings__toggle-label">
            Анонимный сбор данных о ценах
          </div>
          <div class="mp-settings__toggle-sub">
            Помогает формировать рыночные ориентиры
          </div>
        </div>
        <label class="mp-settings__toggle">
          <input
            type="checkbox"
            :checked="store.consentGranted"
            @change="handleConsentToggle"
          >
          <span class="mp-settings__toggle-track" />
        </label>
      </div>

      <div class="mp-settings__info-card">
        <div class="mp-settings__info-title">Что мы собираем:</div>
        <div class="mp-settings__info-item">{{ check }} Название элемента (дверь, капот и т.д.)</div>
        <div class="mp-settings__info-item">{{ check }} Класс автомобиля (A, B, C...)</div>
        <div class="mp-settings__info-item">{{ check }} Цена (округлённая до 100 {{ rub }})</div>
        <div class="mp-settings__info-item">{{ check }} Город</div>
        <div class="mp-settings__info-separator" />
        <div class="mp-settings__info-never">Никогда:</div>
        <div class="mp-settings__info-item mp-settings__info-item--no">
          {{ cross }} Данные клиента (имя, телефон, авто)
        </div>
        <div class="mp-settings__info-item mp-settings__info-item--no">
          {{ cross }} Точное время расчёта
        </div>
        <div class="mp-settings__info-item mp-settings__info-item--no">
          {{ cross }} Ваши личные данные
        </div>
      </div>

      <div v-if="store.consentGranted && store.benchmarks.length > 0">
        <div class="mp-settings__section-label">
          Текущие ориентиры
          <span class="mp-settings__section-count">
            {{ store.benchmarks.length }}
          </span>
        </div>
        <div
          v-for="b in topBenchmarks"
          :key="`${b.city}:${b.carClass}:${b.panelElement}`"
          class="mp-settings__benchmark-row"
        >
          <span class="mp-settings__benchmark-element">
            {{ b.panelElement.replace(/_/g, ' ') }}
          </span>
          <span class="mp-settings__benchmark-range">
            {{ formatMoney(b.p25Price) }} – {{ formatMoney(b.p75Price) }}
          </span>
        </div>

        <div class="mp-settings__apply-section">
          <button
            type="button"
            class="mp-settings__apply-btn"
            @click="showApplyConfirm = true"
          >
            {{ '\u{1F4E5}' }} Установить рыночные цены
          </button>
          <div class="mp-settings__apply-hint">
            Масштабирует базовые цены в настройках ценообразования под медиану выборки по вашему городу
          </div>
        </div>
      </div>

      <div v-if="store.consentGranted" class="mp-settings__refresh">
        <button
          type="button"
          class="mp-settings__refresh-btn"
          :disabled="store.isLoading"
          @click="store.fetchForCurrentCity()"
        >
          {{ store.isLoading ? 'Загрузка...' : 'Обновить данные' }}
        </button>
        <div
          v-if="store.lastFetchAt"
          class="mp-settings__refresh-time"
        >
          Обновлено: {{ formatTime(store.lastFetchAt) }}
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dm-fade">
        <div
          v-if="showApplyConfirm"
          class="mp-settings__confirm-overlay"
          @click.self="showApplyConfirm = false"
        >
          <div class="mp-settings__confirm-dialog" role="dialog" aria-modal="true">
            <div class="mp-settings__confirm-title">
              Установить рыночные цены?
            </div>
            <div class="mp-settings__confirm-body">
              Базовые цены в настройках ценообразования будут умножены на коэффициент
              (медиана рынка / ваш средний базовый прайс). Это повлияет на все новые расчёты.
            </div>
            <div class="mp-settings__confirm-actions">
              <button
                type="button"
                class="mp-settings__confirm-cancel"
                @click="showApplyConfirm = false"
              >
                Отмена
              </button>
              <button
                type="button"
                class="mp-settings__confirm-ok"
                @click="onApplyConfirm"
              >
                Установить
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketPricesStore } from '@/stores/marketPrices'

const emit = defineEmits<{
  back: []
  'apply-prices': []
}>()

const store = useMarketPricesStore()
const showApplyConfirm = ref(false)

const check = '\u2713'
const cross = '\u2717'
const rub = '\u20BD'

const topBenchmarks = computed(() => store.benchmarks.slice(0, 10))

function handleConsentToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) store.grantConsent()
  else store.revokeConsent()
}

function formatMoney(amount: number): string {
  if (amount >= 1000) return `${Math.round(amount / 1000)} тыс. ${rub}`
  return `${amount.toLocaleString('ru-RU')} ${rub}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onApplyConfirm() {
  showApplyConfirm.value = false
  emit('apply-prices')
}
</script>

<style scoped>
.mp-settings {
  position: fixed;
  inset: 0;
  background: var(--dm-bg, hsl(0 0% 6%));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 230;
}
.mp-settings__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
  flex-shrink: 0;
  gap: 8px;
}
.mp-settings__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.mp-settings__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.mp-settings__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 40px;
}
.mp-settings__section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  padding: 14px 16px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.mp-settings__section-count {
  background: var(--dm-surface-2, hsl(0 0% 12%));
  border-radius: 8px;
  padding: 1px 7px;
  font-size: 10px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  text-transform: none;
  letter-spacing: 0;
}
.mp-settings__toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
}
.mp-settings__toggle-info {
  flex: 1;
}
.mp-settings__toggle-label {
  font-size: 15px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.mp-settings__toggle-sub {
  font-size: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-top: 2px;
}
.mp-settings__toggle {
  position: relative;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}
.mp-settings__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.mp-settings__toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: var(--dm-border, hsl(0 0% 16%));
  cursor: pointer;
  transition: background 0.2s;
}
.mp-settings__toggle input:checked + .mp-settings__toggle-track {
  background: var(--dm-accent, hsl(78 70% 45%));
}
.mp-settings__toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: hsl(0 0% 100%);
  transition: transform 0.2s;
}
.mp-settings__toggle input:checked + .mp-settings__toggle-track::after {
  transform: translateX(22px);
}
.mp-settings__info-card {
  margin: 8px 16px;
  padding: 14px;
  background: var(--dm-surface, hsl(0 0% 9%));
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  border-radius: 12px;
}
.mp-settings__info-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.mp-settings__info-item {
  font-size: 13px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
  padding: 3px 0;
}
.mp-settings__info-item--no {
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}
.mp-settings__info-separator {
  height: 1px;
  background: var(--dm-border, hsl(0 0% 16%));
  margin: 8px 0;
}
.mp-settings__info-never {
  font-size: 11px;
  font-weight: 700;
  color: var(--dm-danger, hsl(0 72% 55%));
  margin-bottom: 4px;
}
.mp-settings__benchmark-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  min-height: 44px;
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
}
.mp-settings__benchmark-element {
  font-size: 14px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
  text-transform: capitalize;
}
.mp-settings__benchmark-range {
  font-size: 13px;
  color: var(--dm-accent, hsl(78 70% 45%));
  font-weight: 600;
}
.mp-settings__apply-section {
  padding: 16px;
}
.mp-settings__apply-btn {
  width: 100%;
  min-height: 52px;
  background: var(--dm-surface, hsl(0 0% 9%));
  border: 1px solid var(--dm-accent, hsl(78 70% 45%));
  border-radius: 14px;
  color: var(--dm-accent, hsl(78 70% 45%));
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.mp-settings__apply-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  line-height: 1.5;
}
.mp-settings__refresh {
  padding: 12px 16px;
}
.mp-settings__refresh-btn {
  width: 100%;
  min-height: 44px;
  background: transparent;
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  border-radius: 10px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 13px;
  cursor: pointer;
}
.mp-settings__refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.mp-settings__refresh-time {
  text-align: center;
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-top: 6px;
}
.mp-settings__confirm-overlay {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.7);
  z-index: 600;
  display: flex;
  align-items: flex-end;
}
.mp-settings__confirm-dialog {
  width: 100%;
  background: var(--dm-surface, hsl(0 0% 9%));
  border-radius: 20px 20px 0 0;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mp-settings__confirm-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.mp-settings__confirm-body {
  font-size: 14px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  line-height: 1.5;
}
.mp-settings__confirm-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.mp-settings__confirm-cancel {
  flex: 1;
  min-height: 48px;
  background: transparent;
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  border-radius: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 14px;
  cursor: pointer;
}
.mp-settings__confirm-ok {
  flex: 2;
  min-height: 48px;
  background: var(--dm-accent, hsl(78 70% 45%));
  border: none;
  border-radius: 12px;
  color: hsl(0 0% 0%);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.dm-fade-enter-active,
.dm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
}
</style>
