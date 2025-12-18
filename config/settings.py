
import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / ".data"
MODELS_DIR = BASE_DIR / ".data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"  # For plots/reports

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)

# File Paths
SYNTHETIC_DATA_PATH = DATA_DIR / "synthetic_turnover_data.csv"
MARKET_DATA_PATH = DATA_DIR / "synthetic_market_data.csv"

# Model Paths
ONE_YEAR_MODEL_PATH = MODELS_DIR / "one_year_model.xgb"
FIVE_YEAR_MODEL_PATH = MODELS_DIR / "five_year_model.xgb"

# Model Hyperparameters (Defaults)
XGB_PARAMS_COMMON = {
    'use_label_encoder': False,
    'random_state': 42,
    'n_jobs': 1
}
