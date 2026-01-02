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

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      {isOwner && <button onClick={deleteProject}>Delete Project</button>}

      <h2>Members</h2>
      <ul>
        {project.members?.map(m => (
          <li key={m.id}>
            {m.user.name} ({m.role})
          </li>
        ))}
      </ul>

      <h2>Tasks</h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title"
      />
      <button onClick={createTask}>Add Task</button>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            {t.title} - {t.status} - {t.priority}
            {isOwner && (
              <button onClick={() => deleteTask(t.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
