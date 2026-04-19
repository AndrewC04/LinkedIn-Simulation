"""
routers/profiles.py – Profile API endpoints (Raniel P3)
Implements the group's API specification for member profile management.
All endpoints use POST (as per spec) with standard request/response formats.

API Spec Source: Group Project API Documentation
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from services.profile_service.models.profile import (
    MemberCreateRequest, MemberCreateResponse,
    MemberGetRequest, MemberGetResponse,
    MemberUpdateRequest, MemberUpdateResponse,
    MemberDeleteRequest, MemberDeleteResponse,
    MemberSearchRequest, MemberSearchResponse,
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

    result = ProfileService.update_member(request.member_id, request.fields)
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