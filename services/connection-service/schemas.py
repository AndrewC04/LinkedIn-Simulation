from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ConnectionRequestCreate(BaseModel):
    requester_id: str
    receiver_id: str
    idempotency_key: Optional[str] = None


class ConnectionActionRequest(BaseModel):
    actor_id: str = Field(description="Member performing action")
    idempotency_key: Optional[str] = None


class ConnectionStatusResponse(BaseModel):
    connection_id: str
    requester_id: str
    receiver_id: str
    status: str
    requested_at: datetime
    resolved_at: Optional[datetime] = None


class ConnectionListItem(BaseModel):
    connection_id: str
    member_id: str
    first_name: str
    last_name: str
    status: str
    requested_at: datetime
    resolved_at: Optional[datetime] = None


class ConnectionCountResponse(BaseModel):
    member_id: str
    total_connections: int
