"""
FastAPI Authentication Dependencies

Provides dependency injection for protected routes.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from .jwt_validator import decode_token, TokenValidationError


# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


class UserInfo:
    """Authenticated user information."""
    
    def __init__(self, payload: dict):
        self.id: str = payload.get("sub", "")
        self.email: Optional[str] = payload.get("email")
        self.role: str = payload.get("role", "authenticated")
        self.aud: str = payload.get("aud", "")
        self.raw: dict = payload
    
    def __repr__(self) -> str:
        return f"UserInfo(id={self.id}, email={self.email}, role={self.role})"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserInfo:
    """
    Dependency that validates JWT and returns current user.
    
    Use this to protect routes that require authentication.
    
    Example:
        @router.get("/protected")
        async def protected_route(user: UserInfo = Depends(get_current_user)):
            return {"user_id": user.id}
    
    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        payload = decode_token(credentials.credentials)
        return UserInfo(payload)
    except TokenValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[UserInfo]:
    """
    Dependency that optionally validates JWT.
    
    Returns None if no token provided, user info if valid token.
    Use for routes that work with or without authentication.
    
    Example:
        @router.get("/public")
        async def public_route(user: Optional[UserInfo] = Depends(get_optional_user)):
            if user:
                return {"message": f"Hello, {user.email}"}
            return {"message": "Hello, anonymous"}
    """
    if credentials is None:
        return None
    
    try:
        payload = decode_token(credentials.credentials)
        return UserInfo(payload)
    except TokenValidationError:
        return None


async def require_admin(
    user: UserInfo = Depends(get_current_user)
) -> UserInfo:
    """
    Dependency that requires admin role.
    
    Example:
        @router.delete("/admin-only")
        async def admin_route(user: UserInfo = Depends(require_admin)):
            return {"admin": user.email}
    
    Raises:
        HTTPException: 403 if user is not admin
    """
    if user.role != "service_role":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
