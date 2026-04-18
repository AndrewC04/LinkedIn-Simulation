import json
import logging

import bootstrap  # noqa: F401
from confluent_kafka import Consumer
from sqlalchemy import text

from shared.kafka_topics import Topics
from shared.mysql_client import get_db
from shared.service_config import KafkaConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("connections-worker")


def _already_processed(idempotency_key: str) -> bool:
    with get_db() as db:
        existing = db.execute(
            text("SELECT 1 FROM processed_events WHERE idempotency_key = :key"),
            {"key": idempotency_key},
        ).fetchone()
        return existing is not None


def _mark_processed(idempotency_key: str, event_type: str) -> None:
    with get_db() as db:
        db.execute(
            text(
                """
                INSERT INTO processed_events (idempotency_key, event_type)
                VALUES (:key, :event_type)
                """
            ),
            {"key": idempotency_key, "event_type": event_type},
        )


def process_event(event: dict) -> None:
    event_type = event.get("event_type", "")
    idempotency_key = event.get("idempotency_key")
    payload = event.get("payload", {})

    if not idempotency_key:
        logger.warning("Skipping %s event with no idempotency_key", event_type)
        return

    if _already_processed(idempotency_key):
        logger.info("Skipping duplicate event idempotency_key=%s", idempotency_key)
        return

    logger.info(
        "Processed %s requester_id=%s receiver_id=%s",
        event_type,
        payload.get("requester_id"),
        payload.get("receiver_id"),
    )
    _mark_processed(idempotency_key, event_type)


def run() -> None:
    consumer = Consumer(
        {
            "bootstrap.servers": KafkaConfig.BOOTSTRAP_SERVERS,
            "group.id": "connections-worker-group",
            "auto.offset.reset": "earliest",
            "enable.auto.commit": False,
        }
    )
    consumer.subscribe([Topics.CONNECTION_REQUESTED, Topics.CONNECTION_ACCEPTED])

    logger.info(
        "Connections worker started. topics=%s,%s",
        Topics.CONNECTION_REQUESTED,
        Topics.CONNECTION_ACCEPTED,
    )

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                logger.error("Kafka error: %s", msg.error())
                continue

            try:
                event = json.loads(msg.value().decode("utf-8"))
                process_event(event)
                consumer.commit(message=msg)
            except Exception:
                logger.exception("Failed to process Kafka message")
    finally:
        consumer.close()


if __name__ == "__main__":
    run()
