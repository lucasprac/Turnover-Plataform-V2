import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8001"

def verify_training():
    print(f"Testing Training Flow against {BASE_URL}...")
    
    # 1. Check Root
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"Root: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"Failed to reach root: {e}")
        return

    # 2. Trigger Training
    try:
        print("1. Triggering training job...")
        resp = requests.post(f"{BASE_URL}/train")
        if resp.status_code != 200:
            print(f"FAILED: Could not start training. Status: {resp.status_code}, Response: {resp.text}")
            return
        print(f"SUCCESS: Training started. Response: {resp.json()}")
    except Exception as e:
        print(f"CRITICAL: Failed to connect to API. Is the backend running? Error: {e}")
        return

    # 3. Poll Status
    print("\n2. Polling progress...")
    max_retries = 90
    for _ in range(max_retries):
        try:
            status_resp = requests.get(f"{BASE_URL}/train/status")
            state = status_resp.json()
            
            status = state.get("status")
            progress = state.get("progress")
            message = state.get("message")
            
            sys.stdout.write(f"\rStatus: {status} | Progress: {progress}% | Message: {message: <50}")
            sys.stdout.flush()
            
            if status == "success":
                print("\n\nSUCCESS: Training job completed successfully!")
                break
            elif status == "error":
                print(f"\n\nFAILED: Training job failed. Error: {message}")
                break
            
            time.sleep(1)
            
        except Exception as e:
            print(f"\nError polling status: {e}")
            break
    else:
        print("\nTimed out waiting for training.")

if __name__ == "__main__":
    verify_training()
