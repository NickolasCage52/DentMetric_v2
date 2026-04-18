import { useHistoryPiniaStore } from '@/stores/history';
import { getDisplayStatus, type HistorySaveOptions } from '@/features/history/historyStorePure';

export function loadHistory(forceReload = false) {
  return useHistoryPiniaStore().loadHistory(forceReload);
}

export function saveEstimate(estimateDraft: any, options?: HistorySaveOptions) {
  return useHistoryPiniaStore().saveEstimate(estimateDraft, options);
}

export function addRecord(recordDraft: any) {
  return useHistoryPiniaStore().addRecord(recordDraft);
}

export function updateRecordStatus(id: string, status: string, bookingAt?: string | null) {
  return useHistoryPiniaStore().updateRecordStatus(id, status, bookingAt);
}

export function deleteEstimate(id: string) {
  return useHistoryPiniaStore().deleteEstimate(id);
}

export function updateEstimate(id: string, partial: any) {
  return useHistoryPiniaStore().updateEstimate(id, partial);
}

export function clearHistory() {
  return useHistoryPiniaStore().clearHistory();
}

export function loadFromStorage() {
  return useHistoryPiniaStore().loadFromStorage();
}

export function saveToStorage() {
  return useHistoryPiniaStore().saveToStorage();
}

/**
 * @deprecated Предпочтительно useHistoryPiniaStore() из @/stores/history.
 * Оставлено для совместимости: те же ref, что и в Pinia.
 */
export function useHistoryStore() {
  const store = useHistoryPiniaStore();
  return {
    historyItems: store.records,
    loadHistory: store.loadHistory,
    saveEstimate: store.saveEstimate,
    updateEstimate: store.updateEstimate,
    deleteEstimate: store.deleteEstimate,
    clearHistory: store.clearHistory,
    getDisplayStatus,
  };
}
