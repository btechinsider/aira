import { useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import { IncidentFeed } from './IncidentFeed';
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

function App() {
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

export default App;

// Made with Bob
