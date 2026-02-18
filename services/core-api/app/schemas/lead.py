from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.base import APIModel


class ClientUpsert(APIModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None


class CarUpsert(APIModel):
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    vin: str | None = None
    engine: str | None = None
    mileage_km: int | None = Field(default=None, ge=0)


class LeadCreateRequest(APIModel):
    client: ClientUpsert | None = None
    car: CarUpsert | None = None
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

