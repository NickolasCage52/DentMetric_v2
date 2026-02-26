export const initialData = {
    repairTypes: [
        { code: 'R1', name: 'Без покраски', mult: 1.0 },
        { code: 'R2', name: 'Под покраску', mult: 0.85 }
    ],
    materials: [
        { code: 'M1', name: 'Сталь', mult: 1.0 },
        { code: 'M2', name: 'Алюминий', mult: 1.3 }
    ],
    paintMaterials: [
        { code: 'P1', name: 'Глянец', desc: 'Стандартное глянцевое ЛКП', mult: 1.0 },
        { code: 'P2', name: 'Матовая краска', desc: 'Матовая краска требует особой техники', mult: 1.25 },
        { code: 'P3', name: 'Работа по плёнке', desc: 'Виниловая плёнка или оклейка', mult: 1.25 }
    ],
    carClasses: [
        { code: 'CLASS_STD', name: 'Стандарт', mult: 1.0 },
        { code: 'CLASS_PREM', name: 'Премиум / Новый', mult: 1.2 }
    ],
    risks: [
        { code: 'RK1', name: 'Лёгкая (плавная вмятина)', matrixKey: 'K1' },
        { code: 'RK2', name: 'Средняя (стандартная вмятина)', matrixKey: 'K2' },
        { code: 'RK3', name: 'Высокая (острая/с заломом)', matrixKey: 'K3' },
        { code: 'RK4', name: 'Экстра (острая+сложный доступ)', matrixKey: 'K4' }
    ],
    soundInsulation: [
        { code: 'SI0', name: 'Без шумоизоляции', desc: 'Шумоизоляция не требуется', price: 0 },
        { code: 'SI1', name: 'Доп. шумоизоляция', desc: 'Требуется шумоизоляция (+2 000 ₽)', price: 2000 }
    ],
    disassembly: [
        { code: 'Z0', name: 'Без разборки', price: 0 },
        { code: 'Z1', name: 'Фонарь', price: 1000 },
        { code: 'Z2', name: 'Дверь', price: 2000 },
        { code: 'Z3', name: 'Потолок', price: 4000 },
        { code: 'Z4', name: 'Дверь+обшивка', price: 3000 }
    ],
    defaultMasters: [
        { name: 'Андрей', rate: 5000 },
        { name: 'Аким', rate: 2500 }
    ],

    // Added 'area' in pixels relative to 1:1 scale on canvas for accurate starting size
    circleSizes: [
        { code: 'S2', name: 'с монету', basePrice: 2000, radius: 15, area: 706 },
        { code: 'S4', name: 'с куриное яйцо', basePrice: 3000, radius: 25, area: 1963 },
        { code: 'S6', name: 'с апельсин', basePrice: 5000, radius: 35, area: 3848 },
        { code: 'S8', name: 'с ладонь', basePrice: 7000, radius: 45, area: 6361 },
        { code: 'S10', name: 'с футбольный мяч', basePrice: 12000, radius: 60, area: 11309 },
        { code: 'S11', name: 'два мяча', basePrice: 15000, radius: 75, area: 17671 }
    ],
    stripSizes: [
        { code: 'LS1', name: 'с спич. коробок', basePrice: 4000, w: 40, h: 20, area: 800 },
        { code: 'LS2', name: 'с карандаш', basePrice: 6000, w: 80, h: 10, area: 800 },
        { code: 'LS3', name: 'с линейку', basePrice: 9000, w: 120, h: 10, area: 1200 },
        { code: 'LS4', name: 'с книгу', basePrice: 13000, w: 150, h: 50, area: 7500 },
        { code: 'LS5', name: 'с ноутбук', basePrice: 16000, w: 200, h: 100, area: 20000 },
        { code: 'LS6', name: 'с полдвери', basePrice: 22000, w: 250, h: 150, area: 37500 },
        { code: 'LS7', name: 'с дверь', basePrice: 30000, w: 280, h: 200, area: 56000 },
        { code: 'LS8', name: 'весь элемент', basePrice: 42000, w: 300, h: 300, area: 90000 }
    ],

    complexityMatrix: {
        'S2': { K1: 1.00, K2: 1.15, K3: 2.30, K4: 4.00 },
        'S4': { K1: 1.00, K2: 1.60, K3: 2.30, K4: 4.00 },
        'S6': { K1: 1.00, K2: 1.40, K3: 2.00, K4: 3.00 },
        'S8': { K1: 1.00, K2: 1.40, K3: 1.80, K4: 3.00 },
        'S10': { K1: 1.00, K2: 1.30, K3: 1.60, K4: 2.20 },
        'S11': { K1: 1.00, K2: 1.20, K3: 1.90, K4: 2.70 },
        'STRIP_DEFAULT': { K1: 0.95, K2: 1.0, K3: 1.15, K4: 1.3 }
    }
};
