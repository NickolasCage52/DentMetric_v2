/**
 * Preset sizes for Quick mode "ПРЕСЕТЫ" modal.
 * Reuses dimensions from dentSizes; display labels from initialData (or dentSizes fallback).
 */

import { circleSizesMm, stripSizesMm } from './dentSizes';
import { initialData } from './initialData';

/** @typedef {{ id: string, label: string, group: 'round_oval' | 'stripe', widthMm: number, heightMm: number }} SizePreset */

/** Round/oval presets: С монету … Два мяча */
const roundLabelsByCode = Object.fromEntries(
  (initialData.circleSizes || []).map((s) => [s.code, s.name || ''])
);

/** Stripe presets: Спичечный коробок … Весь элемент */
const stripLabelsByCode = Object.fromEntries(
  (initialData.stripSizes || []).map((s) => [s.code, s.name || ''])
);

/** @type {SizePreset[]} */
export const ROUND_OVAL_PRESETS = circleSizesMm.map((s) => ({
  id: s.code,
  label: roundLabelsByCode[s.code] || s.name || s.code,
  group: 'round_oval',
  widthMm: s.mm.w,
  heightMm: s.mm.h
}));

/** @type {SizePreset[]} */
export const STRIPE_PRESETS = stripSizesMm.map((s) => ({
  id: s.code,
  label: stripLabelsByCode[s.code] || s.name || s.code,
  group: 'stripe',
  widthMm: s.mm.w,
  heightMm: s.mm.h
}));

/** All presets for lookup by id */
export const PRESET_BY_ID = Object.fromEntries(
  [...ROUND_OVAL_PRESETS, ...STRIPE_PRESETS].map((p) => [p.id, p])
);
