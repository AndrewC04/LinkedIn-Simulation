from pydantic import BaseModel
from typing import Any, Dict, Optional


# Inbound event (POST /events/ingest)

class EntityModel(BaseModel):
    entity_type: str
    entity_id: str


class IngestEventRequest(BaseModel):
    event_type: str
    trace_id: Optional[str] = None
    timestamp: Optional[str] = None
    actor_id: str
    entity: EntityModel
    payload: Dict[str, Any] = {}
    idempotency_key: Optional[str] = None


# Analytics query responses

class TopJobsResponse(BaseModel):
    job_id: str
    count: int


class FunnelResponse(BaseModel):
    job_id: str
    viewed: int
    saved: int
    applied: int
    submitted: int


class GeoResponse(BaseModel):
    city: str
    count: int


class MemberDashboardResponse(BaseModel):
    member_id: str
    profile_views: int
    application_status_breakdown: Dict[str, int]


class StatusResponse(BaseModel):
    status: str
    message: str