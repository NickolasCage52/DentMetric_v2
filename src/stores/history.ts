import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  normalizeHistoryRecord,
  generateRecordId,
  mapStatusForSave,
  readNormalizedHistoryFromStorage,
  writeHistoryPayloadToStorage,
  StorageFullError,
  type HistorySaveOptions,
} from '@/features/history/historyStorePure';
import { saveAnnotatedPhoto, deleteAnnotatedPhoto } from '@/utils/attachmentStorage';

export const useHistoryPiniaStore = defineStore('history', () => {
  const records = ref<any[]>([]);
  const isLoaded = ref(false);

  const historyItems = records;

  const recordCount = computed(() => records.value.length);

  function loadHistory(forceReload = false) {
    if (isLoaded.value && !forceReload) return records.value;
    records.value = readNormalizedHistoryFromStorage();
    isLoaded.value = true;
    return records.value;
  }

  function persistToStorage(items: any[], options: HistorySaveOptions = {}) {
    const finalItems = writeHistoryPayloadToStorage(items, options);
    records.value = finalItems;
  }

  async function saveEstimate(estimateDraft: any, options: HistorySaveOptions = {}) {
    if (!estimateDraft) return null;
    const id = estimateDraft.id || generateRecordId();
    const status = mapStatusForSave(estimateDraft.status ?? 'estimate');
    const raw: any = {
      ...estimateDraft,
      id,
      createdAt: estimateDraft.createdAt || new Date().toISOString(),
      status,
      attachments: estimateDraft.attachments ?? [],
    };
    if (
      raw.annotatedPhotoDataUrl &&
      typeof raw.annotatedPhotoDataUrl === 'string' &&
      raw.annotatedPhotoDataUrl.startsWith('data:')
    ) {
      const photoId = raw.id;
      try {
        await saveAnnotatedPhoto(photoId, raw.annotatedPhotoDataUrl);
        raw.annotatedPhotoRef = photoId;
        raw.annotatedPhotoDataUrl = null;
      } catch (err) {
        console.warn('[History] IDB photo save failed, keeping dataUrl:', err);
      }
    }
    const cloned = JSON.parse(JSON.stringify(raw));
    const norm = normalizeHistoryRecord(cloned);
    if (!norm) return null;
    norm.clientUpdatedAt = new Date().toISOString();
    const items = [...records.value];
    items.unshift(norm);
    try {
      persistToStorage(items, options);
    } catch (e) {
      if (e instanceof StorageFullError) throw e;
      throw e;
    }
    void import('@/services/syncTrigger').then(({ scheduleBackgroundSync }) => scheduleBackgroundSync());
    return norm;
  }

  function addRecord(recordDraft: any, options?: HistorySaveOptions) {
    return saveEstimate(recordDraft, options);
  }

  function updateRecordStatus(id: string, status: string, bookingAt?: string | null) {
    return updateEstimate(id, { status: mapStatusForSave(status), bookingAt: bookingAt ?? null });
  }

  async function deleteEstimate(id: string) {
    if (!id) return;
    const record = records.value.find((item) => item?.id === id);
    if (record?.annotatedPhotoRef) {
      try {
        await deleteAnnotatedPhoto(record.annotatedPhotoRef);
      } catch {
        /* silent */
      }
    }
    const items = records.value.filter((item) => item?.id !== id);
    persistToStorage(items);
    void import('@/services/syncTrigger').then(({ scheduleBackgroundSync }) => scheduleBackgroundSync());
  }

  function updateEstimate(id: string, partial: any) {
    if (!id || !partial) return null;
    const items = records.value.map((item) => {
      if (item?.id !== id) return item;
      const merged: any = {
        ...item,
        updatedAt: new Date().toISOString(),
        clientUpdatedAt: new Date().toISOString(),
      };
      if (partial.client) merged.client = { ...(item.client || {}), ...partial.client };
      if (partial.comment != null) merged.comment = partial.comment;
      if (partial.status != null) merged.status = mapStatusForSave(partial.status);
      if (partial.bookingAt !== undefined) merged.bookingAt = partial.bookingAt;
      if (partial.attachments !== undefined) merged.attachments = partial.attachments;
      if (partial.recordAttachments !== undefined) merged.recordAttachments = partial.recordAttachments;
      if (partial.clientMood !== undefined) merged.clientMood = partial.clientMood;
      if (partial.orderDiscount !== undefined) merged.orderDiscount = partial.orderDiscount;
      if (partial.discountPercent !== undefined) merged.discountPercent = Number(partial.discountPercent) || 0;
      if (partial.dents !== undefined) merged.dents = partial.dents;
      if (partial.prepayment !== undefined) merged.prepayment = partial.prepayment;
      if (partial.dmCalculatedPrice !== undefined) merged.dmCalculatedPrice = partial.dmCalculatedPrice;
      if (partial.manualAdjustedPrice !== undefined) merged.manualAdjustedPrice = partial.manualAdjustedPrice;
      if (partial.isPriceManuallyAdjusted !== undefined) merged.isPriceManuallyAdjusted = partial.isPriceManuallyAdjusted;
      if (partial.lineItemsSnapshot !== undefined) merged.lineItemsSnapshot = partial.lineItemsSnapshot;
      if (partial.recordRepairTimeHours !== undefined) {
        const v = partial.recordRepairTimeHours;
        merged.recordRepairTimeHours =
          v === null || v === ''
            ? null
            : (Number.isFinite(Number(v)) ? Number(v) : merged.recordRepairTimeHours);
      }
      if (partial.recordCountry === 'RU' || partial.recordCountry === 'BY') {
        merged.recordCountry = partial.recordCountry;
        merged.recordCurrency = partial.recordCountry === 'BY' ? 'BYN' : 'RUB';
      }
      if (partial.recordCurrency === 'RUB' || partial.recordCurrency === 'BYN') {
        merged.recordCurrency = partial.recordCurrency;
      }
      if (merged.isPriceManuallyAdjusted && merged.manualAdjustedPrice != null) {
        merged.total = Number(merged.manualAdjustedPrice) || merged.total;
      }
      return merged;
    });
    persistToStorage(items);
    void import('@/services/syncTrigger').then(({ scheduleBackgroundSync }) => scheduleBackgroundSync());
    return items.find((item) => item?.id === id) || null;
  }

  function clearHistory() {
    persistToStorage([]);
  }

  function loadFromStorage() {
    return loadHistory(true);
  }

  function saveToStorage() {
    persistToStorage(records.value, {});
  }

  /**
   * Полная замена истории после sync: диск + память (как прежний safeSaveHistory с ref).
   */
  function safeSaveHistory(mergedRecords: any[], options: HistorySaveOptions = {}): boolean {
    try {
      const finalItems = writeHistoryPayloadToStorage(mergedRecords, options);
      records.value = finalItems;
      isLoaded.value = true;
      return true;
    } catch (e) {
      if (e instanceof StorageFullError) throw e;
      console.error('[DentMetric] History save failed:', e);
      return false;
    }
  }

  return {
    records,
    historyItems,
    isLoaded,
    recordCount,
    loadHistory,
    saveEstimate,
    addRecord,
    updateRecordStatus,
    deleteEstimate,
    updateEstimate,
    clearHistory,
    loadFromStorage,
    saveToStorage,
    safeSaveHistory,
  };
});
