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
