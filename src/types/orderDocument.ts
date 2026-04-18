export interface OrderDocumentDent {
  number: number;
  element: string;
  description: string;
  price: number;
}

export interface OrderDocumentWork {
  name: string;
  price: number;
}

export interface OrderDocument {
  id: string;
  createdAt: string;
  documentNumber: string;
  documentTitle: string;
  date: string;
  service: {
    name: string;
    address?: string;
    phone?: string;
    inn?: string;
    logoBase64?: string;
  };
  client: {
    name?: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    brand?: string;
    model?: string;
    plate?: string;
    year?: string;
    color?: string;
    vin?: string;
  };
  dents: OrderDocumentDent[];
  additionalWorks: OrderDocumentWork[];
  subtotal: number;
  discount?: number;
  discountPercent?: number;
  total: number;
  prepayment?: number;
  balance?: number;
  estimatedHours?: number;
  clientSignatureBase64?: string;
  masterSignatureBase64?: string;
  signedAt?: string;
  warrantyNote?: string;
  footerNote?: string;
  estimateId?: string;
  bookingId?: string;
  masterName?: string;
}

export function generateDocumentNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `ДМ-${y}${m}${d}-${rand}`;
}
