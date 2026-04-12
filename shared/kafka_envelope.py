"""
shared/kafka_envelope.py
Single source of truth for the Kafka event envelope.
Every service imports this — do not duplicate it.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Valid event types — all producers must use one of these
EVENT_TYPES = {
    "job.viewed",
    "job.saved",
    "job.applied",
    "application.submitted",
    "application.status.updated",
    "message.sent",
    "connection.requested",
    "connection.accepted",
    "ai.requests",
    "ai.results",
}

# Valid entity types
ENTITY_TYPES = {
    "job",
    "application",
    "thread",
    "connection",
    "ai_task",
    "member",
}


def make_event(
    event_type: str,
    actor_id: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any],
    trace_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a Kafka event envelope.

    Args:
        event_type:       e.g. "application.submitted"
        actor_id:         member_id or recruiter_id performing the action
        entity_type:      "job" | "application" | "thread" | etc.
        entity_id:        the ID of the entity this event is about
        payload:          domain-specific fields
        trace_id:         pass the SAME trace_id for multi-step workflows
        idempotency_key:  consumers use this to avoid duplicate DB writes

    Returns:
        dict matching the required Kafka envelope schema
    """
    if event_type not in EVENT_TYPES:
        raise ValueError(f"Unknown event_type '{event_type}'. Valid: {EVENT_TYPES}")
    if entity_type not in ENTITY_TYPES:
        raise ValueError(f"Unknown entity_type '{entity_type}'. Valid: {ENTITY_TYPES}")

    return {
        "event_type": event_type,
        "trace_id": trace_id or str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": actor_id,
        "entity": {
            "entity_type": entity_type,
            "entity_id": entity_id,
        },
        "payload": payload,
        "idempotency_key": idempotency_key or str(uuid.uuid4()),
    }


# Example usage (remove before production):
if __name__ == "__main__":
    event = make_event(
        event_type="application.submitted",
        actor_id="mem_xyz456",
        entity_type="application",
        entity_id="app_001",
        payload={
            "job_id": "job_abc123",
            "member_id": "mem_xyz456",
            "resume_url": "https://s3.amazonaws.com/resumes/john.pdf",
        },
    )
    import json
    print(json.dumps(event, indent=2))