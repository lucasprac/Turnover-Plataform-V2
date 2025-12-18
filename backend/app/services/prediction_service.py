import pandas as pd
import numpy as np
import os
import sys

# Append project root to sys.path to allow imports of backend modules
# Assuming this file is in backend/app/services/
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir: .../backend/app/services
# app_dir: .../backend/app
app_dir = os.path.dirname(current_dir)
# backend_dir: .../backend
backend_dir = os.path.dirname(app_dir)
# root_dir: .../Turnover program (parent of backend)
root_dir = os.path.dirname(backend_dir)

if root_dir not in sys.path:
    sys.path.append(root_dir)

# Import models from backend.ml
try:
    from backend.ml import one_year_model
    from backend.ml import five_year_model
except ImportError:
    # Fallback if run directly or path issues
    sys.path.append(os.path.join(backend_dir, 'ml'))
    import one_year_model
    import five_year_model

# Global cache
cached_df = None

def load_data():
    """
    Loads data and ensures IDs exist.
    """
    global cached_df
    # Path to data: root/synthetic_turnover_data.csv
    # backend_dir is root/backend. root is dirname(backend_dir)
    root_dir = os.path.dirname(backend_dir)
    
    # Try cwd
    data_path = os.path.join(os.getcwd(), "synthetic_turnover_data.csv")
    
    if not os.path.exists(data_path):
        # Try relative to root_dir
        data_path = os.path.join(root_dir, "synthetic_turnover_data.csv")
        
    if not os.path.exists(data_path):
         return None
    
    df = pd.read_csv(data_path)
    
    # Ensure ID column
    if 'id' not in df.columns:
        # Create stable IDs based on index
        df['id'] = [f"EMP{i:05d}" for i in range(len(df))]
        
    return df

def enrich_features(data: dict) -> dict:
    """
    Calculates derived features like M_Onboarding_Final_Score.
    """
    # 1. Calculate Onboarding Score
    # Formula: (5 * 3d + 25 * Avg(15d) + 70 * Avg(30d)) / 100
    
    onb_3d = data.get('M_Onb_3d_Integration', 0)
    
    # 15d columns
    cols_15d = [
        'M_Onb_15d_Credibility', 'M_Onb_15d_Respect', 'M_Onb_15d_Impartiality', 
        'M_Onb_15d_Pride', 'M_Onb_15d_Camaraderie'
    ]
    vals_15d = [data.get(c, 0) for c in cols_15d]
    avg_15d = sum(vals_15d) / len(vals_15d) if vals_15d else 0
    
    # 30d columns
    cols_30d = [
        'M_Onb_30d_Credibility', 'M_Onb_30d_Respect', 'M_Onb_30d_Impartiality', 
        'M_Onb_30d_Pride', 'M_Onb_30d_Camaraderie'
    ]
    vals_30d = [data.get(c, 0) for c in cols_30d]
    avg_30d = sum(vals_30d) / len(vals_30d) if vals_30d else 0
    
    data['M_Onboarding_Final_Score'] = (5 * onb_3d + 25 * avg_15d + 70 * avg_30d) / 100
    
    return data

def predict_individual(data_dict: dict):
    """
    Wrapper for one_year_model individual prediction
    """
    return one_year_model.predict_individual_risk(data_dict)

def predict_aggregate(agg_data: dict):
    """
    Wrapper for five_year_model aggregate prediction
    Returns: {"prediction": float, "shap_values": dict}
    """
    return five_year_model.predict_aggregate_turnover(agg_data)

def get_dashboard_metrics(df):
    """
    Calculates dashboard metrics using one_year_model
    """
    # Try to load model
    artifact = one_year_model.load_one_year_model()
    
    if not artifact:
        return None

    model = artifact['model']
    preprocessor = artifact['preprocessor']
    selector = artifact.get('selector')
    feature_names = artifact['feature_names']
    
    # Predict
    X_processed = preprocessor.transform(df)
    if selector:
        X_final = selector.transform(X_processed)
    else:
        X_final = X_processed
    
    probs = model.predict_proba(X_final)[:, 1]
    
    # Risk Metrics
    # Risk Metrics
    # Use model.predict() to leverage Frank-Wolfe optimized threshold/weights
    y_pred = model.predict(X_final)
    high_risk_count = int(y_pred.sum())
    turnover_rate = float(y_pred.mean() * 100)
    
    # SHAP (Sample of top 100)
    sample_size = min(100, len(X_final))
    indices = np.random.choice(X_final.shape[0], sample_size, replace=False)
    X_sample = X_final[indices]
    
    import shap
    shap_values_top = []
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)
        
        # shap_values is (n_samples, n_features)
        # We want mean absolute value per feature
        
        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        shap_summary = []
        
        # Ensure feature names match shap values columns
        # shap_values columns match X_sample columns
        
        if len(feature_names) == shap_values.shape[1]:
            for name, val in zip(feature_names, mean_abs_shap):
                shap_summary.append({"feature": name, "value": float(val), "base_value": 0.0})
        else:
            # Fallback if mismatch
            for i, val in enumerate(mean_abs_shap):
                shap_summary.append({"feature": f"Feature {i}", "value": float(val), "base_value": 0.0})

        shap_summary.sort(key=lambda x: abs(x['value']), reverse=True)
        shap_values_top = shap_summary[:5]
    except Exception as e:
        print(f"SHAP Dashboard Error: {e}")
        shap_values_top = []

    
    # Top Predictions

    results_df = df.copy()
    results_df['risk'] = probs
    if 'name' not in results_df.columns:
         results_df['name'] = [f"Employee {val}" for val in results_df['id']]
    
    top_risk_df = results_df.sort_values(by='risk', ascending=False).head(5)
    predictions_list = top_risk_df[['id', 'risk', 'name']].to_dict(orient='records')
    
    # Feature Importance
    importances = model.feature_importances_
    feat_imp_list = []
    if len(importances) == len(feature_names):
         for name, imp in zip(feature_names, importances):
             feat_imp_list.append({"feature": name, "importance": float(imp)})
    feat_imp_list.sort(key=lambda x: x['importance'], reverse=True)
    feat_imp_top = feat_imp_list[:5]
    
    return {
        "turnover_rate": round(turnover_rate, 1),
        "turnover_risk_high": high_risk_count,
        "shap_values": shap_values_top,
        "predictions": predictions_list,
        "feature_importance": feat_imp_top
    }
