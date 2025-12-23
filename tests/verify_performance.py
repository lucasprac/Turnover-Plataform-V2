import sys
import os
import pandas as pd
import numpy as np

# Setup path
sys.path.append(os.getcwd())

from backend.app.services.performance_service import evaluator

def verify_performance_logic():
    print("Loading data...")
    evaluator.load_dataset()
    print(f"Data columns: {evaluator.df.columns.tolist()}")
    
    if 'B17_PDI_rate' not in evaluator.df.columns:
        print("ERROR: B17_PDI_rate not found in dataset!")
        return

    print("Running evaluation...")
    results = evaluator.evaluate_performance()
    
    if not results:
        print("ERROR: No results returned.")
        return
        
    print(f"Returned {len(results)} records.")
    sample = results[0]
    print(f"Sample Record: {sample}")
    
    # Check keys
    required_keys = ['employee_id', 'ccr_efficiency', 'cross_efficiency', 'prospect_organizational', 'prospect_personal', 'composite_score']
    for k in required_keys:
        if k not in sample:
            print(f"ERROR: Missing key {k}")
            return
            
    print("Validation Successful!")

if __name__ == "__main__":
    verify_performance_logic()
