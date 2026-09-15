import React from 'react';
import { PerfilUsuario } from '../../types';
import { UserCheck, Shield, Heart, Smartphone, RefreshCw } from 'lucide-react';

interface FloatingRoleSwitcherProps {
  perfilAtual: PerfilUsuario;
  onSelectPerfil: (perfil: PerfilUsuario) => void;
}

export const FloatingRoleSwitcher: React.FC<FloatingRoleSwitcherProps> = ({ perfilAtual, onSelectPerfil }) => {
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2">
      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-2 hidden sm:inline-block">
        Perfil Ativo:
      </span>

      <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
        <button
          onClick={() => onSelectPerfil('educadora')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            perfilAtual === 'educadora' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
          }`}
          title="Visão da Professora/Educadora"
        >
          <Heart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Educadora</span>
        </button>

        <button
          onClick={() => onSelectPerfil('coordenacao')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            perfilAtual === 'coordenacao' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
          }`}
          title="Visão da Coordenação Pedagógica"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Coordenação</span>
        </button>

        <button
          onClick={() => onSelectPerfil('direcao')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            perfilAtual === 'direcao' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
          }`}
          title="Visão da Direção / Mantenedora"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Direção</span>
        </button>

        <button
          onClick={() => onSelectPerfil('familia')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            perfilAtual === 'familia' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
          }`}
          title="Visão do Pai / Mãe"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pais/Família</span>
        </button>
      </div>
    </div>
  );
};
