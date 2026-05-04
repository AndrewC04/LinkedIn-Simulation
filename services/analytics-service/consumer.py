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
    Topics.JOB_CREATED,
    Topics.JOB_UPDATED,
    Topics.JOB_CLOSED,
    Topics.APPLICATION_SUBMITTED,
    Topics.APPLICATION_STATUS,
    Topics.MESSAGE_SENT,
    Topics.CONNECTION_REQUESTED,
    Topics.CONNECTION_ACCEPTED,
    "profile.viewed",
    Topics.ANALYTICS_EVENTS,
]

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:29092")


def try_mark_processed(idempotency_key: str) -> bool:
    """
    Atomically insert the idempotency key. Returns True if this is the
    first time we've seen this key (i.e. not a duplicate). Returns False
    if it already exists (duplicate — skip processing).
    Uses INSERT IGNORE: only one concurrent writer will succeed.
    """
    try:
        with get_db() as db:
            result = db.execute(
                text(
                    "INSERT IGNORE INTO processed_events (idempotency_key) "
                    "VALUES (:key)"
                ),
                {"key": idempotency_key},
            )
            # rowcount == 0 means the key already existed (duplicate)
            return result.rowcount > 0
    except Exception as e:
        print(f"[consumer] Idempotency insert failed: {e}")
        # Fail open: treat as duplicate to avoid bad writes
        return False


def process_event(msg_value: dict) -> bool:
    """
    Store a single Kafka event in MongoDB with atomic idempotency check.
    Returns True on success, False if skipped or failed.
    """
    idempotency_key = msg_value.get("idempotency_key") or str(uuid.uuid4())

    # Atomic check-and-mark: if returns False, it's a duplicate
    if not try_mark_processed(idempotency_key):
        print(f"[consumer] Skipping duplicate: {idempotency_key}")
        return True  # Not an error — safe to commit offset

    msg_value["_ingested_at"] = datetime.now(timezone.utc).isoformat()
    msg_value["source"] = "kafka"

    try:
        events_col.insert_one(msg_value)
        print(f"[consumer] Stored: {msg_value.get('event_type')} | {idempotency_key}")
        return True
    except Exception as e:
        print(f"[consumer] ERROR storing event: {e}")
        return False  # Do NOT commit offset — let Kafka redeliver


def run_consumer():
    """Main consumer loop. Manual commit after successful processing."""
    consumer = Consumer({
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": "analytics-group",
        "auto.offset.reset": "earliest",
        "enable.auto.commit": False,  # Manual commit only after successful write
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
                print(f"[consumer] Kafka error: {msg.error()}")
                continue

            try:
                value = json.loads(msg.value().decode("utf-8"))
                success = process_event(value)
                if success:
                    # Only commit offset after the DB write succeeded
                    consumer.commit(message=msg, asynchronous=False)
            except json.JSONDecodeError as e:
                print(f"[consumer] Failed to decode message: {e}")
                # Bad message — commit anyway so we don't loop on it forever
                consumer.commit(message=msg, asynchronous=False)
            except Exception as e:
                print(f"[consumer] Unexpected error: {e}")
                # Do not commit — will be redelivered

    except KeyboardInterrupt:
        print("[consumer] Shutting down.")
    finally:
        consumer.close()


def start_consumer_thread():
    """Start the Kafka consumer in a background daemon thread."""
    thread = threading.Thread(target=run_consumer, daemon=True)
    thread.start()
    print("[consumer] Background thread started.")


if __name__ == "__main__":
    print("[consumer] Starting standalone consumer process...")
    run_consumer()
