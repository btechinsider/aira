# AIRA User Guide

## Welcome to AIRA

**AIRA** (Autonomous Incident Response Agent) is an AI-powered system that automatically detects, diagnoses, and resolves software incidents. This guide will help you get started and make the most of AIRA's capabilities.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Registration & Login](#user-registration--login)
4. [Managing API Keys](#managing-api-keys)
5. [Setting Up Integrations](#setting-up-integrations)
6. [Understanding Incidents](#understanding-incidents)
7. [Monitoring Incident Resolution](#monitoring-incident-resolution)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Getting Started

### Prerequisites

Before using AIRA, ensure you have:
- Access to the AIRA web interface (default: `http://localhost:3000`)
- A valid email address for registration
- Admin access to your log monitoring system (Datadog, Prometheus, etc.)
- GitHub repository access (for automated PR creation)

### First-Time Setup

1. **Access the Dashboard**
   - Open your browser and navigate to `http://localhost:3000`
   - You'll see the AIRA login page

2. **Create Your Account**
   - Click "Register" or "Sign Up"
   - Fill in your details:
     - Email address
     - Username
     - Password (minimum 8 characters)
     - Full name (optional)
   - Click "Create Account"

3. **Verify Your Setup**
   - After registration, you'll be automatically logged in
   - You should see the main dashboard with an empty incident list

---

## Dashboard Overview

The AIRA dashboard provides a real-time view of all incidents and their resolution status.

### Main Components

#### 1. **Navigation Bar**
Located at the top of the screen:
- **AIRA Logo**: Click to return to the main dashboard
- **Incidents**: View all incidents
- **API Keys**: Manage your API keys
- **Integrations**: Set up log monitoring integrations
- **User Menu**: Access profile settings and logout

#### 2. **Incident Feed**
The central area displays all incidents in real-time:
- **Live Updates**: New incidents appear automatically via WebSocket
- **Status Indicators**: Color-coded badges show incident status
  - 🔴 **P0**: Critical - Immediate attention required
  - 🟠 **P1**: High - Urgent resolution needed
  - 🟡 **P2**: Medium - Should be addressed soon
  - 🟢 **P3**: Low - Can be scheduled for later
- **Resolution Status**:
  - ⏳ **Processing**: AIRA is analyzing the incident
  - ✅ **Resolved**: Fix has been applied
  - 🚨 **Escalated**: Requires human intervention
  - ⏸️ **Pending**: Awaiting approval

#### 3. **Incident Details Panel**
Click any incident to view detailed information:
- **Triage Summary**: AI-generated incident overview
- **Diagnosis**: Root cause analysis
- **Proposed Fix**: Suggested solution
- **Confidence Score**: AI's confidence in the diagnosis (0-100%)
- **Affected Files**: Code files involved
- **Stack Trace**: Full error stack trace
- **Action Taken**: What AIRA did (PR created, Slack alert, etc.)

#### 4. **Filters and Search**
- **Severity Filter**: Show only P0, P1, P2, or P3 incidents
- **Status Filter**: Filter by resolution status
- **Date Range**: View incidents from specific time periods
- **Search**: Find incidents by error message or file name

---

## User Registration & Login

### Creating an Account

1. Navigate to the registration page
2. Enter your details:
   ```
   Email: user@company.com
   Username: johndoe
   Password: ********
   Full Name: John Doe
   ```
3. Click "Register"
4. You'll receive a JWT token and be logged in automatically

### Logging In

1. Go to the login page
2. Enter your username and password
3. Click "Login"
4. Your session will remain active for 7 days

### Password Requirements

- Minimum 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, and symbols
- Passwords are securely hashed using bcrypt

### Forgot Password?

Currently, password reset must be done by an administrator. Contact your AIRA admin to reset your password.

---

## Managing API Keys

API keys are used to authenticate webhook requests from your log monitoring systems.

### Creating an API Key

1. Click **"API Keys"** in the navigation bar
2. Click **"Create New API Key"**
3. Fill in the details:
   - **Name**: Descriptive name (e.g., "Production Datadog")
   - **Expiration**: Choose expiration period
     - 30 days
     - 90 days
     - 1 year
     - Never (not recommended for production)
4. Click **"Generate Key"**
5. **⚠️ IMPORTANT**: Copy the API key immediately
   - Format: `aira_abc123def456...`
   - This is the only time you'll see the full key
   - Store it securely (password manager, secrets vault)

### Using API Keys

Include your API key in webhook requests:

```bash
curl -X POST http://localhost:8000/webhook \
  -H "X-API-Key: aira_abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Error in UserService",
    "stack_trace": "...",
    "severity": "error"
  }'
```

### Managing Existing Keys

**View All Keys**:
- Navigate to the API Keys page
- See all your keys with their status and last used time

**Deactivate a Key**:
1. Find the key in the list
2. Click the toggle switch to deactivate
3. The key will stop working immediately
4. You can reactivate it later if needed

**Delete a Key**:
1. Click the trash icon next to the key
2. Confirm deletion
3. **⚠️ This action cannot be undone**

### Security Best Practices

✅ **DO**:
- Create separate keys for each environment (dev, staging, prod)
- Set expiration dates for production keys
- Rotate keys every 90 days
- Store keys in environment variables or secrets managers
- Deactivate unused keys

❌ **DON'T**:
- Share keys between team members
- Commit keys to version control
- Use the same key across multiple services
- Leave expired keys active

---

## Setting Up Integrations

AIRA integrates with popular log monitoring platforms to automatically receive incident notifications.

### Supported Platforms

- Datadog
- Prometheus + Alertmanager
- Grafana
- Splunk
- ELK Stack (Elasticsearch, Logstash, Kibana)
- New Relic

### Integration Steps

#### 1. **Access Integration Guides**
- Click **"Integrations"** in the navigation bar
- Select your platform from the list
- Follow the platform-specific instructions

#### 2. **Configure Webhook in Your Platform**

**Example: Datadog**

1. In Datadog, go to **Integrations → Webhooks**
2. Click **"New Webhook"**
3. Configure:
   ```
   Name: AIRA Incident Handler
   URL: http://your-aira-server:8000/webhook
   ```
4. Add custom headers:
   ```
   X-API-Key: aira_your_api_key_here
   Content-Type: application/json
   ```
5. Set the payload template:
   ```json
   {
     "message": "$EVENT_TITLE",
     "stack_trace": "$EVENT_MSG",
     "severity": "$ALERT_STATUS",
     "timestamp": "$DATE"
   }
   ```
6. Save the webhook

#### 3. **Test the Integration**

1. Trigger a test alert in your monitoring platform
2. Check the AIRA dashboard for the new incident
3. Verify that incident details are populated correctly

#### 4. **Configure Alert Rules**

Set up rules in your monitoring platform to send specific types of errors to AIRA:
- Application exceptions
- Service failures
- Performance degradations
- Security alerts

---

## Understanding Incidents

### Incident Lifecycle

```
1. Detection → 2. Triage → 3. Diagnosis → 4. Fix Generation → 5. Action → 6. Resolution
```

#### 1. **Detection**
- Log monitoring system detects an error
- Webhook sends event to AIRA
- Incident is created in the database

#### 2. **Triage** (AI-Powered)
- AIRA analyzes the error message and stack trace
- Assigns severity level (P0-P3)
- Generates initial summary
- Estimated time: 5-10 seconds

#### 3. **Diagnosis** (AI-Powered)
- Extracts affected files and line numbers
- Fetches relevant code context from GitHub
- Searches for similar past incidents
- Identifies root cause
- Estimated time: 10-20 seconds

#### 4. **Fix Generation** (AI-Powered)
- Generates code patch to fix the issue
- Creates unit tests for the fix
- Calculates confidence score
- Estimated time: 15-30 seconds

#### 5. **Action Routing** (Rule-Based)
AIRA takes different actions based on severity and confidence:

| Severity | Confidence | Action |
|----------|-----------|--------|
| P0 | Any | Immediate Slack alert to on-call team |
| P1-P3 | >85% | Auto-create GitHub PR with fix |
| P1-P3 | 70-85% | Send Slack message requesting approval |
| P1-P3 | <70% | Escalate to human for manual review |

#### 6. **Resolution**
- PR is merged (manual or auto)
- Incident marked as resolved
- Solution stored for future reference

### Severity Levels Explained

**P0 - Critical**
- System is down or severely degraded
- Data loss or corruption risk
- Security breach
- **Response**: Immediate Slack alert
- **Example**: Database connection failure, authentication system down

**P1 - High**
- Major feature broken
- Significant user impact
- Performance severely degraded
- **Response**: Auto-fix if high confidence, otherwise alert
- **Example**: Payment processing failure, API endpoint returning 500

**P2 - Medium**
- Minor feature broken
- Limited user impact
- Workaround available
- **Response**: Auto-fix if high confidence
- **Example**: Image upload failing, search results incomplete

**P3 - Low**
- Cosmetic issues
- Minimal user impact
- Nice-to-have fixes
- **Response**: Auto-fix and schedule for next release
- **Example**: Typo in UI, minor styling issue

### Confidence Scores

AIRA calculates confidence based on three factors:

1. **LLM Confidence** (40% weight)
   - How confident the AI model is in its diagnosis
   - Based on pattern recognition and code analysis

2. **Pattern Match Score** (30% weight)
   - Similarity to known error patterns
   - Historical incident database matching

3. **Historical Score** (30% weight)
   - Success rate of similar fixes in the past
   - Learning from previous resolutions

**Overall Confidence Interpretation**:
- **90-100%**: Very high confidence - safe for auto-fix
- **80-89%**: High confidence - auto-fix with monitoring
- **70-79%**: Medium confidence - request approval
- **Below 70%**: Low confidence - escalate to human

---

## Monitoring Incident Resolution

### Real-Time Updates

The dashboard uses WebSocket connections to provide live updates:

1. **Incident Created**
   - New incident appears at the top of the feed
   - Status: "Processing"
   - Progress indicator shows current stage

2. **Triage Complete**
   - Severity badge appears
   - Initial summary is displayed
   - Progress: 25%

3. **Diagnosis Complete**
   - Root cause identified
   - Affected files highlighted
   - Progress: 50%

4. **Fix Generated**
   - Proposed solution displayed
   - Confidence score shown
   - Progress: 75%

5. **Action Taken**
   - PR link appears (if created)
   - Slack notification sent (if applicable)
   - Progress: 100%
   - Status: "Resolved" or "Pending Approval"

### Viewing Incident Details

Click any incident card to open the details panel:

**Triage Tab**:
- Severity level
- Initial assessment
- Timestamp

**Diagnosis Tab**:
- Root cause analysis
- Affected files with line numbers
- Similar past incidents
- Code context

**Fix Tab**:
- Proposed code changes (diff view)
- Generated unit tests
- Confidence breakdown

**Actions Tab**:
- PR link (if created)
- Slack message status
- Manual actions required

### Filtering and Searching

**Filter by Severity**:
```
Click: [All] [P0] [P1] [P2] [P3]
```

**Filter by Status**:
```
Click: [All] [Processing] [Resolved] [Escalated] [Pending]
```

**Search**:
```
Type: "NullPointerException" or "UserService.java"
```

**Date Range**:
```
Select: [Last Hour] [Last 24 Hours] [Last Week] [Custom]
```

---

## Best Practices

### For Developers

1. **Review Auto-Generated PRs**
   - Even high-confidence fixes should be reviewed
   - Check for edge cases and side effects
   - Run full test suite before merging

2. **Provide Feedback**
   - If a fix is incorrect, document why
   - This helps AIRA learn and improve
   - Use GitHub PR comments for context

3. **Monitor Confidence Trends**
   - Track confidence scores over time
   - Identify patterns in low-confidence incidents
   - Adjust thresholds if needed

4. **Keep Code Context Rich**
   - Write clear error messages
   - Include relevant context in exceptions
   - Add comments for complex logic

### For DevOps/SRE

1. **Configure Appropriate Alerts**
   - Don't send every log line to AIRA
   - Focus on actionable errors
   - Use severity levels correctly

2. **Set Up Proper Routing**
   - P0 incidents should page on-call
   - P1-P2 can be handled during business hours
   - P3 can be batched for sprint planning

3. **Monitor AIRA Performance**
   - Track resolution times
   - Monitor confidence score trends
   - Review escalation rates

4. **Maintain API Keys**
   - Rotate keys quarterly
   - Use separate keys per environment
   - Audit key usage regularly

### For Team Leads

1. **Establish Workflows**
   - Define who reviews auto-generated PRs
   - Set SLAs for different severity levels
   - Create escalation procedures

2. **Track Metrics**
   - Mean time to resolution (MTTR)
   - Auto-fix success rate
   - Incident recurrence rate
   - Team time saved

3. **Continuous Improvement**
   - Review low-confidence incidents weekly
   - Identify patterns in escalations
   - Update blocked paths as needed

---

## Troubleshooting

### Common Issues

#### Issue: "API Key Invalid"

**Symptoms**: Webhook returns 401 Unauthorized

**Solutions**:
1. Verify the API key is correct (copy-paste carefully)
2. Check if the key is active (not deactivated)
3. Ensure the key hasn't expired
4. Confirm the header name is `X-API-Key` (case-sensitive)

#### Issue: "Incidents Not Appearing"

**Symptoms**: Webhook succeeds but no incident in dashboard

**Solutions**:
1. Check WebSocket connection (look for connection icon)
2. Refresh the page to reconnect
3. Verify the incident was created: `GET /incidents`
4. Check browser console for errors

#### Issue: "Low Confidence Scores"

**Symptoms**: Most incidents have confidence <70%

**Solutions**:
1. Improve error messages in your code
2. Include more context in stack traces
3. Ensure GitHub repository is accessible
4. Let AIRA learn from more incidents over time

#### Issue: "PRs Not Being Created"

**Symptoms**: High confidence but no PR link

**Solutions**:
1. Verify GitHub token has `repo` scope
2. Check if the file is in blocked paths
3. Ensure the repository exists and is accessible
4. Review AIRA backend logs for errors

#### Issue: "WebSocket Disconnects Frequently"

**Symptoms**: Live updates stop working

**Solutions**:
1. Check network stability
2. Verify firewall allows WebSocket connections
3. Increase WebSocket timeout in configuration
4. Use a reverse proxy with WebSocket support

---

## FAQ

### General Questions

**Q: How much does AIRA cost?**  
A: AIRA is open-source and free to use. You only pay for:
- Groq API usage (LLM calls)
- GitHub API usage (usually free for most teams)
- Infrastructure costs (servers, Docker, etc.)

**Q: What programming languages does AIRA support?**  
A: AIRA supports all major languages including:
- Python, JavaScript/TypeScript, Java, Go, Ruby, PHP, C#, C++, Rust, and more
- The AI model can understand and fix code in any language

**Q: Can AIRA access my private repositories?**  
A: Yes, if you provide a GitHub token with appropriate permissions. AIRA only accesses repositories you explicitly configure.

**Q: Is my code data secure?**  
A: Yes. Code is:
- Sent to Groq's API over HTTPS
- Not stored permanently by Groq
- Only accessed when processing incidents
- Stored locally in your AIRA database

### Technical Questions

**Q: How long does incident resolution take?**  
A: Typical timeline:
- Triage: 5-10 seconds
- Diagnosis: 10-20 seconds
- Fix generation: 15-30 seconds
- Total: 30-60 seconds for most incidents

**Q: What's the success rate of auto-fixes?**  
A: Depends on incident type:
- Simple bugs (null checks, typos): 90-95% success
- Logic errors: 70-80% success
- Complex architectural issues: 40-50% success
- Overall average: 75-85% success rate

**Q: Can I customize the confidence thresholds?**  
A: Yes, edit the configuration in `backend/agent.py`:
```python
HIGH_CONFIDENCE_THRESHOLD = 0.85  # Auto-create PR
MEDIUM_CONFIDENCE_THRESHOLD = 0.70  # Request approval
```

**Q: How does AIRA learn from past incidents?**  
A: AIRA uses:
- Redis for similarity search (vector embeddings)
- SQLite for incident history
- Pattern matching on error messages and stack traces
- Success/failure feedback from PR outcomes

**Q: Can I run AIRA on-premises?**  
A: Yes, AIRA is fully self-hosted. You need:
- Docker and Docker Compose
- Groq API key (cloud-based LLM)
- GitHub access (can be GitHub Enterprise)

### Integration Questions

**Q: Can I integrate with multiple monitoring platforms?**  
A: Yes, create separate API keys for each platform and configure webhooks independently.

**Q: Does AIRA support custom webhook formats?**  
A: Yes, you can transform your webhook payload to match AIRA's expected format using your monitoring platform's template system.

**Q: Can I send incidents via API instead of webhooks?**  
A: Yes, use the `POST /webhook` endpoint directly with your API key.

**Q: How do I test my integration without triggering real alerts?**  
A: Use the test endpoint:
```bash
curl -X POST http://localhost:8000/webhook \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test incident", "severity": "P3"}'
```

---

## Getting Help

### Documentation
- **API Documentation**: See `API_DOCUMENTATION.md`
- **Diagnosis Guide**: See `DIAGNOSIS_GUIDE.md`
- **README**: See `README.md`

### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Ask questions and share experiences
- **Email Support**: support@aira.example.com

### Contributing
AIRA is open-source! Contributions are welcome:
- Submit bug fixes
- Add new features
- Improve documentation
- Share integration guides

See `CONTRIBUTING.md` for guidelines.

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search |
| `Ctrl/Cmd + R` | Refresh incident feed |
| `Esc` | Close incident details |
| `↑/↓` | Navigate incidents |
| `Enter` | Open selected incident |

### Glossary

- **Incident**: A detected error or issue in your application
- **Triage**: Initial assessment and severity classification
- **Diagnosis**: Root cause analysis and affected code identification
- **Confidence Score**: AI's certainty in its diagnosis and fix
- **Escalation**: Routing to human for manual intervention
- **MCP**: Model Context Protocol for AI tool integration
- **LangGraph**: Framework for building AI agent workflows

---

**Last Updated**: January 2024  
**Version**: 1.0.0

For the latest updates, visit: [https://github.com/yourusername/aira](https://github.com/yourusername/aira)