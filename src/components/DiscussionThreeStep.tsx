import React, { useState } from 'react';
import type { Discussion, Post, ThreeStepStage } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  ArrowRight, 
  Heart, 
  MessageSquare, 
  Eye, 
  Trash2, 
  EyeOff, 
  Send, 
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Quote
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommentsDrawer } from './CommentsDrawer';

interface DiscussionThreeStepProps {
  discussion: Discussion;
  posts: Post[];
  onAddPost: (content: string, stage: ThreeStepStage, replyToPostId?: string, replyToSummary?: string) => Promise<void>;
  onToggleLike: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onToggleBlind: (postId: string) => void;
  onAdvanceStage: (stage: ThreeStepStage) => void;
}

const STAGES: { stage: ThreeStepStage; title: string; subtitle: string; icon: string; description: string }[] = [
  {
    stage: 1,
    title: '1단계: 입론 (주장과 근거)',
    subtitle: '주장 및 타당한 근거 개진',
    icon: '💡',
    description: '논제에 대한 자신의 명확한 입장(찬성/반대)과 이를 뒷받침하는 1~2가지 객관적 근거를 제시합니다.',
  },
  {
    stage: 2,
    title: '2단계: 반론 (반박과 질문)',
    subtitle: '상대 주장 검토 및 반론',
    icon: '⚡',
    description: '1단계에 등록된 상대측 입론의 논리적 허점, 반대 사례, 예상되는 부작용을 지적하고 질문을 던집니다.',
  },
  {
    stage: 3,
    title: '3단계: 최종발언 (정리와 결론)',
    subtitle: '종합 요약 및 타협·대안 제시',
    icon: '🎯',
    description: '입론과 반론 과정을 거치며 발전된 최종 입장, 타협안, 발전적인 대안을 제시하여 토론을 매듭짓습니다.',
  },
];

