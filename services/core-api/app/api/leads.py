from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadCreateRequest, LeadResponse, LeadUpdateRequest

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.post("", response_model=LeadResponse)
async def create_lead(req: LeadCreateRequest, session: AsyncSession = Depends(get_session)) -> LeadResponse:
    repo = LeadRepository(session)
    lead = await repo.create_lead(req)
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


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: UUID, session: AsyncSession = Depends(get_session)) -> LeadResponse:
    repo = LeadRepository(session)
    lead = await repo.get_lead(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="lead_not_found")
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


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID, req: LeadUpdateRequest, session: AsyncSession = Depends(get_session)
) -> LeadResponse:
    repo = LeadRepository(session)
    try:
        lead = await repo.update_lead(lead_id, req)
    except KeyError:
        raise HTTPException(status_code=404, detail="lead_not_found") from None
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

