# Step 3: Multiple Views & Filtering

## Overview

Provide multiple ways to visualize and interact with tasks, along with powerful filtering, grouping, and search capabilities.

## Goals

- Implement List view with sortable columns
- Create Kanban Board view with drag-and-drop
- Build Calendar view for date-based planning
- Develop Timeline/Gantt view for project planning
- Add Table view for spreadsheet-like editing
- Create advanced filtering with saved presets
- Enable grouping by various attributes
- Implement full-text search

---

## Database Schema

### Saved Views & Filters

```prisma
// Saved view configuration
model SavedView {
  id          String    @id @default(uuid())
  name        String
  type        ViewType
  projectId   String?   // Project-specific view
  spaceId     String?   // Space-wide view
  userId      String?   // Personal view (null = shared)
  isDefault   Boolean   @default(false)
  config      Json      // View-specific configuration
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  project     Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  space       Space?    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([spaceId])
  @@index([userId])
}

enum ViewType {
  LIST
  BOARD
  CALENDAR
  TIMELINE
  TABLE
}

// Saved filter preset
model SavedFilter {
  id          String   @id @default(uuid())
  name        String
  projectId   String?
  spaceId     String?
  userId      String?
  filters     Json     // Filter configuration
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  space       Space?   @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([spaceId])
  @@index([userId])
}
```

### View Configuration Types

```typescript
// Base view configuration
interface BaseViewConfig {
  filters?: FilterConfig;
  groupBy?: GroupByConfig;
  sortBy?: SortConfig[];
}

// List view specific
interface ListViewConfig extends BaseViewConfig {
  type: 'LIST';
  columns: ListColumn[];
  showSubtasks: boolean;
  collapsedGroups: string[];
}

interface ListColumn {
  field: string; // Built-in or custom field ID
  width: number;
  visible: boolean;
}

// Board view specific
interface BoardViewConfig extends BaseViewConfig {
  type: 'BOARD';
  groupByField: string; // status, priority, assignee, custom field
  columnOrder: string[];
  collapsedColumns: string[];
  showEmptyColumns: boolean;
  cardFields: string[]; // Fields to show on cards
}

// Calendar view specific
interface CalendarViewConfig extends BaseViewConfig {
  type: 'CALENDAR';
  dateField: 'dueDate' | 'startDate' | 'createdAt' | string;
  showWeekends: boolean;
  defaultView: 'month' | 'week' | 'day';
  colorBy: string; // Field to determine color
}

// Timeline view specific
interface TimelineViewConfig extends BaseViewConfig {
  type: 'TIMELINE';
  startField: string;
  endField: string;
  showDependencies: boolean;
  showMilestones: boolean;
  zoomLevel: 'day' | 'week' | 'month' | 'quarter';
}

// Table view specific
interface TableViewConfig extends BaseViewConfig {
  type: 'TABLE';
  columns: TableColumn[];
  frozenColumns: number;
  rowHeight: 'compact' | 'normal' | 'comfortable';
}

interface TableColumn {
  field: string;
  width: number;
  editable: boolean;
}
```

### Filter Configuration

```typescript
interface FilterConfig {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
  groups?: FilterConfig[]; // Nested filter groups
}

interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_before'
  | 'is_after'
  | 'is_today'
  | 'is_this_week'
  | 'is_this_month'
  | 'is_overdue';

interface GroupByConfig {
  field: string;
  order: 'asc' | 'desc';
  showEmpty: boolean;
}

interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}
```

---

## API Endpoints

### Views

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/projects/:projectId/views` | Create view | Member |
| GET | `/api/projects/:projectId/views` | List views | Member |
| GET | `/api/views/:id` | Get view config | Member |
| PATCH | `/api/views/:id` | Update view | Owner/Creator |
| DELETE | `/api/views/:id` | Delete view | Owner/Creator |
| POST | `/api/views/:id/duplicate` | Duplicate view | Member |

### Filters

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/projects/:projectId/filters` | Save filter | Member |
| GET | `/api/projects/:projectId/filters` | List saved filters | Member |
| PATCH | `/api/filters/:id` | Update filter | Owner/Creator |
| DELETE | `/api/filters/:id` | Delete filter | Owner/Creator |

