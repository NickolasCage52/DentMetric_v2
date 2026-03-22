<template>
  <div class="profile-root">
    <!-- ═══ HERO: Avatar + Name + Plan Badge ═══ -->
    <div class="profile-hero">
      <div class="profile-hero__content">
        <div class="profile-avatar" :class="`avatar--ring-${currentPlan}`">
          <span class="avatar-initials">{{ avatarInitials }}</span>
        </div>
        <div class="profile-identity">
          <div class="profile-name">{{ profile?.name || 'Гость' }}</div>
          <div class="profile-tg" v-if="profile?.telegramUsername">@{{ profile.telegramUsername }}</div>
          <div class="profile-phone" v-else-if="profile?.phone">{{ profile.phone }}</div>
        </div>
        <button type="button" class="profile-edit-fab" @click="onEdit" aria-label="Редактировать">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ═══ SUBSCRIPTION CARD ═══ -->
    <div class="subscription-hero" :class="`sub-hero--${currentPlan}`">
      <div class="sub-hero__row">
        <div>
          <div class="sub-hero__plan-name">{{ planName }}</div>
          <div class="sub-hero__status-row">
            <span class="sub-hero__status-dot" :class="`dot--${subscriptionStatus}`"></span>
            <span class="sub-hero__status-label">{{ statusLabel }}</span>
          </div>
        </div>
        <div class="sub-hero__price" v-if="planPrice > 0">
          <span class="sub-hero__price-amount">{{ planPrice }}</span>
          <span class="sub-hero__price-unit"> ₽/мес</span>
        </div>
        <div class="sub-hero__price sub-hero__price--free" v-else>Бесплатно</div>
      </div>

      <div class="sub-hero__meta" v-if="isTrialActive">
        Пробный период: {{ trialDaysLeft }} дн.
      </div>
      <div class="sub-hero__meta" v-else-if="subscription?.periodEnd">
        До {{ formatDate(subscription.periodEnd) }}
      </div>

      <div class="sub-hero__progress" v-if="subscriptionProgress !== null">
        <div
          class="sub-hero__progress-bar"
          :style="{ width: subscriptionProgress + '%' }"
          :class="{ 'progress--warning': subscriptionProgress > 80 }"
        ></div>
      </div>

      <button class="sub-hero__upgrade-btn" v-if="canUpgrade" @click="onPlans">
        Улучшить тариф
      </button>
    </div>

    <!-- ═══ EXPIRY WARNINGS ═══ -->
    <div v-if="isExpiringSoon" class="profile-warning profile-warning--expiring">
      <span class="profile-warning__icon">⚠️</span>
      <span>Подписка истекает через {{ daysUntilExpiry }} дн. Продлите, чтобы не потерять доступ.</span>
    </div>
    <div v-if="subscription?.status === 'expired'" class="profile-warning profile-warning--expired">
      <span class="profile-warning__icon">❌</span>
      <span>Подписка истекла. Часть функций недоступна.</span>
    </div>

    <!-- ═══ STATS ═══ -->
    <div class="profile-stats">
      <div class="profile-stat-card">
        <span class="profile-stat-card__value">{{ statsCalcs }}</span>
        <span class="profile-stat-card__label">Расчётов</span>
      </div>
      <div class="profile-stat-card">
        <span class="profile-stat-card__value">{{ statsClients }}</span>
        <span class="profile-stat-card__label">Клиентов</span>
      </div>
      <div class="profile-stat-card">
        <span class="profile-stat-card__value">{{ statsMonth }}</span>
        <span class="profile-stat-card__label">За месяц</span>
      </div>
    </div>

    <!-- ═══ QUICK ACTIONS ═══ -->
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

    <!-- ═══ PROFILE DATA ═══ -->
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

    <!-- ═══ TRIAL PROMO ═══ -->
    <div class="trial-promo card-metallic" v-if="showTrialPromo" @click="onStartTrial">
      <div class="trial-promo__icon">🚀</div>
      <div class="trial-promo__text">
        <div class="trial-promo__title">Попробуй Demo бесплатно</div>
        <div class="trial-promo__sub">{{ TRIAL_DAYS }} дней без ограничений</div>
      </div>
      <button type="button" class="trial-promo__btn">Активировать</button>
    </div>

    <!-- ═══ ACTIONS LIST ═══ -->
    <div class="profile-actions-card">
      <button class="profile-action-row" @click="onEdit">
        <span class="profile-action-row__icon">👤</span>
        <span class="profile-action-row__label">Редактировать профиль</span>
        <span class="profile-action-row__chevron">›</span>
      </button>
      <button class="profile-action-row" @click="onPlans">
        <span class="profile-action-row__icon">⚡</span>
        <span class="profile-action-row__label">Тарифы и подписка</span>
        <span class="profile-action-row__chevron">›</span>
      </button>
      <button class="profile-action-row" @click="onSupport">
        <span class="profile-action-row__icon">💬</span>
        <span class="profile-action-row__label">Поддержка</span>
        <span class="profile-action-row__chevron">›</span>
      </button>
      <button class="profile-action-row profile-action-row--danger" @click="onLogout">
        <span class="profile-action-row__icon">🚪</span>
        <span class="profile-action-row__label">Выйти из аккаунта</span>
      </button>
    </div>
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
  loadStatsFromHistory()

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
const planPrice = computed(() => PLAN_INFO[currentPlan.value]?.price ?? 0)

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

