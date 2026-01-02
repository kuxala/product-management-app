import { useState, ChangeEvent } from 'react';
import { Task, TaskStatus, TaskPriority } from '@pm/shared';
import { Modal, FormInput } from '../../shared';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'title') setTitle(value);
    if (name === 'description') setDescription(value);
    if (name === 'dueDate') setDueDate(value);
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <Modal isOpen={true} onClose={onClose} title="Task Details">
      <div className="space-y-4">
        {/* Title */}
        <FormInput
          label="Title"
          name="title"
          value={title}
          onChange={handleInputChange}
          required
        />

        {/* Description */}
        <FormInput
          label="Description"
          name="description"
          multiline
          rows={4}
          value={description}
          onChange={handleInputChange}
          placeholder="Add a description..."
        />

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
            {isOverdue && (
              <span className="ml-2 text-red-600 text-xs">(Overdue)</span>
            )}
          </label>
          <input
            type="date"
            name="dueDate"
            value={dueDate}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition ${
              isOverdue ? 'border-red-300 bg-red-50' : ''
            }`}
          />
        </div>

        {/* Assignee (read-only for now) */}
        {task.assignee && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm text-indigo-600 font-medium">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-900">{task.assignee.name}</span>
            </div>
          </div>
        )}

        {/* Task metadata */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          Created: {new Date(task.createdAt).toLocaleDateString()}
          {task.updatedAt && task.updatedAt !== task.createdAt && (
            <> · Updated: {new Date(task.updatedAt).toLocaleDateString()}</>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
