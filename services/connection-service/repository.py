from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import bootstrap  # noqa: F401
from sqlalchemy import text

from shared.mysql_client import get_db
from shared.redis_cache import cache_delete, cache_get, cache_set


CONNECTION_LIST_TTL_SECONDS = 120
CONNECTION_COUNT_TTL_SECONDS = 120


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _accepted_key(member_id: str) -> str:
    return f"connections:accepted:{member_id}"


def _pending_received_key(member_id: str) -> str:
    return f"connections:pending_received:{member_id}"


def _pending_sent_key(member_id: str) -> str:
    return f"connections:pending_sent:{member_id}"


def _count_key(member_id: str) -> str:
    return f"connections:count:{member_id}"


def _invalidate_member_cache(member_id: str) -> None:
    cache_delete(_accepted_key(member_id))
    cache_delete(_pending_received_key(member_id))
    cache_delete(_pending_sent_key(member_id))
    cache_delete(_count_key(member_id))


def _row_to_status(row: Any) -> Dict[str, Any]:
    return {
        "connection_id": row.connection_id,
        "requester_id": row.requester_id,
        "receiver_id": row.receiver_id,
        "status": row.status,
        "requested_at": row.requested_at,
        "resolved_at": row.resolved_at,
    }


def _member_exists(member_id: str) -> bool:
    with get_db() as db:
        row = db.execute(
            text("SELECT 1 FROM members WHERE member_id = :member_id"),
            {"member_id": member_id},
        ).fetchone()
    return row is not None


def _get_connection_by_id(connection_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as db:
        row = db.execute(
            text(
                """
                SELECT connection_id, requester_id, receiver_id, status, requested_at, resolved_at
                FROM connections
                WHERE connection_id = :connection_id
                """
            ),
            {"connection_id": connection_id},
        ).fetchone()
    return _row_to_status(row) if row else None


def _find_connection_between(member_a: str, member_b: str) -> Optional[Dict[str, Any]]:
    with get_db() as db:
        row = db.execute(
            text(
                """
                SELECT connection_id, requester_id, receiver_id, status, requested_at, resolved_at
                FROM connections
                WHERE (requester_id = :member_a AND receiver_id = :member_b)
                   OR (requester_id = :member_b AND receiver_id = :member_a)
                LIMIT 1
                """
            ),
            {"member_a": member_a, "member_b": member_b},
        ).fetchone()
    return _row_to_status(row) if row else None


def request_connection(requester_id: str, receiver_id: str) -> Dict[str, Any]:
    if requester_id == receiver_id:
        raise ValueError("You cannot connect with yourself")
    if not _member_exists(requester_id):
        raise ValueError("Requester not found")
    if not _member_exists(receiver_id):
        raise ValueError("Receiver not found")

    existing = _find_connection_between(requester_id, receiver_id)
    if existing:
        if existing["status"] == "accepted":
            raise ValueError("Members are already connected")
        if existing["status"] == "pending":
            raise ValueError("A pending request already exists between these members")
        raise ValueError("A previous request exists; remove it before requesting again")

    connection_id = str(uuid.uuid4())
    now = _utc_now()

    with get_db() as db:
        db.execute(
            text(
                """
                INSERT INTO connections (connection_id, requester_id, receiver_id, status, requested_at)
                VALUES (:connection_id, :requester_id, :receiver_id, 'pending', :requested_at)
                """
            ),
            {
                "connection_id": connection_id,
                "requester_id": requester_id,
                "receiver_id": receiver_id,
                "requested_at": now,
            },
        )

    _invalidate_member_cache(requester_id)
    _invalidate_member_cache(receiver_id)
    return {
        "connection_id": connection_id,
        "requester_id": requester_id,
        "receiver_id": receiver_id,
        "status": "pending",
        "requested_at": now,
        "resolved_at": None,
    }


def accept_connection(connection_id: str, actor_id: str) -> Dict[str, Any]:
    conn = _get_connection_by_id(connection_id)
    if not conn:
        raise ValueError("Connection request not found")
    if conn["status"] != "pending":
        raise ValueError("Only pending requests can be accepted")
    if conn["receiver_id"] != actor_id:
        raise ValueError("Only the receiver can accept this request")

    now = _utc_now()
    with get_db() as db:
        db.execute(
            text(
                """
                UPDATE connections
                SET status = 'accepted', resolved_at = :resolved_at
                WHERE connection_id = :connection_id AND status = 'pending'
                """
            ),
            {"connection_id": connection_id, "resolved_at": now},
        )

    _invalidate_member_cache(conn["requester_id"])
    _invalidate_member_cache(conn["receiver_id"])
    conn["status"] = "accepted"
    conn["resolved_at"] = now
    return conn


def reject_connection(connection_id: str, actor_id: str) -> Dict[str, Any]:
    conn = _get_connection_by_id(connection_id)
    if not conn:
        raise ValueError("Connection request not found")
    if conn["status"] != "pending":
        raise ValueError("Only pending requests can be rejected")
    if conn["receiver_id"] != actor_id:
        raise ValueError("Only the receiver can reject this request")

    now = _utc_now()
    with get_db() as db:
        db.execute(
            text(
                """
                UPDATE connections
                SET status = 'rejected', resolved_at = :resolved_at
                WHERE connection_id = :connection_id AND status = 'pending'
                """
            ),
            {"connection_id": connection_id, "resolved_at": now},
        )

    _invalidate_member_cache(conn["requester_id"])
    _invalidate_member_cache(conn["receiver_id"])
    conn["status"] = "rejected"
    conn["resolved_at"] = now
    return conn


def withdraw_connection_request(connection_id: str, requester_id: str) -> Dict[str, Any]:
    conn = _get_connection_by_id(connection_id)
    if not conn:
        raise ValueError("Connection request not found")
    if conn["status"] != "pending":
        raise ValueError("Only pending requests can be withdrawn")
    if conn["requester_id"] != requester_id:
        raise ValueError("Only the requester can withdraw this request")

    with get_db() as db:
        db.execute(
            text("DELETE FROM connections WHERE connection_id = :connection_id AND status = 'pending'"),
            {"connection_id": connection_id},
        )

    _invalidate_member_cache(conn["requester_id"])
    _invalidate_member_cache(conn["receiver_id"])
    conn["status"] = "withdrawn"
    conn["resolved_at"] = _utc_now()
    return conn


def remove_connection(connection_id: str, actor_id: str) -> Dict[str, Any]:
    conn = _get_connection_by_id(connection_id)
    if not conn:
        raise ValueError("Connection not found")
    if conn["status"] != "accepted":
        raise ValueError("Only accepted connections can be removed")
    if actor_id not in {conn["requester_id"], conn["receiver_id"]}:
        raise ValueError("Only a participant can remove this connection")

    with get_db() as db:
        db.execute(
            text("DELETE FROM connections WHERE connection_id = :connection_id AND status = 'accepted'"),
            {"connection_id": connection_id},
        )

    _invalidate_member_cache(conn["requester_id"])
    _invalidate_member_cache(conn["receiver_id"])
    conn["status"] = "removed"
    conn["resolved_at"] = _utc_now()
    return conn


def list_accepted_connections(member_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    cache_key = _accepted_key(member_id)
    cached = cache_get(cache_key)
    if isinstance(cached, list):
        return cached[offset:offset + limit]

    with get_db() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    c.connection_id,
                    CASE WHEN c.requester_id = :member_id THEN c.receiver_id ELSE c.requester_id END AS member_id,
                    m.first_name,
                    m.last_name,
                    c.status,
                    c.requested_at,
                    c.resolved_at
                FROM connections c
                JOIN members m
                  ON m.member_id = CASE WHEN c.requester_id = :member_id THEN c.receiver_id ELSE c.requester_id END
                WHERE (c.requester_id = :member_id OR c.receiver_id = :member_id)
                  AND c.status = 'accepted'
                ORDER BY c.resolved_at DESC, c.requested_at DESC
                """
            ),
            {"member_id": member_id},
        ).fetchall()

    result = [dict(row._mapping) for row in rows]
    cache_set(cache_key, result, ttl_seconds=CONNECTION_LIST_TTL_SECONDS)
    return result[offset:offset + limit]


def list_pending_received(member_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    cache_key = _pending_received_key(member_id)
    cached = cache_get(cache_key)
    if isinstance(cached, list):
        return cached[offset:offset + limit]

    with get_db() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    c.connection_id,
                    c.requester_id AS member_id,
                    m.first_name,
                    m.last_name,
                    c.status,
                    c.requested_at,
                    c.resolved_at
                FROM connections c
                JOIN members m ON m.member_id = c.requester_id
                WHERE c.receiver_id = :member_id
                  AND c.status = 'pending'
                ORDER BY c.requested_at DESC
                """
            ),
            {"member_id": member_id},
        ).fetchall()

    result = [dict(row._mapping) for row in rows]
    cache_set(cache_key, result, ttl_seconds=CONNECTION_LIST_TTL_SECONDS)
    return result[offset:offset + limit]


