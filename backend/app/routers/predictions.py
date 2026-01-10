from fastapi import APIRouter, HTTPException, Depends
import threading
from pydantic import BaseModel
from backend.app.services.prediction_service import (
    load_data, enrich_features, predict_individual, 
    predict_aggregate, get_dashboard_metrics
)
from backend.ml import one_year_model, five_year_model, data_generator
import pandas as pd
import numpy as np
from backend.app.auth.dependencies import UserInfo, get_mode_user

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

class MetricsResponse(BaseModel):
    one_year: dict | None
    five_year: dict | None

@router.get("/train/metrics", response_model=MetricsResponse)
def get_model_metrics():
    """
    Retrieve performance metrics for the trained XGBoost models.
    """
    metrics = {
        "one_year": None,
        "five_year": None
    }
    
    # Load One Year Metrics
    try:
        if one_year_model.load_one_year_model():
             artifact = one_year_model.load_one_year_model()
             if artifact and 'metrics' in artifact:
                 metrics['one_year'] = artifact['metrics']
    except Exception as e:
        print(f"Error loading one year metrics: {e}")

    # Load Five Year Metrics
    try:
        # Load directly as there isn't a helper like load_one_year_model exposed easily or consistent
        import os
        import joblib
        if os.path.exists(five_year_model.MODEL_PATH):
             artifact = joblib.load(five_year_model.MODEL_PATH)
             if artifact and 'metrics' in artifact:
                 metrics['five_year'] = artifact['metrics']
    except Exception as e:
        print(f"Error loading five year metrics: {e}")
        
    return metrics

@router.get("/train/status", response_model=TrainStatusResponse)
def get_training_status():
    return {
        "is_training": training_manager.is_training,
        "progress": training_manager.progress,
        "message": training_manager.message,
        "status": training_manager.status
    }

@router.post("/train", response_model=TrainResponse)
def trigger_training(current_user: UserInfo = Depends(get_mode_user)):
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
def predict_individual_endpoint(input_data: IndividualInput, current_user: UserInfo = Depends(get_mode_user)):
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
def predict_aggregate_endpoint(filters: AggregateFilters, current_user: UserInfo = Depends(get_mode_user)):
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
        
        onb_scores = []
        for _, row in filtered_df.iterrows():
            d = row.to_dict()
            d = enrich_features(d)
            onb_scores.append(d.get('M_Onboarding_Final_Score', 0))
            
        agg_data['M_Onboarding_Final_Score'] = sum(onb_scores) / len(onb_scores) if onb_scores else 0
        
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


# Demo and App mode aliases for dashboard-data
@router.get("/demo/dashboard-data")
def get_demo_dashboard_data():
    """Demo mode dashboard data - uses synthetic data."""
    return get_dashboard_data_endpoint()


@router.get("/app/dashboard-data")
def get_app_dashboard_data():
    """Production mode dashboard data - uses user's data (currently same as demo)."""
    return get_dashboard_data_endpoint()


# =============================================================================
# BAYESIAN PREDICTION SYSTEM (Independent from XGBoost)
# =============================================================================

# --- Bayesian Data Models ---

class CredibleIntervals(BaseModel):
    ci_50: list[float]
    ci_80: list[float]
    ci_95: list[float]

class BayesianUncertainty(BaseModel):
    mean: float
    std: float
    credible_intervals: CredibleIntervals
    samples: list[float] = []
    risk_band: str  # "High", "Medium", "Low", "Uncertain"

class BayesianIndividualPrediction(BaseModel):
    mean: float
    std: float
    credible_intervals: dict
    samples: list[float] = []
    risk_band: str
    computation_time: float | None = None
    method: str | None = None

class BayesianAggregatePrediction(BaseModel):
    predicted_turnover_count: float
    total_in_cohort: int
    cohort_risk_rate: float
    uncertainty: BayesianUncertainty
    computation_time: float | None = None
    method: str | None = None

class BayesianTrainRequest(BaseModel):
    pass  # No parameters needed - always uses NUTS


# --- Bayesian Training Manager ---

