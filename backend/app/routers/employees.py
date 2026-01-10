from fastapi import APIRouter, HTTPException, Query, Depends
from backend.app.services.prediction_service import load_data
from backend.app.auth.dependencies import UserInfo, get_mode_user
import numpy as np

router = APIRouter()

@router.get("/employees")
def get_employees(
    limit: int = 100, 
    search: str = "",
    current_user: UserInfo = Depends(get_mode_user)
):
    df = load_data()
    if df is None:
        return []
    
    # Search filter
    if search:
        df = df[df['id'].str.contains(search, case=False)]
    
    # Return lightweight list
    # Use B14_Cargo if available, else education as fallback
    cols = ['id', 'a6_education_level', 'B10_Tenure_in_month']
    if 'B14_Cargo' in df.columns:
        cols.append('B14_Cargo')
    
    records = df[cols].head(limit).to_dict(orient='records')
    # Map friendly names
    result = []
    for r in records:
        role = r.get('B14_Cargo') if r.get('B14_Cargo') else r['a6_education_level']
        result.append({
            "id": r['id'],
            "name": f"Employee {r['id']}", # Placeholder
            "role": role,
            "tenure_months": r['B10_Tenure_in_month']
        })
    return result

@router.get("/employees/{employee_id}")
def get_employee_detail(
    employee_id: str,
    current_user: UserInfo = Depends(get_mode_user)
):
    df = load_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Data not available")
    
    row = df[df['id'] == employee_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Replace NaNs with None/null for JSON
    record = row.iloc[0].replace({np.nan: None}).to_dict()
    return record
