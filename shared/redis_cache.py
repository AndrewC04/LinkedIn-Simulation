"""
shared/redis_cache.py – Redis caching helpers (Surya P2)

Usage in services:
    from shared.redis_cache import cache_get, cache_set, cache_delete

All services import this; do NOT write your own Redis logic.
"""

import json
import redis
from shared.service_config import RedisConfig

_pool = redis.ConnectionPool(
    host=RedisConfig.HOST,
    port=RedisConfig.PORT,
    password=RedisConfig.PASSWORD,
    db=RedisConfig.DB,
    decode_responses=True,
    max_connections=20
)

def _client() -> redis.Redis:
    return redis.Redis(connection_pool=_pool)


def cache_get(key: str) -> dict | list | None:
    """Return parsed JSON from Redis, or None on miss / error."""
    try:
        raw = _client().get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except (redis.RedisError, json.JSONDecodeError):
        return None


def cache_set(key: str, value, ttl_seconds: int = 300) -> bool:
    """Store JSON-serialisable value with TTL (default 5 min)."""
    try:
        _client().setex(key, ttl_seconds, json.dumps(value, default=str))
        return True
    except redis.RedisError:
        return False


def cache_delete(key: str) -> bool:
    """Delete a cache key (write-invalidate pattern)."""
    try:
        _client().delete(key)
        return True
    except redis.RedisError:
        return False


def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching a glob pattern. Use sparingly."""
    try:
        r = _client()
        keys = list(r.scan_iter(match=pattern, count=500))
        if keys:
            return r.delete(*keys)
        return 0
    except redis.RedisError:
        return 0



# Key naming conventions (import these constants in your service)
def job_key(job_id: str) -> str:
    return f"job:{job_id}"

def member_key(member_id: str) -> str:
    return f"member:{member_id}"

def job_search_key(query_hash: str) -> str:
    return f"job_search:{query_hash}"

def recruiter_jobs_key(recruiter_id: str) -> str:
    return f"recruiter_jobs:{recruiter_id}"
