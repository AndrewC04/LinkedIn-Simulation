from __future__ import annotations

import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import crud
from app.auth import CurrentUser, get_current_user, require_member, require_recruiter
from app.db import get_db
from app.kafka import emit_event
from app.schemas import (
    AddNoteRequest,
    AddNoteResponse,
    ByJobRequest,
    ByJobResponse,
    ByMemberRequest,
    ByMemberResponse,
    GetApplicationRequest,
    GetApplicationResponse,
    JobApplicationItem,
    MemberApplicationItem,
    NoteResponse,
    SubmitApplicationResponse,
    UpdateStatusRequest,
    UpdateStatusResponse,
)

router = APIRouter(prefix="/applications", tags=["applications"])

UPLOAD_DIR = "uploads"


def save_upload_file(upload_file: UploadFile, subfolder: str) -> str:
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename")

    folder_path = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder_path, exist_ok=True)

    ext = os.path.splitext(upload_file.filename)[1]
    generated_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(folder_path, generated_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return f"/uploads/{subfolder}/{generated_name}"


@router.post("/submit", response_model=SubmitApplicationResponse)
def submit_application(
    job_id: str = Form(...),
    member_id: str = Form(...),
    idempotency_key: str = Form(...),
    resume_file: UploadFile = File(...),
    cover_letter_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    require_member(user)

    if user.user_id != member_id:
        raise HTTPException(status_code=403, detail="Members can only submit their own applications")

    crud.ensure_job_open(db, job_id)
    crud.ensure_member_exists(db, member_id)

    resume_path = save_upload_file(resume_file, "resumes")
    cover_letter_path = (
        save_upload_file(cover_letter_file, "cover_letters")
        if cover_letter_file is not None
        else None
    )

    application = crud.create_application(
        db,
        job_id=job_id,
        member_id=member_id,
        resume_url=resume_path,
        cover_letter=cover_letter_path,
        idempotency_key=idempotency_key,
    )

    emit_event(
        event_type="application.submitted",
        actor_id=member_id,
        entity_type="application",
        entity_id=application.application_id,
        payload={
            "job_id": job_id,
            "member_id": member_id,
            "resume_url": resume_path,
            "cover_letter": cover_letter_path,
        },
    )

    return SubmitApplicationResponse(
        application_id=application.application_id,
        status=application.status,
        submitted_at=application.submitted_at,
    )


@router.post("/get", response_model=GetApplicationResponse)
def get_application(
    payload: GetApplicationRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    application = crud.get_application_or_404(db, payload.application_id)

    if user.role == "member":
        if application.member_id != user.user_id:
            raise HTTPException(status_code=403, detail="Cannot view another member's application")
    elif user.role == "recruiter":
        if not crud.recruiter_owns_application(db, user.user_id, payload.application_id):
            raise HTTPException(status_code=403, detail="Recruiter does not own this application")
    else:
        raise HTTPException(status_code=403, detail="Invalid role")

    notes = crud.get_notes_for_application(db, payload.application_id)

    return GetApplicationResponse(
        application_id=application.application_id,
        job_id=application.job_id,
        member_id=application.member_id,
        resume_url=application.resume_url,
        cover_letter=application.cover_letter,
        status=application.status,
        submitted_at=application.submitted_at,
        notes=[
            NoteResponse(
                note_id=note.note_id,
                application_id=note.application_id,
                recruiter_id=note.recruiter_id,
                note=note.note,
                created_at=note.created_at,
            )
            for note in notes
        ],
    )


@router.post("/byJob", response_model=ByJobResponse)
def applications_by_job(
    payload: ByJobRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    require_recruiter(user)

    if not crud.recruiter_owns_job(db, user.user_id, payload.job_id):
        raise HTTPException(status_code=403, detail="Recruiter does not own this job")

    total, items = crud.list_applications_by_job(
        db,
        job_id=payload.job_id,
        status_filter=payload.status_filter.value if payload.status_filter else None,
        page=payload.page,
        page_size=payload.page_size,
    )

    return ByJobResponse(
        job_id=payload.job_id,
        total=total,
        page=payload.page,
        page_size=payload.page_size,
        applications=[
            JobApplicationItem(
                application_id=item.application_id,
                member_id=item.member_id,
                member_name=crud.get_member_name(db, item.member_id),
                status=item.status,
                submitted_at=item.submitted_at,
                resume_url=item.resume_url,
            )
            for item in items
        ],
    )


@router.post("/byMember", response_model=ByMemberResponse)
def applications_by_member(
    payload: ByMemberRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    require_member(user)

    if user.user_id != payload.member_id:
        raise HTTPException(status_code=403, detail="Cannot view another member's applications")

    total, items = crud.list_applications_by_member(
        db,
        member_id=payload.member_id,
        page=payload.page,
        page_size=payload.page_size,
    )

    application_rows = []
    for item in items:
        job_title, company_name = crud.get_job_summary(db, item.job_id)
        application_rows.append(
            MemberApplicationItem(
                application_id=item.application_id,
                job_id=item.job_id,
                job_title=job_title,
                company_name=company_name,
                status=item.status,
                submitted_at=item.submitted_at,
            )
        )

    return ByMemberResponse(
        member_id=payload.member_id,
        total=total,
        page=payload.page,
        page_size=payload.page_size,
        applications=application_rows,
    )


@router.post("/updateStatus", response_model=UpdateStatusResponse)
def update_status(
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    require_recruiter(user)

    if not crud.recruiter_owns_application(db, user.user_id, payload.application_id):
        raise HTTPException(status_code=403, detail="Recruiter does not own this application")

    application, previous_status = crud.update_application_status(
        db,
        application_id=payload.application_id,
        new_status=payload.status.value,
    )

    emit_event(
        event_type="application.status_updated",
        actor_id=user.user_id,
        entity_type="application",
        entity_id=application.application_id,
        payload={
            "application_id": application.application_id,
            "previous_status": previous_status,
            "new_status": application.status,
            "reason": payload.reason,
        },
    )

    return UpdateStatusResponse(
        application_id=application.application_id,
        previous_status=previous_status,
        new_status=application.status,
        updated_at=application.updated_at,
    )


@router.post("/addNote", response_model=AddNoteResponse)
def add_note(
    payload: AddNoteRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    require_recruiter(user)

    if user.user_id != payload.recruiter_id:
        raise HTTPException(status_code=403, detail="Recruiters can only add notes as themselves")

    if not crud.recruiter_owns_application(db, user.user_id, payload.application_id):
        raise HTTPException(status_code=403, detail="Recruiter does not own this application")

    note = crud.add_note(
        db,
        application_id=payload.application_id,
        recruiter_id=payload.recruiter_id,
        note=payload.note,
    )

    return AddNoteResponse(
        note_id=note.note_id,
        application_id=note.application_id,
        recruiter_id=note.recruiter_id,
        note=note.note or "",
        created_at=note.created_at,
    )