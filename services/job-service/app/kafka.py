import json
import logging
from datetime import datetime, timezone
from uuid import uuid4

from kafka import KafkaProducer

from app.config import settings

logger = logging.getLogger(__name__)


class JobKafkaProducer:
    def __init__(self):
        self.enabled = settings.kafka_enabled
        self._producer = None

        if self.enabled:
            try:
                self._producer = KafkaProducer(
                    bootstrap_servers=settings.kafka_bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                    linger_ms=5,
                    acks=1,
                    retries=1,
                )
            except Exception as exc:
                logger.warning("Kafka producer could not start, continuing without Kafka: %s", exc)
                self.enabled = False

    def publish(self, topic: str, actor_id: str, entity_id: str, payload: dict):
        event = {
            "event_type": topic,
            "trace_id": str(uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor_id": actor_id,
            "entity": {
                "entity_type": "job",
                "entity_id": entity_id,
            },
            "payload": payload,
            "idempotency_key": str(uuid4()),
        }

        if not self.enabled or self._producer is None:
            logger.info("Kafka disabled, skipped event: %s", event)
            return

        try:
            self._producer.send(topic, event)
            self._producer.flush(timeout=1)
        except Exception as exc:
            logger.warning("Failed to publish Kafka event %s: %s", topic, exc)


producer = JobKafkaProducer()