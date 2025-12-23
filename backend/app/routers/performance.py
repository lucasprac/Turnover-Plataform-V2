from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Optional
import json
import os
from backend.app.services.performance_service import evaluator

CONFIG_FILE = "backend/data/performance_config.json"

router = APIRouter(prefix="/performance", tags=["Performance"])

@router.get("/evaluate")
def evaluate_performance(
    org_obj: float = Query(0.8, ge=0.0, le=1.0, description="Organizational Objective"),
    personal_obj: float = Query(1.0, ge=0.0, le=1.0, description="Personal Objective"),
    mgmt_obj: float = Query(0.8, ge=0.0, le=1.0, description="Management Objective"),
    inputs: Optional[List[str]] = Query(None, description="Input columns"),
    outputs: Optional[List[str]] = Query(None, description="Output columns")
):
    """
    Returns performance evaluation metrics for all employees.
    Supports both traditional and customized paths.
    """
    try:
        results = evaluator.evaluate_performance(
            input_cols=inputs,
            output_cols=outputs,
            organizational_objective=org_obj, 
            personal_objective=personal_obj,
            management_objective=mgmt_obj
        )
        return results
    except Exception as e:
        print(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/columns")
def get_available_columns():
    """
    Returns a list of numeric columns available for DEA evaluation.
    """
    try:
        return evaluator.get_available_columns()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/configs")
def get_saved_configs():
    """
    Returns saved performance customizations.
    """
    if not os.path.exists(CONFIG_FILE):
        return []
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

@router.post("/configs")
def save_config(config: Dict = Body(...)):
    """
    Saves a new performance customization.
    """
    configs = get_saved_configs()
    configs.append(config)
    
    # Keep only last 10 configs for simplicity
    configs = configs[-10:]
    
    try:
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, "w") as f:
            json.dump(configs, f, indent=4)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
def get_performance_summary():
    """
    Returns aggregate summary for the dashboard.
    """
    try:
        results = evaluator.evaluate_performance()
        if not results:
            return {}
            
        # Example Summary Metrics
        avg_ccr = sum(r['ccr_efficiency'] for r in results) / len(results)
        avg_cross = sum(r['cross_efficiency'] for r in results) / len(results)
        
        # Top 5 Performers based on Composite Score
        sorted_results = sorted(results, key=lambda x: x['composite_score'], reverse=True)
        top_5 = sorted_results[:5]
        
        return {
            "average_ccr_efficiency": round(avg_ccr, 4),
            "average_cross_efficiency": round(avg_cross, 4),
            "top_performers": top_5,
            "total_evaluated": len(results)
        }
    except Exception as e:
        print(f"Performance Summary Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/status")
def get_performance_status():
    """
    Returns the current progress of the performance evaluation.
    """
    return {
        "progress": round(evaluator.progress * 100, 2),
        "is_running": evaluator.is_running
    }