### Task Queries

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/projects/:projectId/tasks/query` | Query tasks with filters | Member |
| GET | `/api/projects/:projectId/tasks/search` | Full-text search | Member |
| GET | `/api/projects/:projectId/tasks/calendar` | Tasks for calendar range | Member |
| GET | `/api/projects/:projectId/tasks/timeline` | Tasks for timeline | Member |

---

## Task Query API

### Request

```typescript
interface TaskQueryDto {
  filters?: FilterConfig;
  groupBy?: GroupByConfig;
  sortBy?: SortConfig[];
  pagination?: {
    page: number;
    limit: number;
  };
  include?: {
    subtasks?: boolean;
    customFields?: boolean;
    assignee?: boolean;
    labels?: boolean;
    checklists?: boolean;
  };
}
```

### Response

```typescript
interface TaskQueryResponseDto {
  tasks: TaskResponseDto[];
  groups?: TaskGroupDto[];
  total: number;
  page: number;
  totalPages: number;
}

interface TaskGroupDto {
  key: string;
  label: string;
  color?: string;
  tasks: TaskResponseDto[];
  count: number;
}
```

### Query Examples

```typescript
// Tasks assigned to me, due this week, high priority
const query: TaskQueryDto = {
  filters: {
    logic: 'AND',
    conditions: [
      { field: 'assigneeId', operator: 'equals', value: currentUserId },
      { field: 'dueDate', operator: 'is_this_week', value: null },
      { field: 'priority', operator: 'equals', value: 'HIGH' },
    ],
  },
  sortBy: [{ field: 'dueDate', order: 'asc' }],
};

// Overdue tasks grouped by assignee
const query: TaskQueryDto = {
  filters: {
    logic: 'AND',
    conditions: [
      { field: 'dueDate', operator: 'is_overdue', value: null },
      { field: 'status', operator: 'not_equals', value: 'DONE' },
    ],
  },
  groupBy: { field: 'assigneeId', order: 'asc', showEmpty: false },
};

