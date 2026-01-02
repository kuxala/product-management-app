import { useState } from 'react';
import { ChecklistItem as ChecklistItemType } from '@pm/shared';
import { checklistsApi } from '../../api/checklists';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onUpdate: (item: ChecklistItemType) => void;
  onDelete: (itemId: string) => void;
}

export function ChecklistItem({ item, onUpdate, onDelete }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);

  const handleToggle = async () => {
    try {
      const updated = await checklistsApi.updateItem(item.id, {
        isCompleted: !item.isCompleted,
      });
      onUpdate(updated);
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      const updated = await checklistsApi.updateItem(item.id, {
        content: content.trim(),
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await checklistsApi.deleteItem(item.id);
      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 group">
      <input
        type="checkbox"
        checked={item.isCompleted}
        onChange={handleToggle}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />

      {isEditing ? (
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setContent(item.content);
              setIsEditing(false);
            }
          }}
          className="flex-1 px-2 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-sm cursor-pointer ${
            item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
          }`}
        >
          {item.content}
        </span>
      )}

      {item.assignee && (
        <span className="text-xs text-gray-500">{item.assignee.name}</span>
      )}

      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
