# DentMetric — Полная математика расчёта (Audit)

> Дата аудита: 2025-03-08
> Источник: реальный код приложения, без правок
> Обновление: 2026-03-08 — исправлен root cause "Полоса не определяется" в Quick

---

## MATH AUDIT REPORT (2026-03-08)

### Root Cause
- **Что было сломано:** В Quick при выборе пресета "Полоса/Царапина" тип формы не устанавливался. `applyDamagePreset` менял только размеры (sizeLengthMm, sizeWidthMm), но не `dent.shape`. Новая вмятина по умолчанию имела `shape: 'circle'`, и после выбора stripe-пресета оставалась с `shape: 'circle'`. Расчёт шёл по circle/oval (area interpolation) вместо stripe-таблиц.
- **Файл и строка:** `src/App.vue` — `applyDamagePreset`
- **Механизм поломки:** Отсутствие установки `dent.shape` при выборе preset. `preset.group === 'stripe'` не учитывался.

### Исправление
- В `applyDamagePreset` добавлена установка `dent.shape` из `preset.group`: `'stripe'` → `'strip'`, `'round_oval'` → `'circle'`. Вызывается `setQuickDentShape(dent, shape)` до присвоения размеров.

### Legacy Cleanup
- Удалено: нет — только исправление логики.
- Изолировано: нет.

### Single Source of Truth
- **Stripe расчёт:** `src/pricing/stripePricing.ts` → `getStripePrice`
- **Oval/Circle расчёт:** `src/utils/priceAdapter.js` → `getBasePriceByMm` / `getInterpolatedPriceByAreaMm2`
- **Классификатор формы:** `src/features/pricing/pricingAdapter.js` → `isStripeCase`
- **Используется в Quick:** через `pricingAdapter.calculateDentBasePrice` (App.vue → calcDentViaAdapter)
- **Используется в Детализации:** через `normalizeGraphicsDentsForPricing` (GraphicsWizard.vue)

### Verification
- Self-check assertions: `src/utils/devAuditMath.js` — все проверки в DEV.
- len=12 h=4 высокая ≤ 15000: ✓ (stripePricing.ts: формула `min(price2×K, p4at15)`)
- ratio=1:1 → oval: ✓ (`isStripeCase` возвращает false)
- Промежуточные значения монотонны: ✓ (линейная интерполяция)
- Quick === Detail при одинаковых входах: ✓ (единый pricingAdapter)

---

## 1. Общая схема расчёта (Pipeline)

```
ВХОД (параметры вмятины: type, widthMm, heightMm, conditions)
  ↓
Нормализация размеров (округление до 1 знака)
  ↓
Классификация формы: strip + ratio>1 → stripe; иначе → circle/oval
  ↓
Ветка расчёта: stripe → stripePricing.ts; circle → area interpolation
  ↓
Базовая цена: stripe = getStripePrice(); circle = getInterpolatedPriceByAreaMm2()
  ↓
Применение коэффициентов (repair × complexity × material × carClass × paint)
  ↓
+ Арматурные работы (disassemblyCost)
  ↓
+ Шумоизоляция (soundCost)
  ↓
× User multiplier (priceAdjustmentRoundOval / priceAdjustmentStripe)
  ↓
Multi-dent: самая дорогая 100%, остальные × (1 - discountRate)
  ↓
× (1 - manualDiscount/100)
  ↓
Округление (ceil к step или round)
  ↓
ИТОГ по заказу
```

---

## 2. Карта модулей

| Файл/модуль | Что делает | Source of truth для | Quick | Детализация | Примечание |
|-------------|-----------|---------------------|-------|-------------|------------|
| `src/pricing/stripePricing.ts` | Таблицы h=2, h=4, lookup, lerp по height | Полоса/Царапина | ✓ | ✓ | Единственная точка правды для stripe |
| `src/utils/stripeCalc.js` | Адаптер: coeffClass→severity, вызов getStripePrice | — | ✓ | ✓ | Обёртка над stripePricing |
| `src/utils/priceAdapter.js` | Интерполяция по площади, getBasePriceByMm | Круг/Овал | ✓ | ✓ | areaMm2 → price |
| `src/features/pricing/pricingAdapter.js` | calculateDentBasePrice, calculateDentPrice, isStripeCase | Маршрутизация stripe/circle | ✓ | ✓ | Единый вход |
| `src/utils/priceCalc.js` | applyConditionsToBase, calcTotalPrice, getComplexityCoeff | Коэффициенты, итог | ✓ | ✓ | repair×comp×mat×car×paint + addons |
| `src/utils/multiDentAggregation.js` | Скидка 2-й+ вмятина по same/diff part | Множественные вмятины | ✓ | ✓ | |
| `src/utils/settingsUtils.js` | getPriceMultiplier, getDiscountRate, migrateSettings | User multiplier, скидки | ✓ | ✓ | |
| `src/utils/priceRounding.js` | applyPriceRoundingCeil | Округление вверх | ✓ | ✓ | |
| `src/utils/discount.js` | applyDiscount | Ручная скидка | ✓ | ✓ | |
| `src/data/initialData.js` | repairTypes, materials, risks, complexityMatrix, disassembly | Коэффициенты, справочники | ✓ | ✓ | |
| `src/data/armaturnayaWorks.js` | getArmaturnayaTotalPrice | Арматурные работы | ✓ | ✓ | По элементу панели |
| `src/data/dentSizes.js` | circleSizesWithArea, stripSizesWithArea | Площади для circle | ✓ | ✓ | strip sizes НЕ используются для stripe-цены |
| `src/graphics/konvaEditor.js` | getInterpolatedPriceByAreaMm2 (HUD) | Превью в редакторе | — | ✓ | Только отображение |

