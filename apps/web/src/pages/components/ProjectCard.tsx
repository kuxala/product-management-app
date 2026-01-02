import { Link } from 'react-router-dom';
import { Project } from '@pm/shared';

interface ProjectCardProps {
  project: Project;
  workspaceSlug: string;
}

export function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
  return (
    <Link
      to={`/w/${workspaceSlug}/p/${project.id}`}
      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
            {project.owner.name.charAt(0).toUpperCase()}
          </div>
          <span>{project.owner.name}</span>
        </div>
        <span>{project._count.tasks} tasks</span>
      </div>
    </Link>
  );
}
