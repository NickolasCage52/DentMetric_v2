<template>
  <div class="dm-detail-screen detail-screen">
    <div class="detail-screen__content">

      <DetailProgressDots
        v-if="detailSteps?.length"
        :steps="detailSteps"
        :current-index="detailStepIndex"
      />

      <!-- Объединённый блок: переключатель вмятин + размеры + фото -->
      <div class="dent-param-unified">
        <div class="dent-param-unified__left">
          <div class="dent-param-unified__label">ПОВРЕЖДЕНИЯ</div>
          <div class="dent-param-unified__chips">
            <button
              v-for="d in displayDents"
              :key="d.id"
              type="button"
              class="dent-param-chip"
              :class="{ 'dent-param-chip--active': d.id === dent.id }"
              :style="d.id === dent.id ? { background: d.color, color: '#000' } : { borderColor: d.color }"
              @click="emit('go-to-index', d.index - 1)"
            >
              {{ d.index }}
            </button>
          </div>
        </div>
        <div class="dent-param-unified__right">
          <span class="dent-param-unified__dims">{{ dent.dimensions?.lengthMm || '—' }}×{{ dent.dimensions?.widthMm || '—' }} мм</span>
          <button
            type="button"
            class="dent-param-photo-btn"
            data-testid="btn-open-photo-preview"
            @click="showPhoto = true"
            title="Открыть фото для сверки"
          >
            🖼
          </button>
        </div>
      </div>

      <QuickStyleStep2Section
        :active-dent="activeDentForStep2"
        :active-dent-id="dent.id"
        :dents="dentsForStep2"
        :initial-data="initialData"
        :user-settings="userSettings"
        :selected-part-name="selectedPartName"
        :hide-add-remove="true"
        :hide-reset="true"
        :hide-dent-selector="true"
        @set-active="() => {}"
        @update-size="(p) => $emit('update-size', { dentId: dent.id, ...p })"
        @update-conditions="(p) => $emit('update-conditions', { dentId: dent.id, ...p })"
        @update-panel-element="(v) => $emit('update-conditions', { dentId: dent.id, field: 'panelElement', value: v })"
        @update-panel-side="(v) => $emit('update-conditions', { dentId: dent.id, field: 'panelSide', value: v })"
        @preset-selected="(preset) => $emit('preset-selected', { dentId: dent.id, preset })"
      />

      <button
        v-if="dentCount > 1"
        type="button"
        class="apply-to-all-btn"
        :class="{ 'apply-to-all-btn--success': applyAllSuccess }"
        :disabled="applyAllSuccess"
        @click="handleApplyToAll"
      >
        <template v-if="applyAllSuccess">
          <span class="apply-to-all-btn__check">✓</span>
          Применено ко всем вмятинам
        </template>
        <template v-else>
          <span class="apply-to-all-btn__icon">⟳</span>
          Применить параметры ко всем вмятинам
          <span class="apply-to-all-btn__note">(кроме размеров)</span>
        </template>
      </button>

    </div>

    <div class="detail-screen__footer">
      <div class="detail-footer-row">
        <button
          type="button"
          class="dm-btn dm-btn--secondary"
          @click="currentIndex > 0 ? $emit('prev') : $emit('back')"
        >
          ← Назад
        </button>
        <button
          type="button"
          class="dm-btn dm-btn--primary"
          style="flex: 1"
          data-testid="btn-param-next"
          :disabled="!canProceed"
          :class="{ 'opacity-50 cursor-not-allowed': !canProceed }"
          @click="handleSaveAndNext"
        >
          {{ isLastDent ? 'К итогу →' : `Вмятина ${currentIndex + 2} →` }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showPhoto && displayPhotoUrl"
        class="photo-modal"
        @click="showPhoto = false"
      >
        <img :src="displayPhotoUrl" class="photo-modal__img" alt="" />
        <button
          type="button"
          class="photo-modal__close"
          @click.stop="showPhoto = false"
        >
          ✕
        </button>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import QuickStyleStep2Section from '../quickStyle/QuickStyleStep2Section.vue';
import DetailProgressDots from './DetailProgressDots.vue';
const props = defineProps({
  detailSteps: { type: Array, default: () => [] },
  detailStepIndex: { type: Number, default: 0 },
  dent: { type: Object, required: true },
  dents: { type: Array, default: () => [] },
  dentCount: { type: Number, default: 1 },
  currentIndex: { type: Number, default: 0 },
  photoDataUrl: { type: String, default: null },
  annotatedPhotoUrl: { type: String, default: null },
  isLastDent: { type: Boolean, default: false },
  initialData: { type: Object, required: true },
  userSettings: { type: Object, default: () => ({}) },
  selectedPartName: { type: String, default: null },
});

const emit = defineEmits([
  'apply-to-all',
  'go-to-index',
  'prev',
  'back',
  'next',
  'update-size',
  'update-conditions',
  'preset-selected',
]);

const showPhoto = ref(false);
const applyAllSuccess = ref(false);
let applyAllTimer = null;

const displayPhotoUrl = computed(
  () => props.annotatedPhotoUrl || props.photoDataUrl || null
);

function handleApplyToAll() {
  emit('apply-to-all', props.dent.id);
  applyAllSuccess.value = true;
  if (applyAllTimer) clearTimeout(applyAllTimer);
  applyAllTimer = setTimeout(() => {
    applyAllSuccess.value = false;
    applyAllTimer = null;
  }, 2000);
}

onUnmounted(() => {
  if (applyAllTimer) clearTimeout(applyAllTimer);
});

const displayDents = computed(() =>
  props.dents?.length > 0 ? props.dents : (props.dent ? [props.dent] : [])
);

const activeDentForStep2 = computed(() => {
  const d = props.dent;
  if (!d) return null;
  const cond = d.conditions || {};
  const disassemblyCodes = cond.disassemblyCodes?.length
    ? cond.disassemblyCodes
    : ['Z0'];
  return {
    id: d.id,
    sizeLengthMm: d.dimensions?.lengthMm ?? 0,
    sizeWidthMm: d.dimensions?.widthMm ?? 0,
    panelSide: cond.panelSide ?? 'left',
    panelElement: cond.panelElement ?? null,
    conditions: { ...cond, disassemblyCodes },
  };
});

const dentsForStep2 = computed(() =>
  Array.from({ length: props.dentCount }, (_, i) => ({ id: `d${i}` }))
);

const canProceed = computed(() => {
  const cond = props.dent?.conditions || {};
  return !!(
    cond.panelElement &&
    cond.repairCode &&
    cond.riskCode &&
    cond.materialCode &&
    cond.carClassCode
  );
});

function handleSaveAndNext() {
  if (!canProceed.value) return;
  emit('next');
}
</script>

<style scoped>
.detail-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--tab-bar-height, var(--app-footer-height, var(--bottom-nav-h, 64px)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--dm-bg, #0f0f0f);
  z-index: 10;
}
.detail-screen__content {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  padding: 16px;
}
.dent-param-unified {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0 16px;
  margin-bottom: 4px;
}
.dent-param-unified__left {
  flex: 1;
  min-width: 0;
}
.dent-param-unified__label {
  font-size: 10px;
  font-weight: 700;
  color: var(--dm-text-secondary, #888);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.dent-param-unified__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.dent-param-chip {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  border: 2px solid transparent;
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-secondary, #888);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.dent-param-chip:active {
  transform: scale(0.94);
}
.dent-param-chip--active {
  box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
}
.dent-param-unified__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.dent-param-unified__dims {
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-secondary, #888);
  white-space: nowrap;
}
.detail-screen__footer {
  flex-shrink: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--dm-surface);
  border-top: 1px solid var(--dm-border);
}
.dent-param-photo-btn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--dm-border);
  background: var(--dm-surface-2);
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
}
.apply-to-all-btn {
  width: 100%;
  min-height: 48px;
  margin-top: 12px;
  border-radius: 10px;
  border: 1.5px dashed var(--dm-border);
  background: transparent;
  color: var(--dm-text-secondary);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.apply-to-all-btn--success {
  border-style: solid;
  border-color: var(--dm-accent, #a0e040);
  background: rgba(160, 224, 64, 0.12);
  color: var(--dm-accent, #a0e040);
  cursor: default;
}
.apply-to-all-btn__check {
  font-size: 16px;
  font-weight: 700;
}
.apply-to-all-btn__icon {
  font-size: 18px;
}
.apply-to-all-btn__note {
  font-size: 11px;
  opacity: 0.7;
}
.detail-footer-row {
  display: flex;
  gap: 8px;
}
.photo-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.photo-modal__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.photo-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 20px;
  border: none;
  cursor: pointer;
}
.dm-btn {
  min-height: 50px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 16px;
  transition: all 0.15s ease;
}
.dm-btn:active {
  transform: scale(0.96);
}
.dm-btn--primary {
  background: var(--dm-accent);
  color: #000;
  border: none;
}
.dm-btn--secondary {
  background: transparent;
  color: var(--dm-text-secondary);
  border: 1px solid var(--dm-border);
}
</style>
