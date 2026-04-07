<template>
  <Teleport to="body">
    <Transition name="dent-dim-modal">
      <div
        v-if="modelValue && dent"
        class="dent-dim-modal-overlay fixed inset-0 z-[11000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="dent-dim-modal-box w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          style="background: var(--dm-bg, #0b0f14)"
          role="dialog"
          aria-modal="true"
          aria-label="Размеры вмятины"
          @click.stop
        >
          <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black"
                :style="{ background: dent.color }"
              >
                {{ dent.index }}
              </div>
              <h3 class="text-white font-bold text-base">Вмятина {{ dent.index }}</h3>
            </div>
            <button
              type="button"
              class="text-gray-400 p-2 -mr-2 text-xl leading-none touch-manipulation"
              aria-label="Закрыть"
              @click="handleCancel"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <div class="dim-fields-row">
              <div class="dim-field">
                <label class="dim-field__label">Длина (мм)</label>
                <input
                  ref="lengthInputRef"
                  type="number"
                  inputmode="numeric"
                  :value="localLength"
                  min="1"
                  max="9999"
                  placeholder="0"
                  class="dim-field__input"
                  @input="localLength = ($event.target.value && Number($event.target.value)) || ''"
                />
              </div>
              <div class="dim-field">
                <label class="dim-field__label">Ширина (мм)</label>
                <input
                  type="number"
                  inputmode="numeric"
                  :value="localWidth"
                  min="1"
                  max="9999"
                  placeholder="0"
                  class="dim-field__input"
                  @input="localWidth = ($event.target.value && Number($event.target.value)) || ''"
                />
            </div>
          </div>

            <div
              v-if="dent.secondaryDeformation"
              class="dim-secondary"
            >
              <div class="dim-secondary__title">Вторичная деформация</div>
              <div class="dim-fields-row">
                <div class="dim-field">
                  <label class="dim-field__label">Длина (мм)</label>
                  <input
                    type="number"
                    inputmode="numeric"
                    :value="localSecLength"
                    min="1"
                    max="9999"
                    placeholder="0"
                    class="dim-field__input"
                    @input="localSecLength = ($event.target.value && Number($event.target.value)) || ''"
                  />
                </div>
                <div class="dim-field">
                  <label class="dim-field__label">Ширина (мм)</label>
                  <input
                    type="number"
                    inputmode="numeric"
                    :value="localSecWidth"
                    min="1"
                    max="9999"
                    placeholder="0"
                    class="dim-field__input"
                    @input="localSecWidth = ($event.target.value && Number($event.target.value)) || ''"
                  />
                </div>
              </div>
            </div>
          </div>

          <p v-if="errorMessage" class="text-[11px] text-red-400 mt-2">{{ errorMessage }}</p>

          <div class="flex gap-2 mt-5">
            <button
              type="button"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/15 rounded-xl min-h-[48px] touch-manipulation"
              @click="handleCancel"
            >
              Отмена
            </button>
            <button
              type="button"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[48px] touch-manipulation"
              @click="handleSave"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { resolveDentShapeType } from '../../utils/resolveDentShapeType';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  dent: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel']);

const lengthInputRef = ref(null);
const localLength = ref('');
const localWidth = ref('');
const localSecLength = ref('');
const localSecWidth = ref('');
const errorMessage = ref('');

const hasSecondary = computed(() => !!props.dent?.secondaryDeformation);

/** Тип для расчёта цены — только по геометрии (без ручного переключателя в модалке). */
function shapeTypeFromDimensions(lengthMm, widthMm) {
  return resolveDentShapeType(lengthMm, widthMm) === 'stripe' ? 'strip' : 'circle';
}

