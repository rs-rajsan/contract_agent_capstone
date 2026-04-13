import os
import asyncio
from sqlalchemy import select, update
from backend.auth.models import User
from backend.auth.password import hash_password
from backend.shared.db.postgres import AsyncSessionLocal
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

async def force_sync_admin():
    """Forcefully updates the existing admin user's password to match .env setting"""
    new_password = os.getenv("ADMIN_DEFAULT_PASSWORD", "Admin@1234!")
    hashed = hash_password(new_password)
    
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        stmt = select(User).where(User.username == 'admin')
        result = await session.execute(stmt)
        admin = result.scalar_one_or_none()
        
        if admin:
            logger.info(f"Existing admin user found. Forcefully synchronizing password...")
            update_stmt = (
                update(User)
                .where(User.username == 'admin')
                .values(hashed_password=hashed)
            )
            await session.execute(update_stmt)
            await session.commit()
            logger.info("✅ SUCCESS: Admin password synchronized with 'Admin@1234!'")
        else:
            logger.warning("Admin user not found. Please ensure the system has been initialized.")

if __name__ == "__main__":
    asyncio.run(force_sync_admin())
