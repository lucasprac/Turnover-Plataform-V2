# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-08

### Added
- **Supabase Authentication**: JWT-based authentication for all API endpoints
- **Environment Configuration**: Environment-based configuration with `.env` files
- **CORS Security**: Restricted CORS to configured origins only
- **Health Endpoints**: `/health` and `/api/info` endpoints for monitoring
- **Protected Routes**: All dashboard routes require authentication
- **Login UI**: Supabase Auth UI integration for user authentication

### Security
- CORS no longer allows wildcard (`*`) origins
- All prediction and training endpoints require JWT authentication
- Environment variables for sensitive configuration

### Changed
- `settings.py` now uses environment variables via python-dotenv
- `api.py` includes OpenAPI documentation and health checks

### Technical
- Added `requirements.txt` for Python dependencies
- Added `.env.example` templates for backend and frontend
- Created `/backend/app/auth/` module for authentication
- Integrated React AuthProvider and ProtectedRoute components

## [0.1.0] - Pre-release

### Added
- Initial XGBoost turnover prediction models (1-year, 5-year)
- Bayesian prediction system with NumPyro
- SHAP-based explainability
- React dashboard with Radix UI components
- Motivation analysis with Frank-Wolfe algorithm
