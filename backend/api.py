"""
Turnover Prediction API

FastAPI application with Supabase authentication support.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add root directory to sys.path so we can import backend packages
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

from config import settings
from backend.app.routers import employees, predictions, motivation, performance

# =============================================================================
# Application Setup
# =============================================================================
app = FastAPI(
    title="Turnover Prediction API",
    description="API for employee turnover prediction using XGBoost and Bayesian models",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# =============================================================================
# CORS Middleware - Use configured origins (not wildcard)
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Include Routers
# =============================================================================
app.include_router(employees.router, tags=["Employees"])
app.include_router(predictions.router, tags=["Predictions"])
app.include_router(motivation.router, tags=["Motivation"])
app.include_router(performance.router, tags=["Performance"])

# =============================================================================
# Health & Status Endpoints
# =============================================================================
@app.get("/")
def read_root():
    """Root endpoint - API status check."""
    return {"message": "Turnover Prediction API is running."}


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "debug": settings.DEBUG
    }


@app.get("/api/info")
def api_info():
    """API information endpoint."""
    return {
        "name": "Turnover Prediction API",
        "version": "1.0.0",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health"
        }
    }
