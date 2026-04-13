from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.schemas import LoginRequest, TokenResponse, UserResponse
from backend.auth.password import verify_password
from backend.auth.jwt_service import create_access_token
from backend.auth.repository import UserRepository
from backend.auth.dependencies import get_current_user
from backend.auth.models import User, UserStatus
from backend.shared.db.postgres import get_db
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a JWT with diagnostic logging"""
    client_host = request.client.host if request.client else "unknown"
    repo = UserRepository(db)
    
    logger.info(f"Login attempt received", extra={
        "username": login_data.username,
        "client_ip": client_host,
        "operation": "user_login"
    })
    
    user = await repo.get_by_username(login_data.username)
    
    if not user:
        logger.warning(f"Login failed: user not found", extra={
            "username": login_data.username,
            "client_ip": client_host
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active or user.status != UserStatus.active:
        logger.warning(f"Login failed: account inactive or {user.status}", extra={
            "username": login_data.username,
            "user_id": str(user.id),
            "status": user.status
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Account is {user.status}",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(login_data.password, user.hashed_password):
        logger.warning(f"Login failed: incorrect password", extra={
            "username": login_data.username,
            "user_id": str(user.id)
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Update last_login directly on the loaded user object
        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add(user) # User was loaded earlier, but we re-add to be sure
        await db.commit()
        
        access_token = create_access_token(subject=user.username, role=user.role.value)
        
        logger.info(f"Login successful", extra={
            "username": user.username,
            "user_id": str(user.id),
            "role": user.role.value
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user)
        }
    except Exception as e:
        logger.error(f"Critical error during login token generation: {e}", extra={
            "username": user.username,
            "error": str(e)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal authentication error occurred"
        )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user"""
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout():
    """MVP-1 stub: return 200, client will clear token"""
    return {"status": "ok"}
