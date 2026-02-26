<template>
  <div v-if="thumbnails.length > 0" class="card-metallic rounded-2xl p-4 space-y-2">
    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Вложения</div>
    <div class="flex flex-wrap gap-2">
      <div v-for="t in thumbnails" :key="t.key" class="relative">
        <img :src="t.url" class="w-20 h-20 object-cover rounded-lg border border-white/10" alt="Вложение">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { getAttachment } from '../utils/attachmentStorage';

const props = defineProps({
  attachments: { type: Array, default: () => [] }
});

const thumbnails = ref([]);

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
</script>
