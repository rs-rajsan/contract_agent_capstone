from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import cast, String
from datetime import datetime, timezone
from backend.auth.models import User, UserRole, UserStatus

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(cast(User.id, String) == str(user_id)))
        return result.scalar_one_or_none()

    async def create(
        self, 
        username: str, 
        hashed_password: str, 
        role: UserRole,
        created_by: str,
        **profile_data
    ) -> User:
        user = User(
            username=username, 
            hashed_password=hashed_password, 
            role=role,
            **profile_data
        )
        # Explicitly set audit fields to ensure persistence
        user.created_by = created_by
        user.created_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        self.session.add(user)
        await self.session.flush()
        return user

    async def list_all(self) -> List[User]:
        result = await self.session.execute(select(User))
        return list(result.scalars().all())

    async def update_role(self, username: str, role: UserRole, updated_by: str) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            user.role = role
            user.updated_by = updated_by
            user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.session.add(user)
            await self.session.flush()
        return user

    async def deactivate(self, username: str, updated_by: str) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            user.is_active = False
            user.status = UserStatus.deactivated
            user.updated_by = updated_by
            user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.session.add(user)
            await self.session.flush()
        return user

    async def update_password(self, username: str, hashed_password: str, updated_by: str) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            user.hashed_password = hashed_password
            user.updated_by = updated_by
            user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.session.add(user)
            await self.session.flush()
        return user

    async def update_profile(self, username: str, profile_data: dict, updated_by: str) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            for key, value in profile_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.updated_by = updated_by
            user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.session.add(user)
            await self.session.flush()
        return user

    async def update_last_login(self, username: str) -> None:
        user = await self.get_by_username(username)
        if user:
            user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
            self.session.add(user)
            await self.session.flush()
