from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.profile_service.auth_crud import (
    create_member_account,
    create_recruiter_account,
    login_user,
    get_recruiter,
    search_recruiters,
)
from services.profile_service.auth_schemas import (
    AuthResponse,
    LoginRequest,
    MemberSignupRequest,
    RecruiterSignupRequest,
)
from shared.mysql_client import get_db_dependency as get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup/member", response_model=AuthResponse)
def signup_member(payload: MemberSignupRequest, db: Session = Depends(get_db)):
    user = create_member_account(
        db,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password=payload.password,
    )
    return AuthResponse(**user)


@router.post("/signup/recruiter", response_model=AuthResponse)
def signup_recruiter(payload: RecruiterSignupRequest, db: Session = Depends(get_db)):
    user = create_recruiter_account(
        db,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        company_name=payload.company_name,
        password=payload.password,
    )
    return AuthResponse(**user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = login_user(
        db,
        email=payload.email,
        password=payload.password,
        role=payload.role,
    )
    return AuthResponse(**user)


class RecruiterGetRequest(BaseModel):
    recruiter_id: str


class RecruiterSearchRequest(BaseModel):
    name: str = ""
    limit: int = 8


@router.post("/recruiters/get")
def get_recruiter_route(payload: RecruiterGetRequest, db: Session = Depends(get_db)):
    recruiter = get_recruiter(db, recruiter_id=payload.recruiter_id)
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return recruiter


@router.post("/recruiters/search")
def search_recruiters_route(payload: RecruiterSearchRequest, db: Session = Depends(get_db)):
    results = search_recruiters(db, name=payload.name, limit=payload.limit)
    return {"results": results}
