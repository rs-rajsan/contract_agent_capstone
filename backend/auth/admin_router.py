from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.schemas import UserResponse, CreateUserRequest, UpdateUserRoleRequest, UpdateUserPasswordRequest
from backend.auth.models import User, UserRole
from backend.auth.password import hash_password
from backend.auth.repository import UserRepository
from backend.auth.dependencies import require_permission
from backend.auth.rbac import Permission
from backend.shared.db.postgres import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/users", response_model=UserResponse)
async def create_user(
    request: CreateUserRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Create a new user"""
    repo = UserRepository(db)
    
    existing = await repo.get_by_username(request.username)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
        
    try:
        role = UserRole(request.role.lower())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {request.role}")

    user = await repo.create(
        username=request.username,
        hashed_password=hash_password(request.password),
        role=role
    )
    await db.commit()
    
    return {
        "id": str(user.id),
        "username": user.username,
        "role": user.role.value,
        "is_active": user.is_active
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Admin-only: List all users"""
    repo = UserRepository(db)
    users = await repo.list_all()
    
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "role": u.role.value,
            "is_active": u.is_active
        } 
        for u in users
    ]

@router.patch("/users/{username}/role", response_model=UserResponse)
async def update_user_role(
    username: str,
    request: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Update a user's role"""
    try:
        new_role = UserRole(request.role.lower())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {request.role}")
        
    repo = UserRepository(db)
    user = await repo.update_role(username, new_role)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    await db.commit()
    return {
        "id": str(user.id),
        "username": user.username,
        "role": user.role.value,
        "is_active": user.is_active
    }

@router.delete("/users/{username}", response_model=UserResponse)
async def deactivate_user(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Deactivate a user"""
    repo = UserRepository(db)
    user = await repo.deactivate(username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    await db.commit()
    return {
        "id": str(user.id),
        "username": user.username,
        "role": user.role.value,
        "is_active": user.is_active
    }

@router.patch("/users/{username}/password", response_model=UserResponse)
async def reset_user_password(
    username: str,
    request: UpdateUserPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Reset a user's password"""
    repo = UserRepository(db)
    user = await repo.update_password(username, hash_password(request.password))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    await db.commit()
    return {
        "id": str(user.id),
        "username": user.username,
        "role": user.role.value,
        "is_active": user.is_active
    }
