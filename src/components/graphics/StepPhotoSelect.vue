<template>
  <div class="photo-select-screen quick-style-photo flex flex-col min-h-0 flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pt-3 pb-6">
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ФОТО ПОВРЕЖДЕНИЯ</div>
        <p class="text-[11px] text-gray-400 leading-snug">
          Сфотографируйте вмятину или выберите из галереи
        </p>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="photo-btn card-metallic rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-[88px] active:scale-95 hover:border-metric-green/50 transition-all touch-manipulation border border-white/10"
            @click="openCamera"
          >
            <svg class="w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
            </svg>
            <span class="text-[12px] font-semibold text-white">Камера</span>
          </button>
          <button
            type="button"
            class="photo-btn card-metallic rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-[88px] active:scale-95 hover:border-metric-green/50 transition-all touch-manipulation border border-white/10"
            @click="openGallery"
          >
            <svg class="w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-[12px] font-semibold text-white">Из галереи</span>
          </button>
        </div>
      </div>

      <div v-if="photoPreviewUrl" class="card-metallic rounded-2xl p-5 space-y-2">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ВЫБРАННОЕ ФОТО</div>
        <div class="rounded-xl overflow-hidden border border-white/10">
          <img :src="photoPreviewUrl" class="w-full h-auto max-h-[160px] object-contain bg-black/50" alt="Фото повреждения" />
          <button
            type="button"
            class="w-full py-2 text-[11px] font-semibold text-metric-green bg-black/30 hover:bg-black/50 transition-colors touch-manipulation"
            @click="replacePhoto"
          >
            Заменить фото
          </button>
        </div>
      </div>
    </div>

    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="sr-only"
      @change="onFileSelected"
    />
    <input
      ref="galleryInput"
      type="file"
      accept="image/*"
      class="sr-only"
      @change="onFileSelected"
    />

    <div class="graphics-action-bar shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10">
      <div class="flex items-center gap-2 w-full">
        <button
          type="button"
          @click="$emit('back')"
          class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]"
        >
          Назад
        </button>
        <button
          type="button"
          @click="$emit('next')"
          :disabled="!photoAsset"
          :class="photoAsset ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
          class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
        >
          Продолжить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { correctImageOrientation } from '../../utils/imageUtils';
import { saveAttachment, getAttachment } from '../../utils/attachmentStorage';

const props = defineProps({
  modelValue: { type: Object, default: null }  // { key, width, height, mime }
});

const emit = defineEmits(['back', 'next', 'update:modelValue']);

const cameraInput = ref(null);
const galleryInput = ref(null);
const photoPreviewUrl = ref(null);
const photoAsset = ref(props.modelValue ? { ...props.modelValue } : null);

watch(() => props.modelValue, (v) => {
  photoAsset.value = v ? { ...v } : null;
  if (v?.key) loadPreview(v.key);
  else photoPreviewUrl.value = null;
}, { immediate: true });

async function loadPreview(key) {
  try {
    const blob = await getAttachment(key);
    if (blob) photoPreviewUrl.value = URL.createObjectURL(blob);
  } catch (_) {}
}

function openCamera() {
  cameraInput.value?.click();
}

function openGallery() {
  galleryInput.value?.click();
}

function replacePhoto() {
  photoAsset.value = null;
  photoPreviewUrl.value = null;
  emit('update:modelValue', null);
  galleryInput.value?.click();
}

async function onFileSelected(e) {
  const file = e.target?.files?.[0];
  if (!file || !file.type?.startsWith('image/')) return;

  try {
    const correctedBlob = await correctImageOrientation(file);
    const url = URL.createObjectURL(correctedBlob);
    photoPreviewUrl.value = url;

    const key = `dm_photo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await saveAttachment(key, correctedBlob);

    photoAsset.value = {
      key,
      width: 0,
      height: 0,
      mime: correctedBlob.type || 'image/jpeg'
    };
    emit('update:modelValue', photoAsset.value);
  } catch (err) {
    console.error('[DentMetric] Photo select failed', err);
  }
  e.target.value = '';
}
</script>
