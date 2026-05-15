#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validation script to check AIRA system setup
"""
import os
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def check_file(path, description):
    """Check if a file exists"""
    if Path(path).exists():
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ MISSING {description}: {path}")
        return False

def check_directory(path, description):
    """Check if a directory exists"""
    if Path(path).is_dir():
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ MISSING {description}: {path}")
        return False

def main():
    print("\n" + "="*70)
    print("AIRA System Validation")
    print("="*70 + "\n")
    
    all_good = True
    
    # Check directories
    print("[DIR] Checking Directory Structure...")
    dirs = [
        (".bob/skills", "BOB Skills Directory"),
        ("backend/scripts", "Backend Scripts"),
        ("frontend/src", "Frontend Source"),
        ("frontend/public", "Frontend Public"),
        ("mcp-servers/github_mcp", "GitHub MCP Server"),
        ("mcp-servers/incident_context_mcp", "Incident Context MCP"),
        ("docker", "Docker Configuration"),
    ]
    
    for path, desc in dirs:
        all_good &= check_directory(path, desc)
    
    print("\n[FILE] Checking Backend Files...")
    backend_files = [
        ("backend/requirements.txt", "Backend Requirements"),
        ("backend/models.py", "Database Models"),
        ("backend/groq_client.py", "Groq LLM Client"),
        ("backend/mcp_clients.py", "MCP Client Manager"),
        ("backend/agent.py", "LangGraph Agent"),
        ("backend/main.py", "FastAPI Backend"),
        ("backend/scripts/inject_bug.py", "Bug Injection Script"),
        ("backend/scripts/install-bob-noninteractive.sh", "BOB Install Script"),
    ]
    
    for path, desc in backend_files:
        all_good &= check_file(path, desc)
    
    print("\n[FILE] Checking MCP Server Files...")
    mcp_files = [
        ("mcp-servers/github_mcp/server.py", "GitHub MCP Server"),
        ("mcp-servers/github_mcp/requirements.txt", "GitHub MCP Requirements"),
        ("mcp-servers/github_mcp/Dockerfile", "GitHub MCP Dockerfile"),
        ("mcp-servers/incident_context_mcp/server.py", "Incident Context Server"),
        ("mcp-servers/incident_context_mcp/requirements.txt", "Incident Context Requirements"),
        ("mcp-servers/incident_context_mcp/Dockerfile", "Incident Context Dockerfile"),
    ]
    
    for path, desc in mcp_files:
        all_good &= check_file(path, desc)
    
    print("\n[FILE] Checking Frontend Files...")
    frontend_files = [
        ("frontend/package.json", "Package.json"),
        ("frontend/vite.config.ts", "Vite Config"),
        ("frontend/tsconfig.json", "TypeScript Config"),
        ("frontend/tailwind.config.js", "Tailwind Config"),
        ("frontend/src/App.tsx", "Main App Component"),
        ("frontend/src/IncidentFeed.tsx", "Incident Feed Component"),
        ("frontend/src/websocket.ts", "WebSocket Hook"),
        ("frontend/src/main.tsx", "Main Entry Point"),
        ("frontend/src/index.css", "Styles"),
        ("frontend/public/index.html", "HTML Template"),
    ]
    
    for path, desc in frontend_files:
        all_good &= check_file(path, desc)
    
    print("\n[FILE] Checking Docker Files...")
    docker_files = [
        ("docker/docker-compose.yml", "Docker Compose"),
        ("docker/Dockerfile.backend", "Backend Dockerfile"),
        ("docker/Dockerfile.frontend", "Frontend Dockerfile"),
    ]
    
    for path, desc in docker_files:
        all_good &= check_file(path, desc)
    
    print("\n[FILE] Checking BOB AI Configuration...")
    bob_files = [
        (".bob/mcp.json", "MCP Configuration"),
        (".bob/custom_modes.yaml", "Custom Modes"),
        (".bob/skills/triage_agent.md", "Triage Skill"),
        (".bob/skills/github_ops.md", "GitHub Ops Skill"),
    ]
    
    for path, desc in bob_files:
        all_good &= check_file(path, desc)
    
    print("\n[FILE] Checking Configuration Files...")
    config_files = [
        (".env.example", "Environment Template"),
        ("Makefile", "Makefile"),
        ("README.md", "README"),
    ]
    
    for path, desc in config_files:
        all_good &= check_file(path, desc)
    
    # Summary
    print("\n" + "="*70)
    if all_good:
        print("[OK] ALL FILES PRESENT - System is ready!")
        print("\n[NEXT] Next Steps:")
        print("   1. cd aira")
        print("   2. cp .env.example .env")
        print("   3. Edit .env with your API keys")
        print("   4. make build")
        print("   5. make up")
        print("   6. make inject-bug")
        print("   7. Open http://localhost:3000")
    else:
        print("[ERROR] SOME FILES ARE MISSING - Please check the errors above")
        sys.exit(1)
    print("="*70 + "\n")

if __name__ == "__main__":
    main()

# Made with Bob
