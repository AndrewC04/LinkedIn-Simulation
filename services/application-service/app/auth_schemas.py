from pydantic import BaseModel, EmailStr


class MemberSignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


class RecruiterSignupRequest(BaseModel):
    recruiter_id: str
    company_id: str
    first_name: str
    last_name: str
    email: EmailStr
    company_name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "member" or "recruiter"


class AuthResponse(BaseModel):
    user_id: str
    email: str
    role: str
    first_name: str
    last_name: str