"""
Application Settings - Environment-based Configuration

Load configuration from environment variables with sensible defaults.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# =============================================================================
# Base Paths
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / ".data")))
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(BASE_DIR / ".data")))
ARTIFACTS_DIR = BASE_DIR / "artifacts"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)

# =============================================================================
# API Configuration
# =============================================================================
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# CORS - Comma-separated origins
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in _origins.split(",")]



# =============================================================================
# File Paths
# =============================================================================
SYNTHETIC_DATA_PATH = DATA_DIR / "synthetic_turnover_data.csv"
MARKET_DATA_PATH = DATA_DIR / "synthetic_market_data.csv"

# Model Paths
ONE_YEAR_MODEL_PATH = MODELS_DIR / "one_year_model.xgb"
FIVE_YEAR_MODEL_PATH = MODELS_DIR / "five_year_model.xgb"

# =============================================================================
# Model Hyperparameters
# =============================================================================
XGB_PARAMS_COMMON = {
    'use_label_encoder': False,
    'random_state': int(os.getenv("XGB_RANDOM_STATE", "42")),
    'n_jobs': int(os.getenv("XGB_N_JOBS", "1"))
}
