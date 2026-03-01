# DentMetric ТЗ-3 — Phase 1: Инспекция репозитория

**Дата:** 2025-03-02

---

## 1. Навигация и роутинг

| Факт | Значение |
|------|----------|
| vue-router | **Нет** |
| Модель навигации | State-based: `currentSection` (ref) в App.vue |
| Возможные секции | `home`, `metric`, `history`, `settings`, `info`, `analytics`, `journal` |
| Переключение | `switchSection(section)` (App.vue, ~строка 2783) |

**Как добавлять новые маршруты:** Добавить секцию `account` (и подсекции `profile`, `plans`, `paywall`, `onboarding`) через новые блоки `v-if="currentSection === 'account'"` или вложенные состояния. Рекомендуется создать отдельный AccountScreen и переключать `currentAccountView`.

---

## 2. Home и профиль

| Элемент | Путь | Описание |
|---------|------|----------|
| Главный экран | App.vue, WowScreenShell | Тайлы: Метрика, Аналитика (locked), История, Журнал (locked) |
| Кнопка профиля | TopBrandBar | `@profile-click` → `showLockedStub('Раздел в разработке 🔒')` |
| Компонент | `WowScreenShell.vue`, `TopBrandBar.vue` | `show-profile-button`, `profileAriaLabel` |

**Текущее поведение:** Клик по профилю показывает toast "Раздел в разработке 🔒". Нужно заменить на `switchSection('account')` с подвидом profile.

---

## 3. State management

| Факт | Значение |
|------|----------|
| Pinia | **Нет** |
| Composable stores | `useHistoryStore` (historyStore.ts), `useInputModal`, `useSelectModal` |
| package.json | Vue 3.5, Vite 7 — Pinia не в зависимостях |

**Рекомендация:** Добавить Pinia (`pinia` пакет) для useAccountStore — ТЗ явно требует Pinia. Альтернатива: composable `useAccountStore` на ref/reactive без Pinia (минимальные изменения в проекте).

---

## 4. Персистенция

| Ключ/механизм | Файл | Назначение |
|---------------|------|------------|
| `dentmetric_history_v1` | historyStore.ts | История расчётов |
| `dentRepairSettings_v6` | App.vue, settingsUtils | Настройки |
| indexedDB | attachmentStorage.js | Вложения |
| localStorage | Общий | Поддержка проверена (devAudit) |

**Для account:** Использовать `dm_account_token` в localStorage — только JWT, без PII.

---

## 5. Telegram WebApp API

| Использование | Файл:строка |
|---------------|-------------|
| `window.Telegram?.WebApp` | App.vue:2358, 2367, 2755, 2864, 3088–3092, 3107 |
| `expand()`, `ready()` | App.vue:2755, 3089, 3107 |
| `hideTelegramButtons()` | utils/telegramButtons.js, App.vue:3092 |
| **initData** | **Не используется** |

**Требуется:** Читать `window.Telegram?.WebApp?.initData` и передавать на backend для верификации. Только на сервере — BOT_TOKEN никогда в клиенте.

---

## 6. Существующие заготовки ТЗ-3

| Поиск | Результат |
|-------|-----------|
| account, crm, subscription, billing | **Папок нет** |
| plan, paywall, tiers, trial | **Нет** |
| "Доступно в Pro" | Есть в UI (Analytics, Журнал) — заглушка |

---

## 7. HTTP-клиент

| Факт | Значение |
|------|----------|
| axios | Нет |
| fetch | Только main.js → `/meta.json` |
| baseURL | Не задан |
| API client | Нет |

**Требуется:** Создать `accountApi.ts` на нативном `fetch` с `VITE_API_BASE_URL`.

---

## 8. ENV переменные

| Файл | Статус |
|------|--------|
| .env | Не найден |
| .env.example | Не найден |
| .env.local | Не найден |
| VITE_*, API_URL, BOT_TOKEN | Не используются |

**Требуется:** Создать `.env.example` с `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 9. Структура проекта

```
src/
  App.vue              # ~3600 строк, монолит с секциями
  main.js
  components/          # UI компоненты
  composables/         # useInputModal, useSelectModal
  features/
    history/           # historyStore, HistoryScreen
    pricing/           # pricingAdapter, коэффициенты
  utils/               # devAudit, settingsUtils, telegramButtons
  data/                # sizePresets, initialData
```

**Куда добавлять:** `src/modules/account/` — изолированный модуль по ТЗ.

---

## 10. Дизайн-система (styles.css)

- `--metric-green: #88E523`
- `--metric-bg-dark`, `--metric-bg-card`, `--wow-*` токены
- Mobile-first, safe-area, 375px+
- Компоненты: `card-metallic`, `wow-tile`, `home-btn`, `bottom-nav-btn`

---

## ⚠️ ОБЯЗАТЕЛЬНО: ТЗ-3 не прикреплён

**Все конкретные значения по тарифам должны браться строго из ТЗ:**
- Ограничения Free: historyLimit (5?), analyticsBasic, exportPdf и т.д.
- Лимиты Demo: historyLimit (20?), trial 7 дней?
- Master / PRO / Corporate: полная матрица фич, цены, метрики 1–11

**Без ТЗ-3:** Создаваемые `planFeatures.ts` и `PLAN_FEATURES` будут заполнены **placeholders** с явными комментариями `// TODO: уточнить в ТЗ`. Финальные значения — после получения PDF.

---

## Рекомендуемый порядок работ

1. **Получить ТЗ-3** от пользователя (PDF/текст).
2. Установить зависимости: `pinia`, `@supabase/supabase-js` (если Supabase).
3. Создать `src/modules/account/` со структурой из ТЗ.
4. Интегрировать в App.vue: заменить `showLockedStub` на `switchSection('account')`, добавить AccountScreen.
5. Backend: Supabase или альтернатива (сверить с пользователем).