// Tasks with specific label and custom field
const query: TaskQueryDto = {
  filters: {
    logic: 'AND',
    conditions: [
      { field: 'labels', operator: 'in', value: ['label-id-1'] },
      { field: 'customField.sprint', operator: 'equals', value: 'Sprint 5' },
    ],
  },
};
```

---

## Frontend Components

### View System

```
src/components/views/
├── ViewContainer.tsx         # Renders active view type
├── ViewSwitcher.tsx          # Toggle between views
├── ViewSettings.tsx          # View configuration modal
├── ViewSelector.tsx          # Dropdown of saved views
└── CreateViewModal.tsx       # New view wizard
```

### List View

```
src/components/views/list/
├── ListView.tsx              # Main list view container
├── ListHeader.tsx            # Column headers with sort
├── ListRow.tsx               # Task row
├── ListCell.tsx              # Individual cell
├── ListGroup.tsx             # Grouped section
├── ColumnResizer.tsx         # Drag to resize columns
└── InlineEditor.tsx          # Edit cell in place
```

**List View Mockup:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [☰ List ▼]  [+ Add View]     🔍 Search    [Filter ▼] [Group ▼] [Sort ▼]   │
├────────────────────────────────────────────────────────────────────────────┤
│ □ Title              │ Status    │ Priority │ Assignee  │ Due Date │ Est. │
├──────────────────────┼───────────┼──────────┼───────────┼──────────┼──────┤
│ ▼ Sprint 1 (5 tasks)                                                       │
├──────────────────────┼───────────┼──────────┼───────────┼──────────┼──────┤
│ □ Fix login bug      │ 🔵 TODO   │ 🔴 High  │ @alice    │ Jan 15   │ 2h   │
│   └─ □ Write tests   │ 🟢 Done   │ 🟡 Med   │ @bob      │ Jan 14   │ 1h   │
│ □ Add dark mode      │ 🟡 In Pr  │ 🟡 Med   │ @alice    │ Jan 20   │ 4h   │
├──────────────────────┼───────────┼──────────┼───────────┼──────────┼──────┤
│ ▼ Backlog (12 tasks)                                                       │
├──────────────────────┼───────────┼──────────┼───────────┼──────────┼──────┤
│ □ Refactor auth      │ 🔵 TODO   │ 🟢 Low   │ --        │ --       │ 8h   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Board View

```
src/components/views/board/
├── BoardView.tsx             # Main board container
├── BoardColumn.tsx           # Single column (status/group)
├── BoardCard.tsx             # Draggable task card
├── BoardColumnHeader.tsx     # Column title and count
├── AddCardButton.tsx         # Quick add in column
└── BoardSettings.tsx         # Board configuration
```

**Board View Mockup:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [☰ Board ▼]  [+ Add View]    🔍 Search    [Filter ▼] [Group by: Status ▼] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  TODO (3)              IN PROGRESS (2)        DONE (8)                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 🔴 Fix login bug │  │ 🟡 Add dark mode │  │ 🟢 Setup CI/CD   │         │
│  │ @alice  Jan 15   │  │ @alice  Jan 20   │  │ @bob   Jan 10    │         │
│  │ ☑ 1/3  💬 2      │  │ ☑ 2/5  💬 5      │  │                  │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 🟡 Refactor auth │  │ 🔴 API rate limit│  │ 🟡 Add logging   │         │
│  │ --       --      │  │ @charlie Jan 18  │  │ @alice Jan 8     │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│  ┌──────────────────┐                        ┌──────────────────┐         │
│  │ 🟢 Update docs   │                        │ ...              │         │
│  │ @bob     Jan 25  │                        └──────────────────┘         │
│  └──────────────────┘                                                      │
│  [+ Add task]           [+ Add task]          [+ Add task]                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Calendar View

```
src/components/views/calendar/
├── CalendarView.tsx          # Main calendar container
├── CalendarHeader.tsx        # Month/week navigation
├── CalendarGrid.tsx          # Day cells grid
├── CalendarDay.tsx           # Single day cell
├── CalendarEvent.tsx         # Task on calendar
├── CalendarWeekView.tsx      # Week view variant
├── CalendarDayView.tsx       # Day view variant
└── CalendarMiniMonth.tsx     # Small month picker
```

**Calendar View Mockup:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [☰ Calendar ▼]  [+ Add View]        [◀] January 2024 [▶]   [Month|Week|Day]│
├────────────────────────────────────────────────────────────────────────────┤
│  Sun     │  Mon     │  Tue     │  Wed     │  Thu     │  Fri     │  Sat    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│          │    1     │    2     │    3     │    4     │    5     │    6    │
│          │          │          │          │          │          │         │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│    7     │    8     │    9     │   10     │   11     │   12     │   13    │
│          │ ▬▬▬▬▬▬▬▬│▬▬▬▬▬▬▬▬▬▬│▬▬▬▬▬▬▬▬ │          │          │         │
│          │ Sprint 1 │          │          │          │          │         │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│   14     │   15     │   16     │   17     │   18     │   19     │   20    │
│          │ 🔴 Fix   │          │          │ 🔴 API   │          │ 🟡 Dark │
│          │   login  │          │          │   limit  │          │   mode  │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│   21     │   22     │   23     │   24     │   25     │   26     │   27    │
│          │          │          │          │ 🟢 Docs  │          │         │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
```

### Timeline/Gantt View

```
src/components/views/timeline/
├── TimelineView.tsx          # Main timeline container
├── TimelineHeader.tsx        # Date scale header
├── TimelineRow.tsx           # Task row with bar
├── TimelineBar.tsx           # Draggable/resizable bar
├── TimelineDependency.tsx    # Arrow between tasks
├── TimelineMilestone.tsx     # Diamond milestone marker
├── TimelineZoom.tsx          # Zoom controls
└── TimelineToday.tsx         # Today marker line
```

