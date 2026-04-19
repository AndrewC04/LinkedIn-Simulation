"""
services/analytics-service/routers/events.py
POST /events/ingest — manually ingest a tracking event.
Idempotency checked against MySQL processed_events table.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from db import events_col
from models import IngestEventRequest, StatusResponse

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../shared'))
from mysql_client import get_db

router = APIRouter()


@router.post("/events/ingest", response_model=StatusResponse)
async def ingest_event(event: IngestEventRequest):
    idempotency_key = event.idempotency_key or str(uuid.uuid4())
    timestamp = event.timestamp or datetime.now(timezone.utc).isoformat()

    # Idempotency check against MySQL
    try:
        with get_db() as db:
            result = db.execute(
                text("SELECT 1 FROM processed_events WHERE idempotency_key = :key"),
                {"key": idempotency_key}
            ).fetchone()
            if result:
                return StatusResponse(
                    status="skipped",
                    message=f"Event '{idempotency_key}' already processed."
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Idempotency check failed: {str(e)}")

    # Build document
    doc = {
        "event_type": event.event_type,
        "trace_id": event.trace_id or str(uuid.uuid4()),
        "timestamp": timestamp,
        "actor_id": event.actor_id,
        "entity": {
            "entity_type": event.entity.entity_type,
            "entity_id": event.entity.entity_id,
        },
        "payload": event.payload,
        "idempotency_key": idempotency_key,
        "source": "http_ingest",
    }

    try:
        # Store event in MongoDB
        events_col.insert_one(doc)
        # Mark as processed in MySQL
        with get_db() as db:
            db.execute(
                text("INSERT IGNORE INTO processed_events (idempotency_key) VALUES (:key)"),
                {"key": idempotency_key}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store event: {str(e)}")

    return StatusResponse(
        status="ok",
        message="Event ingested successfully."
    )