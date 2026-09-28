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
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Baby, 
  Utensils, 
  Moon, 
  Droplets, 
  HeartPulse, 
  Plus,
  ShieldCheck,
  Building2,
  GraduationCap,
  Lock,
  Play,
  Pause,
  RotateCcw,
  LogIn,
  LogOut,
  Thermometer,
  Smile,
  Frown,
  Meh,
  Activity,
  Check,
  X,
  Cloud,
  Send,
  Printer,
  ChevronRight,
  UserCheck,
  FileSpreadsheet,
  Layers,
  ChevronUp,
  TreePine,
  Compass,
  Award,
  BookMarked,
  BarChart3,
  Briefcase,
  Star,
  CheckCircle,
  TrendingUp,
  Eye,
  Info,
  Sparkle,
  Image as ImageIcon,
  Camera,
  CheckSquare
} from 'lucide-react';
import { subscribeToDailyState, saveDailyState, DailyStateFirebase } from './services/firebase';

// ==========================================
// DADOS & TIPAGENS DO ANJINHO ESCOLAR
// ==========================================
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
  bloodType: string;
  emergencyPhone: string;
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

export interface PedagogicalActivity {
  id: string;
  title: string;
  time: string;
  bnccCode: string;
  bnccField: string;
  description: string;
  materials: string;
  studentEngagement: 'Excelente' | 'Boa' | 'Em desenvolvimento';
  imageUrl: string;
  photosCount: number;
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
  bloodType: 'O+',
  emergencyPhone: '(11) 98765-4321',
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
    lastAdministeredAt: 'Hoje às 11:30 (12 gotas ministradas por Tia Ana)',
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
    registeredBy: 'Ana Silva (Educadora)',
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
    registeredBy: 'Ana Silva (Educadora)',
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
    registeredBy: 'Ana Silva (Educadora)',
    badge: 'BNCC EI01TS01',
    badgeColor: 'purple',
    icon: 'sparkles',
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
    description: 'Purê de abóbora, cenoura cozida e franguinho. Excelente aceitação.',
    category: 'alimentacao',
    registeredBy: 'Ana Silva (Educadora)',
    badge: 'Aceitou Tudo',
    badgeColor: 'emerald',
    icon: 'utensils',
    verified: true
  },
  {
    id: 'evt-6',
    time: '12:00',
    title: 'Soneca Restauradora',
    description: 'Dorme tranquilamente no berço individual ao som de ruído branco suave.',
    category: 'sono',
    registeredBy: 'Ana Silva (Educadora)',
    badge: 'Em Andamento',
    badgeColor: 'indigo',
    icon: 'moon',
    verified: true
  }
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'not-1',
    date: '27 de Setembro de 2026',
    title: '🌸 Festa da Primavera e Piquenique no Pátio',
    content: 'Queridas famílias, na próxima sexta-feira teremos nosso piquenique da Primavera! Convidamos as crianças a virem com roupas confortáveis e estampadas.',
    author: 'Coordenação Pedagógica',
    authorRole: 'Coordenação',
    badge: 'Geral',
    badgeColor: 'indigo'
  },
  {
    id: 'not-2',
    date: '25 de Setembro de 2026',
    title: '🧴 Reposição de Fraldas & Pomada',
    content: 'Lembramos que o pacote de fraldas da Mariana tem previsão de término para a próxima semana. Favor enviar um pacote extra na mochila.',
    author: 'Ana Silva',
    authorRole: 'Professora Titular',
    badge: 'Individual',
    badgeColor: 'amber'
  }
];

const INITIAL_ACTIVITIES: PedagogicalActivity[] = [
  {
    id: 'act-1',
    title: 'Exploração dos Sons & Chocalhos Coloridos',
    time: '09:30 - 10:15',
    bnccCode: 'EI01TS01',
    bnccField: 'Traços, Sons, Cores e Formas',
    description: 'Vivência musical com instrumentos infantis, estimulando a discriminação auditiva, ritmo e expressão corporal.',
    materials: 'Chocalhos, pandeirinhos de madeira, tapete sonoro e cantigas populares.',
    studentEngagement: 'Excelente',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&auto=format&fit=crop&q=80',
    photosCount: 4
  },
  {
    id: 'act-2',
    title: 'Tapete Tátil & Circuitos de Estimulação Motora',
    time: '14:00 - 14:45',
    bnccCode: 'EI01CG02',
    bnccField: 'Corpo, Gestos e Movimentos',
    description: 'Atividade de exploração sensorial com diferentes texturas (algodão, EVA, tecido liso e rugoso) para incentivo ao engatinhar e firmeza postural.',
    materials: 'Almofadas macias, tapetes sensoriais e rolos pedagógicos.',
    studentEngagement: 'Excelente',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=80',
    photosCount: 6
  }
];

