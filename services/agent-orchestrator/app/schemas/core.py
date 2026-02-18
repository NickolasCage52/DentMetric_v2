from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.base import APIModel


class LeadCreateRequest(APIModel):
    client: dict | None = None
    car: dict | None = None
    source: str | None = None
    title: str | None = None
    notes: str | None = None
    metadata: dict = Field(default_factory=dict)


class LeadUpdateRequest(APIModel):
    status: str | None = None
    title: str | None = None
    notes: str | None = None
    metadata: dict | None = None


class LeadResponse(APIModel):
    id: UUID
    client_id: UUID | None
    car_id: UUID | None
    status: str
    source: str | None
    title: str | None
    notes: str | None
    metadata: dict
    created_at: datetime
    updated_at: datetime


class ToolUpdateLeadRequest(APIModel):
    lead_id: UUID
    patch: LeadUpdateRequest


class ToolCall(APIModel):
    tool_name: str
    args: dict = Field(default_factory=dict)
    result_summary: str
    error: str | None = None
    duration_ms: int = Field(ge=0)


class AgentRunCreateRequest(APIModel):
    lead_id: UUID
    request_id: str | None = None
    user_message: str
    agent_response: str
    tool_calls: list[ToolCall] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)

