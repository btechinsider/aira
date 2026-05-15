# AIRA Triage Agent Skill

## Purpose
Automatically triage incoming incidents, classify severity, and route to appropriate response workflow.

## Capabilities
- **Severity Classification**: Analyze logs and classify as P0 (critical), P1 (major), P2 (minor), or P3 (cosmetic)
- **Error Signature Extraction**: Identify unique error patterns for similarity matching
- **Immediate Escalation**: P0 incidents bypass automation and alert immediately
- **Context Gathering**: Extract affected files, line numbers, and stack traces

## Workflow

### 1. Incident Reception
- Receive log event via webhook
- Store raw incident in database
- Broadcast to WebSocket clients

### 2. LLM-Based Triage
- **Model**: Groq Llama 3.3 70B Versatile
- **Temperature**: 0.1 (deterministic)
- **Prompt**: Analyze log message and stack trace
- **Output**: JSON with severity, summary, error_signature

### 3. Severity Rules
```yaml
P0: Critical production outage, data loss, security breach
  → Action: Immediate Slack alert, no automation
  
P1: Major functionality broken, significant user impact
  → Action: Proceed to diagnosis and fix generation
  
P2: Minor functionality issue, workaround available
  → Action: Proceed to diagnosis and fix generation
  
P3: Cosmetic issue, low impact
  → Action: Proceed to diagnosis and fix generation
```

### 4. Security Checks
Blocked paths that trigger immediate escalation:
- `auth.py`
- `security/`
- `secrets.yml`
- `credentials`
- `.env`
- `config/auth`

## Integration Points

### MCP Tools Used
- None (triage is LLM-only)

### Data Stored
- Incident ID
- Raw log message
- Stack trace
- Severity classification
- Triage summary
- Error signature

### Next Steps
- P0 → Slack alert + end workflow
- P1/P2/P3 → Proceed to diagnosis node

## Example Triage Output
```json
{
  "severity": "P1",
  "summary": "NullPointerException in user authentication service",
  "error_signature": "NullPointerException at AuthService.validateToken:142"
}
```

## Performance Metrics
- **Target Triage Time**: < 5 seconds
- **Accuracy**: > 95% severity classification
- **Cache Hit Rate**: 60-70% for similar errors

## Error Handling
- LLM failure → Default to P2 severity
- Timeout → Retry with exponential backoff (3 attempts)
- Invalid response → Log error and escalate to human