---

## 3. Все входные параметры

| Параметр | Внутренний ключ | Тип | Возможные значения | Влияет на этап | Quick | Детализация | Дефолт |
|----------|----------------|-----|-------------------|----------------|-------|-------------|--------|
| Ширина (мм) | widthMm, bboxMm.width | number | 0–∞ | lengthCm/heightCm для stripe; area для circle | ✓ | ✓ | — |
| Высота (мм) | heightMm, bboxMm.height | number | 0–∞ | lengthCm/heightCm для stripe; area для circle | ✓ | ✓ | — |
| Длина (см) | lengthCm | number | max(w,h)/10 | stripe lookup | ✓ | ✓ | авто |
| Высота полосы (см) | heightCm | number | min(w,h)/10 | stripe lerp h2↔h4 | ✓ | ✓ | авто |
| Соотношение | ratio | number | L/H | isStripeCase (ratio>1.001) | ✓ | ✓ | авто |
| Тип формы | shape, type | enum | circle/strip/freeform | Ветка расчёта | ✓ | ✓ | circle |
| Сложность | riskCode, matrixKey | enum | RK1/RK2/RK3/RK4 → K1/K2/K3/K4 | complexityMatrix (circle); severity (stripe) | ✓ | ✓ | K2 |
| Технология ремонта | repairCode | enum | R1/R2 | × mult | ✓ | ✓ | — |
| Материал панели | materialCode | enum | M1/M2 | × mult | ✓ | ✓ | — |
| Класс автомобиля | carClassCode | enum | CLASS_STD/CLASS_PREM | × mult | ✓ | ✓ | — |
| Покрытие/ЛКП | paintMaterialCode | enum | P1/P2/P3 | × mult | ✓ | ✓ | null→1.0 |
| Арматурные работы | disassemblyCodes, disassemblyCost | array/number | Z0, ZD1, … | + надбавка | ✓ | ✓ | Z0 |
| Шумоизоляция | soundInsulationCode | enum | SI0/SI1 | + надбавка | ✓ | ✓ | 0 |
| Элемент панели | panelElement | string | Капот, Дверь, … | Арматурные работы по элементу | ✓ | ✓ | — |
| Множитель oval | priceAdjustmentRoundOval | number | 0.5–2.0 | × после коэффициентов | ✓ | ✓ | 1.0 |
| Множитель stripe | priceAdjustmentStripe | number | 0.5–2.0 | × после коэффициентов | ✓ | ✓ | 1.0 |
| Скидка same part | discountSamePartValue | number | 0–100% | 2-я+ вмятина на том же элементе | ✓ | ✓ | 50 |
| Скидка diff part | discountDiffPartValue | number | 0–100% | 2-я+ вмятина на другом элементе | ✓ | ✓ | 0 |
| Ручная скидка | discountPercent | number | 0–100% | × (1-d/100) | ✓ | ✓ | 0 |
| Округление | priceRoundStep | number | 0/10/50/100/500 | ceil к step | ✓ | ✓ | 0 |

---

## 4. Классификация формы

### 4.1 Правила маршрутизации

| Условие | Ветка расчёта | Источник правила | Примечание |
|---------|--------------|-----------------|------------|
| type ∈ {strip, stripe, scratch} AND ratio > 1.001 | Полоса (stripe tables) | pricingAdapter.js:45–56 | Явный выбор + не квадрат |
| type = strip AND ratio ≤ 1.001 | Круг/Овал (area) | pricingAdapter.js:54 | Fallback: квадрат → круг |
| type = circle, freeform | Круг/Овал (area) | pricingAdapter.js:122 | |
| type = oval | Круг/Овал (area) | — | oval не в коде, считается circle |

### 4.2 Как вычисляется ratio

