from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import bootstrap  # noqa: F401
from kafka_client import ConnectionsProducer
from repository import (
    accept_connection,
    count_accepted_connections,
    get_connection_status,
    list_accepted_connections,
    list_pending_received,
    list_pending_sent,
    reject_connection,
    remove_connection,
    request_connection,
    withdraw_connection_request,
)
from schemas import (
    ConnectionActionRequest,
    ConnectionCountResponse,
    ConnectionListItem,
    ConnectionRequestCreate,
    ConnectionStatusResponse,
)

app = FastAPI(title="Connection Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
producer = ConnectionsProducer()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "connections"}


@app.post("/connections/requests", response_model=ConnectionStatusResponse)
def create_connection_request(request: ConnectionRequestCreate):
    try:
        conn = request_connection(request.requester_id, request.receiver_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    producer.publish_connection_requested(
        actor_id=request.requester_id,
        connection_id=conn["connection_id"],
        requester_id=conn["requester_id"],
        receiver_id=conn["receiver_id"],
        idempotency_key=request.idempotency_key,
    )
    return conn


@app.post(
    "/connections/{connection_id}/accept", response_model=ConnectionStatusResponse
)
def accept_connection_request(connection_id: str, request: ConnectionActionRequest):
    try:
        conn = accept_connection(connection_id, request.actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    producer.publish_connection_accepted(
        actor_id=request.actor_id,
        connection_id=conn["connection_id"],
        requester_id=conn["requester_id"],
        receiver_id=conn["receiver_id"],
        idempotency_key=request.idempotency_key,
    )
    return conn


@app.post(
    "/connections/{connection_id}/reject", response_model=ConnectionStatusResponse
)
def reject_connection_request(connection_id: str, request: ConnectionActionRequest):
    try:
        return reject_connection(connection_id, request.actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete(
    "/connections/{connection_id}/withdraw", response_model=ConnectionStatusResponse
)
def withdraw_request(connection_id: str, requester_id: str = Query(...)):
    try:
        return withdraw_connection_request(connection_id, requester_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/connections/{connection_id}", response_model=ConnectionStatusResponse)
def remove_existing_connection(connection_id: str, actor_id: str = Query(...)):
    try:
        return remove_connection(connection_id, actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/members/{member_id}/connections", response_model=list[ConnectionListItem])
def get_connections(
    member_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    return list_accepted_connections(member_id=member_id, limit=limit, offset=offset)


@app.get(
    "/members/{member_id}/connections/pending-received",
    response_model=list[ConnectionListItem],
)
def get_pending_received(
    member_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    return list_pending_received(member_id=member_id, limit=limit, offset=offset)


@app.get(
    "/members/{member_id}/connections/pending-sent",
    response_model=list[ConnectionListItem],
)
def get_pending_sent(
    member_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    return list_pending_sent(member_id=member_id, limit=limit, offset=offset)


@app.get("/connections/status", response_model=ConnectionStatusResponse | None)
def get_status(member_a: str = Query(...), member_b: str = Query(...)):
    return get_connection_status(member_a, member_b)


@app.get(
    "/members/{member_id}/connections/count", response_model=ConnectionCountResponse
)
def get_connection_count(member_id: str):
    total = count_accepted_connections(member_id)
    return {"member_id": member_id, "total_connections": total}
