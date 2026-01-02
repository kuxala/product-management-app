export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

// Profile DTOs
export interface UpdateUserProfileDto {
  name?: string;
  avatarUrl?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
