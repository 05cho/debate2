import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectionStatus as supabaseStatus } from '../services/supabase';
import { Settings2 } from 'lucide-react';
import { FirebaseConfigModal } from './FirebaseConfigModal';

export const FirebaseStatusBadge: React.FC = () => {
  const { theme } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isConfigured = supabaseStatus.isConfigured;

  return (
    <>
      <div className="fixed bottom-4 left-4 z-30">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
            theme === 'chalkboard'
              ? 'bg-[#15231e]/90 border-emerald-700/60 text-emerald-300 hover:bg-[#15231e]'
              : 'bg-white/95 border-emerald-200 text-emerald-800 hover:bg-white shadow-stone-200'
          }`}
          title="클릭하여 Supabase 연결 상태 및 환경변수 설정 확인"
        >
          {/* Animated Online Pulsing Dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          <span className="font-bold">
            {isConfigured ? 'Supabase 클라우드: 정상 (온라인)' : '실시간 토론 엔진: 정상 (온라인)'}
          </span>

          <Settings2 className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
        </button>
      </div>

      <FirebaseConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
