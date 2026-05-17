# 🚀 AIRA Deployment Guide

This guide provides step-by-step instructions for deploying AIRA to various environments.

## 📋 Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Render Deployment](#render-deployment) ⭐ **Recommended**
- [Cloud Deployment](#cloud-deployment)
- [Production Checklist](#production-checklist)

## 🏠 Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/aira.git
cd aira

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start services
make build
make up

# Verify health
make health
```

### Development Mode

**Backend only:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend only:**
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build all services
docker-compose -f docker/docker-compose.yml build

# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### Individual Container Deployment

**Backend:**
```bash
docker build -f docker/Dockerfile.backend -t aira-backend:latest .
docker run -d \
  --name aira-backend \
  -p 8000:8000 \
  --env-file .env \
  aira-backend:latest
```

**Frontend:**
```bash
docker build -f docker/Dockerfile.frontend -t aira-frontend:latest .
docker run -d \
  --name aira-frontend \
  -p 3000:3000 \
  aira-frontend:latest
```

## ☁️ Render Deployment

### Quick Deploy to Render (Recommended)

Render is the recommended platform for deploying AIRA due to its simplicity, automatic deployments, and excellent PostgreSQL/Redis support.

**📖 See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete Render deployment guide.**

#### Quick Start

1. **Fork the repository** to your GitHub account

2. **Sign up for Render** at [render.com](https://render.com)

3. **Deploy using Blueprint**:
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the AIRA repository
   - Render will detect `render.yaml` and create all services

4. **Configure environment variables**:
   - `GROQ_API_KEY`: Your Groq API key
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `GITHUB_REPO`: Format `owner/repository`
   - `SLACK_WEBHOOK_URL`: (Optional) Slack webhook

5. **Deploy**: Click "Apply" and wait for services to start

#### What Gets Deployed

- ✅ Backend API (Python/FastAPI)
- ✅ Frontend (React/Vite)
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ GitHub MCP Server (optional)
- ✅ Incident Context MCP Server (optional)

#### Pricing

- **Free Tier**: $0/month (with limitations)
- **Starter**: ~$31/month (recommended for production)
- **Pro**: ~$95/month (for high traffic)

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed pricing and setup instructions.

---

## ☁️ Other Cloud Deployments

### AWS ECS

1. **Create ECR repositories:**
```bash
aws ecr create-repository --repository-name aira-backend
aws ecr create-repository --repository-name aira-frontend
aws ecr create-repository --repository-name aira-github-mcp
aws ecr create-repository --repository-name aira-incident-context-mcp
```

2. **Build and push images:**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -f docker/Dockerfile.backend -t YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/aira-backend:latest .
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/aira-backend:latest
```

3. **Create ECS task definition and service**

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/aira-backend

# Deploy
gcloud run deploy aira-backend \
  --image gcr.io/PROJECT_ID/aira-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=your_key
```

### Azure Container Instances

```bash
# Create resource group
az group create --name aira-rg --location eastus

# Create container registry
az acr create --resource-group aira-rg --name airaregistry --sku Basic

# Build and push
az acr build --registry airaregistry --image aira-backend:latest -f docker/Dockerfile.backend .

# Deploy
az container create \
  --resource-group aira-rg \
  --name aira-backend \
  --image airaregistry.azurecr.io/aira-backend:latest \
  --dns-name-label aira-backend \
  --ports 8000
```

### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aira-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aira-backend
  template:
    metadata:
      labels:
        app: aira-backend
    spec:
      containers:
      - name: backend
        image: your-registry/aira-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: GROQ_API_KEY
          valueFrom:
            secretKeyRef:
              name: aira-secrets
              key: groq-api-key
---
apiVersion: v1
kind: Service
metadata:
  name: aira-backend-service
spec:
  selector:
    app: aira-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s/deployment.yaml
```

## ✅ Production Checklist

### Security

- [ ] Environment variables stored securely (AWS Secrets Manager, etc.)
- [ ] HTTPS/TLS enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Database backups enabled
- [ ] Secrets rotation policy in place

### Monitoring

- [ ] Application logs centralized (CloudWatch, Datadog, etc.)
- [ ] Health check endpoints configured
- [ ] Alerting set up for critical errors
- [ ] Performance monitoring enabled
- [ ] Resource usage tracking

### Scalability

- [ ] Auto-scaling configured
- [ ] Load balancer set up
- [ ] Database connection pooling
- [ ] Redis cluster for high availability
- [ ] CDN for frontend assets

### Reliability

- [ ] Multi-region deployment (if needed)
- [ ] Backup and disaster recovery plan
- [ ] Rolling deployment strategy
- [ ] Rollback procedure documented
- [ ] Incident response plan

### Performance

- [ ] Database indexes optimized
- [ ] Caching strategy implemented
- [ ] API response times monitored
- [ ] Frontend bundle size optimized
- [ ] Image optimization

### Compliance

- [ ] Data retention policy
- [ ] Privacy policy compliance
- [ ] Audit logging enabled
- [ ] Access control configured
- [ ] Regular security audits

## 🔧 Environment Variables

### Required

```bash
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
GITHUB_REPO=owner/repo
```

### Optional

```bash
SLACK_WEBHOOK_URL=your_slack_webhook
REDIS_URL=redis://redis:6379
DATABASE_URL=sqlite:///./aira.db
LOG_LEVEL=INFO
```

## 📊 Monitoring Endpoints

- Health: `GET /health`
- Metrics: `GET /metrics`
- Ready: `GET /ready`

## 🔄 CI/CD Pipeline

GitHub Actions automatically:
- Runs tests on push
- Builds Docker images
- Scans for vulnerabilities
- Deploys to staging (on main branch)

## 🆘 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs aira-backend

# Check environment variables
docker exec aira-backend env
```

### Database connection issues
```bash
# Verify Redis is running
docker exec aira-redis redis-cli ping

# Check database file permissions
ls -la aira.db
```

### High memory usage
```bash
# Monitor container resources
docker stats

# Adjust memory limits in docker-compose.yml
```

## 📞 Support

For deployment issues:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Open an issue on GitHub
- Contact: support@aira-project.com

---

**Happy Deploying!** 🚀