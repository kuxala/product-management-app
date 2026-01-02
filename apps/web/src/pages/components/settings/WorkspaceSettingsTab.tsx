import { useState, ChangeEvent } from 'react';
import { WorkspaceWithRole, UpdateWorkspaceDto } from '@pm/shared';
import { workspacesApi } from '../../../api/workspaces';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { FormInput, ErrorAlert } from '../../../components/shared';

type InputChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

interface WorkspaceSettingsTabProps {
  workspace: WorkspaceWithRole;
}

export function WorkspaceSettingsTab({ workspace }: WorkspaceSettingsTabProps) {
  const { refreshWorkspaces } = useWorkspace();
  const [formData, setFormData] = useState({
    name: workspace.name,
    slug: workspace.slug,
    description: workspace.description || '',
    logoUrl: workspace.logoUrl || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canEdit = workspace.role === 'OWNER' || workspace.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: UpdateWorkspaceDto = {
        name: formData.name,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
      };

      await workspacesApi.update(workspace.id, updateData);
      await refreshWorkspaces();
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update workspace',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Workspace Details
      </h2>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
          Workspace settings updated successfully
        </div>
      )}

      {!canEdit && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          You need Admin or Owner role to edit workspace settings
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Workspace Name"
          value={formData.name}
          onChange={(e: InputChangeEvent) => setFormData({ ...formData, name: e.target.value })}
          disabled={!canEdit}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workspace Slug
          </label>
          <input
            type="text"
            value={formData.slug}
            disabled
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">
            Workspace slug cannot be changed
          </p>
        </div>

        <FormInput
          label="Description"
          multiline
          value={formData.description}
          onChange={(e: InputChangeEvent) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={!canEdit}
        />

        <FormInput
          label="Logo URL"
          value={formData.logoUrl}
          onChange={(e: InputChangeEvent) =>
            setFormData({ ...formData, logoUrl: e.target.value })
          }
          disabled={!canEdit}
          placeholder="https://example.com/logo.png"
        />

        {canEdit && (
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </form>
    </div>
  );
}
