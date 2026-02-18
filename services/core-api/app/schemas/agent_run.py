from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.base import APIModel


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


class AgentRunResponse(APIModel):
    id: UUID
    lead_id: UUID
    request_id: str | None
    user_message: str
    agent_response: str
    tool_calls: list[ToolCall]
    metadata: dict
    created_at: datetime

