"""
Integration Guides Generator for AIRA
Provides language-specific integration examples and troubleshooting
"""
from typing import Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/integration", tags=["integration"])


class IntegrationGuide(BaseModel):
    language: str
    title: str
    description: str
    code_example: str
    installation: str
    troubleshooting: List[Dict[str, str]]


def get_python_guide(webhook_url: str, api_key: str) -> IntegrationGuide:
    """Generate Python integration guide"""
    return IntegrationGuide(
        language="python",
        title="Python Integration",
        description="Integrate AIRA with your Python application using the built-in logging module",
        installation="""pip install requests""",
        code_example=f"""import logging
import requests
import traceback
from datetime import datetime

class AIRAHandler(logging.Handler):
    \"\"\"Custom logging handler that sends errors to AIRA\"\"\"
    
    def __init__(self, webhook_url: str, api_key: str = None):
        super().__init__()
        self.webhook_url = webhook_url
        self.api_key = api_key
        self.setLevel(logging.ERROR)
    
    def emit(self, record):
        try:
            # Format the log record
            log_entry = {{
                "message": self.format(record),
                "stack_trace": self.format_exception(record.exc_info) if record.exc_info else "",
                "severity": self.get_severity(record.levelno),
                "timestamp": datetime.utcnow().isoformat()
            }}
            
            # Send to AIRA webhook
            headers = {{"Content-Type": "application/json"}}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            
            requests.post(self.webhook_url, json=log_entry, headers=headers, timeout=5)
        except Exception:
            # Don't let handler errors break the application
            pass
    
    def format_exception(self, exc_info):
        if exc_info:
            return ''.join(traceback.format_exception(*exc_info))
        return ""
    
    def get_severity(self, levelno):
        if levelno >= logging.CRITICAL:
            return "P0"
        elif levelno >= logging.ERROR:
            return "P1"
        elif levelno >= logging.WARNING:
            return "P2"
        return "P3"

# Usage in your application
aira_handler = AIRAHandler(
    webhook_url="{webhook_url}",
    api_key="{api_key}"
)
logging.getLogger().addHandler(aira_handler)

# Now all errors will be sent to AIRA automatically
try:
    result = 10 / 0
except Exception as e:
    logging.error("Division error occurred", exc_info=True)
""",
        troubleshooting=[
            {
                "issue": "Errors not appearing in AIRA",
                "solution": "Check that the webhook URL is correct and the API key is valid. Verify network connectivity."
            },
            {
                "issue": "Too many incidents being created",
                "solution": "Adjust the logging level to ERROR or CRITICAL only: aira_handler.setLevel(logging.ERROR)"
            },
            {
                "issue": "Application performance impact",
                "solution": "The handler uses async requests with timeout. Consider using a queue for high-volume applications."
            }
        ]
    )


def get_javascript_guide(webhook_url: str, api_key: str) -> IntegrationGuide:
    """Generate JavaScript/Node.js integration guide"""
    return IntegrationGuide(
        language="javascript",
        title="JavaScript/Node.js Integration",
        description="Integrate AIRA with your Node.js application using axios",
        installation="""npm install axios""",
        code_example=f"""const axios = require('axios');

class AIRALogger {{
    constructor(webhookUrl, apiKey = null) {{
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
    }}

    async logError(error, context = {{}}) {{
        try {{
            const payload = {{
                message: error.message || String(error),
                stack_trace: error.stack || '',
                severity: this.getSeverity(error),
                timestamp: new Date().toISOString(),
                ...context
            }};

            const headers = {{ 'Content-Type': 'application/json' }};
            if (this.apiKey) {{
                headers['X-API-Key'] = this.apiKey;
            }}

            await axios.post(this.webhookUrl, payload, {{ 
                headers,
                timeout: 5000 
            }});
        }} catch (err) {{
            // Don't let logging errors break the app
            console.error('AIRA logging failed:', err.message);
        }}
    }}

    getSeverity(error) {{
        if (error.critical) return 'P0';
        if (error.name === 'TypeError' || error.name === 'ReferenceError') return 'P1';
        return 'P2';
    }}
}}

// Initialize AIRA logger
const aira = new AIRALogger(
    '{webhook_url}',
    '{api_key}'
);

// Global error handler
process.on('uncaughtException', async (error) => {{
    console.error('Uncaught Exception:', error);
    await aira.logError(error, {{ context: 'uncaughtException' }});
    process.exit(1);
}});

process.on('unhandledRejection', async (reason, promise) => {{
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await aira.logError(new Error(String(reason)), {{ context: 'unhandledRejection' }});
}});

// Usage in your code
try {{
    // Your code here
    throw new Error('Something went wrong!');
}} catch (error) {{
    await aira.logError(error, {{ userId: '123', action: 'processPayment' }});
}}
""",
        troubleshooting=[
            {
                "issue": "Webhook requests timing out",
                "solution": "Increase the timeout value or check network connectivity. Default is 5000ms."
            },
            {
                "issue": "Process exits before error is logged",
                "solution": "Use await when logging errors in exit handlers, or add a small delay before process.exit()."
            },
            {
                "issue": "Missing stack traces",
                "solution": "Ensure you're passing Error objects, not strings. Use new Error(message) to create proper errors."
            }
        ]
    )


