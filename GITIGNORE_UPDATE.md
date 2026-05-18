# .gitignore Update Instructions

## Add These Lines to Your .gitignore

Add the following lines to your `.gitignore` file to prevent future secret exposure:

```gitignore
# Bob AI session files (may contain secrets)
bob_sessions/
.bob/sessions/
*_session*.md
*_task_*.md

# Additional secret patterns
secrets.txt
credentials.json
*.pem
*.key
*.cert
config.local.*

# IDE settings that may contain secrets
.vscode/settings.json
```

## How to Update

### Option 1: Manual Edit
1. Open `.gitignore` in your editor
2. Scroll to the bottom (after line 81: "# Made with Bob")
3. Add the lines above
4. Save the file

### Option 2: PowerShell Command
```powershell
@"

# Bob AI session files (may contain secrets)
bob_sessions/
.bob/sessions/
*_session*.md
*_task_*.md

# Additional secret patterns
secrets.txt
credentials.json
*.pem
*.key
*.cert
config.local.*

# IDE settings that may contain secrets
.vscode/settings.json
"@ | Add-Content .gitignore
```

### Option 3: Git Bash / WSL
```bash
cat >> .gitignore << 'EOF'

# Bob AI session files (may contain secrets)
bob_sessions/
.bob/sessions/
*_session*.md
*_task_*.md

# Additional secret patterns
secrets.txt
credentials.json
*.pem
*.key
*.cert
config.local.*

# IDE settings that may contain secrets
.vscode/settings.json
EOF
```

## Verify the Update

```powershell
# Check if bob_sessions is now ignored
git check-ignore bob_sessions/
# Should output: bob_sessions/

# Check if .env is still ignored
git check-ignore .env
# Should output: .env
```

## After Updating

1. Commit the .gitignore changes:
```powershell
git add .gitignore
git commit -m "Update .gitignore to prevent secret exposure in bob_sessions"
```

2. **DO NOT push yet** - First complete the secret removal steps in `GITHUB_SECRET_REMOVAL_GUIDE.md`