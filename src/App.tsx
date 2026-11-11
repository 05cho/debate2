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
  subscribeDiscussionsList,
  subscribePosts, 
  updateDiscussion, 
  setActiveTopicId,
  toggleDiscussionBlind,
  addPost, 
  toggleLikePost, 
  deletePost, 
  toggleBlindPost 
} from './services/dataService';
import type { Discussion, Post, DiscussionMode, ThreeStepStage, StanceType, NoteColor } from './types';
import { Sparkles, MessageCircle, Info, Lock, Unlock, Zap, UserCheck, LogIn, FolderOpen, Plus, Eye, EyeOff } from 'lucide-react';

function DiscussionApp() {
  const { currentUser, isTeacher, theme, quickAutoLoginStudent } = useAuth();

  const [discussionsList, setDiscussionsList] = useState<Discussion[]>([]);
  const [activeTopicId, setActiveTopicIdState] = useState<string>('current-topic');

  const [discussion, setDiscussion] = useState<Discussion>({
    id: 'current-topic',
    title: '초·중·고등학교 내 스마트폰 자율 사용을 전면 허용해야 하는가?',
    description: '수업 시간 및 쉬는 시간 학생들의 스마트폰 소지와 자율적 디지털 학습 도구 활용에 대한 여러분의 진솔한 생각과 구체적인 근거를 나눠주세요.',
    mode: 'pro_con',
    currentStage: 1,
    isActive: true,
    allowSubmissions: true,
    isBlindToStudents: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!currentUser.isLoggedIn);
  const [isTeacherPanelOpen, setIsTeacherPanelOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [showAllRealNames, setShowAllRealNames] = useState(false);

  // Subscribe to discussions list & posts
  useEffect(() => {
    const unsubList = subscribeDiscussionsList((list, activeId) => {
      setDiscussionsList(list);
      setActiveTopicIdState(activeId);
      const found = list.find((d) => d.id === activeId) || list[0];
      if (found) {
        setDiscussion(found);
      }
    });

    const unsubPosts = subscribePosts((loadedPosts) => {
      setPosts(loadedPosts);
    });

    return () => {
      unsubList();
      unsubPosts();
    };
  }, []);

  // Filter posts that belong to the current active topic
  const currentTopicPosts = posts.filter((p) => p.discussionId === (activeTopicId || discussion.id));

  // Switch active topic tab
  const handleSwitchTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setActiveTopicIdState(topicId);
    const found = discussionsList.find((d) => d.id === topicId);
    if (found) {
      setDiscussion(found);
    }
  };

  // Quick toggle for teacher to reveal or privatize opinions
  const handleToggleDiscussionBlind = async () => {
    const nextState = await toggleDiscussionBlind(activeTopicId);
    setDiscussion((prev) => ({ ...prev, isBlindToStudents: nextState }));
  };

  // Post addition handler for Mode 1 (Pro / Con)
  const handleAddProConPost = async (content: string, stance: StanceType) => {
    let author = currentUser;
    if (!author.isLoggedIn) {
      const auto = await quickAutoLoginStudent();
      author = auto.user;
    }

    const created = await addPost({
      discussionId: activeTopicId || discussion.id,
      mode: 'pro_con',
      authorId: author.id || `std_${Date.now()}`,
      anonymousName: author.anonymousName || '지혜로운 사자',
      avatar: author.avatar || '🦁',
      content,
      stance,
      studentInfo: author.studentInfo,
    });

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
      discussionId: activeTopicId || discussion.id,
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
      discussionId: activeTopicId || discussion.id,
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

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  const handleToggleBlind = async (postId: string) => {
    await toggleBlindPost(postId);
  };

  const handleAdvanceStage = async (stage: ThreeStepStage) => {
    await updateDiscussion({ currentStage: stage }, activeTopicId);
  };

  const handleSelectMode = async (mode: DiscussionMode) => {
    if (isTeacher) {
      await updateDiscussion({ mode }, activeTopicId);
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">

        {/* 1. Student Welcome / Login Prompt Banner */}
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
                  학급 명단(25명)에서 내 이름을 선택하면 긍정적인 동물 무기명 닉네임이 자동 배정됩니다.
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
                <span>⚡ 1초 자동 배정</span>
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
                    ({currentUser.studentInfo.grade}학년 {currentUser.studentInfo.classNum}반 {currentUser.studentInfo.studentNum}번 {currentUser.studentInfo.realName})
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

        {/* 2. Discussion Topics Tabs Bar (주제별 분리 및 보관 탭) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold opacity-75 shrink-0 flex items-center gap-1 mr-1">
            <FolderOpen className="w-3.5 h-3.5 text-purple-500" /> 토론 안건:
          </span>

          {discussionsList.map((d, idx) => {
            const isSelected = d.id === activeTopicId;
            const topicPostsCount = posts.filter((p) => p.discussionId === d.id).length;
            const modeEmoji = d.mode === 'pro_con' ? '⚖️' : d.mode === 'free_notes' ? '📝' : '🪜';

            return (
              <button
                key={d.id}
                onClick={() => handleSwitchTopic(d.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? theme === 'chalkboard'
                      ? 'bg-emerald-700 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-stone-900 text-white border-stone-800 shadow-md ring-2 ring-stone-300'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <span>{modeEmoji} {idx + 1}. {d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {topicPostsCount}개
                </span>
              </button>
            );
          })}

          {isTeacher && (
            <button
              onClick={() => setIsTeacherPanelOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 shrink-0 cursor-pointer shadow-xs ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 주제 출제</span>
            </button>
          )}
        </div>

        {/* 3. Classroom Blackboard / Discussion Topic Header Card */}
        <section className={`rounded-3xl p-6 sm:p-7 border shadow-lg transition-all relative overflow-hidden ${
          theme === 'chalkboard'
            ? 'bg-[#152720] border-chalk-wood text-emerald-50'
            : 'bg-white border-amber-200 text-stone-800'
        }`}>
          {/* Subtle Decorative Elements */}
          <div className="absolute -right-6 -bottom-6 text-7xl opacity-10 select-none pointer-events-none">
            {modeDescriptions[discussion.mode].icon}
          </div>

          <div className="relative z-10 space-y-3.5">
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

            {/* Topic Title: Enlarged for classroom display */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-snug">
              {discussion.title}
            </h2>

            {/* Description: Enlarged for classroom display */}
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed max-w-4xl ${
              theme === 'chalkboard' ? 'text-emerald-100/90' : 'text-stone-700'
            }`}>
              {discussion.description}
            </p>

            {/* Feature 1: Private Mode vs Public Reveal Status Bar */}
            {isTeacher ? (
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm transition-all ${
                discussion.isBlindToStudents !== false
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {discussion.isBlindToStudents !== false ? (
                    <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <Unlock className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <strong className="block font-bold">
                      {discussion.isBlindToStudents !== false ? '🔒 비공개 제출 모드 작동 중' : '📢 학생 전체 공개 모드'}
                    </strong>
                    <span className="text-xs opacity-80">
                      {discussion.isBlindToStudents !== false
                        ? '학생들은 자신이 쓴 의견만 볼 수 있으며, 친구들의 의견은 숨겨져 있습니다.'
                        : '모든 학생 화면에 모든 찬반 의견 및 투표 결과가 실시간으로 공개되어 있습니다.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleDiscussionBlind}
                  className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    discussion.isBlindToStudents !== false
                      ? 'bg-emerald-600 hover:bg-emerald-500 scale-105'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {discussion.isBlindToStudents !== false ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>📢 학생들에게 전체 공개하기</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>🔒 다시 학생 간 비공개로 전환</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              discussion.isBlindToStudents !== false ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                  <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>🔒 비공개 작성 모드:</strong> 친구들의 생각에 영향받지 않고 나의 솔직한 생각을 자유롭게 적어보세요! 선생님이 발표 시간에 전체 공개합니다. (내가 작성한 의견은 바로 확인 가능)
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200">
                  <Unlock className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>📢 전체 공개 완료:</strong> 친구들의 다양한 생각과 근거를 읽어보고 공감(하트)과 댓글을 남겨보세요!
                  </span>
                </div>
              )
            )}

            {/* Status & Anonymous Notice Banner */}
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm opacity-80">
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
                    [교사 제어판 & 25명 출석부 열기]
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Feature 2: Teacher-ONLY Real Name Toggle Toolbar (절대 학생 화면에는 노출되지 않음) */}
        {isTeacher && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-950 dark:text-purple-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                👩‍🏫
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm sm:text-base font-extrabold text-purple-900 dark:text-purple-100">
                    교사 전용 학생 실명 관리
                  </strong>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold">
                    교사 화면 전용
                  </span>
                </div>
                <p className="text-xs sm:text-sm opacity-80 mt-0.5">
                  {showAllRealNames
                    ? '🔍 [실명 표시 중] 선생님 모니터에만 학생 실명이 보입니다. 학생 기기 화면은 100% 무기명 닉네임으로 보호됩니다.'
                    : '🔒 [무기명 모드] 모든 의견 카드가 동물 닉네임으로 표시 중입니다. 필요 시 버튼을 눌러 실명을 일괄 확인할 수 있습니다.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllRealNames(!showAllRealNames)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                  showAllRealNames
                    ? 'bg-purple-700 hover:bg-purple-800 text-white ring-2 ring-purple-400'
                    : 'bg-white dark:bg-purple-950/80 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600 hover:bg-purple-50 shadow-2xs'
                }`}
              >
                {showAllRealNames ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>🙈 실명 숨기기 (무기명 모드)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>🔍 학생 실명 전체 표시 (교사 화면 전용)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsTeacherPanelOpen(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                <span>25명 출석부</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Active Mode Component View (Passing currentTopicPosts & showAllRealNames) */}
        {discussion.mode === 'pro_con' && (
          <DiscussionProCon
            discussion={discussion}
            posts={currentTopicPosts}
            onAddPost={handleAddProConPost}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onToggleBlind={handleToggleBlind}
            showAllRealNames={showAllRealNames}
          />
        )}

        {discussion.mode === 'free_notes' && (
          <DiscussionFreeNotes
            discussion={discussion}
            posts={currentTopicPosts}
            onAddPost={handleAddFreeNotePost}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onToggleBlind={handleToggleBlind}
            showAllRealNames={showAllRealNames}
          />
        )}

        {discussion.mode === 'three_step' && (
          <DiscussionThreeStep
            discussion={discussion}
            posts={currentTopicPosts}
            onAddPost={handleAddThreeStepPost}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onToggleBlind={handleToggleBlind}
            onAdvanceStage={handleAdvanceStage}
            showAllRealNames={showAllRealNames}
          />
        )}

      </main>

      {/* Floating Bottom-Left Firebase/Supabase Status Badge */}
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
        posts={currentTopicPosts}
        allPosts={posts}
        discussionsList={discussionsList}
        onUpdateDiscussion={updateDiscussion}
        onDeletePost={handleDeletePost}
        onToggleBlind={handleToggleBlind}
        showAllRealNames={showAllRealNames}
        onToggleShowAllRealNames={() => setShowAllRealNames(!showAllRealNames)}
        onSwitchTopic={handleSwitchTopic}
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
