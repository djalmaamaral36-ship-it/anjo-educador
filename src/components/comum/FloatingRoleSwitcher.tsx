import React, { useState } from 'react';
import { UserCheck, Heart, Crown, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  userRole: 'professor' | 'familia';
  activeTab: string;
  onSelectRole: (role: 'professor' | 'familia') => void;
  onSelectDirecao: () => void;
}

export default function FloatingRoleSwitcher({
  userRole,
  activeTab,
  onSelectRole,
  onSelectDirecao,
}: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  const isDirecaoActive = activeTab === 'direcao';
  const isProfessorActive = userRole === 'professor' && !isDirecaoActive;
  const isFamiliaActive = userRole === 'familia' && !isDirecaoActive;

  return (
    <div className="fixed bottom-6 left-6 z-40 animate-fadeIn">
      {/* Container Principal Flutuante */}
      <div className="bg-slate-900/90 backdrop-blur-md text-white p-2 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-1.5 transition-all">
        {/* Label ou ícone de destaque */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase text-amber-400 tracking-wider">
          <Sparkles size={14} className="animate-spin-slow" />
          <span>Perfil:</span>
        </div>

        {!isMinimized ? (
          <div className="flex items-center gap-1.5">
            {/* Botão Professor */}
            <button
              onClick={() => onSelectRole('professor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                isProfessorActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md ring-2 ring-indigo-400/50 scale-105'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>👩‍🏫</span>
              <span>Professor</span>
              {isProfessorActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* Botão Pais / Família */}
            <button
              onClick={() => onSelectRole('familia')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                isFamiliaActive
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md ring-2 ring-rose-400/50 scale-105'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>👨‍👩‍👧</span>
              <span>Pais / Família</span>
              {isFamiliaActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* Botão Diretora */}
            <button
              onClick={onSelectDirecao}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                isDirecaoActive
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-md ring-2 ring-amber-300 scale-105'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Crown size={14} className={isDirecaoActive ? 'text-amber-950' : 'text-amber-400'} />
              <span>Diretora</span>
              {isDirecaoActive && (
                <span className="w-2 h-2 rounded-full bg-amber-950 animate-ping" />
              )}
            </button>
          </div>
        ) : (
          <div className="px-2 text-xs font-bold text-amber-300 flex items-center gap-2">
            <span>
              {isDirecaoActive ? '👑 Diretora' : isFamiliaActive ? '👨‍👩‍👧 Pais' : '👩‍🏫 Professor'}
            </span>
          </div>
        )}

        {/* Botão para minimizar/expandir */}
        <button
          onClick={() => setIsMinimized((prev) => !prev)}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          title={isMinimized ? 'Expandir Perfis' : 'Minimizar Bar'}
        >
          {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
