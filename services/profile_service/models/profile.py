"""
models/profile.py – Pydantic schemas matching Group API spec (Raniel P3)
Request/response models for all profile endpoints per team documentation.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==================== CREATE Member ====================

class MemberCreateRequest(BaseModel):
    """POST /members/create request."""
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    headline: str = Field(..., min_length=1, max_length=255)
    location: str = Field(..., min_length=1, max_length=255)
    skills: Optional[List[str]] = Field(default=None)
    summary: Optional[str] = Field(default=None, max_length=2000)


class MemberCreateResponse(BaseModel):
    """POST /members/create response."""
    member_id: str
    full_name: str
    created_at: datetime
    profile_url: str


# ==================== GET Member ====================

class MemberGetRequest(BaseModel):
    """POST /members/get request."""
    member_id: str


class MemberSearchResult(BaseModel):
    """Search result item for /members/search."""
    member_id: str
    full_name: str
    headline: str
    location: str
    skills: Optional[List[str]] = None
    match_score: Optional[float] = None
    profile_photo_url: Optional[str] = None


class MemberGetResponse(BaseModel):
    """POST /members/get response."""
    member_id: str
    full_name: str
    email: Optional[str] = None
    headline: Optional[str] = None
    location: str
    profile_photo_url: Optional[str] = None
    banner_photo_url: Optional[str] = None
    skills: Optional[List[str]] = None
    summary: Optional[str] = None
    connections: int = 0
    created_at: datetime
    updated_at: datetime


# ==================== UPDATE Member ====================

class MemberUpdateRequest(BaseModel):
    """POST /members/update request."""
    member_id: str
    fields: Dict[str, Any] = Field(..., description="Fields to update")

    @validator('fields')
    def fields_not_empty(cls, v):
        if not v:
            raise ValueError('At least one field must be provided')
        return v


class MemberUpdateResponse(BaseModel):
    """POST /members/update response."""
    member_id: str
    updated_fields: List[str]
    updated_at: datetime


# ==================== DELETE Member ====================

class MemberDeleteRequest(BaseModel):
    """POST /members/delete request."""
    member_id: str
    reason: Optional[str] = Field(default=None, description="Reason for deletion")


class MemberDeleteResponse(BaseModel):
    """POST /members/delete response."""
    member_id: str
    deleted_at: datetime
    message: str


# ==================== SEARCH Members ====================

class SearchFilters(BaseModel):
    """Search filter options."""
    name: Optional[str] = None
    skill: Optional[str] = None
    location: Optional[str] = None
    keyword: Optional[str] = None


class Pagination(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class MemberSearchRequest(BaseModel):
    """POST /members/search request."""
    filters: Optional[SearchFilters] = None
    pagination: Optional[Pagination] = None


class MemberSearchResponse(BaseModel):
    """POST /members/search response."""
    total: int
    page: int
    page_size: int
    results: List[MemberSearchResult]


# ==================== EXPERIENCE ====================

class ExperienceItem(BaseModel):
    experience_id: Optional[str] = None
    member_id: Optional[str] = None
    title: str
    company_name: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class ExperienceGetRequest(BaseModel):
    member_id: str


class ExperienceAddRequest(BaseModel):
    member_id: str
    title: str
    company_name: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

    @validator("end_date", "start_date", "location", "description", pre=True)
    def empty_str_to_none(cls, v):
        return None if v == "" else v


class ExperienceDeleteRequest(BaseModel):
    experience_id: str


class ExperienceListResponse(BaseModel):
    member_id: str
    experience: List[ExperienceItem]


# ==================== EDUCATION ====================

class EducationItem(BaseModel):
    education_id: Optional[str] = None
    member_id: Optional[str] = None
    school_name: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class EducationGetRequest(BaseModel):
    member_id: str


class EducationAddRequest(BaseModel):
    member_id: str
    school_name: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class EducationDeleteRequest(BaseModel):
    education_id: str


class EducationListResponse(BaseModel):
    member_id: str
    education: List[EducationItem]


# ==================== Error Response ====================

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    status_code: int