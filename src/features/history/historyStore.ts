/**
 * Публичная точка входа: чистые функции + константы из historyStorePure,
 * мутации состояния через Pinia (см. historyPiniaBridge / @/stores/history).
 */
export * from './historyStorePure';
export {
  useHistoryStore,
  loadHistory,
  saveEstimate,
  addRecord,
  updateRecordStatus,
  deleteEstimate,
  updateEstimate,
  clearHistory,
  loadFromStorage,
  saveToStorage,
} from './historyPiniaBridge';
