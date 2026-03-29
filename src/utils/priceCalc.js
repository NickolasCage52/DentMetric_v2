import { normalizeNumber } from './validation';
import { parseStripeMatrixKey } from '../features/pricing/stripeCoefficients';

/** Шаг округления цен: все цены кратны 100 (без десятков, единиц, копеек). */
export const PRICE_ROUND_STEP = 100;

/** Округлить цену до шага 100. */
export function roundPrice(v) {
  return Math.round((normalizeNumber(v, 0)) / PRICE_ROUND_STEP) * PRICE_ROUND_STEP;
}

/**
 * Базовая цена от массива вмятин: сумма базовых цен (каждая вмятина считается отдельно).
 * Защита от NaN/undefined в price.
 *
 * @param {Array<{ price: number }>} dents - массив вмятин с полем price
 * @returns {number} базовая сумма
 */
export function calcBasePriceFromDents(dents) {
  if (!dents || !Array.isArray(dents) || dents.length === 0) return 0;
  const total = dents.reduce((sum, dent) => sum + normalizeNumber(dent?.price, 0), 0);
  return Math.max(0, total);
}

/**
 * Расчёт цены одной вмятины по таблице коэффициентов (без разборки).
 * Порядок: basePrice *= repairType *= complexity *= material *= carClass.
 * Разборка добавляется один раз к итогу в calcTotalPrice.
 *
 * @param {{ price: number, type?: string, sizeCode?: string }} dent - вмятина (price = база, sizeCode для матрицы)
 * @param {{ repairCode, riskCode, materialCode, carClassCode, disassemblyCode }} conditions
 * @param {object} initialData
 * @returns {number}
 */
function calculateDentPrice(dent, conditions, initialData) {
  const basePrice = normalizeNumber(dent?.price, 0);
  if (basePrice <= 0) return 0;
  if (!conditions || !initialData) return basePrice;

  const repCoeff = initialData.repairTypes.find((r) => r.code === conditions.repairCode)?.mult ?? 1.0;
  const matCoeff = initialData.materials.find((m) => m.code === conditions.materialCode)?.mult ?? 1.0;
  const carClassCoeff = initialData.carClasses.find((c) => c.code === conditions.carClassCode)?.mult ?? 1.0;
  const paintCoeff = conditions.paintMaterialCode
    ? (initialData.paintMaterials?.find((p) => p.code === conditions.paintMaterialCode)?.mult ?? 1.0)
    : 1.0;
  const riskObj = initialData.risks.find((r) => r.code === conditions.riskCode);
  const kKey = riskObj ? riskObj.matrixKey : 'K2';
  const sizeCode = dent?.sizeCode ?? (dent?.type === 'circle' ? 'S2' : 'STRIP_DEFAULT');
  const compCoeff = getComplexityCoeff(initialData, kKey, sizeCode, dent);

  let price = basePrice;
  price *= repCoeff;
  price *= compCoeff;
  price *= matCoeff;
  price *= carClassCoeff;
  price *= paintCoeff;
  return Math.max(0, price);
}

/**
 * Returns complexity coefficient (K1..K4) for a given sizeCodeForMatrix.
 * Stripe ("Полоса/Царапина"): base price from stripeCalc already includes K level → return 1.0.
 * Circle/oval: use complexityMatrix.
 *
 * @param {object} initialData
 * @param {'K1'|'K2'|'K3'|'K4'} kKey
 * @param {string} sizeCodeForMatrix
 * @param {any} [dent] - optional dent object (unused for stripe)
 * @returns {number}
 */
export function getComplexityCoeff(initialData, kKey, sizeCodeForMatrix, dent) {
  const parsed = parseStripeMatrixKey(sizeCodeForMatrix);
  if (parsed) {
    return 1.0;
  }
  if (dent?.type === 'strip' && dent?.bboxMm) {
    return 1.0;
  }
  const matrixRow =
    initialData.complexityMatrix?.[sizeCodeForMatrix] ??
    initialData.complexityMatrix?.['STRIP_DEFAULT'] ??
    { [kKey]: 1.0 };
  return matrixRow[kKey] ?? 1.0;
}

/**
 * Итоговая цена: каждая вмятина считается отдельно, затем суммируется.
 * Единый источник истины для режима Графика (HUD, Итого, MainButton).
 *
 * @param {Array<{ price: number, type?: string, sizeCode?: string }>} dents - массив вмятин
 * @param {{ repairCode, riskCode, materialCode, carClassCode, disassemblyCode }} conditions - условия
 * @param {object} initialData - initialData
 * @param {number} [roundStep=100]
 * @returns {number} итоговая цена
 */
