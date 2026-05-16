# 🔍 AIRA Enhanced Diagnosis Agent - Complete Guide

## Overview

The Enhanced Diagnosis Agent is AIRA's intelligent root cause analysis system that combines multi-language stack trace parsing, deep GitHub integration, and LLM-powered analysis to automatically diagnose software incidents.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Enhanced Diagnosis Agent                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Stack Trace     │───▶│  Language        │              │
│  │  Parser          │    │  Detection       │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Frame           │───▶│  Security        │              │
│  │  Extraction      │    │  Check           │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  GitHub API      │───▶│  Code Context    │              │
│  │  Integration     │    │  Fetching        │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Historical      │───▶│  Similar         │              │
│  │  Analysis        │    │  Incidents       │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  LLM-Powered     │───▶│  Root Cause      │              │
│  │  Diagnosis       │    │  + Confidence    │              │
│  └──────────────────┘    └──────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Multi-Language Stack Trace Parsing

Supports 8+ programming languages with intelligent pattern matching:

#### Supported Languages

| Language   | File Extensions | Stack Trace Format |
|------------|----------------|-------------------|
| Python     | `.py`          | `File "path.py", line 123` |
| JavaScript | `.js`          | `at function (path.js:123:45)` |
| TypeScript | `.ts`          | `at function (path.ts:123:45)` |
| Java       | `.java`        | `at Class.method(File.java:123)` |
| Go         | `.go`          | `path/file.go:123` |
| Ruby       | `.rb`          | `path/file.rb:123:in \`method\`` |
| PHP        | `.php`         | `#0 path.php(123): function()` |
| C#         | `.cs`          | `at Method() in path.cs:line 123` |

#### Example: Python Stack Trace

**Input**:
```python
Traceback (most recent call last):
  File "/app/database.py", line 45, in connect
    self.conn = psycopg2.connect(...)
  File "/usr/lib/python3.9/site-packages/psycopg2/__init__.py", line 127, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
psycopg2.OperationalError: could not connect to server: Connection timed out
```

**Parsed Output**:
```python
StackFrame(
    file_path="/app/database.py",
    line_number=45,
    function_name="connect",
    language=Language.PYTHON,
    is_user_code=True  # Not a library
)
```

### 2. Intelligent Frame Selection

The agent prioritizes **user code** over library/framework code:

```python
# Library patterns automatically detected:
- /site-packages/     # Python packages
- /node_modules/      # JavaScript packages
- /vendor/            # PHP/Ruby packages
- /usr/lib/           # System libraries
- <frozen>            # Python frozen modules
```

**Example**:
```
Stack Trace:
1. /app/api.py:123 (USER CODE) ← Selected as primary
2. /site-packages/flask/app.py:456 (LIBRARY)
3. /usr/lib/python3.9/threading.py:789 (SYSTEM)
```

### 3. Security-First Approach

Automatically escalates incidents affecting security-critical files:

```python
BLOCKED_PATHS = [
    "auth.py",
    "security/",
    "secrets.yml",
    "credentials",
    ".env",
    "config/auth",
    "password",
    "token",
    "key"
]
```

**When blocked path detected**:
- ❌ No auto-fix generated
- ✅ Immediate escalation to human
- ✅ Slack/email alert sent
- ✅ Incident marked as high-priority

### 4. Deep GitHub Integration

Fetches comprehensive code context via GitHub API:

#### What Gets Fetched

1. **Primary File Content**
   - 15 lines before error
   - Error line
   - 15 lines after error

2. **File Metadata**
   - Last commit info
   - File history
   - Recent changes

3. **Related Files** (Future)
   - Imported modules
   - Dependencies
   - Test files

#### GitHub API Calls

```python
# 1. Get file content
GET /repos/{owner}/{repo}/contents/{file_path}

# 2. Decode base64 content
content = base64.b64decode(response['content'])

# 3. Extract relevant lines
lines = content.split('\n')
context = lines[line_number-15:line_number+15]
```

### 5. Historical Analysis

Learns from past incidents using vector similarity search:

```python
# Find similar incidents
similar = await mcp.get_similar_incidents(
    error_signature="ConnectionError: Database timeout",
    limit=5
)

# Returns:
[
    {
        "incident_id": "inc-123",
        "root_cause": "Missing connection retry logic",
        "resolution": "Added exponential backoff",
        "confidence": 0.92,
        "created_at": "2024-01-15T10:30:00Z"
    },
    ...
]
```

