import { useState, useEffect } from 'react';
import { CommentWithReplies } from '@pm/shared';
import { commentsApi } from '../../api/comments';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  taskId: string;
  currentUserId: string;
}

export function CommentSection({ taskId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const data = await commentsApi.getByTask(taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (content: string) => {
    const newComment = await commentsApi.create(taskId, { content });
    setComments([...comments, newComment]);
  };

  const handleReply = async (parentId: string, content: string) => {
    const reply = await commentsApi.create(taskId, { content, parentId });
    // Reload to get proper nesting
    loadComments();
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.delete(commentId);
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-500 text-sm">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">
        Comments ({comments.length})
      </h3>

      <CommentInput onSubmit={handleAddComment} />

      {comments.length === 0 ? (
        <p className="py-4 text-center text-gray-500 text-sm">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
