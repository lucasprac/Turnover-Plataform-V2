
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import os
from backend.api import app, STATIC_DIR

client = TestClient(app)

def test_path_traversal_prevention():
    """
    Test that path traversal attempts are blocked.
    We try to access a file known to exist outside the static directory.
    We'll use a temporary file for this test.
    """
    # Create a dummy file outside static dir but reachable via traversal if vulnerable
    # STATIC_DIR is usually backend/static or similar.
    # We'll create a secret file in the parent of STATIC_DIR.

    # Ensure STATIC_DIR exists
    if not STATIC_DIR.exists():
        STATIC_DIR.mkdir(parents=True, exist_ok=True)

    secret_file = STATIC_DIR.parent / "secret_test_file.txt"
    with open(secret_file, "w") as f:
        f.write("SECRET_CONTENT")

    try:
        # payload = "../secret_test_file.txt"
        # TestClient/Starlette might normalize "..", so we try encoded versions too if needed.
        # However, as seen in reproduction, logical traversal works if we can pass the path.

        # We manually construct a path that resolves to the secret file
        # But we pass it as the path parameter.

        # If we request /../secret_test_file.txt via client.get, it might be normalized.
        # Let's try to simulate what the handler receives.
        # But for an integration test, we want to test the API.

        # Using the %2e%2e trick often works to bypass client normalization but reach the server.
        response = client.get("/%2e%2e/secret_test_file.txt")

        # If vulnerable, it returns 200 and the content.
        # If secure, it should return 404 (handled by serve_spa fallback) or 403.

        if response.status_code == 200:
            content = response.text or response.content.decode()
            if "SECRET_CONTENT" in content:
                pytest.fail("Path traversal vulnerability detected! Accessed restricted file.")

        # Also check just logical path if the client allows sending it
        # (FastAPI TestClient might normalize, but let's see)

    finally:
        if secret_file.exists():
            os.remove(secret_file)

def test_static_file_serving_valid():
    """Test that valid static files are still served."""
    # Ensure STATIC_DIR exists
    if not STATIC_DIR.exists():
        STATIC_DIR.mkdir(parents=True, exist_ok=True)

    test_file = STATIC_DIR / "safe.txt"
    with open(test_file, "w") as f:
        f.write("SAFE_CONTENT")

    try:
        response = client.get("/safe.txt")
        assert response.status_code == 200
        assert "SAFE_CONTENT" in (response.text or response.content.decode())
    finally:
        if test_file.exists():
            os.remove(test_file)