class BayesianTrainingManager:
    """Track Bayesian model training status."""
    def __init__(self):
        self.is_training = False
        self.progress = 0
        self.message = ""
        self.status = "idle"
    
    def start_training(self):
        self.is_training = True
        self.progress = 0
        self.message = "Starting Bayesian training..."
        self.status = "training"
    
    def update_progress(self, progress: int, message: str):
        self.progress = progress
        self.message = message
    
    def complete_training(self):
        self.is_training = False
        self.progress = 100
        self.message = "Bayesian training complete"
        self.status = "complete"
    
    def fail_training(self, error: str):
        self.is_training = False
        self.message = f"Training failed: {error}"
        self.status = "error"

bayesian_training_manager = BayesianTrainingManager()


# --- Bayesian Endpoints ---

@router.get("/train/bayesian/status")
def get_bayesian_training_status():
    """Get Bayesian model training status."""
    return {
        "is_training": bayesian_training_manager.is_training,
        "progress": bayesian_training_manager.progress,
        "message": bayesian_training_manager.message,
        "status": bayesian_training_manager.status
    }


@router.post("/train/bayesian", response_model=TrainResponse)
def trigger_bayesian_training(request: BayesianTrainRequest = BayesianTrainRequest(), current_user: UserInfo = Depends(get_mode_user)):
    """
    Train the Bayesian turnover model using NUTS (full MCMC).
    
    NUTS provides accurate posterior estimates for uncertainty quantification.
    Training takes approximately 5-15 minutes depending on hardware.
    """
    if bayesian_training_manager.is_training:
        raise HTTPException(status_code=400, detail="Bayesian training already in progress.")
    
    from backend.ml import bayesian_turnover_model
    
    def train_job():
        try:
            bayesian_training_manager.start_training()
            
            def progress_callback(p, msg):
                bayesian_training_manager.update_progress(p, msg)
            
            bayesian_turnover_model.train_bayesian_model(
                progress_callback=progress_callback
            )
            
            bayesian_training_manager.complete_training()
        except Exception as e:
            bayesian_training_manager.fail_training(str(e))
            print(f"Bayesian training error: {e}")
            import traceback
            traceback.print_exc()
    
    threading.Thread(target=train_job).start()
    return {
        "message": "Bayesian training started with NUTS inference",
        "status": "success"
    }


@router.post("/predict/individual/bayesian", response_model=BayesianIndividualPrediction)
def predict_individual_bayesian(input_data: IndividualInput, current_user: UserInfo = Depends(get_mode_user)):
    """
    Predict turnover probability for an individual using Bayesian model.
    
    Returns probability distribution with credible intervals and uncertainty.
    """
    try:
        from backend.ml import bayesian_turnover_model
        
        df = load_data()
        if df is None:
            raise HTTPException(status_code=400, detail="Data not available")
        
        # Find employee
        employee_row = df[df['id'] == input_data.employee_id]
        if employee_row.empty:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        data_dict = employee_row.iloc[0].to_dict()
        data_dict = enrich_features(data_dict)
        data_dict = {k: (v if pd.notna(v) else 0) for k, v in data_dict.items()}
        
        result = bayesian_turnover_model.predict_bayesian_individual(data_dict)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Prediction failed")
        
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Bayesian prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/aggregate/bayesian", response_model=BayesianAggregatePrediction)
def predict_aggregate_bayesian(filters: AggregateFilters, current_user: UserInfo = Depends(get_mode_user)):
    """
    Predict aggregate turnover for a cohort using Bayesian model.
    
    Returns probability distribution for total expected turnover.
    """
    try:
        from backend.ml import bayesian_turnover_model
        
        df = load_data()
        if df is None:
            raise HTTPException(status_code=400, detail="Data not available")
        
        # Apply Filters (same logic as XGBoost endpoint)
        filtered_df = df.copy()
        
        if filters.education_level and filters.education_level != "All":
            filtered_df = filtered_df[filtered_df['a6_education_level'] == filters.education_level]
        if filters.gender and filters.gender != "All":
            filtered_df = filtered_df[filtered_df['a1_gender'] == filters.gender]
        
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
                "cohort_risk_rate": 0.0,
                "uncertainty": {
                    "mean": 0.0,
                    "std": 0.0,
                    "credible_intervals": {"ci_50": [0, 0], "ci_80": [0, 0], "ci_95": [0, 0]},
                    "samples": [],
                    "risk_band": "Low"
                }
            }
        
        # Prepare cohort data
        cohort_data = []
        for _, row in filtered_df.iterrows():
            data_dict = row.to_dict()
            data_dict = enrich_features(data_dict)
            data_dict = {k: (v if pd.notna(v) else 0) for k, v in data_dict.items()}
            cohort_data.append(data_dict)
        
        result = bayesian_turnover_model.predict_bayesian_aggregate(cohort_data)
        
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Bayesian aggregate error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# BAYESIAN INTERPRETABILITY ENDPOINTS (Native Bayesian Analysis)
# =============================================================================

