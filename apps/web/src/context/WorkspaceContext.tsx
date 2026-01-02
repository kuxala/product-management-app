import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workspacesApi } from '../api/workspaces';
import { spacesApi } from '../api/spaces';
import { WorkspaceWithRole, SpaceWithProjectCount } from '@pm/shared';

interface WorkspaceContextType {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  spaces: SpaceWithProjectCount[];
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceSlug: string) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshSpaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [spaces, setSpaces] = useState<SpaceWithProjectCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { workspaceSlug } = useParams<{ workspaceSlug?: string }>();
  const navigate = useNavigate();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await workspacesApi.getAll();
      setWorkspaces(data);
      return data;
    } catch (err) {
      setError('Failed to load workspaces');
      return [];
    }
  }, []);

  const fetchSpaces = useCallback(async (workspaceId: string) => {
    try {
      const data = await spacesApi.getAllInWorkspace(workspaceId);
      setSpaces(data);
    } catch (err) {
      setError('Failed to load spaces');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const data = await fetchWorkspaces();

      if (workspaceSlug && data.length > 0) {
        const workspace = data.find((w) => w.slug === workspaceSlug);
        if (workspace) {
          setCurrentWorkspace(workspace);
          await fetchSpaces(workspace.id);
        }
      }
      setIsLoading(false);
    };

    initialize();
  }, [fetchWorkspaces, fetchSpaces, workspaceSlug]);

  // Update current workspace when slug changes
  useEffect(() => {
    if (workspaceSlug && workspaces.length > 0) {
      const workspace = workspaces.find((w) => w.slug === workspaceSlug);
      if (workspace && workspace.id !== currentWorkspace?.id) {
        setCurrentWorkspace(workspace);
        fetchSpaces(workspace.id);
      }
    }
  }, [workspaceSlug, workspaces, currentWorkspace?.id, fetchSpaces]);

  const switchWorkspace = useCallback(
    (slug: string) => {
      const workspace = workspaces.find((w) => w.slug === slug);
      if (workspace) {
        setCurrentWorkspace(workspace);
        fetchSpaces(workspace.id);
        navigate(`/w/${slug}`);
      }
    },
    [workspaces, fetchSpaces, navigate]
  );

  const refreshWorkspaces = useCallback(async () => {
    await fetchWorkspaces();
  }, [fetchWorkspaces]);

  const refreshSpaces = useCallback(async () => {
    if (currentWorkspace) {
      await fetchSpaces(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchSpaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        spaces,
        isLoading,
        error,
        switchWorkspace,
        refreshWorkspaces,
        refreshSpaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
