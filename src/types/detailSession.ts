// src/types/detailSession.ts

/** Auto-assigned colors for dents (up to 8 dents) */
export const DENT_COLORS = [
  '#4CAF50', // green
  '#2196F3', // blue
  '#FF9800', // orange
  '#E91E63', // pink
  '#9C27B0', // purple
  '#00BCD4', // cyan
  '#FF5722', // deep orange
  '#8BC34A', // light green
] as const;

export interface DentOutline {
  points: number[];
  color: string;
  type: 'regular';
}

export interface SecondaryDeformationOutline {
  points: number[];
  type: 'secondary';
}

export interface DentDimensions {
  lengthMm: number;
  widthMm: number;
}

export interface SecondaryDeformation {
  id: string;
  parentDentId: string;
  outline: SecondaryDeformationOutline;
  dimensions: DentDimensions | null;
  areaMm2: number | null;
  pricingResult: number | null;
}

export interface DetailDent {
  id: string;
  index: number;
  color: string;
  outline: DentOutline;
  dimensions: DentDimensions | null;

  shapeType: 'circle' | 'strip' | null;
  complexity: string | null;
  conditions: Record<string, unknown>;
  coefficients: Record<string, unknown>;
  extraWork: Record<string, unknown>;
  totals: {
    base: number;
    adjustments: number;
    subtotal: number;
    discount: number;
    final: number;
  } | null;

  secondaryDeformation: SecondaryDeformation | null;

  /** Синхронизируются из размеров; для UI итогового экрана */
  sizeLengthMm?: number;
  sizeWidthMm?: number;
  /** Итоговый экран: ручная корректировка строки (как в быстром расчёте) */
  manualLineTotal?: number | null;
  manualRepairTimeHours?: number | null;
}

export type DetailStep =
  | 'client'
  | 'camera'
  | 'marking'
  | 'dimensions'
  | 'parameters'
  | 'result';

export const DETAIL_STEPS: DetailStep[] = [
  'client',
  'camera',
  'marking',
  'dimensions',
  'parameters',
  'result',
];

export interface ClientData {
  name: string;
  phone: string;
  carBrand: string;
  carModel: string;
  plateNumber: string;
  company: string;
  inspectDate?: string;
  inspectTime?: string;
}

export interface DetailFinalResult {
  dentsTotal: number;
  secondaryDeformationsTotal: number;
  orderSubtotal: number;
  orderDiscount: number;
  orderFinal: number;
}

export interface DetailSession {
  currentStep: DetailStep;
  currentDentIndex: number;

  client: ClientData | null;

  photoDataUrl: string | null;
  /** Снимок фото с контурами/номерами/размерной разметкой для экранов после разметки */
  annotatedPhotoDataUrl: string | null;
  photoAssetKey: string | null;

  markingMode: 'idle' | 'drawing-dent' | 'drawing-secondary';
  dents: DetailDent[];
  selectedDentId: string | null;

  orderDiscount: number;
  finalResult: DetailFinalResult | null;
}
