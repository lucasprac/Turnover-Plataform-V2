import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .motivation_service import calculate_dimension_scores, MotivationDimension
from .motivation_data import generate_mock_motivation_data
from .frank_wolfe_multiclass import FrankWolfeMulticlass, g_mean_score
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

class MotivationAnalyzer:
    def __init__(self):
        self.model = None
        self.dimensions = [d.value for d in MotivationDimension]

    def load_and_preprocess_data(self) -> pd.DataFrame:
        """
        Loads user data or mock data if not available.
        Calculates dimensions.
        """
        # For now, generate mock data as requested
        self.df = generate_mock_motivation_data(num_samples=1000)
        return self.df

    def get_all_data(self) -> List[Dict[str, Any]]:
        """
        Returns all motivation data records.
        """
        if hasattr(self, 'df') and self.df is not None:
            # Convert to list of dicts, helping with serialization
            # Replace NaN with None
            return self.df.replace({np.nan: None}).to_dict(orient='records')
        return []

    def train_model(self, df: pd.DataFrame):
        """
        Trains the Frank-Wolfe Multiclass model to predict Turnover
        using Motivation Dimensions.
        """
        X = df[['Amotivation', 'Ext_Social', 'Ext_Material', 
                'Introjected', 'Identified', 'Intrinsic']]
        y = df['Turnover']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Base Estimator: XGBoost
        base_est = XGBClassifier(
            n_estimators=100, 
            eval_metric='logloss',
            use_label_encoder=False
        )

        # Wrapper: Frank-Wolfe for G-Mean (Strict)
        self.model = FrankWolfeMulticlass(base_estimator=base_est)
        self.model.fit(X_train, y_train)

        # Evaluate
        preds = self.model.predict(X_test)
        g_mean = g_mean_score(y_test, preds)
        
        return {
            "g_mean": round(g_mean, 3),
            "test_size": len(y_test),
            "class_distribution": y.value_counts().to_dict()
        }

    def analyze_onboarding_vs_climate(self, onboarding_data: Dict, climate_data: Dict) -> Dict[str, Any]:
        """
        Compares two moments.
        Input: Dict of Question Answers {1: 5, 2: 3...}
        """
        onb_scores = calculate_dimension_scores(onboarding_data)
        climate_scores = calculate_dimension_scores(climate_data)
        
        deltas = {}
        for dim in self.dimensions:
            v1 = onb_scores.get(dim)
            v2 = climate_scores.get(dim)
            if v1 is not None and v2 is not None:
                deltas[dim] = v2 - v1
            else:
                deltas[dim] = None
                
        # Proyect Risk using the model assuming Climate State
        risk_prediction = None
        if self.model and climate_scores:
            # Construct feature vector in order
            # 'Amotivation', 'Ext_Social', 'Ext_Material', 'Introjected', 'Identified', 'Intrinsic'
            features = [
                climate_scores.get(MotivationDimension.AMOTIVATION.value, 0),
                climate_scores.get(MotivationDimension.EXT_REG_SOCIAL.value, 0),
                climate_scores.get(MotivationDimension.EXT_REG_MATERIAL.value, 0),
                climate_scores.get(MotivationDimension.INTROJECTED.value, 0),
                climate_scores.get(MotivationDimension.IDENTIFIED.value, 0),
                climate_scores.get(MotivationDimension.INTRINSIC.value, 0)
            ]
            features_df = pd.DataFrame([features], columns=[
                'Amotivation', 'Ext_Social', 'Ext_Material',
                'Introjected', 'Identified', 'Intrinsic'
            ])
            risk_prediction = int(self.model.predict(features_df)[0])

        return {
            "onboarding_scores": onb_scores,
            "climate_scores": climate_scores,
            "deltas": deltas,
            "predicted_turnover_risk_climate": risk_prediction
        }

analyzer = MotivationAnalyzer()
