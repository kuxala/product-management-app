import { ViewType } from '@pm/shared';

interface ViewSwitcherProps {
  currentViewType: ViewType;
  onViewChange: (type: ViewType) => void;
}

const VIEW_TYPES: { type: ViewType; label: string; icon: string }[] = [
  { type: 'LIST', label: 'List', icon: 'list' },
  { type: 'BOARD', label: 'Board', icon: 'columns' },
  { type: 'CALENDAR', label: 'Calendar', icon: 'calendar' },
  // Timeline and Table are future phases
  // { type: 'TIMELINE', label: 'Timeline', icon: 'gantt' },
  // { type: 'TABLE', label: 'Table', icon: 'table' },
];

export function ViewSwitcher({ currentViewType, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {VIEW_TYPES.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => onViewChange(type)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
            transition-colors
            ${
              currentViewType === type
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <ViewIcon type={icon} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function ViewIcon({ type }: { type: string }) {
  switch (type) {
    case 'list':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    case 'columns':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16M15 4v16M4 9h16M4 15h16" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'gantt':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h7m-7 6h11m-11 6h15" />
        </svg>
      );
    case 'table':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
}
