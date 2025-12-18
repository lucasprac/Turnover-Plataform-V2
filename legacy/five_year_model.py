import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split, KFold, RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from sklearn.preprocessing import OneHotEncoder
from preprocessing import aggregate_data_for_5year
import numpy as np
import shap
import matplotlib.pyplot as plt

import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".data", "five_year_model.xgb")

def train_five_year_model(data_path=".data/synthetic_turnover_data.csv", save_model=True):
    print("\n--- Training Five-Year Model (Aggregated Level) ---")
    
    # Load and Aggregate
    df = pd.read_csv(data_path)
    agg_df = aggregate_data_for_5year(df)
    
    # Preprocess Aggregated Data
    cat_cols = ['a6_education_level', 'a1_gender', 'B2_Public_service_status_ger', 'AgeGroup', 'TenureGroup']
    num_cols = [
        'TotalEmployees', 
        'B11_salary_today_brl', 
        'c1_overall_employee_satisfaction', 
        'B5_Degree_of_employment',
        'M_Onboarding_Final_Score',
        'M_eNPS'
    ]
    
    X = agg_df.drop(['TurnoverCount'], axis=1)
    y = agg_df['TurnoverCount']
    
    # Simple Pipeline for Aggregated Data
    for c in cat_cols:
        X[c] = X[c].astype(str)
        
    encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_cat = encoder.fit_transform(X[cat_cols])
    X_num = X[num_cols].values
    
    X_preprocessed = np.hstack([X_num, X_cat])
    feature_names_raw = num_cols + list(encoder.get_feature_names_out(cat_cols))
    
    # Split for Final Evaluation
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(X_preprocessed, y, test_size=0.2, random_state=42)
    
    print(f"Initial Feature Count: {X_train_raw.shape[1]}")

    # --- 1. Feature Selection ---
    print("\nPerforming Feature Selection...")
    selection_model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )
    selection_model.fit(X_train_raw, y_train)
    
    # Select features > median
    selector = SelectFromModel(selection_model, threshold='median', prefit=True)
    X_train_selected = selector.transform(X_train_raw)
    X_test_selected = selector.transform(X_test_raw)
    
    selected_indices = selector.get_support(indices=True)
    feature_names_selected = [feature_names_raw[i] for i in selected_indices]
    
    print(f"Selected Feature Count: {X_train_selected.shape[1]}")
    print(f"Dropped {len(feature_names_raw) - len(feature_names_selected)} features.")

    # --- 2. Hyperparameter Optimization ---
    print("\nStarting Hyperparameter Optimization (RandomizedSearch)...")
    
    params = {
        'learning_rate': [0.01, 0.05, 0.1, 0.2],
        'max_depth': [3, 5, 7],
        'n_estimators': [100, 200, 300],
        'subsample': [0.7, 0.8, 0.9],
        'colsample_bytree': [0.7, 0.8, 0.9],
        'reg_alpha': [0, 0.1, 1], # L1
        'reg_lambda': [1, 2]      # L2
    }
    
    xgb_reg = xgb.XGBRegressor(
        objective='reg:squarederror',
        random_state=42,
        n_jobs=-1
    )
    
    cv_strategy = KFold(n_splits=5, shuffle=True, random_state=42)
    
    search = RandomizedSearchCV(
        estimator=xgb_reg,
        param_distributions=params,
        n_iter=20,
        scoring='neg_mean_absolute_error',
        cv=cv_strategy,
        verbose=1,
        random_state=42,
        n_jobs=-1
    )
    # Train on selected features
    search.fit(X_train_selected, y_train)
    
    print(f"Best CV MAE: {-search.best_score_:.4f}")
    print(f"Best Params: {search.best_params_}")
    
    model = search.best_estimator_
    
    if save_model:
        joblib.dump({
            'model': model, 
            'encoder': encoder, 
            'selector': selector,
            'cat_cols': cat_cols, 
            'num_cols': num_cols, 
            'feature_names': feature_names_selected
        }, MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")

    # Predict
    y_pred = model.predict(X_test_selected)
    y_pred = np.maximum(y_pred, 0)
    
    # Evaluate
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print("\nModel Evaluation (Test Set):")
    print(f"MAE: {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2 Score: {r2:.4f}")
    
    print("\nSample Predictions vs Actual:")
    results = pd.DataFrame({'Actual': y_test, 'Predicted': y_pred.round(1)})
    print(results.head(10))
    
    # Feature Importance (Selected)
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("\nTop 10 Feature Importances (Selected):")
    for i in range(min(10, len(feature_names_selected))):
        idx = indices[i]
        print(f"{i+1}. {feature_names_selected[idx]}: {importances[idx]:.4f}")

    # --- SHAP Analysis ---
    print("\nExtracting SHAP values for transparency (5-Year Model)...")
    try:
        booster = model.get_booster()
        # DMatrix with selected features
        dtest = xgb.DMatrix(X_test_selected, feature_names=feature_names_selected)
        shap_values_raw = booster.predict(dtest, pred_contribs=True)
        
        shap_values = shap_values_raw[:, :-1]
        
        plt.figure()
        shap.summary_plot(shap_values, X_test_selected, feature_names=feature_names_selected, show=False)
        plt.tight_layout()
        plt.savefig('shap_summary_five_year.png')
        print("SHAP Summary Plot saved to 'shap_summary_five_year.png'")
    except Exception as e:
        print(f"SHAP Analysis completely failed. Error: {e}")
        import traceback
        traceback.print_exc()
        
    return model

def load_five_year_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)

def predict_aggregate_turnover(input_data):
    """
    Predicts turnover count for a group.
    input_data: dict of features
    """
    artifact = load_five_year_model()
    if not artifact:
        raise FileNotFoundError("Five year model not found. Please train first.")
        
    model = artifact['model']
    encoder = artifact['encoder']
    cat_cols = artifact['cat_cols']
    num_cols = artifact['num_cols']
    selector = artifact.get('selector')
    
    df_input = pd.DataFrame([input_data])
    
    # Ensure correct types for categorical columns
    for col in cat_cols:
        df_input[col] = df_input[col].astype(str)
        
    # Transform
    # 1. Numerical
    X_num = df_input[num_cols].values
    
    # 2. Categorical
    X_cat = encoder.transform(df_input[cat_cols])
    
    X_processed = np.hstack([X_num, X_cat])
    
    if selector:
        X_final = selector.transform(X_processed)
    else:
        X_final = X_processed
    
    # Predict
    pred = model.predict(X_final)[0]
    pred = max(0, pred) # clip
    
    return float(pred)

if __name__ == "__main__":
    train_five_year_model()
