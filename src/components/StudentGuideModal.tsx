import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, HeartHandshake, Eye, Sparkles, AlertCircle } from 'lucide-react';

interface StudentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentGuideModal: React.FC<StudentGuideModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border transition-all ${
          theme === 'chalkboard'
            ? 'bg-[#182a24] border-emerald-700/60 text-emerald-50'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h2 className="text-base font-bold">우리들의 생각 공장 - 무기명 토론 예절</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3.5 text-xs sm:text-sm leading-relaxed">
          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">안전한 무기명 토론</strong>
              <p className="opacity-80">
                친구들에게는 지혜로운 사자, 따뜻한 돌고래 등 동물 닉네임으로 표시되어 눈치 보지 않고 자유롭게 나의 생각을 표현할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 flex items-start gap-3">
            <Eye className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">책임감 있는 참여 (교사 실명 확인 권한)</strong>
              <p className="opacity-80">
                비방, 비속어, 특정 친구를 향한 공격 등 부적절한 글은 담당 선생님께서 실명을 확인하고 제재할 수 있으므로 항상 따뜻하고 올바른 언어를 사용합니다.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">사람이 아닌 의견에 집중하기</strong>
              <p className="opacity-80">
                나와 다른 생각도 소중한 배움의 기회입니다. 상대방의 의견을 꼼꼼히 읽고, 타당한 근거를 들어 반론하거나 배울 점을 찾아보세요.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer shadow-xs"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};
