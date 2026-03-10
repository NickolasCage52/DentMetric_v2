/**
 * Единая функция расчёта итогов оценки.
 * Скидка ВСЕГДА применяется к subtotal (base + все коэффициенты), НЕ к base.
 *
 * Business rules:
 * 1. dentSubtotal = dentBase + dentCoefficients
 * 2. dentDiscountAmount = dentSubtotal × dentDiscountPercent / 100
 * 3. dentFinal = dentSubtotal - dentDiscountAmount
 * 4. orderSubtotal = Σ dentFinal (после multi-dent, до order discount)
 * 5. orderDiscountAmount = orderSubtotal × orderDiscountPercent / 100
 * 6. orderFinal = orderSubtotal - orderDiscountAmount
 */

export interface DentInput {
  id: string;
  /** Базовая цена из lookup. */
  basePrice: number;
  /** Итог до скидки: base + все коэффициенты (из pricingAdapter.total). */
  subtotal: number;
  /** Per-dent скидка %, 0 если нет. */
  discountPercent?: number;
}

export interface DentTotals {
  id: string;
  base: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  final: number;
}

export interface EstimateTotals {
  dents: DentTotals[];
  orderSubtotal: number;
  orderDiscountPercent: number;
  orderDiscountAmount: number;
  orderFinal: number;
}

/**
 * Рассчитывает итоги с корректной математикой скидок.
 * @param dentInputs - входные данные по вмятинам (subtotal уже включает base+коэффициенты)
 * @param orderDiscountPercent - скидка на весь заказ, 0 если нет
 */
export function calculateEstimateTotals(
  dentInputs: DentInput[],
  orderDiscountPercent: number = 0
): EstimateTotals {
  const dents: DentTotals[] = dentInputs.map((dent) => {
    const subtotal = Math.max(0, Number(dent.subtotal) || 0);
    const discountPercent = Math.max(0, Math.min(100, Number(dent.discountPercent) || 0));
    const discountAmount = Math.round(subtotal * discountPercent / 100);
    const final = Math.max(0, subtotal - discountAmount);

    return {
      id: dent.id,
      base: Number(dent.basePrice) || 0,
      subtotal,
      discountPercent,
      discountAmount,
      final,
    };
  });

  const orderSubtotal = dents.reduce((sum, d) => sum + d.final, 0);
  const orderDiscP = Math.max(0, Math.min(100, Number(orderDiscountPercent) || 0));
  const orderDiscountAmount = Math.round(orderSubtotal * orderDiscP / 100);
  const orderFinal = Math.max(0, orderSubtotal - orderDiscountAmount);

  return {
    dents,
    orderSubtotal,
    orderDiscountPercent: orderDiscP,
    orderDiscountAmount,
    orderFinal,
  };
}
