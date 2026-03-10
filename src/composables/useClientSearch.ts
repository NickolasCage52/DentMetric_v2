import { ref, watch } from 'vue';
import {
  searchClientByPhone,
  searchClientByName,
  aggregateClientData,
  isPhoneSearchable,
  type HistoryRecord,
  type ClientAggregation
} from '../utils/clientSearch';

export function useClientSearch(getHistory: () => HistoryRecord[]) {
  const foundClient = ref<ClientAggregation | null>(null);
  const isSearching = ref(false);

  function searchByPhone(phone: string) {
    if (!phone || !isPhoneSearchable(phone)) {
      foundClient.value = null;
      return;
    }
    isSearching.value = true;
    try {
      const allRecords = getHistory();
      const { exact, partial } = searchClientByPhone(phone, allRecords);
      const matches = exact.length > 0 ? exact : partial;
      foundClient.value = matches.length > 0 ? aggregateClientData(matches) : null;
    } catch {
      foundClient.value = null;
    } finally {
      isSearching.value = false;
    }
  }

  function searchByName(name: string) {
    if (!name || String(name).trim().length < 2) return;
    try {
      const allRecords = getHistory();
      const matches = searchClientByName(name, allRecords);
      if (matches.length > 0 && !foundClient.value) {
        foundClient.value = aggregateClientData(matches);
      }
    } catch {
      /* тихо */
    }
  }

  function clearSearch() {
    foundClient.value = null;
  }

  return { foundClient, isSearching, searchByPhone, searchByName, clearSearch };
}
