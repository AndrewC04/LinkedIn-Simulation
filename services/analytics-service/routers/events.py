"""
services/analytics-service/routers/events.py
POST /events/ingest — publish tracking event to Kafka for async processing.
Falls back to synchronous write if Kafka is disabled.
"""
import uuid
import json
import os
import sys
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from models import IngestEventRequest, StatusResponse

router = APIRouter()

KAFKA_ENABLED = os.getenv("ENABLE_KAFKA", "false").lower() == "true"
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka-broker:9092")

_producer = None

def get_producer():
    global _producer
    if _producer is None:
        from confluent_kafka import Producer
        _producer = Producer({
            "bootstrap.servers": KAFKA_BROKER,
            "acks": "all",
        })
    return _producer


@router.post("/events/ingest", response_model=StatusResponse)
async def ingest_event(event: IngestEventRequest):
    idempotency_key = event.idempotency_key or str(uuid.uuid4())
    timestamp = event.timestamp or datetime.now(timezone.utc).isoformat()

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

    if KAFKA_ENABLED:
        try:
            producer = get_producer()
            producer.produce(
                topic="analytics.events",
                key=str(idempotency_key).encode("utf-8"),
                value=json.dumps(doc).encode("utf-8"),
            )
            producer.flush()
            return StatusResponse(status="ok", message="Event ingested successfully.")
        except Exception as e:
            print(f"[events] Kafka publish failed, falling back to sync: {e}")

    # Synchronous fallback (Kafka disabled or failed)
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../../shared'))
    from db import events_col
    from mysql_client import get_db
    from sqlalchemy import text

    try:
        with get_db() as db:
            result = db.execute(
                text("SELECT 1 FROM processed_events WHERE idempotency_key = :key"),
                {"key": idempotency_key}
            ).fetchone()
            if result:
                return StatusResponse(status="skipped", message="Event already processed.")

        events_col.insert_one(doc)

        with get_db() as db:
            db.execute(
                text("INSERT IGNORE INTO processed_events (idempotency_key) VALUES (:key)"),
                {"key": idempotency_key}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store event: {str(e)}")

    return StatusResponse(status="ok", message="Event ingested successfully.")