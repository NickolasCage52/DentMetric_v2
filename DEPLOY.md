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
- **`npm run deploy`** вызывает как раз `build:gh-pages`, затем пушит `dist` в ветку `gh-pages`.
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

## Старый деплой на GitHub Pages

Скрипт `npm run deploy` по-прежнему собирает проект и пушит `dist`. Для project pages задайте `VITE_BASE_PATH` под имя репозитория, иначе ресурсы будут искаться с корня `base`.
