/**
 * Unit tests for stripe ("Полоса/Царапина") price calculation — stripeCalc adapter.
 */
import { describe, it, expect } from 'vitest';
import { calculateStripePrice } from '../src/utils/stripeCalc';

describe('calculateStripePrice', () => {
  describe('exact table hits at h=2', () => {
    it('h=2, L=8 → base=5000', () => {
      expect(calculateStripePrice({ lengthCm: 8, heightCm: 2, coeffClass: 'base' }).price).toBe(5000);
    });
    it('h=2, L=8 → k2=6500', () => {
      expect(calculateStripePrice({ lengthCm: 8, heightCm: 2, coeffClass: 'k2' }).price).toBe(6500);
    });
    it('h=2, L=8 → k3=8500', () => {
      expect(calculateStripePrice({ lengthCm: 8, heightCm: 2, coeffClass: 'k3' }).price).toBe(8500);
    });
    it('h=2, L=8 → k4=11000', () => {
      expect(calculateStripePrice({ lengthCm: 8, heightCm: 2, coeffClass: 'k4' }).price).toBe(11000);
    });
    it('h=2, L=18 → base=11000', () => {
      expect(calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'base' }).price).toBe(11000);
    });
    it('h=2, L=18 → k2=15000', () => {
      expect(calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'k2' }).price).toBe(15000);
    });
    it('h=2, L=100 → base=28000', () => {
      expect(calculateStripePrice({ lengthCm: 100, heightCm: 2, coeffClass: 'base' }).price).toBe(28000);
    });
  });

  describe('interpolation', () => {
    it('h=2, L=10 → base between 6000 and 11000', () => {
      const { price } = calculateStripePrice({ lengthCm: 10, heightCm: 2, coeffClass: 'base' });
      expect(price).toBeGreaterThanOrEqual(6000);
      expect(price).toBeLessThanOrEqual(11000);
    });
  });

  describe('height scaling h=2..4', () => {
    it('h=4, L=18 → price > h=2', () => {
      const p2 = calculateStripePrice({ lengthCm: 18, heightCm: 2, coeffClass: 'base' }).price;
      const p4 = calculateStripePrice({ lengthCm: 18, heightCm: 4, coeffClass: 'base' }).price;
      expect(p4).toBeGreaterThan(p2);
    });
  });

  describe('boundaries', () => {
    it('h=2, L=2 → same as L=8 base (clamped)', () => {
      const pShort = calculateStripePrice({ lengthCm: 2, heightCm: 2, coeffClass: 'base' }).price;
      const pMin = calculateStripePrice({ lengthCm: 8, heightCm: 2, coeffClass: 'base' }).price;
      expect(pShort).toBe(pMin);
    });
    it('h=2, L=150 → same as L=100 base (clamped)', () => {
      const pLong = calculateStripePrice({ lengthCm: 150, heightCm: 2, coeffClass: 'base' }).price;
      const pMax = calculateStripePrice({ lengthCm: 100, heightCm: 2, coeffClass: 'base' }).price;
      expect(pLong).toBe(pMax);
    });
  });

  describe('BUG FIX: len=12, h=4', () => {
    it('len=12, h=4, k3 (высокая) ≤ 15000', () => {
      const p = calculateStripePrice({ lengthCm: 12, heightCm: 4, coeffClass: 'k3' }).price;
      expect(p).toBeLessThanOrEqual(15000);
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
      expect(pK1).toBe(pBase);
    });
  });
});
