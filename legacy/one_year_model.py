import pandas as pd
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, roc_curve, auc
from sklearn.model_selection import StratifiedKFold, RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from preprocessing import preprocess_data
import matplotlib.pyplot as plt
import numpy as np
import shap
import seaborn as sns
from sklearn.cluster import AgglomerativeClustering
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import dendrogram, linkage

import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".data", "one_year_model.xgb")

def train_one_year_model(data_path=".data/synthetic_turnover_data.csv", save_model=True):
    print("--- Training One-Year Model (Individual Level) ---")
    
    # Load and Preprocess
    df = pd.read_csv(data_path)
    X_train_raw, X_test_raw, y_train, y_test, feature_names_raw, preprocessor = preprocess_data(df)
    
    print(f"Initial Feature Count: {X_train_raw.shape[1]}")

    # --- 1. Feature Selection ---
    print("\nPerforming Feature Selection...")
    selection_model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        eval_metric='logloss',
        use_label_encoder=False,
        random_state=42,
        n_jobs=-1
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

    # --- 2. Hyperparameter Optimization with Cross-Validation ---
    print("\nStarting Hyperparameter Optimization (RandomizedSearch)...")
    
    params = {
        'learning_rate': [0.01, 0.05, 0.1, 0.2],
        'max_depth': [3, 5, 7, 9],
        'n_estimators': [100, 200, 300, 500],
        'subsample': [0.6, 0.8, 1.0],
        'colsample_bytree': [0.6, 0.8, 1.0],
        'gamma': [0, 0.1, 0.5, 1],
        'reg_alpha': [0, 0.1, 0.5, 1],
        'reg_lambda': [1, 1.5, 2]
    }
    
    xgb_clf = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        use_label_encoder=False,
        random_state=42,
        n_jobs=-1
    )
    
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    search = RandomizedSearchCV(
        estimator=xgb_clf,
        param_distributions=params,
        n_iter=20,
        scoring='roc_auc',
        cv=cv_strategy,
        verbose=1,
        random_state=42,
        n_jobs=-1
    )
    
    # Train on selected features
    search.fit(X_train_selected, y_train)
    
    print(f"Best CV Score: {search.best_score_:.4f}")
    print(f"Best Params: {search.best_params_}")
    
    model = search.best_estimator_
    
    if save_model:
        # Save model + preprocessor + selector
        artifact = {
            'model': model,
            'preprocessor': preprocessor,
            'selector': selector,
            'feature_names': feature_names_selected
        }
        joblib.dump(artifact, MODEL_PATH)
        print(f"Model and artifacts saved to {MODEL_PATH}")

    # Predict
    y_pred = model.predict(X_test_selected)
    y_prob = model.predict_proba(X_test_selected)[:, 1]
    
    # Evaluate
    print("\nModel Evaluation (Test Set):")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Feature Importance (Selected)
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("\nTop 10 Feature Importances (Selected):")
    for i in range(min(10, len(feature_names_selected))):
        idx = indices[i]
        print(f"{i+1}. {feature_names_selected[idx]}: {importances[idx]:.4f}")

    # --- SHAP Analysis ---
    print("\nExtracting SHAP values for transparency (Native XGBoost)...")
    try:
        booster = model.get_booster()
        # DMatrix with selected features
        dtest = xgb.DMatrix(X_test_selected, feature_names=feature_names_selected)
        shap_values_raw = booster.predict(dtest, pred_contribs=True)
        
        shap_values = shap_values_raw[:, :-1]
        
        plt.figure()
        shap.summary_plot(shap_values, X_test_selected, feature_names=feature_names_selected, show=False)
        plt.tight_layout()
        plt.savefig('shap_summary_one_year.png')
        print("SHAP Summary Plot saved to 'shap_summary_one_year.png'")
        
        # --- Supervised Clustering with SHAP ---
        print("\nPerforming Supervised Clustering with SHAP...")
        
        shap_sample = shap_values
        if shap_values.shape[0] > 2000:
            indices_sample = np.random.choice(shap_values.shape[0], 2000, replace=False)
            shap_sample = shap_values[indices_sample]
            
        df_shap_vis = pd.DataFrame(shap_sample, columns=feature_names_selected)
        
        plt.figure(figsize=(12, 10))
        clustermap = sns.clustermap(
            df_shap_vis, 
            method='ward', 
            cmap='vlag', 
            center=0, 
            col_cluster=True, 
            yticklabels=False,
            xticklabels=True
        )
        plt.suptitle("Supervised Clustering of SHAP Values", y=1.02)
        clustermap.savefig('shap_clustering_heatmap.png')
        print("Clustermap saved to 'shap_clustering_heatmap.png'")
        
        hac = AgglomerativeClustering(n_clusters=4, linkage='ward')
        cluster_labels = hac.fit_predict(shap_sample)
        
        df_shap_vis['Cluster'] = cluster_labels
        
        print("\nCluster Interpretation (Top features per cluster):")
        for c in range(4):
            print(f"\n--- Cluster {c} ---") 
            mean_vals = df_shap_vis[df_shap_vis['Cluster'] == c].mean().drop('Cluster')
            top_drivers = mean_vals.sort_values(ascending=False).head(3)
            # Retainers are negative values in log-odds space for class 1? 
            # Usually high negative shap means pushing towards class 0 (stay).
            top_retainers = mean_vals.sort_values(ascending=True).head(3)
            
            print("  Main Drivers (Inc. Risk):")
            for name, val in top_drivers.items():
                print(f"    - {name}: {val:.4f}")
            print("  Main Retainers (Red. Risk):")
            for name, val in top_retainers.items():
                print(f"    - {name}: {val:.4f}")

    except Exception as e:
        print(f"SHAP Analysis completely failed. Error: {e}")
        import traceback
        traceback.print_exc()
        
    return model

def load_one_year_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)

def predict_individual_risk(input_data):
    """
    Predicts risk for a single employee.
    input_data: dict of features matching the dataframe structure
    """
    artifact = load_one_year_model()
    if not artifact:
        raise FileNotFoundError("Model not found. Please train first.")
    
    model = artifact['model']
    preprocessor = artifact['preprocessor']
    selector = artifact.get('selector')
    feature_names = artifact['feature_names']
    
    # Convert dict to DataFrame
    df_input = pd.DataFrame([input_data])
    
    try:
        # 1. Preprocess (Scale/Encode)
        X_processed = preprocessor.transform(df_input)
        
        # 2. Select Features (if selector exists)
        if selector:
            X_final = selector.transform(X_processed)
        else:
            X_final = X_processed
            
    except Exception as e:
        raise ValueError(f"Preprocessing/Selection failed: {e}")

    # Predict Probability
    prob = model.predict_proba(X_final)[:, 1][0]
    
    # SHAP Explanation for this instance
    booster = model.get_booster()
    dtest = xgb.DMatrix(X_final, feature_names=feature_names)
    shap_values = booster.predict(dtest, pred_contribs=True)[0, :-1] # Remove bias
    
    # Format SHAP values
    shap_dict = {name: float(val) for name, val in zip(feature_names, shap_values)}
    
    return {
        "turnover_probability": float(prob),
        "shap_values": shap_dict
    }

if __name__ == "__main__":
    train_one_year_model()
