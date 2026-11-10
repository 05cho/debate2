import React, { useState } from 'react';
import type { Discussion, Post, DiscussionMode, ThreeStepStage } from '../types';
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
  ThumbsUp, 
  ThumbsDown, 
  FileSpreadsheet, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Pause,
  Play
} from 'lucide-react';
import { resetClassroomData } from '../services/dataService';

interface TeacherAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discussion: Discussion;
  posts: Post[];
  onUpdateDiscussion: (updates: Partial<Discussion>) => Promise<void>;
  onDeletePost: (postId: string) => void;
  onToggleBlind: (postId: string) => void;
  showAllRealNames: boolean;
  onToggleShowAllRealNames: () => void;
}

export const TeacherAdminPanel: React.FC<TeacherAdminPanelProps> = ({
  isOpen,
  onClose,
  discussion,
  posts,
  onUpdateDiscussion,
  onDeletePost,
  onToggleBlind,
  showAllRealNames,
  onToggleShowAllRealNames,
}) => {
  const { theme, studentPin, setStudentPin } = useAuth();

  const [title, setTitle] = useState(discussion.title);
  const [description, setDescription] = useState(discussion.description);
  const [mode, setMode] = useState<DiscussionMode>(discussion.mode);
  const [stage, setStage] = useState<ThreeStepStage>(discussion.currentStage || 1);
  const [allowSubmissions, setAllowSubmissions] = useState(discussion.allowSubmissions);
  const [customStudentPin, setCustomStudentPin] = useState(studentPin || '1234');
  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync state when discussion prop changes
  React.useEffect(() => {
    setTitle(discussion.title);
    setDescription(discussion.description);
    setMode(discussion.mode);
    setStage(discussion.currentStage || 1);
    setAllowSubmissions(discussion.allowSubmissions);
  }, [discussion]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customStudentPin.trim()) {
      setStudentPin(customStudentPin.trim());
    }
    await onUpdateDiscussion({
      title: title.trim(),
      description: description.trim(),
      mode,
      currentStage: stage,
      allowSubmissions,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['번호', '학년', '반', '학생번호', '실명', '익명닉네임', '토론모드', '입장/단계', '내용', '공감수', '댓글수', '작성일시'];
    
    const rows = posts.map((p, idx) => {
      const student = p.studentInfo;
      const stanceOrStage = p.mode === 'pro_con' ? (p.stance || '중립') : p.mode === 'three_step' ? `${p.stage}단계` : (p.color || '메모');
      const formattedDate = new Date(p.createdAt).toLocaleString('ko-KR');
      
      const cleanContent = `"${(p.content || '').replace(/"/g, '""')}"`;
      
      return [
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
    link.setAttribute('download', `학급토론결과_${new Date().toISOString().slice(0, 10)}.csv`);
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
총 등록 의견: ${posts.length}개
찬성: ${agree}명 / 반대: ${disagree}명 / 중립: ${neutral}명
작성일: ${new Date().toLocaleDateString('ko-KR')}
`;
    navigator.clipboard.writeText(report);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleReset = () => {
    resetClassroomData();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 shadow-2xl border transition-all ${
          theme === 'chalkboard'
            ? 'bg-[#182a24] border-purple-700/60 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>교사 전용 제어판 (Teacher Admin)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold">
                  관리자 모드
                </span>
              </h2>
              <p className="text-xs opacity-75">
                안건 출제, 토론 모드 및 3단계 진행 제어, 실명 확인, 결과 엑셀 내보내기
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-center">
            <span className="text-xs opacity-70 block mb-0.5">총 등록 의견</span>
            <span className="text-xl font-bold text-emerald-500">{posts.length}개</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-center">
            <span className="text-xs opacity-70 block mb-0.5">찬성 vs 반대</span>
            <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
              찬성 {posts.filter((p) => p.stance === 'agree').length} / 반대 {posts.filter((p) => p.stance === 'disagree').length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-center">
            <span className="text-xs opacity-70 block mb-0.5">토론 진행 상태</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
              discussion.allowSubmissions ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
            }`}>
              {discussion.allowSubmissions ? '제출 진행 중' : '제출 일시정지'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-center">
            <span className="text-xs opacity-70 block mb-0.5">실명 확인 모드</span>
            <button
              onClick={onToggleShowAllRealNames}
              className={`text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                showAllRealNames
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
              }`}
            >
              {showAllRealNames ? '전체 실명 켜짐' : '클릭하여 전체 표시'}
            </button>
          </div>
        </div>

        {/* 2. Topic & Mode Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-80">
              토론 안건 / 논제 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 opacity-80">
              상세 설명 및 학생 지도 안내사항
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold mb-2 opacity-80">
              활성화할 토론 모드 선택
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('pro_con')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'pro_con'
                    ? 'ring-2 ring-purple-500 bg-purple-500/15 border-purple-500'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>⚖️ 모드 1: 찬반 토론</span>
                </div>
                <p className="text-[11px] opacity-70 mt-1">
                  찬성/반대/중립 실시간 투표 게이지 및 카드
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('free_notes')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'free_notes'
                    ? 'ring-2 ring-purple-500 bg-purple-500/15 border-purple-500'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>📝 모드 2: 자유 의견</span>
                </div>
                <p className="text-[11px] opacity-70 mt-1">
                  포스트잇 스타일 카드, 공감 하트 및 댓글
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('three_step')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'three_step'
                    ? 'ring-2 ring-purple-500 bg-purple-500/15 border-purple-500'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>🪜 모드 3: 3단계 토론</span>
                </div>
                <p className="text-[11px] opacity-70 mt-1">
                  입론 ➔ 반론 ➔ 최종발언 순차 진행 제어
                </p>
              </button>
            </div>
          </div>

          {/* If Mode 3 is selected, show Stage Control */}
          {mode === 'three_step' && (
            <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/30">
              <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
                모드 3 현재 진행 단계 전환 (학생 화면에 즉시 동기화)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as ThreeStepStage[]).map((stg) => {
                  const labels = {
                    1: '1단계: 입론',
                    2: '2단계: 반론',
                    3: '3단계: 최종발언',
                  };
                  return (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => setStage(stg)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stage === stg
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                      }`}
                    >
                      {labels[stg]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submission & Student PIN Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Student PIN Setting */}
            <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
              <label className="text-xs font-bold block mb-1">
                🔑 학생 접속 비밀번호 (PIN)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={customStudentPin}
                  onChange={(e) => setCustomStudentPin(e.target.value)}
                  placeholder="예: 1234"
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15"
                />
              </div>
              <span className="text-[10px] opacity-65 mt-1 block">
                * 학생 로그인 화면에 기본 적용되며, 필요 시 언제든 변경할 수 있습니다.
              </span>
            </div>

            {/* Submission Toggle */}
            <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold block">학생 신규 의견 제출 허용</span>
                <span className="text-[10px] opacity-65">
                  수업 정리 시간이나 교사 설명 시 일시 정지
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAllowSubmissions(!allowSubmissions)}
                className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  allowSubmissions
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {allowSubmissions ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{allowSubmissions ? '제출 허용 중' : '제출 일시정지됨'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <Check className="w-4 h-4" /> 변경사항이 실시간 적용되었습니다!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-md"
            >
              안건 및 모드 실시간 적용
            </button>
          </div>
        </form>

        {/* 3. Export & Management Actions */}
        <div className="mt-7 pt-5 border-t border-black/10 dark:border-white/10 space-y-4">
          <h3 className="font-bold text-sm">토론 결과 리포트 및 관리 도구</h3>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>전체 토론 결과 엑셀(CSV) 다운로드</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>{copySuccess ? '복사 완료!' : '결과 요약 리포트 복사'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>수업 샘플 초기화</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
