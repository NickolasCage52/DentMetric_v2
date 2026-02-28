<template>
  <div v-if="thumbnails.length > 0" class="card-metallic rounded-2xl p-4 space-y-2">
    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Фото вмятин</div>
    <div class="flex flex-wrap gap-2">
      <div v-for="t in thumbnails" :key="t.key" class="relative">
        <img
          :src="t.url"
          class="w-[72px] h-[72px] object-cover rounded-lg border border-white/10 cursor-pointer"
          alt="Фото вмятины"
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
  photoAssets: { type: Array, default: () => [] }
});

const thumbnails = ref([]);
const lightboxSrc = ref('');
const lightboxVisible = ref(false);

async function load() {
  const keys = props.photoAssets || [];
  thumbnails.value.forEach((t) => URL.revokeObjectURL(t.url));
  const loaded = [];
  for (const key of keys) {
    if (!key) continue;
    try {
      const blob = await getAttachment(key);
      if (blob) loaded.push({ key, url: URL.createObjectURL(blob) });
    } catch (_e) {}
  }
  thumbnails.value = loaded;
}

watch(() => props.photoAssets, load, { immediate: true });

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
