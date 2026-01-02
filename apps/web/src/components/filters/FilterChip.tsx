import { FilterCondition } from '@pm/shared';

interface FilterChipProps {
  filter: FilterCondition;
  onRemove: () => void;
}

export function FilterChip({ filter, onRemove }: FilterChipProps) {
  const getDisplayValue = (): string => {
    if (filter.value === null) {
      return getOperatorLabel(filter.operator);
    }
    if (Array.isArray(filter.value)) {
      return filter.value.join(', ');
    }
    return String(filter.value).replace('_', ' ');
  };

  const getOperatorLabel = (op: string): string => {
    const labels: Record<string, string> = {
      EQUALS: 'is',
      NOT_EQUALS: 'is not',
      CONTAINS: 'contains',
      NOT_CONTAINS: 'does not contain',
      GREATER_THAN: '>',
      LESS_THAN: '<',
      IS_EMPTY: 'is empty',
      IS_NOT_EMPTY: 'is not empty',
      IS_TODAY: 'is today',
      IS_THIS_WEEK: 'is this week',
      IS_THIS_MONTH: 'is this month',
      IS_OVERDUE: 'is overdue',
    };
    return labels[op] || op.toLowerCase().replace('_', ' ');
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      status: 'Status',
      priority: 'Priority',
      assigneeId: 'Assignee',
      dueDate: 'Due date',
      startDate: 'Start date',
      taskListId: 'List',
      labels: 'Labels',
      title: 'Title',
      description: 'Description',
      createdAt: 'Created',
      updatedAt: 'Updated',
    };
    return labels[field] || field;
  };

  const getChipColor = (): string => {
    switch (filter.field) {
      case 'status':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'priority':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'assigneeId':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'dueDate':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        border ${getChipColor()}
      `}
    >
      <span className="font-semibold">{getFieldLabel(filter.field)}</span>
      <span className="text-gray-500">{getOperatorLabel(filter.operator)}</span>
      {filter.value !== null && <span>{getDisplayValue()}</span>}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:opacity-75 transition-opacity"
        aria-label="Remove filter"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
