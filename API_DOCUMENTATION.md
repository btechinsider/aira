# AIRA API Documentation

## Overview

AIRA (Autonomous Incident Response Agent) provides a RESTful API for incident management, authentication, and system integration. This document covers all available endpoints, request/response formats, and authentication methods.

**Base URL**: `http://localhost:8000`

**API Version**: 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [API Key Management](#api-key-management)
4. [Incident Management](#incident-management)
5. [WebSocket API](#websocket-api)
6. [Integration Guides](#integration-guides)
7. [Error Handling](#error-handling)

---

## Authentication

AIRA supports two authentication methods:

### 1. JWT Bearer Token
Used for user-facing operations. Include in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### 2. API Key
Used for webhook integrations. Include in the `X-API-Key` header:
```
X-API-Key: aira_<your_api_key>
```

---

## User Management

### Register New User

Create a new user account and receive a JWT token.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "is_active": true,
    "is_admin": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Email or username already registered
- `422 Unprocessable Entity`: Invalid email format or missing required fields

---

### Login

Authenticate with username and password to receive a JWT token.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "is_active": true,
    "is_admin": false,
    "last_login": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Incorrect username or password
- `400 Bad Request`: Inactive user account

---

### Get Current User

Retrieve information about the currently authenticated user.

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_admin": false,
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:35:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token

---

## API Key Management

### Create API Key

Generate a new API key for webhook integrations.

**Endpoint**: `POST /auth/api-keys`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Request Body**:
```json
{
  "name": "Production Webhook",
  "expires_in_days": 90
}
```

**Note**: Set `expires_in_days` to `0` for a non-expiring key.

**Response** (200 OK):
```json
{
  "id": "key-uuid",
  "key": "aira_abc123def456...",
  "name": "Production Webhook",
  "is_active": true,
  "created_at": "2024-01-15T10:40:00Z",
  "expires_at": "2024-04-15T10:40:00Z"
}
```

**⚠️ Important**: Save the `key` value immediately. It cannot be retrieved again.

---

### List API Keys

Retrieve all API keys for the current user.

**Endpoint**: `GET /auth/api-keys`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "key-uuid-1",
    "key": "aira_abc123...",
    "name": "Production Webhook",
    "is_active": true,
    "created_at": "2024-01-15T10:40:00Z",
    "expires_at": "2024-04-15T10:40:00Z",
    "last_used_at": "2024-01-15T11:00:00Z"
  },
  {
    "id": "key-uuid-2",
    "key": "aira_xyz789...",
    "name": "Development Webhook",
    "is_active": false,
    "created_at": "2024-01-10T09:00:00Z",
    "expires_at": null
  }
]
```

---

### Toggle API Key Status

Activate or deactivate an API key.

**Endpoint**: `PATCH /auth/api-keys/{key_id}/toggle`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "API key activated",
  "is_active": true
}
```

---

### Delete API Key

Permanently delete an API key.

**Endpoint**: `DELETE /auth/api-keys/{key_id}`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "API key deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: API key not found

---

## Incident Management

### Create Incident (Webhook)

Submit a log event to create a new incident. This endpoint is typically called by log monitoring systems.

**Endpoint**: `POST /webhook`

**Headers**:
```
X-API-Key: aira_<your_api_key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "NullPointerException in UserService.getUser()",
  "stack_trace": "java.lang.NullPointerException\n  at com.example.UserService.getUser(UserService.java:45)\n  at com.example.UserController.handleRequest(UserController.java:23)",
  "severity": "error",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Response** (202 Accepted):
```json
{
  "incident_id": "incident-uuid",
  "status": "processing",
  "message": "Incident created and processing started"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing API key
- `422 Unprocessable Entity`: Invalid request format

---

### Get Incident Details

Retrieve detailed information about a specific incident.

**Endpoint**: `GET /incidents/{incident_id}`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Response** (200 OK):
```json
{
  "id": "incident-uuid",
  "raw_log": "NullPointerException in UserService.getUser()",
  "stack_trace": "java.lang.NullPointerException...",
  "severity": "P1",
  "triage_summary": "Critical null pointer exception in user service",
  "diagnosis": "Missing null check for user object",
  "root_cause": "User object not validated before access",
  "proposed_fix": "Add null check before accessing user properties",
  "confidence_score": 0.92,
  "llm_confidence": 0.95,
  "pattern_match_score": 0.88,
  "historical_score": 0.93,
  "action_taken": "PR created",
  "pr_url": "https://github.com/owner/repo/pull/123",
  "affected_file": "src/main/java/com/example/UserService.java",
  "affected_line": 45,
  "language": "java",
  "resolution_status": "resolved",
  "created_at": "2024-01-15T12:00:00Z",
  "resolved_at": "2024-01-15T12:05:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Incident not found

---

### List Incidents

Retrieve a paginated list of incidents.

**Endpoint**: `GET /incidents`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 50, max: 100)
- `severity` (optional): Filter by severity (P0, P1, P2, P3)
- `status` (optional): Filter by resolution status (pending, resolved, escalated)

**Example**: `GET /incidents?skip=0&limit=20&severity=P1&status=resolved`

**Response** (200 OK):
```json
{
  "total": 150,
  "skip": 0,
  "limit": 20,
  "incidents": [
    {
      "id": "incident-uuid-1",
      "severity": "P1",
      "triage_summary": "Critical null pointer exception",
      "resolution_status": "resolved",
      "created_at": "2024-01-15T12:00:00Z",
      "resolved_at": "2024-01-15T12:05:00Z"
    },
    // ... more incidents
  ]
}
```

---

### Health Check

Check if the API is running and healthy.

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## WebSocket API

### Connect to WebSocket

Receive real-time updates about incident processing.

**Endpoint**: `ws://localhost:8000/ws`

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Message Types

#### 1. Incident Started
```json
{
  "type": "incident_started",
  "incident_id": "incident-uuid",
  "data": {
    "message": "NullPointerException in UserService",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

#### 2. Incident Update
```json
{
  "type": "incident_update",
  "incident_id": "incident-uuid",
  "data": {
    "stage": "diagnosis",
    "message": "Analyzing stack trace...",
    "progress": 50
  }
}
```

#### 3. Incident Completed
```json
{
  "type": "incident_completed",
  "incident_id": "incident-uuid",
  "data": {
    "severity": "P1",
    "action_taken": "PR created",
    "pr_url": "https://github.com/owner/repo/pull/123",
    "confidence_score": 0.92
  }
}
```

#### 4. Incident Error
```json
{
  "type": "incident_error",
  "incident_id": "incident-uuid",
  "data": {
    "error": "Failed to create PR",
    "details": "GitHub API rate limit exceeded"
  }
}
```

---

## Integration Guides

### Get Integration Guide

Retrieve integration instructions for various platforms.

**Endpoint**: `GET /integrations/{platform}`

**Supported Platforms**:
- `datadog`
- `prometheus`
- `grafana`
- `splunk`
- `elk`
- `newrelic`

**Example**: `GET /integrations/datadog`

**Response** (200 OK):
```json
{
  "platform": "datadog",
  "title": "Datadog Integration Guide",
  "webhook_url": "http://localhost:8000/webhook",
  "instructions": "1. Navigate to Datadog Webhooks...",
  "configuration": {
    "headers": {
      "X-API-Key": "your_api_key_here",
      "Content-Type": "application/json"
    },
    "payload_template": "..."
  }
}
```

---

## Admin Endpoints

### List All Users (Admin Only)

**Endpoint**: `GET /auth/admin/users`

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "user-uuid-1",
    "email": "user1@example.com",
    "username": "user1",
    "is_active": true,
    "is_admin": false,
    "created_at": "2024-01-10T09:00:00Z"
  },
  // ... more users
]
```

**Error Responses**:
- `403 Forbidden`: Admin privileges required

---

### Toggle Admin Status (Admin Only)

**Endpoint**: `PATCH /auth/admin/users/{user_id}/toggle-admin`

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "User admin status updated",
  "is_admin": true
}
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted for processing |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

- **Webhook endpoint**: 100 requests per minute per API key
- **User endpoints**: 1000 requests per hour per user
- **WebSocket connections**: 10 concurrent connections per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

---

## Best Practices

### 1. Secure API Keys
- Store API keys in environment variables
- Never commit keys to version control
- Rotate keys regularly (every 90 days recommended)
- Use separate keys for different environments

### 2. Error Handling
```javascript
try {
  const response = await fetch('http://localhost:8000/webhook', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.AIRA_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logEvent)
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.detail);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```

### 3. WebSocket Reconnection
```javascript
let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  ws = new WebSocket('ws://localhost:8000/ws');
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(connect, 1000 * reconnectAttempts);
    }
  };
  
  ws.onopen = () => {
    reconnectAttempts = 0;
  };
}

connect();
```

---

## Support

For API support and questions:
- **Documentation**: [https://github.com/yourusername/aira](https://github.com/yourusername/aira)
- **Issues**: [https://github.com/yourusername/aira/issues](https://github.com/yourusername/aira/issues)
- **Email**: support@aira.example.com

---

**Last Updated**: January 2024  
**API Version**: 1.0.0