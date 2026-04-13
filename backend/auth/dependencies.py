from typing import Callable, Coroutine, Any
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from backend.shared.db.postgres import get_db
from backend.shared.utils.logger import get_logger
from backend.auth.jwt_service import decode_token
from backend.auth.repository import UserRepository
from backend.auth.models import User
from backend.auth.rbac import Permission, has_permission
from backend.shared.utils.context_vars import user_id_var, username_var

logger = get_logger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to retrieve the current user from JWT token"""
    payload = decode_token(token)
    
    repo = UserRepository(db)
    user = await repo.get_by_username(payload.sub)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user or user not found",
        )
    
    # Sync context for Agentic Tracing (Audit/Phoenix compliance)
    user_id_var.set(str(user.id))
    username_var.set(user.username)
    
    return user

def require_permission(perm: Permission) -> Callable:
    """Dependency factory checking for a specific permission"""
    async def permission_dependency(user: User = Depends(get_current_user)) -> User:
        if not has_permission(user.role, perm):
            logger.warning(
                f"Permission denied: {user.username} (role={user.role.value}) attempted to access {perm.value}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{perm.value}' required",
            )
        return user
    return permission_dependency
