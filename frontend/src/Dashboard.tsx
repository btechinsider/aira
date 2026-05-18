import { useState, useEffect } from 'react';
import { Plug, Copy, Check, BookOpen } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [integrationGuide, setIntegrationGuide] = useState<IntegrationGuide | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const webhookUrl = `${BACKEND_URL}/webhook`;

  useEffect(() => {
    fetchIntegrationGuide(selectedLanguage);
  }, [selectedLanguage]);

  const fetchIntegrationGuide = async (language: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/integration/guides/${language}?webhook_url=${encodeURIComponent(webhookUrl)}`
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
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript/Node.js' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plug size={28} className="text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold gradient-text mb-1">Integration Dashboard</h1>
                <p className="text-sm text-slate-400">Connect your applications to AIRA</p>
              </div>
            </div>
            {onBack && (
              <button onClick={onBack} className="btn-ghost btn-sm">
                ← Back to Incidents
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Webhook URL Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Plug size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Webhook Endpoint</h2>
              <p className="text-sm text-slate-400">Send incidents to this URL</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
            <code className="text-blue-300 text-sm flex-1 overflow-x-auto">{webhookUrl}</code>
            <button
              onClick={() => copyToClipboard(webhookUrl, 'webhook')}
              className="btn-secondary btn-sm ml-4"
            >
              {copiedCode === 'webhook' ? <Check size={18} /> : <Copy size={18} />}
              <span>{copiedCode === 'webhook' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> This endpoint is open access - no authentication required. 
              Simply POST your error logs to start receiving AI-powered incident analysis.
            </p>
          </div>
        </div>

        {/* Integration Guides */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <BookOpen size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Integration Guides</h2>
              <p className="text-sm text-slate-400">Choose your programming language</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                fetchIntegrationGuide(e.target.value);
              }}
              className="input w-full max-w-xs"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Integration Guide Content */}
          {integrationGuide && (
            <div className="space-y-6">
              {/* Installation */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Installation</h3>
                <div className="relative">
                  <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300">{integrationGuide.installation}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(integrationGuide.installation, 'install')}
                    className="absolute top-2 right-2 btn-secondary btn-sm"
                  >
                    {copiedCode === 'install' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Code Example */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Code Example</h3>
                <div className="relative">
                  <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300">{integrationGuide.code_example}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(integrationGuide.code_example, 'code')}
                    className="absolute top-2 right-2 btn-secondary btn-sm"
                  >
                    {copiedCode === 'code' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Usage Tips */}
              <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <h4 className="text-sm font-semibold text-green-300 mb-2">💡 Quick Tips</h4>
                <ul className="text-sm text-green-200 space-y-1 list-disc list-inside">
                  <li>Include stack traces for better analysis</li>
                  <li>Add severity levels to prioritize incidents</li>
                  <li>Use structured logging for consistent formatting</li>
                  <li>Test with sample errors before production deployment</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-400">
              <p>
                Need help?{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  View Documentation
                </a>
              </p>
            </div>
            <div className="text-slate-500 text-xs">
              AIRA Integration Dashboard
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Made with Bob