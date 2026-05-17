import { useState, useMemo } from 'react';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import {
  GitPullRequest,
  AlertTriangle,
  User,
  Clock,
  RefreshCw,
  List,
  Grid,
  AlignJustify,
  Inbox,
  Search,
  FileCode,
  ExternalLink
} from 'lucide-react';

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

type ViewMode = 'list' | 'grid' | 'compact';
type SortBy = 'newest' | 'oldest' | 'severity' | 'confidence';

export function IncidentFeed({ incidents, onRefresh }: IncidentFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    severity: [],
    status: [],
    language: [],
  });
  const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(new Set());

  // Filter configuration
  const filterGroups = [
    {
      id: 'severity',
      label: 'Severity',
      options: [
        { value: 'P0', label: 'P0 - Critical', count: incidents.filter(i => i.severity === 'P0').length },
        { value: 'P1', label: 'P1 - High', count: incidents.filter(i => i.severity === 'P1').length },
        { value: 'P2', label: 'P2 - Medium', count: incidents.filter(i => i.severity === 'P2').length },
        { value: 'P3', label: 'P3 - Low', count: incidents.filter(i => i.severity === 'P3').length },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'processing', label: 'Processing', count: incidents.filter(i => i.status === 'processing').length },
        { value: 'completed', label: 'Completed', count: incidents.filter(i => i.status === 'completed').length },
        { value: 'error', label: 'Error', count: incidents.filter(i => i.status === 'error').length },
      ],
    },
    {
      id: 'language',
      label: 'Language',
      options: Array.from(new Set(incidents.map(i => i.language).filter(Boolean)))
        .map(lang => ({
          value: lang!,
          label: lang!.charAt(0).toUpperCase() + lang!.slice(1),
          count: incidents.filter(i => i.language === lang).length,
        })),
    },
  ];

  // Filter and search incidents
  const filteredIncidents = useMemo(() => {
    let filtered = [...incidents];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inc) =>
          inc.triage_summary?.toLowerCase().includes(query) ||
          inc.id.toLowerCase().includes(query) ||
          inc.affected_file?.toLowerCase().includes(query) ||
          inc.root_cause?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((inc) => {
          const incValue = inc[key as keyof Incident];
          return values.includes(String(incValue));
        });
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'severity':
          const severityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
          return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
        case 'confidence':
          return b.confidence_score - a.confidence_score;
        default:
          return 0;
      }
    });

    return filtered;
  }, [incidents, searchQuery, selectedFilters, sortBy]);

  const toggleIncidentExpanded = (id: string) => {
    setExpandedIncidents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        return GitPullRequest;
      case 'slack_alert':
        return AlertTriangle;
      case 'human_approval':
        return User;
      default:
        return Clock;
    }
  };

  const getLanguageLabel = (language?: string) => {
    if (!language) return 'File';
    return language.charAt(0).toUpperCase() + language.slice(1);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

  const handleFilterChange = (filterId: string, values: string[]) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: values }));
  };

  const handleClearFilters = () => {
    setSelectedFilters({ severity: [], status: [], language: [] });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <SearchBar
            placeholder="Search incidents by ID, summary, file, or cause..."
            onSearch={setSearchQuery}
          />
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="select text-sm"
            aria-label="Sort incidents"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="severity">By Severity</option>
            <option value="confidence">By Confidence</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-700 rounded-lg p-1" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'compact' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              aria-label="Compact view"
              aria-pressed={viewMode === 'compact'}
            >
              <AlignJustify size={16} />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost btn-sm ${showFilters ? 'bg-blue-600' : ''}`}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="btn-ghost btn-sm"
            aria-label="Refresh incidents"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <p>
          Showing <span className="font-semibold text-white">{filteredIncidents.length}</span> of{' '}
          <span className="font-semibold text-white">{incidents.length}</span> incidents
        </p>
        {(searchQuery || Object.values(selectedFilters).some(v => v.length > 0)) && (
          <button
            onClick={() => {
              setSearchQuery('');
              handleClearFilters();
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Filter Panel */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0 animate-slide-in">
            <FilterPanel
              filters={filterGroups}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearFilters}
            />
          </aside>
        )}

        {/* Incidents List */}
        <div className="flex-1">
          {filteredIncidents.length === 0 ? (
            <div className="empty-state">
              {incidents.length === 0 ? (
                <>
                  <Inbox size={64} className="mb-4 text-slate-600" />
                  <p className="text-lg mb-2">No incidents yet</p>
                  <p className="text-sm">Waiting for incoming log events...</p>
                </>
              ) : (
                <>
                  <Search size={64} className="mb-4 text-slate-600" />
                  <p className="text-lg mb-2">No incidents found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 xl:grid-cols-2 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  viewMode={viewMode}
                  isExpanded={expandedIncidents.has(incident.id)}
                  onToggleExpand={() => toggleIncidentExpanded(incident.id)}
                  getSeverityClass={getSeverityClass}
                  getStatusClass={getStatusClass}
                  getActionIcon={getActionIcon}
                  getLanguageLabel={getLanguageLabel}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IncidentCardProps {
  incident: Incident;
  viewMode: ViewMode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getSeverityClass: (severity: string) => string;
  getStatusClass: (status: string) => string;
  getActionIcon: (action: string) => React.ComponentType<any>;
  getLanguageLabel: (language?: string) => string;
  formatTimestamp: (timestamp: string) => string;
}

function IncidentCard({
  incident,
  viewMode,
  isExpanded,
  onToggleExpand,
  getSeverityClass,
  getStatusClass,
  getActionIcon,
  getLanguageLabel,
  formatTimestamp,
}: IncidentCardProps) {
  const cardClass = viewMode === 'compact' ? 'incident-card-compact' : 'incident-card';

  return (
    <article className={`${cardClass} animate-fade-in`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`severity-badge ${getSeverityClass(incident.severity)}`}>
            {incident.severity}
          </span>
          <span className={`status-badge ${getStatusClass(incident.status)}`}>
            {incident.status}
          </span>
          {incident.language && (
            <span className="badge badge-primary">
              <FileCode size={14} className="mr-1" />
              {getLanguageLabel(incident.language)}
            </span>
          )}
        </div>
        <time className="text-slate-400 text-sm" dateTime={incident.created_at}>
          {formatTimestamp(incident.created_at)}
        </time>
      </div>

      {/* Summary */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {incident.triage_summary || 'Processing...'}
      </h3>

      {/* Incident ID */}
      <p className="text-slate-400 text-xs font-mono mb-3">
        ID: {incident.id}
      </p>

      {/* Quick Info - Always Visible */}
      {(incident.affected_file || incident.root_cause) && (
        <div className="mb-3 space-y-2">
          {incident.affected_file && (
            <div className="flex items-center gap-2 text-sm">
              <FileCode size={16} className="text-red-400" />
              <code className="text-slate-300 text-xs bg-slate-900 px-2 py-1 rounded">
                {incident.affected_file}
                {incident.affected_line && `:${incident.affected_line}`}
              </code>
            </div>
          )}
          {incident.root_cause && viewMode !== 'compact' && (
            <div className="text-sm">
              <span className="text-amber-400 font-medium">Root Cause: </span>
              <span className="text-slate-300">{incident.root_cause}</span>
            </div>
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
          <div className="progress-bar">
            <div
              className={`progress-fill ${
                incident.confidence_score > 0.85
                  ? 'bg-green-500'
                  : incident.confidence_score > 0.6
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${incident.confidence_score * 100}%` }}
              role="progressbar"
              aria-valuenow={incident.confidence_score * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {incident.action_taken && (
          <span className="text-sm text-slate-300 flex items-center gap-1">
            {(() => {
              const IconComponent = getActionIcon(incident.action_taken);
              return <IconComponent size={18} />;
            })()}
            {incident.action_taken.replace('_', ' ')}
          </span>
        )}
        {incident.pr_url && (
          <a
            href={incident.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-success btn-sm"
          >
            <ExternalLink size={16} />
            <span>View PR</span>
          </a>
        )}
        {(incident.diagnosis || incident.messages?.length > 0) && (
          <button
            onClick={onToggleExpand}
            className="btn-outline btn-sm ml-auto"
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-3 animate-fade-in">
          {incident.diagnosis && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Detailed Diagnosis</h4>
              <div className="text-sm text-slate-300 bg-slate-900 px-3 py-2 rounded whitespace-pre-wrap">
                {incident.diagnosis}
              </div>
            </div>
          )}
          {incident.messages && incident.messages.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">
                Agent Messages ({incident.messages.length})
              </h4>
              <div className="space-y-1 pl-4 border-l-2 border-slate-600">
                {incident.messages.map((msg, idx) => (
                  <p key={idx} className="text-sm text-slate-400">
                    • {msg}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// Made with Bob
