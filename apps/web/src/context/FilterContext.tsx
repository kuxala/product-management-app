import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { filtersApi } from '../api/filters';
import {
  SavedFilter,
  FilterCondition,
  CreateFilterDto,
  QuickFilterType,
} from '@pm/shared';

// Quick filter presets (defined locally since shared package is types-only)
interface QuickFilter {
  type: QuickFilterType;
  label: string;
  conditions: FilterCondition[];
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    type: 'my_tasks',
    label: 'My Tasks',
    conditions: [
      { field: 'assigneeId', operator: 'EQUALS', value: '__CURRENT_USER__' },
    ],
  },
  {
    type: 'unassigned',
    label: 'Unassigned',
    conditions: [{ field: 'assigneeId', operator: 'IS_EMPTY', value: null }],
  },
  {
    type: 'due_today',
    label: 'Due Today',
    conditions: [{ field: 'dueDate', operator: 'IS_TODAY', value: null }],
  },
  {
    type: 'due_this_week',
    label: 'Due This Week',
    conditions: [{ field: 'dueDate', operator: 'IS_THIS_WEEK', value: null }],
  },
  {
    type: 'overdue',
    label: 'Overdue',
    conditions: [{ field: 'dueDate', operator: 'IS_OVERDUE', value: null }],
  },
  {
    type: 'high_priority',
    label: 'High Priority',
    conditions: [{ field: 'priority', operator: 'EQUALS', value: 'HIGH' }],
  },
  {
    type: 'no_due_date',
    label: 'No Due Date',
    conditions: [{ field: 'dueDate', operator: 'IS_EMPTY', value: null }],
  },
];

interface FilterContextType {
  activeFilters: FilterCondition[];
  savedFilters: SavedFilter[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: FilterCondition[]) => void;
  addFilter: (filter: FilterCondition) => void;
  removeFilter: (field: string, index?: number) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;

  // Quick filters
  applyQuickFilter: (type: QuickFilterType, userId: string) => void;

  // Saved filters
  saveCurrentFilters: (name: string, isShared?: boolean) => Promise<SavedFilter>;
  loadSavedFilter: (filterId: string) => void;
  deleteSavedFilter: (filterId: string) => Promise<void>;
  refreshSavedFilters: () => Promise<void>;
}

const FilterContext = createContext<FilterContextType | null>(null);

interface FilterProviderProps {
  children: ReactNode;
  projectId: string;
}

export function FilterProvider({ children, projectId }: FilterProviderProps) {
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [searchQuery, setSearchQueryState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await filtersApi.getByProject(projectId);
      setSavedFilters(data);
      setError(null);
    } catch (err) {
      setError('Failed to load saved filters');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load saved filters when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchSavedFilters();
    }
  }, [projectId, fetchSavedFilters]);

  const setFilters = useCallback((filters: FilterCondition[]) => {
    setActiveFilters(filters);
  }, []);

  const addFilter = useCallback((filter: FilterCondition) => {
    setActiveFilters((prev) => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((field: string, index?: number) => {
    setActiveFilters((prev) => {
      if (index !== undefined) {
        // Remove specific filter by index
        return prev.filter((_, i) => i !== index);
      }
      // Remove first filter with matching field
      const idx = prev.findIndex((f) => f.field === field);
      if (idx >= 0) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQueryState('');
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const applyQuickFilter = useCallback((type: QuickFilterType, userId: string) => {
    const quickFilter = QUICK_FILTERS.find((f) => f.type === type);
    if (quickFilter) {
      // Replace __CURRENT_USER__ placeholder with actual user ID
      const conditions = quickFilter.conditions.map((c) => ({
        ...c,
        value: c.value === '__CURRENT_USER__' ? userId : c.value,
      }));
      setActiveFilters(conditions);
    }
  }, []);

  const saveCurrentFilters = useCallback(
    async (name: string, isShared = false) => {
      const data: CreateFilterDto = {
        name,
        conditions: activeFilters,
        isShared,
      };
      const saved = await filtersApi.createForProject(projectId, data);
      setSavedFilters((prev) => [...prev, saved]);
      return saved;
    },
    [projectId, activeFilters]
  );

  const loadSavedFilter = useCallback(
    (filterId: string) => {
      const filter = savedFilters.find((f) => f.id === filterId);
      if (filter) {
        setActiveFilters(filter.conditions);
      }
    },
    [savedFilters]
  );

  const deleteSavedFilter = useCallback(async (filterId: string) => {
    await filtersApi.delete(filterId);
    setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
  }, []);

  const refreshSavedFilters = useCallback(async () => {
    await fetchSavedFilters();
  }, [fetchSavedFilters]);

  return (
    <FilterContext.Provider
      value={{
        activeFilters,
        savedFilters,
        searchQuery,
        isLoading,
        error,
        setFilters,
        addFilter,
        removeFilter,
        clearFilters,
        setSearchQuery,
        applyQuickFilter,
        saveCurrentFilters,
        loadSavedFilter,
        deleteSavedFilter,
        refreshSavedFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
}
