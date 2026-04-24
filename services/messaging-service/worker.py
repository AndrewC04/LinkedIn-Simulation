import json
import logging

import bootstrap  # noqa: F401
from confluent_kafka import Consumer
from sqlalchemy import text

from shared.kafka_topics import Topics
from shared.mysql_client import get_db
from shared.service_config import KafkaConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("messaging-worker")


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
        db.commit()


def process_event(event: dict) -> None:
    idempotency_key = event.get("idempotency_key")
    event_type = event.get("event_type", "")
    payload = event.get("payload", {})

    if not idempotency_key:
        logger.warning("Skipping event with no idempotency_key")
        return

    if _already_processed(idempotency_key):
        logger.info("Skipping duplicate event idempotency_key=%s", idempotency_key)
        return

    message_id = payload.get("message_id")
    recipients = payload.get("recipient_ids", [])
    logger.info(
        "Processed message.sent message_id=%s recipients=%s",
        message_id,
        recipients,
    )

    _mark_processed(idempotency_key, event_type)


def run() -> None:
    consumer = Consumer(
        {
            "bootstrap.servers": KafkaConfig.BOOTSTRAP_SERVERS,
            "group.id": "messaging-worker-group",
            "auto.offset.reset": "earliest",
            "enable.auto.commit": False,
        }
    )
    consumer.subscribe([Topics.MESSAGE_SENT])

    logger.info("Messaging worker started. Listening on topic=%s", Topics.MESSAGE_SENT)

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
