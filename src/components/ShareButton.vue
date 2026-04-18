<template>
  <button
    type="button"
    class="share-btn"
    :class="{
      'share-btn--loading': isSharing,
      'share-btn--success': showSuccess,
      'share-btn--compact': compact,
    }"
    :disabled="isSharing"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="handleShare"
  >
    <span v-if="showSuccess" class="share-btn__icon">&#10003;</span>
    <span v-else-if="isSharing" class="share-btn__icon share-btn__icon--spin">&#8635;</span>
    <span v-else class="share-btn__icon">&#8599;</span>
    <span v-if="showLabel" class="share-btn__label">{{ labelText }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { shareEstimate, SHARE_CLIPBOARD_SUCCESS, type ShareableRecord } from '@/utils/shareEstimate';

const props = withDefaults(
  defineProps<{
    record: ShareableRecord;
    /** Icon-first layout for tight action bars */
    compact?: boolean;
  }>(),
  { compact: false }
);

const isSharing = ref(false);
const showSuccess = ref(false);

const ariaLabel = 'Отправить клиенту';

const showLabel = computed(() => !props.compact || showSuccess.value);

const labelText = computed(() => (showSuccess.value ? 'Скопировано' : 'Отправить клиенту'));

async function handleShare() {
  if (isSharing.value) return;
  isSharing.value = true;
  try {
    await shareEstimate(props.record);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === SHARE_CLIPBOARD_SUCCESS) {
      showSuccess.value = true;
      setTimeout(() => {
        showSuccess.value = false;
      }, 2000);
    }
  } finally {
    isSharing.value = false;
  }
}
</script>

<style scoped>
.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: var(--dm-surface-2);
  border: 1px solid var(--dm-border);
  border-radius: 10px;
  color: var(--dm-text-primary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.share-btn--compact {
  padding: 0 10px;
  min-width: 44px;
}
.share-btn:active:not(:disabled) {
  background: var(--dm-surface);
}
.share-btn--success {
  border-color: var(--dm-accent);
  color: var(--dm-accent);
}
.share-btn--loading {
  opacity: 0.7;
  cursor: not-allowed;
}
.share-btn__icon {
  font-size: 14px;
  line-height: 1;
}
.share-btn__icon--spin {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
.share-btn__label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
