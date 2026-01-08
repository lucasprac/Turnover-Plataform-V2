# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY frontend/ ./frontend/
COPY vite.config.ts ./

# Install dependencies and build frontend
RUN npm install && npm run build

# =============================================================================
# Stage 2: Production with Python Backend
# =============================================================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy necessary application code
COPY backend/ ./backend/
COPY config/ ./config/
COPY synthetic_turnover_data.csv .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/build ./static

# Create directories for volumes
RUN mkdir -p .data artifacts

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "8000"]
