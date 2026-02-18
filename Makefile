.PHONY: up down logs fmt lint test migrate makemigrations seed

up:
	docker compose up --build

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

fmt:
	docker compose run --rm core-api bash -lc "python -m black ."
	docker compose run --rm core-api bash -lc "python -m ruff check . --fix"
	docker compose run --rm agent-orchestrator bash -lc "python -m black ."
	docker compose run --rm agent-orchestrator bash -lc "python -m ruff check . --fix"

lint:
	docker compose run --rm core-api bash -lc "python -m ruff check ."
	docker compose run --rm agent-orchestrator bash -lc "python -m ruff check ."

test:
	docker compose run --rm core-api bash -lc "pytest -q"
	docker compose run --rm agent-orchestrator bash -lc "pytest -q"

migrate:
	docker compose run --rm core-api bash -lc "alembic upgrade head"

makemigrations:
	docker compose run --rm core-api bash -lc "alembic revision --autogenerate -m \"$(msg)\""

seed:
	docker compose run --rm core-api bash -lc "python -m app.scripts.seed"

