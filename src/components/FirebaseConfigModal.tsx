import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectionStatus as supabaseStatus, getStoredSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase';
import { connectionStatus as firebaseStatus } from '../services/firebase';
import { X, Database, Check, AlertCircle, Copy, ExternalLink, Sparkles, Terminal } from 'lucide-react';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<BackendConfigModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useAuth();
  const currentSupabase = getStoredSupabaseConfig();

  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase?.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentSupabase?.supabaseAnonKey || '');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return;

    saveSupabaseConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
  };

  const handleClear = () => {
    clearSupabaseConfig();
  };

  const envSample = `# Vercel 및 .env.local 환경변수 설정 (Supabase)
VITE_SUPABASE_URL="${supabaseUrl || 'https://xyzcompany.supabase.co'}"
VITE_SUPABASE_ANON_KEY="${supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}"`;

  const sqlSample = `-- Supabase SQL Editor에 복사하여 붙여넣고 [Run]을 누르세요.
CREATE TABLE IF NOT EXISTS public.discussions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'pro_con',
  current_stage INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_submissions BOOLEAN NOT NULL DEFAULT true,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL DEFAULT 'current-topic',
  mode TEXT NOT NULL,
  author_id TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  stance TEXT,
  color TEXT,
  stage INTEGER,
  reply_to_post_id TEXT,
  reply_to_summary TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by JSONB NOT NULL DEFAULT '[]'::JSONB,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_blinded BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  student_info JSONB,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  student_info JSONB,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on discussions" ON public.discussions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions, public.posts, public.comments;`;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const copySqlSnippet = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const isConnected = supabaseStatus.isConfigured || firebaseStatus.isConfigured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border transition-all ${
          theme === 'chalkboard'
            ? 'bg-[#182a24] border-emerald-700/60 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Supabase 클라우드 실시간 데이터베이스 연결</h2>
              <p className="text-xs opacity-75">무제한 프로젝트 & 빠른 2개 키 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Box */}
        <div className={`my-4 p-3.5 rounded-xl border flex items-center justify-between ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="font-bold block">
                {supabaseStatus.isConfigured
                  ? 'Supabase 클라우드 실시간 리스너 작동 중'
                  : '실시간 리스너 동기화 엔진 활성화 (온라인)'}
              </span>
              <span className="opacity-75 text-[11px]">
                {supabaseStatus.isConfigured
                  ? `연결된 URL: ${currentSupabase?.supabaseUrl}`
                  : '다중 탭/학생 간 실시간 토론이 정상 작동 중입니다.'}
              </span>
            </div>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold">
            정상 (온라인)
          </span>
        </div>

        {/* Supabase Config Form */}
        <form onSubmit={handleSaveSupabase} className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold opacity-80">
                1. Project URL (supabaseUrl) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] opacity-60">Supabase 콘솔 &gt; Project Settings &gt; API</span>
            </div>
            <input
              type="text"
              placeholder="예: https://abcdefghijklm.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold opacity-80">
                2. Project API Key (anon/public) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] opacity-60">anon / public 키</span>
            </div>
            <input
              type="password"
              placeholder="예: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {currentSupabase && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-500 hover:underline cursor-pointer"
              >
                설정 삭제
              </button>
            )}
            <button
              type="submit"
              className="ml-auto px-4 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-xs"
            >
              Supabase 연결 저장하기
            </button>
          </div>
        </form>

        {/* SQL Script Quick Copy */}
        <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold opacity-90 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase SQL 테이블 생성 스크립트</span>
            </span>
            <button
              onClick={copySqlSnippet}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1 cursor-pointer font-bold shadow-xs"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedSql ? '복사 완료! ✓' : 'SQL 복사하기'}</span>
            </button>
          </div>
          <p className="text-[11px] opacity-75 mb-2">
            * Supabase 콘솔 좌측 <strong>SQL Editor</strong>에 붙여넣고 <strong>[Run]</strong>을 누르면 테이블 3개가 즉시 생성됩니다.
          </p>
        </div>

        {/* Vercel & .env.local Guide */}
        <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold opacity-90 flex items-center gap-1">
              <span>📄 Vercel 환경변수 (Environment Variables)</span>
            </span>
            <button
              onClick={copyEnvSnippet}
              className="text-[11px] px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedEnv ? '복사됨!' : 'env 복사'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 text-[11px] font-mono overflow-x-auto leading-relaxed">
            {envSample}
          </pre>
        </div>

      </div>
    </div>
  );
};
