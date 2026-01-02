import { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { LoadingSpinner } from '../components/shared';
import { WorkspaceSettingsTab, ProfileSettingsTab } from './components/settings';

type SettingsTab = 'workspace' | 'profile';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const { currentWorkspace, isLoading } = useWorkspace();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Workspace not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'workspace' as const, label: 'Workspace Settings' },
    { id: 'profile' as const, label: 'Profile Settings' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'workspace' && (
          <WorkspaceSettingsTab workspace={currentWorkspace} />
        )}
        {activeTab === 'profile' && <ProfileSettingsTab />}
      </div>
    </div>
  );
}
