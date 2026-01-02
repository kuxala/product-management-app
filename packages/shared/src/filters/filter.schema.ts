import { FilterCondition } from '../views/view.schema';

// Saved filter entity
export interface SavedFilter {
  id: string;
  name: string;
  projectId: string | null;
  spaceId: string | null;
  userId: string;
  isShared: boolean;
  conditions: FilterCondition[];
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateFilterDto {
  name: string;
  conditions: FilterCondition[];
  isShared?: boolean;
}

export interface UpdateFilterDto {
  name?: string;
  conditions?: FilterCondition[];
  isShared?: boolean;
}

// Quick filter presets
export type QuickFilterType =
  | 'my_tasks'
  | 'unassigned'
  | 'due_today'
  | 'due_this_week'
  | 'overdue'
  | 'high_priority'
  | 'recently_updated'
  | 'no_due_date';

export interface QuickFilter {
  type: QuickFilterType;
  label: string;
  conditions: FilterCondition[];
}

// Predefined quick filters
export const QUICK_FILTERS: QuickFilter[] = [
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
    type: 'recently_updated',
    label: 'Recently Updated',
    conditions: [
      {
        field: 'updatedAt',
        operator: 'GREATER_THAN',
        value: '__LAST_7_DAYS__',
      },
    ],
  },
  {
    type: 'no_due_date',
    label: 'No Due Date',
    conditions: [{ field: 'dueDate', operator: 'IS_EMPTY', value: null }],
  },
];

// Filter logic for combining conditions
export type FilterLogic = 'AND' | 'OR';

// Advanced filter group (for nested conditions)
export interface FilterGroup {
  logic: FilterLogic;
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}
