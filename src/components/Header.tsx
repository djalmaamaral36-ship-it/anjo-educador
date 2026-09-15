import React from 'react';
import { PerfilUsuario } from '../types';
import { Heart, Sparkles, UserCheck, Shield, Smartphone, Megaphone, TreePine, Palette, Lock, Printer, Calendar, Headphones } from 'lucide-react';

interface HeaderProps {
  tabAtiva: string;
  onSelectTab: (tab: string) => void;
  perfilAtual: PerfilUsuario;
  onSelectPerfil: (perfil: PerfilUsuario) => void;
  onAbrirModalSuporte: () => void;
  turmaAtual: string;
  onSelectTurma: (turma: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabAtiva,
  onSelectTab,
  perfilAtual,
  onSelectPerfil,
  onAbrirModalSuporte,
  turmaAtual,
  onSelectTurma
}) => {
  const tabs = [
    { id: 'diario', label: 'Diário de Aula & Recado', icon: Heart, badge: null },
    { id: 'aura', label: 'Anjinha Aura (IA)', icon: Sparkles, badge: 'IA' },
    { id: 'coordenacao', label: 'Coordenação', icon: UserCheck, badge: null },
    { id: 'direcao', label: 'Direção Escolar', icon: Shield, badge: null },
    { id: 'familias', label: 'Visão dos Pais', icon: Smartphone, badge: null },
    { id: 'jornada', label: 'Jornada Infantíl', icon: TreePine, badge: null },
    { id: 'mural', label: 'Mural de Avisos', icon: Megaphone, badge: null },
    { id: 'brandbook', label: 'BrandBook', icon: Palette, badge: null },
    { id: 'lgpd', label: 'LGPD Escolar', icon: Lock, badge: null },
    { id: 'relatorios', label: 'Relatórios PDF', icon: Printer, badge: null },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Topo Institucional */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Marca Anjinho Educador + Mascote */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white">
            👼
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900">Anjinho Educador</h1>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Sistema Completo
              </span>
            </div>
            <p className="text-xs text-slate-500">Educação Infantil & Acompanhamento Pedagógico Afetivo</p>
          </div>
        </div>

        {/* Controles do Topo (Seletor de Turma & Suporte) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="text-slate-500 pl-2 text-[11px]">Turma:</span>
            <select
              value={turmaAtual}
              onChange={(e) => onSelectTurma(e.target.value)}
              className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Berçário II - Manhã">Berçário II - Manhã</option>
              <option value="Maternal I - Tarde">Maternal I - Tarde</option>
              <option value="Jardim I - Integral">Jardim I - Integral</option>
            </select>
          </div>

          <button
            onClick={onAbrirModalSuporte}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
          >
            <Headphones className="w-4 h-4" />
            <span className="hidden sm:inline">Suporte & Ajuda</span>
          </button>
        </div>
      </div>

      {/* Barra de Abas / Menu do Sistema */}
      <div className="bg-slate-50/80 border-t border-slate-200 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icone = tab.icon;
            const isAtiva = tabAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  isAtiva
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icone className={`w-4 h-4 ${isAtiva ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                    isAtiva ? 'bg-amber-300 text-slate-900' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
