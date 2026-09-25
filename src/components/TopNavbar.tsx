import React from 'react';
import { 
  Menu, 
  Sparkles, 
  ChevronDown, 
  Search, 
  Mic, 
  Clock, 
  BookOpen, 
  Users, 
  Bell, 
  Pill, 
  Calendar, 
  Heart,
  KeyRound,
  LogOut
} from 'lucide-react';

interface TopNavbarProps {
  currentDate: string;
  currentTime: string;
  studentName: string;
  studentBirth: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReport: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentDate,
  currentTime,
  studentName,
  studentBirth,
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
  onOpenReport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#5B46EB] via-[#6355EE] to-[#7B42F6] text-white shadow-lg border-b border-indigo-900/20">
      {/* 1. Main Header Bar (Desktop Wide) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Menu Button + Brand Logo and Slogan */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold backdrop-blur-md transition-all active:scale-95 border border-white/20 shadow-xs cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-1">
              <span className="text-2xl">👼</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white drop-shadow-xs">
                Anjinho Escolar
              </h1>
              <p className="text-[11px] text-indigo-100 font-medium tracking-wide mt-0.5">
                Onde a infância é registrada para sempre
              </p>
            </div>
          </div>
        </div>

        {/* Right: Anjinha Aura + Teacher Avatar & PIN */}
        <div className="flex items-center gap-3">
          {/* Anjinha Aura Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 border border-amber-300 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
            <span>Anjinha Aura</span>
          </button>

          {/* Teacher Profile Dropdown Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm cursor-pointer transition-all">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces&q=80"
              alt="Ana Silva"
              className="w-8 h-8 rounded-full object-cover border border-white/40 shadow-xs"
            />
            <div className="text-left hidden sm:block leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white">
                  Ana Silva (Professora Titular)
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-200" />
              </div>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
                MASTER [DEV] BERÇÁRIO I - A
              </span>
            </div>
          </div>

          {/* PIN Button */}
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold transition-all active:scale-95 cursor-pointer text-indigo-100 hover:text-white"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PIN</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs (Diário Escolar, Turma, Avisos, etc.) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-1 border-t border-white/10 text-xs font-bold">
        {[
          { id: 'diario', label: 'Diário Escolar', icon: BookOpen },
          { id: 'turma', label: 'Turma & Alunos', icon: Users },
          { id: 'avisos', label: 'Mural de Avisos', icon: Bell },
          { id: 'medicamentos', label: 'Medicamentos', icon: Pill },
          { id: 'agenda', label: 'Agenda', icon: Calendar },
          { id: 'familias', label: 'Famílias', icon: Heart },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/25 text-white font-black shadow-xs border border-white/30'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Child Bar & Quick Search Subheader */}
      <div className="bg-[#1C164C] px-4 sm:px-6 lg:px-8 py-2.5 border-t border-indigo-950/60 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Child Indicator + Clock */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop&crop=faces&q=80"
                  alt="Mariana Souza"
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-400"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border border-[#1C164C] rounded-full"></span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300">
                    CRIANÇA/ALUNO EM EXIBIÇÃO:
                  </span>
                  <button className="text-[10px] text-amber-400 font-extrabold hover:underline">
                    TROCAR ▾
                  </button>
                </div>
                <div className="text-xs font-black text-white flex items-center gap-2">
                  <span>{studentName}</span>
                  <span className="text-[11px] font-normal text-indigo-300">{studentBirth}</span>
                </div>
              </div>
            </div>

            {/* Time badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#271F62] text-xs text-white border border-indigo-800/80">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-mono font-bold text-amber-300">{currentTime}</span>
              <span className="text-[11px] text-indigo-200 ml-1">{currentDate}</span>
            </div>

            {/* Trocar PIN button */}
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#271F62] hover:bg-[#342A7C] text-[11px] font-bold text-amber-300 border border-indigo-800/80 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Trocar PIN</span>
            </button>
          </div>

          {/* Right: Search Box */}
          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-indigo-300 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Busca rápida: digite nome da criança, sala ou responsável..."
              className="w-full bg-[#130E36] text-white placeholder-indigo-300/70 text-xs rounded-xl pl-9 pr-9 py-2 border border-indigo-800/60 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <button
              type="button"
              aria-label="Pesquisar por voz"
              className="absolute right-3 top-2.5 text-indigo-300 hover:text-white"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
