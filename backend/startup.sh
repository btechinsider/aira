#!/bin/bash
# Startup script for AIRA backend with database verification

echo "🚀 Starting AIRA Backend..."
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo "Please set DATABASE_URL in Render dashboard to your Supabase connection string"
    echo "Example: postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:5432/postgres"
    exit 1
fi

# Mask password in logs
MASKED_URL=$(echo "$DATABASE_URL" | sed -E 's/(:[^:@]+@)/:*****@/')
echo "✅ DATABASE_URL is set: $MASKED_URL"

# Check database type
if [[ "$DATABASE_URL" == *"postgresql"* ]] || [[ "$DATABASE_URL" == *"postgres"* ]]; then
    echo "✅ Using PostgreSQL database"
elif [[ "$DATABASE_URL" == *"sqlite"* ]]; then
    echo "⚠️  WARNING: Using SQLite - this will fail on Render!"
    echo "Please set DATABASE_URL to a PostgreSQL connection string"
    exit 1
else
    echo "❌ ERROR: Unknown database type in DATABASE_URL"
    exit 1
fi

# Check other required environment variables
echo ""
echo "Checking required environment variables..."
[ -z "$GROQ_API_KEY" ] && echo "⚠️  WARNING: GROQ_API_KEY not set" || echo "✅ GROQ_API_KEY is set"
[ -z "$GITHUB_TOKEN" ] && echo "⚠️  WARNING: GITHUB_TOKEN not set" || echo "✅ GITHUB_TOKEN is set"
[ -z "$GITHUB_REPO" ] && echo "⚠️  WARNING: GITHUB_REPO not set" || echo "✅ GITHUB_REPO is set"
[ -z "$REDIS_URL" ] && echo "⚠️  INFO: REDIS_URL not set (caching disabled)" || echo "✅ REDIS_URL is set"

echo ""
echo "================================"
echo "Starting AIRA server on port ${PORT:-8000}..."
echo ""

# Start the application with Python wrapper for better error handling
exec python run.py

# Made with Bob
