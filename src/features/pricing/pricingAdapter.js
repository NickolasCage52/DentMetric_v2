/**
 * Shared pricing adapter — единый источник для расчёта цен.
 * Используется режимами СТАНДАРТ/Быстрый и Детализация.
 * Формулы и таблицы коэффициентов НЕ изменяются — только унификация входа и выхода.
 */
import { getBasePriceByMm, getSizeCodeForMatrix } from '../../utils/priceAdapter';
import { applyConditionsToBase, buildBreakdown, roundPrice } from '../../utils/priceCalc';
import { getArmaturnayaTotalPrice } from '../../data/armaturnayaWorks';

/** Округление размеров в мм до 1 знака для консистентности */
const MM_ROUND = 1;

/**
 * Нормализует размеры вмятины (мм).
 * Контракт: widthMm, heightMm — положительные числа, округлённые.
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {{ widthMm: number, heightMm: number }}
 */
export function normalizeDimensions(widthMm, heightMm) {
  const w = Math.max(0, Number(widthMm) || 0);
  const h = Math.max(0, Number(heightMm) || 0);
  return {
    widthMm: Math.round(w * Math.pow(10, MM_ROUND)) / Math.pow(10, MM_ROUND),
    heightMm: Math.round(h * Math.pow(10, MM_ROUND)) / Math.pow(10, MM_ROUND)
  };
}

/**
 * Вычисляет базовую цену одной вмятины по размерам в мм.
 * @param {string} shape - 'circle' | 'strip' | 'freeform' (freeform → circle по bounding box)
 * @param {number} widthMm
 * @param {number} heightMm
 * @param {Array} sizesWithArea - circleSizesWithArea или stripSizesWithArea
 * @param {Object} prices - userSettings.prices
 * @returns {number} базовая цена
 */
export function calculateDentBasePrice(shape, widthMm, heightMm, sizesWithArea, prices) {
  const { widthMm: w, heightMm: h } = normalizeDimensions(widthMm, heightMm);
  if (w <= 0 || h <= 0) return 0;
  const type = shape === 'freeform' ? 'circle' : (shape === 'strip' ? 'strip' : 'circle');
  return getBasePriceByMm(type, w, h, sizesWithArea, prices);
}

/**
 * Получает sizeCode для матрицы сложности.
 * @param {string} shape
 * @param {number} widthMm
 * @param {number} heightMm
 * @param {Array} sizesWithArea
 * @returns {string}
 */
export function getSizeCodeForConditions(shape, widthMm, heightMm, sizesWithArea) {
  const { widthMm: w, heightMm: h } = normalizeDimensions(widthMm, heightMm);
  const type = shape === 'freeform' ? 'circle' : (shape === 'strip' ? 'strip' : 'circle');
  return getSizeCodeForMatrix(type, w, h, sizesWithArea);
}

/**
 * Расчёт итоговой цены одной вмятины с коэффициентами.
 * @param {Object} input - { shape, widthMm, heightMm, conditions, panelElement? }
 * @param {Object} context - { sizesWithArea, prices, initialData, roundStep }
 * @returns {{ base: number, total: number, breakdown: Array, sizeCode: string }}
 */
export function calculateDentPrice(input, context) {
  const { shape, widthMm, heightMm, conditions, panelElement } = input;
  const { sizesWithArea, prices, initialData, roundStep = 0 } = context;
  const conditionsWithCost = { ...conditions };
  if (conditions.disassemblyCodes && Array.isArray(conditions.disassemblyCodes)) {
    conditionsWithCost.disassemblyCost = getArmaturnayaTotalPrice(
      conditions.disassemblyCodes,
      panelElement
    );
  }
  const { widthMm: w, heightMm: h } = normalizeDimensions(widthMm, heightMm);
  if (w <= 0 || h <= 0) {
    return { base: 0, total: 0, breakdown: [], sizeCode: 'STRIP_DEFAULT' };
  }
  const type = shape === 'freeform' ? 'circle' : (shape === 'strip' ? 'strip' : 'circle');
  const base = getBasePriceByMm(type, w, h, sizesWithArea, prices);
  const sizeCode = getSizeCodeForMatrix(type, w, h, sizesWithArea);
  const total = base > 0 && (conditions.repairCode && conditions.riskCode && conditions.materialCode && conditions.carClassCode && (conditions.disassemblyCode || conditions.disassemblyCodes?.length || typeof conditions.disassemblyCost === 'number'))
    ? applyConditionsToBase(base, conditionsWithCost, initialData, sizeCode, roundStep)
    : 0;
  const breakdown = base > 0 && (conditions.repairCode && conditions.riskCode && conditions.materialCode && conditions.carClassCode && (conditions.disassemblyCode || conditions.disassemblyCodes?.length || typeof conditions.disassemblyCost === 'number'))
    ? buildBreakdown(base, conditionsWithCost, initialData, sizeCode)
    : [];
  return { base, total, breakdown, sizeCode };
}

/**
 * Нормализует вмятины из режима Графика для расчёта.
 * Пересчитывает base price через адаптер (bboxMm → adapter), чтобы устранить расхождения с Quick.
 * Полоса (strip): использует реальные bboxMm (w×h), stripSizesWithArea и userSettings.prices — формулы/таблицы заказчика не меняются.
 *
 * @param {Array} dents - из konvaEditor (с price, bboxMm, type, sizeCode)
 * @param {Object} context - { circleSizes, stripSizes, prices, initialData }
 * @returns {Array} денты с price и sizeCode от адаптера
 */
export function normalizeGraphicsDentsForPricing(dents, context) {
  if (!dents || !Array.isArray(dents)) return [];
  const { circleSizes, stripSizes, prices, initialData } = context;
  return dents.map((d) => {
    const bbox = d.bboxMm || {};
    const w = Number(bbox.width) || 0;
    const h = Number(bbox.height) || 0;
    const type = d.type === 'freeform' ? 'circle' : (d.type || 'circle');
    const shape = type === 'strip' ? 'strip' : 'circle';
    const sizes = shape === 'circle' ? circleSizes : stripSizes;
    if (w <= 0 || h <= 0) return d;
    const base = calculateDentBasePrice(shape, w, h, sizes, prices);
    const sizeCode = getSizeCodeForConditions(shape, w, h, sizes);
    return { ...d, price: base, sizeCode };
  });
}

/**
 * Сравнение двух расчётов (dev-only). Для отладки консистентности.
 */
export function comparePricingDev(label, inputA, inputB, resultA, resultB) {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return;
  const match = Math.abs((resultA || 0) - (resultB || 0)) < 1;
  if (!match) {
    console.warn(`[pricingAdapter] ${label} mismatch:`, {
      inputA,
      inputB,
      resultA,
      resultB
    });
  } else {
    console.log(`[pricingAdapter] ${label} OK:`, resultA);
  }
}
