import { useState, useEffect, ChangeEvent } from 'react';
import { User, UpdateUserProfileDto, ChangePasswordDto } from '@pm/shared';
import { usersApi } from '../../../api/users';
import { FormInput, ErrorAlert, LoadingSpinner } from '../../../components/shared';

type InputChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export function ProfileSettingsTab() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: '', avatarUrl: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await usersApi.getProfile();
        setUser(profile);
        setProfileForm({
          name: profile.name,
          avatarUrl: profile.avatarUrl || '',
        });
      } catch (err) {
        setProfileError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const updateData: UpdateUserProfileDto = {
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl || undefined,
      };
      const updatedUser = await usersApi.updateProfile(updateData);
      setUser(updatedUser);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Failed to update profile',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      const data: ChangePasswordDto = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };
      await usersApi.changePassword(data);
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Failed to change password',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Profile Information
        </h2>

        {profileError && (
          <ErrorAlert
            message={profileError}
            onDismiss={() => setProfileError(null)}
          />
        )}

        {profileSuccess && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
            Profile updated successfully
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
          </div>

          <FormInput
            label="Name"
            value={profileForm.name}
            onChange={(e: InputChangeEvent) =>
              setProfileForm({ ...profileForm, name: e.target.value })
            }
            required
          />

          <FormInput
            label="Avatar URL"
            value={profileForm.avatarUrl}
            onChange={(e: InputChangeEvent) =>
              setProfileForm({ ...profileForm, avatarUrl: e.target.value })
            }
            placeholder="https://example.com/avatar.png"
          />

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>

        {passwordError && (
          <ErrorAlert
            message={passwordError}
            onDismiss={() => setPasswordError(null)}
          />
        )}

        {passwordSuccess && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
            Password changed successfully
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <FormInput
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e: InputChangeEvent) =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
            required
          />

          <FormInput
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e: InputChangeEvent) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
            required
          />

          <FormInput
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e: InputChangeEvent) =>
              setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              })
            }
            required
          />

          <button
            type="submit"
            disabled={savingPassword}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {savingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
