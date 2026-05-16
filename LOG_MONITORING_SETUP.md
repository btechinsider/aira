# 🔍 AIRA Log Monitoring Setup Guide

Complete guide to set up automatic log monitoring for your Python applications with AIRA.

## 📋 Overview

AIRA now includes **automatic log monitoring** that watches your application logs and automatically triggers incident response when errors occur. No manual webhook configuration needed!

## 🚀 Quick Start (3 Steps)

### Step 1: Start AIRA

```bash
cd aira
make up
```

This starts all AIRA services including the log monitor.

### Step 2: Add AIRA Handler to Your App

```python
# In your Python application
import logging
from aira_handler import setup_aira_logging

# Setup AIRA logging (one line!)
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="my-app"
)

# Use logger normally - errors automatically sent to AIRA
logger.error("Something went wrong!")  # This triggers AIRA
```

### Step 3: Test It

```bash
cd aira/log-monitor/examples
python test_integration.py
```

Watch incidents appear in the AIRA dashboard at http://localhost:3000

## 📦 Installation Options

### Option 1: Python Logging Handler (Recommended)

**Best for:** Applications where you can modify code

**Advantages:**
- ✅ Direct integration with Python logging
- ✅ Captures full stack traces
- ✅ No file I/O overhead
- ✅ Works with Flask, FastAPI, Django

**Setup:**

1. Copy the handler:
   ```bash
   cp aira/log-monitor/aira_handler.py /path/to/your/project/
   ```

2. Add to your application:
   ```python
   from aira_handler import setup_aira_logging
   
   logger = setup_aira_logging(
       aira_url="http://localhost:8000/webhook",
       app_name="my-app"
   )
   ```

3. Done! All ERROR and CRITICAL logs now trigger AIRA.

### Option 2: Log File Watcher

**Best for:** Legacy applications or when you can't modify code

**Advantages:**
- ✅ No code changes required
- ✅ Works with any application that writes logs
- ✅ Monitors multiple log files
- ✅ Runs as separate service

**Setup:**

1. Install dependencies:
   ```bash
   cd aira/log-monitor
   pip install -r requirements.txt
   ```

2. Run the watcher:
   ```bash
   python log_watcher.py /path/to/app.log \
       --aira-url http://localhost:8000/webhook \
       --app-name my-app
   ```

3. The watcher monitors the log file and sends errors to AIRA automatically.

### Option 3: Docker Compose (Production)

**Best for:** Production deployments

**Advantages:**
- ✅ Fully containerized
- ✅ Auto-restart on failure
- ✅ Integrated with AIRA stack
- ✅ Easy to scale

**Setup:**

Already configured in `docker/docker-compose.yml`! Just mount your logs:

```yaml
log-monitor:
  volumes:
    # Mount your application logs
    - /var/log/myapp:/logs
  environment:
    - APP_NAME=my-app
```

Then start:
```bash
make up
```

## 🔧 Framework-Specific Integration

### Flask

```python
from flask import Flask
from aira_handler import setup_aira_logging

app = Flask(__name__)
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="my-flask-app"
)

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Unhandled exception: {error}", exc_info=True)
    return "Internal Server Error", 500
```

### FastAPI

```python
from fastapi import FastAPI, Request
from aira_handler import setup_aira_logging

app = FastAPI()
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="my-fastapi-app"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {"detail": "Internal server error"}
```

### Django

```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'aira': {
            'class': 'aira_handler.AIRAHandler',
            'aira_url': 'http://localhost:8000/webhook',
            'app_name': 'my-django-app',
        },
    },
    'root': {
        'handlers': ['aira'],
        'level': 'ERROR',
    },
}
```

## 📊 What Gets Monitored

AIRA automatically detects and responds to:

| Log Level | AIRA Severity | Action |
|-----------|---------------|--------|
| `CRITICAL` | P0 | 🚨 Immediate Slack alert |
| `ERROR` | P1 | 🔧 Auto-fix or human approval |
| `WARNING` | P2 | 📝 Auto-fix if high confidence |

### Detected Patterns

