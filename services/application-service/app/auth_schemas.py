from pydantic import BaseModel, EmailStr, Field, ConfigDict


class MemberSignupRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: EmailStr
    password: str


class RecruiterSignupRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: EmailStr
    company_name: str = Field(alias="companyName")
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


class AuthResponse(BaseModel):
    user_id: str
    email: str
    role: str
    first_name: str
    last_name: str
    access_token: str
    token_type: str = "bearer"