import React, { useState, useEffect } from 'react';
import { 
  Menu, Sparkles, ChevronDown, Search, Mic, Clock, BookOpen, Users, 
  Bell, Pill, Calendar, Heart, KeyRound, LogOut, X, FileSpreadsheet, 
  CheckCircle2, Lock, Play, Pause, FileText, Milk, Droplets, Plus, 
  Minus, Check, Utensils, Apple, Sun, Info, AlertCircle, HeartPulse, 
  Smile, Moon, Thermometer, Baby, Scale, CheckSquare, ShieldCheck, 
  ShowerHead, FileCheck, Camera, Filter, UserCheck, MessageSquare, 
  AlertTriangle, Send, School, Inbox, Music, Share2, Printer, Copy, 
  ArrowUp, Download, MessageCircle 
} from 'lucide-react';
import { subscribeToDailyState, saveDailyState, DailyStateFirebase } from './services/firebase';

// --- INTERFACES ---
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
  tags: { id: string; label: string; icon: 'footprints' | 'music' | 'star' }[];
}

export interface ActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
  bnccTag: string;
  status: 'pending' | 'completed' | 'skipped';
  isUrgent?: boolean;
  completedAt?: string;
  observation?: string;
  participation?: string;
  photoUrl?: string;
  registeredBy?: string;
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
  status: 'active' | 'suspended';
  lastAdministeredAt?: string;
  lastAdministeredBy?: string;
}

export interface MealStatus {
  id: string;
  name: string;
  status: 'SEM REGISTRO' | 'ACEITOU TUDO' | 'ACEITOU BEM' | 'RECUSOU' | 'PARCIAL';
  time?: string;
  icon: string;
  observation?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'saude' | 'alimentacao' | 'atividade' | 'medicamento' | 'sono' | 'higiene' | 'geral';
  registeredBy: string;
  badge: string;
  badgeColor: 'emerald' | 'indigo' | 'amber' | 'purple' | 'rose' | 'teal';
  icon: string;
  photoUrl?: string;
  details?: string;
  verified: boolean;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  role: 'escola' | 'familia' | 'saude' | 'sistema';
  authorPhoto?: string;
  date: string;
  time: string;
  priority: 'normal' | 'importante' | 'urgente';
  isRead: boolean;
  tags?: string[];
}

// --- DADOS INICIAIS ---
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
  { id: 'almoco', name: 'Almoço Balanceado', status: 'ACEITOU TUDO', time: '11:30', icon: 'soup', observation: 'Papinha de legumes com carne magra desfiada e purê de abóbora.' },
  { id: 'lanche-tarde', name: 'Lanche da Tarde', status: 'SEM REGISTRO', time: '15:00', icon: 'cookie', observation: 'Previsto: Suco de maçã 100% integral e biscoito de arroz.' }
];

