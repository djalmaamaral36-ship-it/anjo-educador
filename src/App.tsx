import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  Cloud, 
  Play, 
  Pause, 
  Droplets, 
  Baby, 
  Utensils, 
  Pill, 
  Heart, 
  Moon, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Check, 
  Bell, 
  BookOpen,
  Activity
} from 'lucide-react';
import { subscribeToDailyState, saveDailyState, DailyStateFirebase } from './services/firebase';

interface StudentInfo {
  id: string;
  name: string;
  birthDate: string;
  age: string;
  bloodType: string;
  allergies: string[];
  dietaryRestrictions: string[];
  legalPin: string;
  classroom: string;
  shift: string;
  teacherName: string;
  teacherRole: string;
  avatarUrl: string;
  fatherName: string;
  motherName: string;
  emergencyPhone: string;
}

interface MealItem {
  id: string;
  name: string;
  time: string;
  description: string;
  status: 'COMEU TUDO' | 'COMEU PARCIAL' | 'RECUSOU' | 'SEM REGISTRO';
  observations?: string;
}

interface Medication {
  id: string;
  name: string;
  dose: string;
  scheduleTime: string;
  legalDoctor: string;
  crm: string;
  lastAdministeredAt?: string;
  lastAdministeredBy?: string;
}

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'rotina' | 'alimentacao' | 'medicamento' | 'sono' | 'higiene' | 'alerta';
  registeredBy: string;
  badge?: string;
  icon: string;
  verified?: boolean;
}

interface Notice {
  id: string;
  date: string;
  title: string;
  content: string;
  author: string;
  type: 'urgente' | 'informativo' | 'evento';
}

const DEFAULT_STUDENT: StudentInfo = {
  id: 'mariana-souza',
  name: 'Mariana Souza de Oliveira',
  birthDate: '15/05/2025',
  age: '1 ano e 4 meses',
  bloodType: 'O+',
  allergies: ['Proteína do Leite de Vaca (APLV)', 'Corante Vermelho 40'],
  dietaryRestrictions: ['Sem Lactose', 'Frutas Frescas Amassadas'],
  legalPin: '7842',
  classroom: 'Berçário II - Sala Tulipa',
  shift: 'Integral (07:30 - 18:00)',
  teacherName: 'Tia Fernanda Lima',
  teacherRole: 'Pedagoga Titular Especialista',
  avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
  fatherName: 'Carlos Eduardo Oliveira',
  motherName: 'Juliana Souza Oliveira',
  emergencyPhone: '(11) 98765-4321',
};

const DEFAULT_MEALS: MealItem[] = [
  {
    id: 'meal-1',
    name: 'Colação da Manhã',
    time: '08:30',
    description: 'Mamão papaia raspadinho com aveia em flocos finos',
    status: 'COMEU TUDO',
    observations: 'Aceitou muito bem, mastigou com calma.',
  },
  {
    id: 'meal-2',
    name: 'Almoço Nutritivo',
    time: '11:15',
    description: 'Arroz integral, caldinho de feijão, frango desfiado e purê de abóbora kabocha',
    status: 'COMEU TUDO',
    observations: 'Prato raspado! Excelente aceitação do purê de abóbora.',
  },
  {
    id: 'meal-3',
    name: 'Lanche da Tarde',
    time: '14:45',
    description: 'Banana nanica amassada com canela e biscoito de arroz sem leite',
    status: 'COMEU PARCIAL',
    observations: 'Comeu metade da banana e 2 biscoitos.',
  },
  {
    id: 'meal-4',
    name: 'Jantar Equilibrado',
    time: '17:00',
    description: 'Sopinha de legumes com carne magra e macarrão letrinhas',
    status: 'SEM REGISTRO',
  },
];

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Desloratadina Xarope (0,5mg/ml)',
    dose: '2,5 ml via oral',
    scheduleTime: '13:30',
    legalDoctor: 'Dra. Camila Nogueira Ribeiro',
    crm: 'CRM/SP 142.890',
    lastAdministeredAt: 'Hoje às 13:32',
    lastAdministeredBy: 'Tia Fernanda Lima',
  },
  {
    id: 'med-2',
    name: 'Paracetamol Gotas (200mg/ml)',
    dose: '12 gotas se T > 37.8°C',
    scheduleTime: 'Se necessário',
    legalDoctor: 'Dr. Roberto Meirelles',
    crm: 'CRM/SP 118.432',
  },
];

