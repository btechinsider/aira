# AIRA System Testing Guide

This guide will help you test and validate all components of the AIRA (Autonomous Incident Response Agent) system.

## Prerequisites

✅ All containers are running (verify with `docker-compose -f docker/docker-compose.yml ps`)
✅ Environment variables are set in `.env` file
✅ Groq API key is valid
✅ GitHub token has repository access

---

## Test 1: Health Check - Verify All Services

### Backend Health
```bash
curl http://localhost:8000/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-15T23:00:00.000Z",
  "services": {
    "redis": "connected",
    "database": "connected",
    "mcp_servers": "available"
  }
}
```

### GitHub MCP Health
```bash
curl http://localhost:8001/health
```
**Expected:** `{"status": "healthy"}`

### Incident Context MCP Health
```bash
curl http://localhost:8002/health
```
**Expected:** `{"status": "healthy"}`

### Frontend
Open browser: http://localhost:3000
**Expected:** AIRA dashboard loads with "No incidents yet" message

---

## Test 2: Simple Incident Injection

### Test 2A: Low Severity Incident (P3)
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "message": "Warning: High memory usage detected",
    "stack_trace": "at processRequest (app.js:45)\nat handleRequest (server.js:120)",
    "severity": "P3",
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

**What to Check:**
1. Dashboard updates in real-time (WebSocket)
2. Incident appears with status "Triaging"
3. After ~10-30 seconds, status changes to "Diagnosed" → "Fixed" → "Completed"
4. Confidence score is displayed
5. Action taken is shown (PR created or Slack alert)

---

## Test 3: Critical Incident (P0) - Immediate Escalation

### Test 3A: P0 Severity
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "critical-001",
    "message": "CRITICAL: Database connection pool exhausted",
    "stack_trace": "at connectDB (database.js:89)\nat initializeApp (app.js:12)",
    "severity": "P0",
    "timestamp": "2026-05-15T23:05:00Z"
  }'
```

**Expected Behavior:**
- ⚠️ **Immediate Slack alert** (no PR creation)
- Status: "Escalated to Slack"
- Dashboard shows red badge for P0
- No automatic fix attempted

**Verify Slack:**
Check your Slack channel for alert message with incident details.

---

## Test 4: High Confidence Auto-PR Creation

### Test 4A: Common Error Pattern (P2)
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "auto-pr-001",
    "message": "NullPointerException in user service",
    "stack_trace": "at getUserProfile (user.service.js:156)\nat handleGetUser (user.controller.js:45)",
    "severity": "P2",
    "timestamp": "2026-05-15T23:10:00Z",
    "metadata": {
      "file": "user.service.js",
      "line": 156,
      "repo": "your-org/your-repo"
    }
  }'
```

**Expected Behavior:**
- Agent analyzes the error
- Fetches code context via GitHub MCP
- Generates a fix patch
- Calculates confidence score
- If confidence > 85%: **Creates GitHub PR automatically**
- Dashboard shows PR link

**Verify GitHub:**
1. Go to your repository
2. Check for new PR titled: "🤖 AIRA: Fix for NullPointerException in user service"
3. PR should contain:
   - Detailed description
   - Code patch
   - Unit test (if applicable)

---

## Test 5: Low Confidence - Human Approval

### Test 5A: Ambiguous Error
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "approval-001",
    "message": "Unexpected behavior in payment processing",
    "stack_trace": "at processPayment (payment.js:234)\nat checkout (order.js:89)",
    "severity": "P1",
    "timestamp": "2026-05-15T23:15:00Z"
  }'
```

**Expected Behavior:**
- Confidence score < 85%
- **Slack message with approval buttons** sent
- Dashboard shows "Awaiting Human Approval"
- Buttons: "Approve PR" | "Reject" | "Escalate"

---

## Test 6: WebSocket Real-Time Updates

### Test 6A: Monitor Live Updates
1. Open dashboard: http://localhost:3000
2. Open browser DevTools → Console
3. Inject an incident (use Test 2A command)
4. Watch console for WebSocket messages:

```javascript
// Expected console output:
WebSocket connected
Received: {"type": "incident_received", "incident_id": "test-001"}
Received: {"type": "agent_state_update", "state": "triaging", "incident_id": "test-001"}
Received: {"type": "agent_state_update", "state": "diagnosing", "incident_id": "test-001"}
Received: {"type": "agent_state_update", "state": "fixing", "incident_id": "test-001"}
Received: {"type": "agent_state_update", "state": "completed", "incident_id": "test-001", "pr_url": "https://github.com/..."}
```

---

## Test 7: MCP Server Integration

### Test 7A: GitHub MCP - Fetch File Context
```bash
curl -X POST http://localhost:8001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "fetch_affected_file",
    "params": {
      "repo": "your-org/your-repo",
      "file_path": "src/app.js",
      "line_number": 45
    }
  }'
```

**Expected Response:**
```json
{
  "file_path": "src/app.js",
  "line_number": 45,
  "context": "... code lines around line 45 ..."
}
```

### Test 7B: Incident Context MCP - Similarity Search
```bash
curl -X POST http://localhost:8002/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "get_similar_incidents",
    "params": {
      "error_signature": "NullPointerException at getUserProfile",
      "limit": 5
    }
  }'
