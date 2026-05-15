# AIRA PowerShell Runner Script for Windows
# Alternative to Makefile for Windows users

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host ""
    Write-Host "AIRA - Autonomous Incident Response Agent" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  .\run.ps1 build        - Build all Docker containers"
    Write-Host "  .\run.ps1 up           - Start all services"
    Write-Host "  .\run.ps1 down         - Stop all services"
    Write-Host "  .\run.ps1 logs         - View logs from all services"
    Write-Host "  .\run.ps1 restart      - Restart all services"
    Write-Host "  .\run.ps1 clean        - Remove all containers and volumes"
    Write-Host "  .\run.ps1 status       - Show service status"
    Write-Host "  .\run.ps1 health       - Check service health"
    Write-Host "  .\run.ps1 inject-bug   - Inject a test incident"
    Write-Host ""
}

function Build-Containers {
    Write-Host "Building AIRA containers..." -ForegroundColor Green
    $envFile = Join-Path $PSScriptRoot ".env"
    docker-compose -f docker/docker-compose.yml --env-file $envFile build
}

function Start-Services {
    Write-Host "Starting AIRA services..." -ForegroundColor Green
    $envFile = Join-Path $PSScriptRoot ".env"
    docker-compose -f docker/docker-compose.yml --env-file $envFile up -d
    Write-Host ""
    Write-Host "AIRA is starting up!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "   Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Wait ~30 seconds for all services to be healthy, then run:" -ForegroundColor Yellow
    Write-Host "   .\run.ps1 inject-bug" -ForegroundColor Yellow
}

function Stop-Services {
    Write-Host "Stopping AIRA services..." -ForegroundColor Yellow
    $envFile = Join-Path $PSScriptRoot ".env"
    docker-compose -f docker/docker-compose.yml --env-file $envFile down
}

function Show-Logs {
    Write-Host "Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    $envFile = Join-Path $PSScriptRoot ".env"
    docker-compose -f docker/docker-compose.yml --env-file $envFile logs -f
}

function Restart-Services {
    Write-Host "Restarting AIRA services..." -ForegroundColor Yellow
    $envFile = Join-Path $PSScriptRoot ".env"
    docker-compose -f docker/docker-compose.yml --env-file $envFile restart
}

function Clean-All {
    Write-Host "WARNING: This will remove all AIRA containers, volumes, and images!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host "Cleaning up..." -ForegroundColor Yellow
        $envFile = Join-Path $PSScriptRoot ".env"
        docker-compose -f docker/docker-compose.yml --env-file $envFile down -v --rmi all
        Write-Host "Cleanup complete" -ForegroundColor Green
    } else {
        Write-Host "Cancelled" -ForegroundColor Yellow
    }
}

function Show-Status {
    Write-Host "AIRA Service Status:" -ForegroundColor Cyan
    $envFile = Join-Path $PSScriptRoot ".env"
    docker-compose -f docker/docker-compose.yml --env-file $envFile ps
}

function Check-Health {
    Write-Host "Checking service health..." -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Backend API:" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
        Write-Host "  Status: OK" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } catch {
        Write-Host "  Status: NOT RESPONDING" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "GitHub MCP:" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5
        Write-Host "  Status: OK" -ForegroundColor Green
    } catch {
        Write-Host "  Status: NOT RESPONDING" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Incident Context MCP:" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8002/health" -TimeoutSec 5
        Write-Host "  Status: OK" -ForegroundColor Green
    } catch {
        Write-Host "  Status: NOT RESPONDING" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Frontend:" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        Write-Host "  Status: OK" -ForegroundColor Green
    } catch {
        Write-Host "  Status: NOT RESPONDING" -ForegroundColor Red
    }
}

function Inject-Bug {
    Write-Host "Injecting test incident..." -ForegroundColor Green
    python backend/scripts/inject_bug.py 0
}

# Main command router
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "build" { Build-Containers }
    "up" { Start-Services }
    "down" { Stop-Services }
    "logs" { Show-Logs }
    "restart" { Restart-Services }
    "clean" { Clean-All }
    "status" { Show-Status }
    "health" { Check-Health }
    "inject-bug" { Inject-Bug }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}

# Made with Bob