def get_java_guide(webhook_url: str, api_key: str) -> IntegrationGuide:
    """Generate Java integration guide"""
    return IntegrationGuide(
        language="java",
        title="Java Integration",
        description="Integrate AIRA with your Java application using OkHttp",
        installation="""<!-- Add to pom.xml -->
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>""",
        code_example=f"""import okhttp3.*;
import com.google.gson.Gson;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class AIRALogger {{
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private final OkHttpClient client;
    private final String webhookUrl;
    private final String apiKey;
    private final Gson gson;

    public AIRALogger(String webhookUrl, String apiKey) {{
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
        this.gson = new Gson();
        this.client = new OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .writeTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build();
    }}

    public void logError(Exception e, String context) {{
        try {{
            Map<String, Object> payload = new HashMap<>();
            payload.put("message", e.getMessage());
            payload.put("stack_trace", getStackTrace(e));
            payload.put("severity", getSeverity(e));
            payload.put("timestamp", java.time.Instant.now().toString());
            
            if (context != null) {{
                payload.put("context", context);
            }}

            String json = gson.toJson(payload);
            
            Request.Builder requestBuilder = new Request.Builder()
                .url(webhookUrl)
                .post(RequestBody.create(json, JSON));
            
            if (apiKey != null && !apiKey.isEmpty()) {{
                requestBuilder.addHeader("X-API-Key", apiKey);
            }}

            try (Response response = client.newCall(requestBuilder.build()).execute()) {{
                if (!response.isSuccessful()) {{
                    System.err.println("AIRA logging failed: " + response.code());
                }}
            }}
        }} catch (IOException ex) {{
            System.err.println("Failed to log to AIRA: " + ex.getMessage());
        }}
    }}

    private String getStackTrace(Exception e) {{
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }}

    private String getSeverity(Exception e) {{
        if (e instanceof NullPointerException || e instanceof OutOfMemoryError) {{
            return "P0";
        }} else if (e instanceof RuntimeException) {{
            return "P1";
        }}
        return "P2";
    }}
}}

// Usage
public class Main {{
    private static final AIRALogger aira = new AIRALogger(
        "{webhook_url}",
        "{api_key}"
    );

    public static void main(String[] args) {{
        // Set global exception handler
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {{
            System.err.println("Uncaught exception in thread " + thread.getName());
            if (throwable instanceof Exception) {{
                aira.logError((Exception) throwable, "UncaughtException");
            }}
        }});

        try {{
            // Your code here
            int result = 10 / 0;
        }} catch (Exception e) {{
            aira.logError(e, "Division operation");
        }}
    }}
}}
""",
        troubleshooting=[
            {
                "issue": "Connection timeout errors",
                "solution": "Increase timeout values in OkHttpClient.Builder() or check network/firewall settings."
            },
            {
                "issue": "JSON serialization errors",
                "solution": "Ensure all objects in the payload are serializable. Use Gson's @Expose annotation if needed."
            },
            {
                "issue": "Thread safety concerns",
                "solution": "OkHttpClient is thread-safe. Create one instance and reuse it across your application."
            }
        ]
    )


