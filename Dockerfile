# Production Dockerfile for AIRA Backend
# Optimized for Render deployment with pre-built wheels

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Upgrade pip and install dependencies with pre-built wheels
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --only-binary=:all: -r requirements.txt || \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Create data directory
RUN mkdir -p /app/data && chmod 777 /app/data

# Expose port (Render will set $PORT)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Copy startup scripts
COPY backend/startup.sh /app/startup.sh
COPY backend/run.py /app/run.py
RUN chmod +x /app/startup.sh /app/run.py

# Run application using startup script
CMD ["/app/startup.sh"]

# Made with Bob
