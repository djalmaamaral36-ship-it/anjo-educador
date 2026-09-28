import React, { useState, useEffect } from 'react';
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
  LogOut,
  X,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { 
  StudentHeroCard 
} from './components/StudentHeroCard';
import { 
  GovernanceSection 
} from './components/GovernanceSection';
import { 
  FeedingWaterSection 
} from './components/FeedingWaterSection';
import { 
  HealthHygieneMedicationSection 
} from './components/HealthHygieneMedicationSection';
import { 
  TimelineAuditSection 
} from './components/TimelineAuditSection';
import { 
  RoutineNoticesSection 
} from './components/RoutineNoticesSection';
import { 
  ConsolidatedDailySummary 
} from './components/ConsolidatedDailySummary';
import { 
  BottomFloatingBar 
} from './components/BottomFloatingBar';
import { 
  DailyReportModal 
} from './components/DailyReportModal';
import { 
  StudentProfile, 
  MealStatus, 
  MedicationItem, 
  TimelineEvent, 
  NoticeItem 
} from './types';
import { 
  subscribeToDailyState, 
  saveDailyState, 
  DailyStateFirebase 
} from './services/firebase';

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
  onOpenAura?: () => void;
  onOpenPinModal?: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  currentDate,
  currentTime,
  studentName,
  studentBirth,
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
  onOpenReport,
  onOpenAura,
  onOpenPinModal,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleOpenAura = () => {
    if (onOpenAura) onOpenAura();
    else setIsAuraOpen(true);
  };

  const handleOpenPin = () => {
    if (onOpenPinModal) onOpenPinModal();
    else setIsPinModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#5B46EB] via-[#6355EE] to-[#7B42F6] text-white shadow-lg border-b border-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAura}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 border border-amber-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
              <span>Anjinha Aura</span>
            </button>

            <div 
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm cursor-pointer transition-all"
            >
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

            <button
              type="button"
              onClick={handleOpenPin}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold transition-all active:scale-95 cursor-pointer text-indigo-100 hover:text-white"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PIN</span>
            </button>
          </div>
        </div>

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

        <div className="bg-[#1C164C] px-4 sm:px-6 lg:px-8 py-2.5 border-t border-indigo-950/60 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
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
                    <button 
                      onClick={handleOpenPin}
                      className="text-[10px] text-amber-400 font-extrabold hover:underline cursor-pointer"
                    >
                      TROCAR ▾
                    </button>
                  </div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>{studentName}</span>
                    <span className="text-[11px] font-normal text-indigo-300">{studentBirth}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#271F62] text-xs text-white border border-indigo-800/80">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-mono font-bold text-amber-300">{currentTime}</span>
                <span className="text-[11px] text-indigo-200 ml-1">{currentDate}</span>
              </div>

              <button
                type="button"
                onClick={handleOpenPin}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#271F62] hover:bg-[#342A7C] text-[11px] font-bold text-amber-300 border border-indigo-800/80 transition-all cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Trocar PIN</span>
              </button>
            </div>

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

      {/* DRAWER LATERAL DO MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-80 max-w-full bg-slate-900 text-white h-full shadow-2xl p-6 flex flex-col justify-between animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#5B46EB] flex items-center justify-center text-xl">
                    👼
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Anjinho Escolar</h3>
                    <p className="text-xs text-indigo-300 font-medium">Painel Administrativo & Pedagógico</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces&q=80"
                  alt="Ana Silva"
                  className="w-10 h-10 rounded-xl object-cover border border-indigo-400"
                />
                <div>
                  <div className="text-xs font-black text-white">Ana Silva</div>
                  <div className="text-[10px] text-indigo-300 font-semibold">Professora Titular • Berçário I - A</div>
                  <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Sessão Ativa
                  </div>
                </div>
              </div>

              <nav className="space-y-1.5 text-xs font-bold">
                {[
                  { label: 'Diário Escolar Completo', icon: BookOpen, action: () => { onSelectTab('diario'); setIsMenuOpen(false); } },
                  { label: 'Gerenciar Turmas & Alunos', icon: Users, action: () => { onSelectTab('turma'); setIsMenuOpen(false); } },
                  { label: 'Mural de Avisos & Circulares', icon: Bell, action: () => { onSelectTab('avisos'); setIsMenuOpen(false); } },
                  { label: 'Medicamentos & Prescrições', icon: Pill, action: () => { onSelectTab('medicamentos'); setIsMenuOpen(false); } },
                  { label: 'Agenda & Eventos Escolares', icon: Calendar, action: () => { onSelectTab('agenda'); setIsMenuOpen(false); } },
                  { label: 'Canal Direto com as Famílias', icon: Heart, action: () => { onSelectTab('familias'); setIsMenuOpen(false); } },
                  { label: 'Relatórios & Exportações PDF', icon: FileSpreadsheet, action: () => { onOpenReport(); setIsMenuOpen(false); } },
                  { label: 'Anjinha Aura (IA Pedagógica)', icon: Sparkles, action: () => { handleOpenAura(); setIsMenuOpen(false); } },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button 
                onClick={handleOpenPin}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-amber-300 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Validar PIN Legal</span>
                </span>
                <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded text-amber-300">#7842</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />
        </div>
      )}

      {/* MODAL ANJINHA AURA */}
      {isAuraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Anjinha Aura</h3>
                  <p className="text-xs text-amber-700 font-bold">Assistente Pedagógica Inteligente</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAuraOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-xs">
              <p className="font-bold text-amber-950 leading-relaxed">
                "Olá, Professora Ana! Verifiquei a rotina de hoje da Mariana Souza: ela já completou o lanchinho com ótima ingestão de frutas e bebeu 150ml de água. O próximo horário previsto para sono é às 12:30."
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Sugestões de Atividade BNCC:</h4>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                🎨 <strong>Exploração Sensorial das Cores da Primavera</strong> (BNCC EI01TS02) • Estimulação tátil com tintas naturais comestíveis.
              </div>
            </div>

            <button
              onClick={() => setIsAuraOpen(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs transition shadow-md cursor-pointer"
            >
              Compreendido, obrigada Aura!
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDAÇÃO DE PIN LEGAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 border border-slate-200 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5B46EB] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">PIN Legal do Aluno</h3>
                  <p className="text-[11px] text-slate-500">Autorização dos Responsáveis</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsPinModalOpen(false); setPinSuccess(false); setPinInput(''); }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-black text-emerald-900">PIN Validado com Sucesso!</div>
                <p className="text-[11px] text-emerald-700">Autorização registrada com validade jurídica.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Digite o PIN de 4 dígitos cadastrado pelos responsáveis para validar alterações restritas:
                </p>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Ex: 7842"
                  className="w-full text-center text-2xl font-black font-mono tracking-widest py-2 rounded-xl bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-[#5B46EB] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (pinInput === '7842' || pinInput.length === 4) {
                      setPinSuccess(true);
                      setTimeout(() => {
                        setIsPinModalOpen(false);
                        setPinSuccess(false);
                        setPinInput('');
                      }, 1500);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#5B46EB] hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Confirmar PIN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const INITIAL_STUDENT: StudentProfile = {
  id: 'mariana-souza',
  name: 'Mariana Souza',
  photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&h=240&fit=crop&crop=faces&q=80',
  isOnline: true,
  isVerified: true,
  schoolName: 'Colégio Pequeno Anjo',
  schoolSubtitle: 'Onde o amor e o aprendizado se encontram para sua jornada diária.',
  responsible: 'Clarice Souza (Mãe)',
  birthDate: '12/10/2023',
  ageFormatted: '11 meses',
  roomName: 'Maternal I & Berçário B',
  teacherName: 'Ana Silva',
  teacherRole: 'Professora Titular',
  teacherPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces&q=80',
  allergyNotice: 'Alergia: Leite Integral (Lactose) / Frutos do Mar',
  tags: [
    { id: '1', label: 'Adaptação Concluída', icon: 'footprints' },
    { id: '2', label: 'Estimulação Motora', icon: 'star' },
    { id: '3', label: 'Musicalização Ativa', icon: 'music' }
  ]
};

const INITIAL_MEALS: MealStatus[] = [
  { id: 'lanche-manha', name: 'Lanchinho da Manhã', status: 'ACEITOU TUDO', time: '09:00', icon: 'apple', observation: 'Banana amassadinha com aveia. Comeu com muito apetite!' },
  { id: 'almoco', name: 'Papinha / Almoço', status: 'ACEITOU BEM', time: '11:15', icon: 'utensils', observation: 'Purê de abóbora, cenoura cozida e franguinho desfiado.' },
  { id: 'lanche-tarde', name: 'Lanchinho da Tarde', status: 'SEM REGISTRO', time: '15:30', icon: 'sun', observation: 'Previsto para 15:30: Frutas da estação e biscoitinho de arroz.' },
  { id: 'jantar', name: 'Jantinha Escolar', status: 'SEM REGISTRO', time: '17:00', icon: 'bowl', observation: 'Previsto para 17:00: Caldinho de feijão e legumes.' }
];

const INITIAL_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med-1',
    name: 'Paracetamol 200mg/mL Gotas',
    dose: '12 gotas (6 em 6 horas se febre > 37.8°C)',
    instructions: 'Administrar somente se a temperatura axilar ultrapassar 37.8°C.',
    scheduleDescription: 'Uso conforme necessidade com aviso imediato aos pais.',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Mãe / Responsável Legal',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: 'Hoje às 11:30 (12 gotas por Tia Ana)',
    lastAdministeredBy: 'Ana Silva'
  },
  {
    id: 'med-2',
    name: 'Soro Fisiológico Nasal 0.9%',
    dose: '2 jatos em cada narina antes das sonecas',
    instructions: 'Higienização nasal para conforto respiratório.',
    scheduleDescription: 'Às 12:15 e antes da saída.',
    authorizedBy: 'Dr. Roberto Mendes (Pediatra)',
    authorizedRole: 'Pediatra CRM/SP 148920',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: 'Hoje às 12:15 (2 jatos aplicados)',
    lastAdministeredBy: 'Ana Silva'
  }
];

