/**
 * Unit tests for pricing adapter consistency.
 * Quick and Detail adapters must produce identical totals for same normalized input.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateDentPrice,
  calculateDentBasePrice,
  normalizeDimensions,
  normalizeGraphicsDentsForPricing,
  isStripeCase,
  isRatioOneToOne,
  getShapeDisplayLabel,
} from '../src/features/pricing/pricingAdapter';
import { calcTotalPrice, roundPrice } from '../src/utils/priceCalc';
import { initialData } from '../src/data/initialData';
import { circleSizesWithArea, stripSizesWithArea } from '../src/data/dentSizes';
import { STRIPE_PRESETS } from '../src/data/sizePresets';

const prices = {};
initialData.circleSizes.forEach((s) => {
  prices[s.code] = s.basePrice;
});
initialData.stripSizes.forEach((s) => {
  prices[s.code] = s.basePrice;
});

const conditions = {
  repairCode: 'R1',
  riskCode: 'RK2',
  materialCode: 'M1',
  carClassCode: 'CLASS_STD',
  disassemblyCode: 'Z0',
};

describe('pricingAdapter', () => {
  describe('normalizeDimensions', () => {
    it('rounds to 1 decimal place', () => {
      expect(normalizeDimensions(12.34, 56.78)).toEqual({ widthMm: 12.3, heightMm: 56.8 });
    });
    it('handles zero', () => {
      expect(normalizeDimensions(0, 0)).toEqual({ widthMm: 0, heightMm: 0 });
    });
    it('clamps negative to 0', () => {
      expect(normalizeDimensions(-5, 10)).toEqual({ widthMm: 0, heightMm: 10 });
    });
  });

  describe('isStripeCase', () => {
    it('ratio 1:1, type stripe → NOT stripe (circle/oval path)', () => {
      expect(isStripeCase('stripe', 10, 10)).toBe(false);
      expect(isStripeCase('strip', 100, 100)).toBe(false);
    });
    it('accepts shape strip (from applyDamagePreset preset.group=stripe)', () => {
      expect(isStripeCase('strip', 180, 20)).toBe(true);
      expect(isStripeCase('strip', 300, 40)).toBe(true);
    });
    it('stripe 30×4 (ratio 7.5) → stripe', () => {
      expect(isStripeCase('stripe', 30, 4)).toBe(true);
      expect(isStripeCase('strip', 300, 40)).toBe(true);
    });
    it('oval type → NOT stripe regardless of ratio', () => {
      expect(isStripeCase('oval', 30, 4)).toBe(false);
      expect(isStripeCase('circle', 30, 4)).toBe(false);
    });
    it('zero dimensions → NOT stripe', () => {
      expect(isStripeCase('stripe', 0, 0)).toBe(false);
      expect(isStripeCase('strip', 10, 0)).toBe(false);
    });
  });

  describe('Quick vs Detail consistency (same input => same total)', () => {
    it('120×300 circle with identical coefficients produces same total', () => {
      const widthMm = 120;
      const heightMm = 300;
      const shape = 'circle';

      // Quick path: calculateDentPrice from adapter
      const ctx = {
        sizesWithArea: circleSizesWithArea,
        prices,
        initialData,
        roundStep: 100,
      };
      const quickResult = calculateDentPrice(
        { shape, widthMm, heightMm, conditions },
        ctx
      );

      // Detail path: normalizeGraphicsDentsForPricing -> calcTotalPrice
      const graphicsDent = {
        type: 'circle',
        bboxMm: { width: widthMm, height: heightMm },
      };
      const ctxDetail = {
        circleSizes: circleSizesWithArea,
        stripSizes: stripSizesWithArea,
        prices,
        initialData,
      };
      const normalized = normalizeGraphicsDentsForPricing([graphicsDent], ctxDetail);
      const detailTotal = calcTotalPrice(normalized, conditions, initialData, 100);

      expect(quickResult.total).toBe(detailTotal);
    });

    it('strip 80×10 with identical coefficients produces same total', () => {
      const widthMm = 80;
      const heightMm = 10;
      const shape = 'strip';

      const ctx = {
        sizesWithArea: stripSizesWithArea,
        circleSizesWithArea,
        stripSizesWithArea,
        prices,
        initialData,
        roundStep: 100,
      };
      const quickResult = calculateDentPrice(
        { shape, widthMm, heightMm, conditions },
        ctx
      );

      const graphicsDent = {
        type: 'strip',
        bboxMm: { width: widthMm, height: heightMm },
      };
      const ctxDetail = {
        circleSizes: circleSizesWithArea,
        stripSizes: stripSizesWithArea,
        prices,
        initialData,
        conditions,
      };
      const normalized = normalizeGraphicsDentsForPricing([graphicsDent], ctxDetail);
      const detailTotal = calcTotalPrice(normalized, conditions, initialData, 100);

      expect(quickResult.total).toBe(detailTotal);
    });

    it('freeform bbox maps to circle pricing (oval path, no area-based price influence)', () => {
      const widthMm = 90;
      const heightMm = 90;

      const graphicsDent = {
        type: 'freeform',
        bboxMm: { width: widthMm, height: heightMm },
      };
      const ctxDetail = {
        circleSizes: circleSizesWithArea,
        stripSizes: stripSizesWithArea,
        prices,
        initialData,
      };
      const normalized = normalizeGraphicsDentsForPricing([graphicsDent], ctxDetail);
      expect(normalized.length).toBe(1);
      expect(normalized[0].price).toBeGreaterThan(0);
      expect(normalized[0].sizeCode).toBeDefined();

      const circleResult = calculateDentPrice(
        { shape: 'circle', widthMm, heightMm, conditions },
        {
          sizesWithArea: circleSizesWithArea,
          prices,
          initialData,
          roundStep: 100,
        }
      );
      expect(normalized[0].price).toBe(circleResult.base);
    });

    it('circle 90×30 (R=3) uses circle/oval pricing, NOT stripe tables', () => {
      const widthMm = 90;
      const heightMm = 30;
      const shape = 'circle';

      const ctx = {
        sizesWithArea: circleSizesWithArea,
        circleSizesWithArea,
        stripSizesWithArea,
        prices,
        initialData,
        roundStep: 100,
      };
      const circleResult = calculateDentPrice(
        { shape, widthMm, heightMm, conditions },
        ctx
      );
      expect(circleResult.base).toBeGreaterThan(0);
      expect(circleResult.sizeCode).not.toMatch(/^STRIPE_/);
    });

    it('stripe preset L18 (180×20) with shape strip uses stripe tables', () => {
      const preset = STRIPE_PRESETS.find((p) => p.widthMm === 180 && p.heightMm === 20);
      expect(preset).toBeDefined();
      expect(preset.group).toBe('stripe');
      const shape = preset.group === 'stripe' ? 'strip' : 'circle';
      expect(shape).toBe('strip');

      const base = calculateDentBasePrice(
        shape,
        preset.widthMm,
        preset.heightMm,
        stripSizesWithArea,
        prices,
        { conditions, initialData }
      );
      expect(base).toBe(15000);
    });

    it('strip 10×10 (ratio 1:1) uses circle/oval pricing, not stripe tables', () => {
      const widthMm = 10;
      const heightMm = 10;
      const shape = 'strip';

      const ctx = {
        sizesWithArea: stripSizesWithArea,
        circleSizesWithArea,
        stripSizesWithArea,
        prices,
        initialData,
        roundStep: 100,
      };
      const stripResult = calculateDentPrice(
        { shape, widthMm, heightMm, conditions },
        ctx
      );

      const circleResult = calculateDentPrice(
        { shape: 'circle', widthMm, heightMm, conditions },
        { ...ctx, sizesWithArea: circleSizesWithArea }
      );

      expect(stripResult.base).toBe(circleResult.base);
      expect(stripResult.total).toBe(circleResult.total);
    });
  });

  describe('getShapeDisplayLabel', () => {
    it('ratio 1:1 → always Круг', () => {
      expect(getShapeDisplayLabel('circle', 30, 30)).toBe('Круг');
      expect(getShapeDisplayLabel('strip', 100, 100)).toBe('Круг');
    });
    it('strip type + ratio>1 → Полоса', () => {
      expect(getShapeDisplayLabel('strip', 180, 20)).toBe('Полоса');
      expect(getShapeDisplayLabel('stripe', 80, 10)).toBe('Полоса');
    });
    it('circle/oval type + ratio>1 → Овал', () => {
      expect(getShapeDisplayLabel('circle', 90, 30)).toBe('Овал');
      expect(getShapeDisplayLabel('circle', 45, 60)).toBe('Овал');
    });
    it('zero dimensions → —', () => {
      expect(getShapeDisplayLabel('circle', 0, 0)).toBe('—');
      expect(getShapeDisplayLabel('strip', 10, 0)).toBe('—');
    });
  });

  describe('isRatioOneToOne', () => {
    it('10×10 → true', () => {
      expect(isRatioOneToOne(10, 10)).toBe(true);
    });
    it('100×100 → true', () => {
      expect(isRatioOneToOne(100, 100)).toBe(true);
    });
    it('10.001×10 → true (within epsilon)', () => {
      expect(isRatioOneToOne(10.001, 10)).toBe(true);
    });
    it('30×10 → false', () => {
      expect(isRatioOneToOne(30, 10)).toBe(false);
    });
    it('90×30 → false', () => {
      expect(isRatioOneToOne(90, 30)).toBe(false);
    });
  });
});
