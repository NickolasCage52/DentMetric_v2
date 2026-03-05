<template>
  <div class="client-info-block card-metallic rounded-xl">
    <div class="cib-header flex items-center justify-between gap-2">
      <div class="cib-title">КЛИЕНТ</div>
      <button
        v-if="editable"
        type="button"
        class="cib-edit-btn text-gray-500 hover:text-metric-green text-xs font-medium flex items-center gap-1 touch-manipulation"
        @click.stop="$emit('edit')"
        aria-label="Редактировать данные клиента"
      >
        <span>✎</span>
        <span>{{ hasAnyData ? 'Редактировать' : 'Добавить' }}</span>
      </button>
    </div>
    <div v-if="hasAnyData" class="cib-body">
      <div
        v-if="client?.name"
        class="cib-row"
        :class="{ 'cib-row--clickable': editable }"
        @click="editable && $emit('edit-field', 'name')"
      >
        <span class="cib-label">Имя</span>
        <span class="cib-value">{{ client.name }}</span>
      </div>
      <div
        v-if="client?.phone"
        class="cib-row"
        :class="{ 'cib-row--clickable': editable }"
        @click="editable && $emit('edit-field', 'phone')"
      >
        <span class="cib-label">Телефон</span>
        <span class="cib-value">{{ client.phone }}</span>
      </div>
      <div
        v-if="client?.brand || client?.model"
        class="cib-row"
        :class="{ 'cib-row--clickable': editable }"
        @click="editable && $emit('edit-field', 'car')"
      >
        <span class="cib-label">Авто</span>
        <span class="cib-value">{{ [client.brand, client.model].filter(Boolean).join(' ') }}</span>
      </div>
      <div
        v-if="client?.company"
        class="cib-row"
        :class="{ 'cib-row--clickable': editable }"
        @click="editable && $emit('edit-field', 'company')"
      >
        <span class="cib-label">Компания</span>
        <span class="cib-value">{{ client.company }}</span>
      </div>
    </div>
    <div v-else class="cib-empty text-gray-500 text-[13px] py-2">
      {{ editable ? 'Данные клиента не заполнены' : '—' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  client: { type: Object, default: () => ({}) },
  editable: { type: Boolean, default: false }
});

defineEmits(['edit', 'edit-field']);

const hasAnyData = computed(() =>
  props.client?.name || props.client?.phone || props.client?.brand || props.client?.model || props.client?.company
);
</script>

<style scoped>
.client-info-block {
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}
.cib-header {
  margin-bottom: 8px;
}
.cib-title {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #666;
  text-transform: uppercase;
}
.cib-edit-btn {
  padding: 2px 6px;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}
.cib-row--clickable {
  cursor: pointer;
  border-radius: 6px;
  margin: 0 -8px;
  padding: 4px 8px !important;
}
.cib-row--clickable:hover {
  background: rgba(255, 255, 255, 0.05);
}
.cib-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 0;
}
.cib-label {
  font-size: 12px;
  color: #888;
  flex-shrink: 0;
  width: 80px;
}
.cib-value {
  font-size: 12px;
  color: #fff;
  text-align: right;
  max-width: calc(100% - 88px);
  word-break: break-word;
}
</style>
