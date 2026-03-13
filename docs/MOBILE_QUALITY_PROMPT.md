# Промпт для максимум качественной мобильной версии DentMetric

> Используй этот промпт при работе над мобильной вёрсткой, чтобы результат совпадал с тем, что видно при локальной разработке, и корректно отображался в production (GitHub Pages / Telegram Mini App).

---

## Контекст проекта

- **Стек**: Vue 3, Vite, Tailwind (CDN), Telegram Web App
- **Деплой**: `npm run deploy` — собирает dist и пушит в ветку `gh-pages`. Важно: `git push` обновляет только main, но **сайт отдаётся с gh-pages**.
- **Base path**: `/DentMetric/` (vite.config.js)
- **Телеграм**: viewport-fit=cover, safe-area-insets, специфичное поведение WebView

---

## Текст промпта (скопируй и вставь)

```
Задача: привести мобильную версию DentMetric к 1:1 соответствию с тем, как она отображается при локальной разработке (npm run dev, viewport 375×667 или реальное устройство).

Проверь и исправь следующее:

## 1. Синхронизация: локаль ↔ GitHub ↔ Production
- Все ли изменения закоммичены? git status — должно быть "nothing to commit"
- Был ли выполнен `npm run deploy` после push? (Сайт берётся из gh-pages, не из main)
- Если только push — GitHub Pages показывает старую сборку. Нужно: npm run build && npm run deploy

## 2. Viewport и meta (index.html)
- viewport: width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover
- viewport-fit=cover — обязательно для Telegram/ notch устройств

## 3. Safe-area во всех фиксированных элементах
Проверить наличие env(safe-area-inset-*) в:
- Нижняя навигация (bottom-nav): pl/pr/pb с safe-area
- Модальные окна: pb-[calc(1.25rem+env(safe-area-inset-bottom))]
- StepHeader, GraphicsWizard controls area
- Все fixed элементы внизу экрана

## 4. Responsive breakpoints (единый референс)
- 320px — минимальная ширина (ClientFoundCard, Step1Placement)
- 340px — очень узкие экраны
- 360px — Step2SizePanel
- 375px — iPhone SE / базовый мобильный
- 480px — граница mobile / compact (Step1, Step2, Step3, Step4)
- 640px (sm:) — modals: items-end → items-center, rounded-t-2xl → rounded-2xl
- 641px — wow-screen padding
- 768px — десктоп

## 5. Touch targets
- Минимум 44px по высоте для кнопок
- min-height: 42px для qc-geo-btn, qc-cta
- Отступы между кликабельными элементами ≥ 8px

## 6. Overflow и скролл
- overflow-x: hidden на body / app-root
- -webkit-overflow-scrolling: touch для скролл-областей
- min-width: 0 на flex-детях, чтобы текст не выходил за границы

## 7. Размеры и шрифты (CSS vars)
- --dm-detail-font-xs: 10px, sm: 11px, md: 13px
- --bottom-nav-h: calc(64px + env(safe-area-inset-bottom))
- --content-max-w: 380px для центральных блоков

## 8. Ассеты и base path
- vite.config base: '/DentMetric/'
- Иконки/лого: проверь, что пути работают в production (public/ или импорт)
- konvaEditor: parts загружаются как /DentMetric/parts/... в prod

## 9. Tailwind CDN vs build
- Сейчас Tailwind через CDN (JIT). При медленной сети могут быть задержки стилей.
- Если видишь "мерцание" или неполную загрузку — рассмотри внедрение Tailwind как build-time зависимость для стабильности.

## 10. Тестирование
- npm run build && npm run preview — проверить production build локально
- e2e/mobile.spec.js: viewport 375×667
- Реальный девайс или Chrome DevTools: Device toolbar, разные разрешения (320, 375, 414)
- Telegram: @WebAppBot или реальный бот — viewport в WebView может отличаться от браузера

Результат: мобильная версия на production должна визуально и функционально совпадать с локальным dev. Никаких "не подтянувшихся" изменений.
```

---

## Быстрая диагностика: "на экране одно, на GitHub другое"

| Ситуация | Решение |
|----------|---------|
| Только `git push` сделан | Выполни `npm run deploy` — он обновляет gh-pages (откуда идёт сайт) |
| Есть несохранённые изменения в IDE | Сохрани файлы, затем git add / commit / push / deploy |
| dist в .gitignore | Это правильно: dist не хранится в репо, собирается при deploy |
| Кэш браузера / CDN | Hard refresh (Ctrl+Shift+R) или инкогнито |
| Разный base URL | Локально: `/`, Prod: `/DentMetric/` — проверь vite.config base |

---

## Команды для проверки

```bash
# 1. Всё закоммичено?
git status

# 2. Сборка и локальный preview production
npm run build && npm run preview

# 3. Деплой на GitHub Pages
npm run deploy

# 4. E2E на мобильном viewport
npm run test:e2e
```