```
L = max(widthMm, heightMm)
H = min(widthMm, heightMm)
ratio = H > 0 ? L / H : 1
isRatioOneToOne = |ratio - 1| ≤ 0.001
```

### 4.3 Stripe: lengthCm и heightCm

```
lengthCm = max(widthMm, heightMm) / 10
heightCm = min(widthMm, heightMm) / 10
```

### 4.4 Расхождения Quick vs Детализация в классификации

| Условие | Quick | Детализация | Совпадает? |
|---------|-------|-------------|------------|
| strip 10×10 | circle (ratio 1:1) | circle | ✓ |
| strip 200×20 | stripe | stripe | ✓ |
| circle 90×30 | circle (oval) | circle | ✓ |
| Оба используют isStripeCase из pricingAdapter | — | — | ✓ |

---

## 5. Таблицы цен

### 5.1 Таблица Круг/Овал (по площади)

> Источник: `src/data/dentSizes.js` (areaMm2), `src/data/initialData.js` (basePrice), `userSettings.prices`

Площади и дефолтные цены (цены настраиваются пользователем):

| Код | Название | w×h (мм) | Площадь (мм²) | Базовая цена (₽) |
|-----|----------|----------|---------------|-----------------|
| S2 | Монета | 25×25 | 490.9 | 2000 |
| S4 | Яйцо | 45×60 | 2120.6 | 3000 |
| S6 | Апельсин | 90×90 | 6361.7 | 5000 |
| S8 | Ладонь | 85×180 | 12016.8 | 7000 |
| S10 | Футбольный мяч | 220×220 | 38013.3 | 12000 |
| S11 | Два мяча | 440×440 | 152053.1 | 15000 |

Формула площади овала: `areaMm2 = π × (w/2) × (h/2)`.

### 5.2 Таблица Полоса/Царапина — h=2 см

> Источник: `src/pricing/stripePricing.ts:19–35`

| Длина (см) | Лёгкая (₽) | Средняя (₽) | Высокая (₽) | Экстра (₽) |
|-----------|-----------|------------|------------|-----------|
| 8 | 5000 | 6500 | 8500 | 11000 |
| 10 | 6000 | 8000 | 10500 | 13000 |
| 12 | 7000 | 9500 | 12000 | 15500 |
| 15 | 9000 | 12000 | 15500 | 20000 |
| 18 | 11000 | 15000 | 19000 | 24000 |
| 20 | 12000 | 16000 | 21000 | 26500 |
| 25 | 13000 | 17500 | 23000 | 28500 |
| 30 | 14000 | 19000 | 24500 | 31000 |
| 35 | 15000 | 20500 | 26000 | 33000 |
| 40 | 16000 | 22000 | 28000 | 35000 |
| 50 | 18000 | 24500 | 31500 | 40000 |
| 60 | 20000 | 27000 | 35000 | 44000 |
| 70 | 22000 | 30000 | 38500 | 48500 |
| 80 | 24000 | 32500 | 42000 | 53000 |
| 90 | 26000 | 35000 | 45500 | 57000 |
| 100 | 28000 | 38000 | 49000 | 61500 |

### 5.3 Таблица Полоса/Царапина — h=4 см

> Источник: `src/pricing/stripePricing.ts:37–51`

| Длина (см) | Лёгкая (₽) | Средняя (₽) | Высокая (₽) | Экстра (₽) |
|-----------|-----------|------------|------------|-----------|
| 15 | 11000 | 12000 | 15000 | 18000 |
| 18 | 14000 | 15500 | 19000 | 23000 |
| 20 | 15000 | 16500 | 20500 | 24500 |
| 25 | 16500 | 18000 | 22500 | 27000 |
| 30 | 17500 | 19000 | 24000 | 29000 |
| 35 | 19000 | 21000 | 26000 | 31500 |
| 40 | 20000 | 22000 | 27000 | 33000 |
| 50 | 22500 | 24500 | 30500 | 37000 |
| 60 | 25000 | 27000 | 34000 | 41000 |
| 70 | 27500 | 30000 | 37500 | 45000 |
| 80 | 30000 | 33000 | 41000 | 49500 |
| 90 | 32500 | 35500 | 44000 | 53000 |
| 100 | 35000 | 38000 | 47500 | 57000 |

### 5.4 Маппинг coeffClass → severity (stripe)

> Источник: `src/pricing/stripePricing.ts:146–158`

| coeffClass / matrixKey | Severity |
|----------------------|----------|
| base, k1, 1 | легкая |
| k2, 2 | средняя |
| k3, 3 | высокая |
| k4, 4 | экстра |
| иначе | средняя |

### 5.5 Коэффициенты технологии ремонта

> Источник: `src/data/initialData.js:2–5`

| Код | Название | Коэффициент |
|-----|----------|-------------|
| R1 | Без покраски | 1.0 |
| R2 | Под покраску | 0.85 |

