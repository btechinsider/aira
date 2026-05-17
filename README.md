# 🤖 AIRA - AI-Powered Incident Response Agent

AIRA (AI-Powered Incident Response Agent) is an intelligent system that monitors, analyzes, and responds to incidents in real-time using advanced AI capabilities.

## ✨ Features

- 🔍 **Real-time Incident Monitoring**: Continuous monitoring of logs and system events
- 🧠 **AI-Powered Analysis**: Uses Groq LLM for intelligent incident analysis
- 🔄 **Automated Response**: Suggests and executes remediation actions
- 📊 **Interactive Dashboard**: Real-time visualization of incidents and system health
- 🔐 **Secure Authentication**: JWT-based authentication system
- 🐙 **GitHub Integration**: Automatic issue creation and tracking
- 💬 **Slack Notifications**: Real-time alerts to your team
- 🔌 **MCP Integration**: Model Context Protocol for enhanced AI capabilities

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional, for containerized deployment)
- Groq API key
- GitHub Personal Access Token

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/aira.git
cd aira
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start with Docker (Recommended)**
```bash
make build
make up
make health
```

4. **Or start manually**

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🌐 Deployment

### Deploy to Render (Recommended)

AIRA is optimized for deployment on Render.com with one-click setup.

**📖 See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment guide.**

#### Quick Deploy

1. Fork this repository
2. Sign up at [render.com](https://render.com)
3. Click "New" → "Blueprint"
4. Connect your repository
5. Configure environment variables
6. Click "Apply"

**What gets deployed:**
- ✅ Backend API (Python/FastAPI)
- ✅ Frontend (React/Vite)
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ MCP Servers (optional)

**Pricing:**
- Free tier available
- Production: ~$31/month

### Other Deployment Options

- **Docker**: See [DEPLOYMENT.md](./DEPLOYMENT.md#docker-deployment)
- **AWS/GCP/Azure**: See [DEPLOYMENT.md](./DEPLOYMENT.md#cloud-deployment)
- **Kubernetes**: See [DEPLOYMENT.md](./DEPLOYMENT.md#kubernetes)

## 📚 Documentation

- [Quick Start Guide](./QUICK_START.md)
- [User Guide](./USER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Render Deployment](./RENDER_DEPLOYMENT.md) ⭐
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Contributing](./CONTRIBUTING.md)

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│   Backend API   │◄────►│   Redis      │
│  (FastAPI)      │      │   Cache      │
└────────┬────────┘      └──────────────┘
         │
         ├──────────────┐
         ↓              ↓
┌─────────────────┐  ┌──────────────┐
│   PostgreSQL    │  │  MCP Servers │
│   Database      │  │  (GitHub,    │
└─────────────────┘  │   Context)   │
                     └──────────────┘
```

## 🛠️ Technology Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- LangGraph (AI agent framework)
- Groq (LLM provider)
- Redis (caching)
- PostgreSQL (database)

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- WebSocket (real-time updates)

**Infrastructure:**
- Docker & Docker Compose
- Render (recommended hosting)
- GitHub Actions (CI/CD)

## 🔑 Environment Variables

Required environment variables:

```bash
# API Keys
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
GITHUB_REPO=owner/repository

# Database (automatically set by Render)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
LOG_LEVEL=INFO
```

See [.env.example](./.env.example) for complete configuration.

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest

# Run frontend tests
cd frontend
npm test

# Run integration tests
make test
```

## 📊 Monitoring

AIRA includes built-in monitoring endpoints:

- Health: `GET /health`
- Metrics: `GET /metrics`
- Ready: `GET /ready`

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./USER_GUIDE.md)
- 🐛 [Issue Tracker](https://github.com/YOUR_USERNAME/aira/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/aira/discussions)
- 📧 Email: support@aira-project.com

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast LLM inference
- [Render](https://render.com) for excellent hosting platform
- [LangChain](https://langchain.com) for AI framework
- All our contributors and users

## 🗺️ Roadmap

- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Custom incident rules engine
- [ ] Mobile app
- [ ] Integration with more monitoring tools
- [ ] AI model fine-tuning

---

**Built with ❤️ by the AIRA Team**

⭐ Star us on GitHub if you find AIRA useful!