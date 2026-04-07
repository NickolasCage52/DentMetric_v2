import { ref, watch } from 'vue';
import {
  searchClientByPhone,
  aggregateClientData,
  isPhoneSearchable,
  type HistoryRecord,
  type ClientAggregation,
  type PhoneRegion
} from '../utils/clientSearch';

export function useClientSearch(
  getHistory: () => HistoryRecord[],
  getRegion?: () => PhoneRegion
) {
  const foundClient = ref<ClientAggregation | null>(null);
  const isSearching = ref(false);

  function searchByPhone(phone: string) {
    const region = getRegion?.() ?? 'RU';
    if (!phone || !isPhoneSearchable(phone, region)) {
      foundClient.value = null;
      return;
    }
    isSearching.value = true;
    try {
      const allRecords = getHistory();
      const { exact, partial } = searchClientByPhone(phone, allRecords, region);
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
