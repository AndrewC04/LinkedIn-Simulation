from datetime import datetime
from typing import Optional

import bootstrap  # noqa: F401
from fastapi import FastAPI, HTTPException, Query

from kafka_client import MessagingProducer
from repository import (
    create_thread,
    ensure_indexes,
    get_thread,
    list_messages,
    list_threads_for_member,
    mark_thread_read,
    send_message,
    total_unread_count,
)
from schemas import (
    CreateThreadRequest,
    MarkReadRequest,
    MessageResponse,
    SendMessageRequest,
    ThreadResponse,
)

app = FastAPI(title="Messaging Service", version="0.1.0")
producer = MessagingProducer()


@app.on_event("startup")
def startup() -> None:
    ensure_indexes()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "messaging"}


@app.post("/threads", response_model=ThreadResponse)
def create_thread_endpoint(request: CreateThreadRequest):
    try:
        return create_thread(request.participant_ids)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/threads", response_model=list[ThreadResponse])
def list_threads_endpoint(
    member_id: str = Query(...), limit: int = Query(default=20, ge=1, le=100)
):
    return list_threads_for_member(member_id=member_id, limit=limit)


@app.get("/threads/{thread_id}/messages", response_model=list[MessageResponse])
def list_messages_endpoint(
    thread_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    before: Optional[datetime] = Query(default=None),
):
    try:
        thread = get_thread(thread_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid thread id") from exc

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    return list_messages(thread_id=thread_id, limit=limit, before=before)


@app.post("/threads/{thread_id}/messages", response_model=MessageResponse)
def send_message_endpoint(thread_id: str, request: SendMessageRequest):
    try:
        thread = get_thread(thread_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid thread id") from exc

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    try:
        message = send_message(
            thread_id=thread_id,
            sender_id=request.sender_id,
            text=request.text,
            idempotency_key=request.idempotency_key,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    recipient_ids = [
        pid for pid in thread["participant_ids"] if pid != request.sender_id
    ]
    producer.publish_message_sent(
        actor_id=request.sender_id,
        thread_id=thread_id,
        message_id=message["message_id"],
        recipient_ids=recipient_ids,
        preview=request.text[:120],
        idempotency_key=request.idempotency_key,
    )
    return message


@app.patch("/threads/{thread_id}/read")
def mark_read_endpoint(thread_id: str, request: MarkReadRequest):
    try:
        mark_thread_read(thread_id=thread_id, member_id=request.member_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid thread id") from exc

    return {"ok": True, "thread_id": thread_id, "member_id": request.member_id}


@app.get("/members/{member_id}/unread-count")
def unread_count_endpoint(member_id: str):
    return {"member_id": member_id, "unread_count": total_unread_count(member_id)}
