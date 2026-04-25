from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from db import events_col
import redis
import json
import os
import sys

from dotenv import load_dotenv
load_dotenv()

# Add shared to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'shared')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from service_config import RedisConfig

router = APIRouter()

# Redis cache setup
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", 60))

try:
    redis_client = redis.Redis(
        host=RedisConfig.HOST,
        port=RedisConfig.PORT,
        decode_responses=True
    )
    redis_client.ping()
    print("[analytics] Redis connected.")
except Exception as e:
    print(f"[analytics] Redis unavailable — caching disabled. Error: {e}")
    redis_client = None


def cache_get(key: str):
    if redis_client:
        val = redis_client.get(key)
        if val:
            return json.loads(val)
    return None


def cache_set(key: str, value):
    if redis_client:
        redis_client.setex(key, CACHE_TTL, json.dumps(value))


def window_start(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


# ── Request models ────────────────────────────────────────────────────────────

class TopJobsRequest(BaseModel):
    metric: Optional[str] = "applications"
    window_days: Optional[int] = 30
    limit: Optional[int] = 10


class FunnelRequest(BaseModel):
    job_id: str
    window_days: Optional[int] = 30


class GeoRequest(BaseModel):
    job_id: str
    window_days: Optional[int] = 30


class MemberDashboardRequest(BaseModel):
    member_id: str


class LowTractionRequest(BaseModel):
    window_days: Optional[int] = 30
    limit: Optional[int] = 5


class ClicksRequest(BaseModel):
    window_days: Optional[int] = 30
    limit: Optional[int] = 10


class SavedJobsRequest(BaseModel):
    window_days: Optional[int] = 30


class ProfileViewsRequest(BaseModel):
    member_id: str
    window_days: Optional[int] = 30


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analytics/jobs/top")
async def top_jobs(req: TopJobsRequest):
    """Top N job postings by applications, views, or saves."""
    cache_key = f"top_jobs:{req.metric}:{req.window_days}:{req.limit}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    metric_map = {
        "applications": "application.submitted",
        "views":        "job.viewed",
        "saves":        "job.saved",
    }
    event_type = metric_map.get(req.metric, "application.submitted")
    since = window_start(req.window_days)

    pipeline = [
        {"$match": {
            "event_type": event_type,
            "timestamp": {"$gte": since}
        }},
        {"$group": {
            "_id": "$entity.entity_id",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": req.limit},
        {"$project": {"job_id": "$_id", "count": 1, "_id": 0}}
    ]

    try:
        results = list(events_col.aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, results)
    return {"source": "db", "data": results}


@router.post("/analytics/funnel")
async def funnel(req: FunnelRequest):
    """Conversion funnel for a job: view → save → apply → submit."""
    cache_key = f"funnel:{req.job_id}:{req.window_days}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(req.window_days)
    funnel_steps = {
        "viewed":    "job.viewed",
        "saved":     "job.saved",
        "applied":   "job.applied",
        "submitted": "application.submitted",
    }

    result = {"job_id": req.job_id}
    try:
        for step, event_type in funnel_steps.items():
            count = events_col.count_documents({
                "event_type": event_type,
                "entity.entity_id": req.job_id,
                "timestamp": {"$gte": since}
            })
            result[step] = count
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, result)
    return {"source": "db", "data": result}


@router.post("/analytics/geo")
async def geo(req: GeoRequest):
    """City/state distribution of applicants for a job posting."""
    cache_key = f"geo:{req.job_id}:{req.window_days}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(req.window_days)
    pipeline = [
        {"$match": {
            "event_type": "application.submitted",
            "entity.entity_id": req.job_id,
            "timestamp": {"$gte": since}
        }},
        {"$group": {
            "_id": "$payload.location",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$project": {"city": "$_id", "count": 1, "_id": 0}}
    ]

    try:
        results = list(events_col.aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, results)
    return {"source": "db", "data": results}


@router.post("/analytics/member/dashboard")
async def member_dashboard(req: MemberDashboardRequest):
    """Member dashboard: profile views + application status breakdown."""
    cache_key = f"member_dashboard:{req.member_id}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(30)

    try:
        profile_views = events_col.count_documents({
            "event_type": "profile.viewed",
            "entity.entity_id": req.member_id,
            "timestamp": {"$gte": since}
        })

        pipeline = [
            {"$match": {
                "event_type": "application.status.updated",
                "actor_id": req.member_id,
            }},
            {"$group": {
                "_id": "$payload.status",
                "count": {"$sum": 1}
            }},
            {"$project": {"status": "$_id", "count": 1, "_id": 0}}
        ]
        status_results = list(events_col.aggregate(pipeline))
        status_breakdown = {r["status"]: r["count"] for r in status_results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    result = {
        "member_id": req.member_id,
        "profile_views_last_30_days": profile_views,
        "application_status_breakdown": status_breakdown,
    }

    cache_set(cache_key, result)
    return {"source": "db", "data": result}


@router.post("/analytics/jobs/low-traction")
async def low_traction_jobs(req: LowTractionRequest):
    """Top 5 jobs with fewest applications (low traction)."""
    cache_key = f"low_traction:{req.window_days}:{req.limit}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(req.window_days)
    pipeline = [
        {"$match": {
            "event_type": "application.submitted",
            "timestamp": {"$gte": since}
        }},
        {"$group": {
            "_id": "$entity.entity_id",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": 1}},
        {"$limit": req.limit},
        {"$project": {"job_id": "$_id", "count": 1, "_id": 0}}
    ]

    try:
        results = list(events_col.aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, results)
    return {"source": "db", "data": results}


@router.post("/analytics/jobs/clicks")
async def clicks_per_job(req: ClicksRequest):
    """Clicks (views) per job posting from logs."""
    cache_key = f"clicks:{req.window_days}:{req.limit}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(req.window_days)
    pipeline = [
        {"$match": {
            "event_type": "job.viewed",
            "timestamp": {"$gte": since}
        }},
        {"$group": {
            "_id": "$entity.entity_id",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": req.limit},
        {"$project": {"job_id": "$_id", "count": 1, "_id": 0}}
    ]

    try:
        results = list(events_col.aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, results)
    return {"source": "db", "data": results}


@router.post("/analytics/jobs/saved-per-day")
async def saved_jobs_per_day(req: SavedJobsRequest):
    """Number of saved jobs per day over the last N days."""
    cache_key = f"saved_per_day:{req.window_days}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(req.window_days)
    pipeline = [
        {"$match": {
            "event_type": "job.saved",
            "timestamp": {"$gte": since}
        }},
        {"$group": {
            "_id": {"$substr": ["$timestamp", 0, 10]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
        {"$project": {"date": "$_id", "count": 1, "_id": 0}}
    ]

    try:
        results = list(events_col.aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, results)
    return {"source": "db", "data": results}


@router.post("/analytics/member/profile-views-per-day")
async def profile_views_per_day(req: ProfileViewsRequest):
    """Profile views per day for a member over last 30 days."""
    cache_key = f"profile_views_per_day:{req.member_id}:{req.window_days}"
    cached = cache_get(cache_key)
    if cached:
        return {"source": "cache", "data": cached}

    since = window_start(req.window_days)
    pipeline = [
        {"$match": {
            "event_type": "profile.viewed",
            "entity.entity_id": req.member_id,
            "timestamp": {"$gte": since}
        }},
        {"$group": {
            "_id": {"$substr": ["$timestamp", 0, 10]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
        {"$project": {"date": "$_id", "count": 1, "_id": 0}}
    ]

    try:
        results = list(events_col.aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    cache_set(cache_key, results)
    return {"source": "db", "data": results}