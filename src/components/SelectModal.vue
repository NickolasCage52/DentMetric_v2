<template>
  <Teleport to="body">
    <Transition name="select-modal">
      <div
        v-if="internalOpen"
        class="select-modal-overlay fixed inset-0 z-[11000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="select-modal-box w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[#0b0f14] border border-white/10 shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[85vh] flex flex-col"
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
              @click.stop.prevent="handleCancel"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
            <button
              v-for="(opt, idx) in config.options"
              :key="String(opt.value)"
              type="button"
              class="w-full rounded-xl px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 border transition-colors text-left mb-2 last:mb-0"
              :class="rowClass(opt)"
              :data-testid="`select-option-${idx}`"
              :disabled="opt.disabled"
              @click.stop.prevent="toggle(opt)"
            >
              <div class="min-w-0">
                <div class="text-[13px] font-semibold truncate" :class="isSelected(opt) ? 'text-white' : 'text-gray-200'">
                  {{ opt.label }}
                </div>
                <div v-if="opt.subtitle" class="text-[11px] text-gray-500 leading-tight mt-0.5">
                  {{ opt.subtitle }}
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-2">
                <span v-if="opt.rightText" class="text-[11px]" :class="isSelected(opt) ? 'text-metric-green font-bold' : 'text-gray-500'">
                  {{ opt.rightText }}
                </span>
                <div
                  v-if="config.multiple"
                  class="w-5 h-5 rounded-md border flex items-center justify-center"
                  :class="isSelected(opt) ? 'bg-metric-green border-metric-green text-black shadow-[0_0_10px_rgba(136,229,35,0.25)]' : 'border-white/15 text-transparent'"
                  aria-hidden="true"
                >
                  ✓
                </div>
                <div
                  v-else
                  class="w-5 h-5 rounded-full border flex items-center justify-center"
                  :class="isSelected(opt) ? 'border-metric-green bg-metric-green text-black shadow-[0_0_10px_rgba(136,229,35,0.25)]' : 'border-white/15 text-transparent'"
                  aria-hidden="true"
                >
                  ✓
                </div>
              </div>
            </button>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              data-testid="select-cancel"
              type="button"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/15 rounded-xl min-h-[44px] touch-manipulation"
              @click.stop.prevent="handleCancel"
            >
              Отмена
            </button>
            <button
              v-if="isMultiple"
              data-testid="select-confirm"
              type="button"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[44px] touch-manipulation"
              @click.stop.prevent="handleConfirm"
            >
              {{ config.confirmText || 'Готово' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  config: { type: Object, default: () => ({ title: '', options: [], value: null, multiple: false, confirmText: 'Готово', toggleMultipleValue: null }) }
});
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const localValue = ref(null);
const internalOpen = ref(false);

const isMultiple = computed(() => props.config?.multiple === true);

watch(
  () => [props.modelValue, props.config?.value, props.config?.multiple],
  () => {
    const v = props.config?.value;
    localValue.value = isMultiple.value ? (Array.isArray(v) ? [...v] : []) : v;
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (open) => {
    internalOpen.value = !!open;
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

function isSelected(opt) {
  if (!opt) return false;
  if (isMultiple.value) {
    return Array.isArray(localValue.value) && localValue.value.includes(opt.value);
  }
  return localValue.value === opt.value;
}

function toggle(opt) {
  if (!opt || opt.disabled) return;
  if (isMultiple.value) {
    const cur = Array.isArray(localValue.value) ? [...localValue.value] : [];
    const custom = props.config?.toggleMultipleValue;
    if (typeof custom === 'function') {
      localValue.value = custom(cur, opt.value);
      return;
    }
    const idx = cur.indexOf(opt.value);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(opt.value);
    localValue.value = cur;
    return;
  }
  localValue.value = opt.value;
  // Single-select: apply and close immediately (no "Готово")
  handleConfirm();
}

function rowClass(opt) {
  if (opt?.disabled) return 'bg-[#0f0f10]/70 border-white/5 text-gray-500 opacity-70 cursor-not-allowed';
  return isSelected(opt)
    ? 'bg-[#1a1a1a] border-metric-green/50'
    : 'bg-[#151515] border-white/10 hover:border-white/15';
}

function closeNow() {
  internalOpen.value = false;
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
}

function handleConfirm() {
  closeNow();
  emit('confirm', localValue.value);
  emit('update:modelValue', false);
}

function handleCancel() {
  closeNow();
  emit('cancel');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.select-modal-enter-active,
.select-modal-leave-active {
  transition: opacity 0.2s ease;
}
.select-modal-enter-from,
.select-modal-leave-to {
  opacity: 0;
}
.select-modal-enter-active .select-modal-box,
.select-modal-leave-active .select-modal-box {
  transition: transform 0.2s ease;
}
.select-modal-enter-from .select-modal-box,
.select-modal-leave-to .select-modal-box {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .select-modal-enter-from .select-modal-box,
  .select-modal-leave-to .select-modal-box {
    transform: scale(0.95);
  }
}

/* Backstop critical modal layout even if Tailwind CDN is late/unavailable */
.select-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 11000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
}
.select-modal-box {
  width: 100%;
  max-width: 28rem;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: #0b0f14;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  padding: 1.25rem;
  padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 640px) {
  .select-modal-overlay {
    align-items: center;
    padding: 1rem;
  }
  .select-modal-box {
    border-radius: 1rem;
  }
}
.select-modal-box [data-testid^='select-option-'] {
  width: 100%;
}
</style>

