from fastapi import APIRouter, HTTPException
import threading
from pydantic import BaseModel
from backend.app.services.prediction_service import (
    load_data, enrich_features, predict_individual, 
    predict_aggregate, get_dashboard_metrics
)
from backend.ml import one_year_model, five_year_model, data_generator
import pandas as pd
import numpy as np

router = APIRouter()

# --- Data Models ---
class TrainResponse(BaseModel):
    message: str
    status: str

class IndividualInput(BaseModel):
    employee_id: str

class IndividualPrediction(BaseModel):
    turnover_probability: float
    shap_values: list
    contributions: list = [] # Shapash nomenclature
    grouped_contributions: list = []
    risk_level: str

class AggregateFilters(BaseModel):
    education_level: str | None = None
    gender: str | None = None
    age_group: str | None = None # lt_25, 25_to_35...
    tenure_group: str | None = None # lt_1yr, 1_to_3yr...

class AggregatePrediction(BaseModel):
    predicted_turnover_count: float
    total_in_cohort: int
    cohort_risk_rate: float
    shap_values: list = []
    contributions: list = []
    grouped_contributions: list = []


from backend.app.services.training_manager import training_manager

class TrainStatusResponse(BaseModel):
    is_training: bool
    progress: int
    message: str
    status: str

@router.get("/train/status", response_model=TrainStatusResponse)
def get_training_status():
    return {
        "is_training": training_manager.is_training,
        "progress": training_manager.progress,
        "message": training_manager.message,
        "status": training_manager.status
    }

@router.post("/train", response_model=TrainResponse)
def trigger_training():
    """
    Triggers the training process for both models.
    """
    if training_manager.is_training:
         raise HTTPException(status_code=400, detail="Training already in progress.")

    def train_job():
        try:
            training_manager.start_training()
            
            training_manager.update_progress(5, "Generating synthetic data...")
            # data_generator.generate_synthetic_data writes to CSV.
            # We need to make sure it writes to the correct place or update it.
            # Assuming it writes to CWD which is root.
            df = data_generator.generate_synthetic_data(n_employees=1500)
            df.to_csv("synthetic_turnover_data.csv", index=False)
            
            # Train models
            training_manager.update_progress(20, "Training one year model...")
            
            def one_year_callback(p, msg):
                # Scale 20-60%
                scaled = 20 + int(p * 0.4)
                training_manager.update_progress(scaled, f"One Year: {msg}")
                
            one_year_model.train_one_year_model(save_model=True, progress_callback=one_year_callback)
            
            training_manager.update_progress(60, "Training five year model...")
            
            def five_year_callback(p, msg):
                # Scale 60-100%
                scaled = 60 + int(p * 0.4)
                training_manager.update_progress(scaled, f"Five Year: {msg}")

            five_year_model.train_five_year_model(save_model=True, progress_callback=five_year_callback)
            
            training_manager.complete_training()
        except Exception as e:
            training_manager.fail_training(str(e))

    # Run in a separate thread
    threading.Thread(target=train_job).start()
    return {"message": "Training started in background.", "status": "success"}

