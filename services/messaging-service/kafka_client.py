import json
import logging
from typing import Any, Dict, Optional

import bootstrap  # noqa: F401
from confluent_kafka import Producer

from shared.kafka_envelope import make_event
from shared.kafka_topics import Topics
from shared.service_config import KafkaConfig

logger = logging.getLogger(__name__)


class MessagingProducer:
    def __init__(self, bootstrap_servers: Optional[str] = None):
        self._producer = Producer(
            {
                "bootstrap.servers": bootstrap_servers or KafkaConfig.BOOTSTRAP_SERVERS,
                "client.id": "messaging-service",
            }
        )

    def publish_message_sent(
        self,
        actor_id: str,
        thread_id: str,
        message_id: str,
        recipient_ids: list[str],
        preview: str,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        event = make_event(
            event_type=Topics.MESSAGE_SENT,
            actor_id=actor_id,
            entity_type="thread",
            entity_id=thread_id,
            payload={
                "message_id": message_id,
                "recipient_ids": recipient_ids,
                "preview": preview,
            },
            idempotency_key=idempotency_key,
        )

        self._producer.produce(
            Topics.MESSAGE_SENT,
            key=thread_id,
            value=json.dumps(event).encode("utf-8"),
        )
        self._producer.poll(0)
        self._producer.flush(5)
        logger.info(
            "Published message.sent event thread_id=%s message_id=%s",
            thread_id,
            message_id,
        )
        return event
