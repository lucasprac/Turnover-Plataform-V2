"""
JWT Token Validation

Validates Supabase JWT tokens for API authentication.
"""
from jose import jwt, JWTError, ExpiredSignatureError
from typing import Optional
from config import settings


class TokenValidationError(Exception):
    """Raised when token validation fails."""
    pass


def decode_token(token: str) -> dict:
    """
    Decode and validate a Supabase JWT token.
    
    Args:
        token: JWT token string (without 'Bearer ' prefix)
        
    Returns:
        dict: Decoded token payload containing user info
        
    Raises:
        TokenValidationError: If token is invalid or expired
    """
    if not settings.SUPABASE_JWT_SECRET:
        raise TokenValidationError(
            "SUPABASE_JWT_SECRET not configured. Cannot validate tokens."
        )
    
    try:
        # Supabase uses HS256 algorithm
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except ExpiredSignatureError:
        raise TokenValidationError("Token has expired")
    except JWTError as e:
        raise TokenValidationError(f"Invalid token: {str(e)}")


def get_user_id(token: str) -> str:
    """
    Extract user ID from a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        str: User ID (sub claim)
    """
    payload = decode_token(token)
    return payload.get("sub", "")


def get_user_email(token: str) -> Optional[str]:
    """
    Extract user email from a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Optional[str]: User email if present
    """
    payload = decode_token(token)
    return payload.get("email")


def get_user_role(token: str) -> str:
    """
    Extract user role from a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        str: User role (defaults to 'authenticated')
    """
    payload = decode_token(token)
    return payload.get("role", "authenticated")
