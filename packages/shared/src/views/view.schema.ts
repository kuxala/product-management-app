// View Types
export type ViewType = 'LIST' | 'BOARD' | 'CALENDAR' | 'TIMELINE' | 'TABLE';

// Filter Operators
export type FilterOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_OR_EQUAL'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'
  | 'IN'
  | 'NOT_IN'
  | 'BETWEEN'
  | 'IS_BEFORE'
  | 'IS_AFTER'
  | 'IS_TODAY'
  | 'IS_THIS_WEEK'
  | 'IS_THIS_MONTH'
  | 'IS_OVERDUE';

// Fields that can be filtered
export type FilterField =
  | 'status'
  | 'priority'
  | 'assigneeId'
  | 'dueDate'
  | 'startDate'
  | 'taskListId'
  | 'labels'
  | 'title'
  | 'description'
  | 'createdAt'
  | 'updatedAt'
  | 'parentId'
  | 'estimate';

// Sort direction
export type SortDirection = 'asc' | 'desc';

// Fields that can be grouped by
export type GroupByField =
  | 'status'
  | 'priority'
  | 'assigneeId'
  | 'taskListId'
  | 'dueDate'
  | 'none';

// Filter condition
export interface FilterCondition {
  field: FilterField;
  operator: FilterOperator;
  value: string | string[] | number | boolean | null;
}

// Sort configuration
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// Board view specific configuration
export interface BoardViewConfig {
  groupByField: 'status' | 'priority' | 'taskListId' | 'assigneeId';
  showSubtasks: boolean;
  cardFields: string[];
  showEmptyColumns: boolean;
  columnOrder: string[];
  collapsedColumns: string[];
}

// Calendar view specific configuration
export interface CalendarViewConfig {
  dateField: 'dueDate' | 'startDate' | 'createdAt';
  defaultView: 'month' | 'week' | 'day';
  showWeekends: boolean;
  colorBy: 'status' | 'priority' | 'taskList';
}

// Timeline view specific configuration
export interface TimelineViewConfig {
  startField: 'startDate' | 'createdAt';
  endField: 'dueDate';
  showDependencies: boolean;
  showMilestones: boolean;
  zoom: 'day' | 'week' | 'month' | 'quarter';
}

// Table view specific configuration
export interface TableViewConfig {
  rowHeight: 'compact' | 'comfortable' | 'spacious';
  frozenColumns: string[];
  inlineEditing: boolean;
}

// List view specific configuration
export interface ListViewConfig {
  showSubtasks: boolean;
  indentSubtasks: boolean;
}

// Main view configuration
export interface ViewConfig {
  sortBy: SortConfig[];
  groupBy: GroupByField;
  collapsedGroups: string[];
  visibleColumns: string[];
  columnWidths: Record<string, number>;
  // View-specific configurations
  boardConfig?: BoardViewConfig;
  calendarConfig?: CalendarViewConfig;
  timelineConfig?: TimelineViewConfig;
  tableConfig?: TableViewConfig;
  listConfig?: ListViewConfig;
}

// Saved view entity
export interface SavedView {
  id: string;
  name: string;
  type: ViewType;
  projectId: string;
  userId: string;
  isDefault: boolean;
  isShared: boolean;
  config: ViewConfig;
  filters: FilterCondition[] | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateViewDto {
  name: string;
  type: ViewType;
  isDefault?: boolean;
  isShared?: boolean;
  config: ViewConfig;
  filters?: FilterCondition[];
}

export interface UpdateViewDto {
  name?: string;
  isDefault?: boolean;
  isShared?: boolean;
  config?: Partial<ViewConfig>;
  filters?: FilterCondition[] | null;
  position?: number;
}

export interface ReorderViewsDto {
  viewIds: string[];
}

// Default view configurations
export const DEFAULT_LIST_CONFIG: ListViewConfig = {
  showSubtasks: true,
  indentSubtasks: true,
};

export const DEFAULT_BOARD_CONFIG: BoardViewConfig = {
  groupByField: 'status',
  showSubtasks: false,
  cardFields: ['priority', 'assignee', 'dueDate'],
  showEmptyColumns: true,
  columnOrder: [],
  collapsedColumns: [],
};

export const DEFAULT_CALENDAR_CONFIG: CalendarViewConfig = {
  dateField: 'dueDate',
  defaultView: 'month',
  showWeekends: true,
  colorBy: 'priority',
};

export const DEFAULT_TIMELINE_CONFIG: TimelineViewConfig = {
  startField: 'startDate',
  endField: 'dueDate',
  showDependencies: true,
  showMilestones: true,
  zoom: 'week',
};

export const DEFAULT_TABLE_CONFIG: TableViewConfig = {
  rowHeight: 'comfortable',
  frozenColumns: ['title'],
  inlineEditing: true,
};

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  sortBy: [{ field: 'position', direction: 'asc' }],
  groupBy: 'none',
  collapsedGroups: [],
  visibleColumns: ['title', 'status', 'priority', 'assignee', 'dueDate'],
  columnWidths: {},
};

// Default columns for different views
export const DEFAULT_LIST_COLUMNS = [
  'title',
  'status',
  'priority',
  'assignee',
  'dueDate',
  'estimate',
];

export const DEFAULT_TABLE_COLUMNS = [
  'title',
  'status',
  'priority',
  'assignee',
  'dueDate',
  'startDate',
  'estimate',
  'taskList',
  'labels',
];
