<template>
  <div class="account-screen flex flex-col min-h-full">
    <div class="account-header shrink-0 flex items-center gap-3 px-4 py-4 border-b border-white/10">
      <button
        type="button"
        class="account-back p-2 -ml-2 text-gray-400 hover:text-metric-green"
        @click="onBack"
        aria-label="Назад"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="account-title font-bold text-lg">{{ headerTitle }}</h1>
    </div>

    <div class="account-content flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  view: { type: String, default: 'profile' },
})

const emit = defineEmits(['back'])

const headerTitle = computed(() => {
  const t = {
    profile: 'Профиль',
    plans: 'Тарифы',
    onboarding: 'Добро пожаловать',
    referral: 'Реферальная программа',
    payments: 'Платежи',
    stats: 'Статистика',
  }
  return t[props.view] ?? 'Личный кабинет'
})

function onBack() {
  emit('back')
}
</script>
