.PHONY: help build up down logs restart clean test inject-bug

help:
	@echo "AIRA - Autonomous Incident Response Agent"
	@echo ""
	@echo "Available commands:"
	@echo "  make build        - Build all Docker containers"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - View logs from all services"
	@echo "  make restart      - Restart all services"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make test         - Run tests"
	@echo "  make inject-bug   - Inject a test incident"
	@echo "  make shell-backend - Open shell in backend container"
	@echo "  make shell-redis  - Open Redis CLI"

build:
	@echo "Building AIRA containers..."
	docker-compose -f docker/docker-compose.yml build

up:
	@echo "Starting AIRA services..."
	docker-compose -f docker/docker-compose.yml up -d
	@echo ""
	@echo "✅ AIRA is starting up!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend API: http://localhost:8000"
	@echo "   Backend Docs: http://localhost:8000/docs"
	@echo ""
	@echo "Wait ~30 seconds for all services to be healthy, then run:"
	@echo "   make inject-bug"

down:
	@echo "Stopping AIRA services..."
	docker-compose -f docker/docker-compose.yml down

logs:
	docker-compose -f docker/docker-compose.yml logs -f

restart:
	@echo "Restarting AIRA services..."
	docker-compose -f docker/docker-compose.yml restart

clean:
	@echo "⚠️  This will remove all AIRA containers, volumes, and images!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose -f docker/docker-compose.yml down -v --rmi all
	@echo "✅ Cleanup complete"

test:
	@echo "Running tests..."
	docker-compose -f docker/docker-compose.yml exec backend pytest -v

inject-bug:
	@echo "Injecting test incident..."
	python backend/scripts/inject_bug.py 0

inject-all:
	@echo "Injecting all test incidents..."
	python backend/scripts/inject_bug.py

shell-backend:
	docker-compose -f docker/docker-compose.yml exec backend /bin/bash

shell-redis:
	docker-compose -f docker/docker-compose.yml exec redis redis-cli

status:
	@echo "AIRA Service Status:"
	@docker-compose -f docker/docker-compose.yml ps

health:
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health | python -m json.tool || echo "❌ Backend not responding"
	@curl -s http://localhost:8001/health | python -m json.tool || echo "❌ GitHub MCP not responding"
	@curl -s http://localhost:8002/health | python -m json.tool || echo "❌ Incident Context MCP not responding"

dev-backend:
	@echo "Starting backend in development mode..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Starting frontend in development mode..."
	cd frontend && npm run dev

# Made with Bob
