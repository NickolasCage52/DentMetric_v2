import { describe, it, expect } from 'vitest';
import { formatRepairTime } from '../src/utils/formatRepairTime';

describe('formatRepairTime', () => {
  it('formats hours and minutes', () => {
    expect(formatRepairTime(2.88)).toBe('2 ч 53 мин');
  });
  it('omits minutes when zero', () => {
    expect(formatRepairTime(3)).toBe('3 ч');
  });
  it('minutes only when under 1 hour', () => {
    expect(formatRepairTime(0.5)).toBe('30 мин');
  });
});
