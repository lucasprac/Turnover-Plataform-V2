import data_generator
import one_year_model
import five_year_model
import pandas as pd
import sys

def main():
    print("RETAIL TURNOVER PREDICTION SYSTEM")
    
    # Step 1: Data Generation
    print("\n[Step 1] Generating Synthetic Data...")
    try:
        df = data_generator.generate_synthetic_data(n_employees=1500)
        df.to_csv("synthetic_turnover_data.csv", index=False)
        print(f" -> Data generated: {len(df)} records. Saved to 'synthetic_turnover_data.csv'.")
    except Exception as e:
        print(f"Error in data generation: {e}")
        sys.exit(1)

    # Step 2: One-Year Model (Individual)
    print("\n[Step 2] Training One-Year Prediction Model (Individual)...")
    try:
        one_year_model.train_one_year_model()
    except Exception as e:
        print(f"Error in 1-year model training: {e}")
    
    # Step 3: Five-Year Model (Aggregated)
    print("\n[Step 3] Training Five-Year Prediction Model (Aggregated)...")
    try:
        five_year_model.train_five_year_model()
    except Exception as e:
        print(f"Error in 5-year model training: {e}")
    
    print("\n PROCESS COMPLETED SUCCESSFULLY")

if __name__ == "__main__":
    main()
