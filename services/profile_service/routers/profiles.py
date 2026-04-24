"""
routers/profiles.py – Profile API endpoints (Raniel P3)
Implements the group's API specification for member profile management.
All endpoints use POST (as per spec) with standard request/response formats.

API Spec Source: Group Project API Documentation
"""

from fastapi import APIRouter, HTTPException, status, UploadFile, File
from typing import List, Optional
import os, uuid, shutil

from services.profile_service.models.profile import (
    MemberCreateRequest, MemberCreateResponse,
    MemberGetRequest, MemberGetResponse,
    MemberUpdateRequest, MemberUpdateResponse,
    MemberDeleteRequest, MemberDeleteResponse,
    MemberSearchRequest, MemberSearchResponse,
    ExperienceGetRequest, ExperienceAddRequest, ExperienceDeleteRequest, ExperienceListResponse,
    EducationGetRequest, EducationAddRequest, EducationDeleteRequest, EducationListResponse,
    ErrorResponse
)
from services.profile_service.services.profile_service import ProfileService

router = APIRouter(prefix="", tags=["members"])


# ==================== Member CRUD Endpoints (POST-based per spec) ====================

@router.post("/members/create", response_model=MemberCreateResponse)
async def create_member(request: MemberCreateRequest):
    """
    POST /members/create
    Creates a new member profile.
    
    Request:
    {
        "full_name": "Priya Sharma",
        "email": "priya@example.com",
        "headline": "Senior ML Engineer",
        "location": "San Francisco, CA",
        "industry": "Technology",
        "skills": ["Python", "TensorFlow", "MLOps"],
        "summary": "Passionate about building production ML systems."
    }
    """
    try:
        result = ProfileService.create_member(request.dict())
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/members/get", response_model=MemberGetResponse)
async def get_member(request: MemberGetRequest):
    """
    POST /members/get
    Retrieves member profile details by member_id.
    
    Request:
    {
        "member_id": "mbr_0xA4F2"
    }
    """
    profile = ProfileService.get_member_profile(request.member_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member not found: {request.member_id}"
        )
    return profile


@router.post("/members/update", response_model=MemberUpdateResponse)
async def update_member(request: MemberUpdateRequest):
    """
    POST /members/update
    Updates member profile fields.
    
    Request:
    {
        "member_id": "mbr_0xA4F2",
        "fields": {
            "headline": "Staff ML Engineer",
            "skills": ["Python", "TensorFlow", "MLOps", "Kubernetes"],
            "location": "Seattle, WA"
        }
    }
    """
    if not request.fields or len(request.fields) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update"
        )

    try:
        result = ProfileService.update_member(request.member_id, request.fields)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member not found: {request.member_id}"
        )
    return result


@router.post("/members/delete", response_model=MemberDeleteResponse)
async def delete_member(request: MemberDeleteRequest):
    """
    POST /members/delete
    Deletes a member profile permanently.
    
    Request:
    {
        "member_id": "mbr_0xA4F2",
        "reason": "user_requested"
    }
    """
    deleted = ProfileService.delete_member(request.member_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member not found: {request.member_id}"
        )
    return MemberDeleteResponse(
        member_id=request.member_id,
        deleted_at=deleted,
        message="Member profile permanently removed."
    )


@router.post("/members/search", response_model=MemberSearchResponse)
async def search_members(request: MemberSearchRequest):
    """
    POST /members/search
    Searches for members with filters (skill, location, keyword).
    
    Request:
    {
        "filters": {
            "skill": "TensorFlow",
            "location": "San Francisco, CA",
            "keyword": "ML Engineer"
        },
        "pagination": {
            "page": 1,
            "page_size": 20
        }
    }
    """
    results, total = ProfileService.search_members(
        filters=request.filters.dict() if request.filters else {},
        page=request.pagination.page if request.pagination else 1,
        page_size=request.pagination.page_size if request.pagination else 20
    )
    
    return MemberSearchResponse(
        total=total,
        page=request.pagination.page if request.pagination else 1,
        page_size=request.pagination.page_size if request.pagination else 20,
        results=results
    )


# ── Experience endpoints ─────────────────────────────────────────────

@router.post("/members/experience/get", response_model=ExperienceListResponse)
async def get_experience(request: ExperienceGetRequest):
    items = ProfileService.get_experience(request.member_id)
    return ExperienceListResponse(member_id=request.member_id, experience=items)


@router.post("/members/experience/add", response_model=ExperienceListResponse)
async def add_experience(request: ExperienceAddRequest):
    ProfileService.add_experience(request.member_id, request.dict(exclude={"member_id"}))
    items = ProfileService.get_experience(request.member_id)
    return ExperienceListResponse(member_id=request.member_id, experience=items)


@router.post("/members/experience/delete")
async def delete_experience(request: ExperienceDeleteRequest):
    deleted = ProfileService.delete_experience(request.experience_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Experience entry not found")
    return {"deleted": True, "experience_id": request.experience_id}


# ── Education endpoints ──────────────────────────────────────────────

@router.post("/members/education/get", response_model=EducationListResponse)
async def get_education(request: EducationGetRequest):
    items = ProfileService.get_education(request.member_id)
    return EducationListResponse(member_id=request.member_id, education=items)


@router.post("/members/education/add", response_model=EducationListResponse)
async def add_education(request: EducationAddRequest):
    ProfileService.add_education(request.member_id, request.dict(exclude={"member_id"}))
    items = ProfileService.get_education(request.member_id)
    return EducationListResponse(member_id=request.member_id, education=items)


@router.post("/members/education/delete")
async def delete_education(request: EducationDeleteRequest):
    deleted = ProfileService.delete_education(request.education_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Education entry not found")
    return {"deleted": True, "education_id": request.education_id}


UPLOAD_DIR = "/app/uploads/avatars"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

@router.post("/members/{member_id}/photo")
async def upload_photo(member_id: str, file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, or GIF images are allowed")

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{member_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    photo_url = f"http://localhost:8001/uploads/avatars/{filename}"

    try:
        ProfileService.update_member(member_id, {"profile_photo_url": photo_url})
    except Exception:
        os.remove(filepath)
        raise HTTPException(status_code=500, detail="Failed to save photo URL")

    return {"profile_photo_url": photo_url}


@router.post("/members/{member_id}/banner")
async def upload_banner(member_id: str, file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, or GIF images are allowed")

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"banner_{member_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    banner_url = f"http://localhost:8001/uploads/avatars/{filename}"

    try:
        ProfileService.update_member(member_id, {"banner_photo_url": banner_url})
    except Exception:
        os.remove(filepath)
        raise HTTPException(status_code=500, detail="Failed to save banner URL")

    return {"banner_photo_url": banner_url}