from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.agent_run_repository import AgentRunRepository
from app.repositories.lead_repository import LeadRepository
from app.schemas.agent_run import AgentRunCreateRequest, AgentRunResponse
from app.schemas.lead import LeadCreateRequest, LeadResponse, LeadUpdateRequest
from app.schemas.tools import ToolUpdateLeadRequest

router = APIRouter(prefix="/internal/tools", tags=["internal-tools"])


@router.post("/create_lead", response_model=LeadResponse)
async def tool_create_lead(req: LeadCreateRequest, session: AsyncSession = Depends(get_session)) -> LeadResponse:
    lead = await LeadRepository(session).create_lead(req)
    return LeadResponse(
        id=lead.id,
        client_id=lead.client_id,
        car_id=lead.car_id,
        status=lead.status,
        source=lead.source,
        title=lead.title,
        notes=lead.notes,
        metadata=lead.metadata_json,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@router.post("/update_lead", response_model=LeadResponse)
async def tool_update_lead(req: ToolUpdateLeadRequest, session: AsyncSession = Depends(get_session)) -> LeadResponse:
    lead = await LeadRepository(session).update_lead(req.lead_id, req.patch)
    return LeadResponse(
        id=lead.id,
        client_id=lead.client_id,
        car_id=lead.car_id,
        status=lead.status,
        source=lead.source,
        title=lead.title,
        notes=lead.notes,
        metadata=lead.metadata_json,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@router.post("/log_agent_run", response_model=AgentRunResponse)
async def tool_log_agent_run(
    req: AgentRunCreateRequest, session: AsyncSession = Depends(get_session)
) -> AgentRunResponse:
    run = await AgentRunRepository(session).create_agent_run(req)
    return AgentRunResponse(
        id=run.id,
        lead_id=run.lead_id,
        request_id=run.request_id,
        user_message=run.user_message,
        agent_response=run.agent_response,
        tool_calls=req.tool_calls,
        metadata=run.metadata_json,
        created_at=run.created_at,
    )

