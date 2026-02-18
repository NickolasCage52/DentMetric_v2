/**
 * Unit tests for shape classification by width/height ratio.
 * L = max(w,h), H = min(w,h), r = L/H
 * Boundaries:
 * - 1.00 ≤ r < 1.40 → round
 * - 1.40 ≤ r < 3.00 → oval
 * - 3.00 ≤ r ≤ 6.00 → oval_long
 * - r > 6.00 → stripe
 */
import { describe, it, expect } from 'vitest';
import { classifyDamageShapeByRatio, classifyShapeByRatio } from '../src/utils/shapeClassification';

describe('classifyShapeByRatio', () => {
  describe('task examples', () => {
    it('120×300 (r=2.5) → oval (NOT stripe)', () => {
      expect(classifyDamageShapeByRatio(120, 300)).toBe('oval');
      expect(classifyShapeByRatio({ widthMm: 120, heightMm: 300 })).toBe('oval');
    });
    it('200×20 (r=10) → stripe', () => {
      expect(classifyDamageShapeByRatio(200, 20)).toBe('stripe');
    });
    it('180×85 (r≈2.12) → oval', () => {
      expect(classifyDamageShapeByRatio(180, 85)).toBe('oval');
    });
    it('30×10 (r=3) → oval_long', () => {
      expect(classifyDamageShapeByRatio(30, 10)).toBe('oval_long');
    });
    it('600×100 (r=6 exactly) → oval_long (stripe is strictly > 6)', () => {
      expect(classifyDamageShapeByRatio(600, 100)).toBe('oval_long');
    });
  });

  describe('round (1.00 ≤ r < 1.40)', () => {
    it('square 30×30 → round', () => expect(classifyDamageShapeByRatio(30, 30)).toBe('round'));
    it('r=1.39 → round', () => expect(classifyDamageShapeByRatio(139, 100)).toBe('round'));
    it('r=1.40 → oval (boundary)', () => expect(classifyDamageShapeByRatio(140, 100)).toBe('oval'));
  });

  describe('oval (1.40 ≤ r < 3.00)', () => {
    it('r=1.41 → oval', () => expect(classifyDamageShapeByRatio(141, 100)).toBe('oval'));
    it('r=2.99 → oval', () => expect(classifyDamageShapeByRatio(299, 100)).toBe('oval'));
    it('r=3.00 → oval_long (boundary)', () => expect(classifyDamageShapeByRatio(300, 100)).toBe('oval_long'));
  });

  describe('oval_long (3.00 ≤ r ≤ 6.00)', () => {
    it('r=3.0 → oval_long', () => expect(classifyDamageShapeByRatio(30, 10)).toBe('oval_long'));
    it('r=5.99 → oval_long', () => expect(classifyDamageShapeByRatio(599, 100)).toBe('oval_long'));
    it('r=6.0 → oval_long', () => expect(classifyDamageShapeByRatio(600, 100)).toBe('oval_long'));
  });

  describe('stripe (r > 6.00)', () => {
    it('r=6.01 → stripe', () => expect(classifyDamageShapeByRatio(601, 100)).toBe('stripe'));
    it('reversed inputs still stripe', () => expect(classifyDamageShapeByRatio(10, 100)).toBe('stripe'));
  });

  describe('edge cases', () => {
    it('zero width → round (safe default)', () => expect(classifyDamageShapeByRatio(0, 50)).toBe('round'));
    it('zero height → round (safe default)', () => expect(classifyDamageShapeByRatio(50, 0)).toBe('round'));
    it('NaN → round', () => expect(classifyDamageShapeByRatio(Number.NaN, 10)).toBe('round'));
  });
});