def get_go_guide(webhook_url: str, api_key: str) -> IntegrationGuide:
    """Generate Go integration guide"""
    return IntegrationGuide(
        language="go",
        title="Go Integration",
        description="Integrate AIRA with your Go application",
        installation="""// No external dependencies required, uses standard library""",
        code_example=f"""package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "runtime/debug"
    "time"
)

type AIRALogger struct {{
    WebhookURL string
    APIKey     string
    Client     *http.Client
}}

type ErrorPayload struct {{
    Message    string `json:"message"`
    StackTrace string `json:"stack_trace"`
    Severity   string `json:"severity"`
    Timestamp  string `json:"timestamp"`
}}

func NewAIRALogger(webhookURL, apiKey string) *AIRALogger {{
    return &AIRALogger{{
        WebhookURL: webhookURL,
        APIKey:     apiKey,
        Client: &http.Client{{
            Timeout: 5 * time.Second,
        }},
    }}
}}

func (a *AIRALogger) LogError(err error, context string) {{
    if err == nil {{
        return
    }}

    payload := ErrorPayload{{
        Message:    fmt.Sprintf("%s: %v", context, err),
        StackTrace: string(debug.Stack()),
        Severity:   "P2",
        Timestamp:  time.Now().UTC().Format(time.RFC3339),
    }}

    jsonData, jsonErr := json.Marshal(payload)
    if jsonErr != nil {{
        fmt.Printf("Failed to marshal error payload: %v\\n", jsonErr)
        return
    }}

    req, reqErr := http.NewRequest("POST", a.WebhookURL, bytes.NewBuffer(jsonData))
    if reqErr != nil {{
        fmt.Printf("Failed to create request: %v\\n", reqErr)
        return
    }}

    req.Header.Set("Content-Type", "application/json")
    if a.APIKey != "" {{
        req.Header.Set("X-API-Key", a.APIKey)
    }}

    resp, respErr := a.Client.Do(req)
    if respErr != nil {{
        fmt.Printf("Failed to send error to AIRA: %v\\n", respErr)
        return
    }}
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {{
        fmt.Printf("AIRA returned non-OK status: %d\\n", resp.StatusCode)
    }}
}}

// Usage
func main() {{
    aira := NewAIRALogger(
        "{webhook_url}",
        "{api_key}",
    )

    // Recover from panics
    defer func() {{
        if r := recover(); r != nil {{
            err := fmt.Errorf("panic recovered: %v", r)
            aira.LogError(err, "Panic")
            panic(r) // Re-panic after logging
        }}
    }}()

    // Log errors
    if err := someFunction(); err != nil {{
        aira.LogError(err, "someFunction failed")
    }}
}}

func someFunction() error {{
    return fmt.Errorf("something went wrong")
}}
""",
        troubleshooting=[
            {
                "issue": "Goroutine panics not being caught",
                "solution": "Add defer/recover in each goroutine. The main defer/recover only catches panics in the main goroutine."
            },
            {
                "issue": "HTTP client timeout",
                "solution": "Increase the timeout in http.Client or check network connectivity."
            },
            {
                "issue": "Stack traces too verbose",
                "solution": "Use runtime.Caller() instead of debug.Stack() for more concise stack information."
            }
        ]
    )


@router.get("/guides")
async def list_integration_guides():
    """List all available integration guides"""
    return {
        "guides": [
            {"language": "python", "title": "Python Integration"},
            {"language": "javascript", "title": "JavaScript/Node.js Integration"},
            {"language": "java", "title": "Java Integration"},
            {"language": "go", "title": "Go Integration"},
            {"language": "ruby", "title": "Ruby Integration (Coming Soon)"},
            {"language": "php", "title": "PHP Integration (Coming Soon)"},
            {"language": "csharp", "title": "C# Integration (Coming Soon)"},
        ]
    }


@router.get("/guides/{language}")
async def get_integration_guide(language: str, webhook_url: str, api_key: str = "your_api_key_here"):
    """Get integration guide for a specific language"""
    guides = {
        "python": get_python_guide,
        "javascript": get_javascript_guide,
        "java": get_java_guide,
        "go": get_go_guide,
    }
    
    if language not in guides:
        return {"error": f"Guide for {language} not available yet"}
    
    return guides[language](webhook_url, api_key)

# Made with Bob