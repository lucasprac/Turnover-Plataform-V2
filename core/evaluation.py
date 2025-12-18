
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, mean_absolute_error, mean_squared_error, r2_score
from sklearn.cluster import AgglomerativeClustering
from config import settings

def evaluate_classification(y_true, y_pred, y_prob):
    """
    Prints classification metrics and returns a report dict.
    """
    print("\nModel Evaluation (Test Set):")
    acc = accuracy_score(y_true, y_pred)
    roc = roc_auc_score(y_true, y_prob)
    print(f"Accuracy: {acc:.4f}")
    print(f"ROC AUC: {roc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))
    
    return {
        'accuracy': acc,
        'roc_auc': roc
    }

def evaluate_regression(y_true, y_pred):
    """
    Prints regression metrics.
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    print("\nModel Evaluation (Test Set):")
    print(f"MAE: {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2 Score: {r2:.4f}")
    
    return {
        'mae': mae,
        'rmse': rmse,
        'r2': r2
    }

def plot_shap_summary(shap_values, X, feature_names, file_name='shap_summary.png'):
    """
    Generates and saves a SHAP summary plot.
    """
    try:
        plt.figure()
        shap.summary_plot(shap_values, X, feature_names=feature_names, show=False)
        plt.tight_layout()
        save_path = settings.ARTIFACTS_DIR / file_name
        plt.savefig(save_path)
        print(f"SHAP Summary Plot saved to '{save_path}'")
        plt.close()
    except Exception as e:
        print(f"Failed to plot SHAP summary: {e}")

def plot_shap_clustering(shap_values, feature_names, file_name='shap_clustering_heatmap.png'):
    """
    Performs supervised clustering on SHAP values and plots heatmap.
    """
    try:
        print("\nPerforming Supervised Clustering with SHAP...")
        
        # Downsample if too large
        shap_sample = shap_values
        if shap_values.shape[0] > 2000:
            indices_sample = np.random.choice(shap_values.shape[0], 2000, replace=False)
            shap_sample = shap_values[indices_sample]
            
        df_shap_vis = pd.DataFrame(shap_sample, columns=feature_names)
        
        plt.figure(figsize=(12, 10))
        clustermap = sns.clustermap(
            df_shap_vis, 
            method='ward', 
            cmap='vlag', 
            center=0, 
            col_cluster=True, 
            yticklabels=False, # Too many rows
            xticklabels=True
        )
        plt.suptitle("Supervised Clustering of SHAP Values", y=1.02)
        save_path = settings.ARTIFACTS_DIR / file_name
        clustermap.savefig(save_path)
        print(f"Clustermap saved to '{save_path}'")
        plt.close()
        
        # Analyze Clusters
        hac = AgglomerativeClustering(n_clusters=4, linkage='ward')
        cluster_labels = hac.fit_predict(shap_sample)
        df_shap_vis['Cluster'] = cluster_labels
        
        print("\nCluster Interpretation (Top features per cluster):")
        for c in range(4):
            print(f"\n--- Cluster {c} ---") 
            mean_vals = df_shap_vis[df_shap_vis['Cluster'] == c].mean().drop('Cluster')
            top_drivers = mean_vals.sort_values(ascending=False).head(3)
            top_retainers = mean_vals.sort_values(ascending=True).head(3)
            
            print("  Main Drivers (Inc. Risk):")
            for name, val in top_drivers.items():
                print(f"    - {name}: {val:.4f}")
            print("  Main Retainers (Red. Risk):")
            for name, val in top_retainers.items():
                print(f"    - {name}: {val:.4f}")
                
    except Exception as e:
        print(f"SHAP Clustering analysis failed: {e}")

def print_feature_importance(model, feature_names, top_n=10):
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print(f"\nTop {top_n} Feature Importances:")
    for i in range(min(top_n, len(feature_names))):
        idx = indices[i]
        print(f"{i+1}. {feature_names[idx]}: {importances[idx]:.4f}")
