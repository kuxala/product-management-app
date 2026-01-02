import { useState, useEffect } from 'react';
import { Label, LabelWithTaskCount, TaskLabel } from '@pm/shared';
import { labelsApi } from '../../api/labels';
import { LabelBadge } from './LabelBadge';

interface LabelPickerProps {
  projectId: string;
  spaceId?: string;
  taskId: string;
  selectedLabels: TaskLabel[];
  onLabelAdd: (label: Label) => void;
  onLabelRemove: (labelId: string) => void;
}

export function LabelPicker({
  projectId,
  spaceId,
  taskId,
  selectedLabels,
  onLabelAdd,
  onLabelRemove,
}: LabelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<LabelWithTaskCount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen, projectId, spaceId]);

  const loadLabels = async () => {
    setLoading(true);
    try {
      const [projectLabels, spaceLabels] = await Promise.all([
        labelsApi.getByProject(projectId),
        spaceId ? labelsApi.getBySpace(spaceId) : Promise.resolve([]),
      ]);
      setAvailableLabels([...projectLabels, ...spaceLabels]);
    } catch (error) {
      console.error('Failed to load labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLabelIds = new Set(selectedLabels.map((tl) => tl.labelId));
  const unselectedLabels = availableLabels.filter((l) => !selectedLabelIds.has(l.id));

  const handleToggle = async (label: LabelWithTaskCount) => {
    if (selectedLabelIds.has(label.id)) {
      try {
        await labelsApi.removeFromTask(taskId, label.id);
        onLabelRemove(label.id);
      } catch (error) {
        console.error('Failed to remove label:', error);
      }
    } else {
      try {
        await labelsApi.addToTask(taskId, label.id);
        onLabelAdd(label);
      } catch (error) {
        console.error('Failed to add label:', error);
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedLabels.map((taskLabel) => (
          <LabelBadge
            key={taskLabel.id}
            label={taskLabel.label}
            size="sm"
            onRemove={() => handleToggle(taskLabel.label as LabelWithTaskCount)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add label
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : unselectedLabels.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No more labels available</div>
          ) : (
            unselectedLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleToggle(label)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