export function calcTotalPrice(dents, conditions, initialData, roundStep = 0) {
  if (!dents || !Array.isArray(dents) || dents.length === 0) return 0;
  const base = calcBasePriceFromDents(dents);
  if (base <= 0) return 0;

  const hasDisassembly = typeof conditions.disassemblyCost === 'number' || conditions.disassemblyCode;
  const hasConditions =
    conditions &&
    conditions.repairCode &&
    conditions.riskCode &&
    conditions.materialCode &&
    conditions.carClassCode &&
    hasDisassembly;
  if (!hasConditions) {
    if (!roundStep || roundStep <= 0) return base;
    return Math.round(base / roundStep) * roundStep;
  }

  const perDentCores = dents.map((dent) => calculateDentPrice(dent, conditions, initialData));
  const dentsTotal = perDentCores.reduce((sum, v) => sum + v, 0);
  let disCost = 0;
  if (typeof conditions.disassemblyCost === 'number') {
    disCost = conditions.disassemblyCost;
  } else if (conditions.disassemblyCode) {
    disCost = initialData.disassembly?.find((d) => d.code === conditions.disassemblyCode)?.price ?? 0;
  }
  let soundCost = 0;
  if (conditions.soundInsulationCode) {
    soundCost = initialData.soundInsulation?.find((s) => s.code === conditions.soundInsulationCode)?.price ?? 0;
  }
  const total = dentsTotal + disCost + soundCost;
  if (!roundStep || roundStep <= 0) return Math.max(0, total);
  return Math.round(total / roundStep) * roundStep;
}

/**
 * Per-dent core totals (before disassembly/sound add-ons) for multi-dent aggregation.
 * @param {Array} dents
 * @param {object} conditions
 * @param {object} initialData
 * @returns {{ perDentCores: number[], disCost: number, soundCost: number }}
 */
export function getPerDentCoresAndAddons(dents, conditions, initialData) {
  if (!dents || !Array.isArray(dents) || dents.length === 0) {
    return { perDentCores: [], disCost: 0, soundCost: 0 };
  }
  const hasDisassembly = typeof conditions?.disassemblyCost === 'number' || conditions?.disassemblyCode;
  const hasConditions =
    conditions?.repairCode &&
    conditions?.riskCode &&
    conditions?.materialCode &&
    conditions?.carClassCode &&
    hasDisassembly;
  if (!hasConditions) {
    const perDentCores = dents.map((d) => normalizeNumber(d?.price, 0));
    return { perDentCores, disCost: 0, soundCost: 0 };
  }
  const perDentCores = dents.map((dent) => calculateDentPrice(dent, conditions, initialData));
  let disCost = 0;
  if (typeof conditions.disassemblyCost === 'number') disCost = conditions.disassemblyCost;
  else if (conditions.disassemblyCode) disCost = initialData.disassembly?.find((d) => d.code === conditions.disassemblyCode)?.price ?? 0;
  let soundCost = 0;
  if (conditions.soundInsulationCode) soundCost = initialData.soundInsulation?.find((s) => s.code === conditions.soundInsulationCode)?.price ?? 0;
  return { perDentCores, disCost, soundCost };
}

/**
 * Общая логика расчёта итоговой цены с учётом условий/коэффициентов.
 * Используется в режимах Стандарт, Время и Графика (единая формула).
 *
 * @param {number} basePrice - базовая цена (от размера / часов / суммы вмятин)
 * @param {{ repairCode, riskCode, materialCode, carClassCode, disassemblyCode }} conditions - выбранные условия
 * @param {object} initialData - initialData (repairTypes, risks, materials, carClasses, disassembly, complexityMatrix)
 * @param {string} [sizeCodeForMatrix] - код размера для матрицы сложности (S2, S4, ...). Для Графика/Время передать 'STRIP_DEFAULT'
 * @param {number} [roundStep=100] - шаг округления (все цены с шагом 100, без десятков/копеек)
 * @returns {number} итоговая цена (округлённая)
 */
