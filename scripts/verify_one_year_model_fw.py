import sys
import os

# Add root to sys.path
sys.path.append(os.getcwd())

from backend.ml.one_year_model import train_one_year_model, predict_individual_risk, load_one_year_model
from backend.app.services.prediction_service import enrich_features

def main():
    print("Testing Frank-Wolfe Integration in One Year Model...")
    
    # 1. Train (should use Frank-Wolfe wrapper)
    # This might take a bit due to Grid Search, but data is small/synthetic usually.
    model = train_one_year_model(save_model=True)
    
    print(f"Model trained. Type: {type(model)}")
    print(f"Has 'cost_weights_'? {hasattr(model, 'cost_weights_')}")
    
    if hasattr(model, 'cost_weights_'):
        print(f"Optimal Cost Weights: {model.cost_weights_}")
    
    # 2. Predict (Check SHAP support)
    print("\nTesting Prediction & SHAP...")
    import pandas as pd
    df = pd.read_csv("synthetic_turnover_data.csv")
    sample = df.iloc[0].to_dict()
    
    # Enrich features (Calculate M_Onboarding_Final_Score etc)
    sample = enrich_features(sample)
    
    try:
        result = predict_individual_risk(sample)
        print("Prediction Result:")
        print(f"  Probability: {result['turnover_probability']:.4f}")
        print(f"  SHAP Values Count: {len(result['shap_values'])}")
        print("  Top 3 Features:")
        sorted_shap = sorted(result['shap_values'].items(), key=lambda x: abs(x[1]), reverse=True)
        for k, v in sorted_shap[:3]:
            print(f"    {k}: {v:.4f}")
            
    except Exception as e:
        print(f"Prediction Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
