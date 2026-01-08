# Turnover Analytics Platform

[![CI](https://github.com/YOUR_USERNAME/turnover-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/turnover-analytics/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive dashboard for predicting and analyzing employee turnover using dual XGBoost/Bayesian models with SHAP-based explainability.

## Features

- **Dual Prediction Systems**: XGBoost (fast) and Bayesian (uncertainty-aware)
- **Explainable AI**: SHAP values for individual and aggregate predictions
- **Modern Stack**: FastAPI + React + Vite + Radix UI
- **Mock Authentication**: Ready for integration or local testing

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Clone and Setup

```bash
git clone https://github.com/YOUR_USERNAME/turnover-analytics.git
cd turnover-analytics
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
copy .env.example .env.local
```

### 4. Run

```bash
# Terminal 1: Backend
python -m uvicorn backend.api:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to access the platform.

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Project Structure

```
├── backend/
│   ├── api.py              # FastAPI application
│   ├── app/
│   │   ├── auth/           # Mock authentication layer
│   │   ├── routers/        # API endpoints
│   │   └── services/       # Business logic
│   └── ml/                 # ML models (XGBoost, Bayesian)
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       └── lib/            # Utilities
├── requirements.txt        # Python dependencies
└── package.json           # Node.js dependencies
```

## Testing

```bash
# Backend tests
pytest backend/tests/ -v --cov=backend

# Frontend build check
cd frontend
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) for details.
