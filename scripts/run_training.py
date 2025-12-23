import sys
import os

# Add root to sys.path
sys.path.append(os.getcwd())

from backend.ml.one_year_model import train_one_year_model
from backend.ml.five_year_model import train_five_year_model

def run_training():
    print("=== Training One-Year Model (Unique Finalization) ===")
    train_one_year_model(save_model=True) 
    
    print("\n\n=== Training Five-Year Model (Unique Finalization) ===")
    train_five_year_model(save_model=True)

if __name__ == "__main__":
    run_training()
