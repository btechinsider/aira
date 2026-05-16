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
  // Enhanced diagnosis fields
  affected_file?: string;
  affected_line?: number;
  root_cause?: string;
  diagnosis?: string;
  language?: string;
  stack_frames_count?: number;
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

  const getLanguageIcon = (language?: string) => {
    if (!language) return '📄';
    const icons: Record<string, string> = {
      python: '🐍',
      javascript: '🟨',
      typescript: '🔷',
      java: '☕',
      go: '🐹',
      ruby: '💎',
      php: '🐘',
      csharp: '#️⃣',
    };
    return icons[language.toLowerCase()] || '📄';
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

            {/* Enhanced Diagnosis Section */}
            {(incident.language || incident.affected_file || incident.root_cause) && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span>🔍</span>
                  <span>Diagnosis Details</span>
                </h4>
                
                {/* Language & Stack Frames */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {incident.language && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getLanguageIcon(incident.language)}</span>
                      <div>
                        <p className="text-xs text-slate-400">Language</p>
                        <p className="text-sm text-white capitalize">{incident.language}</p>
                      </div>
                    </div>
                  )}
                  {incident.stack_frames_count !== undefined && incident.stack_frames_count > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📚</span>
                      <div>
                        <p className="text-xs text-slate-400">Stack Frames</p>
                        <p className="text-sm text-white">{incident.stack_frames_count}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Affected File */}
                {incident.affected_file && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-1">Affected File</p>
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded font-mono text-sm">
                      <span className="text-red-400">📄</span>
                      <span className="text-slate-300">{incident.affected_file}</span>
                      {incident.affected_line && (
                        <span className="text-slate-500">:{incident.affected_line}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Root Cause */}
                {incident.root_cause && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-1">Root Cause</p>
                    <p className="text-sm text-amber-300 bg-slate-900 px-3 py-2 rounded">
                      {incident.root_cause}
                    </p>
                  </div>
                )}

                {/* Detailed Diagnosis */}
                {incident.diagnosis && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-400 hover:text-white transition-colors">
                      View Detailed Diagnosis
                    </summary>
                    <div className="mt-2 text-sm text-slate-300 bg-slate-900 px-3 py-2 rounded whitespace-pre-wrap">
                      {incident.diagnosis}
                    </div>
                  </details>
                )}
              </div>
            )}

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
