import { api } from './client';
import {
  CommentWithReplies,
  CreateCommentDto,
  UpdateCommentDto,
  AddReactionDto,
} from '@pm/shared';

interface Reaction {
  id: string;
  emoji: string;
  commentId: string;
  userId: string;
  createdAt: string;
}

export const commentsApi = {
  getByTask: (taskId: string) =>
    api.get<CommentWithReplies[]>(`/tasks/${taskId}/comments`).then((r) => r.data),

  create: (taskId: string, data: CreateCommentDto) =>
    api.post<CommentWithReplies>(`/tasks/${taskId}/comments`, data).then((r) => r.data),

  update: (commentId: string, data: UpdateCommentDto) =>
    api.patch<CommentWithReplies>(`/comments/${commentId}`, data).then((r) => r.data),

  delete: (commentId: string) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),

  addReaction: (commentId: string, data: AddReactionDto) =>
    api.post<Reaction>(`/comments/${commentId}/reactions`, data).then((r) => r.data),

  removeReaction: (commentId: string, emoji: string) =>
    api.delete(`/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`).then((r) => r.data),
};
