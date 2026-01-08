
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import os
import logging
from sklearn.model_selection import KFold, RandomizedSearchCV, train_test_split
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from backend.ml.preprocessing import aggregate_data_for_5year
from shapash import SmartExplainer
from shapash.utils.load_smartpredictor import load_smartpredictor
from backend.ml import shapash_config

# Models are in backend/ml

import sys

# Ensure root is in path if not already
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.getcwd() 
if root_dir not in sys.path:
    sys.path.append(root_dir)

DATA_PATH = os.path.join(root_dir, "synthetic_turnover_data.csv")
MODEL_PATH = os.path.join(current_dir, "five_year_model.xgb")


def train_five_year_model(data_path="synthetic_turnover_data.csv", save_model=True, progress_callback=None):
    def update(p, msg):
        if progress_callback:
            progress_callback(p, msg)
            
    logger.info("--- Training Five-Year Model (Aggregated Level) ---")
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
    
    logger.info(f"Aggregated Data Shape: {X.shape}")
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
    
    logger.info(f"Initial Feature Count: {X_processed.shape[1]}")
    update(20, "Selecting features...")

    # Feature Selection (Lasso-like)
    logger.info("Performing Feature Selection...")
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
    
    mask = selector.get_support()
    feature_names_selected = [name for name, selected in zip(feature_names_out, mask) if selected]
    
    logger.info(f"Selected Feature Count: {X_selected.shape[1]}")
    update(40, "Features selected")

    # 4. Hyperparameter Tuning (CV)
    # Using a 20% test split even for small aggregated data to ensure some validation
    X_train_vals, X_test_vals, y_train, y_test = train_test_split(X_selected, y, test_size=0.2, random_state=42)
    
    # Prepare DataFrames for fitting to preserve feature names
    X_train = pd.DataFrame(X_train_vals, columns=feature_names_selected)
    X_test = pd.DataFrame(X_test_vals, columns=feature_names_selected)

    logger.info(f"Split Count -> Train: {X_train.shape[0]} | Test: {X_test.shape[0]}")
    logger.info("Starting Hyperparameter Optimization...")
    update(50, "Optimizing hyperparameters...")
    params = {
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [2, 3], # Option 1: Strictly reduced complexity
        'n_estimators': [100, 200, 300],
        'subsample': [0.7, 0.9],
        'colsample_bytree': [0.7, 0.9],
        'reg_alpha': [0, 0.1, 1], # Moderate L1
        'reg_lambda': [1, 2] # Moderate L2
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
    
    search.fit(X_train, y_train)
    
    logger.info(f"Best CV MAE: {-search.best_score_:.4f}")
    
    final_model = search.best_estimator_
    update(80, "Model optimized")
    
    # 5. Evaluation
    y_pred_train = final_model.predict(X_train)
    y_pred_test = final_model.predict(X_test)
    
    mae_train = mean_absolute_error(y_train, y_pred_train)
    mae_test = mean_absolute_error(y_test, y_pred_test)
    rmse_train = np.sqrt(mean_squared_error(y_train, y_pred_train))
    rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    
    logger.info("--- Overfitting Check (Train vs Test) ---")
    logger.info(f"MAE  -> Train: {mae_train:.2f} | Test: {mae_test:.2f} (Gap: {abs(mae_train - mae_test):.2f})")
    logger.info(f"RMSE -> Train: {rmse_train:.2f} | Test: {rmse_test:.2f}")
    logger.info(f"R2   -> Train: {r2_train:.4f} | Test: {r2_test:.4f}")
    
    if r2_train > 0.9 and r2_test < 0.6:
        logger.warning("Large R2 Gap detected. Model may be OVERTUNNED (Overfitting).")
    else:
        logger.info("Model consistency looks good.")

    update(90, "Model evaluated")

    if save_model:
        artifact = {
            'model': final_model,
            'preprocessor': preprocessor,
            'selector': selector,
            'feature_names': feature_names_selected, # Selected names
            'metrics': {
                'mae': float(mae_test),
                'rmse': float(rmse_test),
                'r2_score': float(r2_test)
            }
        }
        joblib.dump(artifact, MODEL_PATH)
        logger.info(f"Model saved to {MODEL_PATH}")

        # --- Shapash Integration ---
        logger.info("Creating Shapash SmartPredictor for 5-Year Model...")
        try:
            X_test_df = X_test

            # Filter Postprocessing to only include existing columns
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

            # Filter features_dict
            valid_features_dict = {col: shapash_config.FEATURES_DICT.get(col, col) for col in X_test_df.columns}

            logger.debug(f"Model features: {getattr(final_model, 'n_features_in_', 'N/A')}")
            logger.debug(f"X_test_df columns: {len(X_test_df.columns)}")
            logger.debug(f"valid_features_dict items: {len(valid_features_dict)}")
            
            xpl = SmartExplainer(
                model=final_model,
                features_dict=valid_features_dict,
                postprocessing=valid_postprocessing,
                features_groups=valid_groups
            )
            # Ensure y_pred matches X_test_df indices
            y_pred_series = pd.Series(y_pred_test, name='ypred', index=X_test_df.index)
            
            # Regressor doesn't need label_dict as much, but we can pass it if relevant
            # Use explainers that are more robust if possible
            xpl.compile(x=X_test_df, y_pred=y_pred_series)
            
            predictor = xpl.to_smartpredictor()
            predictor_path = os.path.join(current_dir, "five_year_predictor.pkl")
            predictor.save(predictor_path)
            logger.info(f"5-Year SmartPredictor saved successfully to {predictor_path}")

        except Exception as e:
            logger.error(f"Error creating/saving 5-Year Shapash predictor: {e}", exc_info=True)
    
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
        
        # --- Shapash Prediction & explanation ---
        predictor_path = os.path.join(current_dir, "five_year_predictor.pkl")
        shap_dict = {}

        if os.path.exists(predictor_path):
            predictor = load_smartpredictor(predictor_path)
            
            # Align features
            if hasattr(predictor, 'features_types'):
                required_cols = list(predictor.features_types.keys())
                X_final_df = pd.DataFrame(X_final, columns=artifact['feature_names'])
                for c in required_cols:
                    if c not in X_final_df.columns:
                        X_final_df[c] = 0.0
                X_final_df = X_final_df[required_cols]
                
                # Patch types to float64
                patch_types = {col: 'float64' for col in predictor.features_types.keys()}
                predictor.features_types = patch_types
                for col in X_final_df.columns:
                    X_final_df[col] = X_final_df[col].astype(float)

                predictor.add_input(x=X_final_df)
                contributions = predictor.detail_contributions()
                raw_dict = contributions.iloc[0].to_dict()

                # Clean and transform contributions
                for k, v in raw_dict.items():
                    try:
                        if isinstance(v, str):
                            import re
                            match = re.search(r"[-+]?\d*\.\d+|\d+", v)
                            shap_dict[k] = float(match.group()) if match else 0.0
                        else:
                            shap_dict[k] = float(v)
                    except:
                        shap_dict[k] = 0.0
        else:
            logger.warning(f"5-Year Predictor not found at {predictor_path}")

        return {
            "prediction": max(0, float(prediction)),
            "shap_values": shap_dict
        }
        
    except Exception as e:
        logger.error(f"Aggregate predict error: {e}", exc_info=True)
        return {
            "prediction": 0.0,
            "shap_values": {}
        }

