import json
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select, update, and_, func, or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.db import redis_client
from app.models import Job, Recruiter
from app.schemas import SalaryRange


JOB_CACHE_TTL = 300
SEARCH_CACHE_TTL = 120
RECRUITER_CACHE_TTL = 180


def _job_to_dict(job: Job, company_name: str | None = None) -> dict:
    return {
        "job_id": job.job_id,
        "recruiter_id": job.recruiter_id,
        "company_id": job.company_id,
        "company_name": company_name,
        "title": job.title,
        "description": job.description,
        "seniority_level": job.seniority_level,
        "employment_type": job.employment_type,
        "location": job.location,
        "work_mode": job.work_mode,
        "industry": job.industry,
        "skills_required": job.skills_required or [],
        "salary_range": (
            {
                "min": job.salary_min,
                "max": job.salary_max,
                "currency": "USD",
            }
            if job.salary_min is not None or job.salary_max is not None
            else None
        ),
        "status": job.status,
        "posted_datetime": job.posted_datetime.isoformat() if job.posted_datetime else None,
        "views_count": job.views_count,
        "applicants_count": job.applicants_count,
        "closed_at": job.closed_at.isoformat() if job.closed_at else None,
    }


def _job_search_item(job: Job, company_name: str | None = None) -> dict:
    return {
        "job_id": job.job_id,
        "company_id": job.company_id,
        "company_name": company_name,
        "title": job.title,
        "employment_type": job.employment_type,
        "location": job.location,
        "work_mode": job.work_mode,
        "seniority_level": job.seniority_level,
        "skills_required": job.skills_required or [],
        "salary_range": (
            {
                "min": job.salary_min,
                "max": job.salary_max,
                "currency": "USD",
            }
            if job.salary_min is not None or job.salary_max is not None
            else None
        ),
        "posted_datetime": job.posted_datetime.isoformat() if job.posted_datetime else None,
        "views_count": job.views_count,
        "applicants_count": job.applicants_count,
        "status": job.status,
    }


def _recruiter_job_item(job: Job, company_name: str | None = None) -> dict:
    return {
        "job_id": job.job_id,
        "title": job.title,
        "company_id": job.company_id,
        "company_name": company_name,
        "employment_type": job.employment_type,
        "location": job.location,
        "work_mode": job.work_mode,
        "status": job.status,
        "posted_datetime": job.posted_datetime.isoformat() if job.posted_datetime else None,
        "views_count": job.views_count,
        "applicants_count": job.applicants_count,
        "salary_range": (
            {
                "min": job.salary_min,
                "max": job.salary_max,
                "currency": "USD",
            }
            if job.salary_min is not None or job.salary_max is not None
            else None
        ),
    }


def _cache_get(key: str):
    raw = redis_client.get(key)
    if raw:
        return json.loads(raw)
    return None


def _cache_set(key: str, value: dict, ttl: int):
    redis_client.setex(key, ttl, json.dumps(value))


def _invalidate_job_related_cache(job_id: str, recruiter_id: str | None = None):
    redis_client.delete(f"job:{job_id}")
    if recruiter_id:
        for key in redis_client.scan_iter(f"recruiter_jobs:{recruiter_id}:*"):
            redis_client.delete(key)
    for key in redis_client.scan_iter("job_search:*"):
        redis_client.delete(key)


def recruiter_exists(db: Session, recruiter_id: str) -> bool:
    stmt = select(Recruiter.recruiter_id).where(Recruiter.recruiter_id == recruiter_id)
    return db.execute(stmt).scalar_one_or_none() is not None


def create_job(db: Session, payload: dict) -> dict:
    job = Job(
        job_id=f"job_{uuid4().hex[:12]}",
        recruiter_id=payload["recruiter_id"],
        company_id=payload["company_id"],
        title=payload["title"],
        description=payload["description"],
        seniority_level=payload["seniority_level"],
        employment_type=payload["employment_type"],
        location=payload["location"],
        work_mode=payload["work_mode"],
        industry=payload["industry"],
        skills_required=payload["skills_required"],
        salary_min=payload["salary_range"]["min"] if payload.get("salary_range") else None,
        salary_max=payload["salary_range"]["max"] if payload.get("salary_range") else None,
        status="open",
        views_count=0,
        applicants_count=0,
    )

    db.add(job)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=404, detail="Recruiter not found")
    db.refresh(job)

    _invalidate_job_related_cache(job.job_id, job.recruiter_id)

    return {
        "job_id": job.job_id,
        "recruiter_id": job.recruiter_id,
        "company_id": job.company_id,
        "title": job.title,
        "status": job.status,
        "posted_datetime": job.posted_datetime.isoformat() if job.posted_datetime else None,
        "views_count": job.views_count,
        "applicants_count": job.applicants_count,
    }


