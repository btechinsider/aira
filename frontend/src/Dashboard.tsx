import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface APIKey {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

interface IntegrationGuide {
  language: string;
  title: string;
  code_example: string;
  installation: string;
}

interface DashboardProps {
  onBack?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const { user, token, logout } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState(365);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [integrationGuide, setIntegrationGuide] = useState<IntegrationGuide | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const webhookUrl = `${BACKEND_URL}/webhook`;

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/auth/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName,
          expires_in_days: newKeyExpiry,
        }),
      });

      if (response.ok) {
        await fetchAPIKeys();
        setNewKeyName('');
        setShowCreateKey(false);
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to create API key');
      }
    } catch (err) {
      setError('Failed to create API key');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAPIKey = async (keyId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/api-keys/${keyId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchAPIKeys();
      }
    } catch (err) {
      console.error('Failed to toggle API key:', err);
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/auth/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchAPIKeys();
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const fetchIntegrationGuide = async (language: string, apiKey: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/integration/guides/${language}?webhook_url=${encodeURIComponent(webhookUrl)}&api_key=${encodeURIComponent(apiKey)}`
      );
      if (response.ok) {
        const data = await response.json();
        setIntegrationGuide(data);
      }
    } catch (err) {
      console.error('Failed to fetch integration guide:', err);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
                >
                  ← Back
                </button>
              )}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AIRA Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Welcome back,</p>
                <p className="font-semibold">{user?.username}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API Keys Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">API Keys</h2>
                <button
                  onClick={() => setShowCreateKey(!showCreateKey)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  + Create New Key
                </button>
              </div>

              {/* Create Key Form */}
              {showCreateKey && (
                <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                  <h3 className="font-semibold mb-4">Create New API Key</h3>
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production App"
                        className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Expires In (days)
                      </label>
                      <input
                        type="number"
                        value={newKeyExpiry}
                        onChange={(e) => setNewKeyExpiry(parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={createAPIKey}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateKey(false);
                          setError('');
                        }}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys List */}
              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No API keys yet. Create one to get started!
                  </p>
                ) : (
                  apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{key.name}</h3>
                          <p className="text-sm text-slate-400">
                            Created: {new Date(key.created_at).toLocaleDateString()}
                          </p>
                          {key.last_used_at && (
                            <p className="text-sm text-slate-400">
                              Last used: {new Date(key.last_used_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAPIKey(key.id)}
                            className={`px-3 py-1 rounded text-sm ${
                              key.is_active
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-slate-600 hover:bg-slate-500'
                            }`}
                          >
                            {key.is_active ? 'Active' : 'Disabled'}
                          </button>
                          <button
                            onClick={() => deleteAPIKey(key.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <code className="flex-1 px-3 py-2 bg-slate-800 rounded text-sm font-mono overflow-x-auto">
                          {key.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key, key.id)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm whitespace-nowrap"
                        >
                          {copiedKey === key.id ? '✓ Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLanguage('python');
                            fetchIntegrationGuide('python', key.key);
                          }}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm whitespace-nowrap"
                        >
                          Get Code
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Integration Guide Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-4">
              <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-slate-700 rounded text-sm font-mono overflow-x-auto">
                      {webhookUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      {copiedKey === 'webhook' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                {integrationGuide && (
                  <div>
                    <h3 className="font-semibold mb-2">{integrationGuide.title}</h3>
                    <div className="text-sm text-slate-400 mb-2">
                      Installation:
                    </div>
                    <code className="block px-3 py-2 bg-slate-700 rounded text-sm font-mono mb-4">
                      {integrationGuide.installation}
                    </code>
                    <div className="text-sm text-slate-400 mb-2">
                      Code Example:
                    </div>
                    <div className="relative">
                      <pre className="px-3 py-2 bg-slate-700 rounded text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                        {integrationGuide.code_example}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(integrationGuide.code_example, 'code')}
                        className="absolute top-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                      >
                        {copiedKey === 'code' ? '✓ Copied!' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700">
                  <h3 className="font-semibold mb-2">Documentation</h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li>• <a href="/docs" className="text-blue-400 hover:text-blue-300">API Documentation</a></li>
                    <li>• <a href="/USER_ONBOARDING_GUIDE.md" className="text-blue-400 hover:text-blue-300">User Guide</a></li>
                    <li>• <a href="/DIAGNOSIS_AGENT_GUIDE.md" className="text-blue-400 hover:text-blue-300">Diagnosis Guide</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Made with Bob