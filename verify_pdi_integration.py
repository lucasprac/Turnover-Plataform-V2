
import requests
import json

def verify_integration():
    print("--- Verifying PDI Rate & Grouped SHAP Integration ---")
    
    # 1. Check Performance Evaluation
    print("\n1. Testing /performance/evaluate...")
    res = requests.get("http://localhost:8000/performance/evaluate")
    if res.status_code == 200:
        data = res.json()
        print(f"Success. First employee CCR: {data[0]['ccr_efficiency']}")
        # Check if b1_PDI_rate was likely used (by its presence in input data if we could check, 
        # but here we just check if it crashed).
    else:
        print(f"Failed. Status: {res.status_code}")

    # 2. Check Dashboard Metrics (Grouped SHAP)
    print("\n2. Testing /dashboard-data (Global Grouped SHAP)...")
    res = requests.get("http://localhost:8000/dashboard-data")
    if res.status_code == 200:
        data = res.json()
        if "grouped_shap" in data:
            print("Success. Found 'grouped_shap' in dashboard metrics:")
            print(json.dumps(data["grouped_shap"], indent=2))
        else:
            print("Failed. 'grouped_shap' NOT found in dashboard metrics.")
    else:
        print(f"Failed. Status: {res.status_code}")

    # 3. Check Individual Prediction (Individual Grouped SHAP)
    print("\n3. Testing /predict/individual (Random Employee)...")
    # Get a random employee ID
    emp_res = requests.get("http://localhost:8000/employees/?limit=1")
    if emp_res.status_code == 200:
        emp_data = emp_res.json()[0]
        emp_id = emp_data['id']
        print(f"Predicting for employee: {emp_id}")
        
        # The endpoint expects {"employee_id": "..."}
        pred_res = requests.post("http://localhost:8000/predict/individual", json={"employee_id": emp_id})
        if pred_res.status_code == 200:
            pred_data = pred_res.json()
            if "grouped_shap" in pred_data:
                print("Success. Found 'grouped_shap' in individual prediction.")
                print(json.dumps(pred_data["grouped_shap"], indent=2))
            else:
                print("Failed. 'grouped_shap' NOT found in individual prediction.")
        else:
            print(f"Failed. Individual prediction status: {pred_res.status_code}")
            print(f"Response: {pred_res.text}")

if __name__ == "__main__":
    verify_integration()
