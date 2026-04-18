import { describe, it, expect } from 'vitest';
import { buildShareText, SHARE_CLIPBOARD_SUCCESS } from '../src/utils/shareEstimate';

describe('shareEstimate', () => {
  it('buildShareText includes client greeting and total', () => {
    const text = buildShareText({
      client: { name: 'Иван', phone: '+7 900 000-00-00', brand: 'Toyota', model: 'Camry' },
      total: 15000,
      currency: 'RUB',
      dents: [{ panelElement: 'Дверь', total: 15000 }],
      repairTimeHours: 1.5,
      masterName: 'Пётр',
    });
    expect(text).toContain('Иван, добрый день!');
    expect(text).toContain('Toyota Camry');
    expect(text).toContain('Повреждений: 1');
    expect(text).toContain('Итого:');
    expect(text).toContain('15');
    expect(text).toContain('Мастер: Пётр');
  });

  it('exports clipboard success token', () => {
    expect(SHARE_CLIPBOARD_SUCCESS).toBe('CLIPBOARD_SUCCESS');
  });
});
