import React, { useState } from 'react';
import type { Discussion, Post, StanceType, CurrentUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Scale, 
  Heart, 
  MessageSquare, 
  Eye, 
  Trash2, 
  EyeOff, 
  Send, 
  Check, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommentsDrawer } from './CommentsDrawer';

interface DiscussionProConProps {
  discussion: Discussion;
  posts: Post[];
  onAddPost: (content: string, stance: StanceType) => Promise<void>;
  onToggleLike: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onToggleBlind: (postId: string) => void;
}

export const DiscussionProCon: React.FC<DiscussionProConProps> = ({
  discussion,
  posts,
  onAddPost,
  onToggleLike,
  onDeletePost,
  onToggleBlind,
}) => {
  const { currentUser, isTeacher, theme } = useAuth();

  const [selectedStance, setSelectedStance] = useState<StanceType>('agree');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStance, setFilterStance] = useState<StanceType | 'all'>('all');
  const [revealedNames, setRevealedNames] = useState<{ [postId: string]: boolean }>({});
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // Filter posts that belong to this mode
  const proConPosts = posts.filter((p) => p.mode === 'pro_con');

  // Stance counts
  const agreeCount = proConPosts.filter((p) => p.stance === 'agree').length;
  const disagreeCount = proConPosts.filter((p) => p.stance === 'disagree').length;
  const neutralCount = proConPosts.filter((p) => p.stance === 'neutral').length;
  const totalVotes = agreeCount + disagreeCount + neutralCount;

  const agreePct = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 33;
  const disagreePct = totalVotes > 0 ? Math.round((disagreeCount / totalVotes) * 100) : 33;
  const neutralPct = totalVotes > 0 ? Math.max(0, 100 - agreePct - disagreePct) : 34;

  const filteredPosts = proConPosts.filter((p) => {
    if (filterStance === 'all') return true;
    return p.stance === filterStance;
  });

  const toggleRevealName = (postId: string) => {
    setRevealedNames((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddPost(content.trim(), selectedStance);
      setContent('');
      // Reset filter to 'all' so student immediately sees their newly created card
      setFilterStance('all');
      setSuccessMessage('나의 의견이 무기명으로 등록되었습니다! 아래 칠판에서 확인해 보세요. ✨');
      setTimeout(() => setSuccessMessage(null), 4000);
      
      // Fire playful confetti celebration
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: selectedStance === 'agree' ? ['#10b981', '#34d399'] : selectedStance === 'disagree' ? ['#f43f5e', '#fb7185'] : ['#38bdf8', '#818cf8']
        });
      } catch {}
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Real-time Stance Ratio Progress Bar Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-xs ${
        theme === 'chalkboard'
          ? 'bg-[#182a24] border-emerald-800/60 text-emerald-100'
          : 'bg-white border-stone-200 text-stone-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="font-bold text-sm sm:text-base">실시간 투표 및 의견 비율</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 font-semibold">
            총 참여 <strong className="text-emerald-500">{totalVotes}</strong>명
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-5 rounded-full overflow-hidden flex bg-stone-200 dark:bg-stone-800 shadow-inner">
          <div
            style={{ width: `${agreePct}%` }}
            className="bg-emerald-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`찬성: ${agreeCount}명 (${agreePct}%)`}
          >
            {agreePct > 10 ? `${agreePct}%` : ''}
          </div>
          <div
            style={{ width: `${neutralPct}%` }}
            className="bg-sky-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`중립: ${neutralCount}명 (${neutralPct}%)`}
          >
            {neutralPct > 10 ? `${neutralPct}%` : ''}
          </div>
          <div
            style={{ width: `${disagreePct}%` }}
            className="bg-rose-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`반대: ${disagreeCount}명 (${disagreePct}%)`}
          >
            {disagreePct > 10 ? `${disagreePct}%` : ''}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/5 dark:border-white/10 text-center">
          <button
            onClick={() => setFilterStance('agree')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              filterStance === 'agree' ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 찬성
            </div>
            <div className="text-xs font-semibold mt-0.5 opacity-80">
              {agreeCount}표 ({agreePct}%)
            </div>
          </button>

          <button
            onClick={() => setFilterStance('neutral')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              filterStance === 'neutral' ? 'ring-2 ring-sky-500 bg-sky-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 font-bold text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> 중립/절충
            </div>
            <div className="text-xs font-semibold mt-0.5 opacity-80">
              {neutralCount}표 ({neutralPct}%)
            </div>
          </button>

          <button
            onClick={() => setFilterStance('disagree')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              filterStance === 'disagree' ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 반대
            </div>
            <div className="text-xs font-semibold mt-0.5 opacity-80">
              {disagreeCount}표 ({disagreePct}%)
            </div>
          </button>
        </div>
      </div>

      {/* 2. Opinion Submission Box */}
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
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>나의 입장과 근거 등록하기</span>
            </h4>
            <span className="text-xs opacity-75">
              작성자: <strong>{currentUser.avatar} {currentUser.anonymousName}</strong>
            </span>
          </div>

          {/* Stance Radio Selector Buttons */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => setSelectedStance('agree')}
              className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStance === 'agree'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>찬성</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStance('neutral')}
              className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStance === 'neutral'
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm ring-2 ring-sky-300'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>중립/절충</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStance('disagree')}
              className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStance === 'disagree'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm ring-2 ring-rose-300'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>반대</span>
            </button>
          </div>

          {/* Opinion Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              maxLength={300}
              placeholder="친구들의 의견을 존중하며 자신의 생각과 타당한 근거를 300자 이내로 적어주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all placeholder:opacity-50"
            />
            <div className="flex items-center justify-between mt-1 text-xs opacity-60 px-1">
              <span>* 실명은 교사에게만 확인되며, 학급에는 익명 닉네임으로 등록됩니다.</span>
              <span>{content.length} / 300자</span>
            </div>
          </div>

          {submitError && (
            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                !content.trim() || isSubmitting
                  ? 'opacity-40 cursor-not-allowed bg-stone-500'
                  : selectedStance === 'agree'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : selectedStance === 'disagree'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>무기명 의견 등록하기</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs text-center font-medium">
          현재 교사에 의해 신규 의견 등록이 일시 정지되었습니다. 등록된 의견을 읽고 공감과 댓글을 나눠보세요.
        </div>
      )}

      {/* 3. Filter Bar & Opinion Cards Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterStance('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStance === 'all'
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                  : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              전체 ({proConPosts.length})
            </button>
            <button
              onClick={() => setFilterStance('agree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStance === 'agree'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              찬성 ({agreeCount})
            </button>
            <button
              onClick={() => setFilterStance('neutral')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStance === 'neutral'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20'
              }`}
            >
              중립 ({neutralCount})
            </button>
            <button
              onClick={() => setFilterStance('disagree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStance === 'disagree'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              반대 ({disagreeCount})
            </button>
          </div>

          <span className="text-xs opacity-60">
            총 {filteredPosts.length}개의 의견
          </span>
        </div>

        {/* List of cards */}
        {filteredPosts.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center opacity-60 ${
            theme === 'chalkboard' ? 'border-emerald-800/40' : 'border-stone-200'
          }`}>
            <p className="text-sm">등록된 의견이 없습니다. 첫 번째로 입장을 남겨보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => {
              const isLiked = post.likedBy?.includes(currentUser.id);
              const stanceColors = {
                agree: {
                  badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                  border: 'border-l-4 border-l-emerald-500',
                  text: '찬성',
                },
                disagree: {
                  badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
                  border: 'border-l-4 border-l-rose-500',
                  text: '반대',
                },
                neutral: {
                  badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
                  border: 'border-l-4 border-l-sky-500',
                  text: '중립/절충',
                },
              }[post.stance || 'neutral'];

              return (
                <div
                  key={post.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between ${stanceColors.border} ${
                    post.isBlinded ? 'opacity-40 bg-stone-500/10' : ''
                  } ${
                    theme === 'chalkboard'
                      ? 'bg-[#182a24] border-emerald-800/60 text-emerald-50 hover:border-emerald-700'
                      : 'bg-white border-stone-200 text-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Header: Anonymous Nickname, Stance Badge, Timestamp */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{post.avatar}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm">
                              {post.anonymousName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stanceColors.badge}`}>
                              {stanceColors.text}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-60 block">
                            {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Teacher actions */}
                      {isTeacher && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleRevealName(post.id)}
                            title="실명 확인 (교사 전용)"
                            className="p-1 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[10px]">실명</span>
                          </button>
                          <button
                            onClick={() => onToggleBlind(post.id)}
                            title={post.isBlinded ? '블라인드 해제' : '부적절한 의견 블라인드'}
                            className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePost(post.id)}
                            title="의견 삭제 (교사 전용)"
                            className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Teacher-only revealed identity notification */}
                    {isTeacher && revealedNames[post.id] && post.studentInfo && (
                      <div className="mb-2 p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium flex items-center justify-between">
                        <span>
                          🔒 <strong>{post.studentInfo.grade}학년 {post.studentInfo.classNum}반 {post.studentInfo.studentNum}번 {post.studentInfo.realName}</strong>
                        </span>
                        <span className="text-[10px] opacity-75">교사 전용 열람</span>
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
                      {post.isBlinded ? (
                        <span className="italic opacity-60">교사에 의해 블라인드 처리된 의견입니다.</span>
                      ) : (
                        post.content
                      )}
                    </p>
                  </div>

                  {/* Footer: Like & Comment Counters */}
                  <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleLike(post.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          isLiked
                            ? 'text-rose-500 bg-rose-500/10 font-bold'
                            : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
                        <span>공감 {post.likes || 0}</span>
                      </button>

                      <button
                        onClick={() => setActiveCommentPost(post)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>댓글 {post.commentsCount || 0}</span>
                      </button>
                    </div>

                    <span className="text-[11px] opacity-50">
                      무기명 보장
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

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
