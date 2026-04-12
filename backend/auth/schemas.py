from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str

class UpdateUserRoleRequest(BaseModel):
    role: str

class UpdateUserPasswordRequest(BaseModel):
    password: str
