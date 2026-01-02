import { useState, useEffect } from 'react';
import { Checklist as ChecklistType } from '@pm/shared';
import { checklistsApi } from '../../api/checklists';
import { Checklist } from './Checklist';

interface ChecklistSectionProps {
  taskId: string;
}

export function ChecklistSection({ taskId }: ChecklistSectionProps) {
  const [checklists, setChecklists] = useState<ChecklistType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');

  useEffect(() => {
    loadChecklists();
  }, [taskId]);

  const loadChecklists = async () => {
    try {
      const data = await checklistsApi.getByTask(taskId);
      setChecklists(data);
    } catch (error) {
      console.error('Failed to load checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistName.trim()) return;
    try {
      const newChecklist = await checklistsApi.create(taskId, {
        name: newChecklistName.trim(),
      });
      setChecklists([...checklists, newChecklist]);
      setNewChecklistName('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add checklist:', error);
    }
  };

  const handleUpdateChecklist = (updatedChecklist: ChecklistType) => {
    setChecklists(
      checklists.map((c) =>
        c.id === updatedChecklist.id ? updatedChecklist : c
      )
    );
  };

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(checklists.filter((c) => c.id !== checklistId));
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-500 text-sm">
        Loading checklists...
      </div>
    );
  }

  // Calculate overall progress
  const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
  const completedItems = checklists.reduce(
    (sum, c) => sum + c.items.filter((i) => i.isCompleted).length,
    0
  );
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Checklists {totalItems > 0 && `(${overallProgress}%)`}
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add checklist
          </button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChecklist();
              if (e.key === 'Escape') {
                setNewChecklistName('');
                setIsAdding(false);
              }
            }}
            placeholder="Checklist name..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddChecklist}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={() => {
              setNewChecklistName('');
              setIsAdding(false);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      {checklists.length === 0 && !isAdding ? (
        <p className="py-4 text-center text-gray-500 text-sm">
          No checklists yet. Add one to break down this task.
        </p>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => (
            <Checklist
              key={checklist.id}
              checklist={checklist}
              onUpdate={handleUpdateChecklist}
              onDelete={handleDeleteChecklist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
