from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..services import auth_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class UserInfo:
    """Class to hold user information for dependencies."""
    def __init__(self, id: int, email: str):
        self.id = id
        self.email = email
    
    def __repr__(self) -> str:
        return f"UserInfo(id={self.id}, email={self.email})"

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserInfo:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = auth_service.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return UserInfo(id=user.id, email=user.email)

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[UserInfo]:
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None

async def require_admin(
    user: UserInfo = Depends(get_current_user)
) -> UserInfo:
    # Logic for admin check could be added here
    return user

async def get_mode_user(
    request: Request, 
    user: Optional[UserInfo] = Depends(get_optional_user)
) -> Optional[UserInfo]:
    """
    Mode-aware dependency.
    If path is an 'app' path, requires authentication.
    If path is a 'demo' path, allows anonymous (but frontend protects it too now).
    """
    is_app_path = "/api/app" in request.url.path
    if is_app_path and not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for production mode"
        )
    return user
