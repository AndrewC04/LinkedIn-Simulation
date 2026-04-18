"""
kafka/producer.py – Kafka event producer (Raniel P3)
Publishes profile events to Kafka topics.
"""

from confluent_kafka import Producer
import json
import logging

from shared.service_config import KafkaConfig
from shared.kafka_envelope import make_event

logger = logging.getLogger(__name__)


_producer = None


def init_producer() -> Producer:
    """Initialize and return a Kafka producer."""
    global _producer
    if _producer is None:
        config = {
            'bootstrap.servers': KafkaConfig.BOOTSTRAP_SERVERS,
            'client.id': 'profile-service-producer',
            'acks': 'all',
        }
        _producer = Producer(config)
    return _producer


def publish_profile_event(
    event_type: str,
    member_id: str,
    entity_id: str,
    payload: dict,
    trace_id: str = None
) -> bool:
    """
    Publish a profile-related event to Kafka.
    Returns True on success, False on error.

    Args:
        event_type: e.g., "profile.updated", "profile.created"
        member_id: The member performing the action (actor_id)
        entity_id: The member_id being acted upon
        payload: Event-specific data
        trace_id: Optional trace ID for distributed tracing
    """
    try:
        producer = init_producer()

        # Build event envelope
        # Note: For now, we don't have profile-specific topics defined,
        # but this is ready for when they are added to shared/kafka_topics.py
        event = make_event(
            event_type=event_type,
            actor_id=member_id,
            entity_type="member",
            entity_id=entity_id,
            payload=payload,
            trace_id=trace_id
        )

        # Send to analytics.events topic (generic analytics ingestion)
        producer.produce(
            topic="analytics.events",
            key=str(entity_id).encode('utf-8'),
            value=json.dumps(event).encode('utf-8'),
            callback=_delivery_report
        )
        producer.flush()
        return True

    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
        return False


def _delivery_report(err, msg):
    """Callback for Kafka delivery reports."""
    if err is not None:
        logger.error(f'Message delivery failed: {err}')
    else:
        logger.debug(f'Message delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}')
