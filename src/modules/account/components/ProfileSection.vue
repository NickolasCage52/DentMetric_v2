<template>
  <div class="profile-root">
    <div class="profile-hero">
      <div class="profile-hero__bg"></div>
      <div class="profile-hero__content">
        <div class="profile-avatar" :class="`avatar--ring-${currentPlan}`">
          <span class="avatar-initials">{{ avatarInitials }}</span>
        </div>
        <div class="profile-identity">
          <div class="profile-name">{{ profile?.name || 'Гость' }}</div>
          <div class="profile-tg" v-if="profile?.telegramUsername">@{{ profile.telegramUsername }}</div>
        </div>
        <button type="button" class="profile-edit-fab" @click="onEdit" aria-label="Редактировать">✏️</button>
      </div>
    </div>

    <div class="subscription-hero" :class="`sub-hero--${currentPlan}`">
      <div class="sub-hero__plan-name">{{ planName }}</div>
      <div class="sub-hero__status-row">
        <span class="sub-hero__status-dot" :class="`dot--${subscriptionStatus}`"></span>
        <span class="sub-hero__status-label">{{ statusLabel }}</span>
      </div>
      <div class="sub-hero__meta" v-if="isTrialActive">
        <span>Пробный период: {{ trialDaysLeft }} дн.</span>
      </div>
      <div class="sub-hero__meta" v-else-if="subscription?.periodEnd">
        <span>До {{ formatDate(subscription.periodEnd) }}</span>
      </div>
      <div class="sub-hero__progress" v-if="subscriptionProgress !== null">
        <div
          class="sub-hero__progress-bar"
          :style="{ width: subscriptionProgress + '%' }"
          :class="{ 'progress--warning': subscriptionProgress < 20 }"
        ></div>
      </div>
      <button class="sub-hero__upgrade-btn" v-if="canUpgrade" @click="onPlans">
        Улучшить тариф ↗
      </button>
    </div>

    <div class="profile-quick-actions">
      <button type="button" class="quick-action-tile" @click="onPlans">
        <div class="qat-icon">💎</div>
        <div class="qat-label">Тарифы</div>
      </button>
      <button type="button" class="quick-action-tile" @click="onReferral">
        <div class="qat-icon">🎁</div>
        <div class="qat-label">Реферал</div>
        <div class="qat-badge" v-if="referralCount > 0">{{ referralCount }}</div>
      </button>
      <button type="button" class="quick-action-tile" @click="onStats">
        <div class="qat-icon">📊</div>
        <div class="qat-label">Статистика</div>
      </button>
      <button type="button" class="quick-action-tile" @click="onPayments">
        <div class="qat-icon">🧾</div>
        <div class="qat-label">Платежи</div>
      </button>
    </div>

    <div class="profile-section-card card-metallic">
      <div class="psc-title">ДАННЫЕ ПРОФИЛЯ</div>
      <div class="psc-row" @click="onEdit">
        <span class="psc-label">Имя</span>
        <span class="psc-value">{{ profile?.name || '—' }}</span>
        <span class="psc-chevron">›</span>
      </div>
      <div class="psc-divider"></div>
      <div class="psc-row" @click="onEdit">
        <span class="psc-label">Телефон</span>
        <span class="psc-value">
          {{ profile?.phone || '—' }}
          <span v-if="profile?.phone && !profile.phoneVerified" class="badge-unverified">не подтверждён</span>
        </span>
        <span class="psc-chevron">›</span>
      </div>
    </div>

    <div class="trial-promo card-metallic" v-if="showTrialPromo" @click="onStartTrial">
      <div class="trial-promo__icon">🚀</div>
      <div class="trial-promo__text">
        <div class="trial-promo__title">Попробуй Demo бесплатно</div>
        <div class="trial-promo__sub">{{ TRIAL_DAYS }} дней без ограничений</div>
      </div>
      <button type="button" class="trial-promo__btn">Активировать</button>
    </div>

    <button type="button" class="btn-logout" @click="onLogout">
      Выйти из аккаунта
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAccount } from '../useAccount'
import { PLAN_INFO, TRIAL_DAYS } from '../planFeatures'
import { hapticLight } from '../utils/animations'
import { accountApi } from '../api/accountApi'

const emit = defineEmits(['edit', 'plans', 'payments', 'referral', 'stats', 'logout'])
const account = useAccount()
const { profile, subscription, currentPlan, isTrialActive, trialDaysLeft, startTrial, logout, can } = account

const referralCount = ref(0)
onMounted(async () => {
  const token = account.token?.value
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!token || !baseUrl) return
  try {
    const data = await accountApi.getReferral(token)
    referralCount.value = data.activatedCount
  } catch {
    /* ignore */
  }
})

const avatarInitials = computed(() => {
  const name = profile.value?.name ?? ''
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
})

