<template>
  <div v-if="thumbnails.length > 0" class="card-metallic rounded-2xl p-4 space-y-2">
    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Вложения</div>
    <div class="flex flex-wrap gap-2">
      <div v-for="t in thumbnails" :key="t.key" class="relative">
        <img
          :src="t.url"
          class="attachment-thumb w-20 h-20 object-cover rounded-lg border border-white/10 cursor-pointer"
          alt="Вложение"
          @click="openLightbox(t.key)"
        >
      </div>
    </div>
    <ImageLightbox
      :src="lightboxSrc"
      :visible="lightboxVisible"
      @close="closeLightbox"
    />
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { getAttachment } from '../utils/attachmentStorage';
import ImageLightbox from './ImageLightbox.vue';

const props = defineProps({
  attachments: { type: Array, default: () => [] }
});

const thumbnails = ref([]);
const lightboxSrc = ref('');
const lightboxVisible = ref(false);

async function load() {
  const list = props.attachments || [];
  const prev = thumbnails.value;
  prev.forEach((t) => URL.revokeObjectURL(t.url));
  const loaded = [];
  for (const a of list) {
    try {
      const blob = await getAttachment(a.idbKey);
      if (blob) loaded.push({ key: a.idbKey, url: URL.createObjectURL(blob) });
    } catch (_e) {}
  }
  thumbnails.value = loaded;
}

watch(() => props.attachments, load, { immediate: true });

onUnmounted(() => {
  thumbnails.value.forEach((t) => URL.revokeObjectURL(t.url));
});

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
</script>

<style scoped>
.attachment-thumb {
  transition: opacity 0.15s;
}
.attachment-thumb:active {
  opacity: 0.75;
}
</style>
