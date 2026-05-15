# AIRA Quick Start Guide

This guide will help you quickly test and validate your AIRA system in 5 minutes.

## Step 1: Verify All Services Are Running

```bash
cd aira
docker-compose -f docker/docker-compose.yml ps
```

**Expected:** All 5 containers should show "Up" and "healthy" status:
- ✅ aira-redis
- ✅ aira-github-mcp
- ✅ aira-incident-context-mcp
- ✅ aira-backend
- ✅ aira-frontend

---

## Step 2: Test Backend Health

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy", "timestamp": "..."}
```

---

## Step 3: Open the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

**Expected:** You should see the AIRA dashboard with:
- Header: "AIRA - Autonomous Incident Response Agent"
- Message: "No incidents yet"
- Clean, modern UI with Tailwind styling

---

## Step 4: Send Your First Test Incident

Open a new terminal and run:

```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "message": "NullPointerException in user authentication",
    "stack_trace": "at authenticateUser (auth.service.js:89)\nat handleLogin (auth.controller.js:45)",
    "severity": "P2",
    "timestamp": "2026-05-15T23:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "status": "received",
  "incident_id": "test-001",
  "message": "Incident queued for processing"
}
```

---

## Step 5: Watch the Magic Happen! ✨

### In Your Browser (Dashboard)

You should see the incident appear **immediately** with real-time updates:

1. **Status: "Triaging"** (2-5 seconds)
   - Groq LLM analyzes the error
   - Determines severity and creates summary

2. **Status: "Diagnosing"** (3-8 seconds)
   - Fetches code context from GitHub
   - Searches for similar past incidents
   - Identifies root cause

3. **Status: "Fixing"** (5-10 seconds)
   - Generates code patch
   - Creates unit test
   - Prepares PR description

4. **Status: "Calculating Confidence"** (2-3 seconds)
   - Composite score: LLM (40%) + Pattern Match (30%) + Historical (30%)

5. **Status: "Completed"** ✅
   - Shows confidence score (e.g., 87%)
   - Displays action taken:
     - **High confidence (>85%):** PR created automatically
     - **Low confidence (<85%):** Slack approval requested
     - **P0 severity:** Immediate Slack alert

### In Your Terminal (Backend Logs)

```bash
docker logs -f aira-backend
```

**Expected Log Output:**
```
INFO:main:Starting AIRA backend...
INFO:main:Received incident: test-001
INFO:agent:Starting agent workflow for incident test-001
INFO:groq_client:Calling Groq API with model: llama-3.3-70b-versatile
INFO:agent:Triage completed - Severity: P2, Summary: NullPointerException in authentication
INFO:mcp_clients:Fetching code context from GitHub MCP
INFO:agent:Diagnosis completed - Root cause: Missing null check on user object
INFO:groq_client:Generating fix patch...
INFO:agent:Fix generated successfully
INFO:agent:Confidence score: 87%
INFO:mcp_clients:Creating PR via GitHub MCP
INFO:agent:Workflow completed - PR created: https://github.com/your-org/your-repo/pull/123
```

---

## Step 6: Verify the Results

### Check GitHub (if confidence > 85%)

1. Go to your GitHub repository
2. Navigate to Pull Requests
3. You should see a new PR titled: **"🤖 AIRA: Fix for NullPointerException in user authentication"**

**PR Contents:**
- Detailed description of the issue
- Root cause analysis
- Code patch with fix
- Unit test (if applicable)
- Link to original incident

### Check Slack (if P0 or low confidence)

1. Open your Slack workspace
2. Check the configured channel
3. You should see an alert with:
   - Incident details
   - Severity badge
   - Stack trace
   - Interactive buttons (for low confidence incidents)

---

## Step 7: Test Different Scenarios

### Scenario A: Critical P0 Incident (Immediate Escalation)

```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "critical-001",
    "message": "CRITICAL: Database connection pool exhausted",
    "stack_trace": "at connectDB (database.js:89)",
    "severity": "P0",
    "timestamp": "2026-05-15T23:10:00Z"
  }'
```

**Expected:** Immediate Slack alert, NO PR creation

### Scenario B: Low Severity P3 (Auto-fix)

```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "minor-001",
    "message": "Warning: Deprecated API usage detected",
    "stack_trace": "at callLegacyAPI (legacy.js:123)",
    "severity": "P3",
    "timestamp": "2026-05-15T23:15:00Z"
  }'
