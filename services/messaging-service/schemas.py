from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CreateThreadRequest(BaseModel):
    participant_ids: List[str] = Field(min_length=2)


class SendMessageRequest(BaseModel):
    sender_id: str
    text: str = Field(min_length=1, max_length=5000)
    idempotency_key: Optional[str] = None


class MarkReadRequest(BaseModel):
    member_id: str


class ThreadResponse(BaseModel):
    thread_id: str
    participant_ids: List[str]
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    message_id: str
    thread_id: str
    sender_id: str
    text: str
    created_at: datetime
    status: str
