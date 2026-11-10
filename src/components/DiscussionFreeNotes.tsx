import React, { useState } from 'react';
import type { Discussion, Post, NoteColor } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Heart, 
  MessageSquare, 
  Eye, 
  Trash2, 
  EyeOff, 
  Send, 
  Sparkles,
  Palette,
  ArrowUpDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommentsDrawer } from './CommentsDrawer';

interface DiscussionFreeNotesProps {
  discussion: Discussion;
  posts: Post[];
  onAddPost: (content: string, color: NoteColor) => Promise<void>;
  onToggleLike: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onToggleBlind: (postId: string) => void;
}

const COLOR_OPTIONS: { id: NoteColor; label: string; bgClass: string; borderClass: string; textClass: string; hex: string }[] = [
  { id: 'yellow', label: '레몬 옐로우', bgClass: 'bg-amber-100 dark:bg-amber-950/70', borderClass: 'border-amber-300 dark:border-amber-700/60', textClass: 'text-amber-950 dark:text-amber-100', hex: '#fef08a' },
  { id: 'pink', label: '스트로베리 핑크', bgClass: 'bg-rose-100 dark:bg-rose-950/70', borderClass: 'border-rose-300 dark:border-rose-700/60', textClass: 'text-rose-950 dark:text-rose-100', hex: '#fecdd3' },
  { id: 'mint', label: '민트 그린', bgClass: 'bg-emerald-100 dark:bg-emerald-950/70', borderClass: 'border-emerald-300 dark:border-emerald-700/60', textClass: 'text-emerald-950 dark:text-emerald-100', hex: '#a7f3d0' },
  { id: 'lavender', label: '라벤더 퍼플', bgClass: 'bg-purple-100 dark:bg-purple-950/70', borderClass: 'border-purple-300 dark:border-purple-700/60', textClass: 'text-purple-950 dark:text-purple-100', hex: '#e9d5ff' },
  { id: 'blue', label: '스카이 블루', bgClass: 'bg-sky-100 dark:bg-sky-950/70', borderClass: 'border-sky-300 dark:border-sky-700/60', textClass: 'text-sky-950 dark:text-sky-100', hex: '#bae6fd' },
  { id: 'peach', label: '피치 코랄', bgClass: 'bg-orange-100 dark:bg-orange-950/70', borderClass: 'border-orange-300 dark:border-orange-700/60', textClass: 'text-orange-950 dark:text-orange-100', hex: '#fed7aa' },
];

