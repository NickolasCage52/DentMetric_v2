# DentMetric

Vue 3 + Vite + Konva. Приложение для оценки вмятин на кузове авто.

## On‑prem MVP (monorepo)

В этом репозитории добавлен каркас on‑prem MVP (микросервисы + Postgres) в папках:

- `services/core-api`
- `services/agent-orchestrator`
- `services/model-server`
- `services/rag-service`
- `apps/ui`

Запуск (нужен установленный Docker):

```bash
make up
```

Тесты:

```bash
make test
```

## Как задеплоить

1. `npm ci`
2. `npm run deploy:setup` — один раз (проверяет origin, создаёт ветку gh-pages при необходимости)
3. `npm run deploy` — каждый раз (сборка + пуш dist в gh-pages)

**Важно:** В GitHub → Settings → Pages выберите **Source: Deploy from a branch**, **Branch: gh-pages** с корнем `/ (root)`.
