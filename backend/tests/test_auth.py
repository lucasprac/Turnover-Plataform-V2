import pytest
from fastapi.testclient import TestClient
from backend.api import app
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User

@pytest.fixture(scope="module")
def test_client():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    client = TestClient(app)
    
    # Clean up users before tests
    db = SessionLocal()
    db.query(User).delete()
    db.commit()
    db.close()
    
    return client

def test_auth_flow(test_client):
    # 1. Register
    reg_response = test_client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert reg_response.status_code == 200
    assert reg_response.json()["email"] == "test@example.com"

    # 2. Login
    login_response = test_client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data
    token = data["access_token"]

    # 3. Verify /me
    me_response = test_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test@example.com"

    # 4. Fail login with wrong password
    bad_login = test_client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrong"}
    )
    assert bad_login.status_code == 401

    # 5. Fail register with duplicate email
    dup_reg = test_client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "newpassword"}
    )
    assert dup_reg.status_code == 400
