import { useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import { IncidentFeed } from './IncidentFeed';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Register } from './Register';
import { Dashboard } from './Dashboard';
import { ApiDocumentation } from './ApiDocumentation';
import { UserGuide } from './UserGuide';
import { DiagnosisGuide } from './DiagnosisGuide';
import './index.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

interface Incident {
  id: string;
  severity: string;
  triage_summary: string;
  confidence_score: number;
  action_taken: string;
  pr_url: string;
  created_at: string;
  status: string;
  messages: string[];
}

type ViewType = 'incidents' | 'dashboard' | 'api-docs' | 'user-guide' | 'diagnosis-guide';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('incidents');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'dashboard':
      return <Dashboard onBack={() => setCurrentView('incidents')} />;
    case 'api-docs':
      return <ApiDocumentation onBack={() => setCurrentView('incidents')} />;
    case 'user-guide':
      return <UserGuide onBack={() => setCurrentView('incidents')} />;
    case 'diagnosis-guide':
      return <DiagnosisGuide onBack={() => setCurrentView('incidents')} />;
    default:
      return <IncidentMonitor onNavigate={setCurrentView} />;
  }
}

function IncidentMonitor({ onNavigate }: { onNavigate: (view: ViewType) => void }) {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0 });
  const { lastMessage, isConnected } = useWebSocket(WS_URL);
  const [showDocsMenu, setShowDocsMenu] = useState(false);

  // Fetch initial incidents
  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/incidents?limit=50`);
      const data = await response.json();
      setIncidents(data.incidents || []);
      
      // Calculate stats
      const total = data.incidents?.length || 0;
      const processing = data.incidents?.filter((i: Incident) => i.status === 'processing').length || 0;
      const completed = data.incidents?.filter((i: Incident) => i.status === 'completed').length || 0;
      setStats({ total, processing, completed });
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'incident_received':
        // Add new incident to the list
        fetchIncidents();
        break;

      case 'incident_started':
        // Update incident status to processing
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === lastMessage.incident_id
              ? { ...inc, status: 'processing' }
              : inc
          )
        );
        break;

      case 'incident_completed':
        // Update incident with completion data
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === lastMessage.incident_id
              ? {
                  ...inc,
                  status: 'completed',
                  severity: lastMessage.data.severity || inc.severity,
                  action_taken: lastMessage.data.action_taken || inc.action_taken,
                  pr_url: lastMessage.data.pr_url || inc.pr_url,
                  confidence_score: lastMessage.data.confidence_score || inc.confidence_score,
                  messages: lastMessage.data.messages || inc.messages,
                }
              : inc
          )
        );
        break;

      case 'incident_error':
        // Update incident status to error
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === lastMessage.incident_id
              ? { ...inc, status: 'error' }
              : inc
          )
        );
        break;

      case 'incident_updated':
        // Refresh incidents
        fetchIncidents();
        break;
    }
  }, [lastMessage]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AIRA
              </h1>
              <span className="text-slate-400 text-sm">
                Autonomous Incident Response Agent
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Navigation Menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  Dashboard
                </button>
                
                {/* Documentation Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDocsMenu(!showDocsMenu)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    📚 Documentation
                    <svg className={`w-4 h-4 transition-transform ${showDocsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showDocsMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20">
                      <button
                        onClick={() => {
                          onNavigate('api-docs');
                          setShowDocsMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors text-sm border-b border-slate-700"
                      >
                        <div className="font-semibold">🔌 API Documentation</div>
                        <div className="text-xs text-slate-400 mt-1">REST API endpoints & examples</div>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('user-guide');
                          setShowDocsMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors text-sm border-b border-slate-700"
                      >
                        <div className="font-semibold">📖 User Guide</div>
                        <div className="text-xs text-slate-400 mt-1">Getting started & best practices</div>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('diagnosis-guide');
                          setShowDocsMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors text-sm"
                      >
                        <div className="font-semibold">🔧 Diagnosis Guide</div>
                        <div className="text-xs text-slate-400 mt-1">Troubleshooting & diagnostics</div>
                      </button>
                    </div>
                  )}
                </div>
                
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

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-slate-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="px-3 py-1 bg-slate-700 rounded">
                  <span className="text-slate-400">Total:</span>{' '}
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="px-3 py-1 bg-blue-900/30 rounded">
                  <span className="text-blue-300">Processing:</span>{' '}
                  <span className="font-semibold">{stats.processing}</span>
                </div>
                <div className="px-3 py-1 bg-green-900/30 rounded">
                  <span className="text-green-300">Completed:</span>{' '}
                  <span className="font-semibold">{stats.completed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <IncidentFeed incidents={incidents} onRefresh={fetchIncidents} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>
            Powered by{' '}
            <span className="text-blue-400 font-semibold">Groq Llama 3.3 70B</span>
            {' • '}
            <span className="text-purple-400 font-semibold">LangGraph</span>
            {' • '}
            <span className="text-green-400 font-semibold">IBM BOB AI</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            AIRA v1.0.0 - Autonomous Incident Response Agent
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

// Made with Bob
