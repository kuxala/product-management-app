import { UserSummary } from '../users/user.schema';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: UserSummary;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
  replyCount: number;
  reactions: ReactionSummary[];
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: UserSummary[];
  hasReacted: boolean;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}

export interface AddReactionDto {
  emoji: string;
}