### 6. LLM-Powered Diagnosis

Uses Groq's Llama 3.3 70B for intelligent analysis:

#### System Prompt

```
You are an expert {language} debugger and software architect.
Analyze the incident deeply and provide:
1. Root cause analysis (brief, actionable)
2. Detailed diagnosis with reasoning
3. Confidence score (0.0-1.0) based on available context

Consider:
- Error type and message
- Stack trace and affected code
- Code context and patterns
- Similar past incidents and their resolutions
- Language-specific best practices
```

#### Context Provided to LLM

```markdown
## Error Information
**Type**: ConnectionError
**Message**: Database connection timeout

## Stack Trace
[Full stack trace]

## Primary Affected Code
**File**: /app/database.py
**Line**: 45
**Function**: connect

## Code Context
```python
35 | def connect(self):
36 |     try:
37 |         self.conn = psycopg2.connect(
38 |             host=self.host,
39 |             database=self.db,
40 |             user=self.user,
41 |             password=self.password,
42 |             connect_timeout=5
43 |         )
44 |     except Exception as e:
45 |         raise ConnectionError(f"Database timeout: {e}")
46 |     return self.conn
```

## Similar Past Incidents
1. Missing connection retry logic
   Resolution: Added exponential backoff
2. Connection pool exhaustion
   Resolution: Increased pool size
```

#### LLM Response

```json
{
  "root_cause": "No retry logic for transient database failures",
  "diagnosis": "The connect() method at line 45 raises ConnectionError immediately without attempting to retry. The database server may be temporarily unavailable, but the code doesn't handle transient failures. Similar incidents (#123, #456) were resolved by adding exponential backoff retry logic with 3 attempts and increasing delays (1s, 2s, 4s).",
  "confidence": 0.87
}
```

## Usage

### Basic Usage

```python
from diagnosis_enhanced import EnhancedDiagnosisAgent
from groq_client import get_groq_client
from mcp_clients import get_mcp_manager

# Initialize
groq = get_groq_client()
mcp = get_mcp_manager()
agent = EnhancedDiagnosisAgent(groq, mcp)

# Diagnose incident
context = await agent.diagnose(
    incident_id="inc-001",
    error_message="ConnectionError: Database timeout",
    stack_trace="""
    File "/app/database.py", line 45, in connect
        raise ConnectionError(f"Database timeout: {e}")
    """,
    error_signature="ConnectionError: Database timeout"
)

# Access results
print(f"Root Cause: {context.root_cause}")
print(f"Diagnosis: {context.diagnosis}")
print(f"Confidence: {context.confidence}")
print(f"Language: {context.language.value}")
print(f"Affected File: {context.primary_frame.file_path}:{context.primary_frame.line_number}")
```

### Integration with LangGraph

```python
async def diagnosis_node(state: IncidentState) -> IncidentState:
    """Enhanced diagnosis node"""
    groq = get_groq_client()
    mcp = get_mcp_manager()
    agent = EnhancedDiagnosisAgent(groq, mcp)
    
    # Perform diagnosis
    context = await agent.diagnose(
        incident_id=state['incident_id'],
        error_message=state['raw_log'],
        stack_trace=state.get('stack_trace', ''),
        error_signature=state['error_signature']
    )
    
    # Update state
    state["affected_file"] = context.primary_frame.file_path
    state["affected_line"] = context.primary_frame.line_number
    state["root_cause"] = context.root_cause
    state["diagnosis"] = context.diagnosis
    state["code_context"] = context.code_context
    
    return state
```

## Output Format

### DiagnosisContext Object

```python
@dataclass
class DiagnosisContext:
    error_message: str              # Original error message
    error_type: str                 # e.g., "ConnectionError"
    stack_frames: List[StackFrame]  # All parsed frames
    primary_frame: StackFrame       # Most relevant frame
    code_context: str               # Code around error
    related_files: List[str]        # Related files (future)
    similar_incidents: List[Dict]   # Historical incidents
    root_cause: str                 # Brief root cause
    diagnosis: str                  # Detailed diagnosis
    confidence: float               # 0.0-1.0
    language: Language              # Detected language
```

### Example Output

