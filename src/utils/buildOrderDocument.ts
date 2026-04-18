import type { OrderDocument, OrderDocumentDent, OrderDocumentWork } from '@/types/orderDocument';
import type { ServiceData } from '@/types/serviceData';
import { generateDocumentNumber } from '@/types/orderDocument';

/** Гибкий вход: сохранённая запись истории или «живой» объект как у ShareButton. */
export interface BuildOrderDocumentInput {
  serviceData: ServiceData;
  record: Record<string, unknown>;
  bookingId?: string;
}

function normalizePrepayment(p: unknown): number | undefined {
  if (p == null) return undefined;
  if (typeof p === 'number' && Number.isFinite(p)) return p;
  if (typeof p === 'object' && p !== null && 'amount' in p) {
    const a = Number((p as { amount?: unknown }).amount);
    return Number.isFinite(a) ? a : undefined;
  }
  return undefined;
}

function normalizeAdditionalWorks(raw: unknown): OrderDocumentWork[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((w) => {
    const o = w as Record<string, unknown>;
    return {
      name: String(o.title ?? o.name ?? 'Доп. работа'),
      price: Number(o.price) || 0,
    };
  });
}

function buildDentRows(record: Record<string, unknown>): OrderDocumentDent[] {
  const snap = record.lineItemsSnapshot as Array<Record<string, unknown>> | undefined;
  const dentsObj = record.dents as { items?: unknown[] } | undefined;

  if (dentsObj?.items && Array.isArray(dentsObj.items)) {
    return dentsObj.items.map((item, i) => {
      const d = item as Record<string, unknown>;
      const bbox = (d.bboxMm as { width?: unknown; height?: unknown }) || {};
      const w = Number(bbox.width ?? d.sizeLengthMm) || 0;
      const h = Number(bbox.height ?? d.sizeWidthMm) || 0;
      const element =
        [d.panelSide, d.panelElement].filter(Boolean).join(' ') || `Повреждение ${i + 1}`;
      const desc =
        [w && h ? `${w}×${h} мм` : null, d.sizeCode ? String(d.sizeCode) : null]
          .filter(Boolean)
          .join(', ') || 'Вмятина';
      let price = 0;
      if (Array.isArray(snap) && snap[i]) {
        const line = snap[i];
        price =
          Number(line.appliedTotal ?? line.dmCalculatedLineTotal ?? line.total ?? 0) || 0;
      }
      if (!price) price = Number(d.total) || 0;
      return { number: i + 1, element, description: desc, price };
    });
  }

  const flat = record.dents as unknown[] | undefined;
  if (Array.isArray(flat)) {
    return flat.map((item, i) => {
      const d = item as Record<string, unknown>;
      const element =
        String(d.panelElement ?? d.panelSide ?? '') || `Повреждение ${i + 1}`;
      const L = Number(d.length) || 0;
      const W = Number(d.width) || 0;
      const desc =
        L && W ? `${L}×${W} мм` : d.sizeCode ? String(d.sizeCode) : 'Вмятина';
      return {
        number: i + 1,
        element,
        description: desc,
        price: Number(d.total) || 0,
      };
    });
  }

  return [];
}

function clientFromRecord(record: Record<string, unknown>): OrderDocument['client'] {
  const c = record.client as Record<string, unknown> | undefined;
  if (!c) return {};
  return {
    name: c.name != null ? String(c.name) : undefined,
    phone: c.phone != null ? String(c.phone) : undefined,
    email: c.email != null ? String(c.email) : undefined,
  };
}

function vehicleFromRecord(record: Record<string, unknown>): OrderDocument['vehicle'] {
  const c = record.client as Record<string, unknown> | undefined;
  if (!c) return {};
  return {
    brand: c.brand != null ? String(c.brand) : undefined,
    model: c.model != null ? String(c.model) : undefined,
    plate: c.plate != null ? String(c.plate) : undefined,
    year: c.year != null ? String(c.year) : undefined,
    color: c.color != null ? String(c.color) : undefined,
    vin: c.vin != null ? String(c.vin) : undefined,
  };
}

export function buildOrderDocument(input: BuildOrderDocumentInput): OrderDocument {
  const { serviceData, record } = input;
  const now = new Date();
  const r = record;

  let dents = buildDentRows(r);
  const additionalWorks = normalizeAdditionalWorks(r.additionalWorks);

  const subtotalFromLines =
    dents.reduce((s, d) => s + d.price, 0) +
    additionalWorks.reduce((s, w) => s + w.price, 0);

  const pct = Number(r.discountPercent) || 0;
  const discount = pct > 0 ? Math.round(subtotalFromLines * (pct / 100)) : undefined;

  const totalRaw = Number(r.total);
  const total =
    totalRaw > 0
      ? totalRaw
      : discount != null
        ? Math.max(0, subtotalFromLines - discount)
        : subtotalFromLines;

  const subtotal = subtotalFromLines > 0 ? subtotalFromLines : total;

  if (dents.length === 0 && total > 0) {
    dents = [
      {
        number: 1,
        element: 'Согласованные работы',
        description: (r.comment as string) || 'По расчёту',
        price: total,
      },
    ];
  }

  const prepayment = normalizePrepayment(r.prepayment);
  const balance = prepayment != null && prepayment > 0 ? total - prepayment : undefined;

  const estHours = r.recordRepairTimeHours ?? r.repairTimeHours;
  const estimatedHours =
    estHours != null && Number.isFinite(Number(estHours)) ? Number(estHours) : undefined;

  const docTitle = serviceData.documentTitle || 'Заказ-наряд';

  return {
    id: `doc_${Date.now()}`,
    createdAt: now.toISOString(),
    documentNumber: generateDocumentNumber(),
    documentTitle: docTitle,
    date: now.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    service: {
      name: serviceData.name || '—',
      address: serviceData.address,
      phone: serviceData.phone,
      inn: serviceData.inn,
      logoBase64: serviceData.logoBase64,
    },
    client: clientFromRecord(r),
    vehicle: vehicleFromRecord(r),
    dents,
    additionalWorks,
    subtotal,
    discount: discount && discount > 0 ? discount : undefined,
    discountPercent: pct > 0 ? pct : undefined,
    total,
    prepayment: prepayment && prepayment > 0 ? prepayment : undefined,
    balance: balance !== undefined && Math.abs(balance) > 0.005 ? balance : undefined,
    estimatedHours,
    warrantyNote: 'Гарантия на выполненные работы: 12 месяцев',
    footerNote: serviceData.footerNote,
    estimateId: r.id != null ? String(r.id) : undefined,
    bookingId: input.bookingId,
    masterName: r.masterName != null ? String(r.masterName) : undefined,
  };
}
