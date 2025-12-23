
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.base import BaseEstimator, TransformerMixin

class TurnoverPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.preprocessor = None
        self.feature_names = None
        self.numerical_features = None
        self.categorical_features = None

    def fit(self, X, y=None):
        """
        Identifies features and fits the internal ColumnTransformer.
        X should be the raw dataframe (or subset of it).
        """
        # Feature Logic match defaults
        early_cat = [
            'a1_gender', 'a6_education_level', 'B2_Public_service_status_ger',
            'B14_Cargo', 'B15_Sector', 'B16_Headquarters'
        ]
        early_num = [
            'a2_age', 'a3_number_of_children', 'a4_children_under_18_years', 'a5_age_youngest_children', 
            'B1_commute_distance_in_km', 'B3_early_retirement_rate', 'B4_sickness_days', 'B5_Degree_of_employment', 
            'B6_gross_working_days', 'B7_Vacation_days', 'B8_net_working_days', 'B9_salary_increase_last_year', 
            'B10_Tenure_in_month', 'B11_salary_today_brl', 'B12_salary_increase_last_5_years', 'B13_Parental_leave', 
            'D1_monthly_unemployment_rate_brazil', 'D2_monthly_number_of_vacancies', 'D3_monthly_short_time_workers',
            'b1_PDI_rate'
        ]
        
        middle_num = [c for c in X.columns if c.startswith('M_') or c.startswith('Climate_')]
        middle_num.extend(['c1_overall_employee_satisfaction', 'c2_employee_satisfaction_moving_average'])
        middle_num = list(set(middle_num))
        
        # Check intersection
        self.categorical_features = [c for c in early_cat if c in X.columns]
        self.numerical_features = [c for c in early_num + middle_num if c in X.columns]
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), self.numerical_features),
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), self.categorical_features)
            ])
            
        self.preprocessor.fit(X, y)
        
        # Save feature names
        cat_names = self.preprocessor.named_transformers_['cat'].get_feature_names_out(self.categorical_features)
        self.feature_names = self.numerical_features + list(cat_names)
        
        return self

    def transform(self, X):
        if self.preprocessor is None:
            raise ValueError("Preprocessor has not been fitted yet.")
        
        # Handle Missing Values (Mean Imputation for Numerical)
        # Ideally this should be a SimpleImputer inside the pipeline, but we'll do quick fix here
        X_copy = X.copy()
        for col in self.numerical_features:
            if col in X_copy.columns and X_copy[col].isnull().any():
                 X_copy[col] = X_copy[col].fillna(X_copy[col].mean())
                 
        return self.preprocessor.transform(X_copy)

    def get_feature_names(self):
        return self.feature_names

def feature_engineering(df):
    """
    Applies Lifecycle variable engineering (Onboarding Score).
    """
    df_eng = df.copy()
    
    # Calculate Avg for 15d and 30d
    cols_15d = [c for c in df_eng.columns if 'M_Onb_15d' in c]
    cols_30d = [c for c in df_eng.columns if 'M_Onb_30d' in c]
    
    if cols_15d and cols_30d:
        avg_15d = df_eng[cols_15d].mean(axis=1)
        avg_30d = df_eng[cols_30d].mean(axis=1)
        
        if 'M_Onb_3d_Integration' in df_eng.columns:
             df_eng['M_Onboarding_Final_Score'] = (5 * df_eng['M_Onb_3d_Integration'] + 25 * avg_15d + 70 * avg_30d) / 100
             
    return df_eng

def load_and_preprocess_one_year(df):
    """
    Orchestrates the full preprocessing flow for the One-Year Model.
    """
    # 1. Feature Engineering
    # Defensive cleaning: Remove list brackets if present (fix for generator artifacts)
    for col in df.columns:
        if df[col].dtype == 'object':
            # Check if any value is a stringified list like '[0.5]'
            if df[col].astype(str).str.contains(r'[\[\]]', regex=True).any():
                 # Aggressive cleaning: replace brackets and quotes globally
                 df[col] = df[col].astype(str).str.replace(r"[\[\]'\"]", "", regex=True)
                 # Force numeric
                 df[col] = pd.to_numeric(df[col], errors='coerce')

    df = feature_engineering(df)

    # 2. Drop Leakage/Target
    drop_cols = ['Turnover'] + [c for c in df.columns if c.startswith('E_')]
    X = df.drop(drop_cols, axis=1, errors='ignore')
    y = df['Turnover']
    
    # 3. Split (Stratified)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 4. Process
    preprocessor = TurnoverPreprocessor()
    preprocessor.fit(X_train)
    
    X_train_processed = preprocessor.transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    return X_train_processed, X_test_processed, y_train, y_test, preprocessor.get_feature_names(), preprocessor

def aggregate_data_for_5year(df):
    """
    Aggregates data for 5-Year model.
    """
    df = df.copy()
    
    group_cols = ['a6_education_level', 'a1_gender', 'B2_Public_service_status_ger']
    
    # Binning
    if 'a2_age' in df.columns:
        df['AgeGroup'] = pd.cut(df['a2_age'], bins=[0, 25, 35, 45, 55, 100], labels=['lt_25', '25_to_35', '35_to_45', '45_to_55', 'plus_55'])
    
    if 'B10_Tenure_in_month' in df.columns:
        df['TenureGroup'] = pd.cut(df['B10_Tenure_in_month'], bins=[0, 12, 36, 60, 120, 1000], labels=['lt_1yr', '1_to_3yr', '3_to_5yr', '5_to_10yr', 'plus_10yr'])

    group_cols.extend(['AgeGroup', 'TenureGroup'])
    
    df = feature_engineering(df)
    if 'M_Onboarding_Final_Score' not in df.columns:
        df['M_Onboarding_Final_Score'] = 0

    required_aggs = {
        'Turnover': ['sum', 'count'],
        'B11_salary_today_brl': 'mean',
        'c1_overall_employee_satisfaction': 'mean',
        'B5_Degree_of_employment': 'mean',
        'M_Onboarding_Final_Score': 'mean',
        'M_eNPS': 'mean',
        'b1_PDI_rate': 'mean'
    }
    
    stats = df.groupby(group_cols, observed=False).agg(
        TurnoverCount=('Turnover', 'sum'),
        TotalEmployees=('Turnover', 'count'),
        B11_salary_today_brl=('B11_salary_today_brl', 'mean'),
        c1_overall_employee_satisfaction=('c1_overall_employee_satisfaction', 'mean'),
        B5_Degree_of_employment=('B5_Degree_of_employment', 'mean'),
        M_Onboarding_Final_Score=('M_Onboarding_Final_Score', 'mean'),
        M_eNPS=('M_eNPS', 'mean'),
        b1_PDI_rate=('b1_PDI_rate', 'mean')
    ).reset_index()
    
    stats = stats[stats['TotalEmployees'] > 0]
    
    return stats
