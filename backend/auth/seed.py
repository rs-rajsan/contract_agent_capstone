import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.auth.models import User, UserRole
from backend.auth.password import hash_password
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

async def seed_admin_user(session: AsyncSession) -> None:
    """Idempotent: creates default admin user only if no users exist"""
    result = await session.execute(select(User).limit(1))
    first_user = result.scalar_one_or_none()

    if first_user is None:
        logger.info("No users found in database, creating default admin user")
        
        admin_password = os.getenv("ADMIN_DEFAULT_PASSWORD", "Admin@1234!")
        admin_user = User(
            username="admin",
            hashed_password=hash_password(admin_password),
            role=UserRole.admin,
            is_active=True
        )
        session.add(admin_user)
        try:
            await session.commit()
            logger.info("Successfully created default admin user")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to seed admin user: {e}")
    else:
        logger.info("Users table is not empty, skipping admin seed")
