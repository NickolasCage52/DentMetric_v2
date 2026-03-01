<template>
  <div class="onboarding-section content-padding-bottom">
    <div class="onboarding-logo text-4xl mb-2">⚙️</div>
    <div class="onboarding-title font-bold text-xl text-metric-green">DentMetric</div>
    <div class="onboarding-subtitle text-sm text-gray-400 mb-8">Профессиональный расчёт PDR</div>

    <div class="onboarding-form space-y-3 mb-6">
      <div
        class="onboarding-field card-metallic rounded-2xl p-5 flex justify-between items-center cursor-pointer"
        @click="openNameModal"
      >
        <span class="field-label text-xs text-gray-500">Ваше имя</span>
        <span class="field-value text-sm" :class="{ 'text-gray-500': !form.name }">
          {{ form.name || 'Введите имя' }}
        </span>
      </div>

      <div
        class="onboarding-field card-metallic rounded-2xl p-5 flex justify-between items-center cursor-pointer"
        @click="openPhoneModal"
      >
        <span class="field-label text-xs text-gray-500">Телефон</span>
        <span class="field-value text-sm" :class="{ 'text-gray-500': !form.phone }">
          {{ form.phone || '+7 900 000 00 00' }}
        </span>
      </div>
    </div>

    <p class="onboarding-note text-xs text-gray-500 mb-6">
      Имя отображается в расчётах и истории. Телефон для связи.
    </p>

    <button
      type="button"
      class="btn-continue w-full py-4 rounded-xl font-semibold bg-metric-green text-black disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="!canContinue || isSaving"
      @click="onSave"
    >
      {{ isSaving ? 'Сохранение...' : 'Начать работу' }}
    </button>

    <!-- Модалка имени -->
    <Teleport to="body">
      <div
        v-if="nameModalOpen"
        class="fixed inset-0 z-[11000] flex items-end sm:items-center justify-center bg-black/80 p-4"
        @click.self="nameModalOpen = false"
      >
        <div class="input-modal card-metallic rounded-2xl p-5 w-full max-w-md" @click.stop>
          <div class="text-base font-bold mb-4">Введите имя</div>
          <input
            ref="nameInputRef"
            v-model="nameInput"
            type="text"
            class="w-full rounded-xl bg-[#151515] border border-white/20 px-4 py-3 text-white mb-4"
            placeholder="Имя Фамилия"
            maxlength="100"
            @keyup.enter="confirmName"
          />
          <p v-if="nameError" class="text-red-400 text-sm mb-2">{{ nameError }}</p>
          <button type="button" class="btn-primary w-full py-3 rounded-xl font-semibold bg-metric-green text-black" @click="confirmName">
            Сохранить
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Модалка телефона -->
    <Teleport to="body">
      <div
        v-if="phoneModalOpen"
        class="fixed inset-0 z-[11000] flex items-end sm:items-center justify-center bg-black/80 p-4"
        @click.self="phoneModalOpen = false"
      >
        <div class="input-modal card-metallic rounded-2xl p-5 w-full max-w-md" @click.stop>
          <div class="text-base font-bold mb-4">Введите телефон</div>
          <input
            ref="phoneInputRef"
            v-model="phoneInput"
            type="tel"
            class="w-full rounded-xl bg-[#151515] border border-white/20 px-4 py-3 text-white mb-4"
            placeholder="+7 900 000 00 00"
            maxlength="20"
            @keyup.enter="confirmPhone"
          />
          <p v-if="phoneError" class="text-red-400 text-sm mb-2">{{ phoneError }}</p>
          <button type="button" class="btn-primary w-full py-3 rounded-xl font-semibold bg-metric-green text-black" @click="confirmPhone">
            Сохранить
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useAccount } from '../useAccount'
import { validateName, validatePhone } from '../utils/validation'

const emit = defineEmits(['complete'])
const account = useAccount()

const isSaving = ref(false)
const nameModalOpen = ref(false)
const phoneModalOpen = ref(false)
const nameInput = ref('')
const phoneInput = ref('')
const nameError = ref('')
const phoneError = ref('')
const nameInputRef = ref(null)
const phoneInputRef = ref(null)

const form = ref({
  name: account.profile.value?.name ?? '',
  phone: account.profile.value?.phone ?? '',
})

watch(
  () => account.profile.value,
  (p) => {
    if (p) {
      form.value.name = p.name ?? ''
      form.value.phone = p.phone ?? ''
    }
  },
  { immediate: true }
)

const canContinue = computed(() => {
  const nameOk = !validateName(form.value.name)
  const phoneOk = !validatePhone(form.value.phone)
  return nameOk && phoneOk
})

async function openNameModal() {
  nameInput.value = form.value.name
  nameError.value = ''
  nameModalOpen.value = true
  await nextTick()
  nameInputRef.value?.focus()
}

async function openPhoneModal() {
  phoneInput.value = form.value.phone
  phoneError.value = ''
  phoneModalOpen.value = true
  await nextTick()
  phoneInputRef.value?.focus()
}

function confirmName() {
  const err = validateName(nameInput.value)
  if (err) {
    nameError.value = err
    return
  }
  form.value.name = nameInput.value.trim()
  nameModalOpen.value = false
}

function confirmPhone() {
  const clean = phoneInput.value.replace(/[\s\-\(\)]/g, '')
  const err = validatePhone(clean)
  if (err) {
    phoneError.value = err
    return
  }
  form.value.phone = clean
  phoneModalOpen.value = false
}

async function onSave() {
  isSaving.value = true
  try {
    await account.updateProfile({ name: form.value.name, phone: form.value.phone })
    emit('complete')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.onboarding-section {
  padding: 2rem 1rem;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
