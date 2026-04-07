/**
 * Shared pricing adapter — единый источник для расчёта цен.
 * Используется режимами СТАНДАРТ/Быстрый и Детализация.
 * Формулы и таблицы коэффициентов НЕ изменяются — только унификация входа и выхода.
 */
import { getBasePriceByMm, getSizeCodeForMatrix } from '../../utils/priceAdapter';
import { resolveDentShapeType } from '../../utils/resolveDentShapeType';
import { applyConditionsToBase, buildBreakdown, roundPrice } from '../../utils/priceCalc';
import { getArmaturnayaTotalPrice } from '../../data/armaturnayaWorks';
import { calculateStripePriceFromUserBase } from '../../utils/stripeCalc';

/** Округление размеров в мм до 1 знака для консистентности */
const MM_ROUND = 1;

/** Порог для ratio 1:1 — считаем квадратом/кругом, не полосой */
const RATIO_ONE_EPS = 0.001;

/**
 * Проверка: соотношение сторон ≈ 1:1 (квадрат/круг).
 * Используется для strip→circle fallback: если пользователь выбрал полосу, но ввёл квадратные размеры — считаем кругом.
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {boolean}
 */
export function isRatioOneToOne(widthMm, heightMm) {
  const w = Number(widthMm) || 0;
  const h = Number(heightMm) || 0;
  if (w <= 0 || h <= 0) return false;
  const L = Math.max(w, h);
  const H = Math.min(w, h);
  const ratio = H > 0 ? L / H : 1;
  return Math.abs(ratio - 1) <= RATIO_ONE_EPS;
}

/**
 * Полосный кейс: таблицы полосы применяются ТОЛЬКО когда
 * 1) пользователь явно выбрал тип "Полоса/Царапина" (strip/stripe/scratch)
 * 2) AND ratio > 1 (форма не вырождена до квадрата/круга)
 * ratio 1:1 и все не-полосные → круг/овал.
 *
 * @param {string} shapeType - 'circle' | 'strip' | 'freeform' | 'stripe' | 'scratch'
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {boolean}
 */
export function isStripeCase(shapeType, widthMm, heightMm) {
  const t = String(shapeType || '').toLowerCase();
  const isStripeType = ['strip', 'stripe', 'scratch', 'полоса', 'царапина'].some((k) => t.includes(k));
  if (!isStripeType) return false;
  const w = Number(widthMm) || 0;
  const h = Number(heightMm) || 0;
  if (w <= 0 || h <= 0) return false;
  const L = Math.max(w, h);
  const H = Math.min(w, h);
  const ratio = H > 0 ? L / H : 1;
  const isNotSquare = Math.abs(ratio - 1) > RATIO_ONE_EPS;
  return isNotSquare;
}

/**
 * Метка типа формы для отображения (Тип формы: Круг/Овал/Полоса).
 * Правила: ratio 1:1 → всегда Круг; реальная полоса (strip + ratio>1) → Полоса; остальное → Овал.
 * @param {string} shapeType - 'circle' | 'strip' | 'freeform' | 'stripe' | 'scratch'
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {'Круг' | 'Овал' | 'Полоса'}
 */
export function getShapeDisplayLabel(shapeType, widthMm, heightMm) {
  const w = Number(widthMm) || 0;
  const h = Number(heightMm) || 0;
  if (w <= 0 || h <= 0) return '—';
  if (isRatioOneToOne(w, h)) return 'Круг';
  const t = String(shapeType || '').toLowerCase();
  if (['strip', 'stripe', 'scratch'].some((k) => t.includes(k)) && isStripeCase(shapeType, w, h)) return 'Полоса';
  return 'Овал';
}

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
 * Получает coeffClass для stripe из conditions (K1→base, K2→k2, K3→k3, K4→k4).
 * @param {object} [conditions]
 * @param {object} [initialData]
 * @returns {string} 'base'|'k2'|'k3'|'k4'
 */
function getStripeCoeffClass(conditions, initialData) {
  const riskCode = conditions?.riskCode;
  if (!riskCode || !initialData?.risks) return 'base';
  const riskObj = initialData.risks.find((r) => r.code === riskCode);
  const matrixKey = riskObj?.matrixKey ?? 'K2';
  const map = { K1: 'base', K2: 'k2', K3: 'k3', K4: 'k4' };
  return map[matrixKey] ?? 'base';
}

