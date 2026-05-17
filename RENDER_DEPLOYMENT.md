# 🚀 AIRA Render Deployment Guide

This guide provides comprehensive instructions for deploying AIRA to Render.com with Supabase PostgreSQL.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Deploy](#quick-deploy)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

Before deploying to Render, ensure you have:

- A [Render account](https://render.com) (free tier available)
- A [Supabase account](https://supabase.com) (free tier available) - **Recommended for database**
- GitHub repository with AIRA code
- Required API keys:
  - Groq API key
  - GitHub Personal Access Token
  - Supabase Database URL (from your Supabase project)
  - Slack Webhook URL (optional)

## ⚡ Quick Deploy

### Option 1: Blueprint Deploy (Recommended)

#### Step 1: Setup Supabase Database

1. **Create a Supabase project**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Choose organization and set project name
   - Set a strong database password
   - Select region closest to your users
   - Wait for project to be created (~2 minutes)

2. **Get your database connection string**:
   - Go to Project Settings → Database
   - Find "Connection string" section
   - Copy the "Connection pooling" URI (recommended for serverless)
   - Format: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual database password

#### Step 2: Deploy to Render

1. **Fork/Clone the repository** to your GitHub account

2. **Connect your repository** in Render Dashboard:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing AIRA
   - Render will automatically detect `render.yaml`

3. **Configure environment variables**:
   - `GROQ_API_KEY`: Your Groq API key
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `GITHUB_REPO`: Format: `owner/repository`
   - `DATABASE_URL`: Your Supabase connection string (from Step 1)
   - `SLACK_WEBHOOK_URL`: (Optional) Your Slack webhook URL

4. **Deploy**: Click "Apply" and Render will:
   - Create Redis instance
   - Deploy backend service
   - Deploy frontend service
   - Deploy MCP servers
   - Configure networking between services

**Note**: The `render.yaml` is configured to use Supabase. If you prefer Render's managed PostgreSQL instead, see the comments in `render.yaml` for instructions.

### Option 2: Manual Service Creation

If you prefer manual setup or need customization, follow the [Manual Setup](#manual-setup) section.

## 🔧 Manual Setup

### Step 1: Setup Database

#### Option A: Using Supabase (Recommended)

1. **Create a Supabase project**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Set project name and strong database password
   - Select region closest to your users
   - Wait for project creation (~2 minutes)

2. **Get connection string**:
   - Go to Project Settings → Database
   - Copy "Connection pooling" URI (recommended for serverless)
   - Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - Replace `[PASSWORD]` with your database password

3. **Enable required extensions** (if needed):
   - Go to Database → Extensions
   - Enable any extensions your app needs

#### Option B: Using Render PostgreSQL

1. Go to Render Dashboard → "New" → "PostgreSQL"
2. Configure:
   - **Name**: `aira-db`
   - **Database**: `aira`
   - **User**: `aira`
   - **Region**: Choose closest to your users
   - **Plan**: Starter ($7/month) or Free
3. Click "Create Database"
4. **Save the Internal Database URL** (starts with `postgresql://`)

### Step 2: Create Redis Instance

1. Go to Render Dashboard → "New" → "Redis"
2. Configure:
   - **Name**: `aira-redis`
   - **Region**: Same as database
   - **Plan**: Starter ($10/month) or Free
   - **Maxmemory Policy**: `allkeys-lru`
3. Click "Create Redis"
4. **Save the Internal Redis URL** (starts with `redis://`)

### Step 3: Deploy Backend Service

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `aira-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Starter ($7/month) or Free
4. Add environment variables (see [Environment Variables](#environment-variables))
5. Click "Create Web Service"

### Step 4: Deploy Frontend Service

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `aira-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - **Plan**: Starter ($7/month) or Free
4. Add environment variables:
   - `VITE_BACKEND_URL`: Your backend service URL (e.g., `https://aira-backend.onrender.com`)
   - `VITE_WS_URL`: WebSocket URL (e.g., `wss://aira-backend.onrender.com/ws`)
5. Click "Create Web Service"

### Step 5: Deploy MCP Servers (Optional)

#### GitHub MCP Server

1. Go to Render Dashboard → "New" → "Web Service"
2. Configure:
   - **Name**: `aira-github-mcp`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./mcp-servers/github_mcp/Dockerfile`
   - **Docker Context**: `./mcp-servers/github_mcp`
3. Add environment variables:
   - `GITHUB_TOKEN`: Your GitHub token
   - `GITHUB_REPO`: Your repository

#### Incident Context MCP Server

1. Go to Render Dashboard → "New" → "Web Service"
2. Configure:
   - **Name**: `aira-incident-context-mcp`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./mcp-servers/incident_context_mcp/Dockerfile`
   - **Docker Context**: `./mcp-servers/incident_context_mcp`
3. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL internal URL

## 🔐 Environment Variables

### Backend Service (`aira-backend`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GROQ_API_KEY` | ✅ | Groq API key for LLM | `gsk_...` |
| `GITHUB_TOKEN` | ✅ | GitHub Personal Access Token | `ghp_...` |
| `GITHUB_REPO` | ✅ | Repository in format owner/repo | `username/aira` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | **From Supabase** or Render DB |
| `REDIS_URL` | ✅ | Redis connection string | From Render Redis |
| `SLACK_WEBHOOK_URL` | ❌ | Slack webhook for notifications | `https://hooks.slack.com/...` |
| `LOG_LEVEL` | ❌ | Logging level | `INFO` (default) |
| `GITHUB_MCP_URL` | ❌ | GitHub MCP service URL | `https://aira-github-mcp.onrender.com` |
| `INCIDENT_CONTEXT_MCP_URL` | ❌ | Incident MCP service URL | `https://aira-incident-context-mcp.onrender.com` |

### Frontend Service (`aira-frontend`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_BACKEND_URL` | ✅ | Backend API URL | `https://aira-backend.onrender.com` |
| `VITE_WS_URL` | ✅ | WebSocket URL | `wss://aira-backend.onrender.com/ws` |

### Setting Environment Variables

**In Render Dashboard:**
1. Go to your service
2. Click "Environment" tab
3. Add each variable with its value
4. Click "Save Changes"
5. Service will automatically redeploy

**Using Render CLI:**
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Set environment variable
render env set GROQ_API_KEY=your_key --service aira-backend
```

## 💾 Database Setup

### Automatic Migration

The backend service automatically runs database migrations on startup using SQLAlchemy.

### Manual Migration (if needed)

1. Open Render Shell for backend service:
   - Go to service → "Shell" tab
   - Or use: `render shell aira-backend`

2. Run migrations:
```bash
cd backend
python -c "from models import init_db; init_db()"
```

### Database Access

**Via Render Dashboard:**
- Go to your PostgreSQL service
- Click "Connect" → "External Connection"
- Use provided credentials with any PostgreSQL client

**Via psql:**
```bash
# Get connection string from Render dashboard
psql postgresql://user:password@host:port/database
```

## 📊 Monitoring

### Health Checks

Render automatically monitors your services using the health check endpoint:
- Backend: `https://aira-backend.onrender.com/health`
- Returns: `{"status": "healthy"}`

### Logs

**View logs in Dashboard:**
1. Go to your service
2. Click "Logs" tab
3. View real-time logs

**Using Render CLI:**
```bash
# Stream logs
render logs aira-backend --tail

# View recent logs
render logs aira-backend --num 100
```

### Metrics

Render provides built-in metrics:
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

Access via: Service → "Metrics" tab

### Alerts

Set up alerts in Render Dashboard:
1. Go to service → "Settings"
2. Scroll to "Alerts"
3. Configure:
   - Health check failures
   - High CPU/Memory usage
   - Deploy failures

## 🔄 Deployment

### Automatic Deploys

Render automatically deploys when you push to your configured branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deploy

**Via Dashboard:**
1. Go to service
2. Click "Manual Deploy" → "Deploy latest commit"

**Via CLI:**
```bash
render deploy aira-backend
```

### Rollback

**Via Dashboard:**
1. Go to service → "Events" tab
2. Find previous successful deploy
3. Click "Rollback to this version"

**Via CLI:**
```bash
render rollback aira-backend
```

## 🐛 Troubleshooting

### Service Won't Start

**Check logs:**
```bash
render logs aira-backend --tail
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Port binding issues (ensure using `$PORT`)

### Database Connection Errors

**Verify DATABASE_URL:**
1. Go to PostgreSQL service
2. Copy "Internal Database URL"
3. Update backend environment variable
4. Redeploy service

**Test connection:**
```bash
# In Render Shell
python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); print(engine.connect())"
```

### Redis Connection Errors

**Verify REDIS_URL:**
1. Go to Redis service
2. Copy "Internal Redis URL"
3. Update backend environment variable
4. Redeploy service

### Frontend Can't Connect to Backend

**Check CORS settings** in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aira-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Verify environment variables:**
- `VITE_BACKEND_URL` should be your backend URL
- `VITE_WS_URL` should be your WebSocket URL (wss://)

### Build Failures

**Backend build fails:**
- Check `requirements.txt` for incompatible versions
- Ensure Python version is 3.11+
- Check build logs for specific errors

**Frontend build fails:**
- Check `package.json` dependencies
- Ensure Node version is 18+
- Clear build cache: Settings → "Clear build cache & deploy"

### Performance Issues

**Slow response times:**
1. Check service plan (Free tier has limitations)
2. Upgrade to Starter plan for better performance
3. Enable Redis caching
4. Optimize database queries

**Memory issues:**
1. Monitor memory usage in Metrics
2. Upgrade service plan if needed
3. Check for memory leaks in logs

### Free Tier Limitations

Render Free tier services:
- Spin down after 15 minutes of inactivity
- Take ~30 seconds to spin up on first request
- Limited to 750 hours/month

**Solutions:**
- Upgrade to Starter plan ($7/month per service)
- Use external uptime monitoring to keep services active
- Accept cold start delays for free tier

## 💰 Cost Estimation

### Minimal Setup (Free Tier)
- Backend: Free
- Frontend: Free
- PostgreSQL: Free (limited)
- Redis: Free (limited)
- **Total: $0/month**

### Production Setup (Starter Tier)
- Backend: $7/month
- Frontend: $7/month
- PostgreSQL: $7/month
- Redis: $10/month
- MCP Servers: $7/month each (optional)
- **Total: $31-45/month**

### Enterprise Setup
- Backend: $25/month (Pro)
- Frontend: $25/month (Pro)
- PostgreSQL: $20/month (Standard)
- Redis: $25/month (Standard)
- **Total: $95+/month**

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Status](https://status.render.com)
- [Render Community](https://community.render.com)
- [Render CLI](https://render.com/docs/cli)

## 📞 Support

For deployment issues:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Render Support: [support@render.com](mailto:support@render.com)
- Open an issue on GitHub
- Contact: support@aira-project.com

---

**Happy Deploying on Render!** 🚀