### 5.6 Коэффициенты материала панели

> Источник: `src/data/initialData.js:6–9`

| Код | Название | Коэффициент |
|-----|----------|-------------|
| M1 | Сталь | 1.0 |
| M2 | Алюминий | 1.3 |

### 5.7 Коэффициенты класса автомобиля

> Источник: `src/data/initialData.js:15–18`

| Код | Название | Коэффициент |
|-----|----------|-------------|
| CLASS_STD | Стандарт | 1.0 |
| CLASS_PREM | Премиум / Новый | 1.2 |

### 5.8 Коэффициенты покрытия/ЛКП

> Источник: `src/data/initialData.js:10–14`

| Код | Название | Коэффициент |
|-----|----------|-------------|
| P1 | Глянец | 1.0 |
| P2 | Матовая краска | 1.25 |
| P3 | Работа по плёнке | 1.25 |

Если paintMaterialCode не задан → 1.0.

### 5.9 Матрица сложности (Круг/Овал)

> Источник: `src/data/initialData.js:59–66`

| sizeCode | K1 | K2 | K3 | K4 |
|----------|-----|-----|-----|-----|
| S2 | 1.00 | 1.15 | 2.30 | 4.00 |
| S4 | 1.00 | 1.60 | 2.30 | 4.00 |
| S6 | 1.00 | 1.40 | 2.00 | 3.00 |
| S8 | 1.00 | 1.40 | 1.80 | 3.00 |
| S10 | 1.00 | 1.30 | 1.60 | 2.20 |
| S11 | 1.00 | 1.20 | 1.90 | 2.70 |
| STRIP_DEFAULT | 0.95 | 1.0 | 1.15 | 1.3 |

**Важно:** для stripe (Полоса/Царапина) complexityMatrix НЕ используется — severity уже заложена в таблицы. getComplexityCoeff возвращает 1.0 для stripe.

### 5.10 Арматурные работы (разборка)

> Источник: `src/data/initialData.js:29–34`, `src/data/armaturnayaWorks.js`

**Базовые (disassembly):**

| Код | Название | Цена (₽) |
|-----|----------|----------|
| Z0 | Без разборки | 0 |
| Z1 | Фонарь | 1000 |
| Z2 | Дверь | 2000 |
| Z3 | Потолок | 4000 |
| Z4 | Дверь+обшивка | 3000 |

**По элементу (armaturnayaWorks):** см. `src/data/armaturnayaWorks.js` — ARMATURNAYA_BY_ELEMENT (door, rearWing, trunkLid, frontWing, hood, roof, bumper). Сумма выбираемых кодов.

### 5.11 Шумоизоляция

> Источник: `src/data/initialData.js:25–28`

| Код | Название | Надбавка (₽) |
|-----|----------|--------------|
| SI0 | Без шумоизоляции | 0 |
| SI1 | Доп. шумоизоляция | 2000 |

---

## 6. Формулы и порядок применения

### 6.1 Ветка Круг/Овал

```
1. areaMm2 = π × (widthMm/2) × (heightMm/2)
2. basePrice = getInterpolatedPriceByAreaMm2(areaMm2, circleSizesWithArea, prices)
   - если area ≤ min: price = prices[sorted[0].code]
   - если между строками: линейная интерполяция по area
   - если area > S11: price = priceS11 + max(500, 3500×ln(1 + (area-areaS11)/50000))
3. total = applyConditionsToBase(basePrice, ...):
   price = basePrice
   price *= repairCoeff
   price *= compCoeff   // из complexityMatrix по sizeCode (ближайший по площади)
   price *= materialCoeff
   price *= carClassCoeff
   price *= paintCoeff
   price += disassemblyCost
   price += soundCost
4. × priceAdjustmentRoundOval (user multiplier)
5. Multi-dent discount (если несколько вмятин)
6. × (1 - manualDiscount/100)
7. Округление: step>0 ? ceil(total/step)*step : round(total)
```

### 6.2 Ветка Полоса/Царапина

```
1. lengthCm = max(w,h)/10, heightCm = min(w,h)/10
2. h = clamp(heightCm, 2, 4)
3. price2 = lookupTable(TABLE_H2, lengthCm, severity)  // с интерполяцией по length
4. Если lengthCm >= 15:
     price4 = lookupTable(TABLE_H4, lengthCm, severity)
   Иначе:
     p2at15 = lookupTable(TABLE_H2, 15, severity)
     p4at15 = TABLE_H4[0][severity]
     K = p4at15 / p2at15
     price4Raw = price2 × K
     price4 = min(price4Raw, p4at15)
5. Если h ≤ 2: basePrice = price2
   Если h ≥ 4: basePrice = price4
   Иначе: basePrice = lerp(price2, price4, (h-2)/2)
6. total = applyConditionsToBase(basePrice, ...):
   compCoeff = 1.0  // stripe уже включает severity в таблице
   [остальное как для circle]
7. × priceAdjustmentStripe
8. Multi-dent, manual discount, округление — как для circle
```

