import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Legacy dashboard page - redirects to workspaces
export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/workspaces', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
