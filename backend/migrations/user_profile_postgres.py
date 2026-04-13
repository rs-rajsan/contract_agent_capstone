import asyncio
import sys
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Basic Logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use the same DB URL as the application
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://pguser:pgpassword@db:5432/contract_intel")
# If running locally outside docker, change 'db' to 'localhost'
if os.getenv("RUNNING_LOCALLY", "false") == "true":
    DATABASE_URL = DATABASE_URL.replace("@db:", "@localhost:")

async def migrate():
    """
    Manually add profile columns to the 'users' table in PostgreSQL.
    This is a safe operation that uses 'IF NOT EXISTS' logic via raw SQL.
    """
    engine = create_async_engine(DATABASE_URL)
    
    # SQL commands to add columns
    # Note: Postgres doesn't have 'ADD COLUMN IF NOT EXISTS' in older versions, 
    # so we'll use a DO block for safety.
    
    columns = [
        ("first_name", "VARCHAR(100)"),
        ("last_name", "VARCHAR(100)"),
        ("middle_name", "VARCHAR(100)"),
        ("email", "VARCHAR(255)"),
        ("phone_number", "VARCHAR(50)"),
        ("job_title", "VARCHAR(100)"),
        ("department", "VARCHAR(100)")
    ]
    
    async with engine.begin() as conn:
        logger.info("Starting User Profile Postgres Migration...")
        
        for col_name, col_type in columns:
            query = text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='users' AND column_name='{col_name}') THEN
                    ALTER TABLE users ADD COLUMN {col_name} {col_type};
                END IF;
            END
            $$;
            """)
            await conn.execute(query)
            logger.info(f"✅ Verified column: {col_name}")
            
        # Add index and unique constraint for email
        try:
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);"))
            logger.info("✅ Verified unique index on email")
        except Exception as e:
            logger.warning(f"⚠️ Could not create index (may already exist): {e}")
            
    await engine.dispose()
    logger.info("User Profile Postgres Migration Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
