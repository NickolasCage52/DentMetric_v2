/**
 * Unit tests for pricing adapter consistency.
 * Quick and Detail adapters must produce identical totals for same normalized input.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateDentPrice,
  normalizeDimensions,
  normalizeGraphicsDentsForPricing,
} from '../src/features/pricing/pricingAdapter';
import { calcTotalPrice, roundPrice } from '../src/utils/priceCalc';
import { initialData } from '../src/data/initialData';
import { circleSizesWithArea, stripSizesWithArea } from '../src/data/dentSizes';

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
  });
});