```

**Expected:** Auto-fix with PR if confidence is high

### Scenario C: Use the Bug Injection Script

```bash
cd aira
python backend/scripts/inject_bug.py
```

This script will:
- Generate a realistic bug report
- Send it to the webhook
- Monitor progress in real-time
- Display updates as they happen

---

## Step 8: Explore the Dashboard Features

### Real-Time Updates
- Incidents update automatically via WebSocket
- No page refresh needed
- Live status changes

### Incident Cards
Each incident shows:
- 🆔 Incident ID
- 📝 Error message
- 🎯 Severity badge (P0/P1/P2/P3)
- 📊 Confidence score
- 🔗 PR link (if created)
- ⏱️ Timestamp
- 📈 Current status

### Filtering (if implemented)
- Filter by severity
- Filter by status
- Search by incident ID

---

## Step 9: Monitor System Performance

### Check Resource Usage

```bash
docker stats
```

**Expected Usage:**
- Backend: ~200-300 MB RAM
- Frontend: ~50-100 MB RAM
- Redis: ~20-50 MB RAM
- MCP Servers: ~100-150 MB each

### Check Response Times

```bash
# Time the webhook response
time curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"perf-001","message":"Test","stack_trace":"test","severity":"P3"}'
```

**Expected:** < 100ms for webhook ingestion

---

## Step 10: Verify Data Persistence

### Check Database

```bash
# Access backend container
docker exec -it aira-backend bash

# Inside container, query database
python -c "
from models import SessionLocal, Incident
db = SessionLocal()
incidents = db.query(Incident).all()
print(f'Total incidents: {len(incidents)}')
for inc in incidents:
    print(f'  - {inc.id}: {inc.triage_severity} (Confidence: {inc.confidence_score}%)')
"

# Exit container
exit
```

**Expected:** List of all processed incidents

### Check Redis Cache

```bash
# Connect to Redis
docker exec -it aira-redis redis-cli

# Inside Redis CLI
KEYS *
GET incident:*
QUIT
```

**Expected:** Cached LLM responses and incident data

---

## Troubleshooting Quick Fixes

### Issue: Dashboard not loading
```bash
# Check frontend logs
docker logs aira-frontend

# Restart frontend
docker-compose -f docker/docker-compose.yml restart frontend
```

### Issue: Backend not responding
```bash
# Check backend logs
docker logs aira-backend --tail 50

# Restart backend
docker-compose -f docker/docker-compose.yml restart backend
```

### Issue: No PR created
**Check:**
1. GitHub token has `repo` scope
2. `GITHUB_REPO` format is correct: `owner/repo-name`
3. Repository exists and token has access

### Issue: Groq API errors
**Check:**
1. API key is valid: https://console.groq.com
2. Rate limits not exceeded (free tier: 30 req/min)
3. Model name is correct: `llama-3.3-70b-versatile`

---

## What's Next?

### Production Readiness
1. **Replace SQLite with PostgreSQL** for production
2. **Use managed Redis** (AWS ElastiCache, Redis Cloud)
3. **Add authentication** to webhook endpoint
4. **Set up monitoring** (Prometheus, Grafana)
5. **Configure log aggregation** (ELK stack, Datadog)

### Integration
1. **Connect to Datadog** for real incident ingestion
2. **Add Jira integration** for ticket creation
3. **Integrate with PagerDuty** for on-call alerts
4. **Add Sentry** for error tracking

### Customization
1. **Adjust confidence thresholds** based on accuracy
2. **Fine-tune LLM prompts** for better results
3. **Add custom MCP servers** for your tools
4. **Customize dashboard** with your branding

---

## Success Checklist

- [ ] All 5 containers running and healthy
- [ ] Backend health check passes
- [ ] Dashboard loads at http://localhost:3000
- [ ] Test incident appears in dashboard
- [ ] Real-time updates work via WebSocket
- [ ] Groq LLM generates responses
- [ ] MCP servers respond correctly
- [ ] GitHub PR created (for high confidence)
- [ ] Slack alert sent (for P0 or low confidence)
- [ ] Database persists incidents
- [ ] Redis caches responses

---

## Need More Help?

- 📖 **Full Testing Guide:** See `TESTING_GUIDE.md` for comprehensive tests
- 📚 **Setup Instructions:** See `README.md` for detailed setup
- 🔧 **Troubleshooting:** See `TROUBLESHOOTING.md` for common issues
- 📊 **Architecture:** See `.bob/skills/` for system design

---

## Congratulations! 🎉

You've successfully validated your AIRA system. The autonomous incident response agent is now ready to:
- ✅ Automatically triage incoming incidents
- ✅ Diagnose root causes using AI
- ✅ Generate fixes and create PRs
- ✅ Escalate critical issues immediately
- ✅ Learn from past incidents

**AIRA is now protecting your systems 24/7!** 🛡️