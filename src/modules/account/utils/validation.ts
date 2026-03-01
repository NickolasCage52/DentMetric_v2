/**
 * Валидация полей профиля (имя, телефон).
 * E.164 для телефона, минимум 2 символа для имени.
 */

export function validateName(name: string): string | null {
  if (!name || typeof name !== 'string') return 'Укажите имя'
  const trimmed = name.trim()
  if (trimmed.length < 2) return 'Имя должно содержать минимум 2 символа'
  if (trimmed.length > 100) return 'Имя слишком длинное'
  return null
}

export function validatePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return 'Укажите телефон'
  const clean = phone.replace(/[\s\-\(\)]/g, '')
  // E.164: +7XXXXXXXXXX, +380..., etc.
  const e164 = /^\+[1-9]\d{6,14}$/
  if (!e164.test(clean)) return 'Неверный формат телефона (начните с +7)'
  return null
}
