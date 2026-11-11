import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateAnonymousIdentity } from '../utils/anonymousNames';
import { CLASS_ROSTER, findStudentByNum } from '../data/classRoster';
import { X, GraduationCap, ShieldAlert, Sparkles, Lock, Zap, Users, Check } from 'lucide-react';
import type { StudentInfo } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, allowClose = true }) => {
  const { loginAsStudent, quickAutoLoginStudent, loginAsTeacher, theme, currentUser, studentPin, teacherPin: authTeacherPin } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [showRosterPicker, setShowRosterPicker] = useState<boolean>(false);

  // Student form state with 1~6 grade and 1~4 class dropdowns
  const [grade, setGrade] = useState<number>(currentUser.studentInfo?.grade || 2);
  const [classNum, setClassNum] = useState<number>(currentUser.studentInfo?.classNum || 3);
  const [studentNum, setStudentNum] = useState<string>(currentUser.studentInfo?.studentNum ? String(currentUser.studentInfo.studentNum) : '');
  const [realName, setRealName] = useState<string>(currentUser.studentInfo?.realName || '');
  const [pin, setPin] = useState<string>(studentPin || '1234');

  // Teacher form state (default: '7287')
  const [teacherPin, setTeacherPin] = useState<string>(authTeacherPin || '7287');

  const [error, setError] = useState<string | null>(null);
  const [previewIdentity, setPreviewIdentity] = useState<{ anonymousName: string; avatar: string }>({
    anonymousName: '지혜로운 사자',
    avatar: '🦁',
  });

  // Dynamically update preview nickname as student changes grade/class/num
  useEffect(() => {
    const num = parseInt(studentNum, 10) || 1;
    const generated = generateAnonymousIdentity(grade, classNum, num);
    setPreviewIdentity(generated);

    // Auto-fill student name from CLASS_ROSTER if matching number exists and name is empty or already in roster
    const matched = findStudentByNum(num);
    if (matched && (!realName || CLASS_ROSTER.some((s) => s.realName === realName))) {
      setRealName(matched.realName);
    }
  }, [grade, classNum, studentNum]);

  // Keep PIN in sync if studentPin from context changes
  useEffect(() => {
    if (studentPin) {
      setPin(studentPin);
    }
  }, [studentPin]);

  if (!isOpen) return null;

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = studentNum.replace(/[^0-9]/g, '');
    const parsedNum = parseInt(cleanNum, 10);
    if (!cleanNum || isNaN(parsedNum) || parsedNum <= 0) {
      setError('학생 번호를 숫자로 입력해 주세요. (예: 1~25)');
      return;
    }

    if (!realName.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    const studentInfo: StudentInfo = {
      grade: Number(grade),
      classNum: Number(classNum),
      studentNum: parsedNum,
      realName: realName.trim(),
    };

    const res = await loginAsStudent(studentInfo, pin);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || '로그인에 실패했습니다.');
    }
  };

  const handleSelectFromRoster = (num: number, name: string) => {
    setStudentNum(String(num));
    setRealName(name);
    setShowRosterPicker(false);
  };

  const handleQuickAutoLogin = async () => {
    setError(null);
    const res = await quickAutoLoginStudent();
    if (res.success) {
      onClose();
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await loginAsTeacher(teacherPin);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || '교사 비밀번호가 일치하지 않습니다. (기본값: 7287)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-6 sm:p-7 shadow-2xl border transition-all ${
          theme === 'chalkboard'
            ? 'bg-[#182922] border-emerald-700/60 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              theme === 'chalkboard' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-100 text-amber-800'
            }`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">참여자 인증 및 로그인</h2>
              <p className="text-xs opacity-75">학생 무기명 접속 또는 교사 관리자 모드</p>
            </div>
          </div>
          {allowClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 mt-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(null); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'student'
                ? theme === 'chalkboard'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-900 shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <span>🎒 학생 로그인 (무기명)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('teacher'); setError(null); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'teacher'
                ? theme === 'chalkboard'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-600 text-white shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <span>👩‍🏫 교사 관리자</span>
          </button>
        </div>

        {/* Quick Auto Login Button */}
        {activeTab === 'student' && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleQuickAutoLogin}
              className="flex-1 py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>⚡ 1초 빠른 학생 배정</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRosterPicker(!showRosterPicker)}
              className="py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{showRosterPicker ? '직접 입력' : '명단 선택 (25명)'}</span>
            </button>
          </div>
        )}

        {/* Roster Quick Selection Grid */}
        {activeTab === 'student' && showRosterPicker && (
          <div className="mt-3 p-3 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
            <div className="text-[11px] font-bold opacity-75 mb-2 flex items-center justify-between">
              <span>📋 우리 반 명단에서 내 이름을 클릭하세요:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">총 25명</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {CLASS_ROSTER.map((s) => {
                const isSelected = studentNum === String(s.studentNum);
                return (
                  <button
                    key={s.studentNum}
                    type="button"
                    onClick={() => handleSelectFromRoster(s.studentNum, s.realName)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-left truncate transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                        : 'bg-black/5 dark:bg-white/5 hover:bg-emerald-500/20'
                    }`}
                  >
                    <span>{s.studentNum}. {s.realName}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Student Form */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Grade Dropdown (1~6학년) */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">학년</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1} className="text-stone-900">1학년</option>
                  <option value={2} className="text-stone-900">2학년</option>
                  <option value={3} className="text-stone-900">3학년</option>
                  <option value={4} className="text-stone-900">4학년</option>
                  <option value={5} className="text-stone-900">5학년</option>
                  <option value={6} className="text-stone-900">6학년</option>
                </select>
              </div>

              {/* Class Dropdown (1~4반) */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">반</label>
                <select
                  value={classNum}
                  onChange={(e) => setClassNum(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1} className="text-stone-900">1반</option>
                  <option value={2} className="text-stone-900">2반</option>
                  <option value={3} className="text-stone-900">3반</option>
                  <option value={4} className="text-stone-900">4반</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Number (Text box with digits only) */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">번호 (숫자)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="예: 1~25"
                    value={studentNum}
                    onChange={(e) => {
                      const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
                      setStudentNum(numbersOnly);
                    }}
                    required
                    className="w-full px-3 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs opacity-60 pointer-events-none">
                    번
                  </span>
                </div>
              </div>

              {/* Real Name (Text box) */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">이름</label>
                <input
                  type="text"
                  placeholder="예: 안은비"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password (기본값 1234) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold opacity-80">비밀번호 (기본값: {studentPin})</label>
                <span className="text-[11px] opacity-60">교사 관리자가 변경 가능</span>
              </div>
              <input
                type="text"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] mt-1 opacity-70">
                * 입력한 이름과 학번은 교사 화면에만 보이며, 친구들에겐 무기명 닉네임만 표시됩니다.
              </p>
            </div>

            {/* Generated Anonymous Preview Card */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              theme === 'chalkboard'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{previewIdentity.avatar}</span>
                <div>
                  <span className="text-[10px] font-bold block opacity-75">자동 부여 무기명 닉네임</span>
                  <span className="text-sm font-bold">{previewIdentity.anonymousName}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 무기명 보장
              </span>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all cursor-pointer shadow-md ${
                theme === 'chalkboard'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              무기명으로 토론 참여하기
            </button>
          </form>
        )}

        {/* Tab 2: Teacher Form */}
        {activeTab === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="mt-4 space-y-4">
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              theme === 'chalkboard'
                ? 'bg-purple-950/40 border-purple-700/50 text-purple-200'
                : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              <p className="font-semibold mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> 교사 관리자 권한
              </p>
              토론 안건 추가/보관함 관리, 비공개 모드 제어(학생 전체 공개), 25명 실시간 출석 확인, 실명 확인 모드 활성화, 부적절 글 삭제 기능이 제공됩니다.
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold opacity-80">관리자 비밀번호</label>
                <span className="text-[10px] text-purple-500 font-bold">기본값: 7287</span>
              </div>
              <input
                type="password"
                placeholder="비밀번호 입력 (7287)"
                value={teacherPin}
                onChange={(e) => setTeacherPin(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] mt-1 opacity-60">
                * 교사 전용 비밀번호: <code className="font-mono font-bold text-purple-600 dark:text-purple-300">7287</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-md"
            >
              교사 관리자 모드 접속
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
