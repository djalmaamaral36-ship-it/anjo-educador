import React, { useState, useEffect } from 'react';
import { 
  INITIAL_STUDENT, 
  INITIAL_MEALS, 
  INITIAL_MEDICATIONS, 
  INITIAL_TIMELINE_EVENTS,
  INITIAL_NOTICES
} from './data/initialData';
import { MealStatus, MedicationItem, TimelineEvent, NoticeItem } from './types';
import { TimelineAuditSection } from './components/TimelineAuditSection';
import { RoutineNoticesSection } from './components/RoutineNoticesSection';
import { ConsolidatedDailySummary } from './components/ConsolidatedDailySummary';
import { 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  FileText, 
  Utensils, 
  Pill, 
  ShieldCheck, 
  Baby, 
  AlertTriangle,
  UserCheck,
  Printer,
  X,
  Plus,
  Lock,
  Search,
  BookOpen,
  Users,
  Bell,
  Calendar,
  KeyRound
} from 'lucide-react';

export function App() {
  const [student, setStudent] = useState(INITIAL_STUDENT);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('diario');
  const [currentRole, setCurrentRole] = useState<'professor' | 'familia'>('professor');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(3 * 3600 + 45 * 60);
  const [autoStartedToast, setAutoStartedToast] = useState(false);

  // Modal medicação
  const [selectedMed, setSelectedMed] = useState<MedicationItem | null>(null);
  const [medNotes, setMedNotes] = useState('');

  useEffect(() => {
    let interval: any = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (isPaused && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerBlockedNotice = () => {
    setIsPaused(false);
    setAutoStartedToast(true);
    setTimeout(() => {
      setAutoStartedToast(false);
    }, 3000);
  };

  const handleUpdateMeal = (mealId: string, status: MealStatus['status']) => {
    if (isPaused) setIsPaused(false);
    setMeals(prev => prev.map(m => (m.id === mealId ? { ...m, status } : m)));

    const meal = meals.find(m => m.id === mealId);
    if (meal && status !== 'SEM REGISTRO') {
      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setTimelineEvents(prev => [
        {
          id: `tl-meal-${Date.now()}`,
          time: nowTime,
          title: `Alimentação: ${meal.name}`,
          description: `Registro efetuado: Status "${status}". Acompanhamento nutricional completo.`,
          category: 'alimentacao',
          registeredBy: `${student.teacherName} (${student.teacherRole})`,
          badge: status,
          badgeColor: 'amber',
          icon: 'utensils',
          verified: true
        },
        ...prev
      ]);
    }
  };

  const confirmAdministerMedication = () => {
    if (!selectedMed) return;
    if (isPaused) setIsPaused(false);
    
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = `Hoje às ${nowTime}`;

    setMedications(prev =>
      prev.map(med => {
        if (med.id === selectedMed.id) {
          const newHist = {
            id: `hist-${Date.now()}`,
            timestamp: nowFormatted,
            administeredBy: `${student.teacherName} (${student.teacherRole})`,
            dose: med.dose,
            pinConfirmed: true,
            notes: medNotes || 'Dose ministrada conforme prescrição.'
          };
          return {
            ...med,
            lastAdministeredAt: nowFormatted,
            lastAdministeredBy: student.teacherName,
            history: [newHist, ...(med.history || [])]
          };
        }
        return med;
      })
    );

    setTimelineEvents(prev => [
      {
        id: `tl-med-${Date.now()}`,
        time: nowTime,
        title: `Medicamento: ${selectedMed.name}`,
        description: `Dose (${selectedMed.dose}) ministrada com sucesso. ${medNotes || 'Prescrição médica autorizada pelos pais com PIN validado.'}`,
        category: 'medicamento',
        registeredBy: `${student.teacherName} (${student.teacherRole})`,
        badge: 'PIN Legal • Ministrado',
        badgeColor: 'purple',
        icon: 'pill',
        verified: true
      },
      ...prev
    ]);

    setSelectedMed(null);
    setMedNotes('');
  };

  const handleAddTimelineEvent = (newEvent: Omit<TimelineEvent, 'id'>) => {
    if (isPaused) setIsPaused(false);
    const eventWithId: TimelineEvent = {
      ...newEvent,
      id: `tl-custom-${Date.now()}`
    };
    setTimelineEvents(prev => [eventWithId, ...prev]);
  };

  const handleAddNotice = (newNotice: Omit<NoticeItem, 'id'>) => {
    const noticeWithId: NoticeItem = {
      ...newNotice,
      id: `not-custom-${Date.now()}`
    };
    setNotices(prev => [noticeWithId, ...prev]);
  };

  const handleSelectQuickNav = (id: string) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-24 selection:bg-[#5B46EB] selection:text-white relative">
      {/* Auto start notification */}
      {autoStartedToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h5 className="font-black text-emerald-200 uppercase tracking-wide">
              Cronômetro de Aula Ativado
            </h5>
            <p className="mt-1 text-emerald-100 leading-relaxed">
              O cronômetro foi iniciado automaticamente para permitir o registro em tempo real.
            </p>
          </div>
          <button onClick={() => setAutoStartedToast(false)} className="text-emerald-300 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#5B46EB] via-[#6355EE] to-[#7B42F6] text-white shadow-lg border-b border-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-1">
              <span className="text-2xl">👼</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white">
                Anjinho Escolar
              </h1>
              <p className="text-[11px] text-indigo-100 font-medium tracking-wide mt-0.5">
                Onde a infância é registrada para sempre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 border border-amber-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
              <span>Anjinha Aura</span>
            </button>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
              <img
                src={student.teacherPhoto}
                alt={student.teacherName}
                className="w-8 h-8 rounded-full object-cover border border-white/40 shadow-xs"
              />
              <div className="text-left hidden sm:block leading-tight">
                <span className="text-xs font-black text-white">{student.teacherName}</span>
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
                  BERÇÁRIO I - A
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subheader */}
        <div className="bg-[#1C164C] px-4 sm:px-6 lg:px-8 py-2 border-t border-indigo-950/60 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-amber-400"
                />
                <span className="font-black text-white">{student.name} ({student.ageFormatted})</span>
              </div>
              <span className="text-indigo-200">|</span>
              <span className="text-amber-300 font-mono font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatTimer(elapsedSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-indigo-200 font-bold">Perfil Ativo:</span>
              <button
                onClick={() => setCurrentRole('professor')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  currentRole === 'professor' ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-white/10 text-white'
                }`}
              >
                Professora
              </button>
              <button
                onClick={() => setCurrentRole('familia')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  currentRole === 'familia' ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-white/10 text-white'
                }`}
              >
                Pais / Família
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Student Main Hero Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                Em Aula
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">{student.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200">
                  {student.roomName}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Responsável: <strong className="text-slate-800">{student.responsible}</strong> • Nasc: {student.birthDate} ({student.ageFormatted})
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{student.allergyNotice}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                isPaused
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Retomar Cronômetro' : 'Pausar Aula'}</span>
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B46EB] hover:bg-[#4E39E0] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar Boletim PDF</span>
            </button>
          </div>
        </div>

        {/* Seção 1: Alimentação & Nutrição */}
        <section id="section-meals" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Alimentação & Hidratação</h3>
                <p className="text-xs text-slate-500">Acompanhamento nutricional das refeições diárias</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">4 Refeições Programadas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {meals.map((meal) => (
              <div key={meal.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{meal.name}</span>
                  {meal.time && <span className="text-[10px] text-slate-500 font-bold">{meal.time}</span>}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-xl border border-slate-100">
                  {meal.observation || 'Sem observações adicionais.'}
                </p>

                <div className="pt-1">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                    meal.status === 'ACEITOU TUDO' ? 'bg-emerald-100 text-emerald-800' :
                    meal.status === 'ACEITOU BEM' ? 'bg-teal-100 text-teal-800' :
                    meal.status === 'RECUSOU' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {meal.status}
                  </span>
                </div>

                {currentRole === 'professor' && (
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200 text-[10px] font-bold">
                    <button
                      onClick={() => handleUpdateMeal(meal.id, 'ACEITOU TUDO')}
                      className="py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                    >
                      Tudo
                    </button>
                    <button
                      onClick={() => handleUpdateMeal(meal.id, 'ACEITOU BEM')}
                      className="py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800"
                    >
                      Bem
                    </button>
                    <button
                      onClick={() => handleUpdateMeal(meal.id, 'RECUSOU')}
                      className="py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800"
                    >
                      Recusou
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Seção 2: Medicamentos e Cuidados de Saúde */}
        <section id="section-medications" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Medicamentos & Prescrições com PIN Legal</h3>
                <p className="text-xs text-slate-500">Autorizados pelos pais com segurança e registro auditado</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              🔒 100% Protegido por PIN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {medications.map((med) => (
              <div key={med.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-900">{med.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800">
                      {med.scheduleDescription}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-purple-900 bg-purple-50 p-2 rounded-xl border border-purple-100">
                    Dose: {med.dose}
                  </p>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {med.instructions}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="text-[10px] text-slate-500">
                    {med.lastAdministeredAt ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Ministrado: {med.lastAdministeredAt}</span>
                      </span>
                    ) : (
                      <span>Nenhuma dose ministrada hoje.</span>
                    )}
                  </div>

                  {currentRole === 'professor' && (
                    <button
                      onClick={() => setSelectedMed(med)}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Ministrar Dose com PIN</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 3: Linha do Tempo e Auditoria */}
        <TimelineAuditSection
          student={student}
          events={timelineEvents}
          onAddEvent={handleAddTimelineEvent}
          currentRole={currentRole}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
        />

        {/* Seção 4: Mural de Avisos e Recados */}
        <RoutineNoticesSection
          student={student}
          notices={notices}
          onAddNotice={handleAddNotice}
          currentRole={currentRole}
        />

        {/* Seção 5: Diário Consolidado e WhatsApp */}
        <ConsolidatedDailySummary
          student={student}
          meals={meals}
          medications={medications}
          timelineEvents={timelineEvents}
          elapsedSeconds={elapsedSeconds}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      </main>

      {/* Modal Ministrar Medicamento com PIN */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Validação de Dose com PIN
                </h4>
              </div>
              <button onClick={() => setSelectedMed(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                <div className="font-black text-purple-950">{selectedMed.name}</div>
                <div className="text-purple-800 font-bold">Dose: {selectedMed.dose}</div>
                <div className="text-[11px] text-purple-700">{selectedMed.instructions}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações da Administração:</label>
                <textarea
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  placeholder="Ex: Criança aceitou bem com duas colheres de água filtrada..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedMed(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAdministerMedication}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md cursor-pointer"
                >
                  Confirmar e Baixar Medicamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Boletim PDF Simples */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <span>Boletim Diário Oficial - {student.name}</span>
              </h4>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 max-h-96 overflow-y-auto p-1">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                <div className="font-black text-indigo-950 text-sm">{student.schoolName}</div>
                <div className="text-indigo-700 text-[11px]">{student.roomName} • {student.teacherName}</div>
                <div className="text-[10px] text-slate-500 mt-1">Data: 24/09/2026 • Tempo de Aula: {formatTimer(elapsedSeconds)}</div>
              </div>

              <div className="space-y-1">
                <span className="font-black text-slate-800">🍼 Alimentação:</span>
                {meals.map(m => (
                  <div key={m.id} className="text-[11px] text-slate-600 flex justify-between">
                    <span>{m.name}</span>
                    <strong className="text-slate-900">{m.status}</strong>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="font-black text-slate-800">🎨 Atividades do Dia:</span>
                {timelineEvents.map(e => (
                  <div key={e.id} className="text-[11px] text-slate-600">
                    • <strong>{e.time}</strong> - {e.title} ({e.badge})
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#5B46EB] text-white font-black text-xs shadow-md cursor-pointer"
              >
                Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
