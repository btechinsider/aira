#!/bin/bash
# Render Build Script for AIRA Backend
# This script is executed during the build phase on Render

set -e  # Exit on error

echo "🚀 Starting AIRA Backend Build..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build completed successfully!"

# Made with Bob
