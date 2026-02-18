from __future__ import annotations

from uuid import UUID

from pydantic import Field

from app.schemas.base import APIModel


class AgentMessageRequest(APIModel):
    lead_id: UUID | None = None
    message: str = Field(min_length=1)


class AgentMessageResponse(APIModel):
    lead_id: UUID
    intent: str
    slots: dict = Field(default_factory=dict)
    summary: str
    questions: list[str] = Field(default_factory=list)
    next_step: str | None = None

