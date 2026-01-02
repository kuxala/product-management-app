import { WorkspaceMember, WorkspaceRole } from '@pm/shared';

interface MemberListItemProps {
  member: WorkspaceMember;
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  onRoleChange: (role: WorkspaceRole) => void;
  onRemove: () => void;
}

export function MemberListItem({
  member,
  currentUserId,
  currentUserRole,
  onRoleChange,
  onRemove,
}: MemberListItemProps) {
  const isCurrentUser = member.userId === currentUserId;
  const isOwner = member.role === 'OWNER';
  const canManage =
    (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') &&
    !isCurrentUser &&
    !isOwner;

  const roleColors: Record<WorkspaceRole, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-gray-100 text-gray-700',
    GUEST: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        {member.user.avatarUrl ? (
          <img
            src={member.user.avatarUrl}
            alt={member.user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-medium">
              {member.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900">
            {member.user.name}
            {isCurrentUser && (
              <span className="ml-2 text-sm text-gray-500">(You)</span>
            )}
          </div>
          <div className="text-sm text-gray-500">{member.user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canManage ? (
          <select
            value={member.role}
            onChange={(e) => onRoleChange(e.target.value as WorkspaceRole)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="GUEST">Guest</option>
          </select>
        ) : (
          <span
            className={`px-3 py-1 text-sm rounded-full ${roleColors[member.role]}`}
          >
            {member.role}
          </span>
        )}

        {canManage && (
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Remove member"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