export function App() {
  // Estados Globais e Perfil
  const [currentRole, setCurrentRole] = useState<'professor' | 'familia'>('professor');
  const [activeTab, setActiveTab] = useState<'diario' | 'direcao' | 'coordenacao' | 'arvore' | 'jornada' | 'atividades' | 'turma' | 'avisos' | 'medicamentos'>('diario');
  const [activeQuickNav, setActiveQuickNav] = useState('feeding');
  
  // Modais
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dados do Aluno e Rotina
  const [student] = useState<StudentProfile>(INITIAL_STUDENT);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [notices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [activities, setActivities] = useState<PedagogicalActivity[]>(INITIAL_ACTIVITIES);

  // Estados Dinâmicos Sincronizados
  const [waterMl, setWaterMl] = useState<number>(150);
  const [bottleDone, setBottleDone] = useState<boolean>(true);
  const [bottleVolume, setBottleVolume] = useState<number>(180);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(18240); // 05h 04m
  const [temperature, setTemperature] = useState<number>(36.5);
  const [mood, setMood] = useState<'Alegre' | 'Calmo / Sereno' | 'Sonolento' | 'Choroso'>('Calmo / Sereno');
  const [napStatus, setNapStatus] = useState<string>('Dormindo no Berço');
  const [napStartTime, setNapStartTime] = useState<string>('12:00');
  const [diaperStatus, setDiaperStatus] = useState<string>('Xixi + Pomada');
  const [entryTime, setEntryTime] = useState<string>('07:30');
  const [exitTime, setExitTime] = useState<string>('17:30');

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

  // Cronômetro de Permanência
  useEffect(() => {
    let interval: any = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused]);

  // Sincronização em Tempo Real com Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDailyState(student.id, (state: DailyStateFirebase) => {
      if (state.waterMl !== undefined) setWaterMl(state.waterMl);
      if (state.bottleDone !== undefined) setBottleDone(state.bottleDone);
      if (state.bottleVolume !== undefined) setBottleVolume(state.bottleVolume);
      if (state.isTimerRunning !== undefined) setIsPaused(!state.isTimerRunning);
      if (state.elapsedSeconds !== undefined) setElapsedSeconds(state.elapsedSeconds);
      if (state.temperature !== undefined) {
        const parsed = parseFloat(state.temperature);
        if (!isNaN(parsed)) setTemperature(parsed);
      }
      if (state.mood !== undefined) setMood(state.mood as any);
      if (state.sleepStatus !== undefined) setNapStatus(state.sleepStatus);
      if (state.diaperStatus !== undefined) setDiaperStatus(state.diaperStatus);
    });

    return () => unsubscribe();
  }, [student.id]);

  // Formatador de Cronômetro
  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Funções de Interação e Persistência
  const handleAddWater = (amount: number) => {
    const newAmount = Math.max(0, Math.min(1000, waterMl + amount));
    setWaterMl(newAmount);
    saveDailyState(student.id, { waterMl: newAmount });

    const newEvt: TimelineEvent = {
      id: `water-${Date.now()}`,
      time: currentTime,
      title: `Hidratação Registrada (+${amount > 0 ? amount : amount}ml)`,
      description: `Mariana bebeu água fresca na jarrinha escolar. Total acumulado no dia: ${newAmount}ml.`,
      category: 'alimentacao',
      registeredBy: 'Ana Silva (Educadora)',
      badge: `${newAmount}ml no Dia`,
      badgeColor: 'teal',
      icon: 'droplets',
      verified: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleResetWater = () => {
    setWaterMl(0);
    saveDailyState(student.id, { waterMl: 0 });
  };

  const handleToggleBottle = () => {
    const nextState = !bottleDone;
    setBottleDone(nextState);
    saveDailyState(student.id, { bottleDone: nextState });

    if (nextState) {
      const newEvt: TimelineEvent = {
        id: `bottle-${Date.now()}`,
        time: currentTime,
        title: `Mamadeira APLV Concluída (${bottleVolume}ml)`,
        description: `Fórmula sem lactose ingerida com sucesso por Mariana.`,
        category: 'alimentacao',
        registeredBy: 'Ana Silva (Educadora)',
        badge: 'Nutrição Concluída',
        badgeColor: 'emerald',
        icon: 'bottle',
        verified: true
      };
      setTimelineEvents(prev => [newEvt, ...prev]);
    }
  };

  const handleSelectBottleVolume = (vol: number) => {
    setBottleVolume(vol);
    saveDailyState(student.id, { bottleVolume: vol });
  };

  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    saveDailyState(student.id, { isTimerRunning: !next, elapsedSeconds });
  };

  const handleResetTimer = () => {
    setElapsedSeconds(0);
    saveDailyState(student.id, { elapsedSeconds: 0 });
  };

  const handleSetEntryTime = () => {
    setEntryTime(currentTime);
    const newEvt: TimelineEvent = {
      id: `entry-${Date.now()}`,
      time: currentTime,
      title: 'Registro de Entrada Confirmado',
      description: `Mariana deu entrada no Colégio Pequeno Anjo às ${currentTime}.`,
      category: 'geral',
      registeredBy: 'Portaria & Ana Silva',
      badge: 'Entrada Oficial',
      badgeColor: 'emerald',
      icon: 'baby',
      verified: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleSetExitTime = () => {
    setExitTime(currentTime);
    const newEvt: TimelineEvent = {
      id: `exit-${Date.now()}`,
      time: currentTime,
      title: 'Registro de Saída & Entrega',
      description: `Mariana foi entregue aos responsáveis legais (${student.responsible}) às ${currentTime}.`,
      category: 'geral',
      registeredBy: 'Portaria & Ana Silva',
      badge: 'Saída Autorizada',
      badgeColor: 'purple',
      icon: 'shield',
      verified: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleSetTemperature = (temp: number) => {
    setTemperature(temp);
    saveDailyState(student.id, { temperature: temp.toString() });
  };

  const handleSetMood = (m: 'Alegre' | 'Calmo / Sereno' | 'Sonolento' | 'Choroso') => {
    setMood(m);
    saveDailyState(student.id, { mood: m });
  };

  const handleSetDiaper = (dp: string) => {
    setDiaperStatus(dp);
    saveDailyState(student.id, { diaperStatus: dp });

    const newEvt: TimelineEvent = {
      id: `diaper-${Date.now()}`,
      time: currentTime,
      title: `Troca de Fralda (${dp})`,
      description: `Troca realizada no fraldário. Higienização completa e pomada aplicada.`,
      category: 'higiene',
      registeredBy: 'Ana Silva (Educadora)',
      badge: dp,
      badgeColor: 'teal',
      icon: 'droplets',
      verified: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleUpdateMeal = (mealId: string, status: MealStatus['status']) => {
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, status } : m));
    const mealName = meals.find(m => m.id === mealId)?.name || 'Refeição';
    const newEvt: TimelineEvent = {
      id: `meal-${Date.now()}`,
      time: currentTime,
      title: `${mealName}: ${status}`,
      description: `Registro alimentar atualizado pela educadora responsável.`,
      category: 'alimentacao',
      registeredBy: 'Ana Silva (Educadora)',
      badge: status,
      badgeColor: status === 'ACEITOU TUDO' ? 'emerald' : status === 'PARCIAL' ? 'amber' : 'rose',
      icon: 'utensils',
      verified: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleAdministerMedication = (medId: string) => {
    setMedications(prev => prev.map(m => {
      if (m.id === medId) {
        return {
          ...m,
          status: 'administered',
          lastAdministeredAt: `Hoje às ${currentTime} (${m.dose} por Tia Ana)`,
          lastAdministeredBy: 'Ana Silva'
        };
      }
      return m;
    }));

    const newEvt: TimelineEvent = {
      id: `med-${Date.now()}`,
      time: currentTime,
      title: 'Medicamento Ministrado com Validação de PIN',
      description: 'Paracetamol gotas administrado conforme autorização e prescrição médica.',
      category: 'medicamento',
      registeredBy: 'Ana Silva (Educadora)',
      badge: 'PIN #7842 Validado',
      badgeColor: 'rose',
      icon: 'pill',
      verified: true
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
  };

  const handleSelectQuickNav = (id: string) => {
    setActiveQuickNav(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const percentWater = Math.min(100, Math.round((waterMl / 600) * 100));
  const cupsCount = Math.floor(waterMl / 50);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 font-sans pb-28 antialiased selection:bg-[#5B46EB] selection:text-white">
      
      {/* 1. TOPO CABEÇALHO ROXO (PADRÃO OFICIAL ANJINHO ESCOLAR) */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#4A329A] via-[#5B46EB] to-[#7B42F6] text-white shadow-md">
        
        {/* Barra Superior Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Botão Menu Hambúrguer */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menu lateral"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition cursor-pointer border border-white/20"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                👼
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-xs">
                    Anjinho Escolar
                  </h1>
                  <span className="text-[10px] bg-amber-400/30 text-amber-200 font-extrabold px-1.5 py-0.5 rounded-md border border-amber-300/40 uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100/90 font-medium hidden sm:block">
                  Onde a infância é registrada para sempre
                </p>
              </div>
            </div>
          </div>

          {/* Botões do Topo: Anjinha Aura, Perfil & PIN */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsAuraOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer border border-amber-300"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Anjinha Aura</span>
              <span className="sm:hidden">Aura</span>
            </button>

            {/* Perfil Selecionado */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <img
                src={student.teacherPhoto}
                alt={student.teacherName}
                className="w-7 h-7 rounded-full object-cover border border-white"
              />
              <div className="text-left hidden md:block leading-none">
                <span className="text-xs font-bold text-white block">{student.teacherName}</span>
                <span className="text-[10px] text-indigo-200">{currentRole === 'professor' ? 'Educadora' : 'Responsável'}</span>
              </div>
            </div>

            {/* Validação de PIN */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300 border border-amber-400/40 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PIN #7842</span>
            </button>
          </div>
        </div>

        {/* Abas com Painel da Direção, Coordenação, Árvore da Infância, Jornada e Atividades */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-1 border-t border-white/10 text-xs font-bold">
          {[
            { id: 'diario', label: 'Diário Escolar', icon: BookOpen },
            { id: 'direcao', label: 'Painel da Direção', icon: Briefcase },
            { id: 'coordenacao', label: 'Coordenação Pedagógica', icon: GraduationCap },
            { id: 'arvore', label: 'Árvore da Infância', icon: TreePine },
            { id: 'jornada', label: 'Jornada do Anjinho', icon: Compass },
            { id: 'atividades', label: 'Atividades Pedagógicas', icon: Award },
            { id: 'turma', label: 'Turma & Alunos', icon: Users },
            { id: 'avisos', label: 'Mural de Avisos', icon: Bell },
            { id: 'medicamentos', label: 'Medicamentos', icon: Pill },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'diario') handleSelectQuickNav('feeding');
                  else if (tab.id === 'avisos') handleSelectQuickNav('notices');
                  else if (tab.id === 'medicamentos') handleSelectQuickNav('medications');
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

        {/* Subcabeçalho Violeta (#1C164C) */}
        <div className="bg-[#1C164C] px-4 sm:px-6 lg:px-8 py-2.5 border-t border-indigo-950/60 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={student.photoUrl}
                    alt={student.name}
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
                      onClick={() => setIsPinModalOpen(true)}
                      className="text-[10px] text-amber-400 font-extrabold hover:underline cursor-pointer"
                    >
                      TROCAR ▾
                    </button>
                  </div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>{student.name}</span>
                    <span className="text-[11px] font-normal text-indigo-300">{student.birthDate} ({student.ageFormatted})</span>
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
                onClick={() => setIsPinModalOpen(true)}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca rápida: digite nome da criança, sala ou responsável..."
                className="w-full bg-[#130E36] text-white placeholder-indigo-300/70 text-xs rounded-xl pl-9 pr-9 py-2 border border-indigo-800/60 focus:outline-none focus:ring-1 focus:ring-indigo-400"
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

      {/* 2. CONTAINER PRINCIPAL */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 🏢 SEÇÃO: PAINEL DA DIREÇÃO GERAL (Quando a aba 'direcao' está ativa) */}
        {activeTab === 'direcao' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-700/50">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-indigo-300 border border-indigo-400/30">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Painel Executivo da Direção Escolar & Governança</h2>
                    <p className="text-xs text-indigo-200">Visão integrada de conformidade jurídica, capacidade de vagas, presença em tempo real e segurança institucional.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Auditoria Geral (PDF)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase block">Ocupação de Vagas</span>
                  <span className="text-2xl font-black text-white">96%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">48 de 50 vagas preenchidas</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase block">Conformidade Legal</span>
                  <span className="text-2xl font-black text-emerald-400">100%</span>
                  <span className="text-[10px] text-indigo-200 block mt-1">Todos os diários auditados</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase block">Medicamentos com PIN</span>
                  <span className="text-2xl font-black text-amber-300">100%</span>
                  <span className="text-[10px] text-indigo-200 block mt-1">Validação médica rigorosa</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase block">Presença Hoje</span>
                  <span className="text-2xl font-black text-white">94.5%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Berçário & Maternal</span>
                </div>
              </div>
            </div>

            {/* Quadro de Auditoria Institucional das Salas */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Salas de Aula & Monitoramento em Tempo Real</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { sala: 'Berçário A (0 a 1 ano)', educadora: 'Carla Dias', alunos: '12 / 12', status: 'Conformidade 100%', cor: 'emerald' },
                  { sala: 'Berçário B (1 a 2 anos)', educadora: 'Ana Silva', alunos: '14 / 15', status: 'Conformidade 100%', cor: 'emerald' },
                  { sala: 'Maternal I (2 a 3 anos)', educadora: 'Juliana Castro', alunos: '22 / 23', status: 'Conformidade 100%', cor: 'emerald' }
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{s.sala}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{s.status}</span>
                    </div>
                    <div className="text-xs text-slate-600">Educadora Titular: <strong>{s.educadora}</strong></div>
                    <div className="text-xs text-slate-600">Lotação: <strong>{s.alunos} crianças</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 👩‍🏫 SEÇÃO: COORDENAÇÃO PEDAGÓGICA & BNCC (Quando a aba 'coordenacao' está ativa) */}
        {activeTab === 'coordenacao' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Planejamento Pedagógico & Alinhamento com a BNCC</h2>
                  <p className="text-xs text-slate-500">Validação, acompanhamento e registro das experiências da primeira infância</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <span className="text-xs font-black text-indigo-950">EI01TS01 • Traços, Sons, Cores e Formas</span>
                  <p className="text-xs text-slate-600">Exploração e discriminação sonora através de instrumentos musicais infantis e cantigas tradicionais.</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 inline-block">Executada Hoje por Tia Ana</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <span className="text-xs font-black text-emerald-950">EI01CG02 • Corpo, Gestos e Movimentos</span>
                  <p className="text-xs text-slate-600">Desenvolvimento da coordenação motora ampla com tapetes táteis e circuitos macios.</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 inline-block">Planejada para Amanhã</span>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                  <span className="text-xs font-black text-purple-950">EI01EO03 • O Eu, o Outro e o Nós</span>
                  <p className="text-xs text-slate-600">Interação afetiva na rodinha de acolhimento e reconhecimento do próprio corpinho e dos colegas.</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 inline-block">Em Acompanhamento Diário</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                  <span className="text-xs font-black text-amber-950">EI01EF01 • Escuta, Fala, Pensamento e Imaginação</span>
                  <p className="text-xs text-slate-600">Contação de histórias com fantoches de tecido macio e entonação de voz expressiva.</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 inline-block">Sexta-feira Cultural</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🌳 SEÇÃO: ÁRVORE DA INFÂNCIA (Quando a aba 'arvore' está ativa) */}
        {activeTab === 'arvore' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-b from-emerald-50 to-teal-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md">
                  🌳
                </div>
                <div>
                  <h2 className="text-xl font-black text-emerald-950">Árvore da Infância • {student.name}</h2>
                  <p className="text-xs text-emerald-800">Mapa vivo de desenvolvimento socioemocional, motor e cognitivo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">🍃 Expressão & Linguagem</span>
                    <span className="text-xs font-black text-emerald-600">85%</span>
                  </div>
                  <p className="text-xs text-slate-600">Emite balbucios expressivos, responde ao próprio nome e reconhece a voz dos educadores.</p>
                  <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">🌿 Coordenação & Movimento</span>
                    <span className="text-xs font-black text-emerald-600">90%</span>
                  </div>
                  <p className="text-xs text-slate-600">Senta-se sem apoio, engatinha com firmeza e segura pequenos objetos com a pinça digital.</p>
                  <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">🌸 Vínculo & Socioafetivo</span>
                    <span className="text-xs font-black text-emerald-600">95%</span>
                  </div>
                  <p className="text-xs text-slate-600">Interage com os colegas na rodinha, sorri durante o acolhimento e aceita o colinho com serenidade.</p>
                  <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 SEÇÃO: JORNADA DO ANJINHO (Quando a aba 'jornada' está ativa) */}
        {activeTab === 'jornada' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Jornada do Anjinho • Linha de Conquistas</h2>
                  <p className="text-xs text-slate-500">Marcos afetivos da adaptação e descobertas da Mariana no Colégio Pequeno Anjo</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { data: '15/08/2026', titulo: 'Primeiro Dia de Acolhimento', desc: 'Adaptação com a mamãe Clarice e primeiro contato com a turma do Berçário B.', badge: 'Adaptação Concluída' },
                  { data: '02/09/2026', titulo: 'Primeira Palminha na Cantiga', desc: 'Acompanhou o ritmo da música "Dona Aranha" com grande alegria.', badge: 'Marco Motor' },
                  { data: '18/09/2026', titulo: 'Autonomia Alimentar', desc: 'Segurou a colherzinha sozinha pela primeira vez durante a papinha de abóbora.', badge: 'Nutrição & Autonomia' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900">{item.titulo}</h4>
                        <span className="text-[10px] font-bold text-slate-400">{item.data}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 inline-block mt-2">{item.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🎨 SEÇÃO: ATIVIDADES PEDAGÓGICAS DO DIA */}
        {activeTab === 'atividades' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                    🎨
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Atividades Pedagógicas & Vivências BNCC</h2>
                    <p className="text-xs text-slate-500">Registro fotográfico, engajamento e relatórios de aprendizagem</p>
                  </div>
                </div>

                {currentRole === 'professor' && (
                  <button
                    onClick={() => setIsNewActivityModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#5B46EB] hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Atividade</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activities.map((act) => (
                  <div key={act.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden space-y-3">
                    <img src={act.imageUrl} alt={act.title} className="w-full h-44 object-cover" />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono">
                          {act.bnccCode}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">{act.time}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">{act.title}</h4>
                      <p className="text-xs text-slate-600">{act.description}</p>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Materiais: {act.materials}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Engajamento: {act.studentEngagement}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 👶 SEÇÃO PRINCIPAL DO DIÁRIO (CARD DO ALUNO + CRONÔMETRO + JARRINHA + REFEIÇÕES) */}
        <div id="section-hero" className="space-y-6">

          {/* Card Principal do Aluno com Cronômetro de Permanência e Botões de Entrada/Saída */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-slate-100 pb-5">
              
              {/* Foto + Informações Pessoais */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-20 h-20 rounded-3xl object-cover border-4 border-[#5B46EB]/20 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-xs">
                    EM SALA
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{student.name}</h2>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                      {student.roomName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nascimento: {student.birthDate} ({student.ageFormatted}) • Responsável: <strong>{student.responsible}</strong>
                  </p>
                  <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{student.allergyNotice}</span>
                  </p>
                </div>
              </div>

              {/* Bloco Cronômetro de Permanência e Botões */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Permanência em Tempo Real
                  </span>
                  <div className="text-2xl font-black font-mono text-[#5B46EB]">
                    {formatTimer(elapsedSeconds)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={handleTogglePause}
                    aria-label={isPaused ? "Retomar cronômetro" : "Pausar cronômetro"}
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer shadow-2xs"
                  >
                    {isPaused ? <Play className="w-4 h-4 text-emerald-600 fill-current" /> : <Pause className="w-4 h-4 text-amber-600 fill-current" />}
                  </button>
                  <button
                    onClick={handleResetTimer}
                    aria-label="Reiniciar cronômetro"
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                  </button>
                  
                  {currentRole === 'professor' && (
                    <>
                      <button
                        onClick={handleSetEntryTime}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Entrada ({entryTime})</span>
                      </button>
                      <button
                        onClick={handleSetExitTime}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Saída ({exitTime})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Sub-barra de Status Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-400 block uppercase">Educadora</span>
                <span className="text-xs font-black text-indigo-950">{student.teacherName}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-500 block uppercase">Tipo Sanguíneo</span>
                <span className="text-xs font-black text-emerald-950">{student.bloodType}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-500 block uppercase">Emergência</span>
                <span className="text-xs font-black text-amber-950">{student.emergencyPhone}</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                <span className="text-[10px] font-bold text-purple-500 block uppercase">PIN Autorizado</span>
                <span className="text-xs font-black text-purple-950">#7842 (Válido)</span>
              </div>
            </div>
          </div>

          {/* 🍼 JARRINHA DE ÁGUA, MAMADEIRA E REFEIÇÕES */}
          <div id="section-feeding" className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Jarrinha de Água & Mamadeira */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg">
                    💧
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Jarrinha de Hidratação</h3>
                    <p className="text-xs text-slate-500 font-medium">Meta diária recomendada: 600ml</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-sky-600 font-mono">{waterMl}</span>
                  <span className="text-xs font-bold text-slate-400"> / 600ml</span>
                </div>
              </div>

              {/* Barra de Progresso Visual da Jarrinha */}
              <div className="space-y-2">
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentWater}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>{percentWater}% da meta alcançada</span>
                  <span>{cupsCount} copinhos de 50ml</span>
                </div>
              </div>

              {/* Botões de Ação da Água */}
              {currentRole === 'professor' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleAddWater(50)}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-black border border-sky-200 transition cursor-pointer"
                  >
                    +50ml (1 Copo)
                  </button>
                  <button
                    onClick={() => handleAddWater(100)}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-black border border-sky-200 transition cursor-pointer"
                  >
                    +100ml (2 Copos)
                  </button>
                  <button
                    onClick={() => handleAddWater(150)}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    +150ml (Jarrinha)
                  </button>
                  <button
                    onClick={handleResetWater}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                    title="Zerar água"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mamadeira APLV */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍼</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Mamadeira Hipoalergênica (Sem Lactose)</h4>
                      <p className="text-[10px] text-slate-400">Fórmula especial para dieta restritiva</p>
                    </div>
                  </div>
                  <button
                    disabled={currentRole !== 'professor'}
                    onClick={handleToggleBottle}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      bottleDone ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {bottleDone ? '✓ 180ml Tomou Tudo' : 'Registrar Mamadeira'}
                  </button>
                </div>
              </div>
            </div>

            {/* Alimentação & Cardápio Nutricional */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                    🍲
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Refeições & Alimentação</h3>
                    <p className="text-xs text-slate-500 font-medium">Controle de aceitação e papinhas</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm shadow-2xs">
                        {meal.icon === 'apple' ? '🍎' : meal.icon === 'utensils' ? '🥣' : meal.icon === 'sun' ? '🍊' : '🍲'}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-none">{meal.name}</h4>
                        <span className="text-[10px] text-amber-600 font-bold">{meal.status}</span>
                      </div>
                    </div>

                    {currentRole === 'professor' ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateMeal(meal.id, 'ACEITOU TUDO')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            meal.status === 'ACEITOU TUDO' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          Aceitou
                        </button>
                        <button
                          onClick={() => handleUpdateMeal(meal.id, 'PARCIAL')}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            meal.status === 'PARCIAL' ? 'bg-amber-500 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          1/2
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        meal.status === 'ACEITOU TUDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {meal.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
                      className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black transition shadow-xs cursor-pointer"
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
        <div id="section-timeline" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              currentRole === 'professor' ? 'bg-[#5B46EB] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👩‍🏫 Professora / Educador
          </button>
          <button
            onClick={() => setCurrentRole('familia')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              currentRole === 'familia' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👨‍👩‍👧 Família / Pais
          </button>
        </div>
      </footer>

      {/* 🌟 DRAWER LATERAL DO MENU HAMBÚRGUER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-80 max-w-full bg-slate-900 text-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#5B46EB] flex items-center justify-center text-xl">👼</div>
                  <div>
                    <h3 className="font-black text-white text-base">Anjinho Escolar</h3>
                    <p className="text-xs text-indigo-300 font-medium">Painel Administrativo & Pedagógico</p>
                  </div>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 text-xs font-bold">
                {[
                  { label: 'Diário Escolar Completo', icon: BookOpen, action: () => { setActiveTab('diario'); handleSelectQuickNav('timeline'); setIsMenuOpen(false); } },
                  { label: 'Painel da Direção Geral', icon: Briefcase, action: () => { setActiveTab('direcao'); setIsMenuOpen(false); } },
                  { label: 'Coordenação Pedagógica (BNCC)', icon: GraduationCap, action: () => { setActiveTab('coordenacao'); setIsMenuOpen(false); } },
                  { label: 'Árvore da Infância', icon: TreePine, action: () => { setActiveTab('arvore'); setIsMenuOpen(false); } },
                  { label: 'Jornada do Anjinho', icon: Compass, action: () => { setActiveTab('jornada'); setIsMenuOpen(false); } },
                  { label: 'Atividades Pedagógicas', icon: Award, action: () => { setActiveTab('atividades'); setIsMenuOpen(false); } },
                  { label: 'Gerenciar Turmas & Alunos', icon: Users, action: () => { setActiveTab('turma'); handleSelectQuickNav('hero'); setIsMenuOpen(false); } },
                  { label: 'Mural de Avisos & Circulares', icon: Bell, action: () => { setActiveTab('avisos'); handleSelectQuickNav('notices'); setIsMenuOpen(false); } },
                  { label: 'Medicamentos & Prescrições', icon: Pill, action: () => { setActiveTab('medicamentos'); handleSelectQuickNav('health'); setIsMenuOpen(false); } },
                  { label: 'Relatórios & Exportações PDF', icon: FileSpreadsheet, action: () => { setIsReportModalOpen(true); setIsMenuOpen(false); } },
                  { label: 'Anjinha Aura (IA Pedagógica)', icon: Sparkles, action: () => { setIsAuraOpen(true); setIsMenuOpen(false); } },
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
            <div className="pt-4 border-t border-slate-800">
              <button onClick={() => { setIsPinModalOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-amber-300 cursor-pointer">
                <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Validar PIN Legal</span>
                <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded text-amber-300">#7842</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />
        </div>
      )}

      {/* 👼 MODAL ANJINHA AURA */}
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
              <button onClick={() => setIsAuraOpen(false)} className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
              <p className="font-bold text-amber-950 leading-relaxed text-xs">
                "Olá, Professora Ana! Verifiquei a rotina da Mariana Souza: lanchinho realizado com sucesso, 150ml de água consumidos e permanência acompanhada em tempo real com a família."
              </p>
            </div>
            <button onClick={() => setIsAuraOpen(false)} className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition cursor-pointer">
              Compreendido, obrigada Aura!
            </button>
          </div>
        </div>
      )}

      {/* 🔑 MODAL DE VALIDAÇÃO DE PIN LEGAL */}
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
              <button onClick={() => { setIsPinModalOpen(false); setPinSuccess(false); setPinInput(''); }} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {pinSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-black text-emerald-900">PIN Validado com Sucesso!</div>
                <p className="text-[11px] text-emerald-700">Autorização registrada (#7842).</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Digite o PIN cadastrado pelos responsáveis para autorizações restritas:
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
                    setPinSuccess(true);
                    setTimeout(() => {
                      setIsPinModalOpen(false);
                      setPinSuccess(false);
                      setPinInput('');
                    }, 1200);
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

      {/* 📄 MODAL DE RELATÓRIO DIÁRIO */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Relatório Diário do Aluno</h3>
                <p className="text-xs text-slate-500 font-medium">Mariana Souza • Berçário B</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
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
                className="flex-1 py-3 rounded-2xl bg-[#5B46EB] hover:bg-indigo-700 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer"
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
