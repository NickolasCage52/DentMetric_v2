# ARCHITECTURE MAP: DentMetric Detail Mode (Photo-First Refactor)

## DETAIL FLOW MAP (актуально после аудита 2025-03)

### Активные шаги Detail flow (usePhotoBasedFlow = true)

| Шаг | Файл | Описание |
|-----|------|----------|
| 1 | QuickStyleClientSection.vue | Данные клиента (если showClientStep) |
| 2 | StepPhotoSelect.vue | Фото/галерея — выбор фото повреждения |
| 3 | Step1PlacementPanel.vue | Размещение вмятин на фото (canvas + Konva) |
| 4 | QuickStyleStep2Section.vue | Ввод параметров × N вмятин (размеры, условия) |
| 5 | QuickStyleFinalSection.vue | Итоговый экран + фото |

### Legacy-шаги (НЕ в активном photo flow)

- **Step2SizePanel.vue** — используется только при `usePhotoBasedFlow=false` (шаг 3)
- **QuickStyleConditionsSection.vue** — при `usePhotoBasedFlow=false` (шаг 4)
- Отдельных экранов «Сторона автомобиля», «Поврежденный элемент», «Геометрия» — **нет** в активном flow. Тексты «Геометрия повреждения», «Поврежденный элемент» — лейблы внутри Step2SizePanel / QuickStyleStep2Section.

### Quick эталонные компоненты

| Экран | Компонент |
|-------|-----------|
| Client | QuickStyleClientSection.vue |
| Dent input (размеры + условия) | QuickStyleStep2Section.vue |
| Final | QuickStyleFinalSection.vue |

### Multi-dent

- **Источник**: `dents` ref в GraphicsWizard, синхронизация с `getDents()` из konvaEditor при переходе на шаг 4
- **Per-dent условия**: `detailDentConditions` (map dentId → conditions)
- **Индекс**: `detailDentIndex` (0-based)

### Нумерация

- **На canvas**: `_dimLabel` в konvaEditor — только W×H, номера вмятин **добавить**
- **В заголовке step 4**: `detail-dent-badge` — «Вмятина N из M» (text-[18px])

---

## Phase 0 — Inspection Results (исторические)

### 0.1 Текущий режим "Детализация"
- **Entry**: `GraphicsWizard.vue` (App.vue → calcMode='graphics')
- **Vehicle selection**: StepHeader.vue (скрыт при usePhotoBasedFlow)
- **Canvas / Konva stage**: `src/graphics/konvaEditor.js`
- **Wizard steps**: см. таблицу выше

### 0.2 Quick-компоненты
- QuickStyleConditionsSection, QuickStyleFinalSection, QuickStyleStep2Section, QuickStyleClientSection

### 0.3 Модель данных
- **Dent**: id, type, bboxMm, areaMm2, photoAssetKey
- **Estimate**: dents[], estimateDraft, detailDentConditions

---

## DETAIL MODE COMPLETION REPORT (2025-03)

### Активный flow после фикса
- Шаг 1: QuickStyleClientSection.vue — Клиент (если showClientStep)
- Шаг 2: StepPhotoSelect.vue — Фото/галерея
- Шаг 3: Step1PlacementPanel.vue — Размещение вмятин
- Шаг 4: QuickStyleStep2Section.vue — Ввод параметров × N вмятин
- Шаг 5: QuickStyleFinalSection.vue — Итог + фото

### Legacy
- Отдельных экранов «Сторона», «Элемент», «Геометрия» в активном flow нет
- Step2SizePanel, QuickStyleConditionsSection — только при usePhotoBasedFlow=false

### Визуальный паритет
- Client screen: QuickStyleClientSection (идентичен Quick)
- Dent input: QuickStyleStep2Section (идентичен Quick step 2)
- Final screen: QuickStyleFinalSection + detailPhotoUrl (идентичен Quick + блок фото)

### Multi-dent propagation
- Синхронизация dents с getDents() при переходе на шаг 4
- DEV assertion: console.error при пустом dents[] после placement

### Нумерация
- Canvas (Konva): _numLabel — fontSize 18, stroke 2, контраст на фото
- Badge step 4: круглый badge + «Вмятина N из M» (text-[18px])

### Photo в истории
- photoAssets включает mainPhotoKey из getPhotoAssetKey()
