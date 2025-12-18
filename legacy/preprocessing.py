import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

def preprocess_data(df):
    """
    Preprocesses data with Lifecycle variables.
    Calculates Onboarding Weighted Score.
    Excludes End variables (Leakage).
    """
    
    # 1. Feature Engineering (Onboarding Weighted Score)
    # Weights: 5 (3d), 25 (15d), 70 (30d)
    # 15d and 30d are averages of their dimensions
    
    # Calculate Avg for 15d and 30d
    cols_15d = [c for c in df.columns if 'M_Onb_15d' in c]
    cols_30d = [c for c in df.columns if 'M_Onb_30d' in c]
    
    avg_15d = df[cols_15d].mean(axis=1)
    avg_30d = df[cols_30d].mean(axis=1)
    
    df['M_Onboarding_Final_Score'] = (5 * df['M_Onb_3d_Integration'] + 25 * avg_15d + 70 * avg_30d) / 100
    
    # 2. Define Feature Sets
    # Early (Demographic/Work/External)
    early_cat = ['a1_gender', 'a6_education_level', 'B2_Public_service_status_ger']
    early_num = [
        'a2_age', 'a3_number_of_children', 'a4_children_under_18_years', 'a5_age_youngest_children', 
        'B1_commute_distance_in_km', 'B3_early_retirement_rate', 'B4_sickness_days', 'B5_Degree_of_employment', 
        'B6_gross_working_days', 'B7_Vacation_days', 'B8_net_working_days', 'B9_salary_increase_last_year', 
        'B10_Tenure_in_month', 'B11_salary_today_brl', 'B12_salary_increase_last_5_years', 'B13_Parental_leave', 
        'D1_monthly_unemployment_rate_brazil', 'D2_monthly_number_of_vacancies', 'D3_monthly_short_time_workers'
    ]
    
    # Middle (Surveys)
    # We include the subdimensions of Climate, Onboarding components, eNPS, and Satisfaction
    # Exclude intermediate calc fields if we just want raw + final score? 
    # Let's include everything available at inference time.
    middle_num = [c for c in df.columns if c.startswith('M_') or c.startswith('Climate_')]
    middle_num.extend(['c1_overall_employee_satisfaction', 'c2_employee_satisfaction_moving_average'])
    # Ensure no duplication if M_ is used for calc
    middle_num = list(set(middle_num))
    
    # Full Feature Lists
    categorical_features = early_cat
    numerical_features = early_num + middle_num

    # Handle NaNs
    for col in numerical_features:
        if col in df.columns and df[col].isnull().any():
            df[col] = df[col].fillna(df[col].mean()) # Mean imputation for surveys is safer than -1

    # Drop Target and End Variables (Leakage)
    drop_cols = ['Turnover'] + [c for c in df.columns if c.startswith('E_')]
    X = df.drop(drop_cols, axis=1, errors='ignore')
    y = df['Turnover']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ])
        
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    cat_feature_names = preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_features)
    feature_names = numerical_features + list(cat_feature_names)
    
    return X_train_processed, X_test_processed, y_train, y_test, feature_names, preprocessor

def aggregate_data_for_5year(df):
    """
    Aggregates data for 5-Year model.
    """
    group_cols = ['a6_education_level', 'a1_gender', 'B2_Public_service_status_ger']
    df['AgeGroup'] = pd.cut(df['a2_age'], bins=[0, 25, 35, 45, 55, 100], labels=['lt_25', '25_to_35', '35_to_45', '45_to_55', 'plus_55'])
    df['TenureGroup'] = pd.cut(df['B10_Tenure_in_month'], bins=[0, 12, 36, 60, 120, 1000], labels=['lt_1yr', '1_to_3yr', '3_to_5yr', '5_to_10yr', 'plus_10yr'])

    group_cols.extend(['AgeGroup', 'TenureGroup'])

    # Calc Onboarding Score first if not present
    cols_15d = [c for c in df.columns if 'M_Onb_15d' in c]
    cols_30d = [c for c in df.columns if 'M_Onb_30d' in c]
    if cols_15d and cols_30d:
         avg_15d = df[cols_15d].mean(axis=1)
         avg_30d = df[cols_30d].mean(axis=1)
         df['M_Onboarding_Final_Score'] = (5 * df['M_Onb_3d_Integration'] + 25 * avg_15d + 70 * avg_30d) / 100
    else:
         # Fallback if columns missing (should not happen in this dataset)
         df['M_Onboarding_Final_Score'] = 0

    # Named aggregation to avoid collision and rename in one step
    agg_df = df.groupby(group_cols, observed=False).agg(
        TurnoverCount=('Turnover', 'sum'),
        TotalEmployees=('Turnover', 'count'), # Count of employees in group
        B11_salary_today_brl=('B11_salary_today_brl', 'mean'),
        c1_overall_employee_satisfaction=('c1_overall_employee_satisfaction', 'mean'),
        B5_Degree_of_employment=('B5_Degree_of_employment', 'mean'),
        M_Onboarding_Final_Score=('M_Onboarding_Final_Score', 'mean'),
        M_eNPS=('M_eNPS', 'mean')
    ).reset_index()
    
    agg_df = agg_df[agg_df['TotalEmployees'] > 0]
    
    return agg_df

if __name__ == "__main__":
    df = pd.read_csv("synthetic_turnover_data.csv")
    X_train, X_test, y, y_t, feats, _ = preprocess_data(df)
    print("Preprocessed features:", len(feats))