watch(
  () => [props.modelValue, props.dent?.id],
  () => {
    if (!props.dent) return;
    localLength.value = props.dent.dimensions?.lengthMm > 0 ? props.dent.dimensions.lengthMm : '';
    localWidth.value = props.dent.dimensions?.widthMm > 0 ? props.dent.dimensions.widthMm : '';
    if (hasSecondary.value) {
      localSecLength.value =
        props.dent.secondaryDeformation?.dimensions?.lengthMm > 0
          ? props.dent.secondaryDeformation.dimensions.lengthMm
          : '';
      localSecWidth.value =
        props.dent.secondaryDeformation?.dimensions?.widthMm > 0
          ? props.dent.secondaryDeformation.dimensions.widthMm
          : '';
    } else {
      localSecLength.value = '';
      localSecWidth.value = '';
    }
    errorMessage.value = '';
    if (props.modelValue) {
      nextTick(() => lengthInputRef.value?.focus());
    }
  },
  { immediate: true }
);

function validate() {
  const len = Number(localLength.value);
  const wid = Number(localWidth.value);
  if (!Number.isFinite(len) || len < 1 || len > 9999) {
    errorMessage.value = 'Длина: 1–9999 мм';
    return null;
  }
  if (!Number.isFinite(wid) || wid < 1 || wid > 9999) {
    errorMessage.value = 'Ширина: 1–9999 мм';
    return null;
  }
  if (hasSecondary.value) {
    const sl = Number(localSecLength.value);
    const sw = Number(localSecWidth.value);
    if (!Number.isFinite(sl) || sl < 1 || sl > 9999) {
      errorMessage.value = 'Вторичная деформация: длина 1–9999 мм';
      return null;
    }
    if (!Number.isFinite(sw) || sw < 1 || sw > 9999) {
      errorMessage.value = 'Вторичная деформация: ширина 1–9999 мм';
      return null;
    }
  return {
    dentId: props.dent.id,
    dims: { lengthMm: len, widthMm: wid },
    secondaryDims: { lengthMm: sl, widthMm: sw },
    shapeType: shapeTypeFromDimensions(len, wid),
  };
  }
  return {
    dentId: props.dent.id,
    dims: { lengthMm: len, widthMm: wid },
    secondaryDims: null,
    shapeType: shapeTypeFromDimensions(len, wid),
  };
}

function handleSave() {
  const result = validate();
  if (!result) return;
  emit('save', result);
  emit('update:modelValue', false);
}

function handleCancel() {
  errorMessage.value = '';
  emit('cancel');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.dent-dim-modal-overlay {
  -webkit-overflow-scrolling: touch;
}
.dim-fields-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.dim-field {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}
.dim-field__label {
  display: block;
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  margin-bottom: 6px;
}
.dim-field__input {
  width: 100%;
  min-width: 0;
  height: 44px;
  min-height: 44px;
  border-radius: 8px;
  border: 1.5px solid var(--dm-border, #2a2a2a);
  background: var(--dm-surface, #161616);
  color: var(--dm-text-primary, #fff);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  padding: 0 8px;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}
.dim-field__input:focus {
  border-color: var(--dm-accent, #a0e040);
  outline: none;
}
.dim-field__input[type='number'] {
  -moz-appearance: textfield;
}
.dim-field__input::-webkit-outer-spin-button,
.dim-field__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.dim-secondary {
  padding-top: 12px;
  border-top: 1px solid var(--dm-border, #2a2a2a);
}
.dim-secondary__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-danger, #e53935);
  margin-bottom: 8px;
}
.dent-dim-modal-enter-active,
.dent-dim-modal-leave-active {
  transition: opacity 0.2s ease;
}
.dent-dim-modal-enter-from,
.dent-dim-modal-leave-to {
  opacity: 0;
}
.dent-dim-modal-enter-active .dent-dim-modal-box,
.dent-dim-modal-leave-active .dent-dim-modal-box {
  transition: transform 0.2s ease;
}
.dent-dim-modal-enter-from .dent-dim-modal-box,
.dent-dim-modal-leave-to .dent-dim-modal-box {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .dent-dim-modal-enter-from .dent-dim-modal-box,
  .dent-dim-modal-leave-to .dent-dim-modal-box {
    transform: scale(0.95);
  }
}
</style>
