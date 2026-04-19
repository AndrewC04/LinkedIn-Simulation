# kafka/producer.py — Publishes AI results to ai.results topic

from kafka import KafkaProducer
from models.schemas import KafkaEnvelope
from dotenv import load_dotenv
import os
import json
import uuid
from datetime import datetime

load_dotenv()

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
TOPIC_RESULTS = os.getenv("KAFKA_TOPIC_RESULTS", "ai.results")

# ── Producer Singleton ────────────────────────────────────────────────────────

_producer = None

def get_producer() -> KafkaProducer:
    global _producer
    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            retries=3
        )
    return _producer


# ── Publish Helpers ───────────────────────────────────────────────────────────

def publish_event(event_type: str, actor_id: str, entity_type: str,
                  entity_id: str, payload: dict, trace_id: str = None):
    """Wrap payload in KafkaEnvelope and publish to ai.results."""
    envelope = KafkaEnvelope(
        event_type=event_type,
        trace_id=trace_id or str(uuid.uuid4()),
        timestamp=datetime.utcnow().isoformat() + "Z",
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload
    )

    producer = get_producer()
    producer.send(
        TOPIC_RESULTS,
        key=entity_id,
        value=envelope.model_dump()
    )
    producer.flush()
    return envelope


def publish_task_completed(task_id: str, trace_id: str, result: dict):
    """Publish ai.completed event when supervisor finishes."""
    return publish_event(
        event_type="ai.completed",
        actor_id="ai-service",
        entity_type="ai_task",
        entity_id=task_id,
        payload=result,
        trace_id=trace_id
    )


def publish_task_approved(task_id: str, trace_id: str,
                          decision: str, recruiter_id: str):
    """Publish ai.approved event after human review."""
    return publish_event(
        event_type="ai.approved",
        actor_id=recruiter_id,
        entity_type="ai_task",
        entity_id=task_id,
        payload={"decision": decision, "task_id": task_id},
        trace_id=trace_id
    )