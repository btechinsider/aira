# AIRA Diagnosis Guide

## Overview

This guide helps you diagnose and resolve issues with AIRA (Autonomous Incident Response Agent). It covers common problems, debugging techniques, and system health monitoring.

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [System Health Checks](#system-health-checks)
3. [Common Issues](#common-issues)
4. [Component-Specific Troubleshooting](#component-specific-troubleshooting)
5. [Performance Issues](#performance-issues)
6. [Integration Problems](#integration-problems)
7. [Database Issues](#database-issues)
8. [Logging and Monitoring](#logging-and-monitoring)
9. [Advanced Debugging](#advanced-debugging)
10. [Recovery Procedures](#recovery-procedures)

---

## Quick Diagnostics

### 5-Minute Health Check

Run these commands to quickly assess AIRA's health:

```bash
# 1. Check all containers are running
docker ps | grep aira

# Expected output: 5 running containers
# - aira-backend
# - aira-frontend
# - aira-redis
# - aira-github-mcp
# - aira-incident-context-mcp

# 2. Check backend health
curl http://localhost:8000/health

# Expected: {"status":"healthy","version":"1.0.0"}

# 3. Check Redis connectivity
docker exec aira-redis redis-cli ping

# Expected: PONG

# 4. Check backend logs for errors
docker logs aira-backend --tail 50 | grep -i error

# Expected: No critical errors

# 5. Test API authentication
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Expected: 200 OK or 401 (if user doesn't exist)
```

### Quick Status Dashboard

```bash
# Create a quick status script
cat > check-aira.sh << 'EOF'
#!/bin/bash
echo "=== AIRA System Status ==="
echo ""
echo "Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep aira
echo ""
echo "Backend Health:"
curl -s http://localhost:8000/health | jq .
echo ""
echo "Redis Status:"
docker exec aira-redis redis-cli ping
echo ""
echo "Recent Errors:"
docker logs aira-backend --tail 20 | grep -i error | tail -5
EOF

chmod +x check-aira.sh
./check-aira.sh
```

---

## System Health Checks

### Container Health

**Check Container Status**:
```bash
docker-compose -f docker/docker-compose.yml ps
```

**Expected Output**:
```
NAME                    STATUS              PORTS
aira-backend            Up 2 hours          0.0.0.0:8000->8000/tcp
aira-frontend           Up 2 hours          0.0.0.0:3000->3000/tcp
aira-redis              Up 2 hours (healthy) 0.0.0.0:6379->6379/tcp
aira-github-mcp         Up 2 hours (healthy) 0.0.0.0:8001->8000/tcp
aira-incident-context-mcp Up 2 hours (healthy) 0.0.0.0:8002->8000/tcp
```

**Check Container Resources**:
```bash
docker stats --no-stream | grep aira
```

**Healthy Ranges**:
- CPU: <50% under normal load
- Memory: <1GB per container
- Network I/O: Varies with traffic

### Service Health Endpoints

**Backend**:
```bash
curl http://localhost:8000/health
```

**GitHub MCP**:
```bash
curl http://localhost:8001/health
```

**Incident Context MCP**:
```bash
curl http://localhost:8002/health
```

### Database Health

**Check SQLite Database**:
```bash
# Access the database
docker exec -it aira-backend sqlite3 /data/aira.db

# Run health checks
.tables  # Should show: users, api_keys, incidents
SELECT COUNT(*) FROM incidents;  # Should return a number
.quit
```

**Check Redis**:
```bash
# Connect to Redis
docker exec -it aira-redis redis-cli

# Check memory usage
INFO memory

# Check key count
DBSIZE

# Test read/write
SET test_key "test_value"
GET test_key
DEL test_key
```

---

## Common Issues

### Issue 1: Backend Won't Start

**Symptoms**:
- Container exits immediately
- Error: "Application startup failed"

**Diagnosis**:
```bash
# Check logs
docker logs aira-backend

# Common error messages:
# - "GROQ_API_KEY environment variable is required"
# - "Failed to connect to Redis"
# - "Database initialization failed"
```

**Solutions**:

**A. Missing Environment Variables**:
```bash
# Check .env file exists
ls -la .env

# Verify required variables
cat .env | grep -E "GROQ_API_KEY|GITHUB_TOKEN"

# If missing, copy from example
cp .env.example .env
# Edit .env and add your keys
```

**B. Redis Connection Failed**:
```bash
# Check Redis is running
docker ps | grep redis

# If not running, start it
docker-compose -f docker/docker-compose.yml up -d redis

# Test connection
docker exec aira-redis redis-cli ping
```

**C. Port Already in Use**:
```bash
# Check what's using port 8000
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Kill the process or change AIRA's port in docker-compose.yml
```

---

### Issue 2: Incidents Not Appearing

**Symptoms**:
- Webhook returns 202 Accepted
- No incident in dashboard
- No errors in logs

**Diagnosis**:
```bash
# 1. Check if incident was created
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT id, raw_log, created_at FROM incidents ORDER BY created_at DESC LIMIT 5;"

# 2. Check WebSocket connection
# Open browser console on dashboard
# Look for: "WebSocket connection established"

# 3. Check backend logs for processing
docker logs aira-backend | grep "Processing incident"
```

**Solutions**:

**A. WebSocket Not Connected**:
```bash
# Check if WebSocket endpoint is accessible
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:8000/ws

# Expected: 101 Switching Protocols
```

**Fix**: Refresh the dashboard page to reconnect WebSocket.

**B. Incident Processing Stuck**:
```bash
# Check for stuck background tasks
docker logs aira-backend | grep "Background.*Processing"

# Look for incidents that started but never completed
```

**Fix**: Restart the backend container:
```bash
docker-compose -f docker/docker-compose.yml restart backend
```

**C. Database Write Failed**:
```bash
# Check database permissions
docker exec aira-backend ls -la /data/

# Should show: -rw-r--r-- aira.db
```

**Fix**: Fix permissions:
```bash
docker exec aira-backend chmod 666 /data/aira.db
```

---

### Issue 3: Authentication Failures

**Symptoms**:
- "401 Unauthorized" errors
- "Invalid or expired token"
- "API key not found"

**Diagnosis**:
```bash
# Test user authentication
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Test API key
curl -X POST http://localhost:8000/webhook \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

**Solutions**:

**A. JWT Token Expired**:
- Tokens expire after 7 days
- **Fix**: Log in again to get a new token

**B. API Key Deactivated**:
```bash
# Check API key status in database
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT key, is_active, expires_at FROM api_keys WHERE key LIKE 'aira_%';"
```

**Fix**: Reactivate the key via the dashboard or create a new one.

**C. Wrong API Key Format**:
- API keys must start with `aira_`
- **Fix**: Verify you're using the complete key

---

### Issue 4: GitHub PR Creation Failed

**Symptoms**:
- High confidence incident
- No PR created
- Error: "Failed to create PR"

**Diagnosis**:
```bash
# Check GitHub token
echo $GITHUB_TOKEN

# Test GitHub API access
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Check MCP server logs
docker logs aira-github-mcp
```

**Solutions**:

**A. Invalid GitHub Token**:
```bash
# Verify token has correct scopes
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | jq .

# Required scopes: repo, workflow
```

**Fix**: Generate a new token with correct scopes at https://github.com/settings/tokens

**B. Repository Not Found**:
```bash
# Check GITHUB_REPO format
echo $GITHUB_REPO  # Should be: owner/repo

# Verify repository exists
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GITHUB_REPO
```

**Fix**: Update GITHUB_REPO in .env file.

**C. File in Blocked Paths**:
```bash
# Check blocked paths configuration
docker exec aira-backend cat /app/agent.py | grep BLOCKED_PATHS
```

**Fix**: If the file should be editable, remove it from BLOCKED_PATHS.

---

### Issue 5: Low Confidence Scores

**Symptoms**:
- Most incidents have confidence <70%
- Frequent escalations
- Few auto-fixes

**Diagnosis**:
```bash
# Check average confidence scores
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT AVG(confidence_score), AVG(llm_confidence), AVG(pattern_match_score) 
   FROM incidents WHERE confidence_score > 0;"

# Check incident details
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT id, raw_log, confidence_score FROM incidents 
   ORDER BY created_at DESC LIMIT 10;"
```

**Solutions**:

**A. Poor Error Messages**:
- Vague error messages reduce confidence
- **Fix**: Improve error messages in your application:
  ```python
  # Bad
  raise Exception("Error")
  
  # Good
  raise ValueError(f"User {user_id} not found in database")
  ```

**B. Missing Stack Traces**:
- Stack traces provide crucial context
- **Fix**: Ensure your logging includes full stack traces

**C. No Historical Data**:
- AIRA learns from past incidents
- **Fix**: Let AIRA process more incidents to build history

**D. Code Context Unavailable**:
```bash
# Check if GitHub access is working
docker logs aira-github-mcp | grep -i error
```

**Fix**: Verify GitHub token and repository access.

---

## Component-Specific Troubleshooting

### Backend (FastAPI)

**Check Logs**:
```bash
# Real-time logs
docker logs -f aira-backend

# Last 100 lines
docker logs aira-backend --tail 100

# Errors only
docker logs aira-backend 2>&1 | grep -i error
```

**Common Backend Errors**:

**1. "ModuleNotFoundError"**:
```bash
# Rebuild with dependencies
docker-compose -f docker/docker-compose.yml build backend
docker-compose -f docker/docker-compose.yml up -d backend
```

**2. "Connection refused to Redis"**:
```bash
# Check Redis is running
docker ps | grep redis

# Check network connectivity
docker exec aira-backend ping -c 3 redis
```

**3. "Database locked"**:
```bash
# SQLite is locked by another process
# Stop all containers and restart
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d
```

### Frontend (React)

**Check Logs**:
```bash
docker logs aira-frontend --tail 50
```

**Common Frontend Errors**:

**1. "Failed to fetch"**:
- Backend is not accessible
- **Fix**: Check backend is running on port 8000

**2. "WebSocket connection failed"**:
```bash
# Check WebSocket endpoint
curl -i http://localhost:8000/ws
```

**Fix**: Ensure CORS is configured correctly in backend.

**3. "Module not found"**:
```bash
# Rebuild frontend
docker-compose -f docker/docker-compose.yml build frontend
docker-compose -f docker/docker-compose.yml up -d frontend
```

### Redis

**Check Logs**:
```bash
docker logs aira-redis --tail 50
```

**Common Redis Issues**:

**1. "Out of memory"**:
```bash
# Check memory usage
docker exec aira-redis redis-cli INFO memory

# Check max memory setting
docker exec aira-redis redis-cli CONFIG GET maxmemory
```

**Fix**: Increase Redis memory limit in docker-compose.yml:
```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

**2. "Connection timeout"**:
```bash
# Check Redis is responsive
docker exec aira-redis redis-cli ping

# Check network
docker network inspect aira-network
```

**Fix**: Restart Redis:
```bash
docker-compose -f docker/docker-compose.yml restart redis
```

### MCP Servers

**GitHub MCP**:
```bash
# Check logs
docker logs aira-github-mcp --tail 50

# Test endpoint
curl http://localhost:8001/health
```

**Incident Context MCP**:
```bash
# Check logs
docker logs aira-incident-context-mcp --tail 50

# Test endpoint
curl http://localhost:8002/health
```

**Common MCP Issues**:

**1. "MCP server not responding"**:
```bash
# Check if container is running
docker ps | grep mcp

# Restart MCP servers
docker-compose -f docker/docker-compose.yml restart github-mcp incident-context-mcp
```

**2. "GitHub API rate limit exceeded"**:
```bash
# Check rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit
```

**Fix**: Wait for rate limit reset or use a different token.

---

## Performance Issues

### Slow Incident Processing

**Diagnosis**:
```bash
# Check processing times
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT id, 
          CAST((julianday(resolved_at) - julianday(created_at)) * 86400 AS INTEGER) as seconds
   FROM incidents 
   WHERE resolved_at IS NOT NULL 
   ORDER BY created_at DESC LIMIT 10;"
```

**Expected**: 30-60 seconds per incident

**Solutions**:

**A. Groq API Slow**:
```bash
# Check Groq API status
curl https://status.groq.com/api/v2/status.json
```

**Fix**: Wait for Groq service to recover or switch to a different model.

**B. GitHub API Slow**:
```bash
# Check GitHub API status
curl https://www.githubstatus.com/api/v2/status.json
```

**Fix**: Implement caching for frequently accessed files.

**C. Redis Slow**:
```bash
# Check Redis latency
docker exec aira-redis redis-cli --latency

# Check slow queries
docker exec aira-redis redis-cli SLOWLOG GET 10
```

**Fix**: Optimize Redis configuration or increase resources.

### High Memory Usage

**Diagnosis**:
```bash
# Check container memory
docker stats --no-stream | grep aira

# Check backend memory
docker exec aira-backend ps aux | grep python
```

**Solutions**:

**A. Memory Leak**:
```bash
# Restart backend to clear memory
docker-compose -f docker/docker-compose.yml restart backend
```

**B. Too Many Incidents in Memory**:
```bash
# Check incident count
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT COUNT(*) FROM incidents;"
```

**Fix**: Archive old incidents:
```bash
docker exec -it aira-backend sqlite3 /data/aira.db \
  "DELETE FROM incidents WHERE created_at < datetime('now', '-30 days');"
```

### High CPU Usage

**Diagnosis**:
```bash
# Check CPU usage
docker stats --no-stream | grep aira

# Check what's consuming CPU
docker exec aira-backend top -b -n 1
```

**Solutions**:

**A. Too Many Concurrent Incidents**:
- Limit concurrent processing in agent configuration

**B. Inefficient Code**:
- Profile the code to find bottlenecks
- Optimize database queries

---

## Integration Problems

### Webhook Not Receiving Events

**Diagnosis**:
```bash
# Test webhook endpoint
curl -X POST http://localhost:8000/webhook \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"message":"test incident","severity":"error"}'

# Check if request reaches backend
docker logs aira-backend | grep "POST /webhook"
```

**Solutions**:

**A. Firewall Blocking**:
- Ensure port 8000 is open
- Check firewall rules

**B. Wrong Webhook URL**:
- Verify URL in monitoring platform
- Should be: `http://your-server:8000/webhook`

**C. SSL/TLS Issues**:
- If using HTTPS, ensure valid certificate
- Check reverse proxy configuration

### Slack Notifications Not Sending

**Diagnosis**:
```bash
# Check Slack webhook URL
echo $SLACK_WEBHOOK_URL

# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test from AIRA"}'
```

**Solutions**:

**A. Invalid Webhook URL**:
- Regenerate webhook in Slack
- Update SLACK_WEBHOOK_URL in .env

**B. Slack API Error**:
- Check Slack API status
- Verify webhook permissions

---

## Database Issues

### Database Corruption

**Symptoms**:
- "Database disk image is malformed"
- Queries fail randomly

**Recovery**:
```bash
# 1. Stop all containers
docker-compose -f docker/docker-compose.yml down

# 2. Backup database
docker run --rm -v aira_sqlite-data:/data -v $(pwd):/backup \
  alpine cp /data/aira.db /backup/aira.db.backup

# 3. Try to repair
docker run --rm -v aira_sqlite-data:/data alpine \
  sh -c "cd /data && sqlite3 aira.db 'PRAGMA integrity_check;'"

# 4. If repair fails, restore from backup
# (if you have one)

# 5. Restart containers
docker-compose -f docker/docker-compose.yml up -d
```

### Database Migration Issues

**After Updating AIRA**:
```bash
# Check database schema
docker exec -it aira-backend sqlite3 /data/aira.db ".schema"

# If schema is outdated, run migrations
docker exec aira-backend python -c "from models import init_db; init_db()"
```

---

## Logging and Monitoring

### Enable Debug Logging

**Backend**:
```bash
# Edit docker-compose.yml
services:
  backend:
    environment:
      - LOG_LEVEL=DEBUG

# Restart
docker-compose -f docker/docker-compose.yml restart backend
```

### Centralized Logging

**Export Logs to File**:
```bash
# Create logging script
cat > export-logs.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p logs/$DATE

docker logs aira-backend > logs/$DATE/backend.log 2>&1
docker logs aira-frontend > logs/$DATE/frontend.log 2>&1
docker logs aira-redis > logs/$DATE/redis.log 2>&1
docker logs aira-github-mcp > logs/$DATE/github-mcp.log 2>&1
docker logs aira-incident-context-mcp > logs/$DATE/incident-context-mcp.log 2>&1

echo "Logs exported to logs/$DATE/"
EOF

chmod +x export-logs.sh
./export-logs.sh
```

### Monitoring Metrics

**Key Metrics to Track**:
1. Incident processing time
2. Confidence score distribution
3. Auto-fix success rate
4. API response times
5. Error rates

**Query Metrics**:
```bash
# Average processing time
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT AVG(CAST((julianday(resolved_at) - julianday(created_at)) * 86400 AS INTEGER))
   FROM incidents WHERE resolved_at IS NOT NULL;"

# Confidence score distribution
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT 
     CASE 
       WHEN confidence_score >= 0.9 THEN '90-100%'
       WHEN confidence_score >= 0.8 THEN '80-89%'
       WHEN confidence_score >= 0.7 THEN '70-79%'
       ELSE 'Below 70%'
     END as range,
     COUNT(*) as count
   FROM incidents 
   WHERE confidence_score > 0
   GROUP BY range;"

# Success rate by severity
docker exec -it aira-backend sqlite3 /data/aira.db \
  "SELECT severity, 
          COUNT(*) as total,
          SUM(CASE WHEN resolution_status='resolved' THEN 1 ELSE 0 END) as resolved,
          ROUND(100.0 * SUM(CASE WHEN resolution_status='resolved' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
   FROM incidents 
   GROUP BY severity;"
```

---

## Advanced Debugging

### Python Debugger

**Attach to Running Container**:
```bash
# Install debugger in container
docker exec aira-backend pip install ipdb

# Add breakpoint in code
# import ipdb; ipdb.set_trace()

# Attach to container
docker attach aira-backend
```

### Network Debugging

**Check Container Network**:
```bash
# Inspect network
docker network inspect aira-network

# Test connectivity between containers
docker exec aira-backend ping -c 3 redis
docker exec aira-backend ping -c 3 github-mcp
```

### API Request Tracing

**Enable Request Logging**:
```python
# Add to main.py
import logging
logging.basicConfig(level=logging.DEBUG)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.debug(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.debug(f"Response: {response.status_code}")
    return response
```

---

## Recovery Procedures

### Complete System Reset

**⚠️ Warning**: This will delete all data!

```bash
# 1. Stop all containers
docker-compose -f docker/docker-compose.yml down

# 2. Remove volumes
docker volume rm aira_sqlite-data aira_redis-data

# 3. Rebuild and restart
docker-compose -f docker/docker-compose.yml build
docker-compose -f docker/docker-compose.yml up -d

# 4. Verify health
./check-aira.sh
```

### Backup and Restore

**Backup**:
```bash
# Create backup script
cat > backup-aira.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$DATE

# Backup database
docker run --rm -v aira_sqlite-data:/data -v $(pwd)/backups/$DATE:/backup \
  alpine cp /data/aira.db /backup/aira.db

# Backup Redis
docker exec aira-redis redis-cli SAVE
docker run --rm -v aira_redis-data:/data -v $(pwd)/backups/$DATE:/backup \
  alpine cp /data/dump.rdb /backup/dump.rdb

echo "Backup created in backups/$DATE/"
EOF

chmod +x backup-aira.sh
./backup-aira.sh
```

**Restore**:
```bash
# Restore from backup
BACKUP_DATE=20240115_120000  # Replace with your backup date

# Stop containers
docker-compose -f docker/docker-compose.yml down

# Restore database
docker run --rm -v aira_sqlite-data:/data -v $(pwd)/backups/$BACKUP_DATE:/backup \
  alpine cp /backup/aira.db /data/aira.db

# Restore Redis
docker run --rm -v aira_redis-data:/data -v $(pwd)/backups/$BACKUP_DATE:/backup \
  alpine cp /backup/dump.rdb /data/dump.rdb

# Restart containers
docker-compose -f docker/docker-compose.yml up -d
```

---

## Getting Help

### Before Asking for Help

Collect this information:
1. AIRA version: `docker exec aira-backend cat /app/main.py | grep version`
2. Docker version: `docker --version`
3. Operating system: `uname -a` (Linux/Mac) or `systeminfo` (Windows)
4. Error logs: `docker logs aira-backend --tail 100`
5. System status: `./check-aira.sh`

### Support Channels

- **GitHub Issues**: https://github.com/yourusername/aira/issues
- **Community Forum**: https://community.aira.example.com
- **Email**: support@aira.example.com

### Reporting Bugs

Include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Error messages and logs
5. System information
6. Screenshots (if applicable)

---

## Appendix

### Useful Commands Reference

```bash
# Container Management
docker-compose -f docker/docker-compose.yml up -d      # Start all
docker-compose -f docker/docker-compose.yml down       # Stop all
docker-compose -f docker/docker-compose.yml restart    # Restart all
docker-compose -f docker/docker-compose.yml logs -f    # Follow logs

# Individual Container Control
docker start aira-backend
docker stop aira-backend
docker restart aira-backend
docker logs -f aira-backend

# Database Operations
docker exec -it aira-backend sqlite3 /data/aira.db
docker exec aira-redis redis-cli

# Health Checks
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health

# Cleanup
docker system prune -a --volumes  # Remove all unused data
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| GROQ_API_KEY | Yes | Groq API key for LLM |
| GITHUB_TOKEN | Yes | GitHub personal access token |
| GITHUB_REPO | Yes | Repository in format owner/repo |
| SLACK_WEBHOOK_URL | No | Slack webhook for alerts |
| REDIS_URL | No | Redis connection URL (default: redis://redis:6379) |
| DATABASE_URL | No | SQLite database path |
| LOG_LEVEL | No | Logging level (DEBUG, INFO, WARNING, ERROR) |

---

**Last Updated**: January 2024  
**Version**: 1.0.0

For the latest troubleshooting tips, visit: [https://github.com/yourusername/aira/wiki/troubleshooting](https://github.com/yourusername/aira/wiki/troubleshooting)