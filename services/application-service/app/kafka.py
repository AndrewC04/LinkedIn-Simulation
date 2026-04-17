from datetime import datetime, timezone
import uuid


def emit_event(event_type: str, actor_id: str, entity_type: str, entity_id: str, payload: dict) -> None:
    event = {
        "event_type": event_type,
        "trace_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": actor_id,
        "entity": {
            "entity_type": entity_type,
            "entity_id": entity_id,
        },
        "payload": payload,
        "idempotency_key": str(uuid.uuid4()),
    }
    print("[KAFKA STUB]", event)