### 6.3 Сводная таблица порядка коэффициентов

| Шаг | Операция | Формула | Тип | Когда | Источник |
|-----|---------|---------|-----|-------|----------|
| 1 | Базовая цена | lookup / interpolate | — | всегда | таблица / user prices |
| 2 | Технология | price × repCoeff | × | repairCode | repairTypes |
| 3 | Сложность | price × compCoeff | × | riskCode; stripe→1.0 | complexityMatrix |
| 4 | Материал | price × matCoeff | × | materialCode | materials |
| 5 | Класс авто | price × carClassCoeff | × | carClassCode | carClasses |
| 6 | Покрытие | price × paintCoeff | × | paintMaterialCode | paintMaterials |
| 7 | Арматурные | price + disCost | + | disassemblyCodes | armaturnayaWorks |
| 8 | Шумоизоляция | price + soundCost | + | soundInsulationCode | soundInsulation |
| 9 | User multiplier | price × mult | × | всегда | priceAdjustmentRoundOval/Stripe |
| 10 | Multi-dent | 2-я+ × (1-rate) | × | несколько вмятин | discountSamePart/DiffPart |
| 11 | Ручная скидка | × (1-d/100) | × | discountPercent>0 | estimateDraft |
| 12 | Округление | ceil/round | — | всегда | priceRoundStep |

---

## 7. Интерполяция / Clamp / Lookup

| Сценарий | Правило | Формула | Пример |
|---------|---------|---------|--------|
| Длина точно в таблице | Прямой lookup | price = row[severity] | len=20, h=2 → 12000 (легкая) |
| Длина между строками | Линейная интерполяция | t=(len-lo)/(hi-lo); price=round(lo+(hi-lo)×t) | len=22 между 20 и 25 |
| Длина < min таблицы | Clamp к min | price = table[0][sev] | len=5, h=2 → как len=8 |
| Длина > max таблицы | Clamp к max | price = table[last][sev] | len=150 → как len=100 |
| height < 2 | Clamp | h=2 | heightCm=1 → как h=2 |
| height > 4 | Clamp | h=4 | heightCm=6 → как h=4 |
| height между 2 и 4 | Lerp | t=(h-2)/2; round(p2+(p4-p2)×t) | h=3 → середина |
| len<15 при h=4 | Безопасная формула | price4 = min(price2×K, TABLE_H4[15][sev]) | len=12, h=4 |
| Circle: area ≤ min | Clamp | price = prices[first] | area=100 → S2 |
| Circle: area между | Линейная интерполяция | ratio=(area-a1)/(a2-a1); p1+(p2-p1)×ratio | — |
| Circle: area > S11 | Экстраполяция | priceS11 + max(500, 3500×ln(1+Δ/50000)) | — |

---

## 8. Логика множественных вмятин

### 8.1 Общая схема

| Сценарий | Правило | Источник |
|---------|---------|----------|
| Одна вмятина | Полная цена (×1.0) | — |
| Несколько вмятин | Самая дорогая → 100%; остальные → ×(1 - discountRate) | multiDentAggregation.js |
| Same part (тот же элемент) | discountRate = discountSamePartValue/100 | getDiscountRate |
| Different part (другой элемент) | discountRate = discountDiffPartValue/100 | getDiscountRate |
| Без panelElement | Fallback: discountSamePart или secondDentDiscountPercent | migrateSettings |

### 8.2 Настройки скидок

| Настройка | Ключ | Где хранится | Дефолт | Влияет на |
|-----------|------|--------------|--------|----------|
| Same part discount | discountSamePartEnabled, discountSamePartValue | localStorage (SETTINGS_KEY) | 50% | 2-я+ на том же элементе |
| Different part discount | discountDiffPartEnabled, discountDiffPartValue | localStorage | 0% | 2-я+ на другом элементе |
| Legacy: secondDentDiscount | enableSecondDentDiscount, secondDentDiscountPercent | — | 50% | Миграция → discountSamePart |

### 8.3 Формула итога по заказу

```
1. Сортировка вмятин по total (убывание)
2. primaryIdx = индекс максимума (при равенстве — первый)
3. Для каждой вмятины i:
   factor[i] = (i === primaryIdx) ? 1.0 : (1 - getDiscountRate(dent_i, primaryDent, settings))
   weighted[i] = total[i] × factor[i]
4. sum = Σ weighted[i]
5. + disCost + soundCost (один раз на заказ)
6. afterDiscount = sum × (1 - manualDiscount/100)
7. displayTotal = roundStep > 0 ? ceil(afterDiscount/roundStep)×roundStep : round(afterDiscount)
```

