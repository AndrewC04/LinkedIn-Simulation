from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db import get_db
from app import crud
from app.kafka import producer
from app.schemas import (
    JobCreateRequest,
    JobGetRequest,
    JobUpdateRequest,
    JobSearchRequest,
    JobCloseRequest,
    JobsByRecruiterRequest,
    JobSaveRequest,
    JobSaveResponse,
)

router = APIRouter(prefix="/jobs", tags=["Job Service"])


@router.post("/create")
def create_job(request: JobCreateRequest, db: Session = Depends(get_db)):
    result = crud.create_job(db, request.model_dump())
    producer.publish(
        topic="job.created",
        actor_id=request.recruiter_id,
        entity_id=result["job_id"],
        payload={"job_id": result["job_id"], "company_id": request.company_id, "title": request.title},
    )
    return result


@router.post("/get")
def get_job(request: JobGetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    result = crud.get_job(db, request.job_id, increment_view=True)
    background_tasks.add_task(
        producer.publish,
        topic="job.viewed",
        actor_id=request.actor_id or "anonymous",
        entity_id=request.job_id,
        payload={"job_id": request.job_id, "source": "job_service_api"},
    )
    return result


@router.post("/update")
def update_job(request: JobUpdateRequest, db: Session = Depends(get_db)):
    result = crud.update_job(db, request.job_id, request.fields.model_dump(exclude_none=True))
    producer.publish(
        topic="job.updated",
        actor_id="recruiter",
        entity_id=request.job_id,
        payload={"job_id": request.job_id, "updated_fields": result["updated_fields"]},
    )
    return result


@router.post("/search")
def search_jobs(request: JobSearchRequest, db: Session = Depends(get_db)):
    filters = request.filters.model_dump(exclude_none=True) if request.filters else {}
    return crud.search_jobs(
        db=db,
        filters=filters,
        page=request.pagination.page,
        page_size=request.pagination.page_size,
    )


@router.post("/close")
def close_job(request: JobCloseRequest, db: Session = Depends(get_db)):
    result = crud.close_job(
        db=db,
        job_id=request.job_id,
        recruiter_id=request.recruiter_id,
        reason=request.reason or "Position has been filled.",
    )
    producer.publish(
        topic="job.closed",
        actor_id=request.recruiter_id,
        entity_id=request.job_id,
        payload={"job_id": request.job_id, "reason": request.reason},
    )
    return result


@router.post("/byRecruiter")
def get_jobs_by_recruiter(request: JobsByRecruiterRequest, db: Session = Depends(get_db)):
    return crud.jobs_by_recruiter(
        db=db,
        recruiter_id=request.recruiter_id,
        status_filter=request.status_filter,
        page=request.pagination.page,
        page_size=request.pagination.page_size,
    )


@router.post("/save", response_model=JobSaveResponse)
def save_job(request: JobSaveRequest, db: Session = Depends(get_db)):
    result = crud.get_job(db, request.job_id, increment_view=False)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    producer.publish(
        topic="job.saved",
        actor_id=request.member_id,
        entity_id=request.job_id,
        payload={"job_id": request.job_id, "member_id": request.member_id},
    )
    return JobSaveResponse(
        job_id=request.job_id,
        member_id=request.member_id,
        message="Job saved successfully.",
    )