```python
DiagnosisContext(
    error_message="ConnectionError: Database timeout",
    error_type="ConnectionError",
    stack_frames=[
        StackFrame(file_path="/app/database.py", line_number=45, ...),
        StackFrame(file_path="/site-packages/psycopg2/__init__.py", line_number=127, ...)
    ],
    primary_frame=StackFrame(
        file_path="/app/database.py",
        line_number=45,
        function_name="connect",
        language=Language.PYTHON,
        is_user_code=True
    ),
    code_context="35 | def connect(self):\n36 |     try:\n...",
    related_files=[],
    similar_incidents=[
        {"root_cause": "Missing retry logic", "resolution": "Added backoff"}
    ],
    root_cause="No retry logic for transient database failures",
    diagnosis="The connect() method at line 45 raises ConnectionError...",
    confidence=0.87,
    language=Language.PYTHON
)
```

## Configuration

### Environment Variables

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_REPO=owner/repository

# MCP Servers
GITHUB_MCP_URL=http://github-mcp:8000
INCIDENT_CONTEXT_MCP_URL=http://incident-context-mcp:8000

# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### Blocked Paths

Customize security-critical paths in `diagnosis_enhanced.py`:

```python
self.blocked_paths = [
    "auth.py",
    "security/",
    "secrets.yml",
    "credentials",
    ".env",
    "config/auth",
    "password",
    "token",
    "key",
    # Add your custom paths
    "payment/",
    "billing/",
]
```

## Performance

### Metrics

| Operation | Average Time | Notes |
|-----------|-------------|-------|
| Stack trace parsing | 5-10ms | Regex-based, very fast |
| GitHub API call | 200-500ms | Depends on file size |
| Similar incidents search | 50-100ms | Redis vector search |
| LLM diagnosis | 2-5s | Groq Llama 3.3 70B |
| **Total** | **2.5-6s** | End-to-end diagnosis |

### Optimization Tips

1. **Enable caching** for repeated errors:
   ```python
   result = await groq.call_groq_with_json(
       prompt=prompt,
       use_cache=True  # Cache LLM responses
   )
   ```

2. **Limit context lines** for large files:
   ```python
   context_lines=10  # Instead of 15
   ```

3. **Reduce similar incidents limit**:
   ```python
   similar = await mcp.get_similar_incidents(
       error_signature=signature,
       limit=3  # Instead of 5
   )
   ```

## Troubleshooting

### Issue: Stack trace not parsed

**Symptoms**: `primary_frame` is `None`

**Solutions**:
1. Check if language is supported
2. Verify stack trace format
3. Add custom regex pattern:
   ```python
   PATTERNS[Language.CUSTOM] = [
       r'your_custom_pattern_here'
   ]
   ```

### Issue: GitHub API rate limit

**Symptoms**: `Failed to fetch code context: 403`

**Solutions**:
1. Use authenticated token (higher rate limit)
2. Enable caching
3. Reduce context_lines

### Issue: Low confidence scores

**Symptoms**: `confidence < 0.5`

**Solutions**:
1. Ensure GitHub repo is accessible
2. Check if similar incidents exist
3. Provide more detailed error messages
4. Verify code context is fetched

## Future Enhancements

### Planned Features

1. **Import/Dependency Analysis**
   - Fetch related files automatically
   - Analyze import chains
   - Detect circular dependencies

2. **Multi-File Context**
   - Fetch multiple related files
   - Analyze cross-file interactions
   - Detect architectural issues

3. **Test File Integration**
   - Find related test files
   - Analyze test coverage
   - Suggest test improvements

4. **Performance Profiling**
   - Detect performance bottlenecks
   - Analyze time complexity
   - Suggest optimizations

5. **Security Scanning**
   - Detect security vulnerabilities
   - Check for common CVEs
   - Suggest security fixes

## Contributing

To add support for a new language:

1. Add language to `Language` enum
2. Add stack trace patterns to `PATTERNS`
3. Add language indicators to `detect_language()`
4. Test with sample stack traces

Example:
```python
# 1. Add to enum
class Language(Enum):
    RUST = "rust"

# 2. Add patterns
PATTERNS[Language.RUST] = [
    r'at ([^\s:]+\.rs):(\d+)',
]

# 3. Add indicators
language_indicators[Language.RUST] = ['.rs', 'thread', 'panicked']
```

## License

Part of AIRA - Autonomous Incident Response Agent
MIT License