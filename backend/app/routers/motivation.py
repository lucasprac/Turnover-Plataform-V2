from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
from ..services.motivation_analysis import analyzer

router = APIRouter(
    prefix="/motivation",
    tags=["motivation"],
    responses={404: {"description": "Not found"}},
)

class AnswersInput(BaseModel):
    # Questions 1-19
    answers: Dict[int, int]

class AnalysisInput(BaseModel):
    onboarding_answers: AnswersInput
    climate_answers: AnswersInput

@router.on_event("startup")
async def startup_event():
    # Load data and train model on startup
    # In production this might be loaded from a saved artifact
    print("Loading Motivation Analysis Model...")
    df = analyzer.load_and_preprocess_data()
    analyzer.train_model(df)

@router.post("/analyze")
async def analyze_motivation(data: AnalysisInput):
    """
    Analyzes motivation delta between Onboarding and Climate surveys.
    Predicts Turnover Risk based on Climate data using Frank-Wolfe Multiclass Model.
    """
    try:
        result = analyzer.analyze_onboarding_vs_climate(
            data.onboarding_answers.answers,
            data.climate_answers.answers
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dimensions")
async def get_dimensions():
    return [d.value for d in analyzer.dimensions]

@router.get("/data")
async def get_motivation_data():
    """
    Returns all motivation data records.
    """
    return analyzer.get_all_data()
