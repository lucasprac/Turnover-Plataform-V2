import requests
import json
import time

base_url = "http://127.0.0.1:8000"

def test_root():
    try:
        print(f"Testing root: {base_url}/")
        resp = requests.get(f"{base_url}/", timeout=5)
        print(f"Root Status: {resp.status_code}")
        print(f"Root Resp: {resp.json()}")
    except Exception as e:
        print(f"Root Failed: {e}")

def test_train():
    try:
        print(f"Testing train: {base_url}/train")
        resp = requests.post(f"{base_url}/train", timeout=5)
        print(f"Train Status: {resp.status_code}")
        print(f"Train Resp: {resp.json()}")
    except Exception as e:
        print(f"Train Failed: {e}")

def test_predict():
    try:
        print(f"Testing predict: {base_url}/predict/aggregate")
        payload = {
            "education_level": None,
            "gender": None,
            "age_group": None,
            "tenure_group": None
        }
        resp = requests.post(f"{base_url}/predict/aggregate", json=payload, timeout=5)
        print(f"Predict Status: {resp.status_code}")
        if resp.status_code == 200:
             print(f"Predict Resp: {resp.json()}")
        else:
             print(f"Predict Error: {resp.text}")
    except Exception as e:
         print(f"Predict Failed: {e}")

if __name__ == "__main__":
    test_root()
    test_train()
    # Wait a bit for training thread (optional, but training is async)
    test_predict()
