/**
 * resolveDentShapeType.ts
 * Единственная точка правды для определения типа формы вмятины по геометрии.
 * Зависит ТОЛЬКО от размеров. НЕ зависит от пресета или выбранной кнопки.
 *
 * Диапазоны взяты из stripePricing.ts:
 * - TABLE_H2: длина 8–100 см, высота 2 см
 * - TABLE_H4: длина 15–100 см, высота 4 см
 * - getStripePrice: heightCm clamped to 2–4
 */

/** Диапазон длины для полосных таблиц (см) */
const STRIPE_LENGTH_MIN_CM = 8;
const STRIPE_LENGTH_MAX_CM = 100;

/** Диапазон высоты (короткая сторона) для полосы: 2–4 см по таблицам, допуск 1.5–5 см */
const STRIPE_HEIGHT_MIN_CM = 1.5;
const STRIPE_HEIGHT_MAX_CM = 5;

/** Порог для ratio 1:1 — квадрат → oval */
const RATIO_ONE_EPS = 0.001;

/**
 * Определяет тип формы вмятины по геометрическим размерам.
 * Полоса — только если размеры подпадают под stripe-таблицы (длина 8–100 см, высота ~2–4 см).
 *
 * @param lengthMm - длина (обычно большая сторона) в мм
 * @param widthMm - ширина/высота (обычно малая сторона) в мм
 * @returns 'stripe' | 'oval'
 */
export function resolveDentShapeType(
  lengthMm: number,
  widthMm: number
): 'stripe' | 'oval' {
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  if (l <= 0 || w <= 0) return 'oval';

  const L = Math.max(l, w) / 10; // см
  const H = Math.min(l, w) / 10; // см

  const lengthInStripeRange = L >= STRIPE_LENGTH_MIN_CM && L <= STRIPE_LENGTH_MAX_CM;
  const widthInStripeRange = H >= STRIPE_HEIGHT_MIN_CM && H <= STRIPE_HEIGHT_MAX_CM;
  const ratio = H > 0 ? L / H : 1;
  const isElongated = Math.abs(ratio - 1) > RATIO_ONE_EPS;

  if (lengthInStripeRange && widthInStripeRange && isElongated) {
    return 'stripe';
  }
  return 'oval';
}

/**
 * Возвращает метку типа формы для отображения (Полоса / Овал / Круг).
 * Используется в UI блока "Геометрия повреждения".
 */
export function getResolvedShapeDisplayLabel(
  lengthMm: number,
  widthMm: number
): 'Круг' | 'Овал' | 'Полоса' {
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  if (l <= 0 || w <= 0) return 'Овал';

  const L = Math.max(l, w);
  const H = Math.min(l, w);
  const ratio = H > 0 ? L / H : 1;
  if (Math.abs(ratio - 1) <= RATIO_ONE_EPS) return 'Круг';

  const shapeType = resolveDentShapeType(lengthMm, widthMm);
  return shapeType === 'stripe' ? 'Полоса' : 'Овал';
}