---

## 9. Настройки пользователя

| Настройка | Ключ | Тип | Значения | Дефолт | На что влияет | Формула |
|-----------|------|-----|---------|--------|---------------|---------|
| Множитель круг/овал | priceAdjustmentRoundOval | number | 0.5–2.0 | 1.0 | Итог по вмятине | price × mult |
| Множитель полоса | priceAdjustmentStripe | number | 0.5–2.0 | 1.0 | Итог по вмятине | price × mult |
| Скидка same part | discountSamePartValue | number | 0–100 | 50 | 2-я+ вмятина | ×(1-d/100) |
| Скидка diff part | discountDiffPartValue | number | 0–100 | 0 | 2-я+ вмятина | ×(1-d/100) |
| Округление | priceRoundStep | number | 0/10/50/100/500 | 0 | Итог | ceil(v/step)×step |
| Ручная скидка | discountPercent | number | 0–100 | 0 | Итог | ×(1-d/100) |
| Цены по размерам | prices[code] | object | — | initialData.basePrice | Circle base | lookup |

localStorage ключ: `dentRepairSettings_v6`.

---

## 10. Quick vs Детализация

| Этап | Quick | Детализация | Совпадает? |
|------|-------|-------------|------------|
| Входные параметры | sizeLengthMm, sizeWidthMm, conditions | bboxMm, type, conditions | ✓ (нормализация) |
| Классификация формы | isStripeCase | isStripeCase | ✓ |
| Базовая цена oval | getBasePriceByMm → getInterpolatedPriceByAreaMm2 | то же | ✓ |
| Базовая цена stripe | calculateStripePriceFromUserBase | то же | ✓ |
| Severity / Complexity | stripe: в таблице; circle: complexityMatrix | то же | ✓ |
| applyConditionsToBase | repair×comp×mat×car×paint + dis + sound | то же | ✓ |
| User multiplier | getPriceMultiplier × base/total | то же | ✓ |
| Multi-dent | calculateSessionTotalWithMultiDentRule | то же | ✓ |
| Ручная скидка | applyDiscount | applyDiscount | ✓ |
| Округление | applyPriceRoundingCeil / Math.round | то же | ✓ |

**Расхождений в математике нет.** Оба режима используют pricingAdapter, priceCalc, multiDentAggregation, settingsUtils.

---

## 11. Пошаговые примеры расчёта

### Пример 1: Круг 90×90 мм, Средняя, Сталь, Стандарт, без доп.

```
Входные:
  shape: circle
  widthMm: 90, heightMm: 90
  riskCode: RK2 (K2)
  repairCode: R1, materialCode: M1, carClassCode: CLASS_STD
  paintMaterialCode: null
  disassembly: Z0, soundInsulation: SI0
  priceAdjustmentRoundOval: 1.0
  manualDiscount: 0%

Шаг 1: areaMm2 = π×45×45 = 6361.7
Шаг 2: Ближайший размер S6 (6361.7), basePrice = 5000 (дефолт)
Шаг 3: compCoeff = 1.40 (S6, K2)
  price = 5000 × 1.0 × 1.40 × 1.0 × 1.0 × 1.0 = 7000
  +0 +0 = 7000
Шаг 4: × 1.0 = 7000
Шаг 5: Одна вмятина, скидка не применяется
Шаг 6: × 1.0 = 7000
Шаг 7: round(7000) = 7000 ₽
```

### Пример 2: Полоса 200×20 мм, h=2, Высокая сложность

```
Входные:
  shape: strip, 200×20 mm
  lengthCm: 20, heightCm: 2
  severity: высокая (K3)

Шаг 1: lookup TABLE_H2, len=20, высокая → 21000
Шаг 2: h=2 → basePrice = 21000
Шаг 3: applyConditionsToBase: compCoeff=1.0 (stripe)
  price = 21000 × 1.0 × 1.0 × 1.0 × 1.0 × 1.0 + 0 + 0 = 21000
Шаг 4: × 1.0 = 21000 ₽
```

### Пример 3: Полоса 120×40 мм, h=4, Средняя

```
lengthCm: 12, heightCm: 4
len=12 < 15 → price4 по safe formula:
  p2at15 = lookup H2, 15, средняя = 12000
  p4at15 = 12000 (TABLE_H4[0].средняя)
  K = 12000/12000 = 1
  price2 = lookup H2, 12, средняя = 9500
  price4Raw = 9500 × 1 = 9500
  price4 = min(9500, 12000) = 9500
h=4 → basePrice = 9500
```

### Пример 4: Полоса 16 см, h=2, легкая — интерполяция по длине

