import React, { useState, useEffect } from 'react';
import type { Discussion, Post, DiscussionMode, ThreeStepStage, StudentPresence } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Settings, 
  Layers, 
  ShieldCheck, 
  Download, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  FileSpreadsheet, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Pause,
  Play,
  Lock,
  Unlock,
  Plus,
  FolderOpen,
  Calendar,
  Sparkles,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { 
  resetClassroomData, 
  getDiscussionsList, 
  getActiveTopicId, 
  setActiveTopicId, 
  createDiscussionTopic, 
  deleteDiscussionTopic,
  getStudentPresences,
  resetStudentPresences,
  subscribeStudentPresences
} from '../services/dataService';
import { CLASS_ROSTER } from '../data/classRoster';

interface TeacherAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discussion: Discussion;
  posts: Post[];
  allPosts: Post[];
  discussionsList: Discussion[];
  onUpdateDiscussion: (updates: Partial<Discussion>, targetId?: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  onToggleBlind: (postId: string) => void;
  showAllRealNames: boolean;
  onToggleShowAllRealNames: () => void;
  onSwitchTopic: (topicId: string) => void;
}

export const TeacherAdminPanel: React.FC<TeacherAdminPanelProps> = ({
  isOpen,
  onClose,
  discussion,
  posts,
  allPosts,
  discussionsList,
  onUpdateDiscussion,
  onDeletePost,
  onToggleBlind,
  showAllRealNames,
  onToggleShowAllRealNames,
  onSwitchTopic,
}) => {
  const { theme, studentPin, setStudentPin, teacherPin, setTeacherPin } = useAuth();

  const [activeTab, setActiveTab] = useState<'control' | 'attendance' | 'topics' | 'posts'>('control');

  // Form states for current discussion
  const [title, setTitle] = useState(discussion.title);
  const [description, setDescription] = useState(discussion.description);
  const [mode, setMode] = useState<DiscussionMode>(discussion.mode);
  const [stage, setStage] = useState<ThreeStepStage>(discussion.currentStage || 1);
  const [allowSubmissions, setAllowSubmissions] = useState(discussion.allowSubmissions);
  const [isBlindToStudents, setIsBlindToStudents] = useState<boolean>(discussion.isBlindToStudents !== false);
  
  // PIN states
  const [customStudentPin, setCustomStudentPin] = useState(studentPin || '1234');
  const [customTeacherPin, setCustomTeacherPin] = useState(teacherPin || '7287');
  
  // New topic form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMode, setNewMode] = useState<DiscussionMode>('pro_con');
  const [newIsBlind, setNewIsBlind] = useState<boolean>(true);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  // Student Presences (25 student attendance)
  const [presences, setPresences] = useState<StudentPresence[]>([]);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'online' | 'offline'>('all');

  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedOfflineNames, setCopiedOfflineNames] = useState(false);

  // Sync state when discussion prop changes
  useEffect(() => {
    setTitle(discussion.title);
    setDescription(discussion.description);
    setMode(discussion.mode);
    setStage(discussion.currentStage || 1);
    setAllowSubmissions(discussion.allowSubmissions);
    setIsBlindToStudents(discussion.isBlindToStudents !== false);
  }, [discussion]);

  // Subscribe to real-time student presences
  useEffect(() => {
    const unsub = subscribeStudentPresences((list) => {
      setPresences(list);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  // Toggle private submission mode vs public reveal
  const handleToggleBlindToStudents = async () => {
    const nextState = !isBlindToStudents;
    setIsBlindToStudents(nextState);
    await onUpdateDiscussion({ isBlindToStudents: nextState });
  };

  const handleSaveControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customStudentPin.trim()) {
      setStudentPin(customStudentPin.trim());
    }
    if (customTeacherPin.trim()) {
      setTeacherPin(customTeacherPin.trim());
    }
    await onUpdateDiscussion({
      title: title.trim(),
      description: description.trim(),
      mode,
      currentStage: stage,
      allowSubmissions,
      isBlindToStudents,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Create a new topic while preserving existing topics & posts
  const handleCreateNewTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreatingTopic(true);
    try {
      const created = await createDiscussionTopic({
        title: newTitle.trim(),
        description: newDescription.trim() || '친구들과 함께 자유롭게 의견을 나누고 토론해 봅시다.',
        mode: newMode,
        isBlindToStudents: newIsBlind,
      });
      setNewTitle('');
      setNewDescription('');
      setIsCreatingTopic(false);
      onSwitchTopic(created.id);
      setActiveTab('control');
    } catch (err) {
      console.error(err);
      setIsCreatingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await deleteDiscussionTopic(topicId);
    } catch (err) {
      console.warn(err);
    }
  };

  // Attendance stats
  const onlineCount = presences.filter((p) => p.isOnline).length;
  const offlineCount = CLASS_ROSTER.length - onlineCount;
  const offlineStudents = presences.filter((p) => !p.isOnline);

  const filteredPresences = presences.filter((p) => {
    if (attendanceFilter === 'online') return p.isOnline;
    if (attendanceFilter === 'offline') return !p.isOnline;
    return true;
  });

  const handleCopyOfflineList = () => {
    const text = `[미접속 학생 명단 (총 ${offlineCount}명)]\n` + 
      offlineStudents.map((s) => `${s.studentNum}번 ${s.realName}`).join(', ');
    navigator.clipboard.writeText(text);
    setCopiedOfflineNames(true);
    setTimeout(() => setCopiedOfflineNames(false), 2000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['토론주제', '번호', '학년', '반', '학생번호', '실명', '익명닉네임', '토론모드', '입장/단계', '내용', '공감수', '댓글수', '작성일시'];
    
    const rows = posts.map((p, idx) => {
      const student = p.studentInfo;
      const stanceOrStage = p.mode === 'pro_con' ? (p.stance || '중립') : p.mode === 'three_step' ? `${p.stage}단계` : (p.color || '메모');
      const formattedDate = new Date(p.createdAt).toLocaleString('ko-KR');
      const cleanContent = `"${(p.content || '').replace(/"/g, '""')}"`;
      const cleanTopic = `"${discussion.title.replace(/"/g, '""')}"`;
      
      return [
        cleanTopic,
        idx + 1,
        student?.grade || '',
        student?.classNum || '',
        student?.studentNum || '',
        student?.realName || '미입력',
        p.anonymousName,
        p.mode,
        stanceOrStage,
        cleanContent,
        p.likes || 0,
        p.commentsCount || 0,
        formattedDate,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `학급토론결과_${discussion.title.slice(0, 15)}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Summary text report
  const handleCopySummary = () => {
    const proConPosts = posts.filter((p) => p.mode === 'pro_con');
    const agree = proConPosts.filter((p) => p.stance === 'agree').length;
    const disagree = proConPosts.filter((p) => p.stance === 'disagree').length;
    const neutral = proConPosts.filter((p) => p.stance === 'neutral').length;

    const report = `[우리들의 생각 공장 - 학급 토론 요약 보고서]
주제: ${discussion.title}
토론 방식: ${discussion.mode === 'pro_con' ? '찬반 토론' : discussion.mode === 'free_notes' ? '자유 의견 모으기' : '3단계 구조화 토론'}
공개 여부: ${discussion.isBlindToStudents ? '비공개 모드' : '전체 공개 완료'}
참여 인원: ${posts.length}건 제출 (접속 학생: ${onlineCount}명)
찬성: ${agree}명 / 반대: ${disagree}명 / 중립: ${neutral}명
작성일: ${new Date().toLocaleDateString('ko-KR')}
`;
    navigator.clipboard.writeText(report);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border transition-all overflow-hidden ${
          theme === 'chalkboard'
            ? 'bg-[#15241e] border-emerald-700/60 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>교사 스마트 제어판</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30">
                  교사 관리자 전용
                </span>
              </h2>
              <p className="text-xs opacity-75 line-clamp-1">
                현재 안건: <strong>{discussion.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Main Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-black/10 dark:border-white/10 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'control'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>토론 제어 & 비공개 설정</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'attendance'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>25명 출석/로그인 현황</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
              {onlineCount}/25
            </span>
          </button>

          <button
            onClick={() => setActiveTab('topics')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'topics'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>토론 안건 보관함 & 새 주제</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
              {discussionsList.length}개
            </span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'posts'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>학생 의견 관리 & 엑셀</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
              {posts.length}개
            </span>
          </button>
        </div>

        {/* Tab Contents (Scrollable body) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: 토론 제어 & 비공개/공개 설정 */}
          {activeTab === 'control' && (
            <form onSubmit={handleSaveControl} className="space-y-6">

              {/* 1. Large Feature Card: Private Mode vs Public Reveal (기본 비공개 모드 / 전체 공개 제어) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                isBlindToStudents
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      isBlindToStudents ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {isBlindToStudents ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-base font-extrabold">
                          {isBlindToStudents ? '🔒 비공개 모드 (학생 간 숨김 작동 중)' : '📢 학생 전체 공개 모드 (칠판 공개 완료)'}
                        </strong>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                          {isBlindToStudents ? '기본 권장 상태' : '공개 완료'}
                        </span>
                      </div>
                      <p className="text-xs opacity-85 mt-0.5 max-w-xl">
                        {isBlindToStudents 
                          ? '학생들은 자신이 쓴 의견만 볼 수 있으며, 친구들의 생각에 영향받지 않고 솔직하게 작성합니다. 준비가 끝나면 아래 버튼을 눌러 전체 공개하세요!'
                          : '현재 모든 학생의 화면에 친구들의 모든 찬반 의견/포스트잇/투표 결과가 실시간으로 공개되어 활발히 열람 중입니다.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleBlindToStudents}
                    className={`px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm text-white shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                      isBlindToStudents
                        ? 'bg-emerald-600 hover:bg-emerald-500 scale-105 ring-2 ring-emerald-300'
                        : 'bg-amber-600 hover:bg-amber-500'
                    }`}
                  >
                    {isBlindToStudents ? (
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
              </div>

              {/* 2. Topic Editing & Submissions Allowance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-85">토론 안건 제목</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-85">논제 설명 및 학생 발문</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
                  <div>
                    <label className="block font-bold mb-1.5 opacity-85">토론 모드 선택</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'pro_con', label: '찬반 토론', icon: '⚖️' },
                        { id: 'free_notes', label: '자유 의견', icon: '📝' },
                        { id: 'three_step', label: '3단계 구조화', icon: '🪜' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMode(m.id as DiscussionMode)}
                          className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                            mode === m.id
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300'
                              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="text-base">{m.icon}</div>
                          <div className="text-[11px] mt-0.5">{m.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* If Mode 3, Stage Advance Controller */}
                  {mode === 'three_step' && (
                    <div>
                      <label className="block font-bold mb-1.5 opacity-85">3단계 토론 진행 단계 제어</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { stage: 1, title: '1단계: 입론' },
                          { stage: 2, title: '2단계: 반론' },
                          { stage: 3, title: '3단계: 최종발언' },
                        ].map((s) => (
                          <button
                            key={s.stage}
                            type="button"
                            onClick={() => setStage(s.stage as ThreeStepStage)}
                            className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              stage === s.stage
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-60'
                            }`}
                          >
                            {s.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Pause/Allow Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                    <div>
                      <span className="font-bold block">학생 신규 의견 등록 허용</span>
                      <span className="opacity-70 text-[11px]">일시 정지 시 학생 작성 폼이 잠깁니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowSubmissions(!allowSubmissions)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                        allowSubmissions
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {allowSubmissions ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{allowSubmissions ? '제출 허용 중' : '일시 정지됨'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Password Settings (Student PIN & Teacher PIN 변경: 7287) */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <h4 className="text-xs font-bold mb-3 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-purple-500" />
                  <span>비밀번호 관리 (학생 PIN 및 교사 관리자 PIN)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 opacity-80">
                      학생 접속 비밀번호 (현재: <strong className="text-emerald-500">{studentPin}</strong>)
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={customStudentPin}
                      onChange={(e) => setCustomStudentPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] opacity-60">학생 로그인 창에 기본 적용됩니다.</span>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 opacity-80">
                      교사 관리자 비밀번호 (현재: <strong className="text-purple-500">{teacherPin}</strong>)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={customTeacherPin}
                      onChange={(e) => setCustomTeacherPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] opacity-60">교사 로그인 시 인증하는 관리자 비밀번호입니다.</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                {isSaved ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> 설정이 성공적으로 저장되었습니다!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-md"
                >
                  토론 설정 저장하기
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: 25명 출석 및 로그인 현황 */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Attendance Header Stats */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="opacity-70 block">전체 학생</span>
                    <strong className="text-base font-extrabold">{CLASS_ROSTER.length}명</strong>
                  </div>
                  <div className="h-6 w-px bg-black/10 dark:bg-white/10" />
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">🟢 접속 완료</span>
                    <strong className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{onlineCount}명</strong>
                  </div>
                  <div className="h-6 w-px bg-black/10 dark:bg-white/10" />
                  <div>
                    <span className="opacity-70 block">⚪ 미접속</span>
                    <strong className="text-base font-extrabold opacity-75">{offlineCount}명</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {offlineCount > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyOfflineList}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedOfflineNames ? '복사 완료! ✓' : '미접속자 명단 복사'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetStudentPresences}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center gap-1 cursor-pointer opacity-75"
                    title="다음 교시 또는 새로운 출석을 위해 상태를 초기화합니다."
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>출석 리셋</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    attendanceFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  전체 (25명)
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('online')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    attendanceFilter === 'online'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  접속 중 ({onlineCount}명)
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('offline')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    attendanceFilter === 'offline'
                      ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                      : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  미접속 ({offlineCount}명)
                </button>
              </div>

              {/* 25 Student Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredPresences.map((s) => {
                  // Calculate submitted posts by this student in current topic
                  const studentPostsCount = posts.filter(
                    (p) => p.studentInfo?.studentNum === s.studentNum
                  ).length;

                  return (
                    <div
                      key={s.studentNum}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        s.isOnline
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`w-2 h-2 rounded-full ${s.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                          <span className="text-sm">{s.studentNum}번 {s.realName}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                          s.isOnline
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                            : 'bg-black/10 dark:bg-white/10 opacity-60'
                        }`}>
                          {s.isOnline ? '접속 완료' : '미접속'}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] opacity-80 pt-1 border-t border-black/5 dark:border-white/10">
                        {s.isOnline ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span>부여된 닉네임:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-300">
                                {s.avatar} {s.anonymousName || '지혜로운 사자'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>의견 작성:</span>
                              <span className={`font-bold ${studentPostsCount > 0 ? 'text-purple-600 dark:text-purple-300' : 'opacity-60'}`}>
                                {studentPostsCount > 0 ? `${studentPostsCount}건 제출됨 ✓` : '아직 미제출'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center opacity-60 py-1">
                            아직 로그인하지 않았습니다
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 토론 안건 보관함 & 새 주제 추가 */}
          {activeTab === 'topics' && (
            <div className="space-y-6">

              {/* Add New Topic Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                <h4 className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>새로운 토론 안건 출제하기 (기존 의견 보관)</span>
                </h4>
                <p className="text-xs opacity-75 mb-3">
                  * 새로운 주제를 시작하더라도 <strong>이전 안건의 학생 의견과 투표 결과는 보관함에 100% 안전하게 저장</strong>되며 언제든 다시 열람할 수 있습니다.
                </p>

                <form onSubmit={handleCreateNewTopic} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1 opacity-85">새 토론 제목</label>
                    <input
                      type="text"
                      placeholder="예: 학교 급식 잔반을 줄이기 위한 의무 배식제를 실시해야 하는가?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 opacity-85">논제 설명 및 발문</label>
                    <input
                      type="text"
                      placeholder="예: 음식물 쓰레기 감소와 환경 보호 vs 개인의 자율적 선택권에 대한 근거를 제시해주세요."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold opacity-80">토론 모드:</span>
                      <select
                        value={newMode}
                        onChange={(e) => setNewMode(e.target.value as DiscussionMode)}
                        className="px-2.5 py-1.5 rounded-lg border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 font-semibold"
                      >
                        <option value="pro_con" className="text-stone-900">찬반 토론 (투표 게이지)</option>
                        <option value="free_notes" className="text-stone-900">자유 의견 모으기 (포스트잇)</option>
                        <option value="three_step" className="text-stone-900">3단계 구조화 토론</option>
                      </select>

                      <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newIsBlind}
                          onChange={(e) => setNewIsBlind(e.target.checked)}
                          className="rounded text-purple-600"
                        />
                        <span className="font-semibold opacity-85">기본 비공개 모드로 시작</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={!newTitle.trim() || isCreatingTopic}
                      className="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                    >
                      {isCreatingTopic ? '생성 중...' : '➕ 새 토론 안건 시작하기'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Topics Archive List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold opacity-80 flex items-center justify-between">
                  <span>🗂️ 출제된 토론 안건 보관 목록 (총 {discussionsList.length}개)</span>
                  <span className="text-[11px] opacity-60">원하는 안건을 클릭하여 즉시 수업 화면으로 전환하세요.</span>
                </h4>

                <div className="space-y-2.5">
                  {discussionsList.map((d, idx) => {
                    const isActive = d.id === discussion.id;
                    const topicPosts = allPosts.filter((p) => p.discussionId === d.id);
                    const modeLabel = d.mode === 'pro_con' ? '⚖️ 찬반' : d.mode === 'free_notes' ? '📝 자유' : '🪜 3단계';

                    return (
                      <div
                        key={d.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-purple-500/15 border-purple-500/50 shadow-xs ring-2 ring-purple-400/40'
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10'
                        }`}
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                              안건 {idx + 1}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300">
                              {modeLabel}
                            </span>
                            {isActive && (
                              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                                ⭐ 현재 수업 진행 중
                              </span>
                            )}
                            <span className="text-[11px] opacity-70">
                              {d.isBlindToStudents !== false ? '🔒 비공개 모드' : '📢 전체 공개'}
                            </span>
                          </div>

                          <h5 className="font-bold text-sm line-clamp-1">{d.title}</h5>
                          <p className="text-xs opacity-75 line-clamp-1">{d.description}</p>
                          
                          <div className="text-[11px] opacity-70 flex items-center gap-3 pt-1">
                            <span>등록된 학생 의견: <strong>{topicPosts.length}개</strong></span>
                            <span>•</span>
                            <span>생성일: {new Date(d.createdAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchTopic(d.id);
                                onClose();
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-xs"
                            >
                              이 주제로 토론 열기 ➔
                            </button>
                          )}
                          {discussionsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(d.id)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer opacity-70 hover:opacity-100"
                              title="이 토론 안건 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: 학생 의견 관리 & 엑셀 다운로드 */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onToggleShowAllRealNames}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      showAllRealNames
                        ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                        : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 opacity-80'
                    }`}
                  >
                    {showAllRealNames ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showAllRealNames ? '실명 확인 모드 끄기' : '🔍 전체 실명 일괄 확인'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>엑셀(CSV) 다운로드</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copySuccess ? '복사됨!' : '요약 보고서 복사'}</span>
                  </button>
                </div>
              </div>

              {/* Posts Feed for Teacher */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {posts.length === 0 ? (
                  <div className="p-8 text-center text-xs opacity-60">
                    현재 등록된 학생 의견이 없습니다.
                  </div>
                ) : (
                  posts.map((p, idx) => {
                    const student = p.studentInfo;
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-2xl border text-xs transition-all flex items-start justify-between gap-3 ${
                          p.isBlinded
                            ? 'bg-rose-500/10 border-rose-500/30 opacity-60'
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                        }`}
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold opacity-60">#{idx + 1}</span>
                            <span className="text-base">{p.avatar}</span>
                            <span className="font-bold">{p.anonymousName}</span>

                            {/* Real Name Badge */}
                            {(showAllRealNames || true) && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-500/30">
                                {student ? `${student.grade}학년 ${student.classNum}반 ${student.studentNum}번 ${student.realName}` : '실명 미등록'}
                              </span>
                            )}

                            {p.stance && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                p.stance === 'agree' ? 'bg-emerald-500/20 text-emerald-600' : p.stance === 'disagree' ? 'bg-rose-500/20 text-rose-600' : 'bg-sky-500/20 text-sky-600'
                              }`}>
                                {p.stance === 'agree' ? '찬성' : p.stance === 'disagree' ? '반대' : '중립'}
                              </span>
                            )}
                          </div>

                          <p className="opacity-90 leading-relaxed text-xs pt-1">{p.content}</p>
                          
                          <div className="text-[10px] opacity-60 flex items-center gap-2 pt-1">
                            <span>❤️ 공감 {p.likes || 0}</span>
                            <span>•</span>
                            <span>💬 댓글 {p.commentsCount || 0}</span>
                            <span>•</span>
                            <span>{new Date(p.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleBlind(p.id)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              p.isBlinded ? 'bg-amber-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                            }`}
                            title={p.isBlinded ? '블라인드 해제' : '학생 화면에서 블라인드 숨김'}
                          >
                            {p.isBlinded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePost(p.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer opacity-70 hover:opacity-100"
                            title="의견 영구 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Reset Bar */}
        <div className="px-6 py-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs shrink-0 bg-black/5 dark:bg-white/5">
          <span className="opacity-60 text-[11px]">
            * 토론 데이터는 Supabase 클라우드 및 브라우저에 안전하게 보관됩니다.
          </span>
          <button
            type="button"
            onClick={resetClassroomData}
            className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>수업 데이터 전체 초기화</span>
          </button>
        </div>

      </div>
    </div>
  );
};