@router.get("/bayesian/parameter-beliefs")
def get_parameter_beliefs():
    """
    Get posterior distributions for all model parameters.
    
    Returns what the model believes about each coefficient's effect:
    - Mean, std, credible intervals
    - Effect direction (positive/negative/uncertain)
    - Sorted by absolute effect size
    """
    try:
        from backend.ml.bayesian_interpretability import get_bayesian_interpretability
        
        interpreter = get_bayesian_interpretability()
        return interpreter.get_parameter_beliefs()
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Parameter beliefs error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bayesian/posterior-predictive")
def generate_posterior_predictive(n_samples: int = 100):
    """
    Generate simulated data from the posterior predictive distribution.
    
    Shows what outcomes the model would predict, accounting for both
    parameter uncertainty AND data variability.
    """
    try:
        from backend.ml.bayesian_interpretability import get_bayesian_interpretability
        import os
        import joblib
        
        interpreter = get_bayesian_interpretability()
        
        # Load test data
        preprocessor_path = os.path.join(os.path.dirname(__file__), 
                                          "../../ml/bayesian_preprocessor.pkl")
        if not os.path.exists(preprocessor_path):
            raise FileNotFoundError("Model not trained. Please train Bayesian model first.")
        
        artifact = joblib.load(preprocessor_path)
        X_test = artifact.get("X_test")
        
        if X_test is None:
            raise HTTPException(status_code=400, 
                              detail="Test data not available. Please retrain model.")
        
        result = interpreter.generate_posterior_predictive(X_test, n_samples=n_samples)
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Posterior predictive error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bayesian/uncertainty-decomposition")
def compute_uncertainty_decomposition():
    """
    Decompose prediction uncertainty into epistemic and aleatoric components.
    
    - Epistemic: uncertainty about model parameters (reducible with more data)
    - Aleatoric: inherent randomness in outcomes (irreducible)
    """
    try:
        from backend.ml.bayesian_interpretability import get_bayesian_interpretability
        import os
        import joblib
        
        interpreter = get_bayesian_interpretability()
        
        # Load test data
        preprocessor_path = os.path.join(os.path.dirname(__file__), 
                                          "../../ml/bayesian_preprocessor.pkl")
        if not os.path.exists(preprocessor_path):
            raise FileNotFoundError("Model not trained. Please train Bayesian model first.")
        
        artifact = joblib.load(preprocessor_path)
        X_test = artifact.get("X_test")
        
        if X_test is None:
            raise HTTPException(status_code=400, 
                              detail="Test data not available. Please retrain model.")
        
        result = interpreter.compute_uncertainty_decomposition(X_test)
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Uncertainty decomposition error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bayesian/ppc")
def run_posterior_predictive_check(n_replications: int = 500):
    """
    Run Posterior Predictive Checking (PPC) for model validation.
    
    Compares observed data to data generated from the model to assess fit.
    Returns discrepancy measures and p-values.
    
    Reference: studies/ppc.md
    """
    try:
        from backend.ml.bayesian_interpretability import get_bayesian_interpretability
        import os
        import joblib
        
        interpreter = get_bayesian_interpretability()
        
        # Load test data
        preprocessor_path = os.path.join(os.path.dirname(__file__), 
                                          "../../ml/bayesian_preprocessor.pkl")
        if not os.path.exists(preprocessor_path):
            raise FileNotFoundError("Model not trained. Please train Bayesian model first.")
        
        artifact = joblib.load(preprocessor_path)
        X_test = artifact.get("X_test")
        y_test = artifact.get("y_test")
        
        if X_test is None or y_test is None:
            raise HTTPException(status_code=400, 
                              detail="Test data not available. Please retrain model.")
        
        result = interpreter.posterior_predictive_check(X_test, y_test, 
                                                        n_replications=n_replications)
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"PPC error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

