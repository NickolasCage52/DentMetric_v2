<template>
  <div class="plans-root">

    <!-- ═══ PAYMENT FLOW STATES ═══ -->
    <div v-if="paymentFlowStatus !== 'idle'" class="payment-state-container">

      <div v-if="paymentFlowStatus === 'creating'" class="payment-state">
        <div class="payment-state__spinner"></div>
        <p class="payment-state__title">Создаём платёж...</p>
        <p class="payment-state__sub">Подождите, это займёт несколько секунд</p>
      </div>

      <div v-else-if="paymentFlowStatus === 'pending'" class="payment-state">
        <span class="payment-state__icon">⏳</span>
        <p class="payment-state__title">Ожидаем подтверждения оплаты</p>
        <p class="payment-state__sub">Завершите оплату в открывшемся окне</p>
        <button class="ps-btn ps-btn--primary" @click="onCheckPayment">Проверить статус</button>
        <button class="ps-btn ps-btn--secondary" @click="onResetPayment">Отмена</button>
      </div>

      <div v-else-if="paymentFlowStatus === 'success'" class="payment-state payment-state--success">
        <span class="payment-state__icon">✅</span>
        <p class="payment-state__title payment-state__title--success">Оплата прошла!</p>
        <p class="payment-state__sub">Тариф активирован. Спасибо!</p>
        <button class="ps-btn ps-btn--primary" @click="onResetPayment">Отлично</button>
      </div>

      <div v-else-if="paymentFlowStatus === 'error'" class="payment-state payment-state--error">
        <span class="payment-state__icon">❌</span>
        <p class="payment-state__title payment-state__title--error">Ошибка оплаты</p>
        <p class="payment-state__sub">{{ paymentError || 'Попробуйте ещё раз' }}</p>
        <button class="ps-btn ps-btn--primary" @click="onResetPayment">Попробовать снова</button>
      </div>

      <div v-else-if="paymentFlowStatus === 'cancelled'" class="payment-state">
        <span class="payment-state__icon">↩️</span>
        <p class="payment-state__title">Оплата отменена</p>
        <button class="ps-btn ps-btn--secondary" @click="onResetPayment">Выбрать тариф</button>
      </div>
    </div>

    <!-- ═══ PLANS LIST (only when idle) ═══ -->
    <template v-else>
      <div class="plans-header">
        <div class="plans-title">Выберите тариф</div>
        <div class="plans-subtitle">Все тарифы включают базовый расчёт PDR</div>
      </div>

      <div class="plans-period-toggle">
        <button
          v-for="p in periods"
          :key="p.value"
          type="button"
          class="period-btn"
          :class="{ 'period-btn--active': selectedPeriod === p.value }"
          @click="selectedPeriod = p.value"
        >
          {{ p.label }}
          <span v-if="p.discount" class="period-discount">-{{ p.discount }}%</span>
        </button>
      </div>

      <div class="plans-scroll">
        <div class="plans-track">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{
              'plan-card--current': plan.id === currentPlan,
              'plan-card--highlighted': plan.highlighted,
              'plan-card--free': plan.id === 'free',
            }"
          >
            <div class="plan-card__badge" v-if="plan.highlighted">⭐ Популярный</div>

            <div class="plan-card__name">{{ plan.name }}</div>
            <div class="plan-card__price">
              <template v-if="plan.price === 0">
                <span class="price-free">Бесплатно</span>
              </template>
              <template v-else>
                <span class="price-amount">{{ displayPrice(plan) }}</span>
                <span class="price-period">₽/мес</span>
              </template>
            </div>
            <div class="plan-card__desc">{{ plan.description }}</div>

            <div class="plan-card__divider"></div>

            <div class="plan-card__features">
              <div
                v-for="feat in keyFeatures"
                :key="feat.key"
                class="plan-feat-row"
                :class="{ 'plan-feat-row--disabled': !plan.features[feat.key] }"
              >
                <span class="plan-feat-icon">{{ plan.features[feat.key] ? '✓' : '✗' }}</span>
                <span class="plan-feat-label">{{ feat.label }}</span>
              </div>
            </div>

            <div class="plan-card__cta">
              <div v-if="plan.id === currentPlan" class="plan-cta-current">Текущий тариф</div>
              <button
                v-else-if="plan.id === 'demo' && canActivateTrial"
                type="button"
                class="plan-cta-btn plan-cta-btn--trial"
                @click="onStartTrial"
                :disabled="isActivating"
              >
                Попробовать {{ TRIAL_DAYS }} дн.
              </button>
              <button
                v-else-if="plan.price > 0"
                type="button"
                class="plan-cta-btn"
                :class="{ 'plan-cta-btn--highlight': plan.highlighted }"
                @click="onActivate(plan.id)"
                :disabled="isActivating"
              >
                {{ isActivating ? '...' : 'Выбрать' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="plans-compare">
        <button type="button" class="plans-compare-toggle" @click="showCompare = !showCompare">
          {{ showCompare ? 'Скрыть' : 'Показать' }} сравнение тарифов
          <span class="plans-compare-chevron">{{ showCompare ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showCompare" class="compare-table">
          <div class="compare-row compare-row--header">
            <div class="compare-cell compare-cell--feature">Функция</div>
            <div v-for="p in plans" :key="p.id" class="compare-cell compare-cell--plan">{{ p.name }}</div>
          </div>
          <div v-for="feat in allFeatures" :key="feat.key" class="compare-row">
            <div class="compare-cell compare-cell--feature">{{ feat.label }}</div>
            <div v-for="p in plans" :key="p.id" class="compare-cell">
              <template v-if="typeof p.features[feat.key] === 'number' && p.features[feat.key] > 0">
                {{ p.features[feat.key] === 999 ? '∞' : p.features[feat.key] }}
              </template>
              <template v-else>
                <span :class="p.features[feat.key] ? 'cell-yes' : 'cell-no'">
                  {{ p.features[feat.key] ? '✓' : '—' }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAccount } from '../useAccount'
import { PLAN_INFO, PLAN_FEATURES, TRIAL_DAYS } from '../planFeatures'
import { hapticMedium, hapticSuccess } from '../utils/animations'
import { useNotifications } from '../useNotifications'

const account = useAccount()
const {
  currentPlan, subscription, startTrial,
  paymentFlowStatus, paymentError,
  startPaymentFlow, checkPaymentStatus, resetPaymentFlow,
} = account
const { success } = useNotifications()
const isActivating = ref(false)
const showCompare = ref(false)
const selectedPeriod = ref('month')

const periods = [
  { value: 'month', label: 'Месяц', discount: null },
  { value: 'year', label: 'Год', discount: 17 },
]

const planIds = ['free', 'demo', 'master', 'pro', 'corporate']
const plans = computed(() =>
  planIds.map((id) => ({
    ...PLAN_INFO[id],
    features: PLAN_FEATURES[id],
  }))
)

const canActivateTrial = computed(
  () => currentPlan.value === 'free' && !subscription.value?.trialStartedAt
)

const keyFeatures = [
  { key: 'historyEnabled', label: 'История оценок' },
  { key: 'searchByPhone', label: 'Поиск по телефону' },
  { key: 'analyticsAdvanced', label: 'Расширенная аналитика' },
  { key: 'profitCalc', label: 'Расчёт прибыли' },
  { key: 'multiMaster', label: 'Несколько мастеров' },
]

const allFeatures = [
  { key: 'calcUnlimited', label: 'Безлимит расчётов' },
  { key: 'historyEnabled', label: 'История оценок' },
  { key: 'searchByPhone', label: 'Поиск по телефону' },
  { key: 'analyticsBasic', label: 'Базовая аналитика' },
  { key: 'analyticsAdvanced', label: 'Расширенная аналитика' },
  { key: 'profitCalc', label: 'Расчёт прибыли' },
  { key: 'exportPdf', label: 'Экспорт PDF' },
  { key: 'attachmentsEnabled', label: 'Вложения' },
  { key: 'multiMaster', label: 'Несколько мастеров' },
  { key: 'crmEnabled', label: 'CRM' },
]

function displayPrice(plan) {
  if (plan.price === 0) return '0'
  if (selectedPeriod.value === 'year') {
    const yearPrice = Math.round(plan.price * 10)
    return yearPrice.toLocaleString('ru-RU')
  }
  return plan.price.toLocaleString('ru-RU')
}

async function onStartTrial() {
  hapticMedium()
  isActivating.value = true
  try {
    await startTrial()
    hapticSuccess()
    success('Демо-период активирован', `${TRIAL_DAYS} дней без ограничений`)
  } finally {
    isActivating.value = false
  }
}

async function onActivate(planId) {
  hapticMedium()
  isActivating.value = true
  try {
    await startPaymentFlow(planId)
    if (paymentFlowStatus.value === 'success') {
      hapticSuccess()
      success('Тариф активирован')
    }
  } finally {
    isActivating.value = false
  }
}

async function onCheckPayment() {
  await checkPaymentStatus()
  if (paymentFlowStatus.value === 'success') {
    hapticSuccess()
    success('Тариф активирован')
  }
}

function onResetPayment() {
  resetPaymentFlow()
}
</script>

<style scoped>
.plans-root {
  padding: 1rem 0;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

/* ─── Payment States ─── */
.payment-state-container {
  padding: 2rem 1rem;
}

.payment-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 16px;
  margin: 0 16px;
}

.payment-state__icon {
  font-size: 48px;
  line-height: 1;
}

.payment-state__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--dm-border, #2a2a2a);
  border-top-color: var(--metric-green);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.payment-state__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
  margin: 0;
}

.payment-state__title--success {
  color: var(--metric-green);
}

.payment-state__title--error {
  color: var(--dm-danger, #e53935);
}

.payment-state__sub {
  font-size: 13px;
  color: var(--dm-text-secondary, #888);
  margin: 0;
  line-height: 1.4;
}

.ps-btn {
  width: 100%;
  max-width: 280px;
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.ps-btn--primary {
  background: var(--metric-green);
  color: #000;
}

.ps-btn--secondary {
  background: transparent;
  color: var(--dm-text-secondary, #888);
  border: 1.5px solid var(--dm-border, #2a2a2a);
}

/* ─── Plans Header ─── */
.plans-header {
  padding: 0 16px 12px;
}

.plans-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.plans-subtitle {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

/* ─── Period Toggle ─── */
.plans-period-toggle {
  display: flex;
  gap: 4px;
  padding: 0 16px;
  margin-bottom: 12px;
}

.period-btn {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
}

.period-btn--active {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.period-discount {
  color: var(--metric-green);
  font-size: 10px;
  margin-left: 4px;
  font-weight: 700;
}

/* ─── Plan Cards ─── */
.plans-scroll {
  overflow-x: auto;
  padding: 0 16px;
  scrollbar-width: none;
}

.plans-scroll::-webkit-scrollbar {
  display: none;
}

.plans-track {
  display: flex;
  gap: 12px;
  padding-bottom: 8px;
  width: max-content;
}

.plan-card {
  width: 220px;
  flex-shrink: 0;
  border-radius: 16px;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.plan-card--highlighted {
  border-color: var(--metric-green);
  background: rgba(136, 229, 35, 0.06);
}

.plan-card--current {
  border-color: #64b5f6;
}

.plan-card__badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--metric-green);
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
}

.plan-card__name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.plan-card__price {
  color: var(--metric-green);
}

.price-amount {
  font-size: 28px;
  font-weight: 700;
}

.price-period {
  font-size: 12px;
  color: #888;
  margin-left: 2px;
}

.price-free {
  font-size: 20px;
  font-weight: 700;
  color: #888;
}

.plan-card__desc {
  font-size: 12px;
  color: #888;
}

.plan-card__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 0;
}

.plan-card__features {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-feat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.plan-feat-row--disabled {
  opacity: 0.35;
}

.plan-feat-icon {
  font-size: 11px;
  width: 14px;
  flex-shrink: 0;
  color: var(--metric-green);
}

.plan-feat-row--disabled .plan-feat-icon {
  color: #555;
}

.plan-cta-btn {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.plan-cta-btn--highlight {
  background: var(--metric-green);
  color: #000;
  border-color: transparent;
}

.plan-cta-btn--trial {
  border-color: #64b5f6;
  color: #64b5f6;
}

.plan-cta-current {
  text-align: center;
  font-size: 12px;
  color: #64b5f6;
  padding: 10px 0;
}

/* ─── Compare Table ─── */
.plans-compare {
  padding: 16px 16px 0;
}

.plans-compare-toggle {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #888;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.plans-compare-chevron {
  font-size: 10px;
}

.compare-table {
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.compare-row {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.compare-row--header {
  background: rgba(255, 255, 255, 0.04);
}

.compare-cell {
  flex: 1;
  min-width: 0;
  padding: 10px 8px;
  font-size: 11px;
  text-align: center;
}

.compare-cell--feature {
  flex: 2;
  text-align: left;
  color: #888;
}

.compare-cell--plan {
  font-weight: 600;
  color: #fff;
}

.cell-yes {
  color: var(--metric-green);
}

.cell-no {
  color: #555;
}
</style>
