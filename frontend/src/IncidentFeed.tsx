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

interface IncidentFeedProps {
  incidents: Incident[];
  onRefresh: () => void;
}

export function IncidentFeed({ incidents, onRefresh }: IncidentFeedProps) {
  const getSeverityClass = (severity: string) => {
    const classes: Record<string, string> = {
      P0: 'severity-p0',
      P1: 'severity-p1',
      P2: 'severity-p2',
      P3: 'severity-p3',
    };
    return classes[severity] || 'severity-p3';
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      processing: 'status-processing',
      completed: 'status-completed',
      error: 'status-error',
    };
    return classes[status] || 'status-processing';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'pr_created':
        return '🔀';
      case 'slack_alert':
        return '🚨';
      case 'human_approval':
        return '👤';
      default:
        return '⏳';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Incident Feed</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="incident-card text-center py-12">
          <p className="text-slate-400 text-lg">No incidents yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Waiting for incoming log events...
          </p>
        </div>
      ) : (
        incidents.map((incident) => (
          <div key={incident.id} className="incident-card">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className={`severity-badge ${getSeverityClass(incident.severity)}`}>
                  {incident.severity}
                </span>
                <span className={`status-badge ${getStatusClass(incident.status)}`}>
                  {incident.status}
                </span>
              </div>
              <span className="text-slate-400 text-sm">
                {formatTimestamp(incident.created_at)}
              </span>
            </div>

            {/* Summary */}
            <h3 className="text-lg font-semibold text-white mb-2">
              {incident.triage_summary || 'Processing...'}
            </h3>

            {/* Incident ID */}
            <p className="text-slate-400 text-sm mb-3 font-mono">
              ID: {incident.id}
            </p>

            {/* Confidence Score */}
            {incident.confidence_score > 0 && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-300">Confidence</span>
                  <span className="text-sm font-semibold text-white">
                    {(incident.confidence_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      incident.confidence_score > 0.85
                        ? 'bg-green-500'
                        : incident.confidence_score > 0.6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${incident.confidence_score * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Taken */}
            {incident.action_taken && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getActionIcon(incident.action_taken)}</span>
                <span className="text-slate-300 capitalize">
                  {incident.action_taken.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* PR Link */}
            {incident.pr_url && (
              <a
                href={incident.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mb-3"
              >
                <span>🔗</span>
                <span>View Pull Request</span>
              </a>
            )}

            {/* Messages */}
            {incident.messages && incident.messages.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-slate-300 hover:text-white transition-colors">
                  Agent Messages ({incident.messages.length})
                </summary>
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-slate-600">
                  {incident.messages.map((msg, idx) => (
                    <p key={idx} className="text-sm text-slate-400">
                      • {msg}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Made with Bob
