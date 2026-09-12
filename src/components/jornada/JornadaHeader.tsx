import React from 'react';
import { ChildProfile } from '../../types';
import { Plus, BookOpen, Sparkles, X } from 'lucide-react';

interface Props {
  child: ChildProfile;
  activeView: 'arvore' | 'floresta';
  onToggleView: (view: 'arvore' | 'floresta') => void;
  onOpenNewMoment: () => void;
  onOpenAlbum: () => void;
  onOpenMetodo?: () => void;
  isFormOpen?: boolean;
}

export default function JornadaHeader({
  child,
  activeView,
  onToggleView,
  onOpenNewMoment,
  onOpenAlbum,
  onOpenMetodo,
  isFormOpen,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Ecosystem Switcher Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            O Ecossistema de Cultivo Pedagógico
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe a evolução de cada semente ou contemple a harmonia coletiva da nossa escola.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onToggleView('arvore')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeView === 'arvore'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            🌱 Árvore de {child.nome.split(' ')[0]}
          </button>
          <button
            onClick={() => onToggleView('floresta')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeView === 'floresta'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            🌳 A Floresta do Saber
            <span
              onClick={(e) => {
                if (onOpenMetodo) {
                  e.stopPropagation();
                  onOpenMetodo();
                }
              }}
              className="text-[10px] bg-amber-400 hover:bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded font-black cursor-pointer transition"
              title="Entenda o Método Árvore da Inf"
            >
              MÉTODO
            </span>
          </button>
        </div>
      </div>

      {/* Main Purple Gradient Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 p-1 backdrop-blur border border-white/30 flex-shrink-0 relative">
            <img
              src={child.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
              alt={child.nome}
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-xs shadow font-black">
              ⭐
            </div>
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-3 py-1 rounded-full inline-block mb-1.5 shadow-sm">
              EXCLUSIVO JORNADA DO ANJINHO
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{child.nome}</h1>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium">
              Sala: {child.sala}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto z-10">
          <button
            onClick={onOpenNewMoment}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
              isFormOpen
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
            }`}
          >
            {isFormOpen ? (
              <>
                <X size={18} strokeWidth={3} />
                <span>Fechar Formulário</span>
              </>
            ) : (
              <>
                <Plus size={18} strokeWidth={3} />
                <span>Registrar Nova Lembrança</span>
              </>
            )}
          </button>
          <button
            onClick={onOpenAlbum}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-white/95 hover:bg-white text-slate-800 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <BookOpen size={18} />
            O Álbum da Primeira Inf
          </button>
        </div>

        {/* Subtle decorative background circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute left-1/2 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      </div>
    </div>
  );
}
