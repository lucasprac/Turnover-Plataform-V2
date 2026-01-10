# 🛡️ Auditor: [CRITICAL] Path Traversal in Static File Serving

## 🚨 Severity
CRITICAL

## 💡 Vulnerability
A Path Traversal vulnerability was identified in the `serve_spa` function within `backend/api.py`. The function accepted a `full_path` parameter and appended it to `STATIC_DIR` without verifying if the resolved path remained within the intended directory. This allowed an attacker to access arbitrary files on the server's filesystem by using sequences like `../` (or URL-encoded `%2e%2e/`).

**Vulnerable Code:**
```python
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # ...
    static_file = STATIC_DIR / full_path
    if STATIC_DIR.exists() and static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
```

## 🎯 Impact
An attacker could read sensitive files on the server, such as configuration files, source code, or system files (e.g., `/etc/passwd`, secrets, environment variables if stored in files). This could lead to full system compromise.

## 🔧 Recommended Fix
The fix involves resolving the path and explicitly checking if it is relative to the `STATIC_DIR` using `pathlib.Path.is_relative_to()`.

**Fixed Code:**
```python
    static_file = (STATIC_DIR / full_path).resolve()

    # Security check: Ensure the file is within the static directory
    if STATIC_DIR.exists() and static_file.is_relative_to(STATIC_DIR.resolve()) and static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
```

## ✅ Verification
A new test file `backend/tests/test_security.py` was created to verify the fix.
1. **Reproduction:** The test attempts to access a "secret" file located outside the static directory using `../`.
2. **Assertion:** The test fails if the file content is returned (vulnerability exists) and passes if access is denied/not found.

Run the verification with:
```bash
python -m pytest backend/tests/test_security.py
```
