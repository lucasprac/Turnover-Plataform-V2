"""
FastAPI Authentication Dependencies

Provides dummy dependency injection for routes where auth was removed.
"""
from fastapi import Depends
from typing import Optional

# Mock UserInfo class
class UserInfo:
    """Authenticated user information (Mock)."""
    
    def __init__(self, payload: dict = None):
        if payload is None:
            payload = {}
        self.id: str = payload.get("sub", "dummy-user-id")
        self.email: Optional[str] = payload.get("email", "dummy@example.com")
        self.role: str = payload.get("role", "authenticated")
        self.aud: str = payload.get("aud", "")
        self.raw: dict = payload
    
    def __repr__(self) -> str:
        return f"UserInfo(id={self.id}, email={self.email}, role={self.role})"


async def get_current_user() -> UserInfo:
    """
    Dummy dependency that returns a mock user.
    """
    return UserInfo()


async def get_optional_user() -> Optional[UserInfo]:
    """
    Dummy dependency that returns a mock user.
    """
    return UserInfo()


async def require_admin(
    user: UserInfo = Depends(get_current_user)
) -> UserInfo:
    """
    Dummy dependency that allows all access.
    """
    return user