def list_pending_sent(member_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    cache_key = _pending_sent_key(member_id)
    cached = cache_get(cache_key)
    if isinstance(cached, list):
        return cached[offset:offset + limit]

    with get_db() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    c.connection_id,
                    c.receiver_id AS member_id,
                    m.first_name,
                    m.last_name,
                    c.status,
                    c.requested_at,
                    c.resolved_at
                FROM connections c
                JOIN members m ON m.member_id = c.receiver_id
                WHERE c.requester_id = :member_id
                  AND c.status = 'pending'
                ORDER BY c.requested_at DESC
                """
            ),
            {"member_id": member_id},
        ).fetchall()

    result = [dict(row._mapping) for row in rows]
    cache_set(cache_key, result, ttl_seconds=CONNECTION_LIST_TTL_SECONDS)
    return result[offset:offset + limit]


def get_connection_status(member_a: str, member_b: str) -> Optional[Dict[str, Any]]:
    return _find_connection_between(member_a, member_b)


def count_accepted_connections(member_id: str) -> int:
    cache_key = _count_key(member_id)
    cached = cache_get(cache_key)
    if isinstance(cached, int):
        return cached

    with get_db() as db:
        row = db.execute(
            text(
                """
                SELECT COUNT(*) AS total
                FROM connections
                WHERE (requester_id = :member_id OR receiver_id = :member_id)
                  AND status = 'accepted'
                """
            ),
            {"member_id": member_id},
        ).fetchone()

    total = int(row.total if row else 0)
    cache_set(cache_key, total, ttl_seconds=CONNECTION_COUNT_TTL_SECONDS)
    return total