@router.post("/predict/individual", response_model=IndividualPrediction)
def predict_individual_endpoint(input_data: IndividualInput):
    try:
        df = load_data()
        if df is None:
            raise HTTPException(status_code=400, detail="Data not available")
            
        # Find employee
        employee_row = df[df['id'] == input_data.employee_id]
        if employee_row.empty:
            raise HTTPException(status_code=404, detail="Employee not found")

        data_dict = employee_row.iloc[0].to_dict()
        data_dict = enrich_features(data_dict)
        data_dict = {k: (v if pd.notna(v) else 0) for k, v in data_dict.items()} # sanitize
        
        result = predict_individual(data_dict)
        
        # Transform SHAP dict to list
        shap_list = [{"feature": k, "value": v, "base_value": 0.0} for k, v in result['shap_values'].items()]
        shap_list.sort(key=lambda x: abs(x['value']), reverse=True)
        
        return {
            "turnover_probability": result['turnover_probability'],
            "shap_values": shap_list[:10], # Top 10 legacy
            "contributions": shap_list[:10], # New standard
            "grouped_contributions": result.get('grouped_shap', []),
            "risk_level": "High" if result['turnover_probability'] > 0.5 else "Low"
        }

    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Model not trained. Please call /train first.")
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/aggregate", response_model=AggregatePrediction)
def predict_aggregate_endpoint(filters: AggregateFilters):
    try:
        df = load_data()
        if df is None:
             raise HTTPException(status_code=400, detail="Data not available")
             
        # Apply Filters
        filtered_df = df.copy()
        
        if filters.education_level and filters.education_level != "All":
            filtered_df = filtered_df[filtered_df['a6_education_level'] == filters.education_level]
        if filters.gender and filters.gender != "All":
            filtered_df = filtered_df[filtered_df['a1_gender'] == filters.gender]
            
        # Helper for Age Group
        if filters.age_group:
            if filters.age_group == 'lt_25':
                filtered_df = filtered_df[filtered_df['a2_age'] < 25]
            elif filters.age_group == '25_to_35':
                 filtered_df = filtered_df[(filtered_df['a2_age'] >= 25) & (filtered_df['a2_age'] < 35)]
            elif filters.age_group == '35_to_45':
                 filtered_df = filtered_df[(filtered_df['a2_age'] >= 35) & (filtered_df['a2_age'] < 45)]
            elif filters.age_group == '45_to_55':
                 filtered_df = filtered_df[(filtered_df['a2_age'] >= 45) & (filtered_df['a2_age'] < 55)]
            elif filters.age_group == 'plus_55':
                 filtered_df = filtered_df[filtered_df['a2_age'] >= 55]

        # Helper for Tenure Group
        if filters.tenure_group:
             if filters.tenure_group == 'lt_1yr':
                 filtered_df = filtered_df[filtered_df['B10_Tenure_in_month'] < 12]
             elif filters.tenure_group == '1_to_3yr':
                 filtered_df = filtered_df[(filtered_df['B10_Tenure_in_month'] >= 12) & (filtered_df['B10_Tenure_in_month'] < 36)]
             elif filters.tenure_group == '3_to_5yr':
                 filtered_df = filtered_df[(filtered_df['B10_Tenure_in_month'] >= 36) & (filtered_df['B10_Tenure_in_month'] < 60)]
             elif filters.tenure_group == '5_to_10yr':
                 filtered_df = filtered_df[(filtered_df['B10_Tenure_in_month'] >= 60) & (filtered_df['B10_Tenure_in_month'] < 120)]
             elif filters.tenure_group == 'plus_10yr':
                 filtered_df = filtered_df[filtered_df['B10_Tenure_in_month'] >= 120]

        if filtered_df.empty:
             return {
                 "predicted_turnover_count": 0.0,
                 "total_in_cohort": 0,
                 "cohort_risk_rate": 0.0
             }

        agg_data = {
            "TotalEmployees": len(filtered_df),
            "B11_salary_today_brl": filtered_df['B11_salary_today_brl'].mean(),
            "c1_overall_employee_satisfaction": filtered_df['c1_overall_employee_satisfaction'].mean(),
            "B5_Degree_of_employment": filtered_df['B5_Degree_of_employment'].mean(),
            "M_eNPS": filtered_df['M_eNPS'].mean(),
            
            "a6_education_level": filters.education_level if filters.education_level and filters.education_level != "All" else filtered_df['a6_education_level'].mode()[0],
            "a1_gender": filters.gender if filters.gender and filters.gender != "All" else filtered_df['a1_gender'].mode()[0],
            "B2_Public_service_status_ger": filtered_df['B2_Public_service_status_ger'].mode()[0] if 'B2_Public_service_status_ger' in filtered_df else 'No', 
            
            "AgeGroup": filters.age_group if filters.age_group else "25_to_35", 
            "TenureGroup": filters.tenure_group if filters.tenure_group else "1_to_3yr",
            "b1_PDI_rate": filtered_df['b1_PDI_rate'].mean() if 'b1_PDI_rate' in filtered_df.columns else 0.0
        }
        
        # Vectorized calculation for M_Onboarding_Final_Score
        # Formula: (5 * 3d + 25 * Avg(15d) + 70 * Avg(30d)) / 100

        cols_15d = [
            'M_Onb_15d_Credibility', 'M_Onb_15d_Respect', 'M_Onb_15d_Impartiality',
            'M_Onb_15d_Pride', 'M_Onb_15d_Camaraderie'
        ]
        cols_30d = [
            'M_Onb_30d_Credibility', 'M_Onb_30d_Respect', 'M_Onb_30d_Impartiality',
            'M_Onb_30d_Pride', 'M_Onb_30d_Camaraderie'
        ]

        # Use fillna(0) to handle missing values safely as in original logic (d.get(c, 0))
        onb_3d = filtered_df.get('M_Onb_3d_Integration', pd.Series(0, index=filtered_df.index)).fillna(0)

        # Check if columns exist, if not create dummy 0 columns to match d.get(c, 0) behavior
        # However, for performance, we should only select existing columns or fill 0 if all missing.
        # But to match exact logic of "get(c, 0)", we need to ensure we don't error on missing cols.

        # Helper to get values or 0
        def get_vals_or_zero(df, cols):
            valid_cols = [c for c in cols if c in df.columns]
            if not valid_cols:
                return pd.Series(0, index=df.index)
            # If some cols are missing, they should be treated as 0 in the sum?
            # The original logic was: vals_15d = [data.get(c, 0) for c in cols_15d]
            # avg_15d = sum(vals_15d) / len(vals_15d)
            # So missing column = 0 value in the average calculation.
            
            # We can create a subset dataframe with all columns, filling missing ones with 0
            subset = df[valid_cols].fillna(0)
            if len(valid_cols) < len(cols):
                for c in set(cols) - set(valid_cols):
                    subset[c] = 0
            return subset[cols].mean(axis=1)

        avg_15d = get_vals_or_zero(filtered_df, cols_15d)
        avg_30d = get_vals_or_zero(filtered_df, cols_30d)

        onboarding_scores = (5 * onb_3d + 25 * avg_15d + 70 * avg_30d) / 100
        agg_data['M_Onboarding_Final_Score'] = onboarding_scores.mean() if not onboarding_scores.empty else 0
        
        result = predict_aggregate(agg_data)
        count = result.get('prediction', 0.0)
        shap_dict = result.get('shap_values', {})
        
        # Format SHAP for frontend (list of {name, value})
        shap_list = [{"feature": k, "value": v, "base_value": 0.0} for k, v in shap_dict.items()]
        shap_list.sort(key=lambda x: abs(x['value']), reverse=True)
        # Take top 5 for aggregate view? or all? Let's send top 10
        shap_list = shap_list[:10]
        
        return {
            "predicted_turnover_count": count,
            "total_in_cohort": len(filtered_df),
            "cohort_risk_rate": (count / len(filtered_df)) * 100 if len(filtered_df) > 0 else 0,
            "shap_values": shap_list,
            "contributions": shap_list
        }

    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Model not trained. Please call /train first.")
    except Exception as e:
        print(f"Agg Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-data")
