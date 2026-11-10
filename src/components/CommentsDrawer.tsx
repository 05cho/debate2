import React, { useState, useEffect } from 'react';
import type { Post, Comment } from '../types';
import { subscribeComments, addComment } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { X, Send, MessageCircle, Heart, Eye, Sparkles } from 'lucide-react';

interface CommentsDrawerProps {
  post: Post;
  onClose: () => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({ post, onClose }) => {
  const { currentUser, isTeacher, theme } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedCommentAuthors, setRevealedCommentAuthors] = useState<{ [commentId: string]: boolean }>({});

  useEffect(() => {
    const unsubscribe = subscribeComments(post.id, (loadedComments) => {
      setComments(loadedComments);
    });
    return () => unsubscribe();
  }, [post.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addComment({
        postId: post.id,
        authorId: currentUser.id,
        anonymousName: currentUser.anonymousName,
        avatar: currentUser.avatar,
        content: newComment.trim(),
        studentInfo: currentUser.studentInfo,
      });
      setNewComment('');
    } catch (err: unknown) {
      console.warn('Comment submission note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRevealAuthor = (commentId: string) => {
    setRevealedCommentAuthors((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`w-full max-w-lg h-full p-6 flex flex-col justify-between shadow-2xl border-l transition-all ${
          theme === 'chalkboard'
            ? 'bg-[#182a24] border-emerald-800/80 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-base">의견 댓글 및 소통 ({comments.length})</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Original Post Preview */}
          <div className="my-4 p-4 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{post.avatar}</span>
              <span className="font-bold">{post.anonymousName}</span>
              {post.stance && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                  {post.stance === 'agree' ? '찬성' : post.stance === 'disagree' ? '반대' : '중립'}
                </span>
              )}
            </div>
            <p className="line-clamp-3 opacity-90">{post.content}</p>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
          {comments.length === 0 ? (
            <div className="py-12 text-center opacity-60 text-xs">
              아직 작성된 댓글이 없습니다. 따뜻한 격려나 질문을 남겨보세요!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{comment.avatar}</span>
                    <span className="font-bold">{comment.anonymousName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-50">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isTeacher && (
                      <button
                        onClick={() => toggleRevealAuthor(comment.id)}
                        title="작성자 실명 확인"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> 실명
                      </button>
                    )}
                  </div>
                </div>

                {isTeacher && revealedCommentAuthors[comment.id] && comment.studentInfo && (
                  <div className="p-1.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
                    🔒 {comment.studentInfo.grade}학년 {comment.studentInfo.classNum}반 {comment.studentInfo.studentNum}번 {comment.studentInfo.realName}
                  </div>
                )}

                <p className="opacity-90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="pt-3 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2 mb-1 text-[11px] opacity-75">
            <span>작성자: {currentUser.avatar} <strong>{currentUser.anonymousName}</strong></span>
            <span className="ml-auto">{newComment.length} / 150자</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={150}
              placeholder="예의를 지키며 따뜻한 한 줄 댓글을 남겨보세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>등록</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
