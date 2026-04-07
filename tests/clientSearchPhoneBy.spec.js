import { describe, it, expect } from 'vitest';
import { normalizePhone, searchClientByPhone } from '../src/utils/clientSearch';

describe('clientSearch BY phone', () => {
  it('normalizePhone BY collapses to 375 + 9 digits', () => {
    expect(normalizePhone('+375 29 123-45-67', 'BY')).toBe('375291234567');
    expect(normalizePhone('80291111111', 'BY')).toMatch(/^375/);
  });

  it('searchClientByPhone matches BY record with BY query', () => {
    const records = [
      {
        id: '1',
        client: { phone: '+375 29 111-22-33', name: 'A' },
        recordCountry: 'BY',
      },
    ];
    const { exact } = searchClientByPhone('375291112233', records, 'BY');
    expect(exact.length).toBe(1);
  });
});
