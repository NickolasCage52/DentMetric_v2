import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchMarketPrices,
  findBenchmark,
  hasMarketPricesConsent,
  setMarketPricesConsent,
  enqueueRecordDataPoints,
  flushQueue,
  clearMarketPricesQueue,
  type MarketPriceBenchmark,
} from '@/services/marketPricesService'
import { isSupabaseConfigured } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

let fetchInFlight: Promise<void> | null = null

export const useMarketPricesStore = defineStore('marketPrices', () => {
  const benchmarks = ref<MarketPriceBenchmark[]>([])
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)
  const lastFetchAt = ref<string | null>(null)
  const consentGranted = ref(hasMarketPricesConsent())

  const isAvailable = computed(() => {
    const auth = useAuthStore()
    return Boolean(
      isSupabaseConfigured() && consentGranted.value && auth.user?.city?.trim(),
    )
  })

  async function fetchForCurrentCity(): Promise<void> {
    const authStore = useAuthStore()
    const city = authStore.user?.city
    if (!city?.trim() || !isSupabaseConfigured()) return
    if (!consentGranted.value) return

    if (fetchInFlight) return fetchInFlight

    fetchInFlight = (async () => {
      isLoading.value = true
      lastError.value = null
      try {
        const data = await fetchMarketPrices(city)
        benchmarks.value = data
        lastFetchAt.value = new Date().toISOString()
      } catch (err: unknown) {
        lastError.value = err instanceof Error ? err.message : 'Failed to fetch'
      } finally {
        isLoading.value = false
        fetchInFlight = null
      }
    })()

    return fetchInFlight
  }

  function getBenchmark(panelElement: string, carClass?: string): MarketPriceBenchmark | null {
    return findBenchmark(benchmarks.value, panelElement, carClass)
  }

  function grantConsent(): void {
    setMarketPricesConsent(true)
    consentGranted.value = true
  }

  function revokeConsent(): void {
    setMarketPricesConsent(false)
    consentGranted.value = false
    clearMarketPricesQueue()
  }

  function contributeRecord(record: Record<string, unknown>): void {
    if (!consentGranted.value) return
    const authStore = useAuthStore()
    const city = authStore.user?.city
    if (!city?.trim()) return
    enqueueRecordDataPoints(record, city)
  }

  async function flush(): Promise<void> {
    if (consentGranted.value) await flushQueue()
  }

  return {
    benchmarks,
    isLoading,
    lastError,
    lastFetchAt,
    consentGranted,
    isAvailable,
    fetchForCurrentCity,
    getBenchmark,
    grantConsent,
    revokeConsent,
    contributeRecord,
    flush,
  }
})
