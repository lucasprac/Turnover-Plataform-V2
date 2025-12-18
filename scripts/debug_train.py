
import sys
import os

# Add root to sys.path
sys.path.append(os.getcwd())

try:
    from backend.ml import one_year_model
    from backend.ml import five_year_model
    
    print("Starting ONE YEAR model training test...")
    one_year_model.train_one_year_model(save_model=False)
    print("ONE YEAR model training SUCCESS.\n")
    
    print("Starting FIVE YEAR model training test...")
    five_year_model.train_five_year_model(save_model=False)
    print("FIVE YEAR model training SUCCESS.\n")
    
    print("ALL TRAINING TESTS PASSED.")

except Exception as e:
    print(f"TRAINING FAILED: {e}")
    sys.exit(1)
