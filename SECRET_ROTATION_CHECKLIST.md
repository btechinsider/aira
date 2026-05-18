# 🔐 Secret Rotation Checklist

## ⚠️ CRITICAL: Complete This BEFORE Cleaning Git History

All secrets found in your Git history are **already compromised**. You MUST rotate them immediately.

---

## 📋 Rotation Checklist

### ✅ 1. Groq API Key

**Exposed Key**: `REDACTED_FOR_SECURITY`

**Steps**:
- [ ] Go to https://console.groq.com/keys
- [ ] Click on "API Keys" in the left sidebar
- [ ] Find the exposed key (check creation date/last used)
- [ ] Click "Delete" or "Revoke" on the exposed key
- [ ] Click "Create API Key"
- [ ] Copy the new key
- [ ] Update `.env` file: `GROQ_API_KEY=<new_key>`
- [ ] Test the new key works: `cd backend && python -c "from groq_client import GroqClient; print('OK')"`
- [ ] **DO NOT commit .env file**

**Verification**:
```powershell
# Test new key works
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv('../.env'); from groq_client import GroqClient; client = GroqClient(); print('✅ Groq API key working')"
```

---

### ✅ 2. GitHub Personal Access Token

**Exposed Token**: `REDACTED_FOR_SECURITY`

**Steps**:
- [ ] Go to https://github.com/settings/tokens
- [ ] Find the exposed token (check note/last used date)
- [ ] Click "Delete" on the exposed token
- [ ] Click "Generate new token" → "Generate new token (classic)"
- [ ] Set the same scopes as before (likely: `repo`, `workflow`, `admin:org`)
- [ ] Set expiration (recommend: 90 days)
- [ ] Click "Generate token"
- [ ] Copy the new token immediately (you won't see it again!)
- [ ] Update `.env` file: `GITHUB_TOKEN=<new_token>`
- [ ] Test the new token: `git ls-remote https://<new_token>@github.com/piyush080205/aira.git`
- [ ] **DO NOT commit .env file**

**Verification**:
```powershell
# Test new token works
$env:GITHUB_TOKEN = (Get-Content .env | Select-String "GITHUB_TOKEN" | ForEach-Object { $_.ToString().Split('=')[1] })
git ls-remote https://$env:GITHUB_TOKEN@github.com/piyush080205/aira.git
# Should list refs without error
```

---

### ✅ 3. Slack Webhook URL

**Exposed Webhook**: `REDACTED_FOR_SECURITY`

**Steps**:
- [ ] Go to https://api.slack.com/apps
- [ ] Select your workspace
- [ ] Click on your app (or the app using this webhook)
- [ ] Go to "Incoming Webhooks" in the left sidebar
- [ ] Find the exposed webhook URL
- [ ] Click "Remove" or "Delete" on that webhook
- [ ] Click "Add New Webhook to Workspace"
- [ ] Select the channel to post to
- [ ] Click "Allow"
- [ ] Copy the new webhook URL
- [ ] Update `.env` file: `SLACK_WEBHOOK_URL=<new_webhook_url>`
- [ ] Test the new webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' <new_webhook_url>`
- [ ] **DO NOT commit .env file**

**Verification**:
```powershell
# Test new webhook works
$webhook = (Get-Content .env | Select-String "SLACK_WEBHOOK_URL" | ForEach-Object { $_.ToString().Split('=')[1] })
$body = @{ text = "✅ Webhook rotation test - please ignore" } | ConvertTo-Json
Invoke-RestMethod -Uri $webhook -Method Post -Body $body -ContentType 'application/json'
# Should post a message to your Slack channel
```

---

### ✅ 4. Database Password (Supabase)

**Exposed Password**: `REDACTED_FOR_SECURITY` (URL encoded as `REDACTED_FOR_SECURITY`)

**Steps**:
- [ ] Go to https://supabase.com/dashboard
- [ ] Select your project: `pqxcxnwomnofgqiszaug`
- [ ] Go to "Settings" → "Database"
- [ ] Scroll to "Database Password"
- [ ] Click "Reset Database Password"
- [ ] Generate a new strong password (or use your own)
- [ ] Copy the new password
- [ ] Update `.env` file with new DATABASE_URL:
  ```
  DATABASE_URL=postgresql://postgres.pqxcxnwomnofgqiszaug:<NEW_PASSWORD_URL_ENCODED>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
  ```
- [ ] URL encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
- [ ] Test connection: `cd backend && python -c "from models import init_db; init_db()"`
- [ ] **DO NOT commit .env file**

**Verification**:
```powershell
# Test new database password works
cd backend
python -c "from models import init_db; init_db(); print('✅ Database connection working')"
```

---

## 🔍 Final Verification

After rotating all secrets, verify your `.env` file:

```powershell
# Check .env has all new secrets (DO NOT run this in a terminal that logs history!)
Get-Content .env | Select-String "GROQ_API_KEY|GITHUB_TOKEN|SLACK_WEBHOOK_URL|DATABASE_URL"
```

**Expected output** (with your NEW values):
```
GROQ_API_KEY=gsk_<NEW_52_CHAR_KEY>
GITHUB_TOKEN=ghp_<NEW_36_CHAR_TOKEN>
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/<NEW_WEBHOOK_PATH>
DATABASE_URL=postgresql://postgres.pqxcxnwomnofgqiszaug:<NEW_PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## ✅ Completion Checklist

Before proceeding to clean Git history:

- [ ] Groq API key rotated and tested
- [ ] GitHub token rotated and tested
- [ ] Slack webhook rotated and tested
- [ ] Database password rotated and tested
- [ ] `.env` file updated with all new secrets
- [ ] `.env` file is in `.gitignore` (verify: `git check-ignore .env`)
- [ ] Application tested with new credentials
- [ ] **CONFIRMED: .env file is NOT staged for commit** (verify: `git status`)

---

## 🚨 Important Notes

1. **Never commit .env file** - It should always be in `.gitignore`
2. **Test each credential** after rotation to ensure it works
3. **Keep old credentials** in a secure note temporarily (in case rollback needed)
4. **Update production** if these credentials are used in production
5. **Notify team members** if this is a shared project

---

## 📝 After Rotation

Once all secrets are rotated and verified:

1. ✅ Mark this checklist as complete
2. ➡️ Proceed to `GITHUB_SECRET_REMOVAL_GUIDE.md` Step 2 (Clean Git History)
3. ➡️ Then follow `GITIGNORE_UPDATE.md` to update `.gitignore`
4. ➡️ Finally, force push to GitHub

---

## 🆘 Troubleshooting

### Groq API Key Not Working
- Verify key is copied correctly (52 characters starting with `gsk_`)
- Check Groq console for rate limits or account issues
- Ensure no extra spaces in `.env` file

### GitHub Token Not Working
- Verify token has correct scopes (`repo`, `workflow`)
- Check token hasn't expired
- Ensure token is copied correctly (36 characters starting with `ghp_`)

### Slack Webhook Not Working
- Verify webhook URL is complete (starts with `https://hooks.slack.com/services/`)
- Check webhook is enabled in Slack app settings
- Ensure channel still exists

### Database Connection Failing
- Verify password is URL encoded correctly
- Check Supabase project is active
- Ensure connection string format is correct
- Test with Supabase's connection string from dashboard

---

**Status**: 🔴 NOT STARTED - Complete this checklist FIRST before cleaning Git history!