const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    time: '07:30',
    title: 'Acolhimento & Entrada no Berçário',
    description: 'Mariana chegou sorridente e tranquila com a mamãe Clarice. Sem queixas clínicas.',
    category: 'geral',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Presença Confirmada',
    badgeColor: 'emerald',
    icon: 'baby',
    verified: true
  },
  {
    id: 'evt-2',
    time: '08:45',
    title: 'Mamadeira APLV (Sem Lactose)',
    description: 'Ingeriu 180ml de fórmula hipoalergênica. Ótima sucção, sem regurgitação.',
    category: 'alimentacao',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: '180ml Consumidos',
    badgeColor: 'amber',
    icon: 'bottle',
    verified: true
  },
  {
    id: 'evt-3',
    time: '09:30',
    title: 'Atividade Sensorial & Musicalização',
    description: 'Interagiu com chocalhos e tapete tátil. Demonstrou alegria ao som das cantigas.',
    category: 'atividade',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'BNCC EI01TS01',
    badgeColor: 'purple',
    icon: 'sparkles',
    photoUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&auto=format&fit=crop&q=80',
    verified: true
  },
  {
    id: 'evt-4',
    time: '10:15',
    title: 'Troca de Fralda & Higiene',
    description: 'Troca realizada: Xixi abundante. Pomada preventiva aplicada conforme prescrição.',
    category: 'higiene',
    registeredBy: 'Carla Dias (Auxiliar)',
    badge: 'Higiene Concluída',
    badgeColor: 'teal',
    icon: 'droplets',
    verified: true
  },
  {
    id: 'evt-5',
    time: '11:15',
    title: 'Papinha / Almoço Nutritivo',
    description: 'Purê de abóbora, cenoura cozida e franguinho desfiado. Excelente aceitação.',
    category: 'alimentacao',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Aceitou Tudo',
    badgeColor: 'emerald',
    icon: 'utensils',
    verified: true
  },
  {
    id: 'evt-6',
    time: '12:00',
    title: 'Soneca Restauradora no Berço',
    description: 'Dorme tranquilamente no berço individual ao som de ruído branco suave.',
    category: 'sono',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Em Andamento',
    badgeColor: 'indigo',
    icon: 'moon',
    verified: true
  }
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'not-1',
    title: '🌸 Festa da Primavera e Piquenique no Pátio',
    content: 'Queridas famílias, na próxima sexta-feira teremos nosso piquenique da Primavera! Convidamos as crianças a virem com roupas confortáveis e estampadas.',
    author: 'Coordenação Pedagógica',
    role: 'escola',
    authorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces&q=80',
    date: '27/09/2026',
    time: '08:00',
    priority: 'normal',
    isRead: true,
    tags: ['Geral', 'Eventos']
  },
  {
    id: 'not-2',
    title: '🧴 Reposição de Fraldas & Pomada',
    content: 'Lembramos que o pacote de fraldas da Mariana tem previsão de término para a próxima semana. Favor enviar um pacote extra na mochila.',
    author: 'Ana Silva (Professora Titular)',
    role: 'escola',
    authorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces&q=80',
    date: '25/09/2026',
    time: '11:45',
    priority: 'importante',
    isRead: true,
    tags: ['Individual', 'Cuidados']
  },
  {
    id: 'not-3',
    title: '💬 Recado da Mãe: Noite Tranquila',
    content: 'Bom dia Tia Ana! Mariana dormiu muito bem esta noite e acordou bem disposta. Qualquer alteração na tosse me avise por favor.',
    author: 'Clarice Souza (Mãe)',
    role: 'familia',
    authorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&q=80',
    date: '27/09/2026',
    time: '07:25',
    priority: 'normal',
    isRead: true,
    tags: ['Família', 'Recado']
  }
];

