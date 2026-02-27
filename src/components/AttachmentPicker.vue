<template>
  <div class="attachment-picker">
    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Вложения</div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="sr-only"
      @change="onFileSelect"
    >
    <button
      type="button"
      class="attach-btn w-full flex items-center gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left text-[13px] text-gray-300 min-h-[44px]"
      @click="fileInputRef?.click()"
    >
      <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a2 2 0 102.827 2.828l6.585-6.586"/></svg>
      <span>прикрепить файл</span>
    </button>
    <div v-if="thumbnails.length > 0" class="flex flex-wrap gap-2 mt-2">
      <div v-for="(t, i) in thumbnails" :key="t.key" class="relative">
        <img
          :src="t.url"
          class="attachment-thumb w-16 h-16 object-cover rounded-lg border border-white/10 cursor-pointer"
          alt="Вложение"
          @click="openLightbox(t.key)"
        >
        <button
          type="button"
          class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/90 text-white text-xs flex items-center justify-center"
          @click.stop="removeAt(i)"
        >×</button>
      </div>
    </div>
    <ImageLightbox :src="lightboxSrc" :visible="lightboxVisible" @close="closeLightbox" />
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { saveAttachment, getAttachment, deleteAttachment, generateAttachmentKey } from '../utils/attachmentStorage';
import ImageLightbox from './ImageLightbox.vue';

const props = defineProps({
  recordId: { type: String, default: '' },
  dentIndex: { type: Number, default: 0 },
  modelValue: { type: Array, default: () => [] }  // [{ dentIndex, idbKey }]
});

const emit = defineEmits(['update:modelValue']);

const fileInputRef = ref(null);
const thumbnails = ref([]);  // [{ key, url }]
const lightboxSrc = ref('');
const lightboxVisible = ref(false);

const draftId = ref('');
const effectiveRecordId = () => props.recordId || draftId.value || (draftId.value = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

async function loadThumbnails() {
  const list = props.modelValue || [];
  const urls = [];
  for (const a of list) {
    if (a.dentIndex !== props.dentIndex) continue;
    try {
      const blob = await getAttachment(a.idbKey);
      if (blob) urls.push({ key: a.idbKey, url: URL.createObjectURL(blob) });
    } catch (_e) {}
  }
  thumbnails.value.forEach((t) => URL.revokeObjectURL(t.url));
  thumbnails.value = urls;
}

watch(() => props.modelValue, loadThumbnails, { immediate: true });

onUnmounted(() => {
  thumbnails.value.forEach((t) => URL.revokeObjectURL(t.url));
});

async function onFileSelect(e) {
  const file = e.target?.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  e.target.value = '';
  const recordId = effectiveRecordId();
  const key = generateAttachmentKey(recordId, props.dentIndex);
  try {
    await saveAttachment(key, file);
    const next = [...(props.modelValue || []), { dentIndex: props.dentIndex, idbKey: key }];
    emit('update:modelValue', next);
    await loadThumbnails();
  } catch (err) {
    console.error('[DentMetric] saveAttachment failed', err);
  }
}

function openLightbox(key) {
  const t = thumbnails.value.find((x) => x.key === key);
  if (!t?.url) return;
  lightboxSrc.value = t.url;
  lightboxVisible.value = true;
}

function closeLightbox() {
  lightboxVisible.value = false;
  lightboxSrc.value = '';
}

async function removeAt(idx) {
  const t = thumbnails.value[idx];
  if (!t) return;
  try {
    await deleteAttachment(t.key);
    URL.revokeObjectURL(t.url);
  } catch (_e) {}
  const next = (props.modelValue || []).filter((a) => a.idbKey !== t.key);
  emit('update:modelValue', next);
  thumbnails.value.splice(idx, 1);
}
</script>

<style scoped>
.attachment-thumb { transition: opacity 0.15s; }
.attachment-thumb:active { opacity: 0.75; }
</style>
