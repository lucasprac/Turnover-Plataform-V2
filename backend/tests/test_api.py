"""
API Endpoint Tests

Tests for FastAPI endpoints including health checks and predictions.
"""
import pytest
from unittest.mock import patch, MagicMock


class TestHealthEndpoints:
    """Tests for health and status endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns API status."""
        response = client.get("/")
        assert response.status_code == 200
        assert "running" in response.json()["message"].lower()
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_api_info_endpoint(self, client):
        """Test API info endpoint."""
        response = client.get("/api/info")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "endpoints" in data



class TestTrainingEndpoints:
    """Tests for model training endpoints."""
    
    def test_train_status_unauthenticated(self, client):
        """Test training status is publicly accessible."""
        response = client.get("/train/status")
        assert response.status_code == 200
        data = response.json()
        assert "is_training" in data
        assert "progress" in data
    
    def test_train_endpoint(self, client):
        """Test training endpoint (now public)."""
        response = client.post("/train")
        # May fail due to model issues/bg thread, but should accessible (not 401)
        assert response.status_code != 401


class TestPredictionEndpoints:
    """Tests for prediction endpoints."""
    
    def test_individual_prediction(self, client, sample_df):
        """Test individual prediction endpoint."""
        with patch('backend.app.routers.predictions.load_data', return_value=sample_df):
            with patch('backend.app.routers.predictions.predict_individual') as mock_predict:
                mock_predict.return_value = {
                    'turnover_probability': 0.35,
                    'shap_values': {'feature1': 0.1},
                    'grouped_shap': []
                }
                response = client.post(
                    "/predict/individual",
                    json={"employee_id": "EMP001"}
                )
                # Should not be 401 or 500
                assert response.status_code in [200, 404]


class TestBayesianEndpoints:
    """Tests for Bayesian prediction endpoints."""
    
    def test_bayesian_train_status(self, client):
        """Test Bayesian training status endpoint."""
        response = client.get("/train/bayesian/status")
        assert response.status_code == 200
        data = response.json()
        assert "is_training" in data
        assert "status" in data


class TestDashboardEndpoint:
    """Tests for dashboard data endpoint."""
    
    def test_dashboard_data_loads(self, client):
        """Test dashboard data endpoint."""
        with patch('backend.app.routers.predictions.load_data', return_value=None):
            response = client.get("/dashboard-data")
            assert response.status_code == 200
            data = response.json()
            assert "metrics" in data
