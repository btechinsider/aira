# AIRA GitHub Push Script (PowerShell)
# This script helps you push your AIRA project to GitHub

$ErrorActionPreference = "Stop"

Write-Host "🚀 AIRA GitHub Push Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor White
}

# Check if we're in the aira directory
if (-not (Test-Path "README.md") -or -not (Test-Path "backend")) {
    Print-Error "Please run this script from the aira directory"
    exit 1
}

Print-Info "Current directory: $(Get-Location)"
Write-Host ""

# Step 1: Check for .env file
Print-Info "Step 1: Checking for sensitive files..."
if (Test-Path ".env") {
    Print-Warning ".env file found - it will be ignored by .gitignore"
}
if (Test-Path "*.db") {
    Print-Warning "Database files found - they will be ignored by .gitignore"
}
Print-Success "Sensitive files check complete"
Write-Host ""

# Step 2: Initialize git repository
Print-Info "Step 2: Initializing Git repository..."
if (Test-Path ".git") {
    Print-Warning "Git repository already initialized"
} else {
    git init
    Print-Success "Git repository initialized"
}
Write-Host ""

# Step 3: Get GitHub repository URL
Print-Info "Step 3: GitHub Repository Setup"
Write-Host "https://github.com/piyush080205/aira.git"
Write-Host "Example: https://github.com/username/aira.git"
$REPO_URL = Read-Host "Repository URL"

if ([string]::IsNullOrWhiteSpace($REPO_URL)) {
    Print-Error "Repository URL cannot be empty"
    exit 1
}

# Check if remote already exists
$remotes = git remote
if ($remotes -contains "origin") {
    Print-Warning "Remote 'origin' already exists. Updating..."
    git remote set-url origin $REPO_URL
} else {
    git remote add origin $REPO_URL
}
Print-Success "Remote repository configured: $REPO_URL"
Write-Host ""

# Step 4: Check git status
Print-Info "Step 4: Checking repository status..."
git status --short
Write-Host ""

# Step 5: Stage all files
Print-Info "Step 5: Staging files..."
git add .
$stagedFiles = (git diff --cached --numstat | Measure-Object).Count
Print-Success "Staged $stagedFiles files"
Write-Host ""

# Step 6: Show what will be committed
Print-Info "Files to be committed:"
$files = git diff --cached --name-status
$files | Select-Object -First 20
if ($files.Count -gt 20) {
    Write-Host "... and more files"
}
Write-Host ""

# Step 7: Confirm before committing
$CONFIRM = Read-Host "Do you want to proceed with the commit? (y/n)"
if ($CONFIRM -ne "y" -and $CONFIRM -ne "Y") {
    Print-Warning "Commit cancelled"
    exit 0
}

# Step 8: Create commit
Print-Info "Step 6: Creating initial commit..."
git commit -m "feat: initial commit - AIRA v1.0.0

- Autonomous incident response agent with LangGraph
- FastAPI backend with WebSocket support
- React frontend dashboard
- MCP servers for GitHub and incident context
- Docker Compose orchestration
- Complete documentation and testing guides
- CI/CD pipeline with GitHub Actions"

Print-Success "Commit created successfully"
Write-Host ""

# Step 9: Set main branch
Print-Info "Step 7: Setting main branch..."
git branch -M main
Print-Success "Branch set to 'main'"
Write-Host ""

# Step 10: Push to GitHub
Print-Info "Step 8: Pushing to GitHub..."
Write-Host "This will push your code to: $REPO_URL"
$PUSH_CONFIRM = Read-Host "Continue? (y/n)"

if ($PUSH_CONFIRM -ne "y" -and $PUSH_CONFIRM -ne "Y") {
    Print-Warning "Push cancelled"
    Print-Info "You can push manually later with: git push -u origin main"
    exit 0
}

Print-Info "Pushing to GitHub..."
try {
    git push -u origin main
    Print-Success "Successfully pushed to GitHub!"
} catch {
    Print-Error "Push failed. You may need to:"
    Write-Host "  1. Check your GitHub credentials"
    Write-Host "  2. Ensure the repository exists on GitHub"
    Write-Host "  3. Try: git push -u origin main --force (if you're sure)"
    exit 1
}
Write-Host ""

# Step 11: Create and push tag
Print-Info "Step 9: Creating release tag..."
$TAG_CONFIRM = Read-Host "Create v1.0.0 tag? (y/n)"

if ($TAG_CONFIRM -eq "y" -or $TAG_CONFIRM -eq "Y") {
    git tag -a v1.0.0 -m "AIRA v1.0.0 - Initial Release"
    git push origin v1.0.0
    Print-Success "Tag v1.0.0 created and pushed"
}
Write-Host ""

# Success message
Write-Host "================================" -ForegroundColor Green
Print-Success "🎉 Successfully pushed to GitHub!"
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Print-Info "Next steps:"
Write-Host "  1. Visit your repository: $REPO_URL"
Write-Host "  2. Set up branch protection rules"
Write-Host "  3. Add repository secrets (GROQ_API_KEY, etc.)"
Write-Host "  4. Create a release on GitHub"
Write-Host "  5. Update README.md with your repository URL"
Write-Host ""
$repoUrlClean = $REPO_URL -replace '\.git$', ''
Print-Info "Repository URL: $repoUrlClean"
Write-Host ""

# Made with Bob
