# messaging/consumer.py — Listens to ai.requests topic and processes tasks

from kafka import KafkaConsumer
from dotenv import load_dotenv
import os
import json
import logging

load_dotenv()

logger = logging.getLogger(__name__)

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
TOPIC_REQUESTS = os.getenv("KAFKA_TOPIC_REQUESTS", "ai.requests")


def get_consumer(group_id: str = "ai-service-group") -> KafkaConsumer:
    return KafkaConsumer(
        TOPIC_REQUESTS,
        bootstrap_servers=KAFKA_BROKER,
        group_id=group_id,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        key_deserializer=lambda k: k.decode("utf-8") if k else None,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        consumer_timeout_ms=5000  # Stop after 5s of no messages (for testing)
    )


def consume_requests(handler_fn):
    """
    Starts consuming from ai.requests.
    Calls handler_fn(message_value) for each message received.
    """
    consumer = get_consumer()
    logger.info(f"Listening on topic: {TOPIC_REQUESTS}")

    try:
        for message in consumer:
            logger.info(f"Received message key={message.key} offset={message.offset}")
            try:
                handler_fn(message.value)
            except Exception as e:
                logger.error(f"Handler error for message {message.key}: {e}")
    finally:
        consumer.close()
        logger.info("Consumer closed.")