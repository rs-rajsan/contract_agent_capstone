import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://pguser:pgpassword@localhost:5432/contract_intel")

# Engine
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# Session
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Declarative Base for models
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to yield an async SQLAlchemy session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def create_tables():
    """Fallback method for dev environment"""
    # Import models so metadata knows about them
    from backend.auth.models import User
    
    async with engine.begin() as conn:
        # We use alembic for migrations, but as a fallback for dev testing:
        await conn.run_sync(Base.metadata.create_all)
        
    logger.info("Database fallback create_tables completed successfully")
