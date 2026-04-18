<template>
  <button
    type="button"
    class="portal-share"
    :class="{ 'portal-share--compact': compact }"
    :disabled="busy || !record"
    :aria-label="label"
    @click="run"
  >
    <span class="portal-share__icon" aria-hidden="true">{{ busy ? '\u27F3' : '\u{1F517}' }}</span>
    <span v-if="!compact" class="portal-share__label">{{ busy ? '...' : 'Ссылка' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useServiceDataStore } from '@/stores/serviceData'
import { createPortalLink, buildPortalSnapshot, buildPortalUrl } from '@/services/portalService'
import { showToast } from '@/utils/toast'

const props = withDefaults(
  defineProps<{
    record: Record<string, unknown> | null | undefined
    estimateId?: string | null
    bookingId?: string | null
    compact?: boolean
    label?: string
  }>(),
  { compact: false, label: 'Ссылка для клиента' },
)

const busy = ref(false)
const authStore = useAuthStore()
const serviceDataStore = useServiceDataStore()

function toastMsg(msg: string): void {
  const tg = window.Telegram?.WebApp
  if (tg?.showPopup && tg?.isVersionAtLeast?.('6.2')) {
    tg.showPopup({ message: msg, buttons: [{ type: 'ok' }] })
  } else {
    showToast(msg, 'info', 2400)
  }
}

async function run(): Promise<void> {
  if (busy.value || !props.record) return
  busy.value = true
  try {
    const snap = buildPortalSnapshot(props.record, serviceDataStore.data, authStore.user?.name)
    const uid = authStore.user?.id || 'local'
    const eid = props.estimateId ?? (props.record.id != null ? String(props.record.id) : undefined)
    const link = await createPortalLink(uid, snap, eid, props.bookingId ?? undefined)
    const url = buildPortalUrl(link.id)
    const title = 'Оценка DentMetric'
    const text = `Ваша оценка готова: ${(snap.total || 0).toLocaleString('ru-RU')} \u20BD`
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text, url })
    } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      toastMsg('Ссылка скопирована в буфер')
    } else {
      toastMsg(url)
    }
  } catch {
    toastMsg('Не удалось создать ссылку')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.portal-share {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  min-width: 44px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid hsl(0 0% 100% / 0.12);
  background: hsl(0 0% 100% / 0.06);
  color: hsl(0 0% 92%);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.portal-share:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.portal-share--compact {
  padding: 0 8px;
}
.portal-share__icon {
  font-size: 16px;
  line-height: 1;
}
.portal-share__label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
