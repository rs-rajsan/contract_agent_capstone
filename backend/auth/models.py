import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from backend.shared.db.postgres import Base

class UserRole(str, enum.Enum):
    # Business Tier
    executive = "executive"
    ops_lead = "ops_lead"
    
    # Legal & Analysis Tier
    analyst = "analyst"
    auditor = "auditor"
    risk_manager = "risk_manager"
    hitl_supervisor = "hitl_supervisor"
    
    # Technical Ops Tier
    admin = "admin"
    ba = "ba"
    ai_dev = "ai_dev"
    qa = "qa"

class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    deactivated = "deactivated"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, create_constraint=True, native_enum=False), default=UserRole.analyst, nullable=False)
    
    # Profile Info
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(50), nullable=True)
    job_title = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(Enum(UserStatus, create_constraint=True, native_enum=False), default=UserStatus.active, nullable=False)
    
    # Audit Traceability
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    created_by = Column(String(50), nullable=True) # Username of creator
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=True)
    updated_by = Column(String(50), nullable=True) # Username of last updater
    last_login = Column(DateTime, nullable=True)