export function App() {
  // Perfil e Navegação
  const [currentRole, setCurrentRole] = useState<string>('professor');
  const [activeTab, setActiveTab] = useState<string>('diario');
  const [activeQuickNav, setActiveQuickNav] = useState<string>('feeding');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Dados do Aluno & Estados
  const [student] = useState<StudentProfile>(INITIAL_STUDENT);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);

  // Estados Dinâmicos Sincronizados com Firebase
  const [waterMl, setWaterMl] = useState<number>(150);
  const [bottleVolume, setBottleVolume] = useState<number>(180);
  const [bottleDone, setBottleDone] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(18240); // 05h 04m
  const [mood, setMood] = useState<'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso'>('Calmo / Sereno');
  const [temperature, setTemperature] = useState<number>(36.5);
  const [napStatus, setNapStatus] = useState<string>('Dormindo no Berço');
  const [napStartTime, setNapStartTime] = useState<string>('12:00');
  const [weightKg, setWeightKg] = useState<number>(9.2);
  const [diaperCount, setDiaperCount] = useState<number>(3);
  const [diaperStatus, setDiaperStatus] = useState<string>('Xixi + Pomada');
  const [hygieneChecks, setHygieneChecks] = useState<Record<string, boolean>>({
    clothesChanged: true,
    teethBrushed: true,
    handsFaceWashed: true,
    bathGiven: false,
    sunscreenCream: true,
  });

  // Relógio Topo
  const [currentTime, setCurrentTime] = useState('08:00');
  const [currentDate, setCurrentDate] = useState('27/09/2026');

  // Relógio do Sistema
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cronômetro Sincronizado em Tempo Real (Celular + Web)
  useEffect(() => {
    let interval: any = null;
    if (!isPaused) {
      if (startTimestamp) {
        const updateTimer = () => {
          const calculated = Math.floor((Date.now() - startTimestamp) / 1000);
          setElapsedSeconds(Math.max(0, calculated));
        };
        updateTimer();
        interval = setInterval(updateTimer, 1000);
      } else {
        interval = setInterval(() => {
          setElapsedSeconds(prev => prev + 1);
        }, 1000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, startTimestamp]);

  // Sincronização em Tempo Real com Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDailyState(student.id, (state: DailyStateFirebase) => {
      if (state.waterMl !== undefined) setWaterMl(state.waterMl);
      if (state.bottleDone !== undefined) setBottleDone(state.bottleDone);
      if (state.bottleVolume !== undefined) setBottleVolume(state.bottleVolume);
      
      if (state.isTimerRunning !== undefined) {
        setIsPaused(!state.isTimerRunning);
      }

      if (state.startTimestamp !== undefined) {
        setStartTimestamp(state.startTimestamp);
        if (state.isTimerRunning && state.startTimestamp) {
          const calculated = Math.floor((Date.now() - state.startTimestamp) / 1000);
          setElapsedSeconds(Math.max(0, calculated));
        } else if (state.elapsedSeconds !== undefined) {
          setElapsedSeconds(state.elapsedSeconds);
        }
      } else if (state.elapsedSeconds !== undefined) {
        setElapsedSeconds(state.elapsedSeconds);
      }

      if (state.temperature !== undefined) {
        const parsed = parseFloat(state.temperature);
        if (!isNaN(parsed)) setTemperature(parsed);
      }
      if (state.mood !== undefined) setMood(state.mood as any);
      if (state.sleepStatus !== undefined) setNapStatus(state.sleepStatus);
      if (state.diaperStatus !== undefined) setDiaperStatus(state.diaperStatus);
      if (state.timelineEvents && Array.isArray(state.timelineEvents) && state.timelineEvents.length > 0) {
        setTimelineEvents(state.timelineEvents);
      }
      if (state.notices && Array.isArray(state.notices) && state.notices.length > 0) {
        setNotices(state.notices);
      }
      if (state.meals && Array.isArray(state.meals) && state.meals.length > 0) {
        setMeals(state.meals);
      }
      if (state.medications && Array.isArray(state.medications) && state.medications.length > 0) {
        setMedications(state.medications);
      }
    });

    return () => unsubscribe();
  }, [student.id]);

  // Handlers de Ações
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    if (nextPaused) {
      // Pausando: calcula o tempo decorrido final e zera startTimestamp
      const finalElapsed = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : elapsedSeconds;
      setElapsedSeconds(finalElapsed);
      setStartTimestamp(null);
      saveDailyState(student.id, { 
        isTimerRunning: false, 
        startTimestamp: null, 
        elapsedSeconds: finalElapsed 
      });
    } else {
      // Retomando: calcula startTimestamp exato para sincronia perfeita em todos os aparelhos
      const newStart = Date.now() - (elapsedSeconds * 1000);
      setStartTimestamp(newStart);
      saveDailyState(student.id, { 
        isTimerRunning: true, 
        startTimestamp: newStart, 
        elapsedSeconds: elapsedSeconds 
      });
    }
  };

  const handleBlockedAction = () => {
    alert('Inicie o cronômetro para poder registrar ações pedagógicas e de rotina.');
  };

  const handleAddWater = (amount: number) => {
    const newAmount = Math.max(0, Math.min(1000, waterMl + amount));
    setWaterMl(newAmount);

    const newEvt: TimelineEvent = {
      id: `water-${Date.now()}`,
      time: currentTime,
      title: `Hidratação Registrada (+${amount > 0 ? amount : amount}ml)`,
      description: `Mariana bebeu água fresca na jarrinha escolar. Total acumulado no dia: ${newAmount}ml.`,
      category: 'alimentacao',
      registeredBy: 'Ana Silva (Professora Titular)',
      badge: `${newAmount}ml no Dia`,
      badgeColor: 'teal',
      icon: 'droplets',
      verified: true
    };
    const updatedEvents = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedEvents);
    saveDailyState(student.id, { waterMl: newAmount, timelineEvents: updatedEvents });
  };

  const handleToggleBottle = () => {
    const next = !bottleDone;
    setBottleDone(next);

    if (next) {
      const newEvt: TimelineEvent = {
        id: `bottle-${Date.now()}`,
        time: currentTime,
        title: `Mamadeira APLV Concluída (${bottleVolume}ml)`,
        description: `Fórmula sem lactose ingerida com sucesso por Mariana.`,
        category: 'alimentacao',
        registeredBy: 'Ana Silva (Professora Titular)',
        badge: 'Nutrição Concluída',
        badgeColor: 'emerald',
        icon: 'bottle',
        verified: true
      };
      const updatedEvents = [newEvt, ...timelineEvents];
      setTimelineEvents(updatedEvents);
      saveDailyState(student.id, { bottleDone: next, timelineEvents: updatedEvents });
    } else {
      saveDailyState(student.id, { bottleDone: next });
    }
  };

  const handleSelectBottleVolume = (vol: number) => {
    setBottleVolume(vol);
    saveDailyState(student.id, { bottleVolume: vol });
  };

  const handleUpdateMeal = (mealId: string, status: MealStatus['status']) => {
    const updatedMeals = meals.map(m => m.id === mealId ? { ...m, status } : m);
    setMeals(updatedMeals);
    const mealName = meals.find(m => m.id === mealId)?.name || 'Refeição';
    const newEvt: TimelineEvent = {
      id: `meal-${Date.now()}`,
      time: currentTime,
      title: `${mealName}: ${status}`,
      description: `Registro alimentar de ${student.name} atualizado pela educadora responsável.`,
      category: 'alimentacao',
      registeredBy: 'Ana Silva (Professora Titular)',
      badge: status,
      badgeColor: status === 'ACEITOU TUDO' ? 'emerald' : status === 'PARCIAL' ? 'amber' : 'rose',
      icon: 'utensils',
      verified: true
    };
    const updatedEvents = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedEvents);
    saveDailyState(student.id, { meals: updatedMeals, timelineEvents: updatedEvents });
  };

  const handleSetMood = (m: 'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso') => {
    setMood(m);
    saveDailyState(student.id, { mood: m });
  };

  const handleSetTemperature = (t: number) => {
    setTemperature(t);
    saveDailyState(student.id, { temperature: t.toString() });
  };

  const handleSetNap = (status: string, startTime?: string) => {
    setNapStatus(status);
    if (startTime) setNapStartTime(startTime);
    saveDailyState(student.id, { sleepStatus: status });
  };

  const handleSetWeight = (w: number) => {
    setWeightKg(w);
  };

  const handleSetDiaper = (tipo: string) => {
    setDiaperStatus(tipo);
    setDiaperCount(prev => prev + 1);

    const newEvt: TimelineEvent = {
      id: `diaper-${Date.now()}`,
      time: currentTime,
      title: `Troca de Fralda (${tipo})`,
      description: `Troca realizada no fraldário. Higienização completa e pomada aplicada.`,
      category: 'higiene',
      registeredBy: 'Ana Silva (Professora Titular)',
      badge: tipo,
      badgeColor: 'teal',
      icon: 'droplets',
      verified: true
    };
    const updatedEvents = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedEvents);
    saveDailyState(student.id, { diaperStatus: tipo, timelineEvents: updatedEvents });
  };

  const handleToggleHygiene = (key: string) => {
    setHygieneChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdministerMedication = (medId: string, notes?: string) => {
    const updatedMeds = medications.map(m => {
      if (m.id === medId) {
        return {
          ...m,
          status: 'active' as const,
          lastAdministeredAt: `Hoje às ${currentTime} (${m.dose})`,
          lastAdministeredBy: 'Ana Silva'
        };
      }
      return m;
    });
    setMedications(updatedMeds);

    const medName = medications.find(m => m.id === medId)?.name || 'Medicamento';
    const newEvt: TimelineEvent = {
      id: `med-${Date.now()}`,
      time: currentTime,
      title: `Medicamento Ministrado: ${medName}`,
      description: notes || `Administrado com validação de PIN de segurança e prescrição médica.`,
      category: 'medicamento',
      registeredBy: 'Ana Silva (Professora Titular)',
      badge: 'PIN #7842 Validado',
      badgeColor: 'purple',
      icon: 'pill',
      verified: true
    };
    const updatedEvents = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedEvents);
    saveDailyState(student.id, { medications: updatedMeds, timelineEvents: updatedEvents });
  };

  const handleAddEvent = (evt: Omit<TimelineEvent, 'id'>) => {
    const newEvt: TimelineEvent = {
      ...evt,
      id: `evt-${Date.now()}`
    };
    const updatedEvents = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedEvents);
    saveDailyState(student.id, { timelineEvents: updatedEvents });
  };

  const handleAddNotice = (notice: Omit<NoticeItem, 'id'>) => {
    const newNot: NoticeItem = {
      ...notice,
      id: `not-${Date.now()}`
    };
    const updatedNotices = [newNot, ...notices];
    setNotices(updatedNotices);
    saveDailyState(student.id, { notices: updatedNotices });
  };

  const handleSelectQuickNav = (id: string) => {
    setActiveQuickNav(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 font-sans pb-32 antialiased selection:bg-[#5B46EB] selection:text-white">
      
      {/* 1. Top Navbar Oficial com Perfil, Busca, Relógio e Tabs */}
      <TopNavbar
        currentDate={currentDate}
        currentTime={currentTime}
        studentName={student.name}
        studentBirth={`${student.birthDate} (${student.ageFormatted})`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* 2. Container Principal */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Card Principal do Aluno (Hero) com Banner PAX 🕊️ e "IR PARA:" */}
        <StudentHeroCard
          student={student}
          activeQuickNav={activeQuickNav}
          onSelectQuickNav={handleSelectQuickNav}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* Seção de Governança & Cronômetro Oficial */}
        <GovernanceSection
          student={student}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          elapsedSeconds={elapsedSeconds}
        />

        {/* Alimentação, Mamadeira e Jarrinha de Água */}
        <FeedingWaterSection
          studentName={student.name}
          meals={meals}
          onUpdateMeal={handleUpdateMeal}
          isPaused={isPaused}
          onBlockedAction={handleBlockedAction}
          currentRole={currentRole as any}
          waterMl={waterMl}
          onAddWater={handleAddWater}
          bottleVolume={bottleVolume}
          bottleDone={bottleDone}
          onToggleBottle={handleToggleBottle}
          onSelectBottleVolume={handleSelectBottleVolume}
        />

        {/* Saúde, Soneca, Fraldas com Voz e Medicamentos com PIN */}
        <HealthHygieneMedicationSection
          studentName={student.name}
          medications={medications}
          onAdministerMedication={handleAdministerMedication}
          isPaused={isPaused}
          onBlockedAction={handleBlockedAction}
          currentRole={currentRole as any}
          mood={mood}
          onSetMood={handleSetMood}
          temperature={temperature}
          onSetTemperature={handleSetTemperature}
          napStatus={napStatus}
          napStartTime={napStartTime}
          onSetNap={handleSetNap}
          weightKg={weightKg}
          onSetWeight={handleSetWeight}
          diaperCount={diaperCount}
          diaperStatus={diaperStatus}
          onSetDiaper={handleSetDiaper}
          hygieneChecks={hygieneChecks}
          onToggleHygiene={handleToggleHygiene}
        />

        {/* Linha do Tempo e Auditoria de Saúde & Atividades */}
        <TimelineAuditSection
          student={student}
          events={timelineEvents}
          onAddEvent={handleAddEvent}
          currentRole={currentRole}
          isPaused={isPaused}
          onBlockedAction={handleBlockedAction}
        />

        {/* Diários de Rotina Recebidos & Mural de Avisos */}
        <RoutineNoticesSection
          student={student}
          notices={notices}
          onAddNotice={handleAddNotice}
          currentRole={currentRole}
        />

        {/* Diário Consolidado do Dia (Síntese & WhatsApp) */}
        <ConsolidatedDailySummary
          student={student}
          meals={meals}
          medications={medications}
          timelineEvents={timelineEvents}
          elapsedSeconds={elapsedSeconds}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

      </main>

      {/* Barra Flutuante Inferior com Alternador de Perfil */}
      <BottomFloatingBar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        student={student}
        onScrollToTop={scrollToTop}
      />

      {/* Modal Oficial de Boletim & Relatório Diário */}
      <DailyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        student={student}
        meals={meals}
        medications={medications}
        timelineEvents={timelineEvents}
        elapsedSeconds={elapsedSeconds}
      />

    </div>
  );
}

export default App;
