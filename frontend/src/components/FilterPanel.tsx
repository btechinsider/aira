import React, { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  filters: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAll: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filters.map((f) => f.id))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCheckboxChange = (filterId: string, value: string) => {
    const current = selectedFilters[filterId] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(filterId, next);
  };

  const totalSelected = Object.values(selectedFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  return (
    <div className="card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {totalSelected > 0 && (
            <span className="badge badge-primary">{totalSelected}</span>
          )}
        </h3>
        {totalSelected > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-3">
        {filters.map((group) => (
          <div key={group.id} className="border-b border-slate-700 last:border-0 pb-3 last:pb-0">
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between py-2 text-left hover:text-white transition-colors"
              aria-expanded={expandedGroups.has(group.id)}
            >
              <span className="font-medium text-slate-300">{group.label}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  expandedGroups.has(group.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedGroups.has(group.id) && (
              <div className="space-y-2 mt-2 pl-2">
                {group.options.map((option) => {
                  const isSelected = (selectedFilters[group.id] || []).includes(
                    option.value
                  );
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(group.id, option.value)}
                        className="checkbox"
                      />
                      <span className="text-sm text-slate-300 group-hover:text-white flex-1">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="text-xs text-slate-500">
                          {option.count}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Made with Bob