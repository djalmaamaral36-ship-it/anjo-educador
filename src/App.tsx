import React, { useState, useEffect } from 'react';
import { 
  TopNavbar 
} from './components/TopNavbar';
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
