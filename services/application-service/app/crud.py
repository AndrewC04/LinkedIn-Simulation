from __future__ import annotations

from datetime import datetime, timezone
import uuid

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import text


from app.models import Application, ApplicationNote


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generate_id() -> str:
    return str(uuid.uuid4())


def ensure_job_open(db: Session, job_id: str) -> None:
    row = db.execute(
        text("SELECT status FROM jobs WHERE job_id = :job_id"),
        {"job_id": job_id},
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if row[0] != "open":
        raise HTTPException(status_code=409, detail="Cannot apply to a closed job")


def ensure_member_exists(db: Session, member_id: str) -> None:
    row = db.execute(
        text("SELECT member_id FROM members WHERE member_id = :member_id"),
        {"member_id": member_id},
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Member not found")


def create_application(
    db: Session,
    *,
    job_id: str,
    member_id: str,
    resume_url: str | None,
    cover_letter: str | None,
    idempotency_key: str,
) -> Application:
    existing_by_key = (
        db.query(Application)
        .filter(Application.idempotency_key == idempotency_key)
        .first()
    )
    if existing_by_key:
        return existing_by_key

    existing_duplicate = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.member_id == member_id)
        .first()
    )
    if existing_duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate application: member has already applied to this job",
        )

    now = utcnow_naive()
    app = Application(
        application_id=generate_id(),
        job_id=job_id,
        member_id=member_id,
        resume_url=resume_url,
        cover_letter=cover_letter,
        status="submitted",
        idempotency_key=idempotency_key,
        submitted_at=now,
        updated_at=now,
    )
    db.add(app)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate application or invalid foreign key",
        )

    db.refresh(app)
    return app


def get_application_or_404(db: Session, application_id: str) -> Application:
    app = db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


def list_applications_by_job(
    db: Session,
    *,
    job_id: str,
    status_filter: str | None,
    page: int,
    page_size: int,
):
    query = db.query(Application).filter(Application.job_id == job_id)

    if status_filter:
        query = query.filter(Application.status == status_filter)

    total = query.count()
    items = (
        query.order_by(Application.submitted_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return total, items


def list_applications_by_member(
    db: Session,
    *,
    member_id: str,
    page: int,
    page_size: int,
):
    query = db.query(Application).filter(Application.member_id == member_id)

    total = query.count()
    items = (
        query.order_by(Application.submitted_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return total, items


def update_application_status(
    db: Session,
    *,
    application_id: str,
    new_status: str,
) -> tuple[Application, str]:
    app = get_application_or_404(db, application_id)
    previous_status = app.status
    app.status = new_status
    app.updated_at = utcnow_naive()
    db.commit()
    db.refresh(app)
    return app, previous_status


def add_note(
    db: Session,
    *,
    application_id: str,
    recruiter_id: str,
    note: str,
) -> ApplicationNote:
    app = get_application_or_404(db, application_id)

    recruiter_row = db.execute(
        text("SELECT recruiter_id FROM recruiters WHERE recruiter_id = :recruiter_id"),
        {"recruiter_id": recruiter_id},
    ).fetchone()

    if recruiter_row is None:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    new_note = ApplicationNote(
        note_id=generate_id(),
        application_id=app.application_id,
        recruiter_id=recruiter_id,
        note=note,
        created_at=utcnow_naive(),
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


def get_member_name(db: Session, member_id: str) -> str:
    row = db.execute(
        text(
            """
            SELECT first_name, last_name
            FROM members
            WHERE member_id = :member_id
            """
        ),
        {"member_id": member_id},
    ).fetchone()

    if row is None:
        return member_id

    first_name = row[0] or ""
    last_name = row[1] or ""
    full_name = f"{first_name} {last_name}".strip()
    return full_name if full_name else member_id


def get_job_summary(db: Session, job_id: str) -> tuple[str, str]:
    row = db.execute(
        text(
            """
            SELECT j.title, r.company_name
            FROM jobs j
            LEFT JOIN recruiters r ON j.recruiter_id = r.recruiter_id
            WHERE j.job_id = :job_id
            """
        ),
        {"job_id": job_id},
    ).fetchone()

    if row is None:
        return job_id, "Unknown Company"

    return row[0] or job_id, row[1] or "Unknown Company"

def get_recruiter_name(db: Session, recruiter_id: str) -> str:
    row = db.execute(
        text("SELECT first_name, last_name FROM recruiters WHERE recruiter_id = :recruiter_id"),
        {"recruiter_id": recruiter_id},
    ).fetchone()
    if row is None:
        return recruiter_id
    full_name = f"{row[0] or ''} {row[1] or ''}".strip()
    return full_name if full_name else recruiter_id


def get_notes_for_application(db: Session, application_id: str) -> list[ApplicationNote]:
    return (
        db.query(ApplicationNote)
        .filter(ApplicationNote.application_id == application_id)
        .order_by(ApplicationNote.created_at.asc())
        .all()
    )

def recruiter_owns_job(db: Session, recruiter_id: str, job_id: str) -> bool:
    row = db.execute(
        text(
            """
            SELECT 1
            FROM jobs
            WHERE job_id = :job_id
              AND recruiter_id = :recruiter_id
            """
        ),
        {
            "job_id": job_id,
            "recruiter_id": recruiter_id,
        },
    ).fetchone()

    return row is not None


def recruiter_owns_application(db: Session, recruiter_id: str, application_id: str) -> bool:
    row = db.execute(
        text(
            """
            SELECT 1
            FROM applications a
            JOIN jobs j ON a.job_id = j.job_id
            WHERE a.application_id = :application_id
              AND j.recruiter_id = :recruiter_id
            """
        ),
        {
            "application_id": application_id,
            "recruiter_id": recruiter_id,
        },
    ).fetchone()

    return row is not None