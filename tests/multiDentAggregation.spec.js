/**
 * Unit tests for multi-dent aggregation (2nd+ dent discount).
 */
import { describe, it, expect } from 'vitest';
import { calculateSessionTotalWithMultiDentRule } from '../src/utils/multiDentAggregation';

describe('calculateSessionTotalWithMultiDentRule', () => {
  it('single dent: no discount applied', () => {
    const r = calculateSessionTotalWithMultiDentRule([1000], {});
    expect(r.total).toBe(1000);
    expect(r.weightedTotals).toEqual([1000]);
  });

  it('two equal dents, default 50%: 100+100 -> 150', () => {
    const r = calculateSessionTotalWithMultiDentRule([100, 100], {});
    expect(r.total).toBe(150);
    expect(r.factorForSecond).toBe(0.5);
  });

  it('two dents, custom 25%: 100+100 -> 175', () => {
    const r = calculateSessionTotalWithMultiDentRule([100, 100], {
      enableSecondDentDiscount: true,
      secondDentDiscountPercent: 25
    });
    expect(r.total).toBe(175);
    expect(r.factorForSecond).toBe(0.75);
  });

  it('three dents, default: max 100%, others 50%', () => {
    const r = calculateSessionTotalWithMultiDentRule([100, 200, 50], {});
    expect(r.total).toBe(200 + 50 + 25);
    expect(r.total).toBe(275);
  });

  it('empty array returns zero', () => {
    const r = calculateSessionTotalWithMultiDentRule([], {});
    expect(r.total).toBe(0);
    expect(r.weightedTotals).toEqual([]);
  });

  it('filters non-finite values', () => {
    const r = calculateSessionTotalWithMultiDentRule([100, NaN, 100], {});
    expect(r.total).toBe(150);
  });
});
