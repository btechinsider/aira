# 🔒 GitHub Secret Removal Guide

## ⚠️ CRITICAL: Exposed Secrets Detected

GitHub's push protection has blocked your push because **real API keys and tokens** were found in your Bob session files.

---

## 🚨 Immediate Actions Required

### Step 1: Rotate ALL Compromised Credentials (DO THIS FIRST!)

Since these secrets are in your Git history, they are **already compromised**. You MUST rotate them immediately:

#### 1.1 Groq API Key
**Exposed Key**: `REDACTED_FOR_SECURITY`

**Action**:
1. Go to https://console.groq.com/keys
2. Delete the exposed key
3. Generate a new API key
4. Update your `.env` file with the new key
5. **DO NOT commit the new key to Git**

#### 1.2 GitHub Personal Access Token
**Exposed Token**: `REDACTED_FOR_SECURITY`

**Action**:
1. Go to https://github.com/settings/tokens
2. Find and delete the exposed token
3. Generate a new Personal Access Token with the same permissions
4. Update your `.env` file with the new token
5. **DO NOT commit the new token to Git**

#### 1.3 Slack Webhook URL
**Exposed Webhook**: `REDACTED_FOR_SECURITY`

**Action**:
1. Go to your Slack workspace settings
2. Navigate to Apps → Incoming Webhooks
3. Delete the exposed webhook
4. Create a new incoming webhook
5. Update your `.env` file with the new webhook URL
6. **DO NOT commit the new webhook to Git**

#### 1.4 Database Password (Also Exposed)
**Exposed in DATABASE_URL**: `REDACTED_FOR_SECURITY`

**Action**:
1. Go to your Supabase dashboard
2. Change your database password
3. Update your `.env` file with the new connection string
4. **DO NOT commit the new connection string to Git**

---

## 🧹 Step 2: Clean Your Git History

You have **3 options** to remove secrets from Git history:

### Option A: Use BFG Repo-Cleaner (Recommended - Fastest)

```powershell
# 1. Install BFG (if not already installed)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# Or use Chocolatey: choco install bfg-repo-cleaner

# 2. Create a file with secrets to remove
@"
REDACTED_FOR_SECURITY
REDACTED_FOR_SECURITY
REDACTED_FOR_SECURITY
REDACTED_FOR_SECURITY
"@ | Out-File -FilePath secrets.txt -Encoding UTF8

# 3. Clone a fresh copy of your repo (backup)
cd ..
git clone --mirror https://github.com/piyush080205/aira.git aira-backup.git

# 4. Run BFG to remove secrets
cd aira
bfg --replace-text secrets.txt

# 5. Clean up Git history
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Force push (this will rewrite history)
git push --force

# 7. Clean up
Remove-Item secrets.txt
```

### Option B: Use git-filter-repo (More Control)

```powershell
# 1. Install git-filter-repo
pip install git-filter-repo

# 2. Create a replacements file
@"
REDACTED_FOR_SECURITY==>GROQ_API_KEY_REDACTED
REDACTED_FOR_SECURITY==>GITHUB_TOKEN_REDACTED
REDACTED_FOR_SECURITY==>SLACK_WEBHOOK_REDACTED
REDACTED_FOR_SECURITY==>PASSWORD_REDACTED
"@ | Out-File -FilePath replacements.txt -Encoding UTF8

# 3. Run git-filter-repo
git filter-repo --replace-text replacements.txt --force

# 4. Re-add remote (filter-repo removes it)
git remote add origin https://github.com/piyush080205/aira.git

# 5. Force push
git push --force --all

# 6. Clean up
Remove-Item replacements.txt
```

### Option C: Delete bob_sessions and Start Fresh (Nuclear Option)

```powershell
# 1. Remove bob_sessions directory
Remove-Item -Recurse -Force bob_sessions

# 2. Commit the removal
git add .
git commit -m "Remove bob_sessions directory containing exposed secrets"

# 3. Clean Git history
git filter-branch --force --index-filter `
  "git rm -rf --cached --ignore-unmatch bob_sessions" `
  --prune-empty --tag-name-filter cat -- --all

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push --force --all
```