export const DiscussionThreeStep: React.FC<DiscussionThreeStepProps> = ({
  discussion,
  posts,
  onAddPost,
  onToggleLike,
  onDeletePost,
  onToggleBlind,
  onAdvanceStage,
}) => {
  const { currentUser, isTeacher, theme } = useAuth();

  const currentStage = discussion.currentStage || 1;
  const [activeTabStage, setActiveTabStage] = useState<ThreeStepStage>(currentStage);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQuotePost, setSelectedQuotePost] = useState<Post | null>(null);
  const [revealedNames, setRevealedNames] = useState<{ [postId: string]: boolean }>({});
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);

  // Filter posts belonging to three_step
  const threeStepPosts = posts.filter((p) => p.mode === 'three_step');

  // Stage filtered posts
  const postsInActiveTab = threeStepPosts.filter((p) => (p.stage || 1) === activeTabStage);

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
      const replySummary = selectedQuotePost 
        ? `${selectedQuotePost.anonymousName}: "${selectedQuotePost.content.substring(0, 40)}..."` 
        : undefined;

      await onAddPost(
        content.trim(),
        currentStage,
        selectedQuotePost?.id,
        replySummary
      );

      setContent('');
      setSelectedQuotePost(null);
      setActiveTabStage(currentStage);
      setSuccessMessage(`${currentStage}단계 발언이 성공적으로 등록되었습니다! ✨`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Celebrate
      try {
        confetti({
          particleCount: 35,
          spread: 65,
          origin: { y: 0.8 },
        });
      } catch {}
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStageMeta = STAGES.find((s) => s.stage === currentStage) || STAGES[0];

  return (
    <div className="space-y-6">

      {/* 1. Interactive 3-Stage Progress Bar */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-xs ${
        theme === 'chalkboard'
          ? 'bg-[#182a24] border-emerald-800/60 text-emerald-50'
          : 'bg-white border-stone-200 text-stone-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪜</span>
            <h3 className="font-bold text-sm sm:text-base">3단계 구조화 토론 진행 현황</h3>
          </div>

          {/* Teacher Stage Control Quick Switch */}
          {isTeacher && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <span className="text-xs text-purple-600 dark:text-purple-300 font-bold px-2 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 교사 제어:
              </span>
              {([1, 2, 3] as ThreeStepStage[]).map((stg) => (
                <button
                  key={stg}
                  onClick={() => onAdvanceStage(stg)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentStage === stg
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'hover:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                  }`}
                >
                  {stg}단계로 전환
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visual Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STAGES.map((s) => {
            const isCurrent = s.stage === currentStage;
            const isCompleted = s.stage < currentStage;
            const postCount = threeStepPosts.filter((p) => p.stage === s.stage).length;

            return (
              <div
                key={s.stage}
                onClick={() => setActiveTabStage(s.stage)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500'
                    : isCompleted
                    ? 'bg-black/5 dark:bg-white/5 border-emerald-500/30 opacity-90'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <span>{s.icon}</span>
                    <span>{s.title}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold animate-pulse">
                      진행 중
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700/20 text-emerald-600 dark:text-emerald-300 font-semibold flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> 완료
                    </span>
                  )}
                </div>

                <p className="text-xs opacity-75 line-clamp-1 mb-2">
                  {s.subtitle}
                </p>

                <div className="flex items-center justify-between text-[11px] font-medium pt-2 border-t border-black/5 dark:border-white/10 opacity-70">
                  <span>등록된 발언</span>
                  <span className="font-bold">{postCount}개</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Active Stage Guidance Banner */}
        <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
          theme === 'chalkboard'
            ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <span className="text-lg shrink-0">{currentStageMeta.icon}</span>
          <div>
            <strong>현재 진행 단계: {currentStageMeta.title}</strong>
            <p className="opacity-80 mt-0.5">{currentStageMeta.description}</p>
          </div>
        </div>
      </div>

      {/* 2. Structured Stage Submission Form */}
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
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>[{currentStageMeta.title}] 나의 발언 등록하기</span>
            </h4>
            <span className="text-xs opacity-75">
              작성자: <strong>{currentUser.avatar} {currentUser.anonymousName}</strong>
            </span>
          </div>

          {/* Quoting Previous Statement (Optional helper for Step 2 and Step 3) */}
          {selectedQuotePost && (
            <div className="mb-3 p-3 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    인용 대상 ({selectedQuotePost.stage}단계 - {selectedQuotePost.anonymousName}):
                  </span>
                  <p className="italic opacity-80 mt-0.5 line-clamp-2">"{selectedQuotePost.content}"</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuotePost(null)}
                className="text-xs opacity-60 hover:opacity-100 p-1 cursor-pointer"
              >
                ✕ 취소
              </button>
            </div>
          )}

          {/* Statement Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              maxLength={300}
              placeholder={
                currentStage === 1
                  ? "논제에 대한 명확한 주장과 객관적 근거를 300자 이내로 작성하세요..."
                  : currentStage === 2
                  ? "1단계 입론에 대한 논리적 반박, 허점 지적, 대안적 질문을 작성하세요..."
                  : "토론 전반을 돌아보며 양측 입장을 절충하거나 최종 결론을 300자 이내로 정리하세요..."
              }
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
            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold">
              {submitError}
            </div>
          )}

          {successMessage && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold animate-bounce">
              {successMessage}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs opacity-65 hidden sm:inline">
              * 아래 이전 단계 발언 카드의 '인용하여 반론하기'를 누르면 인용할 수 있습니다.
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="ml-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>{currentStage}단계 발언 등록하기</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs text-center font-medium">
          현재 교사에 의해 발언 등록이 일시 정지되었습니다.
        </div>
      )}

      {/* 3. Stage Tabs & Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* Tabs for Stage 1, Stage 2, Stage 3 */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            {STAGES.map((s) => (
              <button
                key={s.stage}
                onClick={() => setActiveTabStage(s.stage)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTabStage === s.stage
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.stage}단계 발언 ({threeStepPosts.filter((p) => (p.stage || 1) === s.stage).length})</span>
              </button>
            ))}
          </div>

          <span className="text-xs opacity-60">
            현재 보기: {activeTabStage}단계 ({postsInActiveTab.length}개)
          </span>
        </div>

        {/* Post cards */}
        {postsInActiveTab.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center opacity-60 ${
            theme === 'chalkboard' ? 'border-emerald-800/40' : 'border-stone-200'
          }`}>
            <p className="text-sm">아직 {activeTabStage}단계에 등록된 발언이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postsInActiveTab.map((post) => {
              const isLiked = post.likedBy?.includes(currentUser.id);

              return (
                <div
                  key={post.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                    post.isBlinded ? 'opacity-40 bg-stone-500/10' : ''
                  } ${
                    theme === 'chalkboard'
                      ? 'bg-[#182a24] border-emerald-800/60 text-emerald-50 hover:border-emerald-700'
                      : 'bg-white border-stone-200 text-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{post.avatar}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm">
                              {post.anonymousName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                              {post.stage}단계
                            </span>
                          </div>
                          <span className="text-[10px] opacity-60 block">
                            {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Teacher moderation tools */}
                      {isTeacher && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleRevealName(post.id)}
                            title="실명 확인 (교사 전용)"
                            className="p-1 rounded-md text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[10px]">실명</span>
                          </button>
                          <button
                            onClick={() => onToggleBlind(post.id)}
                            title="블라인드"
                            className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePost(post.id)}
                            title="삭제"
                            className="p-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Teacher revealed real identity */}
                    {isTeacher && revealedNames[post.id] && post.studentInfo && (
                      <div className="mb-2 p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                        🔒 {post.studentInfo.grade}학년 {post.studentInfo.classNum}반 {post.studentInfo.studentNum}번 {post.studentInfo.realName}
                      </div>
                    )}

                    {/* Reply to summary badge if any */}
                    {post.replyToSummary && (
                      <div className="mb-2.5 p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        <span className="truncate italic">{post.replyToSummary}</span>
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
                      {post.isBlinded ? (
                        <span className="italic opacity-60">교사에 의해 블라인드 처리된 발언입니다.</span>
                      ) : (
                        post.content
                      )}
                    </p>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLike(post.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>댓글 {post.commentsCount || 0}</span>
                      </button>
                    </div>

                    {/* Quote & Reply trigger */}
                    {currentStage > (post.stage || 1) && discussion.allowSubmissions && (
                      <button
                        onClick={() => {
                          setSelectedQuotePost(post);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Quote className="w-3 h-3" />
                        <span>인용 발언</span>
                      </button>
                    )}
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
