/**
 * DEV audit: математика скидок (calculateEstimateTotals).
 * Скидка должна применяться к subtotal (base + коэффициенты), не к base.
 */
import { calculateEstimateTotals } from './calculateEstimateTotals';

export function runDiscountAudit() {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return;

  try {
    // ТЕСТ 1: per-dent скидка (кейс со скриншота)
    const t1 = calculateEstimateTotals(
      [
        { id: 'd1', basePrice: 2000, subtotal: 4600, discountPercent: 20 },
        { id: 'd2', basePrice: 2000, subtotal: 2300, discountPercent: 20 }
      ],
      0
    );
    const t1ok =
      t1.dents[0].subtotal === 4600 &&
      t1.dents[0].discountAmount === 920 &&
      t1.dents[0].final === 3680 &&
      t1.dents[1].subtotal === 2300 &&
      t1.dents[1].discountAmount === 460 &&
      t1.dents[1].final === 1840 &&
      t1.orderFinal === 5520;
    if (!t1ok) {
      console.error('[DISCOUNT AUDIT FAIL] t1 per-dent:', {
        d1: t1.dents[0],
        d2: t1.dents[1],
        orderFinal: t1.orderFinal
      });
      return;
    }

    // ТЕСТ 2: только order скидка
    const t2 = calculateEstimateTotals(
      [
        { id: 'd1', basePrice: 3000, subtotal: 3000, discountPercent: 0 },
        { id: 'd2', basePrice: 2000, subtotal: 2000, discountPercent: 0 }
      ],
      10
    );
    const t2ok =
      t2.orderSubtotal === 5000 &&
      t2.orderDiscountAmount === 500 &&
      t2.orderFinal === 4500;
    if (!t2ok) {
      console.error('[DISCOUNT AUDIT FAIL] t2 order:', t2);
      return;
    }

    // ТЕСТ 3: оба уровня скидок
    const t3 = calculateEstimateTotals(
      [
        { id: 'd1', basePrice: 2000, subtotal: 4600, discountPercent: 20 },
        { id: 'd2', basePrice: 2000, subtotal: 2300, discountPercent: 0 }
      ],
      10
    );
    const t3ok =
      t3.dents[0].final === 3680 &&
      t3.orderSubtotal === 5980 &&
      t3.orderDiscountAmount === 598 &&
      t3.orderFinal === 5382;
    if (!t3ok) {
      console.error('[DISCOUNT AUDIT FAIL] t3 both:', t3);
      return;
    }

    // ТЕСТ 4: без скидок
    const t4 = calculateEstimateTotals(
      [{ id: 'd1', basePrice: 2000, subtotal: 4600, discountPercent: 0 }],
      0
    );
    if (t4.dents[0].final !== 4600 || t4.orderFinal !== 4600) {
      console.error('[DISCOUNT AUDIT FAIL] t4 no discount:', t4);
      return;
    }

    // ТЕСТ 5: старые записи без discountPercent
    const t5 = calculateEstimateTotals(
      [{ id: 'd1', basePrice: 3000, subtotal: 3500, discountPercent: undefined }],
      undefined
    );
    if (t5.dents[0].final !== 3500) {
      console.error('[DISCOUNT AUDIT FAIL] t5 undefined:', t5);
      return;
    }

    console.log('[DISCOUNT AUDIT] Все тесты пройдены ✓');
  } catch (e) {
    console.error('[DISCOUNT AUDIT] Ошибка:', e);
  }
}
