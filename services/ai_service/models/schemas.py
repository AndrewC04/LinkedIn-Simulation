# models/schemas.py — Pydantic request/response models

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


# ── Shared ────────────────────────────────────────────────────────────────────

class KafkaEnvelope(BaseModel):
    event_type: str
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    actor_id: str
    entity_type: str
    entity_id: str
    payload: dict
    idempotency_key: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ── Resume Parser ─────────────────────────────────────────────────────────────

class ResumeParserRequest(BaseModel):
    resume_text: str
    member_id: str

class ParsedResume(BaseModel):
    member_id: str
    skills: List[str]
    years_of_experience: float
    education: List[str]
    previous_roles: List[str]


# ── Job Matcher ───────────────────────────────────────────────────────────────

class JobMatchRequest(BaseModel):
    parsed_resume: ParsedResume
    job_id: str
    job_title: str
    skills_required: List[str]
    seniority_level: str
    location: str

class JobMatchResult(BaseModel):
    member_id: str
    job_id: str
    match_score: float           # 0.0 to 1.0
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str


# ── AI Task (submitted by recruiter via REST) ─────────────────────────────────

class AITaskRequest(BaseModel):
    job_id: str
    recruiter_id: str
    candidate_ids: List[str]
    resumes: Optional[dict] = None
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class AITaskResponse(BaseModel):
    task_id: str
    trace_id: str
    status: str                  # pending | running | awaiting_approval | completed | failed
    message: str


# ── Task Status ───────────────────────────────────────────────────────────────

class TaskStatusRequest(BaseModel):
    task_id: str

class TaskStatusResponse(BaseModel):
    task_id: str
    trace_id: str
    status: str
    steps_completed: List[str]
    result: Optional[dict] = None
    created_at: str
    updated_at: str


# ── Human-in-the-Loop Approval ────────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    task_id: str
    recruiter_id: str
    decision: str                # approved | edited | rejected
    edited_output: Optional[str] = None

class ApprovalResponse(BaseModel):
    task_id: str
    decision: str
    finalized_output: Optional[str] = None
    decided_at: str


# ── Supervisor Output ─────────────────────────────────────────────────────────

class ShortlistedCandidate(BaseModel):
    member_id: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str
    outreach_draft: Optional[str] = None

class SupervisorResult(BaseModel):
    task_id: str
    trace_id: str
    job_id: str
    shortlisted: List[ShortlistedCandidate]
    status: str                  # awaiting_approval | completed