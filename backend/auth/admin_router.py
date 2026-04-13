from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.schemas import (
    UserResponse, 
    CreateUserRequest, 
    UpdateUserRoleRequest, 
    UpdateUserPasswordRequest,
    UserProfileUpdateRequest
)
from backend.auth.models import User, UserRole
from backend.auth.password import hash_password
from backend.auth.repository import UserRepository
from backend.auth.dependencies import require_permission
from backend.auth.rbac import Permission
from backend.shared.db.postgres import get_db
from backend.infrastructure.audit_logger import AuditLogger
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/users", response_model=UserResponse)
async def create_user(
    request: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """Admin-only: Create a new user"""
    repo = UserRepository(db)
    
    existing = await repo.get_by_username(request.username)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
        
    # Extract profile data
    profile_data = request.dict(exclude={'username', 'password', 'role'})

    # Diagnostic Log
    logger.info(f"Provisioning user by administrator", extra={
        "operator": current_user.username,
        "target_user": request.username
    })

    user = await repo.create(
        username=request.username,
        hashed_password=hash_password(request.password),
        role=request.role,
        created_by=current_user.username,
        **profile_data
    )
    await db.commit()
    
    # Audit Logging
    try:
        audit = AuditLogger()
        audit.log_event(
            event_type="USER_PROVISIONED",
            resource_id=request.username,
            action="create",
            status="success",
            metadata={"role": request.role}
        )
    except Exception as e:
        logger.warning(f"Failed to audit user provision: {e}")
        
    return user

@router.get("/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Admin-only: List all users"""
    repo = UserRepository(db)
    users = await repo.list_all()
    return users

@router.patch("/users/{username}/role", response_model=UserResponse)
async def update_user_role(
    username: str,
    request: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """Admin-only: Update a user's role"""
    try:
        new_role = UserRole(request.role.lower())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {request.role}")
        
    repo = UserRepository(db)
    user = await repo.update_role(username, new_role, updated_by=current_user.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    await db.commit()
    return user

@router.delete("/users/{username}", response_model=UserResponse)
async def deactivate_user(
    username: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """Admin-only: Deactivate a user"""
    repo = UserRepository(db)
    user = await repo.deactivate(username, updated_by=current_user.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    await db.commit()
    return user

@router.patch("/users/{username}/password", response_model=UserResponse)
async def reset_user_password(
    username: str,
    request: UpdateUserPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """Admin-only: Reset a user's password"""
    repo = UserRepository(db)
    user = await repo.update_password(username, hash_password(request.password), updated_by=current_user.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    await db.commit()
    return user

@router.put("/users/{username}/profile", response_model=UserResponse)
async def update_user_profile(
    username: str,
    request: UserProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """Admin-only: Update a user's identity profile metadata"""
    repo = UserRepository(db)
    # Filter out None values to avoid overwriting with nulls if not provided
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    
    user = await repo.update_profile(username, update_data, updated_by=current_user.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    await db.commit()
    
    # Audit Logging
    try:
        audit = AuditLogger()
        audit.log_event(
            event_type="USER_PROFILE_UPDATED",
            resource_id=username,
            action="update",
            status="success",
            metadata={"updated_fields": list(update_data.keys())}
        )
    except Exception as e:
        logger.warning(f"Failed to audit profile update: {e}")
        
    return user
