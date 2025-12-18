
import pandas as pd
import xgboost as xgb
import numpy as np
from sklearn.model_selection import train_test_split, KFold, RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from sklearn.preprocessing import OneHotEncoder
import joblib
import shap

from config import settings
from core.preprocessing import aggregate_data_for_5year
from core.evaluation import evaluate_regression, plot_shap_summary, print_feature_importance

class FiveYearModel:
    def __init__(self):
        self.model = None
        self.encoder = None
        self.selector = None
        self.cat_cols = ['a6_education_level', 'a1_gender', 'B2_Public_service_status_ger', 'AgeGroup', 'TenureGroup']
        self.num_cols = [
            'B11_salary_today_brl', 'c1_overall_employee_satisfaction', 
            'B5_Degree_of_employment', 'M_Onboarding_Final_Score', 'M_eNPS'
        ]
        self.feature_names = None
        self.artifact_path = settings.FIVE_YEAR_MODEL_PATH

    def train(self, data_path=None, save_model=True):
        print("\n--- Training Five-Year Model (Aggregated Level) ---")
        
        path = data_path or settings.SYNTHETIC_DATA_PATH
        df = pd.read_csv(path)
        
        # 1. Aggregate
        agg_df = aggregate_data_for_5year(df)
        
        # 2. Preprocess
        X = agg_df.drop(['TurnoverCount'], axis=1)
        y = agg_df['TurnoverCount']
        
        for c in self.cat_cols:
            X[c] = X[c].astype(str)
            
        self.encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        X_cat = self.encoder.fit_transform(X[self.cat_cols])
        X_num = X[self.num_cols].values
        
        X_processed = np.hstack([X_num, X_cat])
        feature_names_proc = self.num_cols + list(self.encoder.get_feature_names_out(self.cat_cols))
        
        X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)
        
        # 3. Selection
        print("\nPerforming Feature Selection...")
        selection_model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100, **settings.XGB_PARAMS_COMMON)
        selection_model.fit(X_train, y_train)
        
        self.selector = SelectFromModel(selection_model, threshold='median', prefit=True)
        X_train_sel = self.selector.transform(X_train)
        X_test_sel = self.selector.transform(X_test)
        
        sel_indices = self.selector.get_support(indices=True)
        self.feature_names = [feature_names_proc[i] for i in sel_indices]
        
        # 4. Hyperparam Search
        print("\nStarting Hyperparameter Optimization...")
        params = {
            'learning_rate': [0.01, 0.05, 0.1, 0.2],
            'max_depth': [3, 5, 7],
            'n_estimators': [100, 200, 300],
            'subsample': [0.7, 0.8, 0.9],
            'colsample_bytree': [0.7, 0.8, 0.9],
            'reg_alpha': [0, 0.1, 1],
            'reg_lambda': [1, 2]
        }
        
        xgb_reg = xgb.XGBRegressor(objective='reg:squarederror', **settings.XGB_PARAMS_COMMON)
        cv = KFold(n_splits=3, shuffle=True, random_state=42)
        
        search = RandomizedSearchCV(xgb_reg, params, n_iter=5, scoring='neg_mean_absolute_error', cv=cv, verbose=1, random_state=42, n_jobs=1)
        search.fit(X_train_sel, y_train)
        
        print(f"Best CV MAE: {-search.best_score_:.4f}")
        self.model = search.best_estimator_
        
        if save_model:
            self.save()
            
        # 5. Evaluate
        y_pred = self.model.predict(X_test_sel)
        y_pred = np.maximum(y_pred, 0)
        
        evaluate_regression(y_test, y_pred)
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
            
            plot_shap_summary(shap_values, X_test, feature_names, file_name='five_year_shap_summary.png')
        except Exception as e:
            print(f"SHAP Error: {e}")

    def save(self):
        artifact = {
            'model': self.model, 
            'encoder': self.encoder, 
            'selector': self.selector,
            'cat_cols': self.cat_cols, 
            'num_cols': self.num_cols, 
            'feature_names': self.feature_names
        }
        joblib.dump(artifact, self.artifact_path)
        print(f"Model saved to {self.artifact_path}")

    def load(self):
        if not self.artifact_path.exists():
             return False
        artifact = joblib.load(self.artifact_path)
        self.model = artifact['model']
        self.encoder = artifact['encoder']
        self.selector = artifact.get('selector')
        self.feature_names = artifact['feature_names']
        # Restore cols if needed, though hardcoded in init
        return True

    def predict_aggregate(self, input_data: dict):
        if self.model is None:
            if not self.load():
                raise FileNotFoundError("Five year model not found.")
        
        df_input = pd.DataFrame([input_data])
        
        for col in self.cat_cols:
            df_input[col] = df_input[col].astype(str)
            
        X_num = df_input[self.num_cols].values
        X_cat = self.encoder.transform(df_input[self.cat_cols])
        X_proc = np.hstack([X_num, X_cat])
        
        X_final = self.selector.transform(X_proc) if self.selector else X_proc
        
        pred = self.model.predict(X_final)[0]
        return float(max(0, pred))

if __name__ == "__main__":
    model = FiveYearModel()
    model.train()
