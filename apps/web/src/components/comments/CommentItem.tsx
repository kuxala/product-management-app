import { useState } from 'react';
import { CommentWithReplies, UserSummary } from '@pm/shared';
import { commentsApi } from '../../api/comments';
import { CommentInput } from './CommentInput';

interface CommentItemProps {
  comment: CommentWithReplies;
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
}

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '😄', '😮', '😢'];

export function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = comment.authorId === currentUserId;
  const timeAgo = formatTimeAgo(new Date(comment.createdAt));

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyInput(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await commentsApi.update(comment.id, { content: editContent.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    const existingReaction = comment.reactions.find(
      (r) => r.emoji === emoji && r.hasReacted
    );

    try {
      if (existingReaction) {
        await commentsApi.removeReaction(comment.id, emoji);
      } else {
        await commentsApi.addReaction(comment.id, { emoji });
      }
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  return (
    <div className="py-3">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {comment.author.name}
            </span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                autoFocus
              />
              <button
                onClick={handleEdit}
                className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
          )}

          {/* Reactions */}
          {comment.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {comment.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${
                    reaction.hasReacted
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-3 text-xs">
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-gray-500 hover:text-gray-700"
              >
                React
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 flex gap-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>

            {isAuthor && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-2">
              <CommentInput
                onSubmit={handleReply}
                placeholder="Write a reply..."
                autoFocus
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply as CommentWithReplies}
                  currentUserId={currentUserId}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
