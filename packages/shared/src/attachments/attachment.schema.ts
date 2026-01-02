import { UserSummary } from '../users/user.schema';

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  taskId: string;
  uploaderId: string | null;
  uploader: UserSummary | null;
  createdAt: string;
}
