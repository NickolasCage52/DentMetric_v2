from fastapi import FastAPI

from app.api.internal_tools import router as internal_tools_router
from app.api.leads import router as leads_router
from app.logging import configure_logging
from app.middleware import RequestIdMiddleware


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="core-api", version="0.1.0")
    app.add_middleware(RequestIdMiddleware)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(leads_router)
    app.include_router(internal_tools_router)

    return app


app = create_app()

