import json
import logging
from typing import Any, Dict, Optional

import bootstrap  # noqa: F401
from confluent_kafka import Producer

from shared.kafka_envelope import make_event
from shared.kafka_topics import Topics
from shared.service_config import KafkaConfig

logger = logging.getLogger(__name__)


class ConnectionsProducer:
    def __init__(self, bootstrap_servers: Optional[str] = None):
        self._producer = Producer(
            {
                "bootstrap.servers": bootstrap_servers or KafkaConfig.BOOTSTRAP_SERVERS,
                "client.id": "connection-service",
            }
        )

    def _publish(
        self,
        topic: str,
        actor_id: str,
        connection_id: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        event = make_event(
            event_type=topic,
            actor_id=actor_id,
            entity_type="connection",
            entity_id=connection_id,
            payload=payload,
            idempotency_key=idempotency_key,
        )
        self._producer.produce(
            topic,
            key=connection_id,
            value=json.dumps(event).encode("utf-8"),
        )
        self._producer.poll(0)
        self._producer.flush(5)
        logger.info("Published %s event connection_id=%s", topic, connection_id)
        return event

    def publish_connection_requested(
        self,
        actor_id: str,
        connection_id: str,
        requester_id: str,
        receiver_id: str,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._publish(
            topic=Topics.CONNECTION_REQUESTED,
            actor_id=actor_id,
            connection_id=connection_id,
            payload={
                "requester_id": requester_id,
                "receiver_id": receiver_id,
            },
            idempotency_key=idempotency_key,
        )

    def publish_connection_accepted(
        self,
        actor_id: str,
        connection_id: str,
        requester_id: str,
        receiver_id: str,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._publish(
            topic=Topics.CONNECTION_ACCEPTED,
            actor_id=actor_id,
            connection_id=connection_id,
            payload={
                "requester_id": requester_id,
                "receiver_id": receiver_id,
            },
            idempotency_key=idempotency_key,
        )
