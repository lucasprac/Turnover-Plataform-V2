# Use an official Python runtime as a parent image
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

# Create directories for volumes
RUN mkdir -p .data artifacts

# Copy model files and data that are needed for startup
# Note: These should be in the context. If they are in .data/ which is ignored,
# they won't be copied. Host files at root will be copied.
COPY one_year_model.xgb .
COPY synthetic_turnover_data.csv .

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "8000"]
