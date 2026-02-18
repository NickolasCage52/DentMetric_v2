from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_run import AgentRun
from app.schemas.agent_run import AgentRunCreateRequest


class AgentRunRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_agent_run(self, req: AgentRunCreateRequest) -> AgentRun:
        run = AgentRun(
            lead_id=req.lead_id,
            request_id=req.request_id,
            user_message=req.user_message,
            agent_response=req.agent_response,
            tool_calls=[t.model_dump() for t in req.tool_calls],
            metadata_json=req.metadata,
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)
        return run

