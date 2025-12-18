import sys
import os
import pandas as pd

# Add root to path to import backend
sys.path.append(os.getcwd())

from backend.app.services.motivation_analysis import analyzer

def main():
    print("1. Generating Mock Data & Calculating Dimensions...")
    df = analyzer.load_and_preprocess_data()
    print(f"   Data Shape: {df.shape}")
    print(f"   Columns: {df.columns.tolist()}")
    
    print("\n2. Training Frank-Wolfe Multiclass Model (Optimizing G-Mean)...")
    results = analyzer.train_model(df)
    print(f"   Training Results: {results}")
    print(f"   Optimization History (Last 5 G-Means): {analyzer.model.history_[-5:]}")
    
    print("\n3. Testing Analysis (Onboarding vs Climate)...")
    # Mock inputs
    onb_input = {q: 4 for q in range(1, 20)} # All 4s
    climate_input = {q: 3 for q in range(1, 20)} # All 3s (Drop in motivation)
    # Customize for dimensions
    # Amotivation (1-3) increases -> bad
    climate_input[1] = 5
    climate_input[2] = 5
    climate_input[3] = 5
    
    analysis = analyzer.analyze_onboarding_vs_climate(onb_input, climate_input)
    print("   Analysis Results:")
    for k, v in analysis['deltas'].items():
        print(f"     {k}: {v}")
        
    print(f"\n   Predicted Risk based on Climate: {analysis['predicted_turnover_risk_climate']}")
    print("\nVerification Complete.")

if __name__ == "__main__":
    main()
