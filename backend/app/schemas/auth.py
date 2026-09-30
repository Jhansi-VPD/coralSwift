"""Auth schemas (mirrors the existing login/me/refresh wire format)."""
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["hr@coralswift.com"])
    password: str = Field(min_length=1, examples=["CoralSwift#2026"])


class AuthUser(BaseModel):
    id: str | None = None
    email: str
    role: str
    fullName: str | None = None


class LoginResponse(BaseModel):
    success: bool
    user: AuthUser
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int | None = None
    redirectTo: str


class MeResponse(BaseModel):
    authenticated: bool
    source: str
    user: AuthUser
    permissions: list[str]
