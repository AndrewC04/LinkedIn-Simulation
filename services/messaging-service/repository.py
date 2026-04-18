from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import bootstrap  # noqa: F401
from bson import ObjectId

from shared.mongo_client import get_mongo_db
from shared.redis_cache import cache_delete, cache_get, cache_set


THREAD_LIST_TTL_SECONDS = 120
UNREAD_COUNT_TTL_SECONDS = 60


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _thread_list_key(member_id: str) -> str:
    return f"thread_list:{member_id}"


def _unread_count_key(member_id: str) -> str:
    return f"thread_unread_count:{member_id}"


def _doc_to_thread_response(doc: Dict[str, Any], viewer_id: str) -> Dict[str, Any]:
    unread_counts = doc.get("unread_counts", {})
    return {
        "thread_id": str(doc["_id"]),
        "participant_ids": doc["participant_ids"],
        "last_message_at": doc.get("last_message_at"),
        "last_message_preview": doc.get("last_message_preview"),
        "unread_count": int(unread_counts.get(viewer_id, 0)),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }


def _doc_to_message_response(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "message_id": str(doc["_id"]),
        "thread_id": doc["thread_id"],
        "sender_id": doc["sender_id"],
        "text": doc["text"],
        "created_at": doc["created_at"],
        "status": doc.get("status", "sent"),
    }


def _collections():
    db = get_mongo_db()
    return db.threads, db.messages


def ensure_indexes() -> None:
    threads, messages = _collections()
    threads.create_index([("participant_ids", 1), ("last_message_at", -1)])
    messages.create_index([("thread_id", 1), ("created_at", -1)])
    messages.create_index("idempotency_key", unique=True, sparse=True)


def create_thread(participant_ids: List[str]) -> Dict[str, Any]:
    threads, _ = _collections()
    now = _utc_now()

    participants = sorted(set(participant_ids))
    if len(participants) < 2:
        raise ValueError("Thread must include at least two unique participants")

    existing = threads.find_one({"participant_ids": participants})
    if existing:
        return _doc_to_thread_response(existing, participants[0])

    doc = {
        "participant_ids": participants,
        "created_at": now,
        "updated_at": now,
        "last_message_at": None,
        "last_message_preview": None,
        "unread_counts": {pid: 0 for pid in participants},
    }
    result = threads.insert_one(doc)
    doc["_id"] = result.inserted_id

    for pid in participants:
        cache_delete(_thread_list_key(pid))
        cache_delete(_unread_count_key(pid))

    return _doc_to_thread_response(doc, participants[0])


def list_threads_for_member(member_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    cached = cache_get(_thread_list_key(member_id))
    if cached:
        return cached[:limit]

    threads, _ = _collections()
    docs = list(
        threads.find({"participant_ids": member_id})
        .sort("last_message_at", -1)
        .limit(limit)
    )
    response = [_doc_to_thread_response(doc, member_id) for doc in docs]
    cache_set(
        _thread_list_key(member_id), response, ttl_seconds=THREAD_LIST_TTL_SECONDS
    )
    return response


def get_thread(thread_id: str) -> Optional[Dict[str, Any]]:
    threads, _ = _collections()
    doc = threads.find_one({"_id": ObjectId(thread_id)})
    return doc


def list_messages(
    thread_id: str, limit: int = 50, before: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    _, messages = _collections()
    query: Dict[str, Any] = {"thread_id": thread_id}
    if before is not None:
        query["created_at"] = {"$lt": before}

    docs = list(messages.find(query).sort("created_at", -1).limit(limit))
    docs.reverse()
    return [_doc_to_message_response(doc) for doc in docs]


def send_message(
    thread_id: str,
    sender_id: str,
    text: str,
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:
    threads, messages = _collections()
    thread = threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise ValueError("Thread not found")
    if sender_id not in thread["participant_ids"]:
        raise ValueError("Sender is not a participant in this thread")

    if idempotency_key:
        existing = messages.find_one({"idempotency_key": idempotency_key})
        if existing:
            return _doc_to_message_response(existing)

    now = _utc_now()
    message_doc = {
        "thread_id": thread_id,
        "sender_id": sender_id,
        "text": text,
        "created_at": now,
        "status": "sent",
        "idempotency_key": idempotency_key,
    }
    result = messages.insert_one(message_doc)
    message_doc["_id"] = result.inserted_id

    recipients = [pid for pid in thread["participant_ids"] if pid != sender_id]
    inc_map = {f"unread_counts.{pid}": 1 for pid in recipients}
    update_doc: Dict[str, Any] = {
        "$set": {
            "last_message_at": now,
            "last_message_preview": text[:120],
            "updated_at": now,
        }
    }
    if inc_map:
        update_doc["$inc"] = inc_map

    threads.update_one({"_id": thread["_id"]}, update_doc)

    for pid in thread["participant_ids"]:
        cache_delete(_thread_list_key(pid))
        cache_delete(_unread_count_key(pid))

    return _doc_to_message_response(message_doc)


def mark_thread_read(thread_id: str, member_id: str) -> bool:
    threads, messages = _collections()
    thread = threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise ValueError("Thread not found")
    if member_id not in thread["participant_ids"]:
        raise ValueError("Member is not a participant in this thread")

    messages.update_many(
        {
            "thread_id": thread_id,
            "sender_id": {"$ne": member_id},
            "status": {"$ne": "read"},
        },
        {"$set": {"status": "read"}},
    )
    threads.update_one(
        {"_id": thread["_id"]},
        {"$set": {f"unread_counts.{member_id}": 0, "updated_at": _utc_now()}},
    )

    cache_delete(_thread_list_key(member_id))
    cache_delete(_unread_count_key(member_id))
    return True


def total_unread_count(member_id: str) -> int:
    cached = cache_get(_unread_count_key(member_id))
    if isinstance(cached, int):
        return cached

    threads, _ = _collections()
    docs = threads.find({"participant_ids": member_id}, {"unread_counts": 1})
    total = sum(int(doc.get("unread_counts", {}).get(member_id, 0)) for doc in docs)
    cache_set(_unread_count_key(member_id), total, ttl_seconds=UNREAD_COUNT_TTL_SECONDS)
    return total
