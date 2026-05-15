#!/bin/bash

# AIRA GitHub Push Script
# This script helps you push your AIRA project to GitHub

set -e  # Exit on error

echo "🚀 AIRA GitHub Push Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if we're in the aira directory
if [ ! -f "README.md" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the aira directory"
    exit 1
fi

print_info "Current directory: $(pwd)"
echo ""

# Step 1: Check for .env file
print_info "Step 1: Checking for sensitive files..."
if [ -f ".env" ]; then
    print_warning ".env file found - it will be ignored by .gitignore"
fi
if [ -f "*.db" ]; then
    print_warning "Database files found - they will be ignored by .gitignore"
fi
print_success "Sensitive files check complete"
echo ""

# Step 2: Initialize git repository
print_info "Step 2: Initializing Git repository..."
if [ -d ".git" ]; then
    print_warning "Git repository already initialized"
else
    git init
    print_success "Git repository initialized"
fi
echo ""

# Step 3: Get GitHub repository URL
print_info "Step 3: GitHub Repository Setup"
echo "Please enter your GitHub repository URL:"
echo "Example: https://github.com/username/aira.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    print_error "Repository URL cannot be empty"
    exit 1
fi

# Check if remote already exists
if git remote | grep -q "origin"; then
    print_warning "Remote 'origin' already exists. Updating..."
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi
print_success "Remote repository configured: $REPO_URL"
echo ""

# Step 4: Check git status
print_info "Step 4: Checking repository status..."
git status --short
echo ""

# Step 5: Stage all files
print_info "Step 5: Staging files..."
git add .
STAGED_FILES=$(git diff --cached --numstat | wc -l)
print_success "Staged $STAGED_FILES files"
echo ""

# Step 6: Show what will be committed
print_info "Files to be committed:"
git diff --cached --name-status | head -20
if [ $(git diff --cached --name-status | wc -l) -gt 20 ]; then
    echo "... and more files"
fi
echo ""

# Step 7: Confirm before committing
read -p "Do you want to proceed with the commit? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    print_warning "Commit cancelled"
    exit 0
fi

# Step 8: Create commit
print_info "Step 6: Creating initial commit..."
git commit -m "feat: initial commit - AIRA v1.0.0

- Autonomous incident response agent with LangGraph
- FastAPI backend with WebSocket support
- React frontend dashboard
- MCP servers for GitHub and incident context
- Docker Compose orchestration
- Complete documentation and testing guides
- CI/CD pipeline with GitHub Actions"

print_success "Commit created successfully"
echo ""

# Step 9: Set main branch
print_info "Step 7: Setting main branch..."
git branch -M main
print_success "Branch set to 'main'"
echo ""

# Step 10: Push to GitHub
print_info "Step 8: Pushing to GitHub..."
echo "This will push your code to: $REPO_URL"
read -p "Continue? (y/n): " PUSH_CONFIRM

if [ "$PUSH_CONFIRM" != "y" ] && [ "$PUSH_CONFIRM" != "Y" ]; then
    print_warning "Push cancelled"
    print_info "You can push manually later with: git push -u origin main"
    exit 0
fi

print_info "Pushing to GitHub..."
if git push -u origin main; then
    print_success "Successfully pushed to GitHub!"
else
    print_error "Push failed. You may need to:"
    echo "  1. Check your GitHub credentials"
    echo "  2. Ensure the repository exists on GitHub"
    echo "  3. Try: git push -u origin main --force (if you're sure)"
    exit 1
fi
echo ""

# Step 11: Create and push tag
print_info "Step 9: Creating release tag..."
read -p "Create v1.0.0 tag? (y/n): " TAG_CONFIRM

if [ "$TAG_CONFIRM" = "y" ] || [ "$TAG_CONFIRM" = "Y" ]; then
    git tag -a v1.0.0 -m "AIRA v1.0.0 - Initial Release"
    git push origin v1.0.0
    print_success "Tag v1.0.0 created and pushed"
fi
echo ""

# Success message
echo "================================"
print_success "🎉 Successfully pushed to GitHub!"
echo "================================"
echo ""
print_info "Next steps:"
echo "  1. Visit your repository: $REPO_URL"
echo "  2. Set up branch protection rules"
echo "  3. Add repository secrets (GROQ_API_KEY, etc.)"
echo "  4. Create a release on GitHub"
echo "  5. Update README.md with your repository URL"
echo ""
print_info "Repository URL: ${REPO_URL%.git}"
echo ""

# Made with Bob
