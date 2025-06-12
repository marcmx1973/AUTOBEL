import { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { addRFQComment, type RFQComment } from '../lib/supabase';

type CommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rfqId: string;
  rfqReference: string;
  comments: RFQComment[];
  onCommentAdded: () => void;
};

export default function CommentModal({ isOpen, onClose, rfqId, rfqReference, comments, onCommentAdded }: CommentModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await addRFQComment(rfqId, newComment.trim());
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Comments - {rfqReference}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Comments List */}
        <div className="p-4 h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">
                      {comment.user_email || 'Unknown user'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-800 whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment..."
              className="flex-1 rounded-lg border-2 border-gray-200 p-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}