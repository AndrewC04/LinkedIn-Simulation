import json
import threading
import uuid
from datetime import datetime, timezone

from confluent_kafka import Consumer, KafkaError
from sqlalchemy import text
from db import events_col

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../shared'))
from kafka_topics import Topics
from mysql_client import get_db

# All topics this service consumes
TOPICS = [
    Topics.JOB_VIEWED,
    Topics.JOB_SAVED,
    Topics.JOB_APPLIED,
    Topics.APPLICATION_SUBMITTED,
    Topics.APPLICATION_STATUS,
    Topics.CONNECTION_ACCEPTED,
    Topics.ANALYTICS_EVENTS,
]

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:29092")


def is_duplicate(idempotency_key: str) -> bool:
    """Check MySQL processed_events table for duplicate."""
    try:
        with get_db() as db:
            result = db.execute(
                text("SELECT 1 FROM processed_events WHERE idempotency_key = :key"),
                {"key": idempotency_key}
            ).fetchone()
            return result is not None
    except Exception as e:
        print(f"[consumer] Idempotency check failed: {e}")
        return False


def mark_processed(idempotency_key: str):
    """Insert into MySQL processed_events table."""
    try:
        with get_db() as db:
            db.execute(
                text("INSERT IGNORE INTO processed_events (idempotency_key) VALUES (:key)"),
                {"key": idempotency_key}
            )
    except Exception as e:
        print(f"[consumer] Failed to mark processed: {e}")


def process_event(msg_value: dict):
    """Store a single Kafka event in MongoDB with idempotency check."""
    idempotency_key = msg_value.get("idempotency_key") or str(uuid.uuid4())

    if is_duplicate(idempotency_key):
        print(f"[consumer] Skipping duplicate: {idempotency_key}")
        return

    msg_value["_ingested_at"] = datetime.now(timezone.utc).isoformat()
    msg_value["source"] = "kafka"

    try:
        events_col.insert_one(msg_value)
        mark_processed(idempotency_key)
        print(f"[consumer] Stored: {msg_value.get('event_type')} | {idempotency_key}")
    except Exception as e:
        print(f"[consumer] ERROR storing event: {e}")


def run_consumer():
    """Main consumer loop. Runs forever in a background thread."""
    consumer = Consumer({
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": "analytics-group",
        "auto.offset.reset": "earliest",
        "enable.auto.commit": True,
    })

    consumer.subscribe(TOPICS)
    print(f"[consumer] Subscribed to topics: {TOPICS}")

    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"[consumer] Kafka error: {msg.error()}")
                    continue
            try:
                value = json.loads(msg.value().decode("utf-8"))
                process_event(value)
            except json.JSONDecodeError as e:
                print(f"[consumer] Failed to decode message: {e}")
            except Exception as e:
                print(f"[consumer] Unexpected error: {e}")

    except KeyboardInterrupt:
        print("[consumer] Shutting down.")
    finally:
        consumer.close()


def start_consumer_thread():
    """Start the Kafka consumer in a background daemon thread."""
    thread = threading.Thread(target=run_consumer, daemon=True)
    thread.start()
    print("[consumer] Background thread started.")