**Timeline View Mockup:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [☰ Timeline ▼]  [+ Add View]       [Zoom: Week ▼]    [◀] Jan 2024 [▶]     │
├────────────────────────────────────────────────────────────────────────────┤
│                 │ Jan 8  │ Jan 15 │ Jan 22 │ Jan 29 │ Feb 5  │ Feb 12 │   │
│ Task            │   M T W T F   │   M T W T F   │   M T W T F   │         │
├─────────────────┼───────────────┼───────────────┼───────────────┼─────────┤
│ Fix login bug   │     ████████──┼─►             │               │         │
│ @alice          │     |    └────┼──┐            │               │         │
├─────────────────┼───────────────┼──│────────────┼───────────────┼─────────┤
│ Write tests     │          █████│  │            │               │         │
│ @bob            │               │  │            │               │         │
├─────────────────┼───────────────┼──│────────────┼───────────────┼─────────┤
│ Add dark mode   │               │  └─►██████████│               │         │
│ @alice          │               │               │               │         │
├─────────────────┼───────────────┼───────────────┼───────────────┼─────────┤
│ API rate limit  │            ███│██████         │               │         │
│ @charlie        │               │               │               │         │
├─────────────────┼───────────────┼───────────────┼───────────────┼─────────┤
│ ◆ Sprint 1 End  │               │ ◆             │               │         │
│                 │               │               │               │         │
└─────────────────┴───────────────┴───────────────┴───────────────┴─────────┘
                                  ↑
                              Today line
```

### Table View

```
src/components/views/table/
├── TableView.tsx             # Main table container
├── TableHeader.tsx           # Column headers
├── TableRow.tsx              # Task row
├── TableCell.tsx             # Editable cell
├── CellEditor.tsx            # In-place editor
├── ColumnSelector.tsx        # Show/hide columns
└── TablePagination.tsx       # Pagination controls
```

**Table View Mockup:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [☰ Table ▼]  [+ Add View]    🔍 Search    [Columns ▼]  [1-25 of 47] [◀][▶]│
├────────────────────────────────────────────────────────────────────────────┤
│ Title          │ Status │ Priority │ Assignee │ Due    │ Est │ Sprint │ $ │
├────────────────┼────────┼──────────┼──────────┼────────┼─────┼────────┼───┤
│ Fix login bug  │ TODO   │ High     │ Alice    │ Jan 15 │ 2h  │ S1     │ ✓ │
│ Add dark mode  │ In Pr  │ Medium   │ Alice    │ Jan 20 │ 4h  │ S1     │   │
│ API rate limit │ In Pr  │ High     │ Charlie  │ Jan 18 │ 3h  │ S1     │ ✓ │
│ Refactor auth  │ TODO   │ Low      │ --       │ --     │ 8h  │ S2     │   │
│ Update docs    │ TODO   │ Low      │ Bob      │ Jan 25 │ 2h  │ S1     │   │
│ ...            │        │          │          │        │     │        │   │
├────────────────┴────────┴──────────┴──────────┴────────┴─────┴────────┴───┤
│ [+ Add row]                                                                │
└────────────────────────────────────────────────────────────────────────────┘
```

### Filter Components

```
src/components/filters/
├── FilterBar.tsx             # Main filter toolbar
├── FilterBuilder.tsx         # Advanced filter modal
├── FilterCondition.tsx       # Single condition row
├── FilterGroup.tsx           # AND/OR group
├── FilterValueInput.tsx      # Value input by type
├── SavedFilters.tsx          # Saved filter dropdown
├── QuickFilters.tsx          # Common quick filters
└── FilterChip.tsx            # Active filter chip
```

**Filter Builder Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Advanced Filters                                                    [X] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Show tasks where [ALL ▼] of the following are true:                     │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Status     ▼] [is not        ▼] [Done              ▼]         [🗑️]│ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Assignee   ▼] [is            ▼] [Me                ▼]         [🗑️]│ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Due Date   ▼] [is this week  ▼] [                  ]          [🗑️]│ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ [+ Add condition]  [+ Add group]                                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Save as: [My overdue tasks        ]  [☐ Make default]                   │
│                                                                         │
│                     [Clear All]  [Cancel]  [Apply Filters]              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Libraries & Dependencies

### Drag and Drop: dnd-kit

```typescript
// Board view drag and drop
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
```

### Calendar: FullCalendar or react-big-calendar

```typescript
// Using FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
```

