<template>
  <div class="payments-root">
    <div class="payments-header">
      <div class="payments-title">История платежей</div>
    </div>

    <div v-if="isLoading" class="payments-loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="payments.length === 0" class="payments-empty">
      <div class="payments-empty__icon">🧾</div>
      <div class="payments-empty__text">Платежей пока нет</div>
      <div class="payments-empty__sub">История транзакций появится здесь</div>
    </div>

    <div v-else class="payments-list">
      <div
        v-for="payment in payments"
        :key="payment.id"
        class="payment-row card-metallic rounded-2xl p-4 flex items-center gap-4"
      >
        <div class="payment-row__icon">{{ statusIcon(payment.status) }}</div>
        <div class="payment-row__info flex-1 min-w-0">
          <div class="payment-row__plan font-semibold">{{ planName(payment.plan) }}</div>
          <div class="payment-row__date text-xs text-gray-500">{{ formatDate(payment.createdAt) }}</div>
        </div>
        <div class="payment-row__amount" :class="`amount--${payment.status}`">
          {{ payment.status === 'success' ? '−' : '' }}{{ (payment.amount / 100).toLocaleString('ru-RU') }} ₽
        </div>
        <div class="payment-row__status-badge" :class="`badge--${payment.status}`">
          {{ statusLabel(payment.status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAccount } from '../useAccount'
import { accountApi } from '../api/accountApi'
import { PLAN_INFO } from '../planFeatures'

const account = useAccount()
const payments = ref([])
const isLoading = ref(true)

onMounted(async () => {
  const token = account.token?.value
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!token || !baseUrl) {
    isLoading.value = false
    return
  }
  try {
    payments.value = await accountApi.getPayments(token)
  } catch (e) {
    console.warn('[DM] Payments load failed:', e)
  } finally {
    isLoading.value = false
  }
})

const statusIcon = (s) => ({ success: '✅', pending: '⏳', failed: '❌', refunded: '↩️' }[s] ?? '❓')
const statusLabel = (s) => ({ success: 'Оплачено', pending: 'Обработка', failed: 'Ошибка', refunded: 'Возврат' }[s] ?? s)
const planName = (p) => PLAN_INFO[p]?.name ?? p
const formatDate = (iso) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
</script>

<style scoped>
.payments-root {
  padding: 1rem;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.payments-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
}

.payments-loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--metric-green);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.payments-empty {
  text-align: center;
  padding: 2rem;
}

.payments-empty__icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.payments-empty__text {
  font-size: 16px;
  font-weight: 600;
  color: #888;
}

.payments-empty__sub {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-row__icon {
  font-size: 24px;
  flex-shrink: 0;
}

.payment-row__amount {
  font-weight: 600;
  color: #fff;
}

.amount--success {
  color: var(--metric-green);
}

.amount--failed,
.amount--refunded {
  color: #f87171;
}

.payment-row__status-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
}

.badge--success {
  background: rgba(136, 229, 35, 0.2);
  color: var(--metric-green);
}

.badge--pending {
  background: rgba(100, 181, 246, 0.2);
  color: #64b5f6;
}

.badge--failed {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}
</style>
