/**
 * Armaturnye (disassembly/additional) works grouped by element.
 * Works are shown based on the selected damaged element (dent.panelElement).
 * Z0 = "Без разборки" is always available.
 */

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
  if (!works) return base;
  return [...base, ...works];
}

export function getArmaturnayaTotalPrice(codes, panelElement) {
  if (!codes || codes.length === 0) return 0;
  if (codes.length === 1 && codes[0] === 'Z0') return 0;
  const works = getArmaturnayaWorksForElement(panelElement);
  const allWorks = [
    ...ARMATURNAYA_BY_ELEMENT.none,
    ...Object.values(ARMATURNAYA_BY_ELEMENT).flat().filter((w) => w.code !== 'Z0')
  ];
  const uniqueByCode = new Map();
  allWorks.forEach((w) => uniqueByCode.set(w.code, w));
  return codes.reduce((sum, code) => {
    const work = uniqueByCode.get(code);
    return sum + (work?.price ?? 0);
  }, 0);
}
