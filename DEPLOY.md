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

Если сайт отдаётся **из подкаталога** (например GitHub Pages `https://user.github.io/DentMetric/`), перед сборкой задайте в `.env.production`:

```env
VITE_BASE_PATH=/DentMetric
```

(имя каталога без пробелов, без завершающего слэша — в конфиге путь нормализуется до `/DentMetric/`).

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