export function applyConditionsToBase(basePrice, conditions, initialData, sizeCodeForMatrix = 'STRIP_DEFAULT', roundStep = 100) {
  if (!conditions || !initialData || basePrice <= 0) return 0;
  const { repairCode, riskCode, materialCode, carClassCode, disassemblyCode } = conditions;
  const hasDisassembly = disassemblyCode || typeof conditions.disassemblyCost === 'number';
  if (!repairCode || !riskCode || !materialCode || !carClassCode || !hasDisassembly) return 0;

  const repCoeff = initialData.repairTypes.find((r) => r.code === repairCode)?.mult ?? 1.0;
  const matCoeff = initialData.materials.find((m) => m.code === materialCode)?.mult ?? 1.0;
  const carClassCoeff = initialData.carClasses.find((c) => c.code === carClassCode)?.mult ?? 1.0;
  const paintCoeff = conditions.paintMaterialCode
    ? (initialData.paintMaterials?.find((p) => p.code === conditions.paintMaterialCode)?.mult ?? 1.0)
    : 1.0;
  const riskObj = initialData.risks.find((r) => r.code === riskCode);
  const kKey = riskObj ? riskObj.matrixKey : 'K2';
  const compCoeff = getComplexityCoeff(initialData, kKey, sizeCodeForMatrix);
  let disCost = 0;
  if (typeof conditions.disassemblyCost === 'number') {
    disCost = conditions.disassemblyCost;
  } else if (disassemblyCode) {
    disCost = initialData.disassembly?.find((d) => d.code === disassemblyCode)?.price ?? 0;
  }
  let soundCost = 0;
  if (conditions.soundInsulationCode) {
    soundCost = initialData.soundInsulation?.find((s) => s.code === conditions.soundInsulationCode)?.price ?? 0;
  }

  let price = basePrice;
  price *= repCoeff;
  price *= compCoeff;
  price *= matCoeff;
  price *= carClassCoeff;
  price *= paintCoeff;
  price += disCost;
  price += soundCost;
  const final = Math.max(0, price);
  if (!roundStep || roundStep <= 0) return final;
  return Math.round(final / roundStep) * roundStep;
}

/**
 * Строит массив строк breakdown для Step 4 (Итог).
 * @param {number} basePrice - базовая стоимость
 * @param {{ repairCode, riskCode, materialCode, carClassCode, disassemblyCode }} conditions
 * @param {object} initialData
 * @param {string} [sizeCodeForMatrix='STRIP_DEFAULT']
 * @returns {Array<{ name: string, value: string }>} массив { name, value }
 */
export function buildBreakdown(basePrice, conditions, initialData, sizeCodeForMatrix = 'STRIP_DEFAULT') {
  const items = [];
  if (!conditions || !initialData || basePrice <= 0) return items;

  const { repairCode, riskCode, materialCode, carClassCode, disassemblyCode } = conditions;
  const hasDisassembly = disassemblyCode || typeof conditions.disassemblyCost === 'number';
  if (!repairCode || !riskCode || !materialCode || !carClassCode || !hasDisassembly) return items;

  const riskObj = initialData.risks.find((r) => r.code === riskCode);
  const kKey = riskObj ? riskObj.matrixKey : 'K2';
  const compMult = getComplexityCoeff(initialData, kKey, sizeCodeForMatrix);
  const repObj = initialData.repairTypes.find((r) => r.code === repairCode);
  const repMult = repObj?.mult ?? 1.0;
  const matObj = initialData.materials.find((m) => m.code === materialCode);
  const matMult = matObj?.mult ?? 1.0;
  const carClassObj = initialData.carClasses.find((c) => c.code === carClassCode);
  const carClassMult = carClassObj?.mult ?? 1.0;
  let disCost = 0;
  let disLabel = '';
  if (typeof conditions.disassemblyCost === 'number') {
    disCost = conditions.disassemblyCost;
    disLabel = 'Арматурные работы';
  } else {
    const disObj = initialData.disassembly?.find((d) => d.code === disassemblyCode);
    disCost = disObj?.price ?? 0;
    disLabel = disObj?.name ?? 'Разборка';
  }

  items.push({ name: 'Базовая стоимость', value: `${(Math.round(basePrice / 100) * 100).toLocaleString('ru-RU')} ₽` });
  if (repObj) items.push({ name: repObj.name, value: `×${repMult}` });
  if (matObj) items.push({ name: matObj.name, value: `×${matMult}` });
  if (riskObj) items.push({ name: riskObj.name, value: `×${compMult}` });
  if (carClassObj) items.push({ name: carClassObj.name, value: `×${carClassMult}` });
  const paintObj = conditions.paintMaterialCode
    ? initialData.paintMaterials?.find((p) => p.code === conditions.paintMaterialCode)
    : null;
  if (paintObj && paintObj.mult !== 1.0) items.push({ name: paintObj.name, value: `×${paintObj.mult}` });
  if (disCost > 0) items.push({ name: disLabel, value: `+${roundPrice(disCost).toLocaleString('ru-RU')} ₽` });
  const soundObj = conditions.soundInsulationCode
    ? initialData.soundInsulation?.find((s) => s.code === conditions.soundInsulationCode)
    : null;
  const soundCost = soundObj?.price ?? 0;
  if (soundCost > 0) items.push({ name: soundObj?.name ?? 'Шумоизоляция', value: `+${roundPrice(soundCost).toLocaleString('ru-RU')} ₽` });

  return items;
}
