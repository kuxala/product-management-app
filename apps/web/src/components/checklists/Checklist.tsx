import { useState } from 'react';
import { Checklist as ChecklistType, ChecklistItem as ChecklistItemType } from '@pm/shared';
import { checklistsApi } from '../../api/checklists';
import { ChecklistItem } from './ChecklistItem';

interface ChecklistProps {
  checklist: ChecklistType;
  onUpdate: (checklist: ChecklistType) => void;
  onDelete: (checklistId: string) => void;
}

export function Checklist({ checklist, onUpdate, onDelete }: ChecklistProps) {
  const [newItemContent, setNewItemContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(checklist.name);

  const completedCount = checklist.items.filter((item) => item.isCompleted).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;
    try {
      const newItem = await checklistsApi.addItem(checklist.id, {
        content: newItemContent.trim(),
      });
      onUpdate({
        ...checklist,
        items: [...checklist.items, newItem],
      });
      setNewItemContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleUpdateItem = (updatedItem: ChecklistItemType) => {
    onUpdate({
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
    });
  };

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    try {
      const updated = await checklistsApi.update(checklist.id, { name: name.trim() });
      onUpdate({ ...checklist, name: updated.name });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update checklist name:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this checklist?')) return;
    try {
      await checklistsApi.delete(checklist.id);
      onDelete(checklist.id);
    } catch (error) {
      console.error('Failed to delete checklist:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {isEditingName ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleUpdateName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateName();
              if (e.key === 'Escape') {
                setName(checklist.name);
                setIsEditingName(false);
              }
            }}
            className="px-2 py-1 text-sm font-medium border border-gray-300 rounded"
            autoFocus
          />
        ) : (
          <h4
            onClick={() => setIsEditingName(true)}
            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          >
            {checklist.name}
          </h4>
        )}
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{progress}%</span>
          <span>{completedCount}/{totalCount}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-0.5">
        {checklist.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      {/* Add item */}
      {isAdding ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
              if (e.key === 'Escape') {
                setNewItemContent('');
                setIsAdding(false);
              }
            }}
            placeholder="Add an item..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddItem}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={() => {
              setNewItemContent('');
              setIsAdding(false);
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add item
        </button>
      )}
    </div>
  );
}
