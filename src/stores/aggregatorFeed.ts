import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Открытые заявки агрегатора (для бейджа в меню). */
export const useAggregatorFeedStore = defineStore('aggregatorFeed', () => {
  const openJobsCount = ref(0)

  function setOpenJobsCount(n: number): void {
    openJobsCount.value = Math.max(0, Math.floor(n))
  }

  return { openJobsCount, setOpenJobsCount }
})
