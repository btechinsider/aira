# PowerShell script to stop AIRA on Windows
# Usage: .\stop-aira.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stopping AIRA Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ All services stopped" -ForegroundColor Green
} else {
    Write-Host "⚠ Some services may still be running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To start AIRA again, run: .\start-aira.ps1" -ForegroundColor White
Write-Host ""

# Made with Bob
