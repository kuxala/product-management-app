import { ViewType, FilterCondition, QuickFilterType } from '@pm/shared';
import { ViewSwitcher } from './ViewSwitcher';
import { FilterBar } from '../filters/FilterBar';

interface ViewToolbarProps {
  currentViewType: ViewType;
  onViewChange: (type: ViewType) => void;
  activeFilters: FilterCondition[];
  searchQuery: string;
  onAddFilter: (filter: FilterCondition) => void;
  onRemoveFilter: (field: string, index?: number) => void;
  onClearFilters: () => void;
  onSearchChange: (query: string) => void;
  onQuickFilter: (type: QuickFilterType, userId: string) => void;
  currentUserId: string;
}

export function ViewToolbar({
  currentViewType,
  onViewChange,
  activeFilters,
  searchQuery,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onSearchChange,
  onQuickFilter,
  currentUserId,
}: ViewToolbarProps) {
  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <ViewSwitcher currentViewType={currentViewType} onViewChange={onViewChange} />

        {/* Additional view actions can go here */}
        <div className="flex items-center gap-2">
          {/* View settings button (future) */}
        </div>
      </div>

      <FilterBar
        activeFilters={activeFilters}
        searchQuery={searchQuery}
        onAddFilter={onAddFilter}
        onRemoveFilter={onRemoveFilter}
        onClearFilters={onClearFilters}
        onSearchChange={onSearchChange}
        onQuickFilter={onQuickFilter}
        currentUserId={currentUserId}
      />
    </div>
  );
}