- ✅ Python exceptions (all types)
- ✅ Stack traces
- ✅ Error messages
- ✅ Critical failures
- ✅ Unhandled exceptions

## 🧪 Testing Your Setup

### Test 1: Basic Integration

```bash
cd aira/log-monitor/examples
python test_integration.py
```

Expected output:
```
✓ AIRA backend is running
✓ Logger configured
✓ Error log sent to AIRA
✓ Exception sent to AIRA
✓ Critical error sent to AIRA
```

### Test 2: Flask Example

```bash
cd aira/log-monitor/examples
python flask_example.py
```

Then visit:
- http://localhost:5000/error - Triggers an error
- http://localhost:5000/critical - Triggers critical error

### Test 3: Check AIRA Dashboard

1. Open http://localhost:3000
2. You should see incidents appearing in real-time
3. Click on an incident to see:
   - Severity classification
   - Root cause analysis
   - Proposed fix
   - Confidence score

## 🔍 Verification Checklist

- [ ] AIRA backend is running (`curl http://localhost:8000/health`)
- [ ] Log handler is added to your application
- [ ] Test error triggers AIRA incident
- [ ] Incident appears in dashboard
- [ ] Stack trace is captured correctly
- [ ] Severity is classified correctly

## 🎯 Configuration

### Handler Configuration

```python
from aira_handler import AIRAHandler

handler = AIRAHandler(
    aira_url="http://localhost:8000/webhook",  # AIRA webhook URL
    level=logging.ERROR,                        # Minimum log level
    timeout=5,                                  # Request timeout (seconds)
    app_name="my-app"                          # Application name
)
```

### Log Watcher Configuration

Edit `log-monitor/config.yaml`:

```yaml
aira_url: "http://localhost:8000/webhook"
app_name: "my-python-app"

log_paths:
  - "/var/log/myapp/app.log"
  - "/var/log/myapp/error.log"

error_patterns:
  - "ERROR"
  - "CRITICAL"
  - "Exception"
  - "Traceback"
```

## 🐛 Troubleshooting

### Handler Not Sending Logs

**Problem:** Errors not appearing in AIRA

**Solutions:**
1. Check AIRA is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Verify log level:
   ```python
   logger.setLevel(logging.ERROR)
   ```

3. Check handler is added:
   ```python
   print(logger.handlers)  # Should include AIRAHandler
   ```

### Log Watcher Not Detecting Errors

**Problem:** Log watcher not sending incidents

**Solutions:**
1. Check file permissions:
   ```bash
   ls -la /path/to/log/file
   ```

2. Verify error patterns match:
   ```bash
   grep -E "ERROR|Exception" /path/to/log/file
   ```

3. Check watcher is running:
   ```bash
   docker ps | grep log-monitor
   ```

### Connection Refused

**Problem:** `Connection refused` error

**Solutions:**
1. Ensure AIRA backend is running
2. Check firewall settings
3. Verify URL is correct (use `http://backend:8000/webhook` in Docker)

## 📈 Performance

- **Handler overhead:** < 5ms per log entry
- **Memory usage:** ~50MB for log watcher
- **Network:** Async requests, non-blocking
- **Deduplication:** Prevents duplicate incident reports

## 🔒 Security

- ✅ No sensitive data in logs (sanitized)
- ✅ Rate limiting via deduplication
- ✅ Timeout protection (5 seconds)
- ✅ Handler errors don't crash app

## 📚 Examples

Complete working examples in `log-monitor/examples/`:
- `test_integration.py` - Integration test
- `flask_example.py` - Flask application
- More examples in the README

## 🎓 Next Steps

1. ✅ Set up log monitoring (you're here!)
2. 📊 Monitor the dashboard for incidents
3. 🔧 Review auto-generated fixes
4. 📈 Tune confidence thresholds
5. 🚀 Deploy to production

## 📞 Need Help?

- 📖 Full documentation: [README.md](log-monitor/README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/aira/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/aira/discussions)

---

**Ready to go!** Your Python applications are now monitored by AIRA. Errors will be automatically detected, diagnosed, and fixed. 🎉