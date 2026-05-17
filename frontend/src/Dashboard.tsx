import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Key, Plug, Copy, Check, X, BookOpen } from 'lucide-react';

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
  const { user, token } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState(365);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [integrationGuide, setIntegrationGuide] = useState<IntegrationGuide | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'keys' | 'integration'>('keys');

  const webhookUrl = `${BACKEND_URL}/webhook`;

  useEffect(() => {
    if (token) {
      fetchAPIKeys();
    }
  }, [token]);

  const fetchAPIKeys = async () => {
    if (!token) {
      console.error('No authentication token available');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/auth/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        console.error('Failed to fetch API keys:', response.status, response.statusText);
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
        setNewKeyExpiry(365);
        setShowCreateModal(false);
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
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

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
        setActiveTab('integration');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { label: 'Never', color: 'text-slate-400' };
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / 86400000);
    
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'text-red-400' };
    if (daysUntilExpiry < 7) return { label: `${daysUntilExpiry} days left`, color: 'text-yellow-400' };
    if (daysUntilExpiry < 30) return { label: `${daysUntilExpiry} days left`, color: 'text-blue-400' };
    return { label: expiry.toLocaleDateString(), color: 'text-green-400' };
  };

  const activeKeys = apiKeys.filter(k => k.is_active).length;
  const totalKeys = apiKeys.length;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-1">API Dashboard</h1>
              <p className="text-sm text-slate-400">Manage your API keys and integrations</p>
            </div>
            {onBack && (
              <button onClick={onBack} className="btn-ghost btn-sm">
                ← Back to Incidents
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total API Keys</p>
                <p className="text-3xl font-bold text-white">{totalKeys}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Active Keys</p>
                <p className="text-3xl font-bold text-green-400">{activeKeys}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Webhook URL</p>
                <p className="text-sm font-mono text-white truncate">{webhookUrl}</p>
              </div>
              <button
                onClick={() => copyToClipboard(webhookUrl, 'webhook-stat')}
                className="btn-icon"
                title="Copy webhook URL"
              >
                {copiedKey === 'webhook-stat' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs mb-6">
          <button
            onClick={() => setActiveTab('keys')}
            className={activeTab === 'keys' ? 'tab-active' : 'tab'}
          >
            <Key size={18} />
            <span>API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={activeTab === 'integration' ? 'tab-active' : 'tab'}
          >
            <Plug size={18} />
            <span>Integration Guide</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'keys' ? (
          <div className="space-y-6">
            {/* Create Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Your API Keys</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Key
              </button>
            </div>

            {/* API Keys List */}
            {apiKeys.length === 0 ? (
              <div className="empty-state">
                <Key size={64} className="mb-4 text-slate-600" />
                <p className="text-lg mb-2">No API keys yet</p>
                <p className="text-sm mb-4">Create your first API key to start integrating with AIRA</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create API Key
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {apiKeys.map((key) => {
                  const expiryStatus = getExpiryStatus(key.expires_at);
                  return (
                    <div key={key.id} className="card p-6 card-hover">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{key.name}</h3>
                            <span className={`badge ${key.is_active ? 'badge-success' : 'badge-error'}`}>
                              {key.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>Created {formatDate(key.created_at)}</span>
                            {key.last_used_at && (
                              <span>• Last used {formatDate(key.last_used_at)}</span>
                            )}
                            <span className={`• ${expiryStatus.color}`}>
                              Expires: {expiryStatus.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAPIKey(key.id)}
                            className={key.is_active ? 'btn-ghost btn-sm' : 'btn-success btn-sm'}
                            title={key.is_active ? 'Disable key' : 'Enable key'}
                          >
                            {key.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteAPIKey(key.id)}
                            className="btn-danger btn-sm"
                            title="Delete key"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 bg-slate-900 rounded-lg text-sm font-mono overflow-x-auto border border-slate-700">
                          {key.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key, key.id)}
                          className="btn-primary btn-sm"
                        >
                          {copiedKey === key.id ? (
                            <>
                              <Check size={16} />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => fetchIntegrationGuide('python', key.key)}
                          className="btn-secondary btn-sm"
                        >
                          Get Code
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Integration Guide</h2>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  if (apiKeys.length > 0) {
                    fetchIntegrationGuide(e.target.value, apiKeys[0].key);
                  }
                }}
                className="select"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
              </select>
            </div>

            {integrationGuide ? (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{integrationGuide.title}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Installation</label>
                    <div className="relative">
                      <code className="code-block">{integrationGuide.installation}</code>
                      <button
                        onClick={() => copyToClipboard(integrationGuide.installation, 'install')}
                        className="absolute top-2 right-2 btn-ghost btn-sm"
                      >
                        {copiedKey === 'install' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Code Example</label>
                    <div className="relative">
                      <pre className="code-block max-h-96 overflow-y-auto">
                        {integrationGuide.code_example}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(integrationGuide.code_example, 'code')}
                        className="absolute top-2 right-2 btn-ghost btn-sm"
                      >
                        {copiedKey === 'code' ? (
                          <>
                            <Check size={16} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen size={64} className="mb-4 text-slate-600" />
                <p className="text-lg mb-2">Select a language to view integration guide</p>
                <p className="text-sm">Choose a programming language from the dropdown above</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create New API Key</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-icon"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="alert-error mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="keyName" className="label">
                    Key Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production App, Staging Environment"
                    className="input"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Choose a descriptive name to identify this key
                  </p>
                </div>

                <div>
                  <label htmlFor="keyExpiry" className="label">
                    Expires In (days)
                  </label>
                  <input
                    id="keyExpiry"
                    type="number"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(parseInt(e.target.value) || 0)}
                    min="0"
                    className="input"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Set to 0 for a non-expiring key (not recommended for production)
                  </p>
                </div>

                <div className="alert-warning">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">
                    Save this key immediately after creation. You won't be able to see it again!
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={createAPIKey}
                  disabled={isLoading || !newKeyName.trim()}
                  className="btn-primary flex-1"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Key</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setNewKeyName('');
                    setNewKeyExpiry(365);
                  }}
                  disabled={isLoading}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Made with Bob