<template>
  <div class="referral-root">
    <div class="referral-hero card-metallic rounded-2xl p-5">
      <div class="referral-hero__icon">🎁</div>
      <div class="referral-hero__title">Пригласи друга</div>
      <div class="referral-hero__sub">Получи {{ bonusDays }} дней PRO за каждого приглашённого</div>
    </div>

    <div class="referral-stats card-metallic rounded-2xl p-5 flex">
      <div class="rstat">
        <div class="rstat__num">{{ activatedCount }}</div>
        <div class="rstat__label">Приглашено</div>
      </div>
      <div class="rstat-divider"></div>
      <div class="rstat">
        <div class="rstat__num" :class="{ 'rstat__num--accent': earnedDays > 0 }">{{ earnedDays }}</div>
        <div class="rstat__label">Дней получено</div>
      </div>
    </div>

    <div class="referral-link-block card-metallic rounded-2xl p-5">
      <div class="rlb-label">Ваша ссылка</div>
      <div class="rlb-link">{{ referralLink || 'Загрузка...' }}</div>
      <div class="rlb-actions">
        <button type="button" class="rlb-btn" @click="copyLink">
          {{ copied ? '✓ Скопировано' : 'Копировать' }}
        </button>
        <button type="button" class="rlb-btn rlb-btn--share" @click="shareLink">
          Поделиться
        </button>
      </div>
    </div>

    <div class="referral-steps card-metallic rounded-2xl p-5">
      <div class="rs-title">Как это работает</div>
      <div class="rs-step" v-for="(step, i) in steps" :key="i">
        <div class="rs-num">{{ i + 1 }}</div>
        <div class="rs-text">{{ step }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAccount } from '../useAccount'
import { accountApi } from '../api/accountApi'
import { hapticSuccess } from '../utils/animations'

const account = useAccount()
const referralCode = ref('')
const activatedCount = ref(0)
const bonusDays = ref(14)

const earnedDays = computed(() => activatedCount.value * bonusDays.value)

const referralLink = computed(() =>
  referralCode.value ? `https://t.me/DentMetricBot?start=${referralCode.value}` : ''
)

const steps = [
  'Поделитесь ссылкой с коллегой или другом',
  'Он регистрируется по вашей ссылке',
  `Вы получаете ${bonusDays.value} дней PRO-доступа`,
]

onMounted(async () => {
  const token = account.token?.value
  if (!token) return
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    referralCode.value = 'DEMO'
    return
  }
  try {
    const data = await accountApi.getReferral(token)
    referralCode.value = data.code
    activatedCount.value = data.activatedCount
    bonusDays.value = data.bonusDays
  } catch (e) {
    console.warn('[DM] Referral load failed:', e)
    referralCode.value = 'DEMO'
  }
})

async function copyLink() {
  if (!referralLink.value) return
  try {
    await navigator.clipboard.writeText(referralLink.value)
    copied.value = true
    hapticSuccess()
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* fallback */
  }
}

const copied = ref(false)

function shareLink() {
  const url = encodeURIComponent(referralLink.value)
  const text = encodeURIComponent('Попробуй DentMetric — сервис расчёта PDR!')
  window.Telegram?.WebApp?.openLink?.(
    `https://t.me/share/url?url=${url}&text=${text}`
  )
}
</script>

<style scoped>
.referral-root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.referral-hero__icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.referral-hero__title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.referral-hero__sub {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.referral-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px 16px;
}

.rstat {
  text-align: center;
}

.rstat__num {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.rstat__num--accent {
  color: var(--metric-green);
}

.rstat__label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.rstat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

.rlb-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.rlb-link {
  font-size: 12px;
  color: var(--metric-green);
  word-break: break-all;
  margin-bottom: 12px;
}

.rlb-actions {
  display: flex;
  gap: 8px;
}

.rlb-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
}

.rlb-btn--share {
  background: var(--metric-green);
  color: #000;
  border-color: transparent;
}

.rs-title {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 12px;
}

.rs-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.rs-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--metric-green);
  color: #000;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rs-text {
  font-size: 13px;
  color: #ccc;
}
</style>
