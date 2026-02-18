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
            :type="config.inputType"
            :value="localValue"
            :placeholder="config.placeholder"
            :min="config.min"
            :max="config.max"
            :step="config.step"
            :inputmode="config.inputType === 'number' ? 'decimal' : (config.inputType === 'tel' ? 'tel' : 'text')"
            class="input-modal-field w-full rounded-xl bg-[#151515] border border-[#333] px-4 py-3 text-white focus:border-metric-green/50 outline-none min-h-[48px] text-[16px]"
            @input="localValue = $event.target.value"
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
import { ref, watch, nextTick, onUnmounted } from 'vue';

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

watch(
  () => [props.modelValue, props.config?.value],
  () => {
    const val = props.config?.value;
    if (val !== undefined && val !== null) {
      localValue.value = String(val);
    } else {
      localValue.value = '';
    }
    errorMessage.value = '';
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      const val = props.config?.value;
      localValue.value = val !== undefined && val !== null ? String(val) : '';
      errorMessage.value = '';
      nextTick(() => inputRef.value?.focus());
    }
  }
);

function validate() {
  const type = props.config?.inputType;
  const raw = localValue.value.trim();
  if (type === 'number' || type === 'tel') {
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
  const out = type === 'number' || type === 'tel' ? (typeof result === 'number' ? result : (result === '' ? null : parseFloat(String(result).replace(',', '.')))) : result;
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
