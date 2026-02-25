/**
 * Unit tests for stripe ("Полоса/Царапина") price calculation.
 */
import { describe, it, expect } from 'vitest';
import { calculateStripePrice } from '../src/utils/stripeCalc';

describe('calculateStripePrice', () => {
  describe('exact table hits at h=2', () => {
    it('h=2, L=5 → base=4000', () => {
      expect(calculateStripePrice({ lengthCm: 5, heightCm: 2, coeffClass: 'base' }).price).toBeCloseTo(4000, 0);
    });
    it('h=2, L=5 → k2=6000', () => {
      expect(calculateStripePrice({ lengthCm: 5, heightCm: 2, coeffClass: 'k2' }).price).toBeCloseTo(6000, 0);
    });
    it('h=2, L=5 → k3=9200', () => {
      expect(calculateStripePrice({ lengthCm: 5, heightCm: 2, coeffClass: 'k3' }).price).toBeCloseTo(9200, 0);
    });
    it('h=2, L=5 → k4=16000', () => {
      expect(calculateStripePrice({ lengthCm: 5, heightCm: 2, coeffClass: 'k4' }).price).toBeCloseTo(16000, 0);
    });
    it('h=2, L=18 → base=8000', () => {
      expect(calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'base' }).price).toBeCloseTo(8000, 0);
    });
    it('h=2, L=18 → k2=11040', () => {
      expect(calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'k2' }).price).toBeCloseTo(11040, 0);
    });
    it('h=2, L=100 → base=22000', () => {
      expect(calculateStripePrice({ lengthCm: 100, heightCm: 2, coeffClass: 'base' }).price).toBeCloseTo(22000, 0);
    });
  });

  describe('interpolation', () => {
    it('h=2, L=10 → base between 4000 and 8000', () => {
      const { price } = calculateStripePrice({ lengthCm: 10, heightCm: 2, coeffClass: 'base' });
      expect(price).toBeGreaterThan(4000);
      expect(price).toBeLessThan(8000);
    });
  });

  describe('sub-linear height scaling', () => {
    it('h=4, L=18 → price > h=2 but < 2x', () => {
      const p2 = calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'base' }).price;
      const p4 = calculateStripePrice({ lengthCm: 18, heightCm: 4, coeffClass: 'base' }).price;
      expect(p4).toBeGreaterThan(p2);
      expect(p4).toBeLessThan(p2 * 2);
    });
  });

  describe('boundaries', () => {
    it('h=2, L=2 → same as L=5 base (clamped)', () => {
      const pShort = calculateStripePrice({ lengthCm: 2, heightCm: 2, coeffClass: 'base' }).price;
      const pMin = calculateStripePrice({ lengthCm: 5, heightCm: 2, coeffClass: 'base' }).price;
      expect(pShort).toBeCloseTo(pMin, 0);
    });
    it('h=2, L=150 → same as L=100 base (clamped)', () => {
      const pLong = calculateStripePrice({ lengthCm: 150, heightCm: 2, coeffClass: 'base' }).price;
      const pMax = calculateStripePrice({ lengthCm: 100, heightCm: 2, coeffClass: 'base' }).price;
      expect(pLong).toBeCloseTo(pMax, 0);
    });
  });

  describe('extreme values', () => {
    it('extreme height values do not produce NaN', () => {
      const p1 = calculateStripePrice({ lengthCm: 18, heightCm: 0.1, coeffClass: 'base' }).price;
      const p2 = calculateStripePrice({ lengthCm: 18, heightCm: 100, coeffClass: 'base' }).price;
      expect(isFinite(p1)).toBe(true);
      expect(isFinite(p2)).toBe(true);
    });
  });

  describe('class key mapping', () => {
    it('K1 and base map to same column', () => {
      const pBase = calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'base' }).price;
      const pK1 = calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'K1' }).price;
      expect(pK1).toBeCloseTo(pBase, 0);
    });
  });
});
