/**
 * Armaturnye (disassembly/additional) works grouped by element.
 * Works are shown based on the selected damaged element (dent.panelElement).
 * Z0 = "Без разборки" is always available.
 * Supports custom works and price overrides from user settings.
 */
import { SETTINGS_KEY } from '../utils/settingsUtils';
import { normalizeArmatureBodyElement } from '../constants/bodyElements';

function loadArmatureSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
    return {
      customArmatureWorks: Array.isArray(raw.customArmatureWorks) ? raw.customArmatureWorks : [],
      armaturePriceOverrides: raw.armaturePriceOverrides && typeof raw.armaturePriceOverrides === 'object' ? raw.armaturePriceOverrides : {}
    };
  } catch (_e) {
    return { customArmatureWorks: [], armaturePriceOverrides: {} };
  }
}

export const ARMATURNAYA_ELEMENT_MAP = {
  'Передняя дверь': 'door',
  'Задняя дверь': 'door',
  'Заднее крыло': 'rearWing',
  'Крышка багажника': 'trunkLid',
  'Переднее крыло': 'frontWing',
  'Капот': 'hood',
  'Крыша': 'roof',
  'Стойка крыши': 'roof',
  'Порог': 'bumper',
  'Бампер': 'bumper'
};

export const ARMATURNAYA_BY_ELEMENT = {
  none: [
    { code: 'Z0', name: 'Без дополнительных работ', price: 0 }
  ],
  door: [
    { code: 'ZD1', name: 'С/установка двери (простое)', price: 1500 },
    { code: 'ZD2', name: 'С/установка двери (сложное)', price: 2000 },
    { code: 'ZD3', name: 'С/установка дверной карты', price: 1000 },
    { code: 'ZD4', name: 'Полный разбор двери', price: 5000 },
    { code: 'ZD5', name: 'Демонтаж ручки', price: 500 }
  ],
  rearWing: [
    { code: 'ZRW1', name: 'Фонарь простой', price: 500 },
    { code: 'ZRW2', name: 'Фонарь сложный', price: 2000 },
    { code: 'ZRW3', name: 'Колесо', price: 500 },
    { code: 'ZRW4', name: 'Подкрылок', price: 1000 }
  ],
  trunkLid: [
    { code: 'ZT1', name: 'С/установка обшивки', price: 1000 },
    { code: 'ZT2', name: 'С/установка фонаря', price: 500 },
    { code: 'ZT3', name: 'С/установка крышки багажника', price: 3000 }
  ],
  frontWing: [
    { code: 'ZFW1', name: 'Демонтаж молдинга', price: 500 },
    { code: 'ZFW2', name: 'Демонтаж молдинга + замена скотча', price: 1500 },
    { code: 'ZFW3', name: 'Фара простая', price: 1000 },
    { code: 'ZFW4', name: 'Фара сложная', price: 3000 }
  ],
  hood: [
    { code: 'ZH1', name: 'С/установка обшивки', price: 500 },
    { code: 'ZH2', name: 'С/установка капота', price: 2000 }
  ],
  roof: [
    { code: 'ZR1', name: 'С/установка потолка простое', price: 3000 },
    { code: 'ZR2', name: 'С/установка потолка сложное', price: 5000 },
    { code: 'ZR3', name: 'Демонтаж люка', price: 5000 }
  ],
  bumper: [
    { code: 'ZB1', name: 'Частично', price: 1000 },
    { code: 'ZB2', name: 'Полный демонтаж', price: 2000 }
  ]
};

export function getArmaturnayaWorksForElement(panelElement) {
  const elementKey = panelElement ? ARMATURNAYA_ELEMENT_MAP[panelElement] : null;
  const works = elementKey ? ARMATURNAYA_BY_ELEMENT[elementKey] : null;
  const base = ARMATURNAYA_BY_ELEMENT.none;
  let list = !works ? [...base] : [...base, ...works];
  const { customArmatureWorks, armaturePriceOverrides } = loadArmatureSettings();
  if (armaturePriceOverrides && Object.keys(armaturePriceOverrides).length > 0) {
    list = list.map((w) => {
      const override = armaturePriceOverrides[w.code];
      return override != null ? { ...w, price: Number(override) || w.price } : w;
    });
  }
  if (customArmatureWorks && customArmatureWorks.length > 0) {
    const custom = customArmatureWorks
      .filter((c) => c && c.id && c.name != null)
      .map((c) => ({
        code: c.id,
        name: String(c.name),
        price: Number(c.price) || 0,
        isCustom: true,
        bodyElement: normalizeArmatureBodyElement(c.bodyElement)
      }));
    list = [...list, ...custom];
  }
  return list;
}

