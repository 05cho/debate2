import React, { useEffect } from 'react';
import type { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Heart, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Sparkles,
  Lock,
  Eye,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface PostZoomModalProps {
  post: Post | null;
  allPosts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (post: Post) => void;
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
}

export const PostZoomModal: React.FC<PostZoomModalProps> = ({
  post,
  allPosts,
  isOpen,
  onClose,
  onSelectPost,
  onToggleLike,
  onOpenComments,
}) => {
  const { theme, currentUser, isTeacher } = useAuth();

  if (!isOpen || !post) return null;

  const currentIndex = allPosts.findIndex((p) => p.id === post.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPosts.length - 1 && currentIndex >= 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) {
      onSelectPost(allPosts[currentIndex - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) {
      onSelectPost(allPosts[currentIndex + 1]);
    }
  };

  // Keyboard navigation: Left/Right arrows and ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onSelectPost(allPosts[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext) {
        onSelectPost(allPosts[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasPrev, hasNext, allPosts, onClose, onSelectPost]);

  const isLiked = post.likedBy?.includes(currentUser.id);

  // Stance / Mode styles
  const stanceInfo = {
    agree: { label: '찬성 의견', color: 'bg-emerald-500 text-white', border: 'border-emerald-500' },
    disagree: { label: '반대 의견', color: 'bg-rose-500 text-white', border: 'border-rose-500' },
    neutral: { label: '중립/절충 의견', color: 'bg-sky-500 text-white', border: 'border-sky-500' },
  }[post.stance || 'neutral'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-3xl rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border transition-all relative flex flex-col justify-between max-h-[90vh] overflow-y-auto ${
          theme === 'chalkboard'
            ? 'bg-[#152720] border-emerald-600/80 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Arrows for presentation */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg hidden sm:flex items-center justify-center hover:scale-110"
            title="이전 의견 (단축키: ←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg hidden sm:flex items-center justify-center hover:scale-110"
            title="다음 의견 (단축키: →)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Top Header: Avatar, Nickname, Badges, Close Button */}
        <div>
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3.5">
              <span className="text-4xl sm:text-5xl md:text-6xl select-none" role="img" aria-label="avatar">
                {post.avatar}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight">
                    {post.anonymousName}
                  </h3>

                  {post.mode === 'pro_con' && (
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold shadow-xs ${stanceInfo.color}`}>
                      {stanceInfo.label}
                    </span>
                  )}

                  {post.mode === 'three_step' && (
                    <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-emerald-600 text-white shadow-xs">
                      {post.stage}단계 발언
                    </span>
                  )}

                  {post.mode === 'free_notes' && (
                    <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-300 text-stone-900 shadow-xs">
                      포스트잇
                    </span>
                  )}
                </div>

                {/* Subtitle / Timestamp */}
                <div className="flex items-center gap-2 text-xs sm:text-sm opacity-70 mt-1">
                  <span>작성 시각: {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span>발표 순서: {currentIndex + 1} / {allPosts.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onClose}
                className="p-2 rounded-2xl opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="닫기 (ESC)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Teacher ONLY Real Name Banner (절대 학생 화면에는 표시 안 됨) */}
          {isTeacher && post.studentInfo && (
            <div className="mt-4 p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-purple-600 dark:text-purple-300">🔒 교사 전용 실명 확인:</span>
                <span className="font-bold text-sm sm:text-base">
                  {post.studentInfo.grade}학년 {post.studentInfo.classNum}반 {post.studentInfo.studentNum}번 {post.studentInfo.realName}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold">
                선생님 화면에만 보임
              </span>
            </div>
          )}

          {/* Quoted Summary if 3-Step */}
          {post.replyToSummary && (
            <div className="mt-4 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs sm:text-sm opacity-85">
              <span className="font-bold block text-emerald-600 dark:text-emerald-400 mb-0.5">
                💬 인용한 이전 단계 발언:
              </span>
              <p className="italic">{post.replyToSummary}</p>
            </div>
          )}

          {/* Large Main Opinion Content (대형 글씨 크기!) */}
          <div className="py-6 sm:py-8 my-2">
            <p className="text-lg sm:text-2xl md:text-3xl font-medium leading-relaxed sm:leading-relaxed md:leading-relaxed whitespace-pre-wrap break-words">
              {post.isBlinded ? (
                <span className="italic opacity-60">교사에 의해 블라인드 처리된 의견입니다.</span>
              ) : (
                post.content
              )}
            </p>
          </div>
        </div>

        {/* Footer: Interactions & Mobile Prev/Next */}
        <div className="pt-5 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer shadow-xs ${
                isLiked
                  ? 'bg-rose-500 text-white scale-105'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-rose-500/10 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
              <span>공감해요 {post.likes || 0}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenComments(post);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm sm:text-base font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-5 h-5" />
              <span>댓글 {post.commentsCount || 0}개</span>
            </button>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              disabled={!hasPrev}
              onClick={handlePrev}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 disabled:opacity-30 cursor-pointer"
            >
              ◀ 이전
            </button>
            <span className="text-xs font-semibold opacity-70">
              {currentIndex + 1} / {allPosts.length}
            </span>
            <button
              disabled={!hasNext}
              onClick={handleNext}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 disabled:opacity-30 cursor-pointer"
            >
              다음 ▶
            </button>
          </div>

          <div className="hidden sm:block text-xs opacity-60">
            * 키보드 방향키(←, →)로 다른 학생의 의견을 넘겨보며 발표할 수 있습니다.
          </div>
        </div>

      </div>
    </div>
  );
};
