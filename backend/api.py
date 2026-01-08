"""
Turnover Prediction API

FastAPI application serving both the API and React frontend.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
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
# Static Files - Serve React Frontend (Production Only)
# =============================================================================
STATIC_DIR = Path(root_dir) / "static"

# Mount static assets if the build directory exists (production)
if STATIC_DIR.exists():
    # Mount the assets directory for JS/CSS bundles
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# =============================================================================
# Health & Status Endpoints
# =============================================================================
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
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health"
        }
    }


# =============================================================================
# Root Endpoint - Serve Frontend or API Status
# =============================================================================
@app.get("/")
def read_root():
    """Serve React frontend if available, otherwise return API status."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Turnover Prediction API is running."}


# =============================================================================
# SPA Catch-All Route - Must be last!
# =============================================================================
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """
    Catch-all route for SPA client-side routing.
    Serves index.html for all non-API routes when frontend is built.
    """
    # Skip API routes and static files
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "health", "assets/")):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    
    # Serve index.html for SPA routes
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    
    return JSONResponse({"detail": "Not Found"}, status_code=404)