def get_dashboard_data_endpoint():
    """
    Returns summary data for the main dashboard using REAL data and models.
    """
    try:
        df = load_data()
        if df is None:
             return {
                "metrics": {"total_employees": 0, "turnover_rate": 0, "turnover_risk_high": 0, "avg_satisfaction": 0},
                "shap_values": [],
                "predictions": [],
                "feature_importance": [],
                "turnover_analysis": []
            }
        
        # Metrics from Data directly
        total_employees = len(df)
        avg_satisfaction = float(df['c1_overall_employee_satisfaction'].mean()) if 'c1_overall_employee_satisfaction' in df.columns else 0.0

        metrics_result = get_dashboard_metrics(df)
        
        # Manual Turnover Analysis Mock
        turnover_analysis = [
            {"month": "Jan", "predicted_turnover": 12, "historical_turnover": 10, "confidence_lower": 11, "confidence_upper": 13},
            {"month": "Feb", "predicted_turnover": 11, "historical_turnover": 11, "confidence_lower": 10, "confidence_upper": 12},
            {"month": "Mar", "predicted_turnover": 13, "historical_turnover": 12, "confidence_lower": 11, "confidence_upper": 15},
            {"month": "Apr", "predicted_turnover": 14, "historical_turnover": 11, "confidence_lower": 12, "confidence_upper": 16},
            {"month": "May", "predicted_turnover": 12, "historical_turnover": 13, "confidence_lower": 10, "confidence_upper": 14},
        ]

        if metrics_result:
            return {
                "metrics": {
                    "total_employees": total_employees,
                    "turnover_rate": metrics_result['turnover_rate'],
                    "turnover_risk_high": metrics_result['turnover_risk_high'],
                    "avg_satisfaction": round(avg_satisfaction, 1)
                },
                "shap_values": metrics_result['shap_values'],
                "grouped_shap": metrics_result.get('grouped_shap', []),
                "predictions": metrics_result['predictions'],
                "feature_importance": metrics_result['feature_importance'],
                "turnover_analysis": turnover_analysis
            }
        else:
            return {
                 "metrics": {
                    "total_employees": total_employees,
                    "turnover_rate": 0,
                    "turnover_risk_high": 0,
                    "avg_satisfaction": round(avg_satisfaction, 1)
                },
                "shap_values": [],
                "predictions": [],
                "feature_importance": [],
                "turnover_analysis": turnover_analysis
            }

    except Exception as e:
        print(f"Error serving dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