const planName = computed(() => PLAN_INFO[currentPlan.value]?.name ?? currentPlan.value)

const subscriptionStatus = computed(() => {
  const s = subscription.value?.status ?? 'inactive'
  if (s === 'active' || s === 'trial') return s
  return 'inactive'
})

const statusLabel = computed(() => {
  const s = subscription.value?.status ?? 'inactive'
  const map = { active: 'Активна', inactive: 'Неактивна', trial: 'Пробный период', expired: 'Истекла', cancelled: 'Отменена' }
  return map[s] ?? '—'
})

const subscriptionProgress = computed(() => {
  const end = subscription.value?.periodEnd
  if (!end) return null
  const start = subscription.value?.periodStart
  if (!start) return null
  const total = new Date(end).getTime() - new Date(start).getTime()
  const passed = Date.now() - new Date(start).getTime()
  return Math.min(100, Math.max(0, Math.round((passed / total) * 100)))
})

const canUpgrade = computed(() => {
  const p = currentPlan.value
  return p === 'free' || p === 'demo' || (p === 'master' && can('analyticsAdvanced') === false)
})

const showTrialPromo = computed(
  () => currentPlan.value === 'free' && !subscription.value?.trialStartedAt
)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU')
}

function onEdit() {
  hapticLight()
  emit('edit')
}

function onPlans() {
  hapticLight()
  emit('plans')
}

function onReferral() {
  hapticLight()
  emit('referral')
}

function onStats() {
  hapticLight()
  emit('stats')
}

function onPayments() {
  hapticLight()
  emit('payments')
}

async function onStartTrial() {
  try {
    await startTrial()
    emit('plans')
  } catch (e) {
    console.warn('[ProfileSection] startTrial failed', e)
  }
}

function onLogout() {
  logout()
  emit('logout')
}
</script>

<style scoped>
.profile-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 24px;
  overflow-x: hidden;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.profile-hero {
  position: relative;
  padding: 20px 16px 24px;
  background: linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 100%);
}

.profile-hero__content {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.profile-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.avatar-initials {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--metric-green);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
}

.avatar--ring-pro,
.avatar--ring-corporate {
  box-shadow: 0 0 0 2px var(--metric-green);
}

.avatar--ring-master {
  box-shadow: 0 0 0 2px #64b5f6;
}

.avatar--ring-demo,
.avatar--ring-free {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.profile-identity {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.profile-tg {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.profile-edit-fab {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.subscription-hero {
  margin: 0 16px;
  padding: 16px;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}

.sub-hero--free {
  background: linear-gradient(135deg, #1a1a1a, #222);
}

.sub-hero--demo {
  background: linear-gradient(135deg, #1a1a2e, #1e2040);
}

.sub-hero--master {
  background: linear-gradient(135deg, #0d1b2a, #1a3a5c);
}

.sub-hero--pro {
  background: linear-gradient(135deg, #0a1f0a, #0f3d0f);
}

.sub-hero--corporate {
  background: linear-gradient(135deg, #2a1f00, #3d2e00);
}

.sub-hero__plan-name {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #fff;
}

.sub-hero__status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.sub-hero__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--active {
  background: var(--metric-green);
  box-shadow: 0 0 6px var(--metric-green);
}

.dot--trial {
  background: #64b5f6;
}

.dot--inactive,
.dot--expired {
  background: #555;
}

.sub-hero__meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.sub-hero__progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 10px;
}

.sub-hero__progress-bar {
  height: 100%;
  border-radius: 2px;
  background: var(--metric-green);
  transition: width 0.5s ease;
}

.progress--warning {
  background: #f59e0b;
}

.sub-hero__upgrade-btn {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.profile-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 16px;
}

.quick-action-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  cursor: pointer;
  color: #fff;
}

.qat-icon {
  font-size: 22px;
}

.qat-label {
  font-size: 11px;
  color: #888;
  text-align: center;
}

.qat-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--metric-green);
  color: #000;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
}

.profile-section-card {
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.psc-title {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #666;
  padding: 10px 16px 6px;
}

.psc-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 8px;
  cursor: pointer;
}

.psc-label {
  font-size: 12px;
  color: #888;
  flex-shrink: 0;
  width: 80px;
}

.psc-value {
  flex: 1;
  font-size: 14px;
  color: #fff;
}

.psc-chevron {
  font-size: 18px;
  color: #555;
}

.psc-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0 16px;
}

.badge-unverified {
  font-size: 10px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
}

.trial-promo {
  margin: 0 16px;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border: 1px solid rgba(136, 229, 35, 0.3);
}

.trial-promo__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.trial-promo__title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.trial-promo__sub {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.trial-promo__btn {
  margin-left: auto;
  flex-shrink: 0;
  background: var(--metric-green);
  color: #000;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
}

.btn-logout {
  margin: 4px 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  font-size: 14px;
  cursor: pointer;
}
</style>
