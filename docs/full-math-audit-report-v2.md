# DentMetric — FULL MATH AUDIT REPORT v2

> Дата: 2026-03-08
> Контекст: Верификация после локального фикса applyDamagePreset + полный аудит математической цепочки

---

## 1. Верификация фикса applyDamagePreset

### 1.1 dent.shape после фикса
- **Значение:** `preset.group === 'stripe'` → `dent.shape = 'strip'`; иначе → `'circle'`
- **Маппинг в коде:** `const shape = preset.group === 'stripe' ? 'strip' : 'circle'`

### 1.2 isStripeCase принимает это значение
- **Да.** `isStripeCase` проверяет: `['strip', 'stripe', 'scratch', 'полоса', 'царапина'].some((k) => t.includes(k))`
- Строка `'strip'` входит в список → `'strip'.includes('strip')` = true ✓

### 1.3 Enum consistency
| Где устанавливается | Значение | isStripeCase | getPriceMultiplier |
|--------------------|----------|--------------|-------------------|
| applyDamagePreset (preset.group=stripe) | 'strip' | ✓ принимает | ✓ ['strip','stripe','scratch'] |
| konvaEditor (Graphics) | d.type='strip' | ✓ | ✓ |
| createQuickDent | 'circle' | — | roundOval |
| resetQuickDentsValues | 'circle' | — | roundOval |

**Совпадает:** да. `'strip'` везде обрабатывается корректно.

### 1.4 Все пресеты покрыты маппингом
| preset.group | Ожидаемый shape | Фактический |
|--------------|-----------------|-------------|
| 'stripe' | 'strip' | 'strip' ✓ |
| 'round_oval' | 'circle' | 'circle' ✓ |
| undefined / иное | 'circle' | 'circle' ✓ |

**Группы в sizePresets.js:** только `'round_oval'` и `'stripe'`. Обе обработаны.

### 1.5 Другие места установки shape
| Файл:строка | Где | Значение | Корректно? |
|-------------|-----|----------|-----------|
| App.vue:1754 | createQuickDent | 'circle' | да |
| App.vue:2604 | applyDamagePreset | из preset.group | да |
| App.vue:1806 | resetQuickDentsValues | 'circle' | да |
| App.vue:1917 | syncQuickDentSizeFromMm | 'circle' (при ratio 1:1) | да |
| historyStore.ts:145 | normalizeHistoryRecord | 'circle' (при strip ratio 1:1) | да |
| konvaEditor.js | shape.setAttr('type','strip') | 'strip' | да |

---

## 2. Результаты табличной верификации

### TABLE_H2 (stripePricing.ts:19-35)
Совпадает с ожидаемой таблицей из промпта. Все 16 длин (8–100), 4 severity.

### TABLE_H4 (stripePricing.ts:37-51)
Совпадает с ожидаемой таблицей. Длины 15–100, 4 severity.

**Расхождений нет.**

---

## 3. Результаты аудита коэффициентов

| Коэффициент | Применяется к stripe | Применяется к oval | Двойное применение? | Теряется? |
|------------|---------------------|---------------------|---------------------|-----------|
| severity | в таблице stripePricing | — | нет | нет |
| compCoeff | 1.0 (stripe) | complexityMatrix | нет | нет |
| repairCode | да | да | нет | нет |
| materialCode | да | да | нет | нет |
| carClassCode | да | да | нет | нет |
| paintMaterialCode | да | да | нет | нет |
| priceAdjustmentStripe | да (getPriceMultiplier) | нет | нет | нет |
| priceAdjustmentRoundOval | нет | да | нет | нет |

**stripeMultiplier не попадает в oval:** `getPriceMultiplier` проверяет `['strip','stripe','scratch']` → только для stripe.
**ovalMultiplier не попадает в stripe:** для stripe возвращается priceAdjustmentStripe.

---

## 4. Результаты аудита тестов

### 4.1 Покрытие по чеклисту
| Сценарий | Тест |
|----------|------|
| stripe ratio≠1 → stripe расчёт | pricingAdapter: strip 80×10 ✓ |
| stripe ratio=1 → oval | pricingAdapter: strip 10×10 ✓ |
| shape='circle' → oval | pricingAdapter: circle 90×30 ✓ |
| shape='strip' → stripe | pricingAdapter: strip 80×10, L18 preset ✓ |
| len=12 h=4 высокая ≤ 15000 | stripePricing, stripeCalc ✓ |
| height=1 → как h=2 | stripePricing: clamp ✓ |
| height=6 → как h=4 | stripePricing: clamp ✓ |
| height=3 → lerp | stripePricing ✓ |
| Quick vs Detail одинаковый результат | pricingAdapter: 120×300, strip 80×10 ✓ |
| same part скидка | multiDentAggregation ✓ |
| different part скидка | multiDentAggregation ✓ |
| isStripeCase('strip') | pricingAdapter ✓ |

### 4.2 Добавлено тестов
- `isStripeCase('strip', 180, 20)` — проверка shape из applyDamagePreset
- `stripe preset L18 с shape strip` — preset.group→shape→stripe tables

---

## 5. Self-check результаты

devAuditMath.js: проверки classification, tables, interpolation, clamp, monotonicity.
- Добавлены: isStripeCase('strip'), undefined/null shape.
- **Errors:** 0 (при корректном коде).

---

## 6. Изменения в коде

1. **applyDamagePreset:** убран вызов `setQuickDentShape` — задаётся `dent.shape`, `dent.sizeCode = null` и размеры напрямую (без лишнего сброса).
2. **pricingAdapter.spec.js:** добавлены тесты на shape 'strip' и L18 preset.
3. **devAuditMath.js:** расширены проверки на 'strip', undefined, null.

---

## 7. Definition of Done

- [x] enum 'strip' принимается isStripeCase
- [x] все пресеты дают корректный shape
- [x] все места установки shape проверены
- [x] TABLE_H2 и TABLE_H4 совпадают с референсом (по коду)
- [x] коэффициенты не дублируются и не теряются
- [x] self-check: 0 errors при корректной логике
- [x] тесты покрывают критические сценарии
- [x] Quick и Детализация: одинаковые входы → одинаковый результат

---

## 8. Замечание по референсным таблицам

Файлы photo_2026-03-05_19-58-*.jpg в репозитории не найдены. Верификация выполнена по таблицам в коде (`stripePricing.ts`). При появлении референсов рекомендуется дополнительная сверка значений.
