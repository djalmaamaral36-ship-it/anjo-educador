import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  ChevronDown, 
  Search, 
  Clock, 
  BookOpen, 
  Users, 
  Bell, 
  Pill, 
  Calendar, 
  Heart,
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Baby, 
  Utensils, 
  Moon, 
  Droplets, 
  ShieldCheck,
  Building2,
  Play,
  Pause,
  Check,
  X,
  Cloud
} from 'lucide-react';
import { subscribeToDailyState, saveDailyState, DailyStateFirebase } from './services/firebase';

export interface StudentProfile {
  id: string;
  name: string;
  photoUrl: string;
  isOnline: boolean;
  isVerified: boolean;
  schoolName: string;
  schoolSubtitle: string;
  responsible: string;
  birthDate: string;
  ageFormatted: string;
  roomName: string;
  teacherName: string;
  teacherRole: string;
  teacherPhoto: string;
  allergyNotice: string;
}

export interface MealStatus {
  id: string;
  name: string;
  status: 'ACEITOU TUDO' | 'ACEITOU BEM' | 'RECUSOU' | 'PARCIAL' | 'SEM REGISTRO';
  time: string;
  icon: string;
  observation?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  instructions: string;
  scheduleDescription: string;
  authorizedBy: string;
  authorizedRole: string;
  pinVerified: boolean;
  status: 'active' | 'administered' | 'pending';
  lastAdministeredAt?: string;
  lastAdministeredBy?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'alimentacao' | 'medicamento' | 'sono' | 'higiene' | 'atividade' | 'saude' | 'geral';
  registeredBy: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'purple' | 'teal' | 'indigo' | 'rose';
  icon: string;
  photoUrl?: string;
  verified?: boolean;
}

export interface NoticeItem {
  id: string;
  date: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  badge: string;
  badgeColor: 'indigo' | 'emerald' | 'amber' | 'rose';
}

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
    dose: '10 gotas se febre > 37.8°C',
    instructions: 'Diluir em 2 colheres de água filtrada. Avisar a mãe no app imediatamente.',
    scheduleDescription: 'Uso SOS / Sintomático',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Responsável Legal',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: 'Hoje às 10:20',
    lastAdministeredBy: 'Ana Silva (Professora Titular)',
  },
  {
    id: 'med-2',
    name: 'Soro Fisiológico Nasal 0.9% (Maresis Baby)',
    dose: '2 jatos em cada narina',
    instructions: 'Higienização nasal suave antes do soninho da tarde.',
    scheduleDescription: 'Diário no Berçário • 12:15',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Responsável Legal',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: 'Hoje às 12:15',
    lastAdministeredBy: 'Ana Silva (Professora Titular)',
  },
  {
    id: 'med-3',
    name: 'Pomada Bepantol Baby Protetora',
    dose: 'Camada fina na região das fraldas',
    instructions: 'Prevenção de assaduras nas trocas de fraldas da tarde.',
    scheduleDescription: 'A cada troca de fralda',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Responsável Legal',
    pinVerified: true,
    status: 'active'
  }
];