```

**Expected Response:**
```json
{
  "similar_incidents": [
    {
      "incident_id": "...",
      "similarity_score": 0.92,
      "resolution": "Added null check before accessing user object",
      "patch_url": "https://github.com/..."
    }
  ]
}
```

---

## Test 8: Groq LLM Integration

### Test 8A: Check Backend Logs for LLM Calls
```bash
docker logs aira-backend --tail 50
```

**Look for:**
```
INFO:groq_client:Calling Groq API with model: llama-3.3-70b-versatile
INFO:groq_client:Groq response received (tokens: 234)
INFO:agent:Triage completed - Severity: P2, Summary: NullPointerException in user service
INFO:agent:Diagnosis completed - Root cause identified
INFO:agent:Fix generated - Confidence: 87%
```

---

## Test 9: Redis Caching

### Test 9A: Verify Cache Hit
1. Send the same incident twice:
```bash
# First request
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cache-test-001",
    "message": "Test caching",
    "stack_trace": "at test (test.js:1)",
    "severity": "P3"
  }'

# Wait 2 seconds, then send again
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cache-test-002",
    "message": "Test caching",
    "stack_trace": "at test (test.js:1)",
    "severity": "P3"
  }'
```

2. Check logs:
```bash
docker logs aira-backend | grep "cache"
```

**Expected:**
```
INFO:groq_client:Cache miss - calling Groq API
INFO:groq_client:Cache hit - returning cached response
```

---

## Test 10: Database Persistence

### Test 10A: Verify Incidents Stored
```bash
# Access the backend container
docker exec -it aira-backend bash

# Inside container, check database
python -c "
from models import SessionLocal, Incident
db = SessionLocal()
incidents = db.query(Incident).all()
for inc in incidents:
    print(f'ID: {inc.id}, Severity: {inc.triage_severity}, Confidence: {inc.confidence_score}')
"
```

**Expected:** List of all processed incidents with their details

---

## Test 11: Error Handling

### Test 11A: Invalid Payload
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "invalid": "payload"
  }'
```

**Expected Response:**
```json
{
  "detail": [
    {
      "loc": ["body", "id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Test 11B: Groq API Failure Simulation
1. Set invalid Groq API key in `.env`
2. Restart backend: `docker-compose -f docker/docker-compose.yml restart backend`
3. Send incident
4. Check logs for retry logic:

```bash
docker logs aira-backend --tail 20
```

**Expected:**
```
ERROR:groq_client:Groq API call failed (attempt 1/3): Invalid API key
INFO:groq_client:Retrying in 2 seconds...
ERROR:groq_client:Groq API call failed (attempt 2/3): Invalid API key
INFO:groq_client:Retrying in 4 seconds...
```

---

## Test 12: Full End-to-End Workflow

### Test 12A: Complete Incident Lifecycle
```bash
# Use the provided bug injection script
cd aira
python backend/scripts/inject_bug.py
```

**This script will:**
1. Generate a realistic bug report
2. Send to webhook
3. Monitor progress via WebSocket
4. Display real-time updates

**Expected Output:**
```
🐛 Injecting test incident...
✓ Incident received: INC-20260515-001
⏳ Status: Triaging...
⏳ Status: Diagnosing...
⏳ Status: Fixing...
⏳ Status: Calculating confidence...
✓ Completed! Confidence: 89%
🔗 PR Created: https://github.com/your-org/your-repo/pull/123
```

---

## Troubleshooting

### Issue: Dashboard not updating
**Solution:**
1. Check WebSocket connection in browser console
2. Verify backend is running: `docker logs aira-backend`
3. Check CORS settings in `backend/main.py`

### Issue: No PR created
**Solution:**
1. Verify GitHub token has `repo` scope
2. Check `GITHUB_REPO` format: `owner/repo-name`
3. Review backend logs for GitHub API errors

### Issue: Groq API errors
**Solution:**
1. Verify API key is valid: https://console.groq.com
2. Check rate limits (Groq free tier: 30 requests/minute)
3. Review model name: `llama-3.3-70b-versatile`

### Issue: Slack alerts not received
**Solution:**
1. Test webhook URL: `curl -X POST <SLACK_WEBHOOK_URL> -d '{"text":"Test"}'`
2. Verify webhook is for correct channel
3. Check backend logs for Slack API errors

---

## Performance Benchmarks

### Expected Response Times
- **Webhook ingestion:** < 100ms
- **Triage (LLM call):** 2-5 seconds
- **Diagnosis (with MCP):** 3-8 seconds
- **Fix generation:** 5-10 seconds
- **Total incident processing:** 15-30 seconds

### Resource Usage
- **Backend:** ~200-300 MB RAM
- **Frontend:** ~50-100 MB RAM
- **Redis:** ~20-50 MB RAM
- **MCP Servers:** ~100-150 MB RAM each

---

## Success Criteria

✅ All health checks pass
✅ Incidents appear in dashboard within 1 second
✅ P0 incidents trigger immediate Slack alerts
✅ High-confidence incidents create PRs automatically
✅ Low-confidence incidents request human approval
✅ WebSocket updates in real-time
✅ MCP servers respond correctly
✅ Groq LLM generates meaningful responses
✅ Redis caching reduces duplicate LLM calls
✅ Database persists all incidents

---

## Next Steps

Once all tests pass:
1. **Integrate with monitoring:** Connect Datadog/Prometheus webhooks
2. **Production deployment:** Use managed Redis, PostgreSQL
3. **Scale horizontally:** Add more backend replicas
4. **Fine-tune confidence thresholds:** Adjust based on accuracy
5. **Expand MCP servers:** Add Jira, PagerDuty integrations

---

## Support

For issues or questions:
- Check logs: `docker-compose -f docker/docker-compose.yml logs -f`
- Review README.md for setup instructions
- Consult TROUBLESHOOTING.md for common issues