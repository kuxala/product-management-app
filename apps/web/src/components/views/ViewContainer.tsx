import { ReactNode } from 'react';
import { Task, TaskListWithTasks } from '@pm/shared';
import { ViewProvider, useView } from '../../context/ViewContext';
import { FilterProvider, useFilter } from '../../context/FilterContext';
import { ViewToolbar } from './ViewToolbar';
import { ListView } from './ListView/ListView';
import { BoardView } from './BoardView/BoardView';
import { CalendarView } from './CalendarView/CalendarView';

interface ViewContainerProps {
  projectId: string;
  taskLists: TaskListWithTasks[];
  tasks: Task[];
  currentUserId: string;
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onTaskCreate: (listId: string, data: { title: string }) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskMove: (taskId: string, listId: string, position: number) => Promise<void>;
}

export function ViewContainer(props: ViewContainerProps) {
  return (
    <ViewProvider projectId={props.projectId}>
      <FilterProvider projectId={props.projectId}>
        <ViewContainerInner {...props} />
      </FilterProvider>
    </ViewProvider>
  );
}

function ViewContainerInner({
  taskLists,
  tasks,
  currentUserId,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskMove,
}: ViewContainerProps) {
  const { currentViewType, setCurrentViewType, currentView } = useView();
  const {
    activeFilters,
    searchQuery,
    addFilter,
    removeFilter,
    clearFilters,
    setSearchQuery,
    applyQuickFilter,
  } = useFilter();

  // Filter tasks based on active filters and search
  const filteredTasks = filterTasks(tasks, activeFilters, searchQuery);

  // Group tasks into task lists with filtered results
  const filteredTaskLists = taskLists.map((list) => ({
    ...list,
    tasks: filteredTasks.filter((t) => t.taskListId === list.id),
  }));

  const renderView = (): ReactNode => {
    switch (currentViewType) {
      case 'LIST':
        return (
          <ListView
            tasks={filteredTasks}
            taskLists={taskLists}
            viewConfig={currentView?.config}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
          />
        );

      case 'BOARD':
        return (
          <BoardView
            taskLists={filteredTaskLists}
            viewConfig={currentView?.config}
            onTaskUpdate={onTaskUpdate}
            onTaskCreate={onTaskCreate}
            onTaskDelete={onTaskDelete}
            onTaskMove={onTaskMove}
          />
        );

      case 'CALENDAR':
        return (
          <CalendarView
            tasks={filteredTasks}
            viewConfig={currentView?.config}
            onTaskUpdate={onTaskUpdate}
          />
        );

      case 'TIMELINE':
        return (
          <div className="p-8 text-center text-gray-500">
            Timeline view coming soon...
          </div>
        );

      case 'TABLE':
        return (
          <div className="p-8 text-center text-gray-500">
            Table view coming soon...
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ViewToolbar
        currentViewType={currentViewType}
        onViewChange={setCurrentViewType}
        activeFilters={activeFilters}
        searchQuery={searchQuery}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
        onSearchChange={setSearchQuery}
        onQuickFilter={applyQuickFilter}
        currentUserId={currentUserId}
      />

      <div className="flex-1 overflow-auto mt-4">{renderView()}</div>
    </div>
  );
}

// Helper function to filter tasks
function filterTasks(
  tasks: Task[],
  filters: { field: string; operator: string; value: unknown }[],
  searchQuery: string
): Task[] {
  let result = [...tasks];

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
    );
  }

  // Apply filters
  for (const filter of filters) {
    result = result.filter((task) => {
      const taskValue = task[filter.field as keyof Task];

      switch (filter.operator) {
        case 'EQUALS':
          return taskValue === filter.value;
        case 'NOT_EQUALS':
          return taskValue !== filter.value;
        case 'IS_EMPTY':
          return taskValue === null || taskValue === undefined || taskValue === '';
        case 'IS_NOT_EMPTY':
          return taskValue !== null && taskValue !== undefined && taskValue !== '';
        case 'CONTAINS':
          return (
            typeof taskValue === 'string' &&
            typeof filter.value === 'string' &&
            taskValue.toLowerCase().includes(filter.value.toLowerCase())
          );
        case 'IN':
          return Array.isArray(filter.value) && filter.value.includes(taskValue);
        case 'IS_OVERDUE':
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date();
        case 'IS_TODAY': {
          if (!task.dueDate) return false;
          const today = new Date();
          const due = new Date(task.dueDate);
          return (
            due.getDate() === today.getDate() &&
            due.getMonth() === today.getMonth() &&
            due.getFullYear() === today.getFullYear()
          );
        }
        case 'IS_THIS_WEEK': {
          if (!task.dueDate) return false;
          const today = new Date();
          const due = new Date(task.dueDate);
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return due >= weekStart && due <= weekEnd;
        }
        default:
          return true;
      }
    });
  }

  return result;
}