```
len=16 между 15 и 18
t = (16-15)/(18-15) = 1/3
lo = 9000, hi = 11000
price = round(9000 + (11000-9000)×(1/3)) = round(9666.67) = 9667 ₽
```

### Пример 5: Полоса 20 см, h=3, средняя — lerp по height

```
price2 = 16000, price4 = 16500
t = (3-2)/(4-2) = 0.5
price = round(16000 + (16500-16000)×0.5) = 16250 ₽
```

### Пример 6: Две вмятины, один элемент, 50% скидка

```
Вмятина 1: 10000 ₽ (max)
Вмятина 2: 5000 ₽, тот же panelElement
factor[0]=1.0, factor[1]=0.5
weighted = 10000 + 5000×0.5 = 12500 ₽
```

### Пример 7: Две вмятины, разные элементы, diff part 0%

```
Вмятина 1: 10000 ₽
Вмятина 2: 5000 ₽, другой элемент
discountDiffPartValue=0 → factor[1]=1.0
weighted = 10000 + 5000 = 15000 ₽
```

### Пример 8: Круг, площадь между S4 и S6

```
areaMm2 = 4000 (между 2120.6 и 6361.7)
p1=3000 (S4), p2=5000 (S6)
ratio = (4000-2120.6)/(6361.7-2120.6) ≈ 0.443
price = 3000 + (5000-3000)×0.443 ≈ 3886 ₽
```

### Пример 9: Круг, площадь > S11 (экстраполяция)

```
areaMm2 = 200000
areaS11 = 152053, priceS11 = 15000
extraArea = 47947
markup = max(500, 3500×ln(1+47947/50000)) ≈ max(500, 3500×0.64) ≈ 2240
basePrice = 15000 + 2240 = 17240 ₽
```

### Пример 10: Ручная скидка 10%, округление до 100

```
total = 8750
afterDiscount = 8750 × 0.9 = 7875
roundStep = 100
displayTotal = ceil(7875/100)×100 = 7900 ₽
```

### Пример 11: Три вмятины, 50% скидка same part

```
Вмятина 1: 8000 ₽ (max, primary)
Вмятина 2: 6000 ₽, тот же элемент
Вмятина 3: 4000 ₽, тот же элемент
factor = [1.0, 0.5, 0.5]
weighted = 8000 + 3000 + 2000 = 13000 ₽
```

### Пример 12: Алюминий + Премиум + Под покраску

```
basePrice = 5000 (круг S6)
× 0.85 (R2) × 1.40 (K2) × 1.3 (M2) × 1.2 (CLASS_PREM) × 1.0 (paint)
= 5000 × 0.85 × 1.40 × 1.30 × 1.20 = 9282 ₽
```

### Пример 13: Полоса 8 см, h=2, экстра — граница таблицы

```
len=8 = min TABLE_H2 → прямой lookup, без интерполяции
basePrice = 11000 ₽ (экстра)
```

### Пример 14: Полоса 100 см, h=4, средняя — max таблицы

```
len=100 = max TABLE_H4
basePrice = 38000 ₽
```

### Пример 15: Множитель oval 1.1

```
base = 7000, total после коэффициентов = 7000
× 1.1 = 7700 ₽
```

---

## 12. Excel Mapping

| Логический блок | Excel лист | Колонки | Формула в Excel | Примечание |
|----------------|-----------|---------|-----------------|------------|
| Входные параметры | INPUT | A=type, B=widthMm, C=heightMm, D=riskCode, E=repairCode… | — | Желтая заливка |
| Таблица oval (площади) | LOOKUP_OVAL | A=areaMm2, B=code, C=basePrice | VLOOKUP/INDEX+MATCH | Отсортировать по area |
| Таблица stripe h=2 | LOOKUP_STRIPE_H2 | A=len, B=легкая, C=средняя, D=высокая, E=экстра | INDEX+MATCH | |
| Таблица stripe h=4 | LOOKUP_STRIPE_H4 | A=len, B=легкая, C=средняя, D=высокая, E=экстра | INDEX+MATCH | |
| Интерполяция length | CALC | t=(len-lo)/(hi-lo); price=lo+(hi-lo)*t | ROUND | |
| Интерполяция height | CALC | t=(h-2)/2; price=lerp(p2,p4,t) | ROUND | |
| len<15, h=4 | CALC | price4=MIN(price2*K, TABLE_H4[15]) | | K=p4at15/p2at15 |
| complexityMatrix | COEFFICIENTS | A=sizeCode, B=K1, C=K2, D=K3, E=K4 | VLOOKUP | Только circle |
| repairTypes | COEFFICIENTS | A=code, B=mult | VLOOKUP | |
| materials | COEFFICIENTS | A=code, B=mult | VLOOKUP | |
| carClasses | COEFFICIENTS | A=code, B=mult | VLOOKUP | |
| paintMaterials | COEFFICIENTS | A=code, B=mult | VLOOKUP | |
| disassembly/armature | COEFFICIENTS | A=code, B=price | SUM по кодам | |
| soundInsulation | COEFFICIENTS | A=code, B=price | VLOOKUP | |
| User settings | SETTINGS | A=param, B=value | — | Изменяемые |
| Расчёт вмятины | CALC | =base × rep × comp × mat × car × paint + dis + sound | | |
| User multiplier | CALC | =price × priceAdjustment | | |
| Multi-dent | MULTI_DENTS | =IF(idx=maxIdx; total; total*(1-discountRate)) | | |
| Ручная скидка | CALC | =sum × (1-discountPct/100) | | |
| Округление | CALC | =CEILING(value, step) или ROUND | | step=0 → ROUND |

