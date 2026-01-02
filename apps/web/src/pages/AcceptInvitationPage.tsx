import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitationsApi } from '../api/invitations';
import { useAuth } from '../context/AuthContext';
import { Invitation } from '@pm/shared';
import { LoadingSpinner, ErrorAlert } from '../components/shared';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) return;

      try {
        const data = await invitationsApi.getByToken(token);
        setInvitation(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Invalid or expired invitation',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    setError(null);

    try {
      const result = await invitationsApi.accept(token);
      navigate(`/w/${invitation?.workspace?.slug || result.workspaceId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation',
      );
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-500 mb-6">
            {error || 'This invitation is no longer valid'}
          </p>
          <Link
            to="/workspaces"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            Go to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Workspace Invitation
          </h1>
          <p className="text-gray-500 mb-6">
            You've been invited to join{' '}
            <strong>{invitation.workspace?.name}</strong>. Please log in or
            create an account with <strong>{invitation.email}</strong> to accept
            this invitation.
          </p>
          <div className="space-y-3">
            <Link
              to={`/login?redirect=/invitations/${token}`}
              className="block px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              Log In
            </Link>
            <Link
              to={`/register?redirect=/invitations/${token}&email=${encodeURIComponent(invitation.email)}`}
              className="block px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Join {invitation.workspace?.name}
        </h1>
        <p className="text-gray-500 mb-6">
          You've been invited by {invitation.invitedBy.name} to join this
          workspace as a {invitation.role.toLowerCase()}.
        </p>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
          <Link
            to="/workspaces"
            className="block px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Decline
          </Link>
        </div>
      </div>
    </div>
  );
}
