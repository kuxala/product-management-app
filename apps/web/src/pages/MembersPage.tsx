import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { workspacesApi } from '../api/workspaces';
import { invitationsApi } from '../api/invitations';
import { WorkspaceMember, Invitation, WorkspaceRole } from '@pm/shared';
import {
  LoadingSpinner,
  Modal,
  FormInput,
  ErrorAlert,
} from '../components/shared';
import { MemberListItem, InvitationListItem } from './components/members';

export function MembersPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const canManageMembers =
    currentWorkspace?.role === 'OWNER' || currentWorkspace?.role === 'ADMIN';

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        workspacesApi.getMembers(currentWorkspace.id),
        canManageMembers
          ? invitationsApi.getAll(currentWorkspace.id)
          : Promise.resolve([]),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
      setError(null);
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, canManageMembers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, role: WorkspaceRole) => {
    if (!currentWorkspace) return;

    try {
      await workspacesApi.updateMemberRole(currentWorkspace.id, userId, {
        role,
      });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace) return;

    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await workspacesApi.removeMember(currentWorkspace.id, userId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!currentWorkspace) return;

    try {
      await invitationsApi.cancel(currentWorkspace.id, invitationId);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel invitation',
      );
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!currentWorkspace) return;

    try {
      await invitationsApi.resend(currentWorkspace.id, invitationId);
      setError(null);
      // Could show a success toast here
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resend invitation',
      );
    }
  };

  if (workspaceLoading || isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          {canManageMembers && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Invite Member
            </button>
          )}
        </div>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        {/* Pending Invitations */}
        {canManageMembers && invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Invitations ({invitations.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <InvitationListItem
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={() => handleCancelInvitation(invitation.id)}
                  onResend={() => handleResendInvitation(invitation.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Members List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Members ({members.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {members.map((member) => (
              <MemberListItem
                key={member.id}
                member={member}
                currentUserId={currentUser?.id || ''}
                currentUserRole={currentWorkspace.role}
                onRoleChange={(role) => handleRoleChange(member.userId, role)}
                onRemove={() => handleRemoveMember(member.userId)}
              />
            ))}
          </div>
        </div>

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          workspaceId={currentWorkspace.id}
          onSuccess={fetchData}
        />
      </div>
    </div>
  );
}

// Invite Modal Component
interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: () => void;
}

function InviteModal({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await invitationsApi.create(workspaceId, { email, role });
      setEmail('');
      setRole('MEMBER');
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="colleague@company.com"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
            <option value="GUEST">Guest</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
