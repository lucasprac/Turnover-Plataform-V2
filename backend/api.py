from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add root directory to sys.path so we can import backend packages
# api.py is in backend/
current_dir = os.path.dirname(os.path.abspath(__file__))
# root_dir is the parent of backend/
root_dir = os.path.dirname(current_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

from backend.app.routers import employees, predictions, motivation, performance

app = FastAPI(title="Turnover Prediction API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(employees.router, tags=["Employees"])
app.include_router(predictions.router, tags=["Predictions"])
app.include_router(motivation.router, tags=["Motivation"])
app.include_router(performance.router, tags=["Performance"])

@app.get("/")
def read_root():
    return {"message": "Turnover Prediction API is running."}

