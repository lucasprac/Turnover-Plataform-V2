
import sys
import os

# Ensure root is in path
current_file_path = os.path.abspath(__file__)
scripts_dir = os.path.dirname(current_file_path)
root_dir = os.path.dirname(scripts_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

print(f"Root dir added to path: {root_dir}")
print("--- Verify Imports Only ---")

try:
    print("Importing backend.api...")
    import backend.api
    print("Importing prediction_service...")
    import backend.app.services.prediction_service as ps
    print("SUCCESS: All imports worked.")
except Exception as e:
    print(f"CRITICAL FAILURE: {e}")
    sys.exit(1)
