from confluent_kafka import Producer
from datetime import datetime, timezone
import uuid
import json
import os
import logging

logger = logging.getLogger(__name__)

KAFKA_ENABLED = os.getenv("ENABLE_KAFKA", "false").lower() == "true"
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka-broker:9092")

_producer = None

def get_producer():
    global _producer
    if _producer is None:
        _producer = Producer({
            "bootstrap.servers": KAFKA_BROKER,
            "acks": "1",
            "linger.ms": "5",
        })
    return _producer

TOPIC_MAP = {
    "application.submitted": "application.submitted",
    "application.status_updated": "application.status.updated",
}

def emit_event(event_type: str, actor_id: str, entity_type: str, entity_id: str, payload: dict) -> None:
    event = {
        "event_type": event_type,
        "trace_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": actor_id,
        "entity": {"entity_type": entity_type, "entity_id": entity_id},
        "payload": payload,
        "idempotency_key": str(uuid.uuid4()),
    }

    if not KAFKA_ENABLED:
        logger.info("[kafka] Kafka disabled, skipped event: %s", event_type)
        return

    topic = TOPIC_MAP.get(event_type, event_type)
    try:
        producer = get_producer()
        producer.produce(
            topic=topic,
            key=str(entity_id).encode("utf-8"),
            value=json.dumps(event).encode("utf-8"),
        )
        producer.flush(timeout=0.5)
        logger.info("[kafka] Published: %s -> topic: %s", event_type, topic)
    except Exception as e:
        logger.warning("[kafka] ERROR publishing %s: %s", event_type, e)