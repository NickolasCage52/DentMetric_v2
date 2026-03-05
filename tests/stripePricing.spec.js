/**
 * Unit tests for stripe pricing ("Полоса/Царапина") — stripePricing.ts
 */
import { describe, it, expect } from 'vitest';
import { getStripePrice } from '../src/pricing/stripePricing';

describe('getStripePrice', () => {
  describe('exact table hits h=2', () => {
    test.each([
      [8, 'легкая', 5000],
      [8, 'средняя', 6500],
      [8, 'высокая', 8500],
      [8, 'экстра', 11000],
      [12, 'легкая', 7000],
      [12, 'средняя', 9500],
      [12, 'высокая', 12000],
      [12, 'экстра', 15500],
      [15, 'легкая', 9000],
      [15, 'средняя', 12000],
      [15, 'высокая', 15500],
      [15, 'экстра', 20000],
      [20, 'легкая', 12000],
      [40, 'высокая', 28000],
      [100, 'экстра', 61500]
    ])('h=2: len=%d, sev=%s → %d ₽', (len, sev, expected) => {
      expect(getStripePrice({ lengthCm: len, heightCm: 2, severity: sev })).toBe(expected);
    });
  });

  describe('exact table hits h=4', () => {
    test.each([
      [15, 'легкая', 11000],
      [15, 'средняя', 12000],
      [15, 'высокая', 15000],
      [15, 'экстра', 18000],
      [20, 'легкая', 15000],
      [20, 'высокая', 20500],
      [50, 'средняя', 24500],
      [100, 'экстра', 57000]
    ])('h=4: len=%d, sev=%s → %d ₽', (len, sev, expected) => {
      expect(getStripePrice({ lengthCm: len, heightCm: 4, severity: sev })).toBe(expected);
    });
  });

  describe('BUG FIX: len=12, h=4 must not explode', () => {
    it('len=12, h=4, высокая ≤ 15000', () => {
      const p = getStripePrice({ lengthCm: 12, heightCm: 4, severity: 'высокая' });
      expect(p).toBeLessThanOrEqual(15000);
      expect(p).toBeGreaterThan(0);
    });
    it('len=12, h=4, легкая ≤ 11000', () => {
      const p = getStripePrice({ lengthCm: 12, heightCm: 4, severity: 'легкая' });
      expect(p).toBeLessThanOrEqual(11000);
    });
  });

  describe('interpolation by length', () => {
    it('h=2, len=16 between 15 and 18', () => {
      const p = getStripePrice({ lengthCm: 16, heightCm: 2, severity: 'легкая' });
      expect(p).toBeGreaterThan(9000);
      expect(p).toBeLessThan(11000);
    });
    it('h=4, len=16 between 15 and 18', () => {
      const p = getStripePrice({ lengthCm: 16, heightCm: 4, severity: 'легкая' });
      expect(p).toBeGreaterThan(11000);
      expect(p).toBeLessThan(14000);
    });
  });

  describe('interpolation by height', () => {
    it('h=3 between h=2 and h=4', () => {
      const p2 = getStripePrice({ lengthCm: 20, heightCm: 2, severity: 'средняя' });
      const p4 = getStripePrice({ lengthCm: 20, heightCm: 4, severity: 'средняя' });
      const p3 = getStripePrice({ lengthCm: 20, heightCm: 3, severity: 'средняя' });
      expect(p3).toBeGreaterThan(p2);
      expect(p3).toBeLessThan(p4);
      expect(p3).toBeCloseTo((p2 + p4) / 2, -2);
    });
  });

  describe('clamp boundaries', () => {
    it('height < 2 → as h=2', () => {
      expect(getStripePrice({ lengthCm: 20, heightCm: 1, severity: 'легкая' })).toBe(
        getStripePrice({ lengthCm: 20, heightCm: 2, severity: 'легкая' })
      );
    });
    it('height > 4 → as h=4', () => {
      expect(getStripePrice({ lengthCm: 20, heightCm: 6, severity: 'легкая' })).toBe(
        getStripePrice({ lengthCm: 20, heightCm: 4, severity: 'легкая' })
      );
    });
    it('length < 8 at h=2 → as len=8', () => {
      expect(getStripePrice({ lengthCm: 5, heightCm: 2, severity: 'легкая' })).toBe(
        getStripePrice({ lengthCm: 8, heightCm: 2, severity: 'легкая' })
      );
    });
    it('length > 100 → as len=100', () => {
      expect(getStripePrice({ lengthCm: 150, heightCm: 2, severity: 'экстра' })).toBe(
        getStripePrice({ lengthCm: 100, heightCm: 2, severity: 'экстра' })
      );
    });
  });

  describe('monotonicity', () => {
    it('longer length → higher price', () => {
      const lengths = [8, 12, 20, 40, 80, 100];
      const prices = lengths.map((l) =>
        getStripePrice({ lengthCm: l, heightCm: 2, severity: 'высокая' })
      );
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });
    it('h=4 ≥ h=2 for len >= 15', () => {
      const p2 = getStripePrice({ lengthCm: 30, heightCm: 2, severity: 'средняя' });
      const p4 = getStripePrice({ lengthCm: 30, heightCm: 4, severity: 'средняя' });
      expect(p4).toBeGreaterThanOrEqual(p2);
    });
  });
});
