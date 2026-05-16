# 🪟 AIRA Setup Guide for Windows

Complete guide to set up and run AIRA on Windows.

## 📋 Prerequisites

### 1. Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Install and restart your computer
3. Start Docker Desktop
4. Verify installation:
   ```powershell
   docker --version
   docker-compose --version
   ```

### 2. Get API Keys

You'll need:
- **Groq API Key**: Get from https://console.groq.com
- **GitHub Personal Access Token**: Get from https://github.com/settings/tokens
  - Required scope: `repo`
- **Slack Webhook URL** (optional): Get from https://api.slack.com/messaging/webhooks

## 🚀 Quick Start (One Command!)

### Step 1: Start AIRA

1. Open PowerShell in the `aira` directory:
   ```powershell
   cd D:\Desktop\New folder\aira
   ```

2. Run the start command:
   ```powershell
   .\run.ps1 start
   ```

3. The script will automatically:
   - ✅ Check Docker is running
   - ✅ Create `.env` file from template
   - ✅ Open Notepad for you to add API keys
   - ✅ Build Docker images
   - ✅ Start all services
   - ✅ Verify health checks

4. Edit the `.env` file that opens in Notepad:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GITHUB_TOKEN=github_pat_your_token_here
   GITHUB_REPO=owner/repo
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

5. Save and close Notepad

6. Run the start command again:
   ```powershell
   .\run.ps1 start
   ```

### Step 2: Access AIRA

Open your browser to:
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎯 Testing the Setup

### Test 1: Check Services

```powershell
# View running containers
docker ps

# Check logs
docker-compose -f docker/docker-compose.yml logs -f backend
```

### Test 2: Send Test Incident

```powershell
# Using PowerShell
$body = @{
    message = "Test error from Windows"
    stack_trace = "Error at line 123"
    severity = "P1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/webhook" -Method Post -Body $body -ContentType "application/json"
```

### Test 3: Run Integration Test

```powershell
cd log-monitor\examples
python test_integration.py
```

## 🛠️ Common Commands

All commands use the unified `run.ps1` script:

### Start AIRA
```powershell
.\run.ps1 start
```

### Stop AIRA
```powershell
.\run.ps1 stop
```

### View Logs
```powershell
.\run.ps1 logs
```

### Check Status
```powershell
.\run.ps1 status
```

### Check Health
```powershell
.\run.ps1 health
```

### Restart Services
```powershell
.\run.ps1 restart
```

### Run Tests
```powershell
.\run.ps1 test
```

### Inject Test Bug
```powershell
.\run.ps1 inject-bug
```

### Rebuild Containers
```powershell
.\run.ps1 build
```

### Clean Everything
```powershell
.\run.ps1 clean
```

### Show All Commands
```powershell
.\run.ps1 help
```

## 🔧 Log Monitoring Setup

### Option 1: Python Handler (In Your App)

1. Copy the handler:
   ```powershell
   Copy-Item log-monitor\aira_handler.py C:\path\to\your\project\
   ```

2. Add to your Python application:
   ```python
   from aira_handler import setup_aira_logging
   
   logger = setup_aira_logging(
       aira_url="http://localhost:8000/webhook",
       app_name="my-app"
   )
   
   # Use normally
   logger.error("Something went wrong!")  # Triggers AIRA
   ```

### Option 2: Log File Watcher

1. Install Python dependencies:
   ```powershell
   cd log-monitor
   pip install -r requirements.txt
   ```

2. Run the watcher:
   ```powershell
   python log_watcher.py C:\path\to\app.log --aira-url http://localhost:8000/webhook --app-name my-app
   ```

## 🐛 Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in system tray)
3. Try again

### Port Already in Use

**Error**: `Port 8000 is already allocated`

**Solution**:
```powershell
# Find process using port
netstat -ano | findstr :8000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Services Not Starting

**Solution**:
```powershell
# Check logs
docker-compose -f docker/docker-compose.yml logs

# Restart Docker Desktop
# Then run start-aira.ps1 again
```

### Cannot Access Dashboard

**Solution**:
1. Check if frontend is running:
   ```powershell
   docker ps | findstr frontend
   ```

2. Check frontend logs:
   ```powershell
   docker-compose -f docker/docker-compose.yml logs frontend
   ```

3. Try accessing directly: http://localhost:3000

### Python Not Found

**Error**: `python: command not found`

**Solution**:
1. Install Python from: https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart PowerShell
4. Verify: `python --version`

## 📊 Monitoring

### View Service Status
```powershell
docker-compose -f docker/docker-compose.yml ps
```

### Check Resource Usage
```powershell
docker stats
```

### View Incidents
```powershell
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/incidents" | ConvertTo-Json
```

## 🔒 Security Notes

### Execution Policy

If you get "script execution is disabled" error:

```powershell
# Check current policy
Get-ExecutionPolicy

# Allow scripts (run as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass
PowerShell -ExecutionPolicy Bypass -File .\run.ps1 start
```

### Firewall

If you have firewall issues:
1. Allow Docker Desktop through Windows Firewall
2. Allow ports 3000, 8000, 8001, 8002

## 📈 Performance Tips

### Increase Docker Resources

1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase:
   - CPUs: 4+
   - Memory: 8GB+
   - Disk: 20GB+

### WSL 2 Backend

For better performance:
1. Install WSL 2: https://docs.microsoft.com/en-us/windows/wsl/install
2. Docker Desktop → Settings → General
3. Enable "Use WSL 2 based engine"

## 🎓 Next Steps

1. ✅ AIRA is running
2. 📊 Open dashboard: http://localhost:3000
3. 🧪 Send test incident (see Testing section)
4. 🔧 Integrate with your Python app (see Log Monitoring Setup)
5. 📈 Monitor incidents and review fixes

## 📞 Need Help?

- 📖 Main documentation: [README.md](README.md)
- 🔍 Log monitoring: [LOG_MONITORING_SETUP.md](LOG_MONITORING_SETUP.md)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/aira/issues)

## 🎉 You're All Set!

AIRA is now running on your Windows machine. Errors in your Python applications will be automatically detected, diagnosed, and fixed!

---

**Quick Reference:**
- Start: `.\start-aira.ps1`
- Stop: `.\stop-aira.ps1`
- Dashboard: http://localhost:3000
- API: http://localhost:8000