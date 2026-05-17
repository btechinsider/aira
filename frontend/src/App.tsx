import { useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import { IncidentFeed } from './IncidentFeed';
import { Dashboard } from './Dashboard';
import { ApiDocumentation } from './ApiDocumentation';
import { UserGuide } from './UserGuide';
import { DiagnosisGuide } from './DiagnosisGuide';
import { EcommerceDemo } from './EcommerceDemo';
import { Sidebar } from './components/Sidebar';
import { ConnectionStatus } from './components/ConnectionStatus';
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

type ViewType = 'incidents' | 'dashboard' | 'ecommerce-demo' | 'api-docs' | 'user-guide' | 'diagnosis-guide';

function MainApp() {
  const [currentView, setCurrentView] = useState<ViewType>('incidents');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Render based on current view with sidebar
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as ViewType)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {currentView === 'dashboard' && <Dashboard onBack={() => setCurrentView('incidents')} />}
        {currentView === 'ecommerce-demo' && <EcommerceDemo onBack={() => setCurrentView('incidents')} />}
        {currentView === 'api-docs' && <ApiDocumentation onBack={() => setCurrentView('incidents')} />}
        {currentView === 'user-guide' && <UserGuide onBack={() => setCurrentView('incidents')} />}
        {currentView === 'diagnosis-guide' && <DiagnosisGuide onBack={() => setCurrentView('incidents')} />}
        {currentView === 'incidents' && <IncidentMonitor />}
      </div>
    </div>
  );
}

function IncidentMonitor() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0 });
  const { lastMessage, isConnected } = useWebSocket(WS_URL);

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
        fetchIncidents();
        break;

      case 'incident_started':
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === lastMessage.incident_id
              ? { ...inc, status: 'processing' }
              : inc
          )
        );
        break;

      case 'incident_completed':
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
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === lastMessage.incident_id
              ? { ...inc, status: 'error' }
              : inc
          )
        );
        break;

      case 'incident_updated':
        fetchIncidents();
        break;
    }
  }, [lastMessage]);

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Incident Monitor</h1>
              <p className="text-sm text-slate-400">Real-time incident tracking and resolution</p>
            </div>

            {/* Stats & Connection */}
            <div className="flex items-center gap-6">
              {/* Connection Status */}
              <ConnectionStatus isConnected={isConnected} />

              {/* Stats Cards */}
              <div className="flex gap-3">
                <div className="px-4 py-2 bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-white">{stats.total}</p>
                </div>
                <div className="px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-700/50">
                  <p className="text-xs text-blue-300">Processing</p>
                  <p className="text-lg font-bold text-blue-300">{stats.processing}</p>
                </div>
                <div className="px-4 py-2 bg-green-900/30 rounded-lg border border-green-700/50">
                  <p className="text-xs text-green-300">Completed</p>
                  <p className="text-lg font-bold text-green-300">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <IncidentFeed incidents={incidents} onRefresh={fetchIncidents} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-400">
              <p>
                Powered by{' '}
                <span className="text-blue-400 font-semibold">Groq Llama 3.3 70B</span>
                {' • '}
                <span className="text-purple-400 font-semibold">LangGraph</span>
                {' • '}
                <span className="text-green-400 font-semibold">IBM BOB AI</span>
              </p>
            </div>
            <div className="text-slate-500 text-xs">
              AIRA v1.0.0 - Autonomous Incident Response Agent
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;

// Made with Bob
