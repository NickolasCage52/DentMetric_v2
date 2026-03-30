/**
 * Кузовные группы для арматурных работ (PR-15 — данные для будущего accordion UI).
 * @type {{ id: string, label: string }[]}
 */
export const BODY_ELEMENTS = [
  { id: 'door_front', label: 'Дверь передняя' },
  { id: 'door_rear', label: 'Дверь задняя' },
  { id: 'fender_front', label: 'Крыло переднее' },
  { id: 'fender_rear', label: 'Крыло заднее' },
  { id: 'hood', label: 'Капот' },
  { id: 'roof', label: 'Крыша' },
  { id: 'trunk', label: 'Багажник' },
  { id: 'sill', label: 'Порог' },
  { id: 'other', label: 'Прочее' }
];

export function normalizeArmatureBodyElement(raw) {
  if (raw == null || raw === '') return 'other';
  const s = String(raw);
  const ok = BODY_ELEMENTS.some((b) => b.id === s);
  return ok ? s : 'other';
}
