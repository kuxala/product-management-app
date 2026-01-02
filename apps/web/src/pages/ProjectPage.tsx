import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { Project, Task } from '@pm/shared';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');

  const isOwner = project?.ownerId === user?.id;

  useEffect(() => {
    if (!id) return;
    projectsApi.getById(id).then(setProject);
    tasksApi.getAll(id).then(r => setTasks(r));
  }, [id]);

  const createTask = async () => {
    if (!id) return;
    const t = await tasksApi.create(id, { title });
    setTasks([t, ...tasks]);
    setTitle('');
  };

  const deleteProject = async () => {
    if (!id) return;
    await projectsApi.delete(id);
    navigate('/dashboard');
  };

  const deleteTask = async (taskId: string) => {
    if (!id) return;
    await tasksApi.delete(id, taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            </div>
            {isOwner && (
              <button
                onClick={deleteProject}
                className="px-4 py-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition font-medium"
              >
                Delete Project
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Members */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
              {project.members && project.members.length > 0 ? (
                <div className="space-y-3">
                  {project.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                        <p className="text-xs text-gray-500">{m.user.email}</p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          m.role === 'OWNER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No members yet</p>
              )}
            </div>
          </div>

          {/* Main - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Task */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>
              <div className="flex gap-3">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
                <button
                  onClick={createTask}
                  disabled={!title.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  Add Task
                </button>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
              {tasks.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No tasks yet. Create one to get started!</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{t.title}</h3>
                        <div className="flex gap-2 mt-2">
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {t.status || 'TODO'}
                          </span>
                          {t.priority && (
                            <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                              {t.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="ml-4 px-4 py-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
