from uuid import UUID

from app.schemas.base import APIModel
from app.schemas.lead import LeadUpdateRequest


class ToolUpdateLeadRequest(APIModel):
    lead_id: UUID
    patch: LeadUpdateRequest

