<template>
  <div class="result-screen">
    <div class="result-screen__content">

      <DetailProgressDots
        v-if="detailSteps?.length"
        :steps="detailSteps"
        :current-index="detailStepIndex"
      />

        <div class="result-photo-block">
          <p v-if="session.photoDataUrl" class="result-photo-block__label">Фото повреждения</p>
          <div class="result-photo-wrapper" @click="showPhoto = true">
            <img
              v-if="session.photoDataUrl"
              :src="session.photoDataUrl"
              class="result-photo"
              alt=""
            />
            <div class="result-photo-badges">
              <div
                v-for="dent in session.dents"
                :key="dent.id"
                class="result-photo-badge"
                :style="{ background: dent.color }"
              >
                {{ dent.index }}
              </div>
              <div
                v-for="dent in session.dents.filter((d) => d.secondaryDeformation)"
                :key="'sd_' + dent.id"
                class="result-photo-badge result-photo-badge--secondary"
              >
                СД{{ dent.index }}
              </div>
            </div>
            <div class="result-photo__tap-hint">Нажмите чтобы увеличить</div>
          </div>
        </div>

        <!-- Progress dots (one per dent) -->
        <div v-if="session.dents?.length > 0" class="result-dots">
          <div
            v-for="dent in session.dents"
            :key="dent.id"
            class="result-dot"
            :style="{ background: dent.color }"
          />
        </div>

      <QuickStyleFinalSection
        :line-items="lineItems"
        :initial-data="initialData"
        :detail-photo-url="null"
        :format-armaturnaya-summary="formatArmaturnayaSummary"
        :comment="comment"
        :client="clientForDisplay"
        :record-id="recordId"
        :attachments="attachments"
        :client-mood="clientMood"
        :prepayment="prepayment"
        :history-saving="historySaving"
        @back="$emit('back')"
        @save="$emit('save')"
        @book="$emit('record')"
        @open-discount="$emit('open-discount', $event)"
        @open-comment="$emit('open-comment')"
        @update:attachments="$emit('update:attachments', $event)"
        @update:client-mood="$emit('update:client-mood', $event)"
        @update:prepayment="$emit('update:prepayment', $event)"
      />

      <div class="result-screen__bottom-gap" />
    </div>

    <Teleport to="body">
      <div
        v-if="showPhoto && session.photoDataUrl"
        class="photo-modal"
        @click="showPhoto = false"
      >
        <img :src="session.photoDataUrl" class="photo-modal__img" alt="" />
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
import { ref, computed } from 'vue';
import QuickStyleFinalSection from '../quickStyle/QuickStyleFinalSection.vue';
import DetailProgressDots from './DetailProgressDots.vue';
const props = defineProps({
  detailSteps: { type: Array, default: () => [] },
  detailStepIndex: { type: Number, default: 0 },
  session: { type: Object, required: true },
  lineItems: { type: Array, default: () => [] },
  initialData: { type: Object, default: () => ({}) },
  formatArmaturnayaSummary: { type: Function, default: null },
  comment: { type: String, default: '' },
  recordId: { type: String, default: '' },
  attachments: { type: Array, default: () => [] },
  clientMood: { type: String, default: null },
  prepayment: { type: Object, default: () => ({ amount: 0, method: null }) },
  historySaving: { type: Boolean, default: false },
});

const emit = defineEmits([
  'back',
  'save',
  'record',
  'open-discount',
  'open-comment',
  'update:attachments',
  'update:client-mood',
  'update:prepayment',
]);

const showPhoto = ref(false);

const clientForDisplay = computed(() => {
  const c = props.session.client;
  return {
    name: c?.name ?? '',
    phone: c?.phone ?? '',
    brand: c?.carBrand ?? '',
    model: c?.carModel ?? '',
    company: c?.company ?? '',
  };
});
</script>

<style scoped>
.result-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--tab-bar-height, var(--app-footer-height, var(--bottom-nav-h, 64px)));
  display: flex;
  flex-direction: column;
  background: var(--dm-bg, #0f0f0f);
  z-index: 10;
  overflow: hidden;
}
.result-screen__content {
  flex: 1 1 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.result-screen__bottom-gap {
  height: 8px;
  flex-shrink: 0;
}
.result-screen__content :deep(.quick-style-final) {
  flex: 1 1 0;
  min-height: 0;
}
.result-photo-block {
  margin-bottom: 16px;
}
.result-photo-block__label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--dm-text-secondary);
  text-transform: uppercase;
  margin: 0 0 6px 0;
  padding: 0;
}
.result-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 12px;
}
.result-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.result-photo-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--dm-bg, #0f0f0f);
  height: 140px;
}
.result-photo {
  width: 100%;
  display: block;
  height: 140px;
  max-height: 160px;
  object-fit: cover;
}
.result-photo-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.result-photo-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #000;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
.result-photo-badge--secondary {
  background: rgba(229, 57, 53, 0.2) !important;
  border: 2px dashed var(--dm-danger, #e53935);
  color: var(--dm-danger, #e53935);
  font-size: 10px;
}
.result-photo__tap-hint {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
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
  min-width: 46px;
  min-height: 46px;
  border-radius: 50%;
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-primary, #fff);
  font-size: 20px;
  border: none;
  cursor: pointer;
}
</style>
