import { useState, useMemo } from 'react';
import { Task, ViewConfig, TaskStatus, TaskPriority } from '@pm/shared';

interface CalendarViewProps {
  tasks: Task[];
  viewConfig?: ViewConfig;
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
}

type CalendarViewMode = 'month' | 'week';

export function CalendarView({ tasks, viewConfig: _viewConfig, onTaskUpdate: _onTaskUpdate }: CalendarViewProps) {
  // These props will be used when FullCalendar is integrated
  void _viewConfig;
  void _onTaskUpdate;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  const tasksWithDueDate = useMemo(
    () => tasks.filter((t) => t.dueDate),
    [tasks]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasksWithDueDate) {
      if (!task.dueDate) continue;
      const dateKey = new Date(task.dueDate).toDateString();
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, task]);
    }
    return map;
  }, [tasksWithDueDate]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday)
    const startPadding = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentDate]);

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction);
      return next;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Today
          </button>

          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-[120px]">
        {monthDays.map((date, index) => (
          <CalendarCell
            key={index}
            date={date}
            tasks={date ? tasksByDate.get(date.toDateString()) || [] : []}
            isToday={date ? isToday(date) : false}
            onTaskUpdate={_onTaskUpdate}
          />
        ))}
      </div>
    </div>
  );
}

interface CalendarCellProps {
  date: Date | null;
  tasks: Task[];
  isToday: boolean;
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
}

function CalendarCell({ date, tasks, isToday, onTaskUpdate: _onTaskUpdate }: CalendarCellProps) {
  // onTaskUpdate will be used for drag-drop date updates
  void _onTaskUpdate;
  if (!date) {
    return <div className="bg-gray-50 border-r border-b border-gray-200" />;
  }

  return (
    <div className="border-r border-b border-gray-200 p-1 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            inline-flex items-center justify-center w-6 h-6 text-sm
            ${isToday ? 'bg-indigo-600 text-white rounded-full font-medium' : 'text-gray-900'}
          `}
        >
          {date.getDate()}
        </span>
        {tasks.length > 2 && (
          <span className="text-xs text-gray-400">+{tasks.length - 2} more</span>
        )}
      </div>

      <div className="space-y-0.5">
        {tasks.slice(0, 2).map((task) => (
          <CalendarTask key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function CalendarTask({ task }: { task: Task }) {
  const priorityColors: Record<TaskPriority, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusStyles: Record<TaskStatus, string> = {
    TODO: '',
    IN_PROGRESS: 'border-l-2 border-l-blue-500',
    DONE: 'opacity-50 line-through',
  };

  return (
    <div
      className={`
        px-1.5 py-0.5 text-xs truncate rounded cursor-pointer
        hover:opacity-80 transition-opacity
        ${priorityColors[task.priority]}
        ${statusStyles[task.status]}
      `}
      title={task.title}
    >
      {task.title}
    </div>
  );
}
