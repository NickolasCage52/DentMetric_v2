/**
 * stripePricing.ts
 * ЕДИНСТВЕННАЯ точка правды для расчёта "Полоса/Царапина".
 * Используется и в Quick, и в Детализации.
 * Таблицы из фото: h=2 (16 длин), h=4 (13 длин, min len=15).
 */
export type StripeSeverity = 'легкая' | 'средняя' | 'высокая' | 'экстра';

type StripeRow = {
  len: number;
  легкая: number;
  средняя: number;
  высокая: number;
  экстра: number;
};

// --- ТАБЛИЦЫ (источник: фото 3 и фото 1) ---

const TABLE_H2: StripeRow[] = [
  { len: 8, легкая: 5000, средняя: 6500, высокая: 8500, экстра: 11000 },
  { len: 10, легкая: 6000, средняя: 8000, высокая: 10500, экстра: 13000 },
  { len: 12, легкая: 7000, средняя: 9500, высокая: 12000, экстра: 15500 },
  { len: 15, легкая: 9000, средняя: 12000, высокая: 15500, экстра: 20000 },
  { len: 18, легкая: 11000, средняя: 15000, высокая: 19000, экстра: 24000 },
  { len: 20, легкая: 12000, средняя: 16000, высокая: 21000, экстра: 26500 },
  { len: 25, легкая: 13000, средняя: 17500, высокая: 23000, экстра: 28500 },
  { len: 30, легкая: 14000, средняя: 19000, высокая: 24500, экстра: 31000 },
  { len: 35, легкая: 15000, средняя: 20500, высокая: 26000, экстра: 33000 },
  { len: 40, легкая: 16000, средняя: 22000, высокая: 28000, экстра: 35000 },
  { len: 50, легкая: 18000, средняя: 24500, высокая: 31500, экстра: 40000 },
  { len: 60, легкая: 20000, средняя: 27000, высокая: 35000, экстра: 44000 },
  { len: 70, легкая: 22000, средняя: 30000, высокая: 38500, экстра: 48500 },
  { len: 80, легкая: 24000, средняя: 32500, высокая: 42000, экстра: 53000 },
  { len: 90, легкая: 26000, средняя: 35000, высокая: 45500, экстра: 57000 },
  { len: 100, легкая: 28000, средняя: 38000, высокая: 49000, экстра: 61500 }
];

const TABLE_H4: StripeRow[] = [
  { len: 15, легкая: 11000, средняя: 12000, высокая: 15000, экстра: 18000 },
  { len: 18, легкая: 14000, средняя: 15500, высокая: 19000, экстра: 23000 },
  { len: 20, легкая: 15000, средняя: 16500, высокая: 20500, экстра: 24500 },
  { len: 25, легкая: 16500, средняя: 18000, высокая: 22500, экстра: 27000 },
  { len: 30, легкая: 17500, средняя: 19000, высокая: 24000, экстра: 29000 },
  { len: 35, легкая: 19000, средняя: 21000, высокая: 26000, экстра: 31500 },
  { len: 40, легкая: 20000, средняя: 22000, высокая: 27000, экстра: 33000 },
  { len: 50, легкая: 22500, средняя: 24500, высокая: 30500, экстра: 37000 },
  { len: 60, легкая: 25000, средняя: 27000, высокая: 34000, экстра: 41000 },
  { len: 70, легкая: 27500, средняя: 30000, высокая: 37500, экстра: 45000 },
  { len: 80, легкая: 30000, средняя: 33000, высокая: 41000, экстра: 49500 },
  { len: 90, легкая: 32500, средняя: 35500, высокая: 44000, экстра: 53000 },
  { len: 100, легкая: 35000, средняя: 38000, высокая: 47500, экстра: 57000 }
];

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

/**
 * Линейная интерполяция по таблице.
 * Clamp за пределами диапазона (не экстраполировать).
 */
function lookupTable(
  table: StripeRow[],
  lengthCm: number,
  sev: StripeSeverity
): number {
  const minLen = table[0].len;
  const maxLen = table[table.length - 1].len;

  if (lengthCm <= minLen) return table[0][sev];
  if (lengthCm >= maxLen) return table[table.length - 1][sev];

  let lo = table[0];
  let hi = table[table.length - 1];

  for (let i = 0; i < table.length - 1; i++) {
    if (table[i].len <= lengthCm && table[i + 1].len >= lengthCm) {
      lo = table[i];
      hi = table[i + 1];
      break;
    }
  }

  if (lo.len === hi.len) return lo[sev];

  const t = (lengthCm - lo.len) / (hi.len - lo.len);
  return Math.round(lo[sev] + (hi[sev] - lo[sev]) * t);
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

// --- ПУБЛИЧНЫЙ API ---

export interface StripePriceParams {
  lengthCm: number;
  heightCm: number;
  severity: StripeSeverity;
}

/**
 * Рассчитать цену "Полоса/Царапина".
 * Единственная точка правды — используется в Quick и Детализации.
 */
export function getStripePrice({
  lengthCm,
  heightCm,
  severity
}: StripePriceParams): number {
  const h = Math.max(2, Math.min(4, heightCm));

  const price2 = lookupTable(TABLE_H2, lengthCm, severity);

  let price4: number;

  if (lengthCm >= 15) {
    price4 = lookupTable(TABLE_H4, lengthCm, severity);
  } else {
    const p2at15 = lookupTable(TABLE_H2, 15, severity);
    const p4at15 = TABLE_H4[0][severity];
    const K = p2at15 > 0 ? p4at15 / p2at15 : 1;
    const price4Raw = Math.round(price2 * K);
    price4 = Math.min(price4Raw, p4at15);
  }

  if (h <= 2) return price2;
  if (h >= 4) return price4;

  const t = (h - 2) / (4 - 2);
  return lerp(price2, price4, t);
}

/**
 * Presets для настроек/отображения (длины из таблицы h=2).
 */
export const STRIPE_PRESETS_DISPLAY = TABLE_H2.map((r) => ({
  lengthCm: r.len,
  label: `${r.len} см`,
  base: r.легкая
}));

/**
 * Маппинг coeffClass (K1/base, K2, K3, K4) → severity.
 * Используется для совместимости с pricingAdapter.
 */
export function mapCoeffClassToSeverity(coeffClass: string): StripeSeverity {
  const raw = String(coeffClass || '').trim().toLowerCase();
  const map: Record<string, StripeSeverity> = {
    base: 'легкая',
    k1: 'легкая',
    '1': 'легкая',
    k2: 'средняя',
    '2': 'средняя',
    k3: 'высокая',
    '3': 'высокая',
    k4: 'экстра',
    '4': 'экстра'
  };
  return map[raw] ?? 'средняя';
}
