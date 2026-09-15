import React from 'react';
import { Heart, Calendar, Users, HelpCircle, Phone, Mail, BookOpen, MessageSquareHeart } from 'lucide-react';
import { CONTATO_SUPORTE } from '../data/mockData';

interface HeaderProps {
  turmaAtual: string;
  setTurmaAtual: (turma: string) => void;
  tabAtiva: 'diario' | 'recadinho' | 'mural' | 'guia';
  setTabAtiva: (tab: 'diario' | 'recadinho' | 'mural' | 'guia') => void;
  onAbrirSuporte: () => void;
  onAbrirGuia: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  turmaAtual,
  setTurmaAtual,
  tabAtiva,
  setTabAtiva,
  onAbrirSuporte,
  onAbrirGuia
}) => {
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Utility Bar */}
      <div className="bg-emerald-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300 animate-pulse" />
            <span>Anjinho Educador — Transformando o Diário Escolar com Carinho e Afeto</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-100">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-300" />
              {CONTATO_SUPORTE.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-300" />
              {CONTATO_SUPORTE.telefone}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Heart className="w-6 h-6 fill-white stroke-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Anjinho Educador</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">Pro</span>
              </div>
              <p className="text-xs text-slate-500 capitalize">{dataHoje}</p>
            </div>
          </div>

          {/* Turma Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200">
              <Users className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={turmaAtual}
                onChange={(e) => setTurmaAtual(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none pr-2 cursor-pointer"
              >
                <option value="Berçário II - Manhã">Berçário II - Manhã</option>
                <option value="Maternal I">Maternal I</option>
                <option value="Jardim II">Jardim II</option>
              </select>
            </div>

            <button
              onClick={onAbrirGuia}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition"
              title="Como a educadora insere o recadinho no diário"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Como Inserir Recadinho?</span>
            </button>

            <button
              onClick={onAbrirSuporte}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Suporte</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 border-t border-slate-100 pt-3">
          <button
            onClick={() => setTabAtiva('diario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tabAtiva === 'diario'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Diário de Aula</span>
          </button>

          <button
            onClick={() => setTabAtiva('recadinho')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tabAtiva === 'recadinho'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Recadinho da Educadora</span>
          </button>

          <button
            onClick={() => setTabAtiva('mural')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tabAtiva === 'mural'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mural & Avisos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