export function formatArmaturnayaSummary(codes, panelElement) {
  const arr = Array.isArray(codes) ? codes : [];
  const works = getArmaturnayaWorksForElement(panelElement);
  const byCode = new Map(works.map((w) => [w.code, w]));
  const normalized = arr.length ? arr : ['Z0'];
  const filtered = normalized.filter((c) => c && c !== 'Z0');
  if (filtered.length === 0) {
    return byCode.get('Z0')?.name || 'Без дополнительных работ';
  }
  if (filtered.length === 1) return byCode.get(filtered[0])?.name || String(filtered[0]);
  const names = filtered.map((c) => byCode.get(c)?.name || String(c));
  let text = names.join(' · ');
  const maxLen = 96;
  if (text.length > maxLen) text = `${text.slice(0, maxLen - 1)}…`;
  return text;
}

/** Заголовки групп для экрана настроек (по кузовной зоне). */
export const ARMATURE_ELEMENT_GROUP_LABELS = {
  door: 'Двери',
  rearWing: 'Заднее крыло',
  trunkLid: 'Крышка багажника',
  frontWing: 'Переднее крыло',
  hood: 'Капот',
  roof: 'Крыша / стойки',
  bumper: 'Порог и бампер'
};

/**
 * Системные арматурные работы для настроек: общие (Z0) + по элементам кузова.
 * @returns {{ key: string, label: string, works: { code: string, name: string, price: number }[] }[]}
 */
export function getArmatureSettingsGroups() {
  const base = ARMATURNAYA_BY_ELEMENT.none || [];
  const keys = Object.keys(ARMATURNAYA_BY_ELEMENT).filter((k) => k !== 'none');
  const groups = [
    {
      key: 'base',
      label: 'Общие',
      works: [...base]
    }
  ];
  for (const key of keys) {
    const list = ARMATURNAYA_BY_ELEMENT[key];
    if (!list?.length) continue;
    groups.push({
      key,
      label: ARMATURE_ELEMENT_GROUP_LABELS[key] || key,
      works: [...list]
    });
  }
  return groups;
}

export function getArmaturnayaTotalPrice(codes, panelElement) {
  if (!codes || codes.length === 0) return 0;
  if (codes.length === 1 && codes[0] === 'Z0') return 0;
  const works = getArmaturnayaWorksForElement(panelElement);
  const uniqueByCode = new Map(works.map((w) => [w.code, w]));
  return codes.reduce((sum, code) => {
    const work = uniqueByCode.get(code);
    return sum + (work?.price ?? 0);
  }, 0);
}

/**
 * Selected armature works with resolved names and prices (for per-line display).
 * @param {string[]} codes
 * @param {string|null} panelElement
 * @returns {{ code: string, name: string, price: number }[]}
 */
export function getArmatureWorkLineItems(codes, panelElement) {
  const arr = Array.isArray(codes) ? codes : [];
  const filtered = arr.filter((c) => c && c !== 'Z0');
  if (filtered.length === 0) return [];
  const works = getArmaturnayaWorksForElement(panelElement);
  const byCode = new Map(works.map((w) => [w.code, w]));
  return filtered.map((code) => {
    const w = byCode.get(code);
    return {
      code,
      name: w?.name || String(code),
      price: Math.round(Number(w?.price) || 0)
    };
  });
}

/** All system works (for settings UI). */
export function getAllSystemArmatureWorks() {
  const base = ARMATURNAYA_BY_ELEMENT.none;
  const rest = Object.values(ARMATURNAYA_BY_ELEMENT)
    .flat()
    .filter((w) => w.code !== 'Z0');
  const seen = new Set();
  const unique = [];
  for (const w of [base[0], ...rest]) {
    if (w && !seen.has(w.code)) {
      seen.add(w.code);
      unique.push(w);
    }
  }
  return unique;
}
