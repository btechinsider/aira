#!/bin/bash
# Render Start Script for AIRA Backend
# This script is executed when the service starts on Render

set -e  # Exit on error

echo "🚀 Starting AIRA Backend Service..."

# Change to backend directory
cd backend

# Initialize database if needed
echo "🗄️ Initializing database..."
python -c "from models import init_db; init_db()" || echo "⚠️ Database initialization skipped (may already exist)"

# Start the FastAPI application
echo "✅ Starting Uvicorn server..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT

# Made with Bob