export const DiscussionFreeNotes: React.FC<DiscussionFreeNotesProps> = ({
  discussion,
  posts,
  onAddPost,
  onToggleLike,
  onDeletePost,
  onToggleBlind,
}) => {
  const { currentUser, isTeacher, theme } = useAuth();

  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');
  const [filterColor, setFilterColor] = useState<NoteColor | 'all'>('all');
  const [revealedNames, setRevealedNames] = useState<{ [postId: string]: boolean }>({});
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // Filter posts for free notes
  const notePosts = posts.filter((p) => p.mode === 'free_notes');

  const filteredPosts = notePosts
    .filter((p) => filterColor === 'all' || p.color === filterColor)
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return (b.likes || 0) - (a.likes || 0);
      }
      return b.createdAt - a.createdAt;
    });

  const toggleRevealName = (postId: string) => {
    setRevealedNames((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddPost(content.trim(), selectedColor);
      setContent('');
      setFilterColor('all');
      setSuccessMessage('포스트잇이 칠판에 부착되었습니다! ✨');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Confetti burst
      try {
        confetti({
          particleCount: 35,
          spread: 70,
          origin: { y: 0.8 },
        });
      } catch {}
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : '포스트잇 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Header Banner & Submission Form */}
      {discussion.allowSubmissions ? (
        <form
          onSubmit={handleSubmit}
          className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-xs ${
            theme === 'chalkboard'
              ? 'bg-[#182a24] border-emerald-800/60'
              : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
              <span className="text-xl">📌</span>
              <span>자유 생각 포스트잇 붙이기</span>
            </h4>
            <span className="text-xs opacity-75">
              작성자: <strong>{currentUser.avatar} {currentUser.anonymousName}</strong>
            </span>
          </div>

          {/* Color Palette Selector */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            <span className="text-xs opacity-75 flex items-center gap-1 shrink-0 mr-1">
              <Palette className="w-3.5 h-3.5" /> 색상:
            </span>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.id)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                  selectedColor === c.id
                    ? 'scale-110 ring-2 ring-emerald-500 shadow-xs'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex, borderColor: '#ffffff' }}
                title={c.label}
              >
                {selectedColor === c.id && <span className="text-stone-800 text-xs">✓</span>}
              </button>
            ))}
          </div>

          {/* Sticky Note Styled Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              maxLength={300}
              placeholder="자유롭게 아이디어, 궁금한 점, 격려의 한마디를 적어 칠판에 붙여보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all placeholder:opacity-50"
            />
            <div className="flex items-center justify-between mt-1 text-xs opacity-60 px-1">
              <span>* 실명은 교사에게만 확인되며, 학급에는 익명 닉네임으로 부착됩니다.</span>
              <span>{content.length} / 300자</span>
            </div>
          </div>
          {submitError && (
            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold">
              {submitError}
            </div>
          )}

          {successMessage && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold animate-bounce">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-stone-900 bg-amber-300 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>칠판에 포스트잇 붙이기</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs text-center font-medium">
          현재 교사에 의해 신규 포스트잇 작성이 일시 정지되었습니다.
        </div>
      )}

      {/* 2. Control Bar (Sort & Color Filter) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterColor('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterColor === 'all'
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
            }`}
          >
            전체 ({notePosts.length})
          </button>
          {COLOR_OPTIONS.map((c) => {
            const count = notePosts.filter((p) => p.color === c.id).length;
            if (count === 0 && filterColor !== c.id) return null;
            return (
              <button
                key={c.id}
                onClick={() => setFilterColor(c.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  filterColor === c.id
                    ? 'ring-2 ring-emerald-500 font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex + '33' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.hex }}></span>
                <span>{c.label} ({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs opacity-60 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> 정렬:
          </span>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sortBy === 'latest' ? 'bg-black/10 dark:bg-white/10 font-bold' : 'opacity-60 hover:opacity-100'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sortBy === 'likes' ? 'bg-black/10 dark:bg-white/10 font-bold text-rose-500' : 'opacity-60 hover:opacity-100'
            }`}
          >
            공감순 ❤️
          </button>
        </div>
      </div>

      {/* 3. Sticky Notes Board (Grid Layout with slight rotation aesthetics) */}
      {filteredPosts.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center opacity-60 ${
          theme === 'chalkboard' ? 'border-emerald-800/40' : 'border-stone-200'
        }`}>
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-sm">아직 등록된 포스트잇이 없습니다. 자유롭게 첫 생각을 붙여보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post, idx) => {
            const isLiked = post.likedBy?.includes(currentUser.id);
            const colorMeta = COLOR_OPTIONS.find((c) => c.id === post.color) || COLOR_OPTIONS[0];

            // Gentle organic angle tilt pattern for sticky note feeling
            const rotations = ['rotate-0', 'rotate-1', '-rotate-1', 'rotate-0.5', '-rotate-0.5'];
            const rotClass = rotations[idx % rotations.length];

            return (
              <div
                key={post.id}
                className={`p-5 rounded-2xl border transition-all duration-200 shadow-md flex flex-col justify-between ${rotClass} hover:rotate-0 hover:scale-[1.02] ${colorMeta.bgClass} ${colorMeta.borderClass} ${colorMeta.textClass} ${
                  post.isBlinded ? 'opacity-40' : ''
                }`}
              >
                <div>
                  {/* Sticky Note Pin / Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{post.avatar}</span>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block">
                          {post.anonymousName}
                        </span>
                        <span className="text-[10px] opacity-65 block">
                          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Teacher tools */}
                    {isTeacher && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleRevealName(post.id)}
                          title="실명 확인 (교사 전용)"
                          className="p-1 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="text-[10px]">실명</span>
                        </button>
                        <button
                          onClick={() => onToggleBlind(post.id)}
                          title={post.isBlinded ? '블라인드 해제' : '블라인드'}
                          className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 cursor-pointer"
                        >
                          <EyeOff className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeletePost(post.id)}
                          title="삭제"
                          className="p-1 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Teacher revealed real identity */}
                  {isTeacher && revealedNames[post.id] && post.studentInfo && (
                    <div className="mb-2 p-2 rounded-lg bg-purple-600/20 border border-purple-600/40 text-purple-900 dark:text-purple-100 text-xs font-semibold">
                      🔒 {post.studentInfo.grade}학년 {post.studentInfo.classNum}반 {post.studentInfo.studentNum}번 {post.studentInfo.realName}
                    </div>
                  )}

                  {/* Note Content */}
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words min-h-[60px] mb-4">
                    {post.isBlinded ? (
                      <span className="italic opacity-60">교사에 의해 블라인드 처리된 메모입니다.</span>
                    ) : (
                      post.content
                    )}
                  </p>
                </div>

                {/* Footer Interactions */}
                <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleLike(post.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        isLiked
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPost(post)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.commentsCount || 0}</span>
                    </button>
                  </div>

                  <span className="text-[10px] opacity-60">
                    포스트잇
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Comments Drawer */}
      {activeCommentPost && (
        <CommentsDrawer
          post={activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
        />
      )}

    </div>
  );
};
