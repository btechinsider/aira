# AIRA User Onboarding Guide
## Complete Guide to Getting Started with AIRA

---

## 📋 Table of Contents
1. [What is AIRA?](#what-is-aira)
2. [Quick Start](#quick-start)
3. [Account Creation](#account-creation)
4. [Getting Your Webhook URL](#getting-your-webhook-url)
5. [Integration Guides](#integration-guides)
6. [Admin Dashboard](#admin-dashboard)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## 🤖 What is AIRA?

**AIRA (Autonomous Incident Response Agent)** is an AI-powered incident response system that:
- ✅ Automatically detects and analyzes errors from your applications
- ✅ Provides intelligent root cause analysis using AI
- ✅ Suggests fixes with confidence scores
- ✅ Creates GitHub PRs automatically for high-confidence fixes
- ✅ Sends Slack alerts for critical incidents
- ✅ Supports 8+ programming languages

---

## 🚀 Quick Start

### Step 1: Access AIRA
Navigate to your AIRA instance:
```
https://your-aira-instance.com
```

### Step 2: Create an Account
Click "Sign Up" and provide:
- Email address
- Username
- Password
- Full name (optional)

### Step 3: Get Your API Key
After logging in:
1. Go to **Dashboard** → **API Keys**
2. Click **"Create New API Key"**
3. Give it a name (e.g., "Production App")
4. Copy the generated API key (you won't see it again!)

### Step 4: Get Your Webhook URL
Your webhook URL format:
```
https://your-aira-instance.com/webhook
```

### Step 5: Integrate with Your App
Choose your language and follow the integration guide:
- [Python](#python-integration)
- [JavaScript/Node.js](#javascript-integration)
- [Java](#java-integration)
- [Go](#go-integration)

---

## 👤 Account Creation

### Registration Process

1. **Navigate to Sign Up Page**
   ```
   https://your-aira-instance.com/auth/register
   ```

2. **Fill in Your Details**
   ```json
   {
     "email": "your.email@company.com",
     "username": "your_username",
     "password": "secure_password_123",
     "full_name": "Your Full Name"
   }
   ```

3. **Receive JWT Token**
   Upon successful registration, you'll receive:
   - Access token (valid for 7 days)
   - User information
   - Automatic login

### Login Process

**Endpoint:** `POST /auth/login`

```bash
curl -X POST https://your-aira-instance.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "your.email@company.com",
    "username": "your_username",
    "is_admin": false
  }
}
```

---

## 🔑 Getting Your Webhook URL

### Method 1: Via API

**Create API Key:**
```bash
curl -X POST https://your-aira-instance.com/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production App",
    "expires_in_days": 365
  }'
```

**Response:**
```json
{
  "id": "key-uuid",
  "key": "aira_abc123xyz789...",
  "name": "Production App",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2025-01-15T10:30:00Z"
}
```

### Method 2: Via Dashboard (Coming Soon)

1. Login to AIRA Dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **"Generate New Key"**
4. Copy your webhook URL and API key

### Your Complete Webhook Configuration

```
Webhook URL: https://your-aira-instance.com/webhook
API Key: aira_abc123xyz789...
```

---

## 📚 Integration Guides

### Python Integration

**Installation:**
```bash
pip install requests
```

**Code:**
```python
import logging
import requests
import traceback
from datetime import datetime

class AIRAHandler(logging.Handler):
    def __init__(self, webhook_url: str, api_key: str):
        super().__init__()
        self.webhook_url = webhook_url
        self.api_key = api_key
        self.setLevel(logging.ERROR)
    
    def emit(self, record):
        try:
            log_entry = {
                "message": self.format(record),
                "stack_trace": ''.join(traceback.format_exception(*record.exc_info)) if record.exc_info else "",
                "severity": "P1" if record.levelno >= logging.ERROR else "P2",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            requests.post(self.webhook_url, json=log_entry, headers=headers, timeout=5)
        except:
            pass

# Usage
aira = AIRAHandler(
    webhook_url="https://your-aira-instance.com/webhook",
    api_key="aira_your_api_key_here"
)
logging.getLogger().addHandler(aira)
```

### JavaScript/Node.js Integration

**Installation:**
```bash
npm install axios
```

**Code:**
```javascript
const axios = require('axios');

class AIRALogger {
    constructor(webhookUrl, apiKey) {
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
    }

    async logError(error, context = {}) {
        try {
            await axios.post(this.webhookUrl, {
                message: error.message,
                stack_trace: error.stack || '',
                severity: 'P1',
                timestamp: new Date().toISOString(),
                ...context
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                timeout: 5000
            });
        } catch (err) {
            console.error('AIRA logging failed:', err.message);
        }
    }
}

// Usage
const aira = new AIRALogger(
    'https://your-aira-instance.com/webhook',
    'aira_your_api_key_here'
);

process.on('uncaughtException', async (error) => {
    await aira.logError(error);
    process.exit(1);
});
```

### Get More Integration Guides

**API Endpoint:**
```bash
curl "https://your-aira-instance.com/integration/guides/python?webhook_url=YOUR_URL&api_key=YOUR_KEY"
```

**Available Languages:**
- Python
- JavaScript/Node.js
- Java
- Go
- Ruby (Coming Soon)
- PHP (Coming Soon)
- C# (Coming Soon)

---

## 🎛️ Admin Dashboard

### API Key Management

**List All Your API Keys:**
```bash
curl -X GET https://your-aira-instance.com/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Toggle API Key Status:**
```bash
curl -X PATCH https://your-aira-instance.com/auth/api-keys/{key_id}/toggle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Delete API Key:**
```bash
curl -X DELETE https://your-aira-instance.com/auth/api-keys/{key_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Viewing Incidents

**List Recent Incidents:**
```bash
curl -X GET "https://your-aira-instance.com/incidents?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Specific Incident:**
```bash
curl -X GET https://your-aira-instance.com/incidents/{incident_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **401 Unauthorized Error**

**Problem:** Webhook returns 401 status

**Solutions:**
- ✅ Verify API key is correct
- ✅ Check `X-API-Key` header is included
- ✅ Ensure API key hasn't expired
- ✅ Confirm API key is active (not disabled)

**Test Your API Key:**
```bash
curl -X POST https://your-aira-instance.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "message": "Test error",
    "stack_trace": "Test stack trace",
    "severity": "P2"
  }'
```

#### 2. **Incidents Not Appearing**

**Problem:** Errors sent but not visible in dashboard

**Solutions:**
- ✅ Check webhook URL is correct
- ✅ Verify network connectivity
- ✅ Check application logs for errors
- ✅ Ensure JSON payload is valid
- ✅ Confirm severity level is set

**Debug Request:**
```bash
# Add verbose logging
curl -v -X POST https://your-aira-instance.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"message": "Debug test", "severity": "P2"}'
```

#### 3. **Too Many Incidents**

**Problem:** Dashboard flooded with incidents

**Solutions:**
- ✅ Adjust logging level to ERROR only
- ✅ Add error filtering in your handler
- ✅ Use rate limiting
- ✅ Group similar errors

**Python Example:**
```python
aira_handler.setLevel(logging.ERROR)  # Only ERROR and CRITICAL
```

#### 4. **Slow Application Performance**

**Problem:** AIRA integration causing delays

**Solutions:**
- ✅ Use async/non-blocking requests
- ✅ Implement request timeout (5 seconds recommended)
- ✅ Use background tasks/queues for high-volume apps
- ✅ Batch multiple errors if needed

#### 5. **Missing Stack Traces**

**Problem:** Incidents show no stack trace

**Solutions:**
- ✅ Ensure `exc_info=True` in Python logging
- ✅ Pass Error objects (not strings) in JavaScript
- ✅ Use proper exception handling
- ✅ Check stack trace extraction logic

---

## ✨ Best Practices

### 1. **API Key Security**

- ✅ Store API keys in environment variables
- ✅ Never commit API keys to version control
- ✅ Rotate keys regularly (every 90-180 days)
- ✅ Use different keys for dev/staging/production
- ✅ Disable unused keys immediately

**Example (.env file):**
```bash
AIRA_WEBHOOK_URL=https://your-aira-instance.com/webhook
AIRA_API_KEY=aira_your_api_key_here
```

### 2. **Error Severity Levels**

Use appropriate severity levels:

| Severity | When to Use | Example |
|----------|-------------|---------|
| **P0** | Critical system failures | Database down, payment system failure |
| **P1** | Major errors affecting users | Authentication failures, data corruption |
| **P2** | Moderate errors | API timeouts, validation errors |
| **P3** | Minor issues | Warnings, deprecation notices |

### 3. **Context Information**

Include helpful context with errors:

```python
aira.logError(error, {
    "user_id": "12345",
    "action": "checkout",
    "environment": "production",
    "version": "1.2.3"
})
```

### 4. **Rate Limiting**

For high-traffic applications:

```python
from time import time

class RateLimitedAIRAHandler(AIRAHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.last_sent = {}
        self.rate_limit = 60  # seconds
    
    def emit(self, record):
        error_hash = hash(record.getMessage())
        now = time()
        
        if error_hash in self.last_sent:
            if now - self.last_sent[error_hash] < self.rate_limit:
                return  # Skip duplicate within rate limit
        
        self.last_sent[error_hash] = now
        super().emit(record)
```

### 5. **Testing Integration**

Always test before deploying:

```bash
# Test webhook connectivity
curl -X POST https://your-aira-instance.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "message": "Integration test",
    "stack_trace": "Test trace",
    "severity": "P3"
  }'

# Expected response:
# {"incident_id": "...", "status": "processing", "message": "Incident received"}
```

---

## 📞 Support

### Getting Help

1. **Documentation:** Check all guides in `/docs`
2. **API Reference:** Visit `/docs` endpoint for interactive API docs
3. **Integration Guides:** Use `/integration/guides/{language}` endpoint
4. **GitHub Issues:** Report bugs or request features

### Useful Endpoints

- **Health Check:** `GET /health`
- **API Docs:** `GET /docs`
- **Integration Guides:** `GET /integration/guides`
- **User Info:** `GET /auth/me`

---

## 🎓 Next Steps

1. ✅ Create your account
2. ✅ Generate API key
3. ✅ Integrate with your application
4. ✅ Test with a sample error
5. ✅ Monitor the dashboard
6. ✅ Configure GitHub/Slack integrations (optional)
7. ✅ Set up team access (if admin)

**Welcome to AIRA! 🚀**

---

*Made with ❤️ by the AIRA Team*