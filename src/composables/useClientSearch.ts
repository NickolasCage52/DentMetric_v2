import { ref, watch } from 'vue';
import {
  searchClientByPhone,
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

  function clearSearch() {
    foundClient.value = null;
  }

  return { foundClient, isSearching, searchByPhone, clearSearch };
}
