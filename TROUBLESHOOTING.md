# AIRA Troubleshooting Guide

## 🔴 Common Issues and Solutions

### Issue 1: "failed to connect to the docker API"

**Error Message:**
```
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
The system cannot find the file specified.
```

**Solution:**
1. **Start Docker Desktop**
   - Open Docker Desktop from Start Menu
   - Wait for Docker to fully start (whale icon in system tray should be steady, not animated)
   - You should see "Docker Desktop is running" in the system tray

2. **Verify Docker is Running**
   ```powershell
   docker ps
   ```
   Should show an empty list (not an error)

3. **If Docker Desktop won't start:**
   - Restart your computer
   - Check if WSL 2 is enabled (Docker Desktop requires it)
   - Run: `wsl --update` in PowerShell (as Administrator)

---

### Issue 2: Environment Variables Not Set

**Warning Messages:**
```
The "GROQ_API_KEY" variable is not set. Defaulting to a blank string.
The "GITHUB_TOKEN" variable is not set. Defaulting to a blank string.
```

**Solution:**

1. **Edit the .env file:**
   ```powershell
   notepad .env
   ```

2. **Add your actual API keys:**
   ```bash
   # Required - Get from https://console.groq.com
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   
   # Required - Get from https://github.com/settings/tokens
   GITHUB_TOKEN=github_pat_your_actual_token_here
   
   # Required - Your GitHub repository
   GITHUB_REPO=yourusername/yourrepo
   
   # Optional - Get from Slack workspace settings
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   
   # These are set automatically by Docker
   REDIS_URL=redis://redis:6379
   DATABASE_URL=sqlite:///./aira.db
   GITHUB_MCP_URL=http://github-mcp:8000
   INCIDENT_CONTEXT_MCP_URL=http://incident-context-mcp:8000
   ```

3. **Save the file and try again:**
   ```powershell
   .\run.ps1 build
   ```

---

### Issue 3: Docker Compose Version Warning

**Warning Message:**
```
the attribute `version` is obsolete, it will be ignored
```

**Solution:**
This is just a warning and can be safely ignored. Docker Compose v2 doesn't require the version field.

To remove the warning, you can edit `docker/docker-compose.yml` and remove the first line (`version: '3.8'`).

---

### Issue 4: Port Already in Use

**Error Message:**
```
Bind for 0.0.0.0:8000 failed: port is already allocated
```

**Solution:**

1. **Find what's using the port:**
   ```powershell
   netstat -ano | findstr :8000
   ```

2. **Stop the process or change AIRA's ports:**
   Edit `docker/docker-compose.yml` and change port mappings:
   ```yaml
   ports:
     - "8080:8000"  # Change 8000 to 8080 (or any free port)
   ```

---

### Issue 5: Build Fails with "No Space Left"

**Error Message:**
```
no space left on device
```

**Solution:**

1. **Clean up Docker:**
   ```powershell
   docker system prune -a --volumes
   ```

2. **Free up disk space** on your C: drive

---

### Issue 6: Frontend Build Fails

**Error Message:**
```
npm ERR! code ELIFECYCLE
```

**Solution:**

1. **Check Node.js version in Dockerfile:**
   The frontend uses Node 18. If issues persist, try Node 20:
   
   Edit `docker/Dockerfile.frontend`:
   ```dockerfile
   FROM node:20-alpine AS builder
   ```

2. **Rebuild:**
   ```powershell
   .\run.ps1 build
   ```

---

## ✅ Pre-Flight Checklist

Before running AIRA, verify:

- [ ] Docker Desktop is **installed** and **running**
- [ ] `.env` file has **real API keys** (not placeholders)
- [ ] Ports 3000, 6379, 8000, 8001, 8002 are **available**
- [ ] You have at least **5GB free disk space**
- [ ] WSL 2 is **enabled** (for Docker Desktop on Windows)

---

## 🔍 Diagnostic Commands

### Check Docker Status
```powershell
# Should show version, not error
docker --version

# Should show empty list or running containers
docker ps

# Should show Docker info
docker info
```

### Check Environment Variables
```powershell
# View .env file
Get-Content .env

# Check if variables are loaded (after starting containers)
docker-compose -f docker/docker-compose.yml config
```

### Check Service Health
```powershell
# After starting services
.\run.ps1 health

# Or manually
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
```

### View Logs
```powershell
# All services
.\run.ps1 logs

# Specific service
docker-compose -f docker/docker-compose.yml logs backend
docker-compose -f docker/docker-compose.yml logs frontend
docker-compose -f docker/docker-compose.yml logs github-mcp
```

---

## 🆘 Still Having Issues?

### 1. Complete Clean Restart
```powershell
# Stop everything
.\run.ps1 down

# Remove all containers and volumes
.\run.ps1 clean

# Restart Docker Desktop

# Rebuild from scratch
.\run.ps1 build
.\run.ps1 up
```

### 2. Check System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk**: 10GB free space
- **Docker Desktop**: Latest version
- **WSL 2**: Enabled and updated

### 3. Enable WSL 2 (if not enabled)
```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2
wsl --update
```

Restart your computer after enabling WSL 2.

---

## 📞 Getting Help

If you're still stuck:

1. **Check Docker Desktop logs:**
   - Open Docker Desktop
   - Click Settings → Troubleshoot → View logs

2. **Check AIRA logs:**
   ```powershell
   .\run.ps1 logs > aira-logs.txt
   ```

3. **Verify file structure:**
   ```powershell
   python validate.py
   ```

4. **Create an issue** with:
   - Error message
   - Output of `docker --version`
   - Output of `docker info`
   - Contents of `aira-logs.txt`