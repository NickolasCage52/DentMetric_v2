<template>
  <div
    v-if="storageInfo.status !== 'ok'"
    class="storage-banner"
    :class="`storage-banner--${storageInfo.status}`"
    role="alert"
  >
    <div class="storage-banner__content">
      <span class="storage-banner__icon">{{ iconGlyph }}</span>
      <div class="storage-banner__text">
        <div class="storage-banner__title">
          {{
            storageInfo.status === 'critical'
              ? 'Хранилище почти заполнено'
              : 'Хранилище заполняется'
          }}
        </div>
        <div class="storage-banner__sub">
          {{ storageInfo.formattedUsed }} из
          {{ storageInfo.formattedMax }}
          ({{ storageInfo.percent }}%) ·
          {{ storageInfo.recordCount }} записей
        </div>
      </div>
    </div>
    <button type="button" class="storage-banner__btn" @click="$emit('export')">
      Сохранить бекап
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StorageInfo } from '@/utils/storageUtils';

const props = defineProps<{ storageInfo: StorageInfo }>();
defineEmits<{ export: [] }>();

const iconGlyph = computed(() =>
  props.storageInfo.status === 'critical' ? '\u{1F6A8}' : '\u26A0\uFE0F'
);
</script>

<style scoped>
.storage-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  flex-shrink: 0;
  gap: 10px;
}
.storage-banner--warning {
  background: rgba(245, 158, 11, 0.1);
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
}
.storage-banner--critical {
  background: rgba(229, 57, 53, 0.1);
  border-bottom: 1px solid rgba(229, 57, 53, 0.3);
}
.storage-banner__content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.storage-banner__icon {
  font-size: 18px;
  flex-shrink: 0;
}
.storage-banner__text {
  flex: 1;
  min-width: 0;
}
.storage-banner__title {
  font-size: 13px;
  font-weight: 700;
}
.storage-banner--warning .storage-banner__title {
  color: #fbbf24;
}
.storage-banner--critical .storage-banner__title {
  color: var(--dm-danger, #e53935);
}
.storage-banner__sub {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.storage-banner__btn {
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 12px;
  min-height: 44px;
  flex-shrink: 0;
  white-space: nowrap;
}
.storage-banner--warning .storage-banner__btn {
  border: 1px solid #fbbf24;
  color: #fbbf24;
}
.storage-banner--critical .storage-banner__btn {
  border: 1px solid var(--dm-danger, #e53935);
  color: var(--dm-danger, #e53935);
}
</style>
