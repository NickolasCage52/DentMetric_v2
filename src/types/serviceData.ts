export interface ServiceData {
  name: string;
  shortName?: string;
  logoBase64?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  legalForm?: string;
  inn?: string;
  ogrn?: string;
  ofd?: string;
  documentTitle?: string;
  footerNote?: string;
  showSignatureLine?: boolean;
  showStampArea?: boolean;
}

export function normalizeServiceData(raw: Record<string, unknown> | null | undefined): ServiceData {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    name: (r.name as string) || '',
    shortName: r.shortName != null ? String(r.shortName) : undefined,
    logoBase64: r.logoBase64 != null ? String(r.logoBase64) : undefined,
    address: r.address != null ? String(r.address) : undefined,
    city: r.city != null ? String(r.city) : undefined,
    phone: r.phone != null ? String(r.phone) : undefined,
    email: r.email != null ? String(r.email) : undefined,
    website: r.website != null ? String(r.website) : undefined,
    legalForm: r.legalForm != null ? String(r.legalForm) : undefined,
    inn: r.inn != null ? String(r.inn) : undefined,
    ogrn: r.ogrn != null ? String(r.ogrn) : undefined,
    ofd: r.ofd != null ? String(r.ofd) : undefined,
    documentTitle: (r.documentTitle as string) || 'Заказ-наряд',
    footerNote: r.footerNote != null ? String(r.footerNote) : undefined,
    showSignatureLine: r.showSignatureLine != null ? Boolean(r.showSignatureLine) : true,
    showStampArea: r.showStampArea != null ? Boolean(r.showStampArea) : false,
  };
}