---

## 🛡️ Step 3: Prevent Future Exposure

### 3.1 Update .gitignore

Add these patterns to your `.gitignore`:

```gitignore
# Sensitive session files
bob_sessions/
.bob/sessions/
*_session*.md
*_task_*.md

# Environment files
.env
.env.local
.env.*.local

# Secrets and credentials
secrets.txt
credentials.json
*.pem
*.key
*.cert

# IDE and editor files
.vscode/settings.json
.idea/
```

### 3.2 Use Git Secrets Tool

```powershell
# Install git-secrets
# Download from: https://github.com/awslabs/git-secrets

# Initialize in your repo
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'gsk_[A-Za-z0-9]{52}'  # Groq API keys
git secrets --add 'ghp_[A-Za-z0-9]{36}'  # GitHub tokens
git secrets --add 'https://hooks.slack.com/services/[A-Z0-9/]+'  # Slack webhooks
```

### 3.3 Use Pre-commit Hooks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check for common secret patterns
if git diff --cached | grep -E "(gsk_|ghp_|GROQ_API_KEY|GITHUB_TOKEN|SLACK_WEBHOOK)"; then
    echo "❌ ERROR: Potential secret detected in commit!"
    echo "Please remove secrets before committing."
    exit 1
fi

exit 0
```

Make it executable:
```powershell
# On Windows, use Git Bash or WSL
chmod +x .git/hooks/pre-commit
```

---

## 📋 Step 4: Verification Checklist

After completing the above steps, verify:

- [ ] All compromised credentials have been rotated
- [ ] New credentials are stored ONLY in `.env` (not committed)
- [ ] `.env` is in `.gitignore`
- [ ] Git history has been cleaned (no secrets in `git log -p`)
- [ ] `bob_sessions/` is in `.gitignore`
- [ ] Force push completed successfully
- [ ] GitHub push protection no longer blocks pushes
- [ ] Pre-commit hooks are installed and working

---

## 🔍 Step 5: Verify Secrets Are Removed

```powershell
# Search for any remaining secrets in Git history
git log -p | Select-String "gsk_"
git log -p | Select-String "ghp_"
git log -p | Select-String "hooks.slack.com"

# If any results appear, repeat Step 2
```

---

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [git-secrets](https://github.com/awslabs/git-secrets)

---

## ⚠️ Important Notes

1. **Force pushing rewrites history** - Coordinate with team members if this is a shared repository
2. **All team members** must re-clone the repository after force push
3. **Rotate credentials BEFORE cleaning history** - Once in Git history, assume they're compromised
4. **Test your application** after rotating credentials to ensure everything still works
5. **Consider using a secrets manager** (AWS Secrets Manager, HashiCorp Vault, etc.) for production

---

## 🆘 If You Need Help

If you encounter issues:
1. Check GitHub's secret scanning documentation
2. Contact GitHub Support if you need help with push protection
3. Use the "allow secret" URLs provided by GitHub (NOT RECOMMENDED - only for false positives)

---

## ✅ Quick Start (Recommended Path)

```powershell
# 1. FIRST: Rotate all credentials (see Step 1)

# 2. THEN: Choose ONE cleanup method:

# Option A - BFG (Fastest)
bfg --replace-text secrets.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Option B - Delete bob_sessions (Simplest)
Remove-Item -Recurse -Force bob_sessions
git add .
git commit -m "Remove bob_sessions with exposed secrets"
git filter-branch --force --index-filter "git rm -rf --cached --ignore-unmatch bob_sessions" --prune-empty --tag-name-filter cat -- --all
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all

# 3. Update .gitignore
Add-Content .gitignore "`nbob_sessions/`n.env`n"
git add .gitignore
git commit -m "Update .gitignore to prevent future secret exposure"
git push

# 4. Verify
git log -p | Select-String "gsk_"  # Should return nothing
```

---

**Remember**: Security is not optional. Take the time to do this properly! 🔒