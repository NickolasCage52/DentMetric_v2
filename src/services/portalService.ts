import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ServiceData } from '@/types/serviceData'

export interface PortalSnapshot {
  masterName?: string
  masterPhone?: string
  serviceName?: string
  serviceAddress?: string
  client?: {
    name?: string
    phone?: string
    brand?: string
    model?: string
    plate?: string
  }
  dents: Array<{
    element: string
    description: string
    price: number
  }>
  total: number
  currency?: string
  repairTimeHours?: number
  photoUrl?: string
  annotatedPhotoUrl?: string
  estimateDate: string
  documentNumber?: string
  warrantyNote?: string
}

export interface PortalLink {
  id: string
  estimateId?: string
  bookingId?: string
  snapshot: PortalSnapshot
  expiresAt: string
  isActive: boolean
  viewCount: number
  viewedAt?: string
  clientConfirmedAt?: string
  clientNote?: string
  createdAt: string
}

const LOCAL_LINKS_KEY = 'dm_portal_links_v1'

function loadLocalLinks(): Record<string, PortalLink> {
  try {
    const raw = localStorage.getItem(LOCAL_LINKS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PortalLink>) : {}
  } catch {
    return {}
  }
}

function saveLocalLinks(links: Record<string, PortalLink>): void {
  try {
    localStorage.setItem(LOCAL_LINKS_KEY, JSON.stringify(links))
  } catch {
    /* quota */
  }
}

function generateToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function rowToLink(data: Record<string, unknown>): PortalLink {
  return {
    id: String(data.id ?? ''),
    estimateId: data.estimate_id != null ? String(data.estimate_id) : undefined,
    bookingId: data.booking_id != null ? String(data.booking_id) : undefined,
    snapshot: (data.snapshot as PortalSnapshot) || { dents: [], total: 0, estimateDate: '' },
    expiresAt: String(data.expires_at ?? ''),
    isActive: data.is_active !== false,
    viewCount: Number(data.view_count) || 0,
    viewedAt: data.viewed_at != null ? String(data.viewed_at) : undefined,
    clientConfirmedAt: data.client_confirmed_at != null ? String(data.client_confirmed_at) : undefined,
    clientNote: data.client_note != null ? String(data.client_note) : undefined,
    createdAt: String(data.created_at ?? new Date().toISOString()),
  }
}

export async function createPortalLink(
  userId: string,
  snapshot: PortalSnapshot,
  estimateId?: string,
  bookingId?: string,
  ttlDays = 7,
): Promise<PortalLink> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString()

  const link: PortalLink = {
    id: token,
    estimateId,
    bookingId,
    snapshot,
    expiresAt,
    isActive: true,
    viewCount: 0,
    createdAt: new Date().toISOString(),
  }

  if (isSupabaseConfigured() && supabase) {
    const uid = userId && userId !== 'local' ? userId : null
    const snapJson = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>
    const { error } = await supabase.from('portal_links').insert({
      id: token,
      user_id: uid,
      estimate_id: estimateId ?? null,
      booking_id: bookingId ?? null,
      snapshot: snapJson,
      expires_at: expiresAt,
      is_active: true,
    })

    if (error) {
      if (import.meta.env.DEV) console.warn('[Portal] Supabase insert failed:', error.message)
    } else {
      return link
    }
  }

  const links = loadLocalLinks()
  links[token] = link
  saveLocalLinks(links)
  return link
}

export async function fetchPortalLink(token: string): Promise<PortalLink | null> {
  if (!token) return null

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('portal_links')
        .select('*')
        .eq('id', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (error || !data) return null

      const vc = (Number(data.view_count) || 0) + 1
      const now = new Date().toISOString()
      await supabase
        .from('portal_links')
        .update({
          view_count: vc,
          viewed_at: now,
          updated_at: now,
        })
        .eq('id', token)

      const out = rowToLink(data as Record<string, unknown>)
      out.viewCount = vc
      out.viewedAt = now
      return out
    } catch {
      /* local fallback */
    }
  }

  const links = loadLocalLinks()
  const link = links[token]
  if (!link || !link.isActive) return null
  if (new Date(link.expiresAt) < new Date()) return null
  link.viewCount = (link.viewCount || 0) + 1
  saveLocalLinks(links)
  return link
}

export async function confirmEstimate(token: string, clientNote?: string): Promise<boolean> {
  const now = new Date().toISOString()

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('portal_links')
      .update({
        client_confirmed_at: now,
        client_note: clientNote || null,
        updated_at: now,
      })
      .eq('id', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (!error) return true
  }

  const links = loadLocalLinks()
  if (links[token]) {
    links[token].clientConfirmedAt = now
    links[token].clientNote = clientNote
    saveLocalLinks(links)
    return true
  }
  return false
}

export async function deactivatePortalLink(token: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('portal_links').update({ is_active: false }).eq('id', token)
  }
  const links = loadLocalLinks()
  if (links[token]) {
    links[token].isActive = false
    saveLocalLinks(links)
  }
}

export function buildPortalUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const basePath = (import.meta.env.BASE_URL as string) || '/'
  const norm = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  const prefix = norm === '' ? '' : norm
  return `${origin}${prefix}/e/${token}`
}

export function buildPortalSnapshot(
  record: Record<string, unknown>,
  serviceData: ServiceData,
  masterName?: string,
): PortalSnapshot {
  const dents: PortalSnapshot['dents'] = []

  const lineSnap = record.lineItemsSnapshot as Array<Record<string, unknown>> | undefined
  if (Array.isArray(lineSnap) && lineSnap.length > 0) {
    lineSnap.forEach((item, i) => {
      const dent = (item.dent as Record<string, unknown>) || item
      const side = dent?.panelSide != null ? String(dent.panelSide) : ''
      const el =
        dent?.panelElement != null
          ? String(dent.panelElement)
          : (dent?.conditions as { panelElement?: string })?.panelElement != null
            ? String((dent.conditions as { panelElement?: string }).panelElement)
            : ''
      const element = [side, el].filter(Boolean).join(' ').trim() || `Повреждение ${i + 1}`
      const w = Number(dent?.sizeWidthMm ?? (dent?.bboxMm as { height?: number })?.height) || 0
      const l = Number(dent?.sizeLengthMm ?? (dent?.bboxMm as { width?: number })?.width) || 0
      const desc = l > 0 && w > 0 ? `${l}×${w} мм` : 'Вмятина'
      const price =
        Number(item.appliedTotal ?? item.dmCalculatedLineTotal ?? item.base ?? dent?.price ?? 0) || 0
      dents.push({ element, description: desc, price })
    })
  } else {
    const rawDents = record.dents as { items?: unknown[] } | unknown[] | undefined
    const items = Array.isArray(rawDents) ? rawDents : rawDents?.items
    if (Array.isArray(items)) {
      items.forEach((raw, i) => {
        const d = raw as Record<string, unknown>
        const element =
          (d.panelElement != null ? String(d.panelElement) : null) ||
          `Повреждение ${i + 1}`
        const len = Number(d.length ?? d.sizeLengthMm ?? (d.bboxMm as { width?: number })?.width) || 0
        const wid = Number(d.width ?? d.sizeWidthMm ?? (d.bboxMm as { height?: number })?.height) || 0
        const desc = len > 0 && wid > 0 ? `${len}×${wid} мм` : 'Вмятина'
        const price = Number(d.total ?? d.dmCalculatedPrice ?? d.price ?? 0) || 0
        dents.push({ element, description: desc, price })
      })
    }
  }

  const clientRaw = record.client as PortalSnapshot['client'] | undefined
  const total =
    Number(record.manualAdjustedPrice ?? record.total ?? record.totalPrice ?? record.totalEstimate ?? 0) || 0

  const created = record.createdAt != null ? String(record.createdAt) : undefined
  const estimateDate = created
    ? new Date(created).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

  const ann =
    record.annotatedPhotoUrl != null
      ? String(record.annotatedPhotoUrl)
      : record.annotatedPhotoDataUrl != null
        ? String(record.annotatedPhotoDataUrl)
        : undefined

  return {
    masterName: masterName || serviceData?.name,
    masterPhone: serviceData?.phone,
    serviceName: serviceData?.name,
    serviceAddress: serviceData?.address,
    client: clientRaw,
    dents,
    total,
    currency: (record.recordCurrency as string) || 'RUB',
    repairTimeHours:
      record.recordRepairTimeHours != null && Number.isFinite(Number(record.recordRepairTimeHours))
        ? Number(record.recordRepairTimeHours)
        : undefined,
    photoUrl: record.photoUrl != null ? String(record.photoUrl) : undefined,
    annotatedPhotoUrl: ann,
    estimateDate,
    warrantyNote: 'Гарантия на выполненные работы: 12 месяцев',
  }
}
