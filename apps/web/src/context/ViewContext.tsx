import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { viewsApi } from '../api/views';
import {
  SavedView,
  ViewType,
  ViewConfig,
  CreateViewDto,
  UpdateViewDto,
  BoardViewConfig,
  ListViewConfig,
  CalendarViewConfig,
} from '@pm/shared';

// Default configurations (defined locally since shared package is types-only)
const DEFAULT_LIST_CONFIG: ListViewConfig = {
  showSubtasks: true,
  indentSubtasks: true,
};

const DEFAULT_BOARD_CONFIG: BoardViewConfig = {
  groupByField: 'status',
  showSubtasks: false,
  cardFields: ['priority', 'assignee', 'dueDate'],
  showEmptyColumns: true,
  columnOrder: [],
  collapsedColumns: [],
};

const DEFAULT_CALENDAR_CONFIG: CalendarViewConfig = {
  dateField: 'dueDate',
  defaultView: 'month',
  showWeekends: true,
  colorBy: 'priority',
};

const DEFAULT_VIEW_CONFIG: ViewConfig = {
  sortBy: [{ field: 'position', direction: 'asc' }],
  groupBy: 'none',
  collapsedGroups: [],
  visibleColumns: ['title', 'status', 'priority', 'assignee', 'dueDate'],
  columnWidths: {},
};

interface ViewContextType {
  views: SavedView[];
  currentView: SavedView | null;
  currentViewType: ViewType;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentView: (view: SavedView) => void;
  setCurrentViewType: (type: ViewType) => void;
  createView: (data: CreateViewDto) => Promise<SavedView>;
  updateView: (viewId: string, data: UpdateViewDto) => Promise<SavedView>;
  updateCurrentViewConfig: (config: Partial<ViewConfig>) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;
  duplicateView: (viewId: string) => Promise<SavedView>;
  refreshViews: () => Promise<void>;
}

const ViewContext = createContext<ViewContextType | null>(null);

interface ViewProviderProps {
  children: ReactNode;
  projectId: string;
}

export function ViewProvider({ children, projectId }: ViewProviderProps) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [currentView, setCurrentView] = useState<SavedView | null>(null);
  const [currentViewType, setCurrentViewTypeState] = useState<ViewType>('BOARD');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViews = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await viewsApi.getByProject(projectId);
      setViews(data);

      // Set default view if available
      const defaultView = data.find((v) => v.isDefault);
      if (defaultView) {
        setCurrentView(defaultView);
        setCurrentViewTypeState(defaultView.type);
      } else if (data.length > 0) {
        setCurrentView(data[0]);
        setCurrentViewTypeState(data[0].type);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load views');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load views when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchViews();
    }
  }, [projectId, fetchViews]);

  const setCurrentViewHandler = useCallback((view: SavedView) => {
    setCurrentView(view);
    setCurrentViewTypeState(view.type);
  }, []);

  const setCurrentViewType = useCallback(
    (type: ViewType) => {
      setCurrentViewTypeState(type);

      // Find a view of this type or create temporary one
      const existingView = views.find((v) => v.type === type);
      if (existingView) {
        setCurrentView(existingView);
      } else {
        // Create a temporary view config
        const tempView: SavedView = {
          id: `temp-${type}`,
          name: getViewTypeName(type),
          type,
          projectId,
          userId: '',
          isDefault: false,
          isShared: false,
          config: getDefaultConfigForType(type),
          filters: null,
          position: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentView(tempView);
      }
    },
    [views, projectId]
  );

  const createView = useCallback(
    async (data: CreateViewDto) => {
      const newView = await viewsApi.create(projectId, data);
      setViews((prev) => [...prev, newView]);
      return newView;
    },
    [projectId]
  );

  const updateView = useCallback(async (viewId: string, data: UpdateViewDto) => {
    const updated = await viewsApi.update(viewId, data);
    setViews((prev) => prev.map((v) => (v.id === viewId ? updated : v)));
    if (currentView?.id === viewId) {
      setCurrentView(updated);
    }
    return updated;
  }, [currentView?.id]);

  const updateCurrentViewConfig = useCallback(
    async (config: Partial<ViewConfig>) => {
      if (!currentView || currentView.id.startsWith('temp-')) {
        // For temporary views, just update state
        setCurrentView((prev) =>
          prev
            ? {
                ...prev,
                config: { ...prev.config, ...config },
              }
            : null
        );
        return;
      }

      await updateView(currentView.id, { config });
    },
    [currentView, updateView]
  );

  const deleteView = useCallback(
    async (viewId: string) => {
      await viewsApi.delete(viewId);
      setViews((prev) => prev.filter((v) => v.id !== viewId));

      // If we deleted the current view, switch to another
      if (currentView?.id === viewId) {
        const remaining = views.filter((v) => v.id !== viewId);
        if (remaining.length > 0) {
          setCurrentView(remaining[0]);
          setCurrentViewTypeState(remaining[0].type);
        } else {
          setCurrentView(null);
        }
      }
    },
    [currentView?.id, views]
  );

  const duplicateView = useCallback(
    async (viewId: string) => {
      const duplicated = await viewsApi.duplicate(viewId);
      setViews((prev) => [...prev, duplicated]);
      return duplicated;
    },
    []
  );

  const refreshViews = useCallback(async () => {
    await fetchViews();
  }, [fetchViews]);

  return (
    <ViewContext.Provider
      value={{
        views,
        currentView,
        currentViewType,
        isLoading,
        error,
        setCurrentView: setCurrentViewHandler,
        setCurrentViewType,
        createView,
        updateView,
        updateCurrentViewConfig,
        deleteView,
        duplicateView,
        refreshViews,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}

// Helper functions
function getViewTypeName(type: ViewType): string {
  const names: Record<ViewType, string> = {
    LIST: 'List',
    BOARD: 'Board',
    CALENDAR: 'Calendar',
    TIMELINE: 'Timeline',
    TABLE: 'Table',
  };
  return names[type];
}

function getDefaultConfigForType(type: ViewType): ViewConfig {
  const baseConfig = { ...DEFAULT_VIEW_CONFIG };

  switch (type) {
    case 'LIST':
      return { ...baseConfig, listConfig: { ...DEFAULT_LIST_CONFIG } };
    case 'BOARD':
      return {
        ...baseConfig,
        groupBy: 'status',
        boardConfig: { ...DEFAULT_BOARD_CONFIG },
      };
    case 'CALENDAR':
      return { ...baseConfig, calendarConfig: { ...DEFAULT_CALENDAR_CONFIG } };
    case 'TIMELINE':
      return { ...baseConfig };
    case 'TABLE':
      return { ...baseConfig };
    default:
      return baseConfig;
  }
}