def get_job(db: Session, job_id: str, increment_view: bool = False) -> dict:
    cache_key = f"job:{job_id}"
    cached = _cache_get(cache_key)

    if cached and not increment_view:
        return cached

    stmt = (
        select(Job, Recruiter.company_name)
        .outerjoin(Recruiter, Job.recruiter_id == Recruiter.recruiter_id)
        .where(Job.job_id == job_id)
    )
    row = db.execute(stmt).one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    job, company_name = row

    if increment_view:
        from sqlalchemy import text
        db.execute(text("UPDATE jobs SET views_count = views_count + 1 WHERE job_id = :job_id"), {"job_id": job_id})
        db.commit()
        db.refresh(job)
        # Invalidate search cache so listing reflects updated view count immediately
        for key in redis_client.scan_iter("job_search:*"):
            redis_client.delete(key)

    result = _job_to_dict(job, company_name=company_name)
    _cache_set(cache_key, result, JOB_CACHE_TTL)
    return result


def update_job(db: Session, job_id: str, fields: dict) -> dict:
    stmt = select(Job).where(Job.job_id == job_id)
    job = db.execute(stmt).scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    updated_fields = []

    field_map = {
        "title": "title",
        "description": "description",
        "seniority_level": "seniority_level",
        "employment_type": "employment_type",
        "location": "location",
        "work_mode": "work_mode",
        "industry": "industry",
        "skills_required": "skills_required",
        "status": "status",
    }

    for input_field, model_attr in field_map.items():
        if input_field in fields and fields[input_field] is not None:
            setattr(job, model_attr, fields[input_field])
            updated_fields.append(input_field)

    if "salary_range" in fields and fields["salary_range"] is not None:
        salary = fields["salary_range"]
        job.salary_min = salary.get("min")
        job.salary_max = salary.get("max")
        updated_fields.append("salary_range")

    if "status" in fields and fields["status"] == "closed":
        if job.status != "closed":
            job.closed_at = datetime.utcnow()
    elif "status" in fields and fields["status"] == "open":
        job.closed_at = None

    db.commit()
    db.refresh(job)

    _invalidate_job_related_cache(job.job_id, job.recruiter_id)

    return {
        "job_id": job.job_id,
        "updated_fields": updated_fields,
        "updated_at": datetime.utcnow().isoformat(),
    }


def search_jobs(db: Session, filters: dict, page: int, page_size: int) -> dict:
    cache_key = f"job_search:{json.dumps(filters, sort_keys=True)}:{page}:{page_size}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    stmt = (
        select(Job, Recruiter.company_name)
        .outerjoin(Recruiter, Job.recruiter_id == Recruiter.recruiter_id)
        .where(Job.status == "open")
    )

    keyword = filters.get("keyword")
    location = filters.get("location")
    employment_type = filters.get("employment_type")
    industry = filters.get("industry")
    work_mode = filters.get("work_mode")

    if keyword:
        like_value = f"%{keyword}%"
        stmt = stmt.where(
            or_(
                Job.title.ilike(like_value),
                Job.description.ilike(like_value),
            )
        )

    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))

    if employment_type:
        stmt = stmt.where(Job.employment_type == employment_type)

    if industry:
        stmt = stmt.where(Job.industry == industry)

    if work_mode:
        stmt = stmt.where(Job.work_mode == work_mode)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    stmt = stmt.order_by(Job.posted_datetime.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).all()

    result = {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [_job_search_item(job, company_name=company_name) for job, company_name in rows],
    }

    _cache_set(cache_key, result, SEARCH_CACHE_TTL)
    return result


def close_job(db: Session, job_id: str, recruiter_id: str, reason: str) -> dict:
    stmt = select(Job).where(Job.job_id == job_id)
    job = db.execute(stmt).scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.recruiter_id != recruiter_id:
        raise HTTPException(status_code=403, detail="Recruiter is not authorized to close this job")

    if job.status == "closed":
        raise HTTPException(status_code=400, detail="Job is already closed")

    previous_status = job.status
    job.status = "closed"
    job.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(job)

    _invalidate_job_related_cache(job.job_id, job.recruiter_id)

    return {
        "job_id": job.job_id,
        "previous_status": previous_status,
        "current_status": job.status,
        "reason": reason,
        "closed_at": job.closed_at.isoformat() if job.closed_at else None,
    }


def jobs_by_recruiter(db: Session, recruiter_id: str, status_filter: str | None, page: int, page_size: int) -> dict:
    if not recruiter_exists(db, recruiter_id):
        raise HTTPException(status_code=404, detail="Recruiter not found")

    cache_key = f"recruiter_jobs:{recruiter_id}:{status_filter}:{page}:{page_size}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    stmt = (
        select(Job, Recruiter.company_name)
        .outerjoin(Recruiter, Job.recruiter_id == Recruiter.recruiter_id)
        .where(Job.recruiter_id == recruiter_id)
    )

    if status_filter:
        stmt = stmt.where(Job.status == status_filter)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    stmt = stmt.order_by(Job.posted_datetime.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).all()

    result = {
        "recruiter_id": recruiter_id,
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [_recruiter_job_item(job, company_name=company_name) for job, company_name in rows],
    }

    _cache_set(cache_key, result, RECRUITER_CACHE_TTL)
    return result
