import pandas as pd
import numpy as np
import shap
import xgboost as xgb
import matplotlib.pyplot as plt
import joblib
import os
from sklearn.model_selection import StratifiedKFold, RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

# Lazy load preprocessing to avoid circular dependency issues if any
from .preprocessing import load_and_preprocess_one_year
try:
    from ..app.services.frank_wolfe_multiclass import FrankWolfeMulticlass
except ImportError:
    # Use relative import if running as module from root
    from backend.app.services.frank_wolfe_multiclass import FrankWolfeMulticlass

MODEL_PATH = "one_year_model.xgb"
# Force Reload Fix

def train_one_year_model(data_path="synthetic_turnover_data.csv", save_model=True, progress_callback=None):
    def update(p, msg):
        if progress_callback:
            progress_callback(p, msg)
            
    print("--- Training One-Year Model (Individual Level) ---")
    update(0, "Starting Individual Model...")
    
    # 1. Load and Preprocess
    df = pd.read_csv(data_path)
    X_train_raw, X_test_raw, y_train, y_test, feature_names_raw, preprocessor = load_and_preprocess_one_year(df)
    
    print(f"Initial Feature Count: {X_train_raw.shape[1]}")
    update(10, "Data loaded and preprocessed")

    # 2. Feature Selection (Civilizing Kit: Reduce Noise)
    # Using XGBoost with L1 regularization (Lasso-like) to select features
    print("\nPerforming Feature Selection (SelectFromModel)...")
    update(20, "Selecting features...")
    selection_model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        eval_metric='logloss',
        reg_alpha=0.1, # L1 for sparsity
        n_jobs=1,
        base_score=0.5,
        random_state=42
    )
    
    selection_model.fit(X_train_raw, y_train)
    
    # Select features > median importance
    selector = SelectFromModel(selection_model, threshold='median', prefit=True)
    
    X_train_selected = selector.transform(X_train_raw)
    X_test_selected = selector.transform(X_test_raw)
    
    selected_indices = selector.get_support(indices=True)
    feature_names_selected = [feature_names_raw[i] for i in selected_indices]
    
    print(f"Selected Feature Count: {X_train_selected.shape[1]}")
    print(f"Dropped {len(feature_names_raw) - len(feature_names_selected)} features.")
    update(40, "Features selected")

    # 3. Hyperparameter Optimization (Civilizing Kit: GridSearch + CV)
    print("\nStarting Hyperparameter Optimization (RandomizedSearch)...")
    update(50, "Optimizing hyperparameters...")
    
    # Grid including Regularization (L1/L2)
    params = {
        'learning_rate': [0.01, 0.05, 0.1, 0.2],
        'max_depth': [3, 4, 5, 6],
        'n_estimators': [100, 200, 300, 500],
        'subsample': [0.6, 0.8, 1.0],
        'colsample_bytree': [0.6, 0.8, 1.0],
        'gamma': [0, 0.1, 0.2, 0.5], # Min split loss
        'reg_alpha': [0, 0.1, 0.5, 1], # L1
        'reg_lambda': [1, 1.5, 2] # L2
    }
    
    xgb_clf = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        n_jobs=1,
        base_score=0.5,
        random_state=42
    )
    
    # 5-Fold Stratified CV
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    search = RandomizedSearchCV(
        estimator=xgb_clf,
        param_distributions=params,
        n_iter=20, # Scientific search
        scoring='roc_auc',
        cv=cv_strategy,
        verbose=1,
        random_state=42,
        n_jobs=1
    )
    
    search.fit(X_train_selected, y_train)
    
    print(f"Best CV ROC-AUC: {search.best_score_:.4f}")
    print(f"Best Params: {search.best_params_}")
    update(80, "Model optimized")
    
    model_base = search.best_estimator_
    
    print("\nApplying Frank-Wolfe Consistent Algorithm for Imbalanced Multiclass/Binary...")
    # Wrap for optimal G-Mean (Turnover vs Stay)
    model = FrankWolfeMulticlass(base_estimator=model_base, max_iter=50)
    model.fit(X_train_selected, y_train)
    
    # 4. Evaluation (Civilizing Kit: Metrics)
    y_pred = model.predict(X_test_selected)
    y_prob = model.predict_proba(X_test_selected)[:, 1]
    
    print("\nModel Evaluation (Test Set):")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    update(90, "Model evaluated")
    
    # 5. Interpretability (Civilizing Kit: SHAP)
    # Using TreeExplainer
    # Using TreeExplainer with raw booster to avoid sklearn wrapper issues
    try:
        explainer = shap.TreeExplainer(model.get_booster())
    except Exception as e:
        print(f"SHAP Explainer Error: {e}. Skipping Interpretability check during training.")
        explainer = None
    
    if save_model:
        # Save comprehensive artifact
        artifact = {
            'model': model,
            'preprocessor': preprocessor,
            'selector': selector,
            'feature_names': feature_names_selected
        }
        joblib.dump(artifact, MODEL_PATH)
        print(f"Model and artifacts saved to {MODEL_PATH}")
    
    update(100, "One Year Model Complete")
    return model

def load_one_year_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def predict_individual_risk(input_data: dict):
    """
    Predicts turnover probability for a single individual.
    Returns: {turnover_probability: float, shap_values: dict}
    """
    artifact = load_one_year_model()
    if not artifact:
        raise FileNotFoundError("One year model not found. Please train first.")
        
    model = artifact['model']
    preprocessor = artifact['preprocessor']
    selector = artifact['selector']
    feature_names = artifact['feature_names']
    
    # DataFrame for input
    df_input = pd.DataFrame([input_data])
    
    try:
        # 1. Preprocess (Scale/Encode)
        X_processed = preprocessor.transform(df_input)
        
        # 2. Select Features
        X_final = selector.transform(X_processed)
        
    except Exception as e:
        raise ValueError(f"Preprocessing/Selection failed: {e}")
    
    # 3. Predict Probability
    prob = float(model.predict_proba(X_final)[:, 1][0])
    
    # 4. SHAP Explanation
    try:
        # Re-instantiate explainer for thread safety usually better
        if hasattr(model, 'base_estimator'):
             # FrankWolfe wrapped model
             booster = model.base_estimator.get_booster()
        else:
             booster = model.get_booster()
             
        explainer = shap.TreeExplainer(booster) 
        shap_values = explainer.shap_values(X_final)
    except Exception as e:
        print(f"SHAP Error: {e}")
        # Return empty shap values on failure to not break app
        return {
             "turnover_probability": prob,
             "shap_values": {}
        }
    
    # Handle SHAP output shape (binary classification usually returns matrix or list)
    if isinstance(shap_values, list):
        sv = shap_values[1][0] # Positive class
    else:
        sv = shap_values[0]
        
    # Map to feature names
    shap_dict = {}
    for i, name in enumerate(feature_names):
        shap_dict[name] = float(sv[i])
        
    return {
        "turnover_probability": prob,
        "shap_values": shap_dict
    }
