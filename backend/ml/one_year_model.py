import pandas as pd
import numpy as np
import xgboost as xgb

import matplotlib.pyplot as plt
import joblib
import os
from sklearn.model_selection import StratifiedKFold, RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

# Lazy load preprocessing to avoid circular dependency issues if any
from .preprocessing import load_and_preprocess_one_year, feature_engineering
try:
    from ..app.services.frank_wolfe_multiclass import FrankWolfeMulticlass
except ImportError:
    # Use relative import if running as module from root
    from backend.app.services.frank_wolfe_multiclass import FrankWolfeMulticlass
from shapash import SmartExplainer
from shapash.utils.load_smartpredictor import load_smartpredictor
from backend.ml import shapash_config

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
    
    # Convert back to DataFrame to preserve feature names for XGBoost
    # This prevents the "feature_names mismatch" error in Shapash/SHAP later
    selected_indices = selector.get_support(indices=True)
    feature_names_selected = [feature_names_raw[i] for i in selected_indices]
    
    X_train_selected = pd.DataFrame(selector.transform(X_train_raw), columns=feature_names_selected)
    X_test_selected = pd.DataFrame(selector.transform(X_test_raw), columns=feature_names_selected)
    
    print(f"Selected Feature Count: {X_train_selected.shape[1]}")
    print(f"Dropped {len(feature_names_raw) - len(feature_names_selected)} features.")
    update(40, "Features selected")

    # 3. Hyperparameter Optimization (Civilizing Kit: GridSearch + CV)
    print("\nStarting Hyperparameter Optimization (RandomizedSearch)...")
    update(50, "Optimizing hyperparameters...")
    
    # Grid including Regularization (L1/L2)
    params = {
        'learning_rate': [0.01, 0.05, 0.1, 0.2],
        'max_depth': [2, 3], # Option 1: Strictly reduced complexity
        'n_estimators': [100, 200, 300, 500],
        'subsample': [0.6, 0.8, 1.0],
        'colsample_bytree': [0.6, 0.8, 1.0],
        'gamma': [0, 0.1, 0.2, 0.5], 
        'reg_alpha': [0, 0.1, 0.5, 1], # Moderate L1
        'reg_lambda': [1, 1.5, 2] # Moderate L2
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
    y_pred_test = model.predict(X_test_selected)
    y_prob_test = model.predict_proba(X_test_selected)[:, 1]
    
    y_pred_train = model.predict(X_train_selected)
    y_prob_train = model.predict_proba(X_train_selected)[:, 1]
    
    acc_train = accuracy_score(y_train, y_pred_train)
    acc_test = accuracy_score(y_test, y_pred_test)
    auc_train = roc_auc_score(y_train, y_prob_train)
    auc_test = roc_auc_score(y_test, y_prob_test)

    print("\n--- Overfitting Check (Train vs Test) ---")
    print(f"Accuracy -> Train: {acc_train:.4f} | Test: {acc_test:.4f} (Gap: {abs(acc_train - acc_test):.4f})")
    print(f"ROC AUC  -> Train: {auc_train:.4f} | Test: {auc_test:.4f} (Gap: {abs(auc_train - auc_test):.4f})")
    
    if abs(auc_train - auc_test) > 0.15:
        print("WARNING: High Performance Gap detected (>15%). Model may be OVERTUNNED (Overfitting).")
    else:
        print("Model consistency looks good.")

    print("\nModel Evaluation (Test Set):")
    print(f"Final Accuracy: {acc_test:.4f}")
    print(f"Final ROC AUC: {auc_test:.4f}")
    print("\nClassification Report (Test Set):")
    print(classification_report(y_test, y_pred_test))
    update(90, "Model evaluated")
    
    # 5. Interpretability (Civilizing Kit: SHAP)
    # Using TreeExplainer
    # Using TreeExplainer with raw booster to avoid sklearn wrapper issues

    
    if save_model:
        # Save comprehensive artifact
        artifact = {
            'model': model,
            'preprocessor': preprocessor,
            'selector': selector,
            'feature_names': feature_names_selected
        }
        joblib.dump(artifact, MODEL_PATH)
        joblib.dump(artifact, MODEL_PATH)
        print(f"Model and artifacts saved to {MODEL_PATH}")

        # --- Shapash Integration ---
        print("\nCreating Shapash SmartPredictor...")
        try:
            # Reconstruct DataFrames with selected features for Shapash
            X_test_df = pd.DataFrame(X_test_selected, columns=feature_names_selected)
            X_test_df.reset_index(drop=True, inplace=True)
            
            # Predict labels and conversion for Shapash
            y_pred_series = pd.Series(y_pred_test, name='ypred')
            # One Year model is binary so proba is single column or [neg, pos]
            # SmartExplainer expects proba to match y_target or be full dataframe
            # For binary XGBoost, we can pass the probability of class 1
            
            # Filter Postprocessing to only include existing columns
            # This prevents KeyError if a feature was dropped during selection
            valid_postprocessing = {
                k: v for k, v in shapash_config.POSTPROCESSING.items() 
                if k in X_test_df.columns
            }
            
            # Filter Features Groups to only include existing columns
            valid_groups = {}
            for g_name, g_cols in shapash_config.FEATURES_GROUPS.items():
                existing_cols = [c for c in g_cols if c in X_test_df.columns]
                if existing_cols:
                    valid_groups[g_name] = existing_cols

            # Filter features_dict to match columns AND ensure exhaustive coverage
            valid_features_dict = {}
            for col in X_test_df.columns:
                valid_features_dict[col] = shapash_config.FEATURES_DICT.get(col, col)

            # Shapash might struggle with the custom wrapper, so use the underlying estimator
            if hasattr(model, 'base_estimator'):
                 model_to_explain = model.base_estimator
            else:
                 model_to_explain = model

            print(f"DEBUG: X_test_df shape: {X_test_df.shape}")
            print(f"DEBUG: valid_features_dict length: {len(valid_features_dict)}")
            if hasattr(model_to_explain, 'n_features_in_'):
                 print(f"DEBUG: Model n_features_in_: {model_to_explain.n_features_in_}")

            # Define function to run pipeline
            def run_shapash_pipeline(f_dict, p_processing, f_groups, suffix="full"):
                print(f"--- Running Shapash Pipeline: {suffix} ---")
                xpl = SmartExplainer(
                    model=model_to_explain,
                    features_dict=f_dict,
                    label_dict=shapash_config.LABEL_DICT,
                    postprocessing=p_processing,
                    features_groups=f_groups
                )
                print(f"DEBUG: X_test_df shape: {X_test_df.shape}")
                print(f"DEBUG: y_pred_series shape: {y_pred_series.shape}")
                xpl.compile(x=X_test_df, y_pred=y_pred_series)
                predictor = xpl.to_smartpredictor()
                predictor.save("backend/ml/one_year_predictor.pkl")
                print(f"SmartPredictor saved successfully ({suffix}).")

            # Try Full Config
            try:
                run_shapash_pipeline(valid_features_dict, valid_postprocessing, valid_groups, "full")
            except Exception as e_full:
                print(f"WARNING: Full Shapash pipeline failed: {e_full}")
                try:
                    # Try Minimal Config (No dicts that check lengths)
                    run_shapash_pipeline(None, None, None, "minimal")
                except Exception as e_min:
                    print(f"ERROR: Minimal Shapash pipeline also failed: {e_min}")
                    import traceback
                    traceback.print_exc()

            
        except Exception as e:
            print(f"Error creating/saving Shapash predictor: {e}")
            import traceback
            traceback.print_exc()

    
    update(100, "One Year Model Complete")
    return model

def load_one_year_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def predict_individual_risk(input_data: dict):
    """
    Predicts turnover probability for a single individual using Shapash SmartPredictor.
    Returns: {turnover_probability: float, shap_values: dict}
    """
    
    # 0. Load Artifact (Required for Preprocessing)
    artifact = load_one_year_model()
    if not artifact:
        raise FileNotFoundError("One year model not found. Please train first.")
        
    preprocessor = artifact['preprocessor']
    selector = artifact['selector']
    feature_names = artifact['feature_names'] # These match what predictor expects
    
    # 1. Preprocess & Select
    df_input = pd.DataFrame([input_data])
    try:
        # Apply Feature Engineering (calculate Onboarding Score etc.)
        df_engineered = feature_engineering(df_input)
        
        X_processed = preprocessor.transform(df_engineered)
        X_final = selector.transform(X_processed)
        # Convert to DataFrame with correct names for SmartPredictor/XGBoost
        X_final_df = pd.DataFrame(X_final, columns=feature_names)
    except Exception as e:
         raise ValueError(f"Preprocessing/Selection failed: {e}")

    predictor_path = "backend/ml/one_year_predictor.pkl"
    
    # 2. Try using SmartPredictor
    if os.path.exists(predictor_path):
        predictor = load_smartpredictor(predictor_path)
        
        if hasattr(predictor, 'features_types'):
            required_cols = list(predictor.features_types.keys())
            
            # Add missing columns (fill with 0/default)
            for c in required_cols:
                if c not in X_final_df.columns:
                    X_final_df[c] = 0.0
            
            # Reorder and Drop extras
            X_final_df = X_final_df[required_cols]
            
            # Enforce Types
            # FORCE FIX: Patch predictor expectation to float64 to match XGBoost/Transformed data reality
            # This handles cases where Shapash incorrectly inferred 'object' types during compile
            patch_types = {}
            for col in predictor.features_types.keys():
                patch_types[col] = 'float64'
            predictor.features_types = patch_types
            
            for col in X_final_df.columns:
                X_final_df[col] = X_final_df[col].astype(float)

        # Predictor expects DataFrame with correct columns
        predictor.add_input(x=X_final_df)
        
        # Predict Proba
        # For binary classification, result structure depends on version
        proba_df = predictor.predict_proba()
        
        # In config: 1: 'Turnover'
        target_col = shapash_config.LABEL_DICT.get(1, 1)
        if target_col in proba_df.columns:
             prob = float(proba_df[target_col].iloc[0])
        else:
             # Fallback to second column
             prob = float(proba_df.iloc[0, 1])
        
        # Explanation
        contributions = predictor.detail_contributions() 
        raw_dict = contributions.iloc[0].to_dict()
        
        shap_dict = {}
        for k, v in raw_dict.items():
            # Shapash might return formatted strings (e.g. "100 BRL")
            # We need to extract the float for the chart
            try:
                if isinstance(v, str):
                    # Extract first number found
                    import re
                    match = re.search(r"[-+]?\d*\.\d+|\d+", v)
                    if match:
                        shap_dict[k] = float(match.group())
                    else:
                        shap_dict[k] = 0.0
                else:
                    shap_dict[k] = float(v)
            except:
                shap_dict[k] = 0.0
        
        return {
            "turnover_probability": prob,
            "shap_values": shap_dict,
            "contributions": shap_dict
        }

    else:
        raise FileNotFoundError(f"SmartPredictor not found at {predictor_path}. Please retrain model.")