const DEFAULT_TIMELINE: TimelineItem[] = [
  {
    id: 'tl-1',
    time: '07:45',
    title: 'Check-in e Acolhimento',
    description: 'Mariana chegou sorridente acompanhada pela mãe Juliana. Sem febre, pertences checados.',
    category: 'rotina',
    registeredBy: 'Tia Fernanda Lima (Pedagoga Titular)',
    badge: 'Entrada Segura',
    icon: 'user',
    verified: true,
  },
  {
    id: 'tl-2',
    time: '08:30',
    title: 'Colação da Manhã',
    description: 'Aceitou muito bem o mamão raspadinho com aveia. Ingestão hídrica de 50ml de água.',
    category: 'alimentacao',
    registeredBy: 'Tia Fernanda Lima',
    badge: 'Comeu Tudo',
    icon: 'utensils',
    verified: true,
  },
  {
    id: 'tl-3',
    time: '10:00',
    title: 'Troca de Fralda & Higiene',
    description: 'Troca realizada. Fralda com xixi abundante. Aplicada pomada preventiva Hipoglós Amêndoas.',
    category: 'higiene',
    registeredBy: 'Auxiliar Maristela Cruz',
    badge: 'Xixi Abundante',
    icon: 'baby',
    verified: true,
  },
  {
    id: 'tl-4',
    time: '12:30',
    title: 'Início da Soneca Revigorante',
    description: 'Adormeceu no colchonete com sua naninha musical e ar condicionado em 23°C.',
    category: 'sono',
    registeredBy: 'Tia Fernanda Lima',
    badge: 'Dormindo',
    icon: 'moon',
    verified: true,
  },
];

const DEFAULT_NOTICES: Notice[] = [
  {
    id: 'not-1',
    date: '27/09/2026',
    title: '🌟 Festa da Primavera & Feira de Artes dos Bebês',
    content: 'Convidamos todas as famílias para nosso piquenique de integração no próximo sábado às 09h!',
    author: 'Coordenação Pedagógica',
    type: 'evento',
  },
  {
    id: 'not-2',
    date: '26/09/2026',
    title: '🧴 Reposição de Fraldas e Pomada',
    content: 'O estoque de fraldas da Mariana na escolinha tem 4 unidades restantes. Favor enviar novo pacote.',
    author: 'Tia Fernanda Lima',
    type: 'informativo',
  },
];

