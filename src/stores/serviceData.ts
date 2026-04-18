import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { normalizeServiceData, type ServiceData } from '@/types/serviceData';

const STORAGE_KEY = 'dm_service_data_v1';

function loadFromStorage(): ServiceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeServiceData(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
  } catch {
    return normalizeServiceData({});
  }
}

export const useServiceDataStore = defineStore('serviceData', () => {
  const data = ref<ServiceData>(loadFromStorage());

  function save(updates: Partial<ServiceData>): void {
    data.value = normalizeServiceData({ ...(data.value as unknown as Record<string, unknown>), ...updates });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value));
    } catch {
      /* quota */
    }
  }

  const isConfigured = computed(() => Boolean(data.value.name?.trim()));

  return { data, save, isConfigured };
});
