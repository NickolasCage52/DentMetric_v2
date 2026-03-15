/**
 * Нормализация телефона для ввода/отображения.
 * Поддержка старых форматов из истории: 89221661368, 8 922 166 13 68, +7...
 */

const DIGITS_ONLY = /\D/g;

/** Извлечь только цифры из строки */
export function digitsOnly(str: string | number | null | undefined): string {
  if (str == null) return '';
  return String(str).replace(DIGITS_ONLY, '');
}

/**
 * Нормализовать телефон в формат +7XXXXXXXXXX (10 цифр после +7).
 * Совместимо с историей: 8..., +7..., 7... → +79XXXXXXXXX
 */
export function normalizePhoneToStorage(phone: string | number | null | undefined): string {
  const d = digitsOnly(phone);
  if (d.length === 0) return '';
  // 11 цифр: 7 + 10 или 8 + 10
  if (d.startsWith('7') && d.length >= 11) {
    return '+' + d.slice(0, 11);
  }
  if (d.startsWith('8') && d.length >= 11) {
    return '+7' + d.slice(1, 11);
  }
  if (d.length >= 10) {
    return '+7' + d.slice(-10);
  }
  return '+7' + d;
}

/**
 * Для отображения в поле ввода: привести к +7XXXXXXXXXX.
 * История может хранить 89221661368 — конвертируем для маски.
 */
export function normalizePhoneForInput(phone: string | number | null | undefined): string {
  const normalized = normalizePhoneToStorage(phone);
  if (normalized.length === 0) return '+7';
  return normalized;
}
