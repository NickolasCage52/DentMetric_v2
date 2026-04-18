# Деплой DentMetric как обычного сайта

Сборка — статический SPA (Vue + Vite). Бэкенд для этой инструкции не обязателен: приложение уже умеет работать офлайн/без API.

## Сборка

```bash
npm install
npm run build
```

В каталоге `dist/` появятся `index.html`, `assets/`, при необходимости скопируйте всё **в корень** сайта на хостинге (REG.RU / ispmanager: обычно `public_html` или папка домена).

Проверка локально:

```bash
npm run preview
```

## Базовый URL (корень домена)

По умолчанию `vite.config.js` задаёт `base: '/'` — подходит для `https://example.com/`.

Если сайт отдаётся **из подкаталога** (project pages: `https://user.github.io/DentMetric_v2/`), путь к ассетам должен включать имя репозитория.

- **Рекомендуется:** в репозитории есть файл `.env.github-pages` с `VITE_BASE_PATH=DentMetric_v2` (подставьте своё имя репо). Сборка под Pages: `npm run build:gh-pages`.
- **`npm run deploy`** вызывает как раз `build:gh-pages`, затем пушит `dist` в ветку `gh-pages`. Если ветки **`gh-pages` на GitHub ещё нет**, скрипт создаёт её первым push’ем из временной копии `dist` (`--force` только для этой ветки).
- **`npm run deploy:setup`** только проверяет `origin` и подсказывает, есть ли уже `gh-pages`.
- Локально для обычного прод-сайта в корне домена по-прежнему: `npm run build` (base `/`).

Альтернатива: задать то же в `.env.production` (файл у вас в `.gitignore`) перед `npm run build`.

## Apache / ispmanager

В репозитории есть шаблон `public/.htaccess`: он попадает в `dist/` при сборке. Убедитесь, что на сервере включён `mod_rewrite` и что `.htaccess` не игнорируется настройками vhost.

Сейчас приложение **не использует** отдельные URL маршрутов Vue Router — открывается одна страница; fallback всё равно полезен для будущих изменений и прямых запросов к несуществующим файлам.

## Nginx

Пример для корня домена:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Telegram

Скрипт `telegram-web-app.js` в `index.html` не ломает обычный браузер. Вызовы API обёрнуты: без Telegram WebApp приложение запускается как обычный сайт.

## GitHub Pages

### Вариант A — GitHub Actions (рекомендуется)

В репозитории есть workflow **`.github/workflows/deploy-github-pages.yml`**: при каждом push в **`main`** выполняется `npm run build:gh-pages` (берёт `VITE_BASE_PATH` из **`.env.github-pages`**) и ветка **`gh-pages`** перезаписывается содержимым `dist` (`force_orphan`, без ручного `npm run deploy`).

В **Settings → Pages** выберите источник **Deploy from a branch**, ветка **`gh-pages`**, папка **`/`**.

### Вариант B — локально `npm run deploy`

Как раньше: скрипт `scripts/deploy.js` после сборки пушит в `gh-pages`.

### Vercel (без подкаталога, чаще проще, чем `*.github.io/Repo/`)

Сайт открывается как **`https://<проект>.vercel.app/`** с **`base: '/'`** — отдельно задавать `VITE_BASE_PATH` не нужно, чёрный экран из‑за неверного base обычно пропадает.

1. Зайдите на [vercel.com](https://vercel.com), **Add New → Project**, импортируйте этот репозиторий.
2. Framework Preset: **Vite** (или оставьте авто). Build: **`npm run build`**, Output: **`dist`** (совпадает с **`vercel.json`**).
3. В **Environment Variables** при необходимости добавьте `VITE_*` из `.env.local` (Supabase и т.д.), без секретов в публичном виде не кладите service role.
4. Deploy. Для Vue Router в репозитории уже есть **`vercel.json`** с fallback на `index.html`.

Не коммитьте секреты; каталог `dist/` в git обычно не нужен (см. `.gitignore`).
