import { useState } from 'react';
import { FilterCondition, FilterField, FilterOperator, QuickFilterType } from '@pm/shared';
import { FilterChip } from './FilterChip';

// Quick filter presets (defined locally since shared package is types-only)
interface QuickFilter {
  type: QuickFilterType;
  label: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { type: 'my_tasks', label: 'My Tasks' },
  { type: 'unassigned', label: 'Unassigned' },
  { type: 'due_today', label: 'Due Today' },
  { type: 'due_this_week', label: 'Due This Week' },
  { type: 'overdue', label: 'Overdue' },
  { type: 'high_priority', label: 'High Priority' },
  { type: 'no_due_date', label: 'No Due Date' },
];

interface FilterBarProps {
  activeFilters: FilterCondition[];
  searchQuery: string;
  onAddFilter: (filter: FilterCondition) => void;
  onRemoveFilter: (field: string, index?: number) => void;
  onClearFilters: () => void;
  onSearchChange: (query: string) => void;
  onQuickFilter: (type: QuickFilterType, userId: string) => void;
  currentUserId: string;
}

const FILTER_FIELDS: { field: FilterField; label: string; type: 'select' | 'text' | 'date' }[] = [
  { field: 'status', label: 'Status', type: 'select' },
  { field: 'priority', label: 'Priority', type: 'select' },
  { field: 'assigneeId', label: 'Assignee', type: 'select' },
  { field: 'dueDate', label: 'Due Date', type: 'date' },
  { field: 'taskListId', label: 'List', type: 'select' },
];

export function FilterBar({
  activeFilters,
  searchQuery,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onSearchChange,
  onQuickFilter,
  currentUserId,
}: FilterBarProps) {
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.map((filter, index) => (
        <FilterChip
          key={`${filter.field}-${index}`}
          filter={filter}
          onRemove={() => onRemoveFilter(filter.field, index)}
        />
      ))}

      {/* Add Filter Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddFilter(!showAddFilter)}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Filter</span>
        </button>

        {showAddFilter && (
          <FilterDropdown
            onAddFilter={(filter) => {
              onAddFilter(filter);
              setShowAddFilter(false);
            }}
            onClose={() => setShowAddFilter(false)}
          />
        )}
      </div>

      {/* Quick Filters Button */}
      <div className="relative">
        <button
          onClick={() => setShowQuickFilters(!showQuickFilters)}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Quick</span>
        </button>

        {showQuickFilters && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="py-1">
              {QUICK_FILTERS.map((qf) => (
                <button
                  key={qf.type}
                  onClick={() => {
                    onQuickFilter(qf.type, currentUserId);
                    setShowQuickFilters(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  {qf.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {(activeFilters.length > 0 || searchQuery) && (
        <button
          onClick={onClearFilters}
          className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

interface FilterDropdownProps {
  onAddFilter: (filter: FilterCondition) => void;
  onClose: () => void;
}

function FilterDropdown({ onAddFilter, onClose }: FilterDropdownProps) {
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [operator] = useState<FilterOperator>('EQUALS');
  const [value, setValue] = useState<string>('');

  const handleAdd = () => {
    if (selectedField && value) {
      onAddFilter({
        field: selectedField,
        operator,
        value,
      });
    }
  };

  const getOptionsForField = (field: FilterField): string[] => {
    switch (field) {
      case 'status':
        return ['TODO', 'IN_PROGRESS', 'DONE'];
      case 'priority':
        return ['LOW', 'MEDIUM', 'HIGH'];
      default:
        return [];
    }
  };

  return (
    <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
      <div className="space-y-3">
        {/* Field Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
          <select
            value={selectedField || ''}
            onChange={(e) => setSelectedField(e.target.value as FilterField)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select field...</option>
            {FILTER_FIELDS.map((f) => (
              <option key={f.field} value={f.field}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value Selection */}
        {selectedField && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
            {['status', 'priority'].includes(selectedField) ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select value...</option>
                {getOptionsForField(selectedField).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedField || !value}
            className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Filter
          </button>
        </div>
      </div>
    </div>
  );
}
