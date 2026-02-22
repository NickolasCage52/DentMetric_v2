<template>
  <Teleport to="body">
    <Transition name="presets-modal">
      <div
        v-if="modelValue"
        class="presets-modal-overlay fixed inset-0 z-[11000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="presets-modal-box w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[#0b0f14] border border-white/10 shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[85vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Пресеты размеров"
          @click.stop
        >
          <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
            <h3 class="text-white font-bold text-base pl-1">Пресеты</h3>
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
            <!-- Круг / Овал -->
            <div class="mb-4">
              <div class="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                Круг / Овал
              </div>
              <button
                v-for="preset in roundOvalPresets"
                :key="preset.id"
                type="button"
                class="w-full rounded-xl px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 border border-white/10 bg-[#151515] hover:border-white/15 transition-colors text-left mb-2 last:mb-0 touch-manipulation"
                :data-testid="`preset-${preset.id}`"
                @click.stop.prevent="selectPreset(preset)"
              >
                <span class="text-[13px] font-semibold truncate text-gray-200">{{ preset.label }}</span>
                <span class="text-[11px] text-gray-500 shrink-0">{{ preset.widthMm }}×{{ preset.heightMm }} мм</span>
              </button>
            </div>

            <!-- Полоса / Царапина -->
            <div>
              <div class="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                Полоса / Царапина
              </div>
              <button
                v-for="preset in stripePresets"
                :key="preset.id"
                type="button"
                class="w-full rounded-xl px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 border border-white/10 bg-[#151515] hover:border-white/15 transition-colors text-left mb-2 last:mb-0 touch-manipulation"
                :data-testid="`preset-${preset.id}`"
                @click.stop.prevent="selectPreset(preset)"
              >
                <span class="text-[13px] font-semibold truncate text-gray-200">{{ preset.label }}</span>
                <span class="text-[11px] text-gray-500 shrink-0">{{ preset.widthMm }}×{{ preset.heightMm }} мм</span>
              </button>
            </div>
          </div>

          <div class="mt-4">
            <button
              data-testid="presets-cancel"
              type="button"
              class="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/15 rounded-xl min-h-[44px] touch-manipulation"
              @click.stop.prevent="handleCancel"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ROUND_OVAL_PRESETS, STRIPE_PRESETS } from '../data/sizePresets';

defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'select', 'cancel']);

const roundOvalPresets = ROUND_OVAL_PRESETS;
const stripePresets = STRIPE_PRESETS;

function selectPreset(preset) {
  emit('select', preset);
  emit('update:modelValue', false);
}

function handleCancel() {
  emit('update:modelValue', false);
  emit('cancel');
}
</script>

<style scoped>
.presets-modal-enter-active,
.presets-modal-leave-active {
  transition: opacity 0.2s ease;
}
.presets-modal-enter-from,
.presets-modal-leave-to {
  opacity: 0;
}
.presets-modal-enter-active .presets-modal-box,
.presets-modal-leave-active .presets-modal-box {
  transition: transform 0.2s ease;
}
.presets-modal-enter-from .presets-modal-box,
.presets-modal-leave-to .presets-modal-box {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .presets-modal-enter-from .presets-modal-box,
  .presets-modal-leave-to .presets-modal-box {
    transform: scale(0.95);
  }
}

.presets-modal-overlay {
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
.presets-modal-box {
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
  .presets-modal-overlay {
    align-items: center;
    padding: 1rem;
  }
  .presets-modal-box {
    border-radius: 1rem;
  }
}
</style>
