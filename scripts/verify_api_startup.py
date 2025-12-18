import sys
import os
from fastapi.testclient import TestClient

# Add root to sys.path
sys.path.append(os.getcwd())

try:
    from backend.api import app
    print("Successfully imported app.")
    
    client = TestClient(app)
    response = client.get("/")
    print(f"Root endpoint response: {response.status_code}")
    assert response.status_code == 200
    
    print("Verification Successful.")
except Exception as e:
    print(f"Verification Failed: {e}")
    sys.exit(1)