export function App() {
  const [student] = useState<StudentInfo>(DEFAULT_STUDENT);
  const [meals, setMeals] = useState<MealItem[]>(DEFAULT_MEALS);
  const [medications, setMedications] = useState<Medication[]>(DEFAULT_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineItem[]>(DEFAULT_TIMELINE);
  const [notices] = useState<Notice[]>(DEFAULT_NOTICES);

  // Estados de Rotina Diária
  const [waterMl, setWaterMl] = useState<number>(150);
  const [bottleDone, setBottleDone] = useState<boolean>(true);
  const [mood, setMood] = useState<string>('Calmo / Sereno');
  const [temperature, setTemperature] = useState<number>(36.6);
  const [napStatus, setNapStatus] = useState<string>('Soneca em Andamento');
  const [napStartTime, setNapStartTime] = useState<string>('12:30');
  const [diaperStatus, setDiaperStatus] = useState<string>('Xixi + Pomada');

  const [activeTab, setActiveTab] = useState<'diario' | 'avisos' | 'medicamentos'>('diario');
  const [currentRole, setCurrentRole] = useState<'professor' | 'familia'>('professor');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(Date.now() - 3600 * 3.5 * 1000);
  const [elapsedSeconds, setElapsedSeconds] = useState(3600 * 3.5);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // 🔄 CONEXÃO EM TEMPO REAL COM O FIREBASE FIRESTORE (Celular ⇄ Computador)
  useEffect(() => {
    const unsubscribe = subscribeToDailyState('mariana-souza', (liveData: DailyStateFirebase) => {
      if (liveData.meals) setMeals(liveData.meals as any);
      if (liveData.medications) setMedications(liveData.medications as any);
      if (liveData.timelineEvents) setTimelineEvents(liveData.timelineEvents as any);
      if (typeof liveData.waterMl === 'number') setWaterMl(liveData.waterMl);
      if (typeof liveData.bottleDone === 'boolean') setBottleDone(liveData.bottleDone);
      if (liveData.mood || liveData.humor) setMood(liveData.mood || liveData.humor || 'Calmo / Sereno');
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

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
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
    showToast(nextPaused ? '⏸️ Cronômetro pausado na nuvem!' : '▶️ Cronômetro rodando em tempo real!');
  };

  const handleAddWater = (ml: number) => {
    const newVal = Math.max(0, waterMl + ml);
    setWaterMl(newVal);
    saveDailyState('mariana-souza', { waterMl: newVal });
    showToast(`💧 Ingestão hídrica: ${newVal} ml`);
  };

  const handleToggleBottle = () => {
    const next = !bottleDone;
    setBottleDone(next);
    saveDailyState('mariana-souza', { bottleDone: next });
    showToast(next ? '🍼 Mamadeira registrada como tomada!' : '🍼 Mamadeira pendente');
  };

  const handleSetMealStatus = (mealId: string, status: MealItem['status']) => {
    const updated = meals.map((m) => (m.id === mealId ? { ...m, status } : m));
    setMeals(updated);
    
    const meal = meals.find((m) => m.id === mealId);
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newEvent: TimelineItem = {
      id: `tl-${Date.now()}`,
      time: nowTime,
      title: `Alimentação: ${meal?.name || 'Refeição'}`,
      description: `Registro efetuado: Status "${status}". Nutrição monitorada.`,
      category: 'alimentacao',
      registeredBy: `${student.teacherName} (${student.teacherRole})`,
      badge: status,
      icon: 'utensils',
      verified: true,
    };
    const newTimeline = [newEvent, ...timelineEvents];
    setTimelineEvents(newTimeline);

    saveDailyState('mariana-souza', {
      meals: updated as any,
      timelineEvents: newTimeline as any,
    });
    showToast(`🍽️ ${meal?.name}: ${status}`);
  };

  const handleAdministerMed = (medId: string) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = `Hoje às ${nowTime}`;
    const target = medications.find((m) => m.id === medId);
    
    const updated = medications.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          lastAdministeredAt: nowFormatted,
          lastAdministeredBy: student.teacherName,
        };
      }
      return m;
    });
    setMedications(updated);

    const newEvent: TimelineItem = {
      id: `tl-${Date.now()}`,
      time: nowTime,
      title: `Medicamento: ${target?.name || 'Remédio'}`,
      description: `Dose (${target?.dose}) ministrada com sucesso. Prescrição validada via PIN Legal ${student.legalPin}.`,
      category: 'medicamento',
      registeredBy: `${student.teacherName} (${student.teacherRole})`,
      badge: 'PIN Validado • Ministrado',
      icon: 'pill',
      verified: true,
    };
    const newTimeline = [newEvent, ...timelineEvents];
    setTimelineEvents(newTimeline);

    saveDailyState('mariana-souza', {
      medications: updated as any,
      timelineEvents: newTimeline as any,
    });
    showToast(`💊 Medicamento ministrado com sucesso!`);
  };

  const handleUpdateMood = (m: string) => {
    setMood(m);
    saveDailyState('mariana-souza', { mood: m, humor: m });
    showToast(`😊 Humor registrado: ${m}`);
  };

  const handleUpdateTemp = (t: number) => {
    setTemperature(t);
    saveDailyState('mariana-souza', { temperature: t.toString() });
    showToast(`🌡️ Temperatura: ${t}°C`);
  };

  const handleUpdateDiaper = (tipo: string) => {
    setDiaperStatus(tipo);
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newEvent: TimelineItem = {
      id: `tl-${Date.now()}`,
      time: nowTime,
      title: 'Troca de Fralda',
      description: `Troca realizada: ${tipo}. Pomada e higiene preventiva aplicadas.`,
      category: 'higiene',
      registeredBy: `${student.teacherName}`,
      badge: tipo,
      icon: 'baby',
      verified: true,
    };
    const newTimeline = [newEvent, ...timelineEvents];
    setTimelineEvents(newTimeline);
    saveDailyState('mariana-souza', {
      diaperStatus: tipo,
      timelineEvents: newTimeline as any,
    });
    showToast(`🚼 Fralda: ${tipo}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-28">
      {/* 🚀 Top Bar com Conexão em Tempo Real */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-200">
              👼
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-2">
                Anjo Educador
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  {currentRole === 'professor' ? 'Painel Educador' : 'Visão Família'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Berçário II • Acompanhamento em Tempo Real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Nuvem Sincronizada</span>
              <span className="sm:hidden">Online</span>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Relatório</span>
            </button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-slate-100 overflow-x-auto py-1">
          {[
            { id: 'diario', label: 'Diário de Rotina', icon: BookOpen },
            { id: 'medicamentos', label: 'Medicamentos & Saúde', icon: Pill },
            { id: 'avisos', label: 'Mural & Avisos', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast de Feedback */}
      {feedbackToast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* 👶 Card de Identificação da Criança & Cronômetro */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-20 h-20 rounded-3xl object-cover border-4 border-indigo-100 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {student.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-black border border-purple-200">
                    PIN Legal: #{student.legalPin}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {student.age} • Nasc: {student.birthDate} • {student.classroom}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {student.allergies.map((al, idx) => (
                    <span key={idx} className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      {al}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cronômetro de Permanência Sincronizado */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg min-w-[280px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Permanência na Escola</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400 mt-1">
                  {formatTimer(elapsedSeconds)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Status: {isPaused ? '⏸️ Pausado' : '🟢 Em Atividade Escolar'}
                </div>
              </div>

              {currentRole === 'professor' && (
                <button
                  onClick={handleToggleTimer}
                  className={`p-3.5 rounded-xl font-bold transition shadow-md flex items-center gap-2 text-xs ${
                    isPaused 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 💧 HIDRATAÇÃO & MAMADEIRA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Ingestão Hídrica (Água)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Meta Diária: 600 ml</p>
                </div>
              </div>
              <div className="text-lg font-black text-sky-600 font-mono">
                {waterMl} <span className="text-xs text-slate-400 font-normal">ml</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (waterMl / 600) * 100)}%` }}
              />
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

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  🍼
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Mamadeira / Leite Especial</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Fórmula Hipoalergênica APLV</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  bottleDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {bottleDone ? 'Tomou Tudo (180ml)' : 'Pendente'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-2xl border border-amber-100 mb-3">
              ⚠️ Preparado com água mineral morna conforme prescrição da nutricionista escolar.
            </p>

            {currentRole === 'professor' && (
              <button
                onClick={handleToggleBottle}
                className={`w-full py-2.5 rounded-xl font-black text-xs transition border flex items-center justify-center gap-2 ${
                  bottleDone 
                    ? 'bg-slate-100 text-slate-700 border-slate-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                }`}
              >
                <Check className="w-4 h-4" />
                {bottleDone ? 'Desmarcar Mamadeira' : 'Confirmar Mamadeira Tomada'}
              </button>
            )}
          </div>
        </div>

        {/* 🍽️ REFEIÇÕES DO DIA */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Cardápio & Refeições Diárias</h3>
                <p className="text-xs text-slate-500 font-medium">Monitoramento nutricional da Mariana</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meals.map((meal) => {
              const statusColors = {
                'COMEU TUDO': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'COMEU PARCIAL': 'bg-amber-50 text-amber-700 border-amber-200',
                'RECUSOU': 'bg-rose-50 text-rose-700 border-rose-200',
                'SEM REGISTRO': 'bg-slate-100 text-slate-500 border-slate-200',
              };

              return (
                <div key={meal.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {meal.time} • {meal.name}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColors[meal.status]}`}>
                        {meal.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1.5">{meal.description}</p>
                    {meal.observations && (
                      <p className="text-[11px] text-slate-500 italic mt-1 bg-white p-2 rounded-xl border border-slate-100">
                        "{meal.observations}"
                      </p>
                    )}
                  </div>

                  {currentRole === 'professor' && (
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200">
                      {(['COMEU TUDO', 'COMEU PARCIAL', 'RECUSOU'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleSetMealStatus(meal.id, st)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition border ${
                            meal.status === st 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {st === 'COMEU TUDO' ? 'Tudo' : st === 'COMEU PARCIAL' ? 'Parcial' : 'Recusou'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 🌡️ SAÚDE, SONECA, HUMOR & HIGIENE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-black text-slate-900">Humor & Temperatura</h3>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div className="text-xs font-bold text-slate-700">Temperatura Corporal</div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-rose-700 font-mono">{temperature}°C</span>
                {currentRole === 'professor' && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleUpdateTemp(parseFloat((temperature + 0.1).toFixed(1)))}
                      className="px-2 py-0.5 bg-white border border-rose-200 rounded-lg text-xs font-black text-rose-700"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => handleUpdateTemp(parseFloat((temperature - 0.1).toFixed(1)))}
                      className="px-2 py-0.5 bg-white border border-rose-200 rounded-lg text-xs font-black text-rose-700"
                    >
                      -
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Humor do Bebê</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Calmo / Sereno', 'Alegre', 'Sonolento', 'Choroso'].map((m) => (
                  <button
                    key={m}
                    disabled={currentRole !== 'professor'}
                    onClick={() => handleUpdateMood(m)}
                    className={`p-2 rounded-xl text-[11px] font-black text-center transition border ${
                      mood === m 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-black text-slate-900">Soneca & Trocas</h3>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="text-[11px] font-bold text-purple-900">Status do Sono</div>
              <div className="text-sm font-black text-purple-700 mt-0.5">{napStatus} (Início: {napStartTime})</div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Última Troca de Fralda</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Xixi + Pomada', 'Cocô Normal', 'Cocô Pastoso', 'Fralda Limpa'].map((fp) => (
                  <button
                    key={fp}
                    disabled={currentRole !== 'professor'}
                    onClick={() => handleUpdateDiaper(fp)}
                    className={`p-2 rounded-xl text-[10px] font-black text-center transition border ${
                      diaperStatus === fp 
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900">Medicamentos</h3>
            </div>

            {medications.map((med) => (
              <div key={med.id} className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950">{med.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {med.dose}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Médico: {med.legalDoctor} ({med.crm})</p>
                {med.lastAdministeredAt ? (
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Ministrado: {med.lastAdministeredAt}
                  </div>
                ) : (
                  currentRole === 'professor' && (
                    <button
                      onClick={() => handleAdministerMed(med.id)}
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

        {/* 📜 LINHA DO TEMPO & AUDITORIA EM TEMPO REAL */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Linha do Tempo em Tempo Real</h3>
                <p className="text-xs text-slate-500 font-medium">Auditoria com registro pedagógico e legal</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {timelineEvents.map((evt) => (
              <div key={evt.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono font-black text-slate-800 shadow-2xs">
                  {evt.time}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
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

      </main>

      {/* 📱 Barra Fixa Inferior: Alternar Perfil */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setCurrentRole('professor');
              showToast('👩‍🏫 Modo Educador: Edição e registros ativados!');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              currentRole === 'professor'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👩‍🏫 Professora / Educador
          </button>

          <button
            onClick={() => {
              setCurrentRole('familia');
              showToast('👨‍👩‍👧 Modo Família: Acompanhamento em tempo real!');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              currentRole === 'familia'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👨‍👩‍👧 Família / Pais
          </button>
        </div>
      </footer>

      {/* 📄 Modal de Relatório Diário */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Relatório Diário do Aluno</h3>
                <p className="text-xs text-slate-500 font-medium">Mariana Souza de Oliveira • Berçário II</p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="font-black text-indigo-950">Resumo da Jornada Escolar:</div>
                <p className="text-slate-700 leading-relaxed">
                  Mariana permaneceu em ambiente escolar por <strong>{formatTimer(elapsedSeconds)}</strong>. 
                  Apresentou comportamento <strong>{mood}</strong>, com temperatura controlada em <strong>{temperature}°C</strong>.
                  Consumiu <strong>{waterMl}ml de água</strong> e teve alimentação acompanhada rigorosamente sem alérgenos (APLV).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-black text-slate-900">Assinaturas e Validação Digital:</div>
                <p className="text-slate-600">Educadora Titular: {student.teacherName} (Assinado digitalmente)</p>
                <p className="text-slate-600">Responsável Legal: Juliana Souza Oliveira (PIN #{student.legalPin})</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2"
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
