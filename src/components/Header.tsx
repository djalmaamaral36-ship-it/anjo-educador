import React, { useState } from 'react';
import { PerfilUsuario } from '../types';
import {
  BookOpen, Users, ClipboardList, Calendar, Heart, ChevronDown, Sparkles,
  Moon, LogOut, Search, Mic, UserCheck, Shield, TreePine, Megaphone, Palette, Lock, Printer
} from 'lucide-react';

interface HeaderProps {
  tabAtiva: string;
  onSelectTab: (tab: string) => void;
  perfilAtual: PerfilUsuario;
  onSelectPerfil: (perfil: PerfilUsuario) => void;
  onAbrirModalSuporte?: () => void;
  turmaAtual: string;
  onSelectTurma: (turma: string) => void;
  buscaQuery?: string;
  onBuscaChange?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabAtiva,
  onSelectTab,
  perfilAtual,
  onSelectPerfil,
  onAbrirModalSuporte,
  turmaAtual,
  onSelectTurma,
  buscaQuery = '',
  onBuscaChange
}) => {
  const [menuMaisAberto, setMenuMaisAberto] = useState(false);

  const modulosExtra = [
    { id: 'coordenacao', label: 'Coordenação Pedagógica', icon: UserCheck },
    { id: 'direcao', label: 'Direção & Mantenedores', icon: Shield },
    { id: 'jornada', label: 'Jornada Primeira Infância', icon: TreePine },
    { id: 'mural', label: 'Mural de Avisos', icon: Megaphone },
    { id: 'brandbook', label: 'BrandBook da Marca', icon: Palette },
    { id: 'lgpd', label: 'LGPD & Segurança', icon: Lock },
    { id: 'relatorios', label: 'Relatórios & Exportação', icon: Printer }
  ];

  return (
    <header className="w-full shadow-md sticky top-0 z-40">
      {/* BANNER PRINCIPAL COM GRADIENTE (Image 1 Style) */}
      <div className="bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 text-white px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* LADO ESQUERDO: LOGO + NAVEGAÇÃO PRINCIPAL */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Logo do Anjinho Educador */}
            <div
              onClick={() => onSelectTab('diario')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white/80 group-hover:scale-105 transition">
                👼
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] text-teal-100 font-bold tracking-wider uppercase block leading-tight">
                  Onde a infância é
                </span>
                <span className="text-xs font-black text-white tracking-tight block leading-tight">
                  registrada para sempre
                </span>
              </div>
            </div>

            {/* TAB-BAR HORIZONTAL DAS ABAS (Image 1 Exact Layout) */}
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Diário Escolar (Tab Principal) */}
              <button
                onClick={() => onSelectTab('diario')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  tabAtiva === 'diario'
                    ? 'bg-white text-indigo-950 shadow-md'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <BookOpen className={`w-4 h-4 ${tabAtiva === 'diario' ? 'text-indigo-600' : 'text-white'}`} />
                <span>Diário Escolar</span>
              </button>

              {/* Turma & Alunos */}
              <button
                onClick={() => onSelectTab('turma')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                  tabAtiva === 'turma'
                    ? 'bg-white text-indigo-950 font-bold shadow-md'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Turma & Alunos</span>
              </button>

              {/* Diário de Rotina */}
              <button
                onClick={() => onSelectTab('rotina')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                  tabAtiva === 'rotina'
                    ? 'bg-white text-indigo-950 font-bold shadow-md'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Diário de Rotina</span>
              </button>

              {/* Agenda */}
              <button
                onClick={() => onSelectTab('agenda')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                  tabAtiva === 'agenda'
                    ? 'bg-white text-indigo-950 font-bold shadow-md'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Agenda</span>
              </button>

              {/* Famílias */}
              <button
                onClick={() => onSelectTab('familias')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                  tabAtiva === 'familias'
                    ? 'bg-white text-indigo-950 font-bold shadow-md'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Famílias</span>
              </button>

              {/* Botão Dropdown Mais */}
              <div className="relative">
                <button
                  onClick={() => setMenuMaisAberto(!menuMaisAberto)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition"
                >
                  <span>Mais</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {menuMaisAberto && (
                  <div className="absolute left-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                    {modulosExtra.map((mod) => {
                      const Icone = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => {
                            onSelectTab(mod.id);
                            setMenuMaisAberto(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-100 flex items-center gap-2.5 text-slate-700"
                        >
                          <Icone className="w-4 h-4 text-indigo-600" />
                          <span>{mod.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botão Anjinha Aura (Destacado em Rosa Gradient) */}
              <button
                onClick={() => onSelectTab('aura')}
                className="ml-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg border border-pink-300/30 transition transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Anjinha Aura</span>
              </button>
            </nav>
          </div>

          {/* LADO DIREITO: PERFIL DA PROFESSORA & CONTROLES */}
          <div className="flex items-center gap-3">
            {/* Dados da Professora */}
            <div className="hidden md:flex items-center gap-3 text-right">
              <div>
                <div className="text-xs font-black text-white leading-tight">
                  Ana Silva (Professora Titular)
                </div>
                <div className="text-[10px] text-indigo-200 font-bold tracking-wider uppercase leading-tight">
                  PROFESSOR BERÇÁRIO I - A
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
                  alt="Ana Silva"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <span className="w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full absolute bottom-0 right-0"></span>
              </div>
            </div>

            {/* Ícones Utilitários */}
            <div className="flex items-center gap-2 border-l border-white/20 pl-3">
              <button
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
                title="Modo Escuro"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={onAbrirModalSuporte}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
                title="Suporte Djalma Amaral"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-BARRA ESCURA (DARK NAVY - Image 1 Exact Sub-Header) */}
      <div className="bg-[#0c1327] text-white px-4 lg:px-8 py-2.5 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* LADO ESQUERDO: CRIANÇA/ALUNO EM EXIBIÇÃO */}
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1595454038955-4dfe8de81be8?auto=format&fit=crop&q=80&w=120&h=120"
              alt="Mariana Souza"
              className="w-8 h-8 rounded-full border border-indigo-400 object-cover"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-300 tracking-wider uppercase">
                CRIANÇA/ALUNO EM EXIBIÇÃO:
              </span>
              <span className="text-xs font-black text-white">
                Mariana Souza
              </span>
              <span className="bg-indigo-950 text-indigo-200 border border-indigo-700/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                12/10/2023
              </span>
            </div>
          </div>

          {/* LADO DIREITO: BUSCA RÁPIDA DE ALUNO */}
          <div className="relative w-full sm:w-auto">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-full px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-slate-300 w-full sm:w-96 shadow-inner focus-within:border-indigo-500">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={buscaQuery}
                  onChange={(e) => onBuscaChange && onBuscaChange(e.target.value)}
                  placeholder="Busca rápida: digite nome da criança, sala ou responsável..."
                  className="bg-transparent border-none text-white text-xs placeholder:text-slate-400 focus:outline-none w-full"
                />
              </div>
              <button className="w-6 h-6 rounded-full bg-indigo-600/60 text-indigo-200 flex items-center justify-center hover:bg-indigo-600 transition shrink-0">
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