const daysUntilExpiry = computed(() => {
  const end = subscription.value?.periodEnd ?? subscription.value?.trialEndsAt
  if (!end) return null
  const ms = new Date(end).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
})

const isExpiringSoon = computed(() => {
  const days = daysUntilExpiry.value
  if (days === null) return false
  const s = subscription.value?.status
  return (s === 'active' || s === 'trial') && days <= 7 && days > 0
})

const canUpgrade = computed(() => {
  const p = currentPlan.value
  return p === 'free' || p === 'demo' || subscription.value?.status === 'expired'
})

const showTrialPromo = computed(
  () => currentPlan.value === 'free' && !subscription.value?.trialStartedAt
)

// Stats from localStorage history
const statsCalcs = ref('—')
const statsClients = ref('—')
const statsMonth = ref('—')

function loadStatsFromHistory() {
  try {
    const raw = localStorage.getItem('dm_history')
    if (!raw) return
    const records = JSON.parse(raw)
    if (!Array.isArray(records)) return

    statsCalcs.value = String(records.length)

    const phoneSet = new Set()
    for (const r of records) {
      if (r.clientPhone) phoneSet.add(r.clientPhone)
    }
    statsClients.value = String(phoneSet.size)

    const now = Date.now()
    const monthAgo = now - 30 * 86400000
    const monthRecords = records.filter((r) => {
      const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0
      return ts >= monthAgo
    })
    statsMonth.value = String(monthRecords.length)
  } catch {
    /* ignore */
  }
}

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

function onSupport() {
  hapticLight()
  const botLink = `https://t.me/${import.meta.env.VITE_SUPPORT_USERNAME ?? 'DentMetricSupport'}`
  window.Telegram?.WebApp?.openLink?.(botLink) ?? window.open(botLink, '_blank')
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
  gap: 10px;
  padding: 0 0 24px;
  overflow-x: hidden;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

/* ─── Hero ─── */
.profile-hero {
  position: relative;
  padding: 20px 16px 16px;
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
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.avatar-initials {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--metric-green);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.avatar--ring-pro,
.avatar--ring-corporate {
  box-shadow: 0 0 0 2.5px var(--metric-green), 0 0 12px rgba(136, 229, 35, 0.3);
}

.avatar--ring-master {
  box-shadow: 0 0 0 2.5px #64b5f6;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-tg {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.profile-phone {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.profile-edit-fab {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--dm-surface, #161616);
  border: 1.5px solid var(--dm-border, #2a2a2a);
  color: var(--dm-text-secondary, #888);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── Subscription Hero ─── */
.subscription-hero {
  margin: 0 16px;
  padding: 16px;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}

.sub-hero__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
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
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.sub-hero__status-row {
  display: flex;
  align-items: center;
  gap: 6px;
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

.sub-hero__status-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.sub-hero__price {
  text-align: right;
  flex-shrink: 0;
}

.sub-hero__price-amount {
  font-size: 22px;
  font-weight: 800;
  color: var(--metric-green);
}

.sub-hero__price-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.sub-hero__price--free {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.sub-hero__meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
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
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

/* ─── Warnings ─── */
.profile-warning {
  margin: 0 16px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.profile-warning__icon {
  flex-shrink: 0;
  font-size: 16px;
}

.profile-warning--expiring {
  background: rgba(255, 160, 0, 0.1);
  color: #ffa000;
  border: 1px solid rgba(255, 160, 0, 0.2);
}

.profile-warning--expired {
  background: rgba(229, 57, 53, 0.1);
  color: var(--dm-danger, #e53935);
  border: 1px solid rgba(229, 57, 53, 0.2);
}

/* ─── Stats ─── */
.profile-stats {
  display: flex;
  gap: 8px;
  padding: 0 16px;
}

.profile-stat-card {
  flex: 1;
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 12px;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--dm-border, #2a2a2a);
}

.profile-stat-card__value {
  font-size: 20px;
  font-weight: 800;
  color: var(--dm-text-primary, #fff);
}

.profile-stat-card__label {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  text-align: center;
}

/* ─── Quick Actions ─── */
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
  background: var(--dm-surface-2, #1e1e1e);
  border: 1px solid var(--dm-border, #2a2a2a);
  position: relative;
  cursor: pointer;
  color: #fff;
  min-height: 64px;
}

.quick-action-tile:active {
  background: var(--dm-surface, #161616);
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

/* ─── Profile Data Card ─── */
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
  min-height: 48px;
}

.psc-row:active {
  background: rgba(255, 255, 255, 0.03);
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

/* ─── Trial Promo ─── */
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

.trial-promo__text {
  flex: 1;
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

/* ─── Actions List ─── */
.profile-actions-card {
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 12px;
  overflow: hidden;
  margin: 0 16px;
}

.profile-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  text-align: left;
  min-height: 48px;
}

.profile-action-row:last-child {
  border-bottom: none;
}

.profile-action-row:active {
  background: var(--dm-surface, #161616);
}

.profile-action-row__icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.profile-action-row__label {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
}

.profile-action-row__chevron {
  font-size: 20px;
  color: var(--dm-text-secondary, #888);
}

.profile-action-row--danger .profile-action-row__label {
  color: var(--dm-danger, #e53935);
}
</style>