const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'tl-1',
    time: '07:30',
    title: 'Acolhimento & Entrada no Berçário',
    description: 'Mariana chegou muito tranquila e sorridente no colo da mãe. Pertences e mochila conferidos.',
    category: 'geral',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Presença Confirmada',
    badgeColor: 'emerald',
    icon: 'baby',
    verified: true
  },
  {
    id: 'tl-2',
    time: '08:00',
    title: 'Mamadeira Nutritiva Matinal',
    description: '180 ml de fórmula hipoalergênica oferecida e ingerida integralmente com boa aceitação.',
    category: 'alimentacao',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: '180 ml • Aceitou Tudo',
    badgeColor: 'amber',
    icon: 'bottle',
    verified: true
  },
  {
    id: 'tl-3',
    time: '08:45',
    title: 'Troca de Fralda & Higiene Preventiva',
    description: 'Troca de fralda número 1 (xixi). Pele limpa e aplicação suave de pomada protetora.',
    category: 'higiene',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Fralda Troca 1 • Normal',
    badgeColor: 'teal',
    icon: 'sparkles',
    verified: true
  },
  {
    id: 'tl-4',
    time: '09:20',
    title: 'Roda de Cantigas & Expressão Musical (BNCC EI01TS01)',
    description: 'Mariana bateu palminhas ao som da cantiga "Dona Aranha" e interagiu com os chocalhos.',
    category: 'atividade',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Vivenciada com a Turma',
    badgeColor: 'indigo',
    icon: 'music',
    verified: true
  },
  {
    id: 'tl-5',
    time: '10:15',
    title: 'Aferição de Temperatura & Checagem Preventiva',
    description: 'Temperatura corporal aferida em 36.6°C (Afebril). Criança alegre e hidratada.',
    category: 'saude',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: '36.6°C • Afebril',
    badgeColor: 'emerald',
    icon: 'thermometer',
    verified: true
  }
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'not-1',
    date: 'Hoje às 08:30',
    title: 'Piquenique da Primavera & Feira de Arte dos Bebês',
    content: 'Convidamos todas as famílias para nosso piquenique de integração no próximo sábado das 09h às 11h.',
    author: 'Coordenação Pedagógica',
    authorRole: 'Direção Geral',
    badge: 'Evento Escolar',
    badgeColor: 'indigo'
  },
  {
    id: 'not-2',
    date: 'Ontem às 16:45',
    title: 'Solicitação de Reposição de Pomada & Fraldas',
    content: 'O estoque de fraldas da Mariana tem 3 unidades restantes no armário. Solicitamos envio amanhã.',
    author: 'Ana Silva',
    authorRole: 'Professora Titular',
    badge: 'Recado da Sala',
    badgeColor: 'amber'
  }
];