const INITIAL_MEDICATIONS: MedicationItem[] = [
  {
    id: 'soro-nasal',
    name: 'Soro Fisiológico Nasal 0,9%',
    dose: '2 gotas em cada narina antes da soneca',
    instructions: 'Higienização preventiva das vias aéreas com soro morno',
    scheduleDescription: 'Diário • 12:15 (Antes do sono)',
    authorizedBy: 'Dra. Camila Meireles (Pediatra CRM/SP 142.890)',
    authorizedRole: 'Pediatra Assistente',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: '12:15',
    lastAdministeredBy: 'Prof. Ana Silva (PIN Autorizado)'
  }
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    id: 'evt-1',
    time: '08:00',
    title: 'Entrada Acolhedora na Escola',
    description: 'Mariana chegou muito alegre, sorridente e interagiu espontaneamente com os colegas na roda inicial.',
    category: 'atividade',
    registeredBy: 'Prof. Ana Silva (Professora Titular)',
    badge: 'Acolhimento Afetivo',
    badgeColor: 'emerald',
    icon: 'smile',
    verified: true
  },
  {
    id: 'evt-2',
    time: '09:00',
    title: 'Lanchinho da Manhã Concluído',
    description: 'Aceitou toda a frutinha (banana com aveia) e bebeu água na jarrinha sem nenhuma recusa.',
    category: 'alimentacao',
    registeredBy: 'Prof. Ana Silva (Professora Titular)',
    badge: '100% Consumido',
    badgeColor: 'amber',
    icon: 'utensils',
    verified: true
  },
  {
    id: 'evt-3',
    time: '10:15',
    title: 'Atividade: Musicalização & Coordenação Sensorial',
    description: 'Exploração de instrumentos de percussão suaves (chocalhos e tamborzinho). Grande estímulo auditivo!',
    category: 'atividade',
    registeredBy: 'Prof. Ana Silva (Professora Titular)',
    badge: '🎨 BNCC EI01TS01 (Musicalização)',
    badgeColor: 'indigo',
    icon: 'music',
    verified: true
  }
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'not-1',
    title: 'Orientações para o Dia • Recado da Mamãe',
    content: 'Bom dia, Prô Ana! A Mariana dormiu super bem esta noite. Peço por favor aplicar as gotinhas de soro nasal antes do soninho da tarde. Muito obrigada!',
    author: 'Clarice Souza (Mãe)',
    role: 'familia',
    date: '24/09/2026',
    time: '07:45',
    priority: 'importante',
    isRead: true,
    tags: ['Família', 'Saúde']
  }
];

// --- APLICAÇÃO PRINCIPAL ---
function App() {
  const [student] = useState<StudentProfile>(INITIAL_STUDENT);
  const [currentRole, setCurrentRole] = useState<'professor' | 'pais' | 'diretora'>('professor');
  const [activeTab, setActiveTab] = useState('diario-hoje');
  const [activeQuickNav, setActiveQuickNav] = useState('feeding');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Estados Sincronizados com Firebase
  const [waterMl, setWaterMl] = useState<number>(150);
  const [bottleVolume, setBottleVolume] = useState<number>(180);
  const [bottleDone, setBottleDone] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(11520);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(11520);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);

  const [mood, setMood] = useState<'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso'>('Alegre');
  const [temperature, setTemperature] = useState<number>(36.6);
  const [napStatus, setNapStatus] = useState<string>('Dormiu 1h30 (Soninho tranquilo)');
  const [napStartTime] = useState<string>('12:30');
  const [weightKg, setWeightKg] = useState<number>(9.2);
  const [diaperCount, setDiaperCount] = useState<number>(3);
  const [diaperStatus, setDiaperStatus] = useState<string>('Xixi + Pomada Bepantol');
  const [hygieneChecks, setHygieneChecks] = useState<Record<string, boolean>>({
    clothesChanged: true, teethBrushed: true, handsFaceWashed: true, bathGiven: false, sunscreenCream: true
  });

  const [filter, setFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TimelineEvent['category']>('atividade');
  const [newTime, setNewTime] = useState('10:00');
  const [newBadge, setNewBadge] = useState('🎨 BNCC EI01TS01 (Musicalização)');

  const [noticeFilter, setNoticeFilter] = useState<'all' | 'escola' | 'familia'>('all');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMessage, setNewNoticeMessage] = useState('');
  const [newNoticePriority, setNewNoticePriority] = useState<'normal' | 'importante' | 'urgente'>('normal');
  const [toastNoticeSuccess, setToastNoticeSuccess] = useState(false);

  // Sincronização em Tempo Real com Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDailyState(student.id, (data) => {
      if (!data) return;
      if (typeof data.waterMl === 'number') setWaterMl(data.waterMl);
      if (typeof data.bottleVolume === 'number') setBottleVolume(data.bottleVolume);
      if (typeof data.bottleDone === 'boolean') setBottleDone(data.bottleDone);
      if (typeof data.isTimerRunning === 'boolean') setIsPaused(!data.isTimerRunning);
      if (typeof data.startTimestamp === 'number') setStartTimestamp(data.startTimestamp);
      else if (data.startTimestamp === null) setStartTimestamp(null);
      if (typeof data.elapsedSeconds === 'number') {
        setAccumulatedSeconds(data.elapsedSeconds);
        if (data.isTimerRunning && data.startTimestamp) {
          const currentDiff = Math.max(0, Math.floor((Date.now() - data.startTimestamp) / 1000));
          setElapsedSeconds(data.elapsedSeconds + currentDiff);
        } else {
          setElapsedSeconds(data.elapsedSeconds);
        }
      }
      if (Array.isArray(data.meals) && data.meals.length > 0) setMeals(data.meals as MealStatus[]);
      if (Array.isArray(data.medications) && data.medications.length > 0) setMedications(data.medications as MedicationItem[]);
      if (Array.isArray(data.timelineEvents) && data.timelineEvents.length > 0) setTimelineEvents(data.timelineEvents as TimelineEvent[]);
      if (Array.isArray(data.notices) && data.notices.length > 0) setNotices(data.notices as NoticeItem[]);
    });
    return () => unsubscribe();
  }, [student.id]);

  // Loop do Cronômetro Oficial por Timestamp
  useEffect(() => {
    if (isPaused || !startTimestamp) return;
    const interval = setInterval(() => {
      const liveDiff = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setElapsedSeconds(accumulatedSeconds + liveDiff);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, startTimestamp, accumulatedSeconds]);

  const handleTogglePause = () => {
    if (isPaused) {
      const now = Date.now();
      setIsPaused(false);
      setStartTimestamp(now);
      saveDailyState(student.id, {
        isTimerRunning: true,
        startTimestamp: now,
        elapsedSeconds: accumulatedSeconds,
      });
    } else {
      const now = Date.now();
      let currentTotal = accumulatedSeconds;
      if (startTimestamp) {
        const diff = Math.max(0, Math.floor((now - startTimestamp) / 1000));
        currentTotal += diff;
      }
      setIsPaused(true);
      setStartTimestamp(null);
      setAccumulatedSeconds(currentTotal);
      setElapsedSeconds(currentTotal);
      saveDailyState(student.id, {
        isTimerRunning: false,
        startTimestamp: null,
        elapsedSeconds: currentTotal,
      });
    }
  };

  const handleAddWater = (amount: number) => {
    const next = Math.max(0, waterMl + amount);
    setWaterMl(next);
    saveDailyState(student.id, { waterMl: next });
  };

  const handleToggleBottle = () => {
    const next = !bottleDone;
    setBottleDone(next);
    saveDailyState(student.id, { bottleDone: next });
  };

  const handleUpdateMeal = (mealId: string, status: MealStatus['status']) => {
    const updated = meals.map(m => m.id === mealId ? { ...m, status } : m);
    setMeals(updated);
    saveDailyState(student.id, { meals: updated });
  };

  const handleAdministerMedication = (medId: string) => {
    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const updated = medications.map(m => m.id === medId ? {
      ...m,
      lastAdministeredAt: timeNow,
      lastAdministeredBy: `${student.teacherName} (PIN Autorizado)`
    } : m);
    setMedications(updated);
    saveDailyState(student.id, { medications: updated });
  };

  const handleAddTimelineEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newEvt: TimelineEvent = {
      id: `evt-${Date.now()}`,
      time: newTime,
      title: newTitle,
      description: newDescription || 'Registro pedagógico auditado em tempo real.',
      category: newCategory,
      registeredBy: `${student.teacherName} (${student.teacherRole})`,
      badge: newBadge || 'Vivenciada com a Turma',
      badgeColor: newCategory === 'alimentacao' ? 'amber' : newCategory === 'saude' ? 'emerald' : newCategory === 'medicamento' ? 'purple' : newCategory === 'higiene' ? 'teal' : 'indigo',
      icon: newCategory === 'alimentacao' ? 'utensils' : newCategory === 'medicamento' ? 'pill' : 'music',
      verified: true
    };
    const updated = [newEvt, ...timelineEvents];
    setTimelineEvents(updated);
    saveDailyState(student.id, { timelineEvents: updated });
    setNewTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeMessage.trim()) return;
    const isTeacher = currentRole === 'professor';
    const newNot: NoticeItem = {
      id: `not-${Date.now()}`,
      title: newNoticeTitle.trim() || (isTeacher ? 'Comunicado da Professora' : 'Recado da Família'),
      content: newNoticeMessage.trim(),
      author: isTeacher ? `${student.teacherName} (Professora Titular)` : student.responsible,
      role: isTeacher ? 'escola' : 'familia',
      date: '24/09/2026',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      priority: newNoticePriority,
      isRead: true,
      tags: isTeacher ? ['Escola', 'Avisos'] : ['Família', 'Recados'],
    };
    const updated = [newNot, ...notices];
    setNotices(updated);
    saveDailyState(student.id, { notices: updated });
    setNewNoticeTitle('');
    setNewNoticeMessage('');
    setToastNoticeSuccess(true);
    setTimeout(() => setToastNoticeSuccess(false), 3000);
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${hrs} : ${mins} : ${secs}`;
  };

  const scrollToSection = (id: string) => {
    setActiveQuickNav(id);
    const elem = document.getElementById(`section-${id}`);
    if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-28">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#5B46EB] via-[#6355EE] to-[#7B42F6] text-white shadow-lg border-b border-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold backdrop-blur-md transition-all cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-1">
                <span className="text-2xl">👼</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white">
                  Anjinho Escolar
                </h1>
                <p className="text-[11px] text-indigo-100 font-medium mt-0.5">
                  Onde a infância é registrada para sempre
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAuraOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-amber-950 text-xs sm:text-sm font-black shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
              <span>Anjinha Aura</span>
            </button>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
              <img
                src={student.teacherPhoto}
                alt="Ana Silva"
                className="w-8 h-8 rounded-full object-cover border border-white/40"
              />
              <div className="text-left hidden sm:block leading-tight text-xs font-black text-white">
                {student.teacherName} (Professora Titular)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Container Principal */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Card do Aluno (Hero) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-5">
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-[#5B46EB]/15 shadow-md"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {student.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-[#5B46EB] border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Aluno Matriculado
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {student.schoolName} • <strong>{student.roomName}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>Nasc: <strong>{student.birthDate}</strong> ({student.ageFormatted})</span>
                  <span>•</span>
                  <span>Resp: <strong>{student.responsible}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <img
                src={student.teacherPhoto}
                alt={student.teacherName}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
              />
              <div className="text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  PROFESSORA TITULAR
                </span>
                <div className="font-black text-slate-900">{student.teacherName}</div>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Em Sala de Aula
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {student.tags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  <span>{tag.icon === 'footprints' ? '👣' : tag.icon === 'music' ? '🎵' : '⭐'}</span>
                  <span>{tag.label}</span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                ⚠️ {student.allergyNotice}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {[
                { id: 'feeding', label: '🍼 Alimentação' },
                { id: 'hygiene', label: '🩺 Saúde & Fraldas' },
                { id: 'timeline', label: '⏱️ Linha do Tempo' },
                { id: 'notices', label: '📬 Avisos' },
                { id: 'consolidated', label: '📋 Diário Consolidado' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    activeQuickNav === item.id
                      ? 'bg-[#5B46EB] text-white border-indigo-700 shadow-xs'
                      : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Governança & Cronômetro Oficial */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between text-center space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                MÉTRICAS DE GOVERNANÇA
              </span>
              <div className="relative w-24 h-24 mx-auto my-2 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="#5B46EB" strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="0" strokeLinecap="round" />
                </svg>
                <div className="absolute flex items-baseline justify-center">
                  <span className="text-xl font-black text-[#5B46EB] tracking-tight">100%</span>
                </div>
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                CONFORMIDADE
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                1 rotina(s) realizada(s) e 0 recusa(s) com registro técnico no período.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  SEGURANÇA DA ROTINA
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  isPaused ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isPaused ? 'AULA PAUSADA' : 'EM ANDAMENTO'}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {isPaused ? 'Aula Pausada / Aguardando Início' : 'Tudo Sob Controle na Escola'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isPaused 
                  ? 'O cronômetro da aula está pausado. O registro de rotinas e atividades requer o cronômetro ativo.'
                  : 'O período de aula está ativo. As atividades registradas são auditadas em tempo real.'
                }
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
              <div>Responsável: <strong>{student.teacherName}</strong></div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Status: <strong className={isPaused ? "text-amber-600" : "text-emerald-600"}>{isPaused ? 'Pausado' : 'Auditando'}</strong></span>
                <span className="text-[10px] text-slate-400">Agora</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5B46EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <h5 className="font-black text-slate-800 text-xs mb-0.5">
                  Trava de Segurança Pedagógica
                </h5>
                {isPaused ? (
                  <span className="text-amber-800 font-medium">
                    ⚠️ Registros bloqueados enquanto o cronômetro estiver desligado/pausado.
                  </span>
                ) : (
                  <span>
                    Você está acompanhando a rotina em tempo real de <strong>{student.name}</strong>.
                  </span>
                )}
              </div>
            </div>
            <div className={`p-2.5 rounded-2xl border text-[11px] font-medium ${
              isPaused ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
            }`}>
              {isPaused ? '🔒 Inicie o cronômetro abaixo para liberar os registros.' : '🔒 Acesso seguro e auditável pelo responsável legal.'}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  TEMPO EM AULA
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isPaused ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {isPaused ? '⚠️ EM AULA (PAUSADO)' : '▶️ EM AULA (ATIVO)'}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Permanência em Aula
                </h3>
                <button
                  onClick={handleTogglePause}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3 fill-white" />
                      <span>Iniciar</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 fill-white" />
                      <span>Pausar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-3 my-2 text-center text-white space-y-0.5 shadow-inner">
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 block">
                  {isPaused ? 'TEMPO COMPUTADO (PAUSADO)' : 'TEMPO EM ANDAMENTO'}
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                  {formatTime(elapsedSeconds)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all active:scale-98 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Boletim do Dia</span>
            </button>
          </div>
        </div>

        {/* Alimentação & Hidratação */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="section-feeding">
          {/* Mamadeira */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍼</span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Mamadeira
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {bottleDone ? '1 Servida Hoje' : '0 Servidas Hoje'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
                    <Milk className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">
                      Mamadeira (Fórmula / Leite)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Volume: <strong className="text-slate-800">{bottleVolume} ml</strong>
                    </span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleToggleBottle}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${
                    bottleDone ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {bottleDone ? 'Tomou Tudo ✓' : '+ Registrar'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 mt-3">
                {[90, 120, 180, 240].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setBottleVolume(v); saveDailyState(student.id, { bottleVolume: v }); }}
                    className={`py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                      bottleVolume === v
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {v}ml
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                OBSERVAÇÃO DO EDUCADOR:
              </span>
              <p className="text-slate-600 italic leading-relaxed">
                Alimentou-se nos horários previstos com ótima aceitação e sem refluxo.
              </p>
            </div>
          </div>

          {/* Hidratação Rápida (Água) */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm flex flex-col justify-between space-y-4" id="section-water">
            <div>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Hidratação Rápida (Água)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Controle de copos e jarrinha para {student.name}.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 text-center space-y-1 my-2 relative overflow-hidden">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 block">
                  JARRINHA DIÁRIA ({Math.min(100, Math.round((waterMl / 600) * 100))}%)
                </span>
                <div className="text-3xl font-black text-blue-700 tracking-tight">
                  {waterMl} ml
                </div>
                <p className="text-xs text-blue-600 font-medium">
                  Meta: 600 ml ({Math.floor(waterMl / 50)} copos)
                </p>
                <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((waterMl / 600) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAddWater(50)}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                + 50 ml
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(100)}
                className="flex-1 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                + 100 ml
              </button>
              {waterMl > 0 && (
                <button
                  type="button"
                  onClick={() => handleAddWater(-50)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  - 50 ml
                </button>
              )}
            </div>
          </div>

          {/* Refeições Rápidas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4" id="section-meals">
            <div>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                  🍲
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Cardápio & Refeições Rápidas
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Aceitação das refeições sólidas diárias.
                  </p>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                {meals.map((meal) => (
                  <div 
                    key={meal.id} 
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {meal.id === 'lanche-manha' ? '🍎' : meal.id === 'almoco' ? '🥣' : '🍌'}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-none">
                          {meal.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold">
                          <span className="text-amber-600">{meal.status}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateMeal(meal.id, 'ACEITOU TUDO')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          meal.status === 'ACEITOU TUDO' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Aceitou
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateMeal(meal.id, 'PARCIAL')}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          meal.status === 'PARCIAL' 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        1/2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Saúde, Soneca, Fraldas & Medicamentos com PIN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="section-hygiene">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🩺</span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Saúde, Soneca & Higiene
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  CUIDADOS DO ALUNO
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    😊 ESTADO DE HUMOR
                  </span>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {mood}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {(['Calmo / Sereno', 'Alegre', 'Sonolento', 'Choroso'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer text-center ${
                        mood === m
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      💤 SONECA
                    </span>
                    <span className="text-[10px] font-black text-indigo-600">
                      {napStartTime}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{napStatus}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      🌡️ FEBRE / TEMP
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      temperature >= 37.8 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {temperature >= 37.8 ? 'Alerta' : 'Afebril'}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{temperature}°C</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                CHECKLIST DE HIGIENE
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {[
                  { key: 'clothesChanged', label: 'Troca Roupas', icon: '👕' },
                  { key: 'teethBrushed', label: 'Escovação', icon: '🪥' },
                  { key: 'handsFaceWashed', label: 'Mãos & Rosto', icon: '🧼' },
                  { key: 'bathGiven', label: 'Banho', icon: '🛁' },
                  { key: 'sunscreenCream', label: 'Pomada/Protetor', icon: '🧴' },
                ].map((item) => {
                  const checked = hygieneChecks[item.key as keyof typeof hygieneChecks];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setHygieneChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        checked
                          ? 'bg-emerald-500 border-emerald-600 text-white font-extrabold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px]">{item.icon} {item.label}</span>
                      <span className="text-[9px]">{checked ? '✓' : '...'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4 flex flex-col justify-between" id="section-medications">
            <div>
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💊</span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Medicamentos & Prescrições (PIN)
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Protocolo Seguro
                </span>
              </div>

              <div className="space-y-3 mt-3">
                {medications.map((med) => (
                  <div 
                    key={med.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{med.name}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{med.dose}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdministerMedication(med.id)}
                        className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        Ministrar (PIN)
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                      <span>Autorizado por: <strong>{med.authorizedBy}</strong></span>
                      <span className="text-purple-700 font-bold">{med.lastAdministeredAt || 'Aguardando'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Linha do Tempo de Auditoria */}
        <section id="section-timeline" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    Linha do Tempo e Auditoria de Saúde & Atividades
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ✓ 100% Auditado
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Registro cronológico auditado em tempo real de todas as vivências de <strong>{student.name}</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5B46EB] hover:bg-[#4E39E0] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar na Linha do Tempo</span>
            </button>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-indigo-300 before:to-slate-300">
            {timelineEvents.map((evt) => (
              <div key={evt.id} className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                </div>

                <div className="bg-slate-50/90 hover:bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 transition-all space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {evt.title}
                      </h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        Horário verificado: <strong className="text-slate-800">{evt.time}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-indigo-50 text-indigo-800 border-indigo-200">
                        {evt.badge}
                      </span>
                      {evt.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Auditado</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal de Adicionar Evento */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-base font-black text-slate-900">Novo Registro na Linha do Tempo</h4>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTimelineEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                    >
                      <option value="atividade">🎨 Atividade Vivenciada</option>
                      <option value="alimentacao">🍼 Alimentação & Mamadeira</option>
                      <option value="saude">🩺 Saúde & Temperatura</option>
                      <option value="medicamento">💊 Medicamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Horário:</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Título do Evento:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Pintura com Dedinhos / Brincadeira com Bolinhas"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Observações:</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    placeholder="Descreva o momento..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 font-bold">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer">
                    Salvar Registro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mural de Avisos */}
        <section id="section-notices" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Mural de Avisos & Mensagens</h3>
                <p className="text-xs text-slate-500">Comunicação direta entre Família e Escola</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{notice.title}</span>
                    <span className="text-[10px] text-slate-400">{notice.time}</span>
                  </div>
                  <p className="text-xs text-slate-700">{notice.content}</p>
                  <div className="text-[10px] text-slate-500">Por: <strong>{notice.author}</strong></div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendNotice} className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3 text-xs">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Enviar Novo Recado</h4>
              {toastNoticeSuccess && (
                <div className="p-2 bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs">Recado Enviado!</div>
              )}
              <input
                type="text"
                placeholder="Título do Recado"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                className="w-full p-2 bg-white rounded-xl border border-amber-200 outline-none"
              />
              <textarea
                placeholder="Mensagem..."
                rows={3}
                value={newNoticeMessage}
                onChange={(e) => setNewNoticeMessage(e.target.value)}
                className="w-full p-2 bg-white rounded-xl border border-amber-200 outline-none"
                required
              />
              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl cursor-pointer">
                Enviar Recado
              </button>
            </form>
          </div>
        </section>

        {/* Diário Consolidado */}
        <section id="section-consolidated" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  Diário Consolidado do Dia
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Resumo integrado de todos os cuidados de <strong>{student.name}</strong> para os pais.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B46EB] hover:bg-[#4D3AE0] text-white text-xs font-black shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ver Boletim Completo PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
              <span className="text-[10px] font-black uppercase text-indigo-700 block">TEMPO EM AULA</span>
              <div className="text-xl font-mono font-bold text-indigo-950 mt-1">{formatTime(elapsedSeconds)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-[10px] font-black uppercase text-amber-800 block">ALIMENTAÇÃO</span>
              <div className="text-xl font-black text-amber-950 mt-1">2/3 Refeições</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">TEMPERATURA</span>
              <div className="text-xl font-black text-emerald-950 mt-1">36.6°C Afebril</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-center">
              <span className="text-[10px] font-black uppercase text-purple-800 block">MEDICAÇÃO</span>
              <div className="text-xl font-black text-purple-950 mt-1">1 Ministrado (PIN)</div>
            </div>
          </div>
        </section>

      </main>

      {/* Barra Flutuante Inferior (Troca de Perfil) */}
      <div className="fixed bottom-4 inset-x-0 z-40 pointer-events-none px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl bg-[#1C164C]/95 backdrop-blur-md text-white border border-indigo-900/60 shadow-xl text-xs font-bold">
            <span className="text-[10px] font-black uppercase text-amber-400 pl-2 pr-1">PERFIL:</span>
            {(['professor', 'pais', 'diretora'] as const).map(role => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`px-3 py-1.5 rounded-xl cursor-pointer ${
                  currentRole === role ? 'bg-[#5B46EB] text-white shadow-xs font-black' : 'text-indigo-200 hover:text-white'
                }`}
              >
                {role === 'professor' ? '🧑‍🏫 Professor' : role === 'pais' ? '👨‍👩‍👧 Pais' : '👑 Diretora'}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1C164C]/95 hover:bg-[#271F62] text-white border border-indigo-900/60 shadow-xl cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-300">Voltar ao Topo</span>
          </button>
        </div>
      </div>

      {/* Modal do Boletim Diário */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👼</span>
                <h4 className="text-base font-black text-slate-900">Boletim do Dia • {student.name}</h4>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Escola:</strong> {student.schoolName}</p>
              <p><strong>Permanência em Aula:</strong> {formatTime(elapsedSeconds)}</p>
              <p><strong>Alimentação:</strong> Mamadeira e Fruta consumidas com sucesso.</p>
              <p><strong>Saúde:</strong> Afebril (36.6°C), disposição ativa.</p>
              <p><strong>Soneca:</strong> 1h30 no berçário climatizado.</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-xs cursor-pointer">
                Imprimir
              </button>
              <button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#5B46EB] text-white font-black text-xs cursor-pointer">
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
