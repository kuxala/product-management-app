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
    <div>
      <header>
        {user?.name} <button onClick={logout}>Logout</button>
      </header>
      <h1>Projects</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Project name"
      />
      <button onClick={createProject}>Create</button>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <Link to={`/projects/${p.id}`}>{p.name}</Link>
            <span>{p.ownerId === user?.id ? 'Owner' : 'Member'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
