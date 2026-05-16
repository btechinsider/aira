# AIRA Log Monitor

Automatic log monitoring for Python applications that sends errors to AIRA for autonomous incident response.

## 🚀 Quick Start

### Option 1: Python Logging Handler (Recommended)

Add AIRA handler directly to your Python application:

```python
# In your application code
import logging
from aira_handler import setup_aira_logging

# Setup AIRA logging
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="my-app",
    level=logging.ERROR
)

# Use logger normally - errors automatically sent to AIRA
logger.info("Application started")
logger.error("Something went wrong!")  # This will trigger AIRA
```

### Option 2: Log File Watcher

Monitor existing log files without code changes:

```bash
# Install dependencies
pip install -r requirements.txt

# Run log watcher
python log_watcher.py /path/to/app.log \
    --aira-url http://localhost:8000/webhook \
    --app-name my-app
```

### Option 3: Docker Compose (Production)

Already included in AIRA's docker-compose.yml:

```bash
# Start all services including log monitor
cd aira
make up

# Your application logs will be monitored automatically
```

## 📦 Installation

### For Python Applications

1. **Copy the handler to your project:**
   ```bash
   cp aira_handler.py /path/to/your/project/
   ```

2. **Install in your application:**
   ```python
   # app.py
   import logging
   from aira_handler import AIRAHandler
   
   logger = logging.getLogger(__name__)
   
   # Add AIRA handler
   aira_handler = AIRAHandler(
       aira_url="http://localhost:8000/webhook",
       app_name="my-flask-app"
   )
   logger.addHandler(aira_handler)
   logger.setLevel(logging.INFO)
   ```

3. **Test it:**
   ```python
   # This will trigger AIRA
   try:
       1 / 0
   except Exception as e:
       logger.error("Division error", exc_info=True)
   ```

### For Flask Applications

```python
# app.py
from flask import Flask
from aira_handler import setup_aira_logging

app = Flask(__name__)

# Setup AIRA logging
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="my-flask-app"
)

@app.route('/')
def index():
    logger.info("Index page accessed")
    return "Hello World"

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Unhandled exception: {error}", exc_info=True)
    return "Internal Server Error", 500

if __name__ == '__main__':
    app.run()
```

### For FastAPI Applications

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from aira_handler import setup_aira_logging
import logging

app = FastAPI()

# Setup AIRA logging
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="my-fastapi-app"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Hello World"}
```

### For Django Applications

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'aira': {
            'class': 'aira_handler.AIRAHandler',
            'aira_url': 'http://localhost:8000/webhook',
            'app_name': 'my-django-app',
            'level': 'ERROR',
        },
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console', 'aira'],
        'level': 'INFO',
    },
}
```

## 🔧 Configuration

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

Edit `config.yaml`:

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

severity_keywords:
  P0:  # Critical
    - "critical"
    - "fatal"
  P1:  # High
    - "error"
    - "exception"
  P2:  # Medium
    - "warning"
```

## 🐳 Docker Deployment

### Using Docker Compose

The log monitor is already included in AIRA's docker-compose.yml:

```yaml
log-monitor:
  build:
    context: ../log-monitor
    dockerfile: Dockerfile
  volumes:
    # Mount your application logs
    - /var/log/myapp:/logs
  environment:
    - AIRA_URL=http://backend:8000/webhook
    - APP_NAME=my-app
```

### Standalone Docker

```bash
# Build image
docker build -t aira-log-monitor .

# Run container
docker run -d \
  --name log-monitor \
  -v /var/log/myapp:/logs \
  -e AIRA_URL=http://aira-backend:8000/webhook \
  -e APP_NAME=my-app \
  aira-log-monitor
```

## 📊 What Gets Monitored

The log monitor automatically detects and reports:

- ✅ **Python Exceptions** (all types)
- ✅ **ERROR level logs**
- ✅ **CRITICAL level logs**
- ✅ **Stack traces**
- ✅ **Unhandled exceptions**
- ✅ **Application crashes**

### Severity Mapping

| Log Level | AIRA Severity | Action |
|-----------|---------------|--------|
| CRITICAL  | P0 | Immediate Slack alert |
| ERROR     | P1 | Auto-fix or human approval |
| WARNING   | P2 | Auto-fix if high confidence |

## 🧪 Testing

### Test the Handler

```python
# test_aira_handler.py
import logging
from aira_handler import setup_aira_logging

logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="test-app"
)

# Test different error types
def test_errors():
    # Test 1: Simple error
    logger.error("Test error message")
    
    # Test 2: Exception with stack trace
    try:
        result = 1 / 0
    except ZeroDivisionError as e:
        logger.error("Division by zero", exc_info=True)
    
    # Test 3: Critical error
    logger.critical("Critical system failure!")

if __name__ == '__main__':
    test_errors()
```

### Test the Log Watcher

```bash
# Create test log file
echo "INFO: Application started" > test.log
echo "ERROR: Something went wrong" >> test.log
echo "  at module.py:123" >> test.log

# Run watcher
python log_watcher.py test.log --aira-url http://localhost:8000/webhook

# In another terminal, append errors
echo "CRITICAL: Database connection failed" >> test.log
```

## 🔍 Troubleshooting

### Handler Not Sending Logs

1. **Check AIRA is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify log level:**
   ```python
   # Make sure logger level is set
   logger.setLevel(logging.ERROR)
   ```

3. **Check handler is added:**
   ```python
   print(logger.handlers)  # Should include AIRAHandler
   ```

### Log Watcher Not Detecting Errors

1. **Check file permissions:**
   ```bash
   ls -la /path/to/log/file
   ```

2. **Verify error patterns:**
   ```bash
   grep -E "ERROR|Exception" /path/to/log/file
   ```

3. **Check watcher logs:**
   ```bash
   python log_watcher.py /path/to/log --aira-url http://localhost:8000/webhook
   # Should print "[LogWatcher] Monitoring started"
   ```

## 📈 Performance

- **Handler overhead:** < 5ms per log entry
- **Memory usage:** ~50MB for log watcher
- **Network:** Async requests, non-blocking
- **Deduplication:** Prevents duplicate incident reports

## 🔒 Security

- **No sensitive data:** Stack traces are sanitized
- **Rate limiting:** Built-in deduplication
- **Timeout protection:** 5-second request timeout
- **Error handling:** Handler errors don't crash app

## 📚 Examples

See the `examples/` directory for complete working examples:
- Flask application with AIRA handler
- FastAPI application with AIRA handler
- Django application with AIRA handler
- Log file monitoring setup

## 🤝 Contributing

Contributions welcome! Please test your changes with:

```bash
# Run tests
python -m pytest tests/

# Test with real AIRA instance
python test_aira_handler.py
```

## 📄 License

MIT License - see LICENSE file for details

---

**Need help?** Open an issue or check the main [AIRA documentation](../README.md).