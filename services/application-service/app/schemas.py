from datetime import datetime
from enum import Enum
from pydantic import BaseModel, HttpUrl, Field


class ApplicationStatus(str, Enum):
    submitted = "submitted"
    reviewing = "reviewing"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


class SubmitApplicationRequest(BaseModel):
    job_id: str
    member_id: str
    resume_url: HttpUrl | None = None
    cover_letter: str | None = None
    idempotency_key: str


class SubmitApplicationResponse(BaseModel):
    application_id: str
    status: ApplicationStatus
    submitted_at: datetime


class GetApplicationRequest(BaseModel):
    application_id: str


class NoteResponse(BaseModel):
    note_id: str
    application_id: str
    recruiter_id: str
    note: str | None
    created_at: datetime


class GetApplicationResponse(BaseModel):
    application_id: str
    job_id: str
    member_id: str
    resume_url: str | None
    cover_letter: str | None
    status: ApplicationStatus
    submitted_at: datetime
    notes: list[NoteResponse] = Field(default_factory=list)


class ByJobRequest(BaseModel):
    job_id: str
    status_filter: ApplicationStatus | None = None
    page: int = 1
    page_size: int = 20


class JobApplicationItem(BaseModel):
    application_id: str
    member_id: str
    member_name: str
    status: ApplicationStatus
    submitted_at: datetime
    resume_url: str | None


class ByJobResponse(BaseModel):
    job_id: str
    total: int
    page: int
    page_size: int
    applications: list[JobApplicationItem]


class ByMemberRequest(BaseModel):
    member_id: str
    page: int = 1
    page_size: int = 20


class MemberApplicationItem(BaseModel):
    application_id: str
    job_id: str
    job_title: str
    company_name: str
    status: ApplicationStatus
    submitted_at: datetime


class ByMemberResponse(BaseModel):
    member_id: str
    total: int
    page: int
    page_size: int
    applications: list[MemberApplicationItem]


class UpdateStatusRequest(BaseModel):
    application_id: str
    status: ApplicationStatus
    reason: str | None = None


class UpdateStatusResponse(BaseModel):
    application_id: str
    previous_status: ApplicationStatus
    new_status: ApplicationStatus
    updated_at: datetime


class AddNoteRequest(BaseModel):
    application_id: str
    recruiter_id: str
    note: str


class AddNoteResponse(BaseModel):
    note_id: str
    application_id: str
    recruiter_id: str
    note: str
    created_at: datetime