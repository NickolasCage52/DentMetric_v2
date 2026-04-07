<template>
  <Teleport to="body">
    <Transition name="input-modal">
      <div
        v-if="modelValue"
        class="input-modal-overlay fixed inset-0 z-[11000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="input-modal-box w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[#0b0f14] border border-white/10 shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[85vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          :aria-label="config.title"
          @click.stop
        >
          <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
            <h3 class="text-white font-bold text-base pl-1">{{ config.title }}</h3>
            <button
              type="button"
              class="text-gray-400 p-2 -mr-2 text-xl leading-none touch-manipulation"
              aria-label="Закрыть"
              @click="handleCancel"
            >
              ✕
            </button>
          </div>
          <label v-if="config.label" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            {{ config.label }}
          </label>
          <input
            v-if="!config.multiline"
            ref="inputRef"
            :type="effectiveInputType"
            :value="localValue"
            :placeholder="config.placeholder"
            :min="config.min"
            :max="config.max"
            :step="config.step"
            :inputmode="effectiveInputMode"
            class="input-modal-field w-full rounded-xl bg-[#151515] border border-[#333] px-4 py-3 text-white focus:border-metric-green/50 outline-none min-h-[48px] text-[16px]"
            @input="onInput($event.target.value)"
            @keydown.enter.prevent="handleConfirm"
          />
          <textarea
            v-else
            ref="inputRef"
            :value="localValue"
            :placeholder="config.placeholder"
            rows="4"
            class="input-modal-field w-full rounded-xl bg-[#151515] border border-[#333] px-4 py-3 text-white focus:border-metric-green/50 outline-none min-h-[80px] text-[16px] resize-none"
            @input="localValue = $event.target.value"
          />
          <p v-if="config.helperText" class="text-[11px] text-gray-500 mt-1.5">{{ config.helperText }}</p>
          <p v-if="errorMessage" class="text-[11px] text-red-400 mt-1">{{ errorMessage }}</p>
          <div class="flex gap-2 mt-4">
            <button
              type="button"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/15 rounded-xl min-h-[44px] touch-manipulation"
              @click="handleCancel"
            >
              Отмена
            </button>
            <button
              type="button"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[44px] touch-manipulation"
              @click="handleConfirm"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted, computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  config: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const inputRef = ref(null);
const localValue = ref('');
const errorMessage = ref('');

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  },
  { immediate: true }
);
onUnmounted(() => {
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
});

const mask = () => props.config?.mask;

/** Маска телефона: BY → +375 + 9 цифр; иначе RU (+7 + 10) */
const phoneRegion = () => (props.config?.phoneRegion === 'BY' ? 'BY' : 'RU');

const effectiveInputType = computed(() => {
  if (mask() === 'phone' || mask() === 'name') return 'text';
  return props.config?.inputType ?? 'text';
});

const effectiveInputMode = computed(() => {
  if (mask() === 'phone') return 'tel';
  if (props.config?.inputType === 'number') return 'decimal';
  if (props.config?.inputType === 'tel') return 'tel';
  return 'text';
});

function applyMask(raw) {
  if (raw == null) {
    if (mask() !== 'phone') return '';
    return phoneRegion() === 'BY' ? '+375' : '+7';
  }
  const m = mask();
  if (m === 'phone') {
    const digits = String(raw).replace(/\D/g, '');
    if (phoneRegion() === 'BY') {
      if (digits.length === 0) return '+375';
      let rest = digits;
      if (rest.startsWith('375') && rest.length > 3) rest = rest.slice(3);
      else if (rest.startsWith('375')) return '+375';
      else if (rest.startsWith('80') && rest.length >= 2) rest = rest.slice(2);
      else if (rest.startsWith('8') && rest.length > 1) rest = rest.slice(1);
      else if (rest === '8') return '+375';
      else if (rest === '3' || rest === '37') return '+375';
      return '+375' + rest.slice(0, 9);
    }
    if (digits.length === 0) return '+7';
    let rest = digits;
    if (rest.startsWith('7') && rest.length > 1) rest = rest.slice(1);
    else if (rest.startsWith('8') && rest.length > 1) rest = rest.slice(1);
    else if (rest === '7' || rest === '8') return '+7';
    return '+7' + rest.slice(0, 10);
  }
  if (m === 'name') {
    return String(raw).replace(/[^a-zA-Zа-яА-ЯёЁ\s\-]/gi, '');
  }
  return raw;
}

function getInitialValue() {
  const val = props.config?.value;
  if (val !== undefined && val !== null) {
    const s = String(val);
    if (mask() === 'phone' && s) {
      const digits = s.replace(/\D/g, '');
      if (digits.length > 0) {
        if (phoneRegion() === 'BY') {
          let rest = digits;
          if (rest.startsWith('375') && rest.length > 3) rest = rest.slice(3);
          else if (rest.startsWith('375')) return '+375';
          else if (rest.startsWith('80') && rest.length >= 2) rest = rest.slice(2);
          else if (rest.startsWith('8') && rest.length > 1) rest = rest.slice(1);
          else if (rest === '8') return '+375';
          else if (rest === '3' || rest === '37') return '+375';
          return '+375' + rest.slice(0, 9);
        }
        let rest = digits;
        if (rest.startsWith('7') && rest.length > 1) rest = rest.slice(1);
        else if (rest.startsWith('8') && rest.length > 1) rest = rest.slice(1);
        else if (rest === '7' || rest === '8') return '+7';
        return '+7' + rest.slice(0, 10);
      }
    }
    return s;
  }
  if (mask() === 'phone') return phoneRegion() === 'BY' ? '+375' : '+7';
  return '';
}

watch(
  () => [props.modelValue, props.config?.value, mask(), props.config?.phoneRegion],
  () => {
    localValue.value = getInitialValue();
    errorMessage.value = '';
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      localValue.value = getInitialValue();
      errorMessage.value = '';
      nextTick(() => inputRef.value?.focus());
    }
  }
);

function onInput(val) {
  if (mask()) {
    localValue.value = applyMask(val);
  } else {
    localValue.value = val;
  }
}

function validate() {
  const type = props.config?.inputType;
  const m = mask();
  const raw = localValue.value.trim();

  if (m === 'phone') {
    const digits = raw.replace(/\D/g, '');
    if (phoneRegion() === 'BY') {
      let nat = '';
      if (digits.startsWith('375')) nat = digits.slice(3, 12);
      else if (digits.startsWith('80')) nat = digits.slice(2, 11);
      else nat = digits.slice(0, 9);
      if (nat.length > 0 && nat.length < 9) {
        errorMessage.value = 'Введите 9 цифр номера (после +375)';
        return null;
      }
      if (nat.length < 9) return '';
      return '+375' + nat;
    }
    const rest = digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits;
    if (rest.length > 0 && rest.length < 10) {
      errorMessage.value = 'Введите 10 цифр номера';
      return null;
    }
    if (rest.length < 10) return '';
    return raw;
  }
  if (m === 'name') {
    return raw;
  }
  if (type === 'tel' && !m) {
    return raw;
  }
  if (type === 'number') {
    const n = parseFloat(String(raw).replace(',', '.'));
    if (raw !== '' && !Number.isFinite(n)) {
      errorMessage.value = 'Введите число';
      return null;
    }
    const min = props.config?.min;
    const max = props.config?.max;
    if (Number.isFinite(min) && n < min) {
      errorMessage.value = `Минимум ${min}`;
      return null;
    }
    if (Number.isFinite(max) && n > max) {
      errorMessage.value = `Максимум ${max}`;
      return null;
    }
    return raw === '' ? (props.config?.value ?? '') : n;
  }
  return raw;
}

function handleConfirm() {
  const result = validate();
  if (result === null) return;
  const type = props.config?.inputType;
  const m = mask();
  let out = result;
  if (m === 'phone' || (type === 'tel' && !m)) {
    out = typeof result === 'string' ? result : String(result ?? '');
  } else if (type === 'number') {
    out = typeof result === 'number' ? result : (result === '' ? null : parseFloat(String(result).replace(',', '.')));
  }
  emit('confirm', out);
  emit('update:modelValue', false);
}

function handleCancel() {
  errorMessage.value = '';
  emit('cancel');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.input-modal-overlay {
  -webkit-overflow-scrolling: touch;
}
.input-modal-field {
  font-size: 16px; /* Prevents iOS zoom on focus */
}
.input-modal-enter-active,
.input-modal-leave-active {
  transition: opacity 0.2s ease;
}
.input-modal-enter-from,
.input-modal-leave-to {
  opacity: 0;
}
.input-modal-enter-active .input-modal-box,
.input-modal-leave-active .input-modal-box {
  transition: transform 0.2s ease;
}
.input-modal-enter-from .input-modal-box,
.input-modal-leave-to .input-modal-box {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .input-modal-enter-from .input-modal-box,
  .input-modal-leave-to .input-modal-box {
    transform: scale(0.95);
  }
}
</style>
