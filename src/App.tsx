import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { TeacherAdminPanel } from './components/TeacherAdminPanel';
import { StudentGuideModal } from './components/StudentGuideModal';
import { FirebaseStatusBadge } from './components/FirebaseStatusBadge';
import { DiscussionProCon } from './components/DiscussionProCon';
import { DiscussionFreeNotes } from './components/DiscussionFreeNotes';
import { DiscussionThreeStep } from './components/DiscussionThreeStep';
import { 
  subscribeDiscussion, 
  subscribePosts, 
  updateDiscussion, 
  addPost, 
  toggleLikePost, 
  deletePost, 
  toggleBlindPost 
} from './services/dataService';
import type { Discussion, Post, DiscussionMode, ThreeStepStage, StanceType, NoteColor } from './types';
import { Sparkles, MessageCircle, Info, Lock, Zap, UserCheck, LogIn } from 'lucide-react';

function DiscussionApp() {
  const { currentUser, isTeacher, theme, quickAutoLoginStudent } = useAuth();

  const [discussion, setDiscussion] = useState<Discussion>({
    id: 'current-topic',
    title: '초·중·고등학교 내 스마트폰 자율 사용을 전면 허용해야 하는가?',
    description: '수업 시간 및 쉬는 시간 학생들의 스마트폰 소지와 자율적 디지털 학습 도구 활용에 대한 여러분의 진솔한 생각과 구체적인 근거를 나눠주세요.',
    mode: 'pro_con',
    currentStage: 1,
    isActive: true,
    allowSubmissions: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [posts, setPosts] = useState<Post[]>([]);
  // If not logged in, open login modal right away so student login scene is clearly visible
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!currentUser.isLoggedIn);
  const [isTeacherPanelOpen, setIsTeacherPanelOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [showAllRealNames, setShowAllRealNames] = useState(false);

  // Real-time Firestore & multi-tab subscription
  useEffect(() => {
    const unsubDisc = subscribeDiscussion((disc) => {
      setDiscussion(disc);
    });

    const unsubPosts = subscribePosts((loadedPosts) => {
      setPosts(loadedPosts);
    });

    return () => {
      unsubDisc();
      unsubPosts();
    };
  }, []);

  // Post addition handler for Mode 1 (Pro / Con)
  const handleAddProConPost = async (content: string, stance: StanceType) => {
    let author = currentUser;
    if (!author.isLoggedIn) {
      const auto = await quickAutoLoginStudent();
      author = auto.user;
    }

    const created = await addPost({
      discussionId: discussion.id,
      mode: 'pro_con',
      authorId: author.id || `std_${Date.now()}`,
      anonymousName: author.anonymousName || '지혜로운 사자',
      avatar: author.avatar || '🦁',
      content,
      stance,
      studentInfo: author.studentInfo,
    });

    // Directly guarantee state is updated synchronously in App
    setPosts((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
  };

  // Post addition handler for Mode 2 (Free Notes)
  const handleAddFreeNotePost = async (content: string, color: NoteColor) => {
    let author = currentUser;
    if (!author.isLoggedIn) {
      const auto = await quickAutoLoginStudent();
      author = auto.user;
    }

    const created = await addPost({
      discussionId: discussion.id,
      mode: 'free_notes',
      authorId: author.id || `std_${Date.now()}`,
      anonymousName: author.anonymousName || '지혜로운 사자',
      avatar: author.avatar || '🦁',
      content,
      color,
      studentInfo: author.studentInfo,
    });

    setPosts((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
  };

  // Post addition handler for Mode 3 (Three Step)
  const handleAddThreeStepPost = async (
    content: string, 
    stage: ThreeStepStage, 
    replyToPostId?: string, 
    replyToSummary?: string
  ) => {
    let author = currentUser;
    if (!author.isLoggedIn) {
      const auto = await quickAutoLoginStudent();
      author = auto.user;
    }

    const created = await addPost({
      discussionId: discussion.id,
      mode: 'three_step',
      authorId: author.id || `std_${Date.now()}`,
      anonymousName: author.anonymousName || '지혜로운 사자',
      avatar: author.avatar || '🦁',
      content,
      stage,
      replyToPostId,
      replyToSummary,
      studentInfo: author.studentInfo,
    });

    setPosts((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
  };

  const handleToggleLike = async (postId: string) => {
    const userId = currentUser.id || 'anonymous_guest';
    await toggleLikePost(postId, userId);
  };

  // Delete opinion (teacher privilege - no window.confirm so it works in iframes)
  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  const handleToggleBlind = async (postId: string) => {
    await toggleBlindPost(postId);
  };

  const handleAdvanceStage = async (stage: ThreeStepStage) => {
    await updateDiscussion({ currentStage: stage });
  };

  const handleSelectMode = async (mode: DiscussionMode) => {
    if (isTeacher) {
      await updateDiscussion({ mode });
    } else {
      setDiscussion((prev) => ({ ...prev, mode }));
    }
  };

  const modeDescriptions: { [key in DiscussionMode]: { name: string; icon: string; desc: string } } = {
    pro_con: {
      name: '모드 1: 찬반 토론',
      icon: '⚖️',
      desc: '찬성, 반대, 중립 실시간 투표 게이지 바 및 근거 중심의 카드형 의견 교환',
    },
    free_notes: {
      name: '모드 2: 자유 의견 모으기',
      icon: '📝',
      desc: '파스텔 포스트잇 보드에 자유롭게 생각을 붙이고 공감 하트 및 한줄 댓글 소통',
    },
    three_step: {
      name: '모드 3: 3단계 구조화 토론',
      icon: '🪜',
      desc: '1단계(입론) ➔ 2단계(반론) ➔ 3단계(최종발언) 교사 제어 기반 순차적 심층 토론',
    },
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'chalkboard'
        ? 'bg-chalkboard text-emerald-100'
        : 'bg-[#faf7f2] text-stone-800'
    }`}>
      {/* Top Header */}
      <Header
        currentMode={discussion.mode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenTeacherPanel={() => setIsTeacherPanelOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onSelectMode={handleSelectMode}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Student Welcome / Login Prompt Banner */}
        {!currentUser.isLoggedIn ? (
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
            theme === 'chalkboard'
              ? 'bg-[#182922] border-emerald-600/60 text-emerald-200'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎒</span>
              <div>
                <strong className="block text-sm font-bold">학생 로그인 후 무기명으로 참여하세요!</strong>
                <p className="text-xs opacity-80">
                  학년(1~6)과 반(1~4), 번호, 이름을 입력하면 지혜로운 동물 무기명 닉네임이 자동 배정됩니다.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>학생 로그인 화면 열기</span>
              </button>
              <button
                onClick={quickAutoLoginStudent}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-400 bg-amber-300 hover:bg-amber-400 text-stone-900 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-stone-900" />
                <span>⚡ 1초 자동 등록</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl border flex items-center justify-between text-xs ${
            theme === 'chalkboard'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-white border-stone-200 text-stone-700 shadow-xs'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentUser.avatar}</span>
              <span>
                현재 접속: <strong>{currentUser.anonymousName}</strong>
                {currentUser.studentInfo && (
                  <span className="opacity-75 ml-1.5">
                    ({currentUser.studentInfo.grade}학년 {currentUser.studentInfo.classNum}반 {currentUser.studentInfo.studentNum}번)
                  </span>
                )}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-[10px]">
                무기명 보호 중 🔒
              </span>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs opacity-75 hover:opacity-100 hover:underline cursor-pointer"
            >
              로그인 정보 변경 / 다른 학생 로그인
            </button>
          </div>
        )}

        {/* Classroom Blackboard / Discussion Topic Header Card */}
        <section className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all relative overflow-hidden ${
          theme === 'chalkboard'
            ? 'bg-[#152720] border-chalk-wood text-emerald-50'
            : 'bg-white border-amber-200 text-stone-800'
        }`}>
          {/* Subtle Decorative Elements */}
          <div className="absolute -right-6 -bottom-6 text-7xl opacity-10 select-none pointer-events-none">
            {modeDescriptions[discussion.mode].icon}
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                theme === 'chalkboard'
                  ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                <span>{modeDescriptions[discussion.mode].icon}</span>
                <span>{modeDescriptions[discussion.mode].name}</span>
              </span>

              {/* Mode switch pills for classroom flexibility */}
              <div className="flex items-center gap-1">
                {(['pro_con', 'free_notes', 'three_step'] as DiscussionMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSelectMode(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      discussion.mode === m
                        ? theme === 'chalkboard'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-900 text-white shadow-xs'
                        : 'opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {m === 'pro_con' ? '찬반' : m === 'free_notes' ? '자유' : '3단계'}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Title */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
              {discussion.title}
            </h2>

            {/* Description */}
            <p className={`text-xs sm:text-sm leading-relaxed max-w-3xl ${
              theme === 'chalkboard' ? 'text-emerald-200/85' : 'text-stone-600'
            }`}>
              {discussion.description}
            </p>

            {/* Status & Anonymous Notice Banner */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs opacity-75">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>학생 무기명 암호화 보호 중</span>
              </span>
              <span>•</span>
              <span>
                현재 권한: <strong>{isTeacher ? '👑 교사 관리자' : `${currentUser.avatar} ${currentUser.anonymousName}`}</strong>
              </span>
              {isTeacher && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => setIsTeacherPanelOpen(true)}
                    className="text-purple-600 dark:text-purple-300 font-bold hover:underline cursor-pointer"
                  >
                    [교사 제어판 열기]
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Active Mode Component View */}
        {discussion.mode === 'pro_con' && (
          <DiscussionProCon
            discussion={discussion}
            posts={posts}
            onAddPost={handleAddProConPost}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onToggleBlind={handleToggleBlind}
          />
        )}

        {discussion.mode === 'free_notes' && (
          <DiscussionFreeNotes
            discussion={discussion}
            posts={posts}
            onAddPost={handleAddFreeNotePost}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onToggleBlind={handleToggleBlind}
          />
        )}

        {discussion.mode === 'three_step' && (
          <DiscussionThreeStep
            discussion={discussion}
            posts={posts}
            onAddPost={handleAddThreeStepPost}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onToggleBlind={handleToggleBlind}
            onAdvanceStage={handleAdvanceStage}
          />
        )}

      </main>

      {/* Floating Bottom-Left Firebase Status Badge */}
      <FirebaseStatusBadge />

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        allowClose={true}
      />

      <TeacherAdminPanel
        isOpen={isTeacherPanelOpen}
        onClose={() => setIsTeacherPanelOpen(false)}
        discussion={discussion}
        posts={posts}
        onUpdateDiscussion={updateDiscussion}
        onDeletePost={handleDeletePost}
        onToggleBlind={handleToggleBlind}
        showAllRealNames={showAllRealNames}
        onToggleShowAllRealNames={() => setShowAllRealNames(!showAllRealNames)}
      />

      <StudentGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DiscussionApp />
    </AuthProvider>
  );
}
