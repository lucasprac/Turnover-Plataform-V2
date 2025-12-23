# Turnover Prediction Program v2

A comprehensive dashboard for predicting and analyzing employee turnover using advanced Machine Learning (XGBoost) and SHAP values for explainability. The application is split into a robust Python FastAPI backend and a modern React frontend.

## Features

- **Turnover Prediction**: Predicts employee turnover risk for 1-year and 5-year horizons.
- **Explainable AI**: Uses SHAP (SHapley Additive exPlanations) to provide individual and aggregate level explanations for predictions.
- **Motivation Analysis**: Multiclass classification of employee motivation based on Self-Determination Theory (SDT) using the Frank-Wolfe Consistent Multiclass Algorithm for G-Mean optimization.
- **Interactive Dashboard**:
    - **Global Analysis**: Aggregate views of turnover drivers.
    - **Individual Analysis**: Detailed drill-down into specific employee risk factors.
    - **Motivation**: Insights into employee motivation profiles.
- **Modern Tech Stack**: Built with FastAPI, React, Vite, Tailwind CSS, and Radix UI.

## Project Structure

- `backend/`: Python backend containing the FastAPI application, ML models, and services.
    - `app/`: Main application logic (routers, services, schemas).
    - `ml/`: Machine Learning artifacts (models, plots).
    - `api.py`: Backend entry point.
- `frontend/`: React application using Vite.
    - `src/`: Source code for components, pages, and hooks.
- `legacy/`: Archive of previous versions (not for active use).

## Prerequisites

- **Python**: v3.9 or higher
- **Node.js**: v18 or higher
- **npm**: v9 or higher

## Installation & Setup

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

(Optional) Create and activate a virtual environment:
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

Install the required Python dependencies:
> Note: If a `requirements.txt` is present, use `pip install -r requirements.txt`. Otherwise, install the core dependencies below:

```bash
pip install fastapi uvicorn pandas scikit-learn xgboost shap numpy
```

Start the Backend API:
```bash
# Run from the root directory or backend directory depending on python path configuration.
# Recommended from project root:
python -m uvicorn backend.api:app --reload
```
Alternatively, if `uvicorn` is not in your PATH:
```bash
python -m uvicorn backend.api:app --reload
```
The API will start at `http://127.0.0.1:8000`.

### 2. Frontend Setup
Rq
Open a new terminal and navigate to the root directory (where `package.json` is located):

```bash
# Install dependencies
npm install
```

Start the Frontend Development Server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## Usage

1. **Launch**: Ensure both Backend and Frontend servers are running.
2. **Access**: Open your browser to `http://localhost:5173`.
3. **Navigate**:
    - **Dashboard**: View high-level metrics and global SHAP summaries.
    - **Individual Analysis**: Search for an employee ID to see their specific turnover probability and feature contributions.
    - **Motivation**: Analyze motivation dimensions.

## Development Notes

- **Modifying Models**: Model training scripts and artifacts are located in `backend/`. Ensure any model updates are saved to the correct paths expected by `backend/app/services/prediction_service.py`.
- **Frontend Changes**: The frontend uses `src/config.ts` (or similar) to point to the backend API URL. Ensure this matches your local setup.

## License

[Add License Information Here]
