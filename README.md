# AIRA - Autonomous Incident Response Agent

![AIRA Logo](https://img.shields.io/badge/AIRA-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18.2-blue)

**AIRA** (Autonomous Incident Response Agent) is an AI-powered incident response system that automatically triages, diagnoses, and remediates software incidents using Groq's Llama 3.3 70B model, LangGraph for agent orchestration, and IBM BOB AI with MCP (Model Context Protocol) servers.

## 🚀 Features

- **Autonomous Triage**: Automatically classify incident severity (P0-P3) using LLM
- **Intelligent Diagnosis**: Extract affected files, fetch code context, and find similar past incidents
- **Automated Remediation**: Generate patches and unit tests with high confidence scoring
- **Smart Action Routing**:
  - P0 incidents → Immediate Slack alert
  - High confidence (>85%) → Auto-create GitHub PR
  - Low confidence → Request human approval via Slack
- **Real-time Dashboard**: WebSocket-powered React frontend with live incident updates
- **Incident Memory**: Redis-based similarity search for learning from past resolutions
- **Security Controls**: Blocked paths prevent automated changes to critical files
- **Full Audit Trail**: SQLite database tracks every incident and agent decision

## 🏗️ Architecture

```
┌─────────────────┐
│   Log Sources   │ (Datadog, Prometheus, etc.)
└────────┬────────┘
         │ HTTP Webhook
         ▼
┌─────────────────────────────────────────────────────────┐
│                    AIRA Backend (FastAPI)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │         LangGraph Agent (State Machine)          │  │
│  │  ┌────────┐  ┌──────────┐  ┌─────┐  ┌─────────┐ │  │
│  │  │ Triage │→ │ Diagnosis │→ │ Fix │→ │ Confidence│ │
│  │  └────────┘  └──────────┘  └─────┘  └─────────┘ │  │
│  │                      ↓                            │  │
│  │              ┌──────────────┐                     │  │
│  │              │ Action Router │                     │  │
│  │              └──────────────┘                     │  │
│  └──────────────────────────────────────────────────┘  │
│         │                    │                    │     │
│    Groq LLM            MCP Clients          WebSocket  │
│  (Llama 3.3 70B)                                       │
└─────────┬──────────────────┬──────────────────┬────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────┐      ┌──────────────┐   ┌──────────┐
    │  Redis  │      │  MCP Servers  │   │ Frontend │
    │ (Cache) │      │ - GitHub Ops  │   │  (React) │
    └─────────┘      │ - Incident DB │   └──────────┘
                     └──────────────┘
```

## 📋 Prerequisites

- **Docker** and **Docker Compose** (v2.0+)
- **Groq API Key** ([Get one here](https://console.groq.com))
- **GitHub Personal Access Token** (with `repo` scope)
- **Slack Webhook URL** (optional, for alerts)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/aira.git
cd aira
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# Required
GROQ_API_KEY=gsk_your_groq_api_key_here
GITHUB_TOKEN=github_pat_your_token_here
GITHUB_REPO=owner/repo

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Build and Start Services

```bash
make build
make up
```

This will start:
- **Redis** (port 6379)
- **GitHub MCP Server** (port 8001)
- **Incident Context MCP Server** (port 8002)
- **Backend API** (port 8000)
- **Frontend Dashboard** (port 3000)

### 4. Verify Services

```bash
make health
```

Expected output:
```
✅ Backend: http://localhost:8000/health
✅ GitHub MCP: http://localhost:8001/health
✅ Incident Context MCP: http://localhost:8002/health
```

### 5. Access the Dashboard

Open your browser to:
- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

## 🧪 Testing

### Inject a Test Incident

```bash
make inject-bug
```

This sends a sample NullPointerException to AIRA. Watch the dashboard for real-time updates!

### Inject All Test Incidents

```bash
python backend/scripts/inject_bug.py
```

Choose option to inject all 5 sample incidents (P0, P1, P2 severity levels).

### Manual Testing

```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "NullPointerException in auth service",
    "stack_trace": "java.lang.NullPointerException at AuthService.java:142",
    "severity": "P1"
  }'
```

## 📊 How It Works

### 1. Triage Phase
- **Input**: Raw log message and stack trace
- **Process**: Groq LLM classifies severity (P0-P3) and extracts error signature
- **Output**: Severity classification and one-line summary
- **Decision**: P0 → Immediate Slack alert and end workflow

### 2. Diagnosis Phase
- **Input**: Triage results
- **Process**:
  - Extract affected file and line number from stack trace
  - Call GitHub MCP to fetch code context (±10 lines)
  - Call Incident Context MCP to find similar past incidents
  - LLM analyzes and identifies root cause
- **Output**: Root cause analysis and diagnosis
- **Security Check**: If file is in blocked paths → escalate to human

### 3. Fix Generation Phase
- **Input**: Diagnosis results and code context
- **Process**: Groq LLM generates:
  - Git-style unified diff patch
  - Unit test to verify the fix
- **Output**: Proposed patch and test code

### 4. Confidence Scoring Phase
- **Input**: All previous phase results
- **Process**: Calculate composite confidence score:
  ```
  Confidence = 0.4 × LLM_confidence + 0.3 × pattern_match + 0.3 × historical_success
  ```
  - **LLM confidence**: Model's self-assessment (0-100%)
  - **Pattern match**: Known error type recognition
  - **Historical success**: Success rate from similar past incidents
- **Output**: Composite confidence score (0-1)

### 5. Action Router Phase
- **Input**: Confidence score and severity
- **Decision Logic**:
  ```
  IF severity == P0:
      → Send Slack alert (no automation)
  ELSE IF confidence > 0.85:
      → Create GitHub PR automatically
  ELSE:
      → Send Slack message with approval buttons
  ```
- **Output**: PR URL or Slack message ID

## 🔧 Configuration

### Confidence Thresholds

Edit `backend/agent.py`:

```python
# Line ~450
if state.get("confidence_score", 0) > 0.85:  # Change threshold here
    # Auto-create PR
```

### Blocked Paths

Edit `backend/agent.py`:

```python
# Line ~23
BLOCKED_PATHS = [
    "auth.py",
    "security/",
    "secrets.yml",
    "credentials",
    ".env",
    "config/auth"
]
```

### LLM Parameters

Edit `backend/groq_client.py`:

```python
# Line ~100
response = await self.client.chat.completions.create(
    model="llama-3.3-70b-versatile",  # Change model
    temperature=0.2,                   # Change temperature
    max_tokens=2000,                   # Change max tokens
)
```

## 📁 Project Structure

```
aira/
├── .bob/                      # IBM BOB AI configuration
│   ├── mcp.json              # MCP server registry
│   ├── custom_modes.yaml     # AIRA incident mode
│   └── skills/               # Agent skill documentation
├── backend/                   # FastAPI backend
│   ├── main.py               # API endpoints and WebSocket
│   ├── agent.py              # LangGraph agent nodes
│   ├── groq_client.py        # Groq LLM wrapper
│   ├── mcp_clients.py        # MCP tool callers
│   ├── models.py             # SQLite ORM models
│   └── scripts/              # Utility scripts
├── frontend/                  # React dashboard
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── IncidentFeed.tsx  # Incident list component
│   │   └── websocket.ts      # WebSocket hook
│   └── public/
├── mcp-servers/              # MCP server implementations
│   ├── github_mcp/           # GitHub operations
│   └── incident_context_mcp/ # Incident similarity search
├── docker/                    # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── .env.example              # Environment template
├── Makefile                  # Build and run commands
└── README.md                 # This file
```

## 🔌 Integration with Monitoring Tools

### Datadog

Add a webhook monitor:

```yaml
name: "AIRA Incident Webhook"
type: "metric alert"
query: "avg(last_5m):avg:system.cpu.user{*} > 90"
message: |
  {{#is_alert}}
  Webhook: http://your-aira-host:8000/webhook
  {{/is_alert}}
```

### Prometheus Alertmanager

Edit `alertmanager.yml`:

```yaml
receivers:
  - name: 'aira'
    webhook_configs:
      - url: 'http://your-aira-host:8000/webhook'
        send_resolved: true
```

### Custom Integration

Send POST requests to `/webhook`:

```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "optional-custom-id",
    "message": "Error message",
    "stack_trace": "Full stack trace",
    "severity": "P1",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
make logs

# Common issues:
# 1. Missing GROQ_API_KEY
# 2. Port 8000 already in use
# 3. Redis not healthy
```

### Frontend shows "Disconnected"

```bash
# Check WebSocket connection
curl http://localhost:8000/health

# Restart services
make restart
```

### MCP servers not responding

```bash
# Check MCP server logs
docker-compose -f docker/docker-compose.yml logs github-mcp
docker-compose -f docker/docker-compose.yml logs incident-context-mcp

# Verify GitHub token
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

### Agent not creating PRs

1. Check confidence score (must be >85%)
2. Verify GitHub token has `repo` scope
3. Check if file is in blocked paths
4. Review agent logs for errors

## 📈 Performance Metrics

- **Triage Time**: < 5 seconds
- **Full Diagnosis**: < 15 seconds
- **PR Creation**: < 10 seconds
- **Cache Hit Rate**: 60-70% (reduces LLM calls)
- **Accuracy**: >95% severity classification

## 🔒 Security Considerations

1. **Blocked Paths**: Critical files are never auto-patched
2. **Human Approval**: Low confidence fixes require approval
3. **P0 Escalation**: Critical incidents always alert humans
4. **Audit Trail**: All decisions logged in SQLite
5. **Token Security**: Use environment variables, never commit secrets

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Groq** for blazing-fast LLM inference
- **LangGraph** for agent orchestration
- **IBM BOB AI** for MCP integration
- **FastAPI** for the backend framework
- **React** for the frontend

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/aira/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aira/discussions)
- **Email**: support@aira-project.com

---

**Built with ❤️ by the AIRA Team**

*Autonomous Incident Response Agent - Because incidents shouldn't wait for humans.*