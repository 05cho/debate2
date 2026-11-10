import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  LogIn, 
  Settings, 
  Radio, 
  BookOpen,
  HelpCircle
} from 'lucide-react';
import type { DiscussionMode } from '../types';

interface HeaderProps {
  currentMode: DiscussionMode;
  onOpenLogin: () => void;
  onOpenTeacherPanel: () => void;
  onOpenGuide: () => void;
  onSelectMode: (mode: DiscussionMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onOpenLogin,
  onOpenTeacherPanel,
  onOpenGuide,
  onSelectMode,
}) => {
  const { currentUser, isTeacher, logout, theme, toggleTheme } = useAuth();

  const modeLabels: { [key in DiscussionMode]: { label: string; icon: string } } = {
    pro_con: { label: '찬반 토론', icon: '⚖️' },
    free_notes: { label: '자유 의견', icon: '📝' },
    three_step: { label: '3단계 토론', icon: '🪜' },
  };

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
      theme === 'chalkboard'
        ? 'bg-[#15231e]/95 border-emerald-900/40 text-emerald-50 backdrop-blur-md'
        : 'bg-white/95 border-amber-100 text-stone-800 backdrop-blur-md shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm ${
              theme === 'chalkboard' 
                ? 'bg-emerald-900/60 border border-emerald-700/60 text-emerald-200' 
                : 'bg-amber-100/80 border border-amber-200 text-amber-700'
            }`}>
              💡
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                  우리들의 생각 공장
                </h1>
                <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  theme === 'chalkboard'
                    ? 'bg-emerald-950 border border-emerald-700/50 text-emerald-300'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}>
                  무기명 학급 토론
                </span>
              </div>
              <p className={`text-xs truncate hidden sm:block ${
                theme === 'chalkboard' ? 'text-emerald-300/70' : 'text-stone-500'
              }`}>
                초·중·고 자유롭고 안전한 실시간 생각 나눔 공간
              </p>
            </div>
          </div>

          {/* Center Mode Tabs (Quick switch) */}
          <div className="hidden lg:flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-stone-200/50 dark:border-white/10">
            {(['pro_con', 'free_notes', 'three_step'] as DiscussionMode[]).map((mode) => {
              const active = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onSelectMode(mode)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? theme === 'chalkboard'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-white text-stone-900 shadow-sm'
                      : theme === 'chalkboard'
                        ? 'text-emerald-200/70 hover:text-white'
                        : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>{modeLabels[mode].icon}</span>
                  <span>{modeLabels[mode].label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Navigation & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Guide Button */}
            <button
              onClick={onOpenGuide}
              title="토론 예절 및 사용 안내"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                theme === 'chalkboard'
                  ? 'hover:bg-emerald-800/50 text-emerald-300'
                  : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'chalkboard' ? '파스텔 모드로 변경' : '칠판 다크 모드로 변경'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                theme === 'chalkboard'
                  ? 'bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 border border-emerald-700/50'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
              }`}
            >
              {theme === 'chalkboard' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User identity pill or Login buttons */}
            {currentUser.isLoggedIn ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                isTeacher
                  ? theme === 'chalkboard'
                    ? 'bg-purple-950/60 border-purple-700/60 text-purple-200'
                    : 'bg-purple-50 border-purple-200 text-purple-800'
                  : theme === 'chalkboard'
                    ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-100'
                    : 'bg-stone-100/80 border-stone-200 text-stone-800'
              }`}>
                <span className="text-lg leading-none" role="img" aria-label="avatar">
                  {currentUser.avatar}
                </span>
                <div className="text-left hidden xs:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold leading-tight truncate max-w-[110px] sm:max-w-[140px]">
                      {currentUser.anonymousName}
                    </span>
                    {isTeacher && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1 rounded font-bold">
                        교사
                      </span>
                    )}
                  </div>
                  {!isTeacher && currentUser.studentInfo && (
                    <span className="text-[10px] opacity-70 block">
                      {currentUser.studentInfo.grade}학년 {currentUser.studentInfo.classNum}반 {currentUser.studentInfo.studentNum}번 (무기명)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>🎒 학생 로그인</span>
              </button>
            )}

            {/* Teacher Control Panel Button or Teacher Login Switch */}
            {isTeacher ? (
              <button
                onClick={onOpenTeacherPanel}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  theme === 'chalkboard'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">교사 제어판</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  theme === 'chalkboard'
                    ? 'border-emerald-700/60 hover:bg-emerald-800/40 text-emerald-200'
                    : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{currentUser.isLoggedIn ? '학생/교사 전환' : '교사 로그인'}</span>
              </button>
            )}

            {/* Logout / Switch */}
            {currentUser.isLoggedIn && (
              <button
                onClick={logout}
                title="로그아웃"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  theme === 'chalkboard'
                    ? 'hover:bg-emerald-800/50 text-emerald-300'
                    : 'hover:bg-stone-100 text-stone-600'
                }`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
