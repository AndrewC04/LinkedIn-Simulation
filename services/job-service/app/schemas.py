from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


VALID_WORK_MODES = {"onsite", "remote", "hybrid"}
VALID_STATUS = {"open", "closed"}


def normalize_work_mode(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    lowered = value.strip().lower()
    if lowered not in VALID_WORK_MODES:
        raise ValueError("work_mode must be one of: onsite, remote, hybrid")
    return lowered


class SalaryRange(BaseModel):
    min: Optional[int] = None
    max: Optional[int] = None
    currency: Optional[str] = "USD"

    @field_validator("max")
    @classmethod
    def validate_min_max(cls, v, info):
        min_val = info.data.get("min")
        if v is not None and min_val is not None and v < min_val:
            raise ValueError("salary_range.max must be greater than or equal to salary_range.min")
        return v


class Pagination(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class JobCreateRequest(BaseModel):
    recruiter_id: str
    company_id: str
    title: str
    description: str
    seniority_level: str
    employment_type: str
    location: str
    work_mode: str
    industry: str
    skills_required: List[str]
    salary_range: Optional[SalaryRange] = None

    @field_validator("work_mode")
    @classmethod
    def validate_work_mode(cls, v: str) -> str:
        return normalize_work_mode(v)


class JobGetRequest(BaseModel):
    job_id: str
    actor_id: Optional[str] = None


class JobUpdateFields(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    seniority_level: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    industry: Optional[str] = None
    skills_required: Optional[List[str]] = None
    salary_range: Optional[SalaryRange] = None
    status: Optional[str] = None

    @field_validator("work_mode")
    @classmethod
    def validate_work_mode(cls, v: Optional[str]) -> Optional[str]:
        return normalize_work_mode(v)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        lowered = v.strip().lower()
        if lowered not in VALID_STATUS:
            raise ValueError("status must be one of: open, closed")
        return lowered


class JobUpdateRequest(BaseModel):
    job_id: str
    fields: JobUpdateFields


class JobSearchFilters(BaseModel):
    keyword: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    industry: Optional[str] = None
    work_mode: Optional[str] = None

    @field_validator("work_mode")
    @classmethod
    def validate_work_mode(cls, v: Optional[str]) -> Optional[str]:
        return normalize_work_mode(v)


class JobSearchRequest(BaseModel):
    filters: Optional[JobSearchFilters] = None
    pagination: Pagination = Pagination()


class JobCloseRequest(BaseModel):
    job_id: str
    recruiter_id: str
    reason: Optional[str] = "Position has been filled."


class JobsByRecruiterRequest(BaseModel):
    recruiter_id: str
    status_filter: Optional[str] = None
    pagination: Pagination = Pagination()

    @field_validator("status_filter")
    @classmethod
    def validate_status_filter(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        lowered = v.strip().lower()
        if lowered not in VALID_STATUS:
            raise ValueError("status_filter must be one of: open, closed")
        return lowered


class JobResponse(BaseModel):
    job_id: str
    recruiter_id: str
    company_id: str
    title: str
    description: str
    seniority_level: str
    employment_type: str
    location: str
    work_mode: str
    industry: str
    skills_required: List[str]
    salary_range: Optional[SalaryRange] = None
    status: str
    posted_datetime: Optional[str] = None
    views_count: int
    applicants_count: int
    closed_at: Optional[str] = None


class JobSearchItem(BaseModel):
    job_id: str
    company_id: str
    title: str
    employment_type: str
    location: str
    work_mode: str
    seniority_level: str
    skills_required: List[str]
    salary_range: Optional[SalaryRange] = None
    posted_datetime: Optional[str] = None
    applicants_count: int
    status: str


class RecruiterJobItem(BaseModel):
    job_id: str
    title: str
    company_id: str
    employment_type: str
    location: str
    work_mode: str
    status: str
    posted_datetime: Optional[str] = None
    views_count: int
    applicants_count: int
    salary_range: Optional[SalaryRange] = None


class StandardErrorResponse(BaseModel):
    detail: str


class GenericSuccessResponse(BaseModel):
    message: str
    data: Dict[str, Any]