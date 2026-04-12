from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import cast, String
from backend.auth.models import User, UserRole

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(cast(User.id, String) == str(user_id)))
        return result.scalar_one_or_none()

    async def create(self, username: str, hashed_password: str, role: UserRole) -> User:
        user = User(username=username, hashed_password=hashed_password, role=role)
        self.session.add(user)
        await self.session.flush()
        return user

    async def list_all(self) -> List[User]:
        result = await self.session.execute(select(User))
        return list(result.scalars().all())

    async def update_role(self, username: str, role: UserRole) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            user.role = role
            self.session.add(user)
            await self.session.flush()
        return user

    async def deactivate(self, username: str) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            user.is_active = False
            self.session.add(user)
            await self.session.flush()
        return user

    async def update_password(self, username: str, hashed_password: str) -> Optional[User]:
        user = await self.get_by_username(username)
        if user:
            user.hashed_password = hashed_password
            self.session.add(user)
            await self.session.flush()
        return user
