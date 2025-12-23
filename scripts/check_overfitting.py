import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import os
import sys

# Add root to sys.path
sys.path.append(os.getcwd())

from backend.ml.preprocessing import load_and_preprocess_one_year

def check_overfitting(data_path="synthetic_turnover_data.csv"):
    log_file = "overfitting_results.txt"
    with open(log_file, "w") as f:
        f.write("=== Model Overfitting Diagnostic Utility ===\n")
        print("=== Model Overfitting Diagnostic Utility ===")
    
    if not os.path.exists(data_path):
        with open(log_file, "a") as f:
            f.write(f"Error: Data file {data_path} not found.\n")
        print(f"Error: Data file {data_path} not found.")
        return

    # 1. Load and Preprocess
    with open(log_file, "a") as f:
        f.write("Loading data...\n")
        print("Loading data...")
        df = pd.read_csv(data_path)
        f.write(f"Data loaded: {len(df)} rows. Preprocessing...\n")
        print(f"Data loaded: {len(df)} rows. Preprocessing...")
        X_train_raw, X_test_raw, y_train, y_test, _, _ = load_and_preprocess_one_year(df)
        f.write(f"Preprocessing complete. Train size: {len(X_train_raw)}, Test size: {len(X_test_raw)}\n")
        print(f"Preprocessing complete. Train size: {len(X_train_raw)}, Test size: {len(X_test_raw)}")
        
        # 2. Test varying depths to see divergence
        depths = [2, 3, 4, 6, 8, 10, 15]
        results = []

        f.write(f"\nEvaluating complexity (max_depth) on {len(X_train_raw)} samples:\n")
        print(f"\nEvaluating complexity (max_depth) on {len(X_train_raw)} samples:")

        header = f"{'Depth':<10} | {'Train AUC':<12} | {'Test AUC':<12} | {'Gap':<10}\n"
        separator = "-" * 50 + "\n"
        f.write(header)
        f.write(separator)
        print(header, end="")
        print(separator, end="")

        for depth in depths:
            model = xgb.XGBClassifier(
                max_depth=depth,
                n_estimators=100,
                learning_rate=0.1,
                random_state=42,
                eval_metric='logloss',
                n_jobs=1
            )
            model.fit(X_train_raw, y_train)
            
            train_probs = model.predict_proba(X_train_raw)[:, 1]
            test_probs = model.predict_proba(X_test_raw)[:, 1]
            
            train_auc = roc_auc_score(y_train, train_probs)
            test_auc = roc_auc_score(y_test, test_probs)
            gap = train_auc - test_auc
            
            row = f"{depth:<10} | {train_auc:<12.4f} | {test_auc:<12.4f} | {gap:<10.4f}\n"
            f.write(row)
            print(row, end="")
            results.append({'depth': depth, 'train': train_auc, 'test': test_auc, 'gap': gap})

        # 3. Simple Risk Assessment
        max_gap = max(r['gap'] for r in results)
        footer = "\n" + "="*50 + "\nRISK ASSESSMENT:\n"
        f.write(footer)
        print(footer, end="")
        
        if max_gap > 0.15:
            msg = f"STATUS: HIGH RISK OF OVERTUNNING\nDetails: Significant divergence ({max_gap:.4f}) at higher complexities.\nRecommendation: Use L1/L2 regularization (reg_alpha/reg_lambda) and limit max_depth.\n"
        elif max_gap > 0.08:
            msg = "STATUS: MEDIUM RISK\nRecommendation: Monitor performance gap during GridSearch.\n"
        else:
            msg = "STATUS: LOW RISK\nConsistency: Model generalizes well across depths.\n"
        
        f.write(msg)
        f.write("="*50 + "\n")
        print(msg, end="")
        print("="*50)

if __name__ == "__main__":
    check_overfitting()