### Timeline/Gantt: frappe-gantt or custom

```typescript
// Using frappe-gantt (lightweight)
import Gantt from 'frappe-gantt';

// Or custom implementation with SVG
// More control but more work
```

### Virtual Scrolling: @tanstack/react-virtual

```typescript
// For large lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## State Management

### View State

```typescript
// Using Zustand for view state
interface ViewState {
  activeViewId: string | null;
  viewConfigs: Map<string, ViewConfig>;

  // Actions
  setActiveView: (viewId: string) => void;
  updateViewConfig: (viewId: string, config: Partial<ViewConfig>) => void;
  resetViewToDefault: (viewId: string) => void;
}

// Filter state
interface FilterState {
  activeFilters: FilterConfig | null;
  savedFilters: SavedFilter[];

  // Actions
  setFilters: (filters: FilterConfig) => void;
  clearFilters: () => void;
  saveCurrentFilter: (name: string) => void;
  loadSavedFilter: (filterId: string) => void;
}
```

### URL State Sync

```typescript
// Sync view and filter state with URL
// /projects/:id?view=board&filter=my-tasks&groupBy=status

interface URLState {
  view?: string;     // View ID or type
  filter?: string;   // Filter ID or serialized
  groupBy?: string;
  sortBy?: string;
  search?: string;
}
```

---

## Search Implementation

### Full-Text Search

```typescript
// Backend: Using PostgreSQL full-text search
@Get('search')
async searchTasks(
  @Query('q') query: string,
  @Query('projectId') projectId: string,
) {
  return this.prisma.task.findMany({
    where: {
      projectId,
      OR: [
        { title: { search: query } },
        { description: { search: query } },
        {
          comments: {
            some: { content: { search: query } },
          },
        },
      ],
    },
    include: {
      assignee: true,
      labels: { include: { label: true } },
    },
  });
}
```

### Search Indexing (Optional: Elasticsearch/Algolia)

For larger scale, consider dedicated search:

```typescript
// Using Algolia for instant search
import algoliasearch from 'algoliasearch';

const client = algoliasearch('APP_ID', 'API_KEY');
const index = client.initIndex('tasks');

// Index task on create/update
await index.saveObject({
  objectID: task.id,
  title: task.title,
  description: task.description,
  projectId: task.projectId,
  status: task.status,
  priority: task.priority,
  assignee: task.assignee?.name,
  labels: task.labels.map(l => l.name),
});
```

---

## Performance Optimizations

### Virtual Scrolling

```typescript
// List view with virtualization
function VirtualizedList({ tasks }: { tasks: Task[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <ListRow
            key={tasks[virtualRow.index].id}
            task={tasks[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### Optimistic Updates

```typescript
// Using TanStack Query with optimistic updates
const updateTaskMutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    await queryClient.cancelQueries(['tasks', projectId]);
    const previous = queryClient.getQueryData(['tasks', projectId]);
    queryClient.setQueryData(['tasks', projectId], (old) =>
      old.map((t) => (t.id === newTask.id ? { ...t, ...newTask } : t))
    );
    return { previous };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(['tasks', projectId], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['tasks', projectId]);
  },
});
```

---

## Testing Checklist

### Unit Tests

- [ ] Filter condition evaluation
- [ ] Sort comparison functions
- [ ] Group by aggregation
- [ ] Date range calculations
- [ ] View config serialization

### Integration Tests

- [ ] Save and load views
- [ ] Apply complex filters
- [ ] Drag and drop reordering
- [ ] Calendar date range queries
- [ ] Timeline dependency rendering

### E2E Tests

- [ ] Switch between view types
- [ ] Create custom view
- [ ] Build and save filter
- [ ] Drag task between columns
- [ ] Resize timeline bar

---

## Success Metrics

- [ ] All 5 view types render correctly
- [ ] Drag-and-drop works smoothly
- [ ] Filters apply in real-time
- [ ] Saved views persist correctly
- [ ] Calendar shows correct date ranges
- [ ] Timeline displays dependencies
- [ ] Table supports inline editing
- [ ] Search returns relevant results
- [ ] Large lists scroll smoothly
- [ ] URL reflects current view state
