
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import KFold, RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from .preprocessing import aggregate_data_for_5year
# import shap (Moved to local scope)

# Models are in backend/ml


import sys

# Ensure root is in path if not already
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
if root_dir not in sys.path:
    sys.path.append(root_dir)

DATA_PATH = os.path.join(root_dir, "synthetic_turnover_data.csv")
MODEL_PATH = os.path.join(current_dir, "five_year_model.xgb")


def train_five_year_model(data_path="synthetic_turnover_data.csv", save_model=True, progress_callback=None):
    def update(p, msg):
        if progress_callback:
            progress_callback(p, msg)
            
    print("\n--- Training Five-Year Model (Aggregated Level) ---")
    update(0, "Starting Aggregated Model...")

    # 1. Load and Aggregate
    df = pd.read_csv(data_path)
    agg_df = aggregate_data_for_5year(df)
    
    # Target: TurnoverCount
    y = agg_df['TurnoverCount']
    X = agg_df.drop(['TurnoverCount', 'TotalEmployees'], axis=1) # TotalEmployees is leakage? Or feature? 
    # Usually we want to predict count based on cohort size and features.
    # If we include TotalEmployees, it will just learn rate * Total.
    # Let's include TotalEmployees as a feature because scale matters.
    X['TotalEmployees'] = agg_df['TotalEmployees']
    
    print(f"Aggregated Data Shape: {X.shape}")
    update(10, "Data aggregated")

    # 2. Preprocessing (Civilizing Kit: Pipeline)
    # Identify cat/num
    cat_cols = ['a6_education_level', 'a1_gender', 'B2_Public_service_status_ger', 'AgeGroup', 'TenureGroup']
    num_cols = [c for c in X.columns if c not in cat_cols]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    # 3. Model Pipeline
    xgb_reg = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_jobs=1,
        random_state=42
    )
    
    # Feature Selection + Model
    # Note: SelectFromModel inside Pipeline is tricky if we want to save purely the selection.
    # We will do it step by step for clarity and artifact saving.
    
    # Process X
    X_processed = preprocessor.fit_transform(X, y)
    feature_names_out = []
    if hasattr(preprocessor, 'get_feature_names_out'):
         feature_names_out = preprocessor.get_feature_names_out()
    else:
         feature_names_out = [f"feat_{i}" for i in range(X_processed.shape[1])]
    
    print(f"Initial Feature Count: {X_processed.shape[1]}")
    update(20, "Selecting features...")

    # Feature Selection (Lasso-like)
    print("Performing Feature Selection...")
    selection_model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=100,
        reg_alpha=0.1,
        random_state=42,
        n_jobs=1
    )
    selection_model.fit(X_processed, y)
    
    selector = SelectFromModel(selection_model, threshold='median', prefit=True)
    X_selected = selector.transform(X_processed)
    
    print(f"Selected Feature Count: {X_selected.shape[1]}")
    update(40, "Features selected")

    # 4. Hyperparameter Tuning (CV)
    print("Starting Hyperparameter Optimization...")
    update(50, "Optimizing hyperparameters...")
    params = {
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 4, 5],
        'n_estimators': [100, 200, 300],
        'subsample': [0.7, 0.9],
        'colsample_bytree': [0.7, 0.9],
        'reg_alpha': [0, 0.1, 1],
        'reg_lambda': [1, 2]
    }
    
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    
    search = RandomizedSearchCV(
        estimator=xgb_reg,
        param_distributions=params,
        n_iter=20,
        scoring='neg_mean_absolute_error',
        cv=cv,
        verbose=1,
        random_state=42,
        n_jobs=1
    )
    
    search.fit(X_selected, y)
    
    print(f"Best MAE: {-search.best_score_:.4f}")
    
    final_model = search.best_estimator_
    update(80, "Model optimized")
    
    # 5. Evaluation (On full set for now as data is small)
    y_pred = final_model.predict(X_selected)
    mae = mean_absolute_error(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    r2 = r2_score(y, y_pred)
    
    print(f"Final Training MAE: {mae:.2f}")
    print(f"Final Training RMSE: {rmse:.2f}")
    print(f"Final Training R2: {r2:.4f}")
    update(90, "Model evaluated")

    if save_model:
        artifact = {
            'model': final_model,
            'preprocessor': preprocessor,
            'selector': selector,
            'feature_names': feature_names_out # Raw names
        }
        joblib.dump(artifact, MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")
    
    update(100, "Five Year Model Complete")
    return final_model

def predict_aggregate_turnover(agg_data: dict):
    """
    Predicts turnover count for a cohort.
    Input: dict representing averaged/mode features of the cohort.
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Five year model not found. Please train first.")
        
    artifact = joblib.load(MODEL_PATH)
    model = artifact['model']
    preprocessor = artifact['preprocessor']
    selector = artifact['selector']
    
    # Convert dict to DataFrame (single row)
    # Ensure all expected columns are present
    # The preprocessor expects specific columns.
    
    df = pd.DataFrame([agg_data])
    
    # We need to ensure df has all columns used during fit.
    # The preprocessor handles transforms.
    # But if input is missing columns, it might fail.
    # We should fill missing with defaults or 0.
    
    try:
        X_processed = preprocessor.transform(df)
        X_final = selector.transform(X_processed)
        prediction = model.predict(X_final)[0]
        
        # Calculate SHAP values
        shap_dict = {}
        try:
            import shap
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_final)
            
            # Map to feature names if available
            # X_final corresponds to selector output.
            # We need feature names for X_final.
            
            # Get feature names from preprocessor -> selector
            feature_names_in = []
            if hasattr(preprocessor, 'get_feature_names_out'):
                 feature_names_in = preprocessor.get_feature_names_out()
            else:
                 feature_names_in = [f"feat_{i}" for i in range(X_processed.shape[1])]
                 
            # Selector mask
            mask = selector.get_support()
            final_feature_names = [name for name, selected in zip(feature_names_in, mask) if selected]
            
            # SHAP values for the single row
            # shap_values is (1, n_features) or list of arrays (if multi-output, but this is regression)
            # For regression XGBoost, it is usually (n_samples, n_features)
            
            row_shap = shap_values[0]
            
            if len(row_shap) == len(final_feature_names):
                for name, val in zip(final_feature_names, row_shap):
                    shap_dict[name] = float(val)
            else:
                 # Fallback if names don't match
                 for i, val in enumerate(row_shap):
                     shap_dict[f"feature_{i}"] = float(val)
                     
        except Exception as e:
            print(f"SHAP Aggregate Error: {e}")
            shap_dict = {}

        return {
            "prediction": max(0, float(prediction)),
            "shap_values": shap_dict
        }
        
    except Exception as e:
        print(f"Aggregate predict error: {e}")
        # Fallback logic if needed?
        return {
            "prediction": 0.0,
            "shap_values": {}
        }

