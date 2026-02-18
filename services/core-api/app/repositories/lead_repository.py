from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.car import Car
from app.models.client import Client
from app.models.lead import Lead
from app.schemas.lead import CarUpsert, ClientUpsert, LeadCreateRequest, LeadUpdateRequest


class LeadRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_lead(self, req: LeadCreateRequest) -> Lead:
        client_id: UUID | None = None
        car_id: UUID | None = None

        if req.client is not None and _has_any_value(req.client):
            client = Client(**_client_to_dict(req.client))
            self.session.add(client)
            await self.session.flush()
            client_id = client.id

        if req.car is not None and _has_any_value(req.car):
            car = Car(client_id=client_id, **_car_to_dict(req.car))
            self.session.add(car)
            await self.session.flush()
            car_id = car.id

        lead = Lead(
            client_id=client_id,
            car_id=car_id,
            status="open",
            source=req.source,
            title=req.title,
            notes=req.notes,
            metadata_json=req.metadata or {},
        )
        self.session.add(lead)
        await self.session.commit()
        await self.session.refresh(lead)
        return lead

    async def get_lead(self, lead_id: UUID) -> Lead | None:
        res = await self.session.execute(select(Lead).where(Lead.id == lead_id))
        return res.scalar_one_or_none()

    async def update_lead(self, lead_id: UUID, req: LeadUpdateRequest) -> Lead:
        lead = await self.get_lead(lead_id)
        if lead is None:
            raise KeyError("lead_not_found")

        if req.status is not None:
            lead.status = req.status
        if req.title is not None:
            lead.title = req.title
        if req.notes is not None:
            lead.notes = req.notes
        if req.metadata is not None:
            lead.metadata_json = req.metadata

        await self.session.commit()
        await self.session.refresh(lead)
        return lead


def _has_any_value(model) -> bool:
    return any(v is not None and v != "" for v in model.model_dump().values())


def _client_to_dict(c: ClientUpsert) -> dict:
    return {k: v for k, v in c.model_dump().items() if v is not None}


def _car_to_dict(c: CarUpsert) -> dict:
    return {k: v for k, v in c.model_dump().items() if v is not None}