/**
 * Вычисляет базовую цену одной вмятины по размерам в мм.
 * Для strip: интерполяция прайса из настроек (L*) × отношение сложности из stripe-таблицы
 * (текущий класс / «лёгкая»). Так цена уровня L5 из настроек совпадает с базой при лёгкой сложности,
 * без смешения с абсолютами таблицы (иначе 5000×4800/4000=6000 при каталоге L5=4000).
 * Для circle — area interpolation по userSettings.prices.
 * @param {string} shape - 'circle' | 'strip' | 'freeform'
 * @param {number} widthMm
 * @param {number} heightMm
 * @param {Array} sizesWithArea - circleSizesWithArea или stripSizesWithArea
 * @param {Object} prices - userSettings.prices
 * @param {object} [options] - { conditions, initialData }
 * @returns {number} базовая цена
 */
export function calculateDentBasePrice(shape, widthMm, heightMm, sizesWithArea, prices, options = {}) {
  const { widthMm: w, heightMm: h } = normalizeDimensions(widthMm, heightMm);
  if (w <= 0 || h <= 0) return 0;
  const type = shape === 'freeform' ? 'circle' : (shape === 'strip' ? 'strip' : 'circle');
  const useStripe = type === 'strip' && isStripeCase(shape, w, h);
  if (useStripe) {
    const lengthCm = Math.max(w, h) / 10;
    const heightCm = Math.min(w, h) / 10;
    const coeffClass = getStripeCoeffClass(options.conditions, options.initialData);
    const { price: tablePrice } = calculateStripePriceFromUserBase({ lengthCm, heightCm, coeffClass });
    const { price: refTablePrice } = calculateStripePriceFromUserBase({
      lengthCm,
      heightCm,
      coeffClass: 'base'
    });
    const userInterp = getBasePriceByMm('strip', w, h, sizesWithArea, prices);
    const refRatio = refTablePrice > 0 ? tablePrice / refTablePrice : 1;
    const u = Number.isFinite(userInterp) && userInterp >= 0 ? userInterp : 0;
    return Math.round(u * refRatio);
  }
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
  const {
    sizesWithArea,
    circleSizesWithArea,
    stripSizesWithArea,
    prices,
    initialData,
    roundStep = 0
  } = context;
  const circleSizes = circleSizesWithArea ?? sizesWithArea;
  const stripSizes = stripSizesWithArea ?? sizesWithArea;
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
  const useStripe = type === 'strip' && isStripeCase(shape, w, h);
  const effectiveShape = useStripe ? 'strip' : 'circle';
  const sizesForCalc = useStripe ? stripSizes : circleSizes;
  const baseOpts = { conditions, initialData };
  const base = useStripe
    ? calculateDentBasePrice(type, w, h, stripSizes, prices, baseOpts)
    : getBasePriceByMm(effectiveShape, w, h, circleSizes, prices);
  const sizeCode = getSizeCodeForMatrix(effectiveShape, w, h, sizesForCalc);
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
 * Полоса (strip): stripeCalc по таблице 2см, piecewise linear + sub-linear height scaling.
 *
 * @param {Array} dents - из konvaEditor (с price, bboxMm, type, sizeCode)
 * @param {Object} context - { circleSizes, stripSizes, prices, initialData, conditions? }
 * @returns {Array} денты с price и sizeCode от адаптера
 */
export function normalizeGraphicsDentsForPricing(dents, context) {
  if (!dents || !Array.isArray(dents)) return [];
  const { circleSizes, stripSizes, prices, initialData, conditions } = context;
  return dents.map((d) => {
    const bbox = d.bboxMm || {};
    const w = Number(bbox.width) || 0;
    const h = Number(bbox.height) || 0;
    const resolved = w > 0 && h > 0 ? resolveDentShapeType(w, h) : null;
    // Должно совпадать с GraphicsWizard/App: явный выбор «Полоса» важнее геометрии
    // (малые мм дают resolveDentShapeType=oval, иначе база шла бы по кругу — настройки L* не работали).
    const t = String(d?.type || '').toLowerCase();
    const wantsStrip =
      d.type !== 'freeform' && ['strip', 'stripe', 'scratch'].some((k) => t.includes(k));
    const shape =
      d.type === 'freeform' ? 'circle' : wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
    const useStripe = shape === 'strip' && isStripeCase(shape, w, h);
    const sizes = useStripe ? stripSizes : circleSizes;
    if (w <= 0 || h <= 0) return d;
    const base = calculateDentBasePrice(shape, w, h, sizes, prices, {
      conditions,
      initialData
    });
    const effectiveShape = useStripe ? 'strip' : 'circle';
    const sizeCode = getSizeCodeForConditions(effectiveShape, w, h, sizes);
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
