# AIRA Webhook Integration Troubleshooting Guide

## Issue: External Website Not Sending Incidents to AIRA Dashboard

### Root Cause Analysis

The issue occurs when:
1. Backend database path is misconfigured
2. API key is not created or invalid
3. External website is not sending requests correctly
4. Backend server is not running or accessible

### Solution Steps

## Step 1: Fix Database Configuration

The `.env` file has been updated with the correct database path:
```
DATABASE_URL=sqlite:///./backend/aira.db
```

**Action Required:** Restart the backend server to apply changes.

## Step 2: Restart Backend Server

```powershell
# Stop the current backend (if running)
# Press Ctrl+C in the backend terminal

# Start backend from project root
cd backend
python main.py
```

Or use the provided script:
```powershell
.\run.ps1
```

## Step 3: Create an API Key

After backend restart, you need to create an API key:

1. **Register/Login to AIRA Dashboard:**
   - Go to http://localhost:3001
   - Register a new account or login
   
2. **Generate API Key:**
   - Navigate to Dashboard
   - Look for "API Keys" section
   - Click "Generate New API Key"
   - Copy the generated key (format: `aira_xxxxxxxxxxxxx`)

## Step 4: Configure External Website

Your external website needs to send POST requests to AIRA's webhook endpoint:

### Webhook Endpoint
```
POST http://localhost:8000/webhook
```

### Required Headers
```
Content-Type: application/json
X-API-Key: aira_your_generated_key_here
```

### Request Body Format
```json
{
  "message": "Error message or log entry",
  "stack_trace": "Optional stack trace",
  "severity": "P0|P1|P2|P3"
}
```

### Example Integration Code

#### JavaScript/Node.js
```javascript
async function sendToAIRA(errorMessage, stackTrace = '', severity = 'P1') {
  try {
    const response = await fetch('http://localhost:8000/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'aira_your_generated_key_here'
      },
      body: JSON.stringify({
        message: errorMessage,
        stack_trace: stackTrace,
        severity: severity
      })
    });
    
    const data = await response.json();
    console.log('Incident created:', data.incident_id);
  } catch (error) {
    console.error('Failed to send to AIRA:', error);
  }
}

// Usage in error handler
window.onerror = function(message, source, lineno, colno, error) {
  sendToAIRA(
    message,
    error?.stack || '',
    'P1'
  );
};
```

#### Python/Flask
```python
import requests

def send_to_aira(message, stack_trace='', severity='P1'):
    try:
        response = requests.post(
            'http://localhost:8000/webhook',
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': 'aira_your_generated_key_here'
            },
            json={
                'message': message,
                'stack_trace': stack_trace,
                'severity': severity
            }
        )
        data = response.json()
        print(f"Incident created: {data['incident_id']}")
    except Exception as e:
        print(f"Failed to send to AIRA: {e}")

# Usage in Flask error handler
@app.errorhandler(Exception)
def handle_exception(e):
    send_to_aira(str(e), traceback.format_exc(), 'P1')
    return "Error occurred", 500
```

## Step 5: Test the Integration

### Test with PowerShell
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "aira_your_generated_key_here"
}

$body = @{
    message = "Test error from external website"
    severity = "P1"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/webhook" -Method POST -Headers $headers -Body $body
```

### Test with curl (Git Bash/WSL)
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: aira_your_generated_key_here" \
  -d '{"message": "Test error", "severity": "P1"}'
```

## Step 6: Verify in Dashboard

1. Go to http://localhost:3001
2. Navigate to "Incidents" view
3. You should see the test incident appear
4. Check WebSocket connection status (should show "Connected")

## Common Issues and Solutions

### Issue: "Invalid API key" (401 Unauthorized)
**Solution:** 
- Verify API key is correct
- Check if API key is active in database
- Ensure `X-API-Key` header is included

### Issue: "Connection refused"
**Solution:**
- Verify backend is running on port 8000
- Check firewall settings
- Ensure correct URL (http://localhost:8000)

### Issue: Incidents not appearing in dashboard
**Solution:**
- Check WebSocket connection status
- Refresh the dashboard page
- Check browser console for errors
- Verify backend logs for processing errors

### Issue: Database errors
**Solution:**
- Ensure `DATABASE_URL` in `.env` is correct
- Restart backend server
- Check file permissions on database file

## Production Deployment Notes

For production deployment:

1. **Use HTTPS:** Replace `http://` with `https://`
2. **Update CORS:** Configure specific origins in `backend/main.py`
3. **Secure API Keys:** Store in environment variables
4. **Use Production URL:** Replace `localhost:8000` with your domain
5. **Set up monitoring:** Monitor webhook endpoint health

### Production Webhook URL
```
POST https://your-domain.com/webhook
```

## Monitoring and Debugging

### Check Backend Logs
```powershell
# Backend logs will show:
# - Incoming webhook requests
# - API key validation
# - Incident processing status
# - Any errors
```

### Check Database
```powershell
# View incidents in database
python -c "from backend.models import SessionLocal, Incident; db = SessionLocal(); incidents = db.query(Incident).all(); print(f'Total incidents: {len(incidents)}'); db.close()"
```

### Check API Keys
```powershell
# View API keys in database
python -c "from backend.models import SessionLocal, APIKey; db = SessionLocal(); keys = db.query(APIKey).all(); print(f'Total keys: {len(keys)}'); [print(f'{k.name}: {k.key[:20]}...') for k in keys]; db.close()"
```

## Support

If issues persist:
1. Check backend logs for detailed error messages
2. Verify all environment variables in `.env`
3. Ensure all dependencies are installed
4. Review the API documentation at http://localhost:8000/docs

---

**Last Updated:** 2026-05-17
**Version:** 1.0.0