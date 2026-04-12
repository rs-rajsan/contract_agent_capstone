from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.schemas import LoginRequest, TokenResponse, UserResponse
from backend.auth.password import verify_password
from backend.auth.jwt_service import create_access_token
from backend.auth.repository import UserRepository
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.shared.db.postgres import get_db

router = APIRouter(tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a JWT"""
    repo = UserRepository(db)
    user = await repo.get_by_username(request.username)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(subject=user.username, role=user.role.value)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "role": user.role.value,
            "is_active": user.is_active
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user"""
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "role": current_user.role.value,
        "is_active": current_user.is_active
    }

@router.post("/logout")
async def logout():
    """MVP-1 stub: return 200, client will clear token"""
    return {"status": "ok"}