export function App() {
  const [student] = useState<StudentProfile>(INITIAL_STUDENT);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [notices] = useState<NoticeItem[]>(INITIAL_NOTICES);

  // Estados de Rotina Diária
  const [waterMl, setWaterMl] = useState<number>(150);
  const [bottleVolume] = useState<number>(180);
  const [bottleDone, setBottleDone] = useState<boolean>(true);
  const [mood, setMood] = useState<'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso'>('Calmo / Sereno');
  const [temperature, setTemperature] = useState<number>(36.6);
  const [napStatus, setNapStatus] = useState<string>('Soneca em Andamento');
  const [napStartTime, setNapStartTime] = useState<string>('12:30');
  const [diaperCount, setDiaperCount] = useState<number>(2);
  const [diaperStatus, setDiaperStatus] = useState<string>('Xixi + Pomada');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('diario');
  const [activeQuickNav, setActiveQuickNav] = useState('timeline');
  const [currentRole, setCurrentRole] = useState<'professor' | 'familia'>('professor');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Cronômetro de Permanência
  const [isPaused, setIsPaused] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(Date.now() - (3 * 3600 + 45 * 60) * 1000);
  const [elapsedSeconds, setElapsedSeconds] = useState(3 * 3600 + 45 * 60);

  // 🔄 SINCRONIZAÇÃO EM TEMPO REAL COM FIREBASE FIRESTORE (Celular ⇄ Computador)
  useEffect(() => {
    const unsubscribe = subscribeToDailyState('mariana-souza', (liveData: DailyStateFirebase) => {
      if (liveData.meals) setMeals(liveData.meals);
      if (liveData.medications) setMedications(liveData.medications);
      if (liveData.timelineEvents) setTimelineEvents(liveData.timelineEvents);
      if (typeof liveData.waterMl === 'number') setWaterMl(liveData.waterMl);
      if (typeof liveData.bottleDone === 'boolean') setBottleDone(liveData.bottleDone);
      if (liveData.mood || liveData.humor) setMood((liveData.mood || liveData.humor) as any);
      if (typeof liveData.temperature === 'string') setTemperature(parseFloat(liveData.temperature) || 36.6);
      if (liveData.sleepStatus) setNapStatus(liveData.sleepStatus);
      if (liveData.sleepStart) setNapStartTime(liveData.sleepStart);
      if (liveData.diaperStatus) setDiaperStatus(liveData.diaperStatus);
      if (typeof liveData.isTimerRunning === 'boolean') {
        setIsPaused(!liveData.isTimerRunning);
      }
      if (liveData.startTimestamp) {
        setStartTimestamp(liveData.startTimestamp);
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - liveData.startTimestamp) / 1000));
        setElapsedSeconds(diff);
      } else if (typeof liveData.elapsedSeconds === 'number') {
        setElapsedSeconds(liveData.elapsedSeconds);
      }
    });

    return () => unsubscribe();
  }, []);

  // Motor do Cronômetro
  useEffect(() => {
    let interval: any = null;
    if (!isPaused) {
      interval = setInterval(() => {
        if (startTimestamp) {
          const now = Date.now();
          setElapsedSeconds(Math.max(0, Math.floor((now - startTimestamp) / 1000)));
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, startTimestamp]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    let newStart = startTimestamp;
    if (!nextPaused && !newStart) {
      newStart = Date.now() - elapsedSeconds * 1000;
      setStartTimestamp(newStart);
    }
    saveDailyState('mariana-souza', {
      isTimerRunning: !nextPaused,
      startTimestamp: nextPaused ? null : newStart,
      elapsedSeconds,
    });
  };

  const handleAddWater = (amount: number) => {
    const newWater = Math.max(0, waterMl + amount);
    setWaterMl(newWater);
    saveDailyState('mariana-souza', { waterMl: newWater });
  };

  const handleToggleBottle = () => {
    const nextDone = !bottleDone;
    setBottleDone(nextDone);
    saveDailyState('mariana-souza', { bottleDone: nextDone });
  };

  const handleSetMood = (m: 'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso') => {
    setMood(m);
    saveDailyState('mariana-souza', { humor: m, mood: m });
  };

  const handleSetTemperature = (t: number) => {
    setTemperature(t);
    saveDailyState('mariana-souza', { temperature: t.toString() });
  };

  const handleSetDiaper = (tipo: string) => {
    const newCount = diaperCount + 1;
    setDiaperCount(newCount);
    setDiaperStatus(tipo);
    saveDailyState('mariana-souza', {
      diaperStatus: tipo,
    });
  };

  const handleUpdateMeal = (mealId: string, status: MealStatus['status']) => {
    const updated = meals.map((m) => (m.id === mealId ? { ...m, status } : m));
    setMeals(updated);

    const meal = meals.find((m) => m.id === mealId);
    let updatedEvents = timelineEvents;
    if (meal && status !== 'SEM REGISTRO') {
      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const newEvent: TimelineEvent = {
        id: `tl-meal-${Date.now()}`,
        time: nowTime,
        title: `Alimentação: ${meal.name}`,
        description: `Registro efetuado: Status "${status}". Acompanhamento nutricional completo.`,
        category: 'alimentacao',
        registeredBy: `${student.teacherName} (${student.teacherRole})`,
        badge: status,
        badgeColor: 'amber',
        icon: 'utensils',
        verified: true,
      };
      updatedEvents = [newEvent, ...timelineEvents];
      setTimelineEvents(updatedEvents);
    }

    saveDailyState('mariana-souza', {
      meals: updated,
      timelineEvents: updatedEvents,
    });
  };

  const handleAdministerMedication = (medId: string) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = `Hoje às ${nowTime}`;

    const updatedMeds = medications.map((med) => {
      if (med.id === medId) {
        return {
          ...med,
          lastAdministeredAt: nowFormatted,
          lastAdministeredBy: student.teacherName,
        };
      }
      return med;
    });
    setMedications(updatedMeds);

    const targetMed = medications.find((m) => m.id === medId);
    let updatedEvents = timelineEvents;
    if (targetMed) {
      const newEvent: TimelineEvent = {
        id: `tl-med-${Date.now()}`,
        time: nowTime,
        title: `Medicamento: ${targetMed.name}`,
        description: `Dose (${targetMed.dose}) ministrada com sucesso via PIN Legal #7842.`,
        category: 'medicamento',
        registeredBy: `${student.teacherName} (${student.teacherRole})`,
        badge: 'PIN Legal • Ministrado',
        badgeColor: 'purple',
        icon: 'pill',
        verified: true,
      };
      updatedEvents = [newEvent, ...timelineEvents];
      setTimelineEvents(updatedEvents);
    }

    saveDailyState('mariana-souza', {
      medications: updatedMeds,
      timelineEvents: updatedEvents,
    });
  };

  const handleSelectQuickNav = (id: string) => {
    setActiveQuickNav(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-24 selection:bg-[#5B46EB] selection:text-white relative">
      
      {/* 🚀 1. HEADER OFICIAL COM DEGRADÊ ROXO (#5B46EB) */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#5B46EB] via-[#6355EE] to-[#7B42F6] text-white shadow-lg border-b border-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Marca */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold backdrop-blur-md transition-all active:scale-95 border border-white/20 shadow-xs cursor-pointer">
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

          {/* Anjinha Aura + Professora */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 border border-amber-300 cursor-pointer">
              <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
              <span>Anjinha Aura</span>
            </button>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm cursor-pointer">
              <img
                src={student.teacherPhoto}
                alt="Ana Silva"
                className="w-8 h-8 rounded-full object-cover border border-white/40 shadow-xs"
              />
              <div className="text-left hidden sm:block leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white">Ana Silva (Professora Titular)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-200" />
                </div>
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
                  MASTER [DEV] BERÇÁRIO I - A
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
              <Cloud className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span className="hidden sm:inline">Nuvem Conectada</span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
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
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'avisos') handleSelectQuickNav('notices');
                  else if (tab.id === 'medicamentos') handleSelectQuickNav('medications');
                  else if (tab.id === 'diario') handleSelectQuickNav('timeline');
                }}
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

        {/* Barra de Subcabeçalho Violeta Escuro (#1C164C) */}
        <div className="bg-[#1C164C] px-4 sm:px-6 lg:px-8 py-2.5 border-t border-indigo-950/60 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-400"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border border-[#1C164C] rounded-full"></span>
              </div>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-bold text-indigo-300 block">CRIANÇA/ALUNO EM EXIBIÇÃO:</span>
                <span className="text-sm font-black text-amber-300">{student.name} ({student.ageFormatted})</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Pesquisar registro ou cardápio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-indigo-300 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-white/15 focus:outline-none focus:bg-white/20"
                />
                <Search className="w-3.5 h-3.5 text-indigo-300 absolute left-2.5 top-2" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CONTAINER PRINCIPAL */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 🕊️ BANNER VERDE DO PORTAL DE TRANQUILIDADE (PAX) */}
        <div className="bg-[#00897B] rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 border border-white/30 shadow-xs">
                🕊️
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                    PORTAL DE TRANQUILIDADE (PAX)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-100 bg-emerald-800/40 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    Transmissão Oficial em Tempo Real
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                  Acompanhamento em Tempo Real das Atividades Diárias
                </h2>
                <p className="text-xs text-emerald-100 leading-relaxed max-w-2xl">
                  Espaço dedicado aos pais e responsáveis para leitura transparente dos cuidados, tempo em aula, nutrição e bem-estar de <strong>{student.name}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-emerald-900/40 rounded-2xl p-3 border border-emerald-400/30 text-right shrink-0">
              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-300 block mb-0.5">MODO ATIVO</span>
              <span className="text-xs font-black text-white block">Leitura & Acompanhamento</span>
            </div>
          </div>
        </div>

        {/* 👶 CARD DA MARIANA SOUZA COM DETALHES E BARRA 'IR PARA' */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-emerald-400 shadow-md"
                />
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {student.name}
                  </h2>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                    ALUNO VERIFICADO
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ONLINE NO BERÇÁRIO
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  <div>Responsável: <strong className="text-slate-900">{student.responsible}</strong></div>
                  <div>•</div>
                  <div>Nascimento: <strong className="text-slate-900">{student.birthDate} ({student.ageFormatted})</strong></div>
                  <div>•</div>
                  <div>Turma: <strong className="text-[#5B46EB]">{student.roomName}</strong></div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{student.allergyNotice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#5B46EB] to-[#7B42F6] hover:from-[#4F3BE0] hover:to-[#6C34E8] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Relatório em PDF</span>
            </button>
          </div>

          {/* Barra de Acesso Rápido 'IR PARA' */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 mr-2 flex items-center gap-1">
              <span className="text-amber-500">⚡</span>
              <span>IR PARA:</span>
            </span>
            {[
              { id: 'feeding', label: 'Alimentação' },
              { id: 'water', label: 'Água / Mamadeira' },
              { id: 'health', label: 'Saúde & Temperatura' },
              { id: 'nap', label: 'Soneca & Sono' },
              { id: 'diapers', label: 'Trocas & Higiene' },
              { id: 'medications', label: 'Medicamentos' },
              { id: 'timeline', label: 'Linha do Tempo' },
              { id: 'notices', label: 'Avisos da Turma' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleSelectQuickNav(btn.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeQuickNav === btn.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🏫 HERO INSTITUCIONAL & PROFESSORA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B46EB] block mb-0.5">
                  INSTITUIÇÃO CREDENCIADA
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{student.schoolName}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{student.schoolSubtitle}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Selo de Qualidade Digital</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">BUSCA DIRETA POR NOME</span>
              <h3 className="text-base font-black text-slate-900 leading-tight">Busca Rápida de Alunos & Crianças</h3>
              <div className="relative pt-2">
                <input
                  type="text"
                  placeholder="Buscar por nome ou turma..."
                  className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-[#5B46EB]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-4.5" />
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 font-medium">
              🔒 Perfil Familiar: Acesso restrito e exclusivo a {student.name}.
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase text-slate-500">AULA Painel da Professora</span>
                <span className="text-[11px] font-bold text-indigo-600">{student.teacherRole}</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={student.teacherPhoto}
                  alt={student.teacherName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">{student.teacherName}</h4>
                  <p className="text-xs text-slate-500">Maternal I & Berçário B</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
              <span className="flex items-center gap-1">🟢 Sessão Segura e Ativa</span>
            </div>
          </div>
        </div>

        {/* ⏱️ GOVERNANÇA & TEMPO DE PERMANÊNCIA COM CRONÔMETRO */}
        <div id="section-timeline" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5B46EB] font-bold text-xl">
                ⏱️
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5B46EB] block">AUDITORIA E COMPLIANCE</span>
                <h3 className="text-lg font-black text-slate-900">Governança & Tempo de Permanência</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-md flex items-center gap-3">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-black font-mono text-emerald-400">{formatTimer(elapsedSeconds)}</span>
              </div>

              {currentRole === 'professor' && (
                <button
                  onClick={handleTogglePause}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer ${
                    isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Retomar Aula' : 'Pausar Aula'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 🍼 ALIMENTAÇÃO, MAMADEIRA & ÁGUA */}
        <div id="section-feeding" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mamadeira */}
            <div id="section-water" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
                    🍼
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Mamadeira Nutritiva</h3>
                    <p className="text-xs text-slate-500 font-medium">Fórmula Especial Hipoalergênica APLV</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  bottleDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {bottleDone ? `${bottleVolume} ml • Tomou Tudo` : 'Pendente'}
                </span>
              </div>

              {currentRole === 'professor' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleBottle}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition border flex items-center justify-center gap-2 ${
                      bottleDone ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {bottleDone ? 'Desmarcar' : 'Confirmar Mamadeira Tomada'}
                  </button>
                </div>
              )}
            </div>

            {/* Água */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Ingestão Hídrica (Água)</h3>
                    <p className="text-xs text-slate-500 font-medium">Meta Diária: 600 ml</p>
                  </div>
                </div>
                <span className="text-xl font-black text-sky-600 font-mono">{waterMl} ml</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (waterMl / 600) * 100)}%` }} />
              </div>

              {currentRole === 'professor' && (
                <div className="flex gap-2">
                  {[+50, +100, +150].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleAddWater(amt)}
                      className="flex-1 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-black border border-sky-200 transition"
                    >
                      +{amt} ml
                    </button>
                  ))}
                  <button
                    onClick={() => handleAddWater(-50)}
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition"
                  >
                    -50
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Refeições Rápidas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              <span>Cardápio & Refeições Rápidas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((meal) => (
                <div key={meal.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{meal.time} • {meal.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        meal.status === 'ACEITOU TUDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        meal.status === 'ACEITOU BEM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {meal.status}
                      </span>
                    </div>
                    {meal.observation && (
                      <p className="text-xs text-slate-600 mt-2">{meal.observation}</p>
                    )}
                  </div>

                  {currentRole === 'professor' && (
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200">
                      {(['ACEITOU TUDO', 'ACEITOU BEM', 'RECUSOU'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateMeal(meal.id, st as any)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition border ${
                            meal.status === st 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {st === 'ACEITOU TUDO' ? 'Tudo' : st === 'ACEITOU BEM' ? 'Bem' : 'Recusou'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🌡️ SAÚDE, SONECA, HIGIENE & MEDICAMENTOS */}
        <div id="section-health" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Temperatura & Humor */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>Humor & Temperatura</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Temperatura Corporal</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-rose-700 font-mono">{temperature}°C</span>
                {currentRole === 'professor' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleSetTemperature(parseFloat((temperature + 0.1).toFixed(1)))} className="px-2 bg-white rounded border text-xs font-bold">+</button>
                    <button onClick={() => handleSetTemperature(parseFloat((temperature - 0.1).toFixed(1)))} className="px-2 bg-white rounded border text-xs font-bold">-</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Humor Geral</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Calmo / Sereno', 'Alegre', 'Sonolento', 'Choroso'].map((m) => (
                  <button
                    key={m}
                    disabled={currentRole !== 'professor'}
                    onClick={() => handleSetMood(m as any)}
                    className={`p-2 rounded-xl text-[11px] font-black text-center transition border ${
                      mood === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Soneca & Fraldas */}
          <div id="section-nap" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              <span>Soneca & Trocas</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
              <div className="text-[11px] font-bold text-purple-900">Status do Sono</div>
              <div className="text-sm font-black text-purple-700 mt-0.5">{napStatus} ({napStartTime})</div>
            </div>

            <div id="section-diapers">
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Última Troca de Fralda</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Xixi + Pomada', 'Cocô Normal', 'Cocô Pastoso', 'Fralda Limpa'].map((fp) => (
                  <button
                    key={fp}
                    disabled={currentRole !== 'professor'}
                    onClick={() => handleSetDiaper(fp)}
                    className={`p-2 rounded-xl text-[10px] font-black text-center transition border ${
                      diaperStatus === fp ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Medicamentos */}
          <div id="section-medications" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-500" />
              <span>Medicamentos</span>
            </h3>

            {medications.map((med) => (
              <div key={med.id} className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950">{med.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">{med.dose}</span>
                </div>
                {med.lastAdministeredAt ? (
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {med.lastAdministeredAt}
                  </div>
                ) : (
                  currentRole === 'professor' && (
                    <button
                      onClick={() => handleAdministerMedication(med.id)}
                      className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black transition shadow-xs"
                    >
                      Validar PIN & Ministrar
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 📜 LINHA DO TEMPO & AUDITORIA */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                📜
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Linha do Tempo em Tempo Real</h3>
                <p className="text-xs text-slate-500 font-medium">Auditoria com registro pedagógico e legal</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {timelineEvents.map((evt) => (
              <div key={evt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono font-black text-slate-800 shadow-2xs">
                  {evt.time}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-900">{evt.title}</h4>
                    {evt.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {evt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{evt.description}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Registrado por: {evt.registeredBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📢 MURAL DE AVISOS */}
        <div id="section-notices" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              📢
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Mural de Avisos & Recados</h3>
              <p className="text-xs text-slate-500 font-medium">Comunicação direta entre família e escola</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950">{n.title}</span>
                  <span className="text-[10px] font-bold text-slate-400">{n.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                <div className="text-[10px] font-bold text-indigo-700 pt-2 border-t border-indigo-100">
                  Por: {n.author} ({n.authorRole})
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* 📱 BARRA FIXA INFERIOR COM ALTERNADOR DE PERFIL */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setCurrentRole('professor')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              currentRole === 'professor' ? 'bg-[#5B46EB] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👩‍🏫 Professora / Educador
          </button>
          <button
            onClick={() => setCurrentRole('familia')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              currentRole === 'familia' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👨‍👩‍👧 Família / Pais
          </button>
        </div>
      </footer>

      {/* 📄 MODAL DE RELATÓRIO DIÁRIO */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Relatório Diário do Aluno</h3>
                <p className="text-xs text-slate-500 font-medium">Mariana Souza • Berçário B</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="font-black text-indigo-950">Resumo da Jornada Escolar:</div>
                <p className="text-slate-700 leading-relaxed">
                  Mariana permaneceu em aula por <strong>{formatTimer(elapsedSeconds)}</strong>. 
                  Comportamento <strong>{mood}</strong>, temperatura em <strong>{temperature}°C</strong>.
                  Consumiu <strong>{waterMl}ml de água</strong> e teve alimentação acompanhada rigorosamente sem lactose/APLV.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-2xl bg-[#5B46EB] hover:bg-indigo-700 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
