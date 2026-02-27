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
        { code: 'L5', name: '5 см', basePrice: 4000, w: 50, h: 20, area: 1000 },
        { code: 'L18', name: '18 см', basePrice: 8000, w: 180, h: 20, area: 3600 },
        { code: 'L20', name: '20 см', basePrice: 9000, w: 200, h: 20, area: 4000 },
        { code: 'L21', name: '21 см', basePrice: 12000, w: 210, h: 20, area: 4200 },
        { code: 'L36', name: '36 см', basePrice: 15000, w: 360, h: 20, area: 7200 },
        { code: 'L50', name: '50 см', basePrice: 15000, w: 500, h: 20, area: 10000 },
        { code: 'L100', name: '100 см', basePrice: 22000, w: 1000, h: 20, area: 20000 }
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
