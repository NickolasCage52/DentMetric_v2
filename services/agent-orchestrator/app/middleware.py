import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()
        resp = await call_next(request)
        resp.headers["X-Request-Id"] = request_id
        resp.headers["X-Response-Time-Ms"] = str(int((time.perf_counter() - start) * 1000))
        return resp

