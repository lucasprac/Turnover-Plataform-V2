"""
Pytest Configuration and Fixtures

Provides shared fixtures for all backend tests.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


# =============================================================================
# Mock Supabase credentials to prevent errors during testing
# =============================================================================
@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Set required environment variables for testing."""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "test-anon-key")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-jwt-secret-key-min-32-chars-long!")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:5173")


# =============================================================================
# FastAPI Test Client
# =============================================================================
@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    from backend.api import app
    return TestClient(app)


# =============================================================================
# Auth Fixtures
# =============================================================================
@pytest.fixture
def mock_valid_token():
    """Return a mock valid JWT token payload."""
    return {
        "sub": "user-123",
        "email": "test@example.com",
        "role": "authenticated",
        "aud": "authenticated"
    }


@pytest.fixture
def auth_headers(mock_valid_token):
    """
    Create authorization headers with a mocked valid token.
    
    Use with patch to bypass actual JWT validation.
    """
    return {"Authorization": "Bearer mock-valid-token"}


@pytest.fixture
def mock_auth(mock_valid_token):
    """
    Mock the authentication dependency to always return a valid user.
    
    Usage:
        def test_protected_endpoint(client, mock_auth):
            with mock_auth:
                response = client.post("/train")
    """
    from backend.app.auth.dependencies import UserInfo
    
    user = UserInfo(mock_valid_token)
    return patch(
        'backend.app.routers.predictions.get_current_user',
        return_value=user
    )


# =============================================================================
# Data Fixtures
# =============================================================================
@pytest.fixture
def sample_employee_data():
    """Sample employee data for testing predictions."""
    return {
        "id": "EMP001",
        "a1_gender": "Male",
        "a2_age": 35,
        "a6_education_level": "Bachelor",
        "B10_Tenure_in_month": 24,
        "B11_salary_today_brl": 8500.0,
        "c1_overall_employee_satisfaction": 7.5,
        "M_eNPS": 8.0,
        "B5_Degree_of_employment": 1.0,
        "B2_Public_service_status_ger": "No"
    }


@pytest.fixture
def sample_df(sample_employee_data):
    """Create a sample DataFrame for testing."""
    import pandas as pd
    return pd.DataFrame([sample_employee_data])


# =============================================================================
# Model Fixtures
# =============================================================================
@pytest.fixture
def mock_model_loaded():
    """Mock for when models are loaded successfully."""
    return patch('backend.app.services.prediction_service.load_data', return_value=MagicMock())
