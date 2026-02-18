from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

import httpx

from app.schemas.core import AgentRunCreateRequest, LeadCreateRequest, LeadResponse, ToolUpdateLeadRequest


class CoreApiError(RuntimeError):
    pass


@dataclass(frozen=True)
class ToolCallLog:
    tool_name: str
    args: dict[str, Any]
    result_summary: str
    error: str | None
    duration_ms: int


def _base_url() -> str:
    url = os.getenv("CORE_API_BASE_URL", "http://core-api:8000").rstrip("/")
    return url


class CoreApiClient:
    def __init__(self, request_id: str | None) -> None:
        self.request_id = request_id

    def _headers(self) -> dict[str, str]:
        return {"X-Request-Id": self.request_id} if self.request_id else {}

    async def create_lead(self, req: LeadCreateRequest) -> tuple[LeadResponse, ToolCallLog]:
        started = time.perf_counter()
        err: str | None = None
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(f"{_base_url()}/internal/tools/create_lead", json=req.model_dump(), headers=self._headers())
                r.raise_for_status()
                lead = LeadResponse.model_validate(r.json())
            summary = f"created lead {lead.id}"
            return lead, ToolCallLog("create_lead", req.model_dump(), summary, None, _dur_ms(started))
        except Exception as e:  # noqa: BLE001
            err = str(e)
            raise CoreApiError(err) from e

    async def update_lead(self, req: ToolUpdateLeadRequest) -> tuple[LeadResponse, ToolCallLog]:
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(f"{_base_url()}/internal/tools/update_lead", json=req.model_dump(), headers=self._headers())
                r.raise_for_status()
                lead = LeadResponse.model_validate(r.json())
            summary = f"updated lead {lead.id}"
            return lead, ToolCallLog("update_lead", req.model_dump(), summary, None, _dur_ms(started))
        except Exception as e:  # noqa: BLE001
            err = str(e)
            raise CoreApiError(err) from e

    async def log_agent_run(self, req: AgentRunCreateRequest) -> tuple[dict, ToolCallLog]:
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(f"{_base_url()}/internal/tools/log_agent_run", json=req.model_dump(), headers=self._headers())
                r.raise_for_status()
                payload = r.json()
            summary = "logged agent run"
            return payload, ToolCallLog("log_agent_run", req.model_dump(), summary, None, _dur_ms(started))
        except Exception as e:  # noqa: BLE001
            err = str(e)
            raise CoreApiError(err) from e


def _dur_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)

