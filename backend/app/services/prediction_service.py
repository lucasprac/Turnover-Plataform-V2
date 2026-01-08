import pandas as pd
import numpy as np
import os
import sys
from backend.app.feature_config import FEATURE_GROUPS, ENGAGEMENT_PREFIXES

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
    Enriches with grouped SHAP values.
    """
    res = one_year_model.predict_individual_risk(data_dict)
    
    # SHAP Grouping
    shap_raw = res.get("shap_values", {})
    if shap_raw:
        grouped_shap = {group: 0.0 for group in FEATURE_GROUPS.keys()}
        for feat, val in shap_raw.items():
            val_abs = abs(val)
            
            # Match group
            found = False
            for group, members in FEATURE_GROUPS.items():
                if feat in members:
                    grouped_shap[group] += val_abs
                    found = True
                    break
            
            if not found:
                 if any(feat.startswith(p) for p in ENGAGEMENT_PREFIXES):
                    grouped_shap["Performance & Engagement"] += val_abs
                 elif feat.startswith('a'):
                    grouped_shap["Demographic"] += val_abs
                 else:
                    grouped_shap["Professional"] += val_abs
        
        res["grouped_shap"] = [{"group": k, "value": float(v)} for k, v in grouped_shap.items()]
        
    return res

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
    
    # --- PROPER SHAPASH PREDICTOR USAGE ---
    # Load predictor for global feature importance/SHAP
    predictor_path = os.path.join(backend_dir, "ml", "one_year_predictor.pkl")
    shap_values_top = []
    grouped_shap_list = []
    
    from shapash.utils.load_smartpredictor import load_smartpredictor
    from backend.ml import shapash_config
    from backend.ml.preprocessing import feature_engineering
    
    # Predict
    df_engineered = feature_engineering(df)
    X_processed = preprocessor.transform(df_engineered)
    if selector:
        X_final = selector.transform(X_processed)
    else:
        X_final = X_processed
    
    probs = model.predict_proba(X_final)[:, 1]
    y_pred = model.predict(X_final)
    high_risk_count = int(y_pred.sum())
    turnover_rate = float(y_pred.mean() * 100)
    
    try:
        if os.path.exists(predictor_path):
            predictor = load_smartpredictor(predictor_path)
            
            # PredictProba for global drivers (Summary of Top Factors)
            sample_size = min(100, len(df))
            indices = np.random.choice(len(df), sample_size, replace=False)
            df_sample = df.iloc[indices]
            
            X_sample = X_final[indices]
            X_sample_df = pd.DataFrame(X_sample, columns=feature_names)
            
            # Align columns if necessary
            if hasattr(predictor, 'features_types'):
                req = list(predictor.features_types.keys())
            elif hasattr(predictor, 'model_fnames'):
                req = list(predictor.model_fnames)
            else:
                req = feature_names

            # Ensure all required columns are present
            for c in req:
                if c not in X_sample_df.columns:
                    X_sample_df[c] = 0.0
            
            # Reorder to match predictor exactly
            X_sample_df = X_sample_df[req].copy()
                
            # Force types
            predictor.features_types = {k: 'float64' for k in predictor.features_types.keys()}
            for c in X_sample_df.columns:
                X_sample_df[c] = X_sample_df[c].astype(float)

            try:
                print(f"DEBUG: Dashboard X_sample_df columns order: {list(X_sample_df.columns)}")
                print(f"DEBUG: Dashboard Predictor mandatory order: {list(predictor.model_fnames) if hasattr(predictor, 'model_fnames') else 'No model_fnames'}")
                predictor.add_input(x=X_sample_df)
            except Exception as e_add:
                print(f"DEBUG: SmartPredictor.add_input failed. Error: {e_add}")
                raise e_add

            # detail_contributions returns (n_samples, n_features)
            contributions = predictor.detail_contributions()
            
            # Ensure all columns are numeric
            for col in contributions.columns:
                contributions[col] = pd.to_numeric(contributions[col], errors='coerce').fillna(0)
            
            # Average absolute contributions for "Global Risk Drivers"
            mean_abs_contributions = contributions.abs().mean().to_dict()
            
            shap_summary = []
            for name, val in mean_abs_contributions.items():
                shap_summary.append({"feature": name, "value": float(val), "base_value": 0.0})
            
            shap_summary.sort(key=lambda x: abs(x['value']), reverse=True)
            shap_values_top = shap_summary[:5]
            
            # Grouped SHAP (Using business groups from config)
            grouped_shap = {group: 0.0 for group in shapash_config.FEATURES_GROUPS.keys()}
            
            for feat_business, val in mean_abs_contributions.items():
                found = False
                for g_name, g_cols in shapash_config.FEATURES_GROUPS.items():
                     # Since contributions uses BUSINESS names, we check against FEATURES_DICT
                     technical_name = next((k for k, v in shapash_config.FEATURES_DICT.items() if v == feat_business), feat_business)
                     if technical_name in g_cols:
                         grouped_shap[g_name] += val
                         found = True
                         break
                
                if not found:
                    # Fallback to general categories
                    if "Demographic" in grouped_shap: grouped_shap["Demographic"] += val
                    else: grouped_shap["Job Details"] = grouped_shap.get("Job Details", 0) + val
            
            grouped_shap_list = [{"group": k, "value": float(v)} for k, v in grouped_shap.items()]
        else:
            print(f"WARNING: Dashboard predictor not found at {predictor_path}")
            
    except Exception as e:
        print(f"Shapash Dashboard Error: {e}")
        import traceback
        traceback.print_exc()

    
    # Top Predictions

    results_df = df.copy()
    results_df['risk'] = probs
    if 'name' not in results_df.columns:
         results_df['name'] = [f"Employee {val}" for val in results_df['id']]
    
    top_risk_df = results_df.sort_values(by='risk', ascending=False).head(5)
    predictions_list = top_risk_df[['id', 'risk', 'name']].to_dict(orient='records')
    
    # Feature Importance
    importances = []
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'base_estimator') and hasattr(model.base_estimator, 'feature_importances_'):
        importances = model.base_estimator.feature_importances_
    
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
        "grouped_shap": grouped_shap_list,
        "predictions": predictions_list,
        "feature_importance": feat_imp_top
    }
