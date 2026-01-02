import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { Project } from '@pm/shared';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    projectsApi.getAll().then(r => setProjects(r));
  }, []);

  const createProject = async () => {
    const p = await projectsApi.create({ name });
    setProjects([p, ...projects]);
    setName('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Project Management</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Hello, {user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Projects</h2>

          {/* Create Project Form */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter project name"
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
              <button
                onClick={createProject}
                disabled={!name.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-500">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="block bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {p.name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      p.ownerId === user?.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {p.ownerId === user?.id ? 'Owner' : 'Member'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
