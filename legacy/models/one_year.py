
import pandas as pd
import xgboost as xgb
from sklearn.feature_selection import SelectFromModel
from sklearn.model_selection import StratifiedKFold, RandomizedSearchCV
import joblib
import numpy as np
import shap

from config import settings
from core.preprocessing import load_and_preprocess_one_year
from core.evaluation import evaluate_classification, plot_shap_summary, plot_shap_clustering, print_feature_importance

class OneYearModel:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.selector = None
        self.feature_names = None
        self.artifact_path = settings.ONE_YEAR_MODEL_PATH

    def train(self, data_path=None, save_model=True):
        print("--- Training One-Year Model (Individual Level) ---")
        
        path = data_path or settings.SYNTHETIC_DATA_PATH
        df = pd.read_csv(path)
        
        # 1. Load and Preprocess
        X_train_proc, X_test_proc, y_train, y_test, feature_names_proc, preprocessor = load_and_preprocess_one_year(df)
        
        print(f"Initial Feature Count: {X_train_proc.shape[1]}")

        # 2. Feature Selection
        print("\nPerforming Feature Selection...")
        selection_model = xgb.XGBClassifier(objective='binary:logistic', n_estimators=100, eval_metric='logloss', **settings.XGB_PARAMS_COMMON)
        selection_model.fit(X_train_proc, y_train)
        
        selector = SelectFromModel(selection_model, threshold='median', prefit=True)
        X_train_sel = selector.transform(X_train_proc)
        X_test_sel = selector.transform(X_test_proc)
        
        selected_indices = selector.get_support(indices=True)
        feature_names_sel = [feature_names_proc[i] for i in selected_indices]
        
        print(f"Selected Feature Count: {X_train_sel.shape[1]}")
        
        # 3. Hyperparameter Optimization
        print("\nStarting Hyperparameter Optimization...")
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
        
        xgb_clf = xgb.XGBClassifier(objective='binary:logistic', eval_metric='logloss', **settings.XGB_PARAMS_COMMON)
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        
        search = RandomizedSearchCV(xgb_clf, params, n_iter=5, scoring='roc_auc', cv=cv, verbose=1, random_state=42, n_jobs=1)
        search.fit(X_train_sel, y_train)
        
        print(f"Best CV Score: {search.best_score_:.4f}")
        self.model = search.best_estimator_
        self.preprocessor = preprocessor
        self.selector = selector
        self.feature_names = feature_names_sel
        
        # 4. Save
        if save_model:
            self.save()
            
        # 5. Evaluate
        y_pred = self.model.predict(X_test_sel)
        y_prob = self.model.predict_proba(X_test_sel)[:, 1]
        
        evaluate_classification(y_test, y_pred, y_prob)
        print_feature_importance(self.model, self.feature_names)
        
        # 6. SHAP
        self._run_shap_analysis(X_test_sel, self.feature_names)
        
        return self.model

    def _run_shap_analysis(self, X_test, feature_names):
        print("\nExtracting SHAP values...")
        try:
            booster = self.model.get_booster()
            dtest = xgb.DMatrix(X_test, feature_names=feature_names)
            shap_values_raw = booster.predict(dtest, pred_contribs=True)
            shap_values = shap_values_raw[:, :-1]
            
            plot_shap_summary(shap_values, X_test, feature_names, file_name='one_year_shap_summary.png')
            plot_shap_clustering(shap_values, feature_names, file_name='one_year_shap_heatmap.png')
            
        except Exception as e:
            print(f"SHAP Error: {e}")

    def save(self):
        artifact = {
            'model': self.model,
            'preprocessor': self.preprocessor,
            'selector': self.selector,
            'feature_names': self.feature_names
        }
        joblib.dump(artifact, self.artifact_path)
        print(f"Model saved to {self.artifact_path}")

    def load(self):
        if not self.artifact_path.exists():
            return False
        artifact = joblib.load(self.artifact_path)
        self.model = artifact['model']
        self.preprocessor = artifact['preprocessor']
        self.selector = artifact.get('selector')
        self.feature_names = artifact['feature_names']
        return True

    def predict_risk(self, input_data: dict):
        if self.model is None:
            if not self.load():
                raise FileNotFoundError("Model not loaded and file not found.")
        
        df_input = pd.DataFrame([input_data])
        
        X_proc = self.preprocessor.transform(df_input)
        X_final = self.selector.transform(X_proc) if self.selector else X_proc
        
        prob = self.model.predict_proba(X_final)[:, 1][0]
        
        # SHAP
        booster = self.model.get_booster()
        dtest = xgb.DMatrix(X_final, feature_names=self.feature_names)
        shap_values = booster.predict(dtest, pred_contribs=True)[0, :-1]
        
        shap_dict = {name: float(val) for name, val in zip(self.feature_names, shap_values)}
        
        return {
            "turnover_probability": float(prob),
            "shap_values": shap_dict
        }

if __name__ == "__main__":
    model = OneYearModel()
    model.train()
