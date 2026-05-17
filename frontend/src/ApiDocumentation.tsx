import { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  BookOpen,
  Lock,
  User,
  Key,
  AlertTriangle,
  Plug,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface CodeExample {
  language: string;
  code: string;
}

export const ApiDocumentation: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'authentication', title: 'Authentication', icon: Lock },
    { id: 'user-management', title: 'User Management', icon: User },
    { id: 'api-keys', title: 'API Keys', icon: Key },
    { id: 'incidents', title: 'Incidents', icon: AlertTriangle },
    { id: 'websocket', title: 'WebSocket', icon: Plug },
    { id: 'errors', title: 'Error Handling', icon: AlertCircle },
  ];

  const CodeBlock: React.FC<{ code: string; language: string; id: string }> = ({ code, language, id }) => (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex gap-2">
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
        >
          {copiedCode === id ? (
            <>
              <Check size={12} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm">
        <code className="text-green-400">{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                API Documentation
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-sm font-semibold">{user?.username}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-24 bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">SECTIONS</h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="text-sm">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">API Overview</h2>
                <p className="text-slate-300 mb-4">
                  AIRA provides a RESTful API for incident management, authentication, and system integration.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Base URL</p>
                    <p className="font-mono text-blue-400">{BACKEND_URL}</p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">API Version</p>
                    <p className="font-mono text-green-400">1.0.0</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Quick Start</h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Register a user account or login</li>
                  <li>Create an API key for webhook integrations</li>
                  <li>Configure your monitoring platform to send webhooks</li>
                  <li>Monitor incidents in real-time via WebSocket</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'authentication' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Authentication</h2>
                <p className="text-slate-300 mb-6">
                  AIRA supports two authentication methods: JWT Bearer tokens for user operations and API keys for webhook integrations.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">1. JWT Bearer Token</h3>
                    <p className="text-slate-300 mb-3">Include in the Authorization header:</p>
                    <CodeBlock
                      id="jwt-header"
                      language="http"
                      code="Authorization: Bearer <your_jwt_token>"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">2. API Key</h3>
                    <p className="text-slate-300 mb-3">Include in the X-API-Key header:</p>
                    <CodeBlock
                      id="api-key-header"
                      language="http"
                      code="X-API-Key: aira_<your_api_key>"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'user-management' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">User Management</h2>

                {/* Register */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-green-600 rounded text-sm font-semibold">POST</span>
                    <code className="text-blue-400">/auth/register</code>
                  </div>
                  <p className="text-slate-300 mb-4">Create a new user account and receive a JWT token.</p>
                  
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Request Body:</h4>
                  <CodeBlock
                    id="register-request"
                    language="json"
                    code={`{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "full_name": "John Doe"
}`}
                  />

                  <h4 className="text-sm font-semibold text-slate-400 mt-4 mb-2">Response (201 Created):</h4>
                  <CodeBlock
                    id="register-response"
                    language="json"
                    code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "is_active": true,
    "is_admin": false
  }
}`}
                  />
                </div>

                {/* Login */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-green-600 rounded text-sm font-semibold">POST</span>
                    <code className="text-blue-400">/auth/login</code>
                  </div>
                  <p className="text-slate-300 mb-4">Authenticate with username and password.</p>
                  
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Request Body:</h4>
                  <CodeBlock
                    id="login-request"
                    language="json"
                    code={`{
  "username": "johndoe",
  "password": "securepassword123"
}`}
                  />

                  <h4 className="text-sm font-semibold text-slate-400 mt-4 mb-2">cURL Example:</h4>
                  <CodeBlock
                    id="login-curl"
                    language="bash"
                    code={`curl -X POST ${BACKEND_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"johndoe","password":"securepassword123"}'`}
                  />
                </div>

                {/* Get Current User */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-600 rounded text-sm font-semibold">GET</span>
                    <code className="text-blue-400">/auth/me</code>
                  </div>
                  <p className="text-slate-300 mb-4">Get information about the currently authenticated user.</p>
                  
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">cURL Example:</h4>
                  <CodeBlock
                    id="me-curl"
                    language="bash"
                    code={`curl ${BACKEND_URL}/auth/me \\
  -H "Authorization: Bearer <your_jwt_token>"`}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'api-keys' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">API Key Management</h2>

                {/* Create API Key */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-green-600 rounded text-sm font-semibold">POST</span>
                    <code className="text-blue-400">/auth/api-keys</code>
                  </div>
                  <p className="text-slate-300 mb-4">Generate a new API key for webhook integrations.</p>
                  
                  <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4 mb-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ <strong>Important:</strong> Save the key value immediately. It cannot be retrieved again.
                    </p>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Request Body:</h4>
                  <CodeBlock
                    id="create-key-request"
                    language="json"
                    code={`{
  "name": "Production Webhook",
  "expires_in_days": 90
}`}
                  />

                  <p className="text-slate-400 text-sm mt-2 mb-4">
                    Note: Set <code className="text-blue-400">expires_in_days</code> to <code className="text-blue-400">0</code> for a non-expiring key.
                  </p>

                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Response (200 OK):</h4>
                  <CodeBlock
                    id="create-key-response"
                    language="json"
                    code={`{
  "id": "key-uuid",
  "key": "aira_abc123def456...",
  "name": "Production Webhook",
  "is_active": true,
  "created_at": "2024-01-15T10:40:00Z",
  "expires_at": "2024-04-15T10:40:00Z"
}`}
                  />
                </div>

                {/* List API Keys */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-600 rounded text-sm font-semibold">GET</span>
                    <code className="text-blue-400">/auth/api-keys</code>
                  </div>
                  <p className="text-slate-300 mb-4">Retrieve all API keys for the current user.</p>
                  
                  <CodeBlock
                    id="list-keys-curl"
                    language="bash"
                    code={`curl ${BACKEND_URL}/auth/api-keys \\
  -H "Authorization: Bearer <your_jwt_token>"`}
                  />
                </div>

                {/* Delete API Key */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-red-600 rounded text-sm font-semibold">DELETE</span>
                    <code className="text-blue-400">/auth/api-keys/{'{key_id}'}</code>
                  </div>
                  <p className="text-slate-300 mb-4">Permanently delete an API key.</p>
                  
                  <CodeBlock
                    id="delete-key-curl"
                    language="bash"
                    code={`curl -X DELETE ${BACKEND_URL}/auth/api-keys/{key_id} \\
  -H "Authorization: Bearer <your_jwt_token>"`}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'incidents' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Incident Management</h2>

                {/* Create Incident */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-green-600 rounded text-sm font-semibold">POST</span>
                    <code className="text-blue-400">/webhook</code>
                  </div>
                  <p className="text-slate-300 mb-4">
                    Submit a log event to create a new incident. This endpoint is typically called by log monitoring systems.
                  </p>
                  
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Request Body:</h4>
                  <CodeBlock
                    id="create-incident-request"
                    language="json"
                    code={`{
  "message": "NullPointerException in UserService.getUser()",
  "stack_trace": "java.lang.NullPointerException\\n  at com.example.UserService.getUser(UserService.java:45)",
  "severity": "error",
  "timestamp": "2024-01-15T12:00:00Z"
}`}
                  />

                  <h4 className="text-sm font-semibold text-slate-400 mt-4 mb-2">cURL Example:</h4>
                  <CodeBlock
                    id="create-incident-curl"
                    language="bash"
                    code={`curl -X POST ${BACKEND_URL}/webhook \\
  -H "X-API-Key: aira_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "NullPointerException in UserService",
    "stack_trace": "...",
    "severity": "error"
  }'`}
                  />

                  <h4 className="text-sm font-semibold text-slate-400 mt-4 mb-2">Response (202 Accepted):</h4>
                  <CodeBlock
                    id="create-incident-response"
                    language="json"
                    code={`{
  "incident_id": "incident-uuid",
  "status": "processing",
  "message": "Incident created and processing started"
}`}
                  />
                </div>

                {/* Get Incident */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-600 rounded text-sm font-semibold">GET</span>
                    <code className="text-blue-400">/incidents/{'{incident_id}'}</code>
                  </div>
                  <p className="text-slate-300 mb-4">Retrieve detailed information about a specific incident.</p>
                  
                  <CodeBlock
                    id="get-incident-curl"
                    language="bash"
                    code={`curl ${BACKEND_URL}/incidents/{incident_id} \\
  -H "Authorization: Bearer <your_jwt_token>"`}
                  />
                </div>

                {/* List Incidents */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-600 rounded text-sm font-semibold">GET</span>
                    <code className="text-blue-400">/incidents</code>
                  </div>
                  <p className="text-slate-300 mb-4">Retrieve a paginated list of incidents.</p>
                  
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Query Parameters:</h4>
                  <div className="bg-slate-700 rounded-lg p-4 mb-4 space-y-2 text-sm">
                    <div><code className="text-blue-400">skip</code> - Number of records to skip (default: 0)</div>
                    <div><code className="text-blue-400">limit</code> - Max records to return (default: 50, max: 100)</div>
                    <div><code className="text-blue-400">severity</code> - Filter by severity (P0, P1, P2, P3)</div>
                    <div><code className="text-blue-400">status</code> - Filter by status (pending, resolved, escalated)</div>
                  </div>

                  <CodeBlock
                    id="list-incidents-curl"
                    language="bash"
                    code={`curl "${BACKEND_URL}/incidents?skip=0&limit=20&severity=P1" \\
  -H "Authorization: Bearer <your_jwt_token>"`}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'websocket' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">WebSocket API</h2>
                <p className="text-slate-300 mb-6">
                  Connect to the WebSocket endpoint to receive real-time updates about incident processing.
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Connection</h3>
                  <div className="bg-slate-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-400">WebSocket URL:</p>
                    <code className="text-green-400">ws://localhost:8000/ws</code>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-400 mb-2">JavaScript Example:</h4>
                  <CodeBlock
                    id="ws-connect"
                    language="javascript"
                    code={`const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to AIRA');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
  
  switch (message.type) {
    case 'incident_started':
      // Handle incident started
      break;
    case 'incident_completed':
      // Handle incident completed
      break;
    case 'incident_error':
      // Handle error
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from AIRA');
};`}
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-blue-400">Message Types</h3>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">1. Incident Started</h4>
                    <CodeBlock
                      id="ws-started"
                      language="json"
                      code={`{
  "type": "incident_started",
  "incident_id": "incident-uuid",
  "data": {
    "message": "NullPointerException in UserService",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}`}
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">2. Incident Completed</h4>
                    <CodeBlock
                      id="ws-completed"
                      language="json"
                      code={`{
  "type": "incident_completed",
  "incident_id": "incident-uuid",
  "data": {
    "severity": "P1",
    "action_taken": "PR created",
    "pr_url": "https://github.com/owner/repo/pull/123",
    "confidence_score": 0.92
  }
}`}
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">3. Incident Error</h4>
                    <CodeBlock
                      id="ws-error"
                      language="json"
                      code={`{
  "type": "incident_error",
  "incident_id": "incident-uuid",
  "data": {
    "error": "Failed to create PR",
    "details": "GitHub API rate limit exceeded"
  }
}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'errors' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Error Handling</h2>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Error Response Format</h3>
                  <p className="text-slate-300 mb-4">All error responses follow this format:</p>
                  <CodeBlock
                    id="error-format"
                    language="json"
                    code={`{
  "detail": "Error message describing what went wrong"
}`}
                  />
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">HTTP Status Codes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-4 py-2 text-left">Code</th>
                          <th className="px-4 py-2 text-left">Meaning</th>
                          <th className="px-4 py-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-green-400">200</td>
                          <td className="px-4 py-2">OK</td>
                          <td className="px-4 py-2 text-slate-300">Request succeeded</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-green-400">201</td>
                          <td className="px-4 py-2">Created</td>
                          <td className="px-4 py-2 text-slate-300">Resource created successfully</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-blue-400">202</td>
                          <td className="px-4 py-2">Accepted</td>
                          <td className="px-4 py-2 text-slate-300">Request accepted for processing</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-yellow-400">400</td>
                          <td className="px-4 py-2">Bad Request</td>
                          <td className="px-4 py-2 text-slate-300">Invalid request format or parameters</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-yellow-400">401</td>
                          <td className="px-4 py-2">Unauthorized</td>
                          <td className="px-4 py-2 text-slate-300">Authentication required or failed</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-yellow-400">403</td>
                          <td className="px-4 py-2">Forbidden</td>
                          <td className="px-4 py-2 text-slate-300">Insufficient permissions</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-yellow-400">404</td>
                          <td className="px-4 py-2">Not Found</td>
                          <td className="px-4 py-2 text-slate-300">Resource not found</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-yellow-400">422</td>
                          <td className="px-4 py-2">Unprocessable Entity</td>
                          <td className="px-4 py-2 text-slate-300">Validation error</td>
                        </tr>
                        <tr className="hover:bg-slate-700/50">
                          <td className="px-4 py-2 font-mono text-red-400">500</td>
                          <td className="px-4 py-2">Internal Server Error</td>
                          <td className="px-4 py-2 text-slate-300">Server error</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Best Practices</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">1. Always Check Response Status</h4>
                      <CodeBlock
                        id="error-handling"
                        language="javascript"
                        code={`try {
  const response = await fetch('${BACKEND_URL}/webhook', {
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
    // Handle error appropriately
  }
  
  const data = await response.json();
  // Process successful response
} catch (error) {
  console.error('Network Error:', error);
  // Handle network errors
}`}
                      />
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">2. Implement Retry Logic</h4>
                      <p className="text-slate-300 text-sm mb-2">
                        For transient errors (500, 503), implement exponential backoff retry logic.
                      </p>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">3. Log All Errors</h4>
                      <p className="text-slate-300 text-sm mb-2">
                        Always log error responses for debugging and monitoring purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>AIRA API Documentation v1.0.0</p>
          <p className="mt-2 text-xs text-slate-500">
            For support, visit our GitHub repository or contact support@aira.example.com
          </p>
        </div>
      </footer>
    </div>
  );
};

// Made with Bob
