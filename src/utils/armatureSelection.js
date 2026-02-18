export const ARMATURE_NONE_CODE = 'Z0';

/**
 * Normalizes selected work codes to a stable invariant:
 * - Either [ARMATURE_NONE_CODE] OR [code1, code2, ...] (no NONE together with others)
 * - Never returns an empty array (empty becomes [NONE])
 * @param {string[]|any} ids
 * @returns {string[]}
 */
export function normalizeArmatureWorkIds(ids) {
  const arr = Array.isArray(ids) ? ids.filter(Boolean).map(String) : [];
  const unique = [...new Set(arr)];
  if (unique.length === 0) return [ARMATURE_NONE_CODE];
  if (unique.includes(ARMATURE_NONE_CODE) && unique.length > 1) {
    return unique.filter((x) => x !== ARMATURE_NONE_CODE);
  }
  return unique;
}

/**
 * Pure toggle function for multi-select armature works.
 *
 * Rules:
 * - Toggle NONE: clear others, return [NONE]
 * - Toggle real item: remove NONE if present, toggle item in/out
 * - If result becomes empty: return [NONE]
 *
 * @param {string[]|any} selectedIds
 * @param {string|any} toggledId
 * @returns {string[]}
 */
export function toggleArmatureWorkIds(selectedIds, toggledId) {
  const id = toggledId == null ? '' : String(toggledId);
  const cur = normalizeArmatureWorkIds(selectedIds);

  if (!id) return cur;
  if (id === ARMATURE_NONE_CODE) return [ARMATURE_NONE_CODE];

  const withoutNone = cur.filter((x) => x !== ARMATURE_NONE_CODE);
  const has = withoutNone.includes(id);
  const next = has ? withoutNone.filter((x) => x !== id) : [...withoutNone, id];
  return next.length === 0 ? [ARMATURE_NONE_CODE] : next;
}

