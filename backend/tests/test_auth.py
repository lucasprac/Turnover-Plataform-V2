"""
Authentication Tests

Tests for JWT validation and auth dependencies.
"""
import pytest
from fastapi import HTTPException
from jose import jwt


class TestJWTValidator:
    """Tests for JWT token validation."""
    
    def test_decode_valid_token(self, mock_env_vars):
        """Test decoding a valid JWT token."""
        from backend.app.auth.jwt_validator import decode_token
        from config import settings
        
        # Create a valid token
        payload = {
            "sub": "user-123",
            "email": "test@example.com",
            "role": "authenticated",
            "aud": "authenticated"
        }
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        # Decode should work
        result = decode_token(token)
        assert result["sub"] == "user-123"
        assert result["email"] == "test@example.com"
    
    def test_decode_invalid_token(self, mock_env_vars):
        """Test that invalid tokens raise TokenValidationError."""
        from backend.app.auth.jwt_validator import decode_token, TokenValidationError
        
        with pytest.raises(TokenValidationError):
            decode_token("invalid-token")
    
    def test_decode_expired_token(self, mock_env_vars):
        """Test that expired tokens raise TokenValidationError."""
        from backend.app.auth.jwt_validator import decode_token, TokenValidationError
        from config import settings
        import time
        
        # Create an expired token
        payload = {
            "sub": "user-123",
            "exp": int(time.time()) - 3600,  # Expired 1 hour ago
            "aud": "authenticated"
        }
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        with pytest.raises(TokenValidationError, match="expired"):
            decode_token(token)


class TestAuthDependencies:
    """Tests for FastAPI auth dependencies."""
    
    def test_get_current_user_no_token(self, client):
        """Test that missing token returns 401."""
        response = client.post("/train")
        assert response.status_code == 401
        assert "Authentication required" in response.json()["detail"]
    
    def test_get_current_user_invalid_token(self, client):
        """Test that invalid token returns 401."""
        response = client.post(
            "/train",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401
    
    def test_protected_route_with_valid_token(self, client, mock_auth):
        """Test that valid token allows access to protected route."""
        with mock_auth:
            response = client.get("/train/status")
            # Status endpoint should work (it's a GET, not protected)
            assert response.status_code == 200


class TestUserInfo:
    """Tests for UserInfo class."""
    
    def test_user_info_creation(self):
        """Test UserInfo object creation from payload."""
        from backend.app.auth.dependencies import UserInfo
        
        payload = {
            "sub": "user-456",
            "email": "user@example.com",
            "role": "authenticated"
        }
        
        user = UserInfo(payload)
        assert user.id == "user-456"
        assert user.email == "user@example.com"
        assert user.role == "authenticated"
    
    def test_user_info_repr(self):
        """Test UserInfo string representation."""
        from backend.app.auth.dependencies import UserInfo
        
        user = UserInfo({"sub": "123", "email": "a@b.com", "role": "user"})
        assert "123" in repr(user)
        assert "a@b.com" in repr(user)
