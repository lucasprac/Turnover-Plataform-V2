"""
Turnover Prediction API

FastAPI application that serves both the API and the React frontend.
"""
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sys

# Add root directory to sys.path so we can import backend packages
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

from config import settings
from backend.app.routers import employees, predictions, motivation, performance, auth
from backend.app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

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
# Auth router
app.include_router(auth.router, tags=["Authentication"])

# Feature routers with dual prefixes
for prefix in ["/api/demo", "/api/app"]:
    app.include_router(employees.router, prefix=prefix, tags=[f"Employees ({prefix})"])
    app.include_router(predictions.router, prefix=prefix, tags=[f"Predictions ({prefix})"])
    app.include_router(motivation.router, prefix=prefix, tags=[f"Motivation ({prefix})"])
    app.include_router(performance.router, prefix=prefix, tags=[f"Performance ({prefix})"])

# Legacy /api support
app.include_router(employees.router, prefix="/api", tags=["Legacy Employees"])
app.include_router(predictions.router, prefix="/api", tags=["Legacy Predictions"])
app.include_router(motivation.router, prefix="/api", tags=["Legacy Motivation"])
app.include_router(performance.router, prefix="/api", tags=["Legacy Performance"])

# =============================================================================
# Demo Routes - Duplicate routes for demo mode (use synthetic data)
# =============================================================================
# Note: Demo routes use the same handlers but can be extended to always use synthetic data
STATIC_DIR = Path(root_dir) / "static"

if STATIC_DIR.exists():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")


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
# SPA Fallback - Serve index.html for client-side routing
# =============================================================================
@app.get("/")
def serve_root():
    """Serve the React app root or API info."""
    if STATIC_DIR.exists():
        return FileResponse(STATIC_DIR / "index.html")
    return {"message": "Turnover Prediction API is running.", "docs": "/docs"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Catch-all route for SPA client-side routing.
    
    - If the requested file exists in static, serve it
    - Otherwise, serve index.html for React Router to handle
    """
    # Check if it's a static file request
    static_file = STATIC_DIR / full_path
    if STATIC_DIR.exists() and static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
    
    # For all other routes, serve index.html (SPA behavior)
    if STATIC_DIR.exists():
        return FileResponse(STATIC_DIR / "index.html")
    
    # In development mode without static files
    return {"error": "Not found", "path": full_path}