### Рекомендуемая структура листов Excel

```
1. INPUT        — ввод параметров (желтая)
2. LOOKUP_OVAL  — площади S2..S11, basePrice
3. LOOKUP_STRIPE_H2 — таблица h=2
4. LOOKUP_STRIPE_H4 — таблица h=4
5. COEFFICIENTS — repairTypes, materials, carClasses, paintMaterials, complexityMatrix, disassembly, soundInsulation
6. SETTINGS     — priceAdjustmentRoundOval, priceAdjustmentStripe, discountSamePartValue, discountDiffPartValue, priceRoundStep
7. CALC         — основной расчёт (зелёная)
8. MULTI_DENTS  — логика нескольких вмятин
9. SUMMARY      — итог
10. EXAMPLES    — проверочные примеры
```

---

## 13. Неоднозначности / Legacy / Риски

| Место | Что происходит | Почему риск | Как учесть в Excel |
|-------|----------------|-------------|---------------------|
| stripSizes в initialData | L5, L18, … с basePrice — НЕ используются для stripe | Stripe всегда из stripePricing.ts | Игнорировать stripSizes для stripe |
| complexityMatrix.STRIP_DEFAULT | Есть в initialData, но stripe path возвращает 1.0 | Stripe не использует | Для stripe compCoeff=1.0 |
| parseStripeMatrixKey | sizeCode для stripe = "STRIPE_80x10" — для lookup matrix | Stripe всегда 1.0, matrix не используется | — |
| disassembly vs disassemblyCodes | Legacy: disassemblyCode (один). Новое: disassemblyCodes (массив) + disassemblyCost | Арматурные работы: сумма по кодам | Поддерживать оба варианта |
| paintMaterialCode=null | Если showPaintMaterial=false, передаётся null → coeff 1.0 | | |
| area > S11 экстраполяция | markup = max(500, 3500×ln(1+Δ/50000)) | Нелинейная формула | Воспроизвести точно |
| Миграция secondDentDiscount | enableSecondDentDiscount → discountSamePartEnabled, discountDiffPartEnabled=false | Старые настройки | Учитывать при загрузке |
| Округление в priceCalc | roundStep в applyConditionsToBase — round к step | В UI ещё applyPriceRoundingCeil | Два слоя округления возможны |
| graphicsCircleSizes | part.realSizeMm + asset.type==image → circleSizesWithArea; иначе → initialData.circleSizes | initialData.circleSizes имеет `area` (px), не areaMm2; getInterpolatedPriceByAreaMm2 ожидает areaMm2 | Для Excel использовать circleSizesWithArea (dentSizes.js) как источник площадей |

---

## 14. Итоговый список source of truth файлов

| Файл | Что является единственным источником правды |
|------|-------------------------------------------|
| `src/pricing/stripePricing.ts` | Таблицы stripe h=2, h=4, lookup, lerp, mapCoeffClassToSeverity |
| `src/utils/priceAdapter.js` | getInterpolatedPriceByAreaMm2, getBasePriceByMm, ellipseAreaMm2 |
| `src/data/initialData.js` | repairTypes, materials, carClasses, risks, complexityMatrix, disassembly, soundInsulation, paintMaterials |
| `src/data/dentSizes.js` | circleSizesWithArea (areaMm2), stripSizesWithArea |
| `src/data/armaturnayaWorks.js` | ARMATURNAYA_BY_ELEMENT, getArmaturnayaTotalPrice |
| `src/utils/priceCalc.js` | applyConditionsToBase, getComplexityCoeff, calcTotalPrice |
| `src/utils/settingsUtils.js` | getPriceMultiplier, getDiscountRate, migrateSettings |
| `src/utils/multiDentAggregation.js` | calculateSessionTotalWithMultiDentRule |
| `src/features/pricing/pricingAdapter.js` | isStripeCase, calculateDentBasePrice, normalizeGraphicsDentsForPricing |
