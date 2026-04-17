from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth_crud import create_member_account, create_recruiter_account, login_user
from app.auth_schemas import (
    AuthResponse,
    LoginRequest,
    MemberSignupRequest,
    RecruiterSignupRequest,
)
from app.db import get_db

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
        recruiter_id=payload.recruiter_id,
        company_id=payload.company_id,
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