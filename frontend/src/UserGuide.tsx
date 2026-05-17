import { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  Rocket,
  BarChart3,
  Lock,
  Key,
  Plug,
  AlertTriangle,
  Eye,
  Sparkles,
  Wrench,
  HelpCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Clock
} from 'lucide-react';

export const UserGuide: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Rocket },
    { id: 'dashboard', title: 'Dashboard Overview', icon: BarChart3 },
    { id: 'registration', title: 'Registration & Login', icon: Lock },
    { id: 'api-keys', title: 'Managing API Keys', icon: Key },
    { id: 'integrations', title: 'Setting Up Integrations', icon: Plug },
    { id: 'incidents', title: 'Understanding Incidents', icon: AlertTriangle },
    { id: 'monitoring', title: 'Monitoring Resolution', icon: Eye },
    { id: 'best-practices', title: 'Best Practices', icon: Sparkles },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: Wrench },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

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
                User Guide
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
          {activeSection === 'getting-started' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Welcome to AIRA</h2>
                <p className="text-slate-300 mb-6">
                  <strong>AIRA</strong> (Autonomous Incident Response Agent) is an AI-powered system that automatically detects, diagnoses, and resolves software incidents.
                </p>

                <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-2 text-blue-400">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                    <li>Access to the AIRA web interface</li>
                    <li>A valid email address for registration</li>
                    <li>Admin access to your log monitoring system</li>
                    <li>GitHub repository access (for automated PR creation)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3">First-Time Setup</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Access the Dashboard</h4>
                      <p className="text-slate-300 text-sm">
                        Open your browser and navigate to <code className="text-blue-400">http://localhost:3000</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Create Your Account</h4>
                      <p className="text-slate-300 text-sm">
                        Click "Register" and fill in your details (email, username, password, full name)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Verify Your Setup</h4>
                      <p className="text-slate-300 text-sm">
                        After registration, you'll see the main dashboard with an empty incident list
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Dashboard Overview</h2>
                <p className="text-slate-300 mb-6">
                  The AIRA dashboard provides a real-time view of all incidents and their resolution status.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">1. Navigation Bar</h3>
                    <p className="text-slate-300 mb-2">Located at the top of the screen:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 ml-4">
                      <li><strong>AIRA Logo</strong>: Click to return to the main dashboard</li>
                      <li><strong>Incidents</strong>: View all incidents</li>
                      <li><strong>API Keys</strong>: Manage your API keys</li>
                      <li><strong>Integrations</strong>: Set up log monitoring integrations</li>
                      <li><strong>User Menu</strong>: Access profile settings and logout</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">2. Incident Feed</h3>
                    <p className="text-slate-300 mb-2">The central area displays all incidents in real-time:</p>
                    <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-600 rounded text-xs font-semibold">P0</span>
                        <span className="text-sm">Critical - Immediate attention required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-orange-600 rounded text-xs font-semibold">P1</span>
                        <span className="text-sm">High - Urgent resolution needed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-yellow-600 rounded text-xs font-semibold">P2</span>
                        <span className="text-sm">Medium - Should be addressed soon</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-600 rounded text-xs font-semibold">P3</span>
                        <span className="text-sm">Low - Can be scheduled for later</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">3. Resolution Status</h3>
                    <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-blue-400" />
                        <span className="text-sm"><strong>Processing</strong>: AIRA is analyzing the incident</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-400" />
                        <span className="text-sm"><strong>Resolved</strong>: Fix has been applied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-400" />
                        <span className="text-sm"><strong>Escalated</strong>: Requires human intervention</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-yellow-400" />
                        <span className="text-sm"><strong>Pending</strong>: Awaiting approval</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'registration' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">User Registration & Login</h2>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Creating an Account</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300">
                    <li>Navigate to the registration page</li>
                    <li>Enter your email, username, password, and full name</li>
                    <li>Click "Register"</li>
                    <li>You'll receive a JWT token and be logged in automatically</li>
                  </ol>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Logging In</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300">
                    <li>Go to the login page</li>
                    <li>Enter your username and password</li>
                    <li>Click "Login"</li>
                    <li>Your session will remain active for 7 days</li>
                  </ol>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-yellow-400">Password Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                    <li>Minimum 8 characters</li>
                    <li>Recommended: Mix of uppercase, lowercase, numbers, and symbols</li>
                    <li>Passwords are securely hashed using bcrypt</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'api-keys' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Managing API Keys</h2>
                <p className="text-slate-300 mb-6">
                  API keys are used to authenticate webhook requests from your log monitoring systems.
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Creating an API Key</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300">
                    <li>Click "API Keys" in the navigation bar</li>
                    <li>Click "Create New API Key"</li>
                    <li>Fill in the name and expiration period</li>
                    <li>Click "Generate Key"</li>
                    <li className="text-yellow-400 font-semibold flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Copy the API key immediately - you won't see it again!
                    </li>
                  </ol>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Security Best Practices</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-green-400 flex items-center gap-2">
                        <CheckCircle size={18} />
                        DO
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                        <li>Create separate keys per environment</li>
                        <li>Set expiration dates</li>
                        <li>Rotate keys every 90 days</li>
                        <li>Store in environment variables</li>
                        <li>Deactivate unused keys</li>
                      </ul>
                    </div>
                    <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-red-400 flex items-center gap-2">
                        <XCircle size={18} />
                        DON'T
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                        <li>Share keys between team members</li>
                        <li>Commit keys to version control</li>
                        <li>Use same key across services</li>
                        <li>Leave expired keys active</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Setting Up Integrations</h2>
                <p className="text-slate-300 mb-6">
                  AIRA integrates with popular log monitoring platforms to automatically receive incident notifications.
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Supported Platforms</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['Datadog', 'Prometheus', 'Grafana', 'Splunk', 'ELK Stack', 'New Relic'].map((platform) => (
                      <div key={platform} className="bg-slate-700 rounded-lg p-4 text-center">
                        <p className="font-semibold">{platform}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Integration Steps</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Access Integration Guides</h4>
                        <p className="text-slate-300 text-sm">
                          Click "Integrations" in the navigation bar and select your platform
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Configure Webhook</h4>
                        <p className="text-slate-300 text-sm">
                          Set up webhook in your monitoring platform with AIRA's endpoint
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Test Integration</h4>
                        <p className="text-slate-300 text-sm">
                          Trigger a test alert and verify it appears in AIRA dashboard
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Configure Alert Rules</h4>
                        <p className="text-slate-300 text-sm">
                          Set up rules to send specific error types to AIRA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'incidents' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Understanding Incidents</h2>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Incident Lifecycle</h3>
                  <div className="flex items-center gap-2 text-sm mb-4 overflow-x-auto">
                    <div className="bg-blue-600 px-3 py-2 rounded whitespace-nowrap">1. Detection</div>
                    <span>→</span>
                    <div className="bg-blue-600 px-3 py-2 rounded whitespace-nowrap">2. Triage</div>
                    <span>→</span>
                    <div className="bg-blue-600 px-3 py-2 rounded whitespace-nowrap">3. Diagnosis</div>
                    <span>→</span>
                    <div className="bg-blue-600 px-3 py-2 rounded whitespace-nowrap">4. Fix Generation</div>
                    <span>→</span>
                    <div className="bg-blue-600 px-3 py-2 rounded whitespace-nowrap">5. Action</div>
                    <span>→</span>
                    <div className="bg-green-600 px-3 py-2 rounded whitespace-nowrap">6. Resolution</div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Severity Levels</h3>
                  <div className="space-y-4">
                    <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-600 rounded text-xs font-semibold">P0</span>
                        <h4 className="font-semibold">Critical</h4>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        System is down or severely degraded. Data loss or corruption risk.
                      </p>
                      <p className="text-slate-400 text-xs">
                        <strong>Response:</strong> Immediate Slack alert
                      </p>
                    </div>

                    <div className="bg-orange-900/20 border border-orange-600/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-orange-600 rounded text-xs font-semibold">P1</span>
                        <h4 className="font-semibold">High</h4>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        Major feature broken. Significant user impact.
                      </p>
                      <p className="text-slate-400 text-xs">
                        <strong>Response:</strong> Auto-fix if high confidence, otherwise alert
                      </p>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-yellow-600 rounded text-xs font-semibold">P2</span>
                        <h4 className="font-semibold">Medium</h4>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        Minor feature broken. Limited user impact.
                      </p>
                      <p className="text-slate-400 text-xs">
                        <strong>Response:</strong> Auto-fix if high confidence
                      </p>
                    </div>

                    <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-600 rounded text-xs font-semibold">P3</span>
                        <h4 className="font-semibold">Low</h4>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        Cosmetic issues. Minimal user impact.
                      </p>
                      <p className="text-slate-400 text-xs">
                        <strong>Response:</strong> Auto-fix and schedule for next release
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Confidence Scores</h3>
                  <p className="text-slate-300 mb-4">
                    AIRA calculates confidence based on three factors:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">LLM Confidence</span>
                        <span className="text-blue-400">40% weight</span>
                      </div>
                      <p className="text-slate-400 text-sm">AI model's confidence in diagnosis</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">Pattern Match Score</span>
                        <span className="text-blue-400">30% weight</span>
                      </div>
                      <p className="text-slate-400 text-sm">Similarity to known error patterns</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">Historical Score</span>
                        <span className="text-blue-400">30% weight</span>
                      </div>
                      <p className="text-slate-400 text-sm">Success rate of similar fixes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'monitoring' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Monitoring Incident Resolution</h2>
                <p className="text-slate-300 mb-6">
                  The dashboard uses WebSocket connections to provide live updates.
                </p>

                <div className="space-y-6">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">1</div>
                      <h4 className="font-semibold">Incident Created</h4>
                    </div>
                    <p className="text-slate-300 text-sm ml-11">
                      New incident appears at the top • Status: "Processing" • Progress: 0%
                    </p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">2</div>
                      <h4 className="font-semibold">Triage Complete</h4>
                    </div>
                    <p className="text-slate-300 text-sm ml-11">
                      Severity badge appears • Initial summary displayed • Progress: 25%
                    </p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">3</div>
                      <h4 className="font-semibold">Diagnosis Complete</h4>
                    </div>
                    <p className="text-slate-300 text-sm ml-11">
                      Root cause identified • Affected files highlighted • Progress: 50%
                    </p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">4</div>
                      <h4 className="font-semibold">Fix Generated</h4>
                    </div>
                    <p className="text-slate-300 text-sm ml-11">
                      Proposed solution displayed • Confidence score shown • Progress: 75%
                    </p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">5</div>
                      <h4 className="font-semibold">Action Taken</h4>
                    </div>
                    <p className="text-slate-300 text-sm ml-11">
                      PR link appears • Status: "Resolved" or "Pending Approval" • Progress: 100%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'best-practices' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Best Practices</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">For Developers</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                      <li>Review auto-generated PRs before merging</li>
                      <li>Check for edge cases and side effects</li>
                      <li>Run full test suite before merging</li>
                      <li>Provide feedback on incorrect fixes</li>
                      <li>Write clear error messages in your code</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">For DevOps/SRE</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                      <li>Configure appropriate alerts (don't send every log line)</li>
                      <li>Set up proper routing based on severity</li>
                      <li>Monitor AIRA performance and confidence trends</li>
                      <li>Rotate API keys quarterly</li>
                      <li>Use separate keys per environment</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">For Team Leads</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                      <li>Establish clear workflows for PR reviews</li>
                      <li>Set SLAs for different severity levels</li>
                      <li>Track metrics (MTTR, auto-fix success rate)</li>
                      <li>Review low-confidence incidents weekly</li>
                      <li>Update blocked paths as needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'troubleshooting' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Troubleshooting</h2>

                <div className="space-y-6">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-red-400">Issue: "API Key Invalid"</h3>
                    <p className="text-slate-300 text-sm mb-2"><strong>Symptoms:</strong> Webhook returns 401 Unauthorized</p>
                    <p className="text-slate-300 text-sm mb-2"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm ml-4">
                      <li>Verify the API key is correct</li>
                      <li>Check if the key is active (not deactivated)</li>
                      <li>Ensure the key hasn't expired</li>
                      <li>Confirm header name is X-API-Key (case-sensitive)</li>
                    </ul>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-red-400">Issue: "Incidents Not Appearing"</h3>
                    <p className="text-slate-300 text-sm mb-2"><strong>Symptoms:</strong> Webhook succeeds but no incident in dashboard</p>
                    <p className="text-slate-300 text-sm mb-2"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm ml-4">
                      <li>Check WebSocket connection (look for connection icon)</li>
                      <li>Refresh the page to reconnect</li>
                      <li>Check browser console for errors</li>
                    </ul>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-red-400">Issue: "Low Confidence Scores"</h3>
                    <p className="text-slate-300 text-sm mb-2"><strong>Symptoms:</strong> Most incidents have confidence {'<'}70%</p>
                    <p className="text-slate-300 text-sm mb-2"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm ml-4">
                      <li>Improve error messages in your code</li>
                      <li>Include more context in stack traces</li>
                      <li>Ensure GitHub repository is accessible</li>
                      <li>Let AIRA learn from more incidents</li>
                    </ul>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
                    <p className="text-blue-400 text-sm flex items-center gap-2">
                      <Lightbulb size={16} />
                      For more detailed troubleshooting, see the <strong>Diagnosis Guide</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: How much does AIRA cost?</h3>
                    <p className="text-slate-300 text-sm">
                      A: AIRA is open-source and free to use. You only pay for Groq API usage, GitHub API usage (usually free), and infrastructure costs.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: What programming languages does AIRA support?</h3>
                    <p className="text-slate-300 text-sm">
                      A: AIRA supports all major languages including Python, JavaScript/TypeScript, Java, Go, Ruby, PHP, C#, C++, Rust, and more.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: How long does incident resolution take?</h3>
                    <p className="text-slate-300 text-sm">
                      A: Typical timeline: Triage (5-10s) + Diagnosis (10-20s) + Fix generation (15-30s) = 30-60 seconds total for most incidents.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: What's the success rate of auto-fixes?</h3>
                    <p className="text-slate-300 text-sm">
                      A: Overall average is 75-85% success rate. Simple bugs (null checks, typos) have 90-95% success, while complex architectural issues have 40-50% success.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: Can I customize the confidence thresholds?</h3>
                    <p className="text-slate-300 text-sm">
                      A: Yes, you can edit the configuration in backend/agent.py to adjust HIGH_CONFIDENCE_THRESHOLD and MEDIUM_CONFIDENCE_THRESHOLD.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: Can I run AIRA on-premises?</h3>
                    <p className="text-slate-300 text-sm">
                      A: Yes, AIRA is fully self-hosted. You need Docker, Docker Compose, a Groq API key, and GitHub access.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-blue-400">Q: Can I integrate with multiple monitoring platforms?</h3>
                    <p className="text-slate-300 text-sm">
                      A: Yes, create separate API keys for each platform and configure webhooks independently.
                    </p>
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
          <p>AIRA User Guide v1.0.0</p>
          <p className="mt-2 text-xs text-slate-500">
            For more help, visit our GitHub repository or contact support
          </p>
        </div>
      </footer>
    </div>
  );
};

// Made with Bob
