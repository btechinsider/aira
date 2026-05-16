import { useState } from 'react';
import { useAuth } from './AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const DiagnosisGuide: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('quick-diagnostics');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    { id: 'quick-diagnostics', title: 'Quick Diagnostics', icon: '⚡' },
    { id: 'health-checks', title: 'System Health', icon: '💚' },
    { id: 'common-issues', title: 'Common Issues', icon: '🐛' },
    { id: 'components', title: 'Component Troubleshooting', icon: '🔧' },
    { id: 'performance', title: 'Performance Issues', icon: '🚀' },
    { id: 'database', title: 'Database Issues', icon: '💾' },
    { id: 'logging', title: 'Logging & Monitoring', icon: '📊' },
    { id: 'recovery', title: 'Recovery Procedures', icon: '🔄' },
  ];

  const CodeBlock: React.FC<{ code: string; language: string; id: string }> = ({ code, language, id }) => (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex gap-2">
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
        >
          {copiedCode === id ? '✓ Copied' : '📋 Copy'}
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
                Diagnosis Guide
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
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          {activeSection === 'quick-diagnostics' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Quick Diagnostics</h2>
                <p className="text-slate-300 mb-6">
                  Run these commands to quickly assess AIRA's health in under 5 minutes.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">1. Check All Containers</h3>
                    <CodeBlock
                      id="check-containers"
                      language="bash"
                      code="docker ps | grep aira"
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      Expected: 5 running containers (backend, frontend, redis, github-mcp, incident-context-mcp)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">2. Check Backend Health</h3>
                    <CodeBlock
                      id="check-health"
                      language="bash"
                      code={`curl ${BACKEND_URL}/health`}
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      Expected: {`{"status":"healthy","version":"1.0.0"}`}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">3. Check Redis Connectivity</h3>
                    <CodeBlock
                      id="check-redis"
                      language="bash"
                      code="docker exec aira-redis redis-cli ping"
                    />
                    <p className="text-slate-400 text-sm mt-2">Expected: PONG</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">4. Check Backend Logs</h3>
                    <CodeBlock
                      id="check-logs"
                      language="bash"
                      code="docker logs aira-backend --tail 50 | grep -i error"
                    />
                    <p className="text-slate-400 text-sm mt-2">Expected: No critical errors</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">5. Test API Authentication</h3>
                    <CodeBlock
                      id="test-auth"
                      language="bash"
                      code={`curl -X POST ${BACKEND_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"test","password":"test"}'`}
                    />
                    <p className="text-slate-400 text-sm mt-2">Expected: 200 OK or 401 (if user doesn't exist)</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-400">💡 Quick Status Script</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Create a script to check all health indicators at once:
                </p>
                <CodeBlock
                  id="status-script"
                  language="bash"
                  code={`cat > check-aira.sh << 'EOF'
#!/bin/bash
echo "=== AIRA System Status ==="
echo ""
echo "Containers:"
docker ps --format "table {{.Names}}\\t{{.Status}}" | grep aira
echo ""
echo "Backend Health:"
curl -s ${BACKEND_URL}/health | jq .
echo ""
echo "Redis Status:"
docker exec aira-redis redis-cli ping
EOF

chmod +x check-aira.sh
./check-aira.sh`}
                />
              </div>
            </div>
          )}

          {activeSection === 'health-checks' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">System Health Checks</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Container Health</h3>
                    <CodeBlock
                      id="container-status"
                      language="bash"
                      code="docker-compose -f docker/docker-compose.yml ps"
                    />
                    <div className="mt-4 bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Expected Output:</h4>
                      <pre className="text-xs text-green-400 overflow-x-auto">
{`NAME                    STATUS              PORTS
aira-backend            Up 2 hours          0.0.0.0:8000->8000/tcp
aira-frontend           Up 2 hours          0.0.0.0:3000->3000/tcp
aira-redis              Up 2 hours (healthy) 0.0.0.0:6379->6379/tcp
aira-github-mcp         Up 2 hours (healthy) 0.0.0.0:8001->8000/tcp
aira-incident-context-mcp Up 2 hours (healthy) 0.0.0.0:8002->8000/tcp`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Container Resources</h3>
                    <CodeBlock
                      id="container-stats"
                      language="bash"
                      code="docker stats --no-stream | grep aira"
                    />
                    <div className="mt-4 bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Healthy Ranges:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                        <li>CPU: {'<'}50% under normal load</li>
                        <li>Memory: {'<'}1GB per container</li>
                        <li>Network I/O: Varies with traffic</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Service Health Endpoints</h3>
                    <div className="space-y-2">
                      <div className="bg-slate-700 rounded-lg p-3">
                        <p className="text-sm text-slate-400 mb-1">Backend:</p>
                        <code className="text-blue-400 text-sm">curl {BACKEND_URL}/health</code>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-3">
                        <p className="text-sm text-slate-400 mb-1">GitHub MCP:</p>
                        <code className="text-blue-400 text-sm">curl http://localhost:8001/health</code>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-3">
                        <p className="text-sm text-slate-400 mb-1">Incident Context MCP:</p>
                        <code className="text-blue-400 text-sm">curl http://localhost:8002/health</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Database Health</h3>
                    <CodeBlock
                      id="db-check"
                      language="bash"
                      code={`# Access SQLite database
docker exec -it aira-backend sqlite3 /data/aira.db

# Run health checks
.tables  # Should show: users, api_keys, incidents
SELECT COUNT(*) FROM incidents;
.quit`}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Redis Health</h3>
                    <CodeBlock
                      id="redis-check"
                      language="bash"
                      code={`# Connect to Redis
docker exec -it aira-redis redis-cli

# Check memory usage
INFO memory

# Check key count
DBSIZE

# Test read/write
SET test_key "test_value"
GET test_key
DEL test_key`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'common-issues' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Common Issues</h2>

                <div className="space-y-6">
                  <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-red-400">Issue 1: Backend Won't Start</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-1">Symptoms:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>Container exits immediately</li>
                          <li>Error: "Application startup failed"</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Diagnosis:</p>
                        <CodeBlock
                          id="backend-logs"
                          language="bash"
                          code="docker logs aira-backend"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Solutions:</p>
                        <div className="space-y-2">
                          <div className="bg-slate-700 rounded p-3">
                            <p className="text-sm font-semibold mb-1">A. Missing Environment Variables</p>
                            <CodeBlock
                              id="check-env"
                              language="bash"
                              code={`# Check .env file exists
ls -la .env

# Verify required variables
cat .env | grep -E "GROQ_API_KEY|GITHUB_TOKEN"`}
                            />
                          </div>
                          <div className="bg-slate-700 rounded p-3">
                            <p className="text-sm font-semibold mb-1">B. Redis Connection Failed</p>
                            <CodeBlock
                              id="check-redis-conn"
                              language="bash"
                              code={`# Check Redis is running
docker ps | grep redis

# Test connection
docker exec aira-redis redis-cli ping`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-yellow-400">Issue 2: Incidents Not Appearing</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-1">Symptoms:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>Webhook returns 202 Accepted</li>
                          <li>No incident in dashboard</li>
                          <li>No errors in logs</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Diagnosis:</p>
                        <CodeBlock
                          id="check-incidents"
                          language="bash"
                          code={`# Check if incident was created
docker exec -it aira-backend sqlite3 /data/aira.db \\
  "SELECT id, raw_log, created_at FROM incidents ORDER BY created_at DESC LIMIT 5;"`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Solutions:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>Refresh dashboard page to reconnect WebSocket</li>
                          <li>Check browser console for errors</li>
                          <li>Restart backend container if processing is stuck</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-900/20 border border-orange-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-orange-400">Issue 3: Authentication Failures</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-1">Symptoms:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>"401 Unauthorized" errors</li>
                          <li>"Invalid or expired token"</li>
                          <li>"API key not found"</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Solutions:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>JWT tokens expire after 7 days - log in again</li>
                          <li>Check if API key is active in dashboard</li>
                          <li>Verify API key format starts with "aira_"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Issue 4: GitHub PR Creation Failed</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-1">Symptoms:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>High confidence incident</li>
                          <li>No PR created</li>
                          <li>Error: "Failed to create PR"</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Diagnosis:</p>
                        <CodeBlock
                          id="check-github"
                          language="bash"
                          code={`# Test GitHub API access
curl -H "Authorization: token $GITHUB_TOKEN" \\
  https://api.github.com/user

# Check MCP server logs
docker logs aira-github-mcp`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Solutions:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>Verify GitHub token has 'repo' scope</li>
                          <li>Check GITHUB_REPO format (owner/repo)</li>
                          <li>Ensure file is not in BLOCKED_PATHS</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-purple-400">Issue 5: Low Confidence Scores</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-1">Symptoms:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>Most incidents have confidence below 70%</li>
                          <li>Frequent escalations</li>
                          <li>Few auto-fixes</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Solutions:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>Improve error messages in your application</li>
                          <li>Include full stack traces in logs</li>
                          <li>Let AIRA process more incidents to build history</li>
                          <li>Verify GitHub repository access is working</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'components' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Component-Specific Troubleshooting</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Backend (FastAPI)</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Check Logs:</p>
                        <CodeBlock
                          id="backend-logs-detail"
                          language="bash"
                          code={`# Real-time logs
docker logs -f aira-backend

# Last 100 lines
docker logs aira-backend --tail 100

# Errors only
docker logs aira-backend 2>&1 | grep -i error`}
                        />
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Common Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li><strong>ModuleNotFoundError</strong>: Rebuild container with dependencies</li>
                          <li><strong>Connection refused to Redis</strong>: Check Redis is running</li>
                          <li><strong>Database locked</strong>: Stop all containers and restart</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Frontend (React)</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Check Logs:</p>
                        <CodeBlock
                          id="frontend-logs"
                          language="bash"
                          code="docker logs aira-frontend --tail 50"
                        />
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Common Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li><strong>Failed to fetch</strong>: Backend not accessible on port 8000</li>
                          <li><strong>WebSocket connection failed</strong>: Check CORS configuration</li>
                          <li><strong>Module not found</strong>: Rebuild frontend container</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Redis</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Check Memory:</p>
                        <CodeBlock
                          id="redis-memory"
                          language="bash"
                          code={`docker exec aira-redis redis-cli INFO memory
docker exec aira-redis redis-cli CONFIG GET maxmemory`}
                        />
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Common Issues:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li><strong>Out of memory</strong>: Increase maxmemory in docker-compose.yml</li>
                          <li><strong>Connection timeout</strong>: Restart Redis container</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">MCP Servers</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Check Status:</p>
                        <CodeBlock
                          id="mcp-status"
                          language="bash"
                          code={`# GitHub MCP
docker logs aira-github-mcp --tail 50
curl http://localhost:8001/health

# Incident Context MCP
docker logs aira-incident-context-mcp --tail 50
curl http://localhost:8002/health`}
                        />
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Common Issues:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li><strong>MCP server not responding</strong>: Restart MCP containers</li>
                          <li><strong>GitHub API rate limit</strong>: Wait for reset or use different token</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Performance Issues</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Slow Incident Processing</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Diagnosis:</p>
                        <CodeBlock
                          id="processing-times"
                          language="bash"
                          code={`docker exec -it aira-backend sqlite3 /data/aira.db \\
  "SELECT id, 
          CAST((julianday(resolved_at) - julianday(created_at)) * 86400 AS INTEGER) as seconds
   FROM incidents 
   WHERE resolved_at IS NOT NULL 
   ORDER BY created_at DESC LIMIT 10;"`}
                        />
                        <p className="text-slate-400 text-sm mt-2">Expected: 30-60 seconds per incident</p>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Solutions:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li>Check Groq API status</li>
                          <li>Check GitHub API status</li>
                          <li>Optimize Redis configuration</li>
                          <li>Increase container resources</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">High Memory Usage</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Diagnosis:</p>
                        <CodeBlock
                          id="memory-usage"
                          language="bash"
                          code={`# Check container memory
docker stats --no-stream | grep aira

# Check backend memory
docker exec aira-backend ps aux | grep python`}
                        />
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Solutions:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li>Restart backend to clear memory</li>
                          <li>Archive old incidents (older than 30 days)</li>
                          <li>Increase container memory limits</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">High CPU Usage</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Diagnosis:</p>
                        <CodeBlock
                          id="cpu-usage"
                          language="bash"
                          code={`# Check CPU usage
docker stats --no-stream | grep aira

# Check what's consuming CPU
docker exec aira-backend top -b -n 1`}
                        />
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2">Solutions:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                          <li>Limit concurrent incident processing</li>
                          <li>Optimize database queries</li>
                          <li>Profile code to find bottlenecks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'database' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Database Issues</h2>

                <div className="space-y-6">
                  <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-red-400">Database Corruption</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-1">Symptoms:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm ml-4">
                          <li>"Database disk image is malformed"</li>
                          <li>Queries fail randomly</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Recovery:</p>
                        <CodeBlock
                          id="db-recovery"
                          language="bash"
                          code={`# 1. Stop all containers
docker-compose -f docker/docker-compose.yml down

# 2. Backup database
docker run --rm -v aira_sqlite-data:/data -v $(pwd):/backup \\
  alpine cp /data/aira.db /backup/aira.db.backup

# 3. Try to repair
docker run --rm -v aira_sqlite-data:/data alpine \\
  sh -c "cd /data && sqlite3 aira.db 'PRAGMA integrity_check;'"

# 4. Restart containers
docker-compose -f docker/docker-compose.yml up -d`}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Database Maintenance</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Archive Old Incidents:</p>
                        <CodeBlock
                          id="archive-incidents"
                          language="bash"
                          code={`docker exec -it aira-backend sqlite3 /data/aira.db \\
  "DELETE FROM incidents WHERE created_at < datetime('now', '-30 days');"`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Check Database Size:</p>
                        <CodeBlock
                          id="db-size"
                          language="bash"
                          code="docker exec aira-backend ls -lh /data/aira.db"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'logging' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Logging & Monitoring</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Export Logs to File</h3>
                    <CodeBlock
                      id="export-logs"
                      language="bash"
                      code={`cat > export-logs.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p logs/$DATE

docker logs aira-backend > logs/$DATE/backend.log 2>&1
docker logs aira-frontend > logs/$DATE/frontend.log 2>&1
docker logs aira-redis > logs/$DATE/redis.log 2>&1
docker logs aira-github-mcp > logs/$DATE/github-mcp.log 2>&1
docker logs aira-incident-context-mcp > logs/$DATE/incident-context-mcp.log 2>&1

echo "Logs exported to logs/$DATE/"
EOF

chmod +x export-logs.sh
./export-logs.sh`}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Query Metrics</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold mb-2">Average Processing Time:</p>
                        <CodeBlock
                          id="avg-time"
                          language="bash"
                          code={`docker exec -it aira-backend sqlite3 /data/aira.db \\
  "SELECT AVG(CAST((julianday(resolved_at) - julianday(created_at)) * 86400 AS INTEGER))
   FROM incidents WHERE resolved_at IS NOT NULL;"`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Confidence Score Distribution:</p>
                        <CodeBlock
                          id="confidence-dist"
                          language="bash"
                          code={`docker exec -it aira-backend sqlite3 /data/aira.db \\
  "SELECT 
     CASE 
       WHEN confidence_score >= 0.9 THEN '90-100%'
       WHEN confidence_score >= 0.8 THEN '80-89%'
       WHEN confidence_score >= 0.7 THEN '70-79%'
       ELSE 'Below 70%'
     END as range,
     COUNT(*) as count
   FROM incidents 
   WHERE confidence_score > 0
   GROUP BY range;"`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Success Rate by Severity:</p>
                        <CodeBlock
                          id="success-rate"
                          language="bash"
                          code={`docker exec -it aira-backend sqlite3 /data/aira.db \\
  "SELECT severity, 
          COUNT(*) as total,
          SUM(CASE WHEN resolution_status='resolved' THEN 1 ELSE 0 END) as resolved,
          ROUND(100.0 * SUM(CASE WHEN resolution_status='resolved' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
   FROM incidents 
   GROUP BY severity;"`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'recovery' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Recovery Procedures</h2>

                <div className="space-y-6">
                  <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-red-400">⚠️ Complete System Reset</h3>
                    <p className="text-yellow-400 text-sm mb-3">Warning: This will delete all data!</p>
                    <CodeBlock
                      id="system-reset"
                      language="bash"
                      code={`# 1. Stop all containers
docker-compose -f docker/docker-compose.yml down

# 2. Remove volumes
docker volume rm aira_sqlite-data aira_redis-data

# 3. Rebuild and restart
docker-compose -f docker/docker-compose.yml build
docker-compose -f docker/docker-compose.yml up -d

# 4. Verify health
./check-aira.sh`}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Backup Procedure</h3>
                    <CodeBlock
                      id="backup"
                      language="bash"
                      code={`cat > backup-aira.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$DATE

# Backup database
docker run --rm -v aira_sqlite-data:/data -v $(pwd)/backups/$DATE:/backup \\
  alpine cp /data/aira.db /backup/aira.db

# Backup Redis
docker exec aira-redis redis-cli SAVE
docker run --rm -v aira_redis-data:/data -v $(pwd)/backups/$DATE:/backup \\
  alpine cp /data/dump.rdb /backup/dump.rdb

echo "Backup created in backups/$DATE/"
EOF

chmod +x backup-aira.sh
./backup-aira.sh`}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">Restore Procedure</h3>
                    <CodeBlock
                      id="restore"
                      language="bash"
                      code={`# Restore from backup
BACKUP_DATE=20240115_120000  # Replace with your backup date

# Stop containers
docker-compose -f docker/docker-compose.yml down

# Restore database
docker run --rm -v aira_sqlite-data:/data -v $(pwd)/backups/$BACKUP_DATE:/backup \\
  alpine cp /backup/aira.db /data/aira.db

# Restore Redis
docker run --rm -v aira_redis-data:/data -v $(pwd)/backups/$BACKUP_DATE:/backup \\
  alpine cp /backup/dump.rdb /data/dump.rdb

# Restart containers
docker-compose -f docker/docker-compose.yml up -d`}
                    />
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-blue-400">💡 Best Practices</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                      <li>Schedule automated backups daily</li>
                      <li>Keep at least 7 days of backups</li>
                      <li>Test restore procedure regularly</li>
                      <li>Store backups in a separate location</li>
                    </ul>
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
          <p>AIRA Diagnosis Guide v1.0.0</p>
          <p className="mt-2 text-xs text-slate-500">
            For additional support, visit GitHub or contact support@aira.example.com
          </p>
        </div>
      </footer>
    </div>
  );
};

// Made with Bob
