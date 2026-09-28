import React, { useState, useEffect } from 'react';
import { 
  INITIAL_STUDENT, 
  INITIAL_MEALS, 
  INITIAL_MEDICATIONS, 
  INITIAL_TIMELINE_EVENTS,
  INITIAL_NOTICES
} from './data/initialData';
import { MealStatus, MedicationItem, TimelineEvent, NoticeItem } from './types';
import { TopNavbar } from './components/TopNavbar';
import { StudentHeroCard } from './components/StudentHeroCard';
import { HeaderHero } from './components/HeaderHero';
import { GovernanceSection } from './components/GovernanceSection';
import { FeedingWaterSection } from './components/FeedingWaterSection';
import { HealthHygieneMedicationSection } from './components/HealthHygieneMedicationSection';
import { TimelineAuditSection } from './components/TimelineAuditSection';
import { RoutineNoticesSection } from './components/RoutineNoticesSection';
import { ConsolidatedDailySummary } from './components/ConsolidatedDailySummary';
import { DailyReportModal } from './components/DailyReportModal';
import { BottomFloatingBar } from './components/BottomFloatingBar';
import { CheckCircle2, X, Cloud } from 'lucide-react';
import { subscribeToDailyState, saveDailyState, DailyStateFirebase } from './services/firebase';

export function App() {
  const [student] = useState(INITIAL_STUDENT);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);

  // Estados da Rotina Diária
  const [waterMl, setWaterMl] = useState<number>(150);
  const [bottleVolume, setBottleVolume] = useState<number>(180);
  const [bottleDone, setBottleDone] = useState<boolean>(true);
  const [mood, setMood] = useState<'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso'>('Calmo / Sereno');
  const [temperature, setTemperature] = useState<number>(36.6);
  const [napStatus, setNapStatus] = useState<string>('Soneca em Andamento');
  const [napStartTime, setNapStartTime] = useState<string>('12:30');
  const [weightKg, setWeightKg] = useState<number>(9.8);
  const [diaperCount, setDiaperCount] = useState<number>(2);
  const [diaperStatus, setDiaperStatus] = useState<string>('Xixi + Pomada');
  const [hygieneChecks, setHygieneChecks] = useState<Record<string, boolean>>({
    clothesChanged: true,
    teethBrushed: true,
    handsFaceWashed: true,
    bathGiven: false,
    sunscreenCream: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('diario');
  const [activeQuickNav, setActiveQuickNav] = useState('timeline');
  const [currentRole, setCurrentRole] = useState<'professor' | 'familia'>('professor');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Timer & Clock State
  const [isPaused, setIsPaused] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(Date.now() - (3 * 3600 + 45 * 60) * 1000);
  const [elapsedSeconds, setElapsedSeconds] = useState(3 * 3600 + 45 * 60);
  const [autoStartedToast, setAutoStartedToast] = useState(false);

  // 🔄 SINCRONIZAÇÃO EM TEMPO REAL COM FIREBASE (Celular ⇄ Computador)
  useEffect(() => {
    const unsubscribe = subscribeToDailyState('mariana-souza', (liveData: DailyStateFirebase) => {
      if (liveData.meals) setMeals(liveData.meals);
      if (liveData.medications) setMedications(liveData.medications);
      if (liveData.timelineEvents) setTimelineEvents(liveData.timelineEvents);
      if (liveData.notices) setNotices(liveData.notices);
      if (typeof liveData.waterMl === 'number') setWaterMl(liveData.waterMl);
      if (typeof liveData.bottleVolume === 'number') setBottleVolume(liveData.bottleVolume);
      if (typeof liveData.bottleDone === 'boolean') setBottleDone(liveData.bottleDone);
      if (liveData.mood) setMood(liveData.mood as any);
      if (typeof liveData.temperature === 'string') setTemperature(parseFloat(liveData.temperature) || 36.6);
      if (liveData.sleepStatus) setNapStatus(liveData.sleepStatus);
      if (liveData.sleepStart) setNapStartTime(liveData.sleepStart);
      if (typeof liveData.weight === 'string') setWeightKg(parseFloat(liveData.weight) || 9.8);
      if (liveData.diaperStatus) setDiaperStatus(liveData.diaperStatus);
      if (liveData.hygieneChecks) {
        const converted: Record<string, boolean> = {};
        Object.entries(liveData.hygieneChecks).forEach(([k, v]) => {
          converted[k] = Boolean(v);
        });
        setHygieneChecks(converted);
      }
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

  const currentDate = '24/09/2026';
  const currentTime = '10:15:00';

  const triggerBlockedNotice = () => {
    if (isPaused) {
      handleTogglePause();
      setAutoStartedToast(true);
      setTimeout(() => {
        setAutoStartedToast(false);
      }, 3000);
    }
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

  const handleSelectBottleVolume = (vol: number) => {
    setBottleVolume(vol);
    saveDailyState('mariana-souza', { bottleVolume: vol });
  };

  const handleSetMood = (m: 'Calmo / Sereno' | 'Alegre' | 'Sonolento' | 'Choroso') => {
    setMood(m);
    saveDailyState('mariana-souza', { mood: m });
  };

  const handleSetTemperature = (t: number) => {
    setTemperature(t);
    saveDailyState('mariana-souza', { temperature: t.toString() });
  };

  const handleSetNap = (status: string, startTime?: string) => {
    setNapStatus(status);
    if (startTime) setNapStartTime(startTime);
    saveDailyState('mariana-souza', {
      sleepStatus: status,
      sleepStart: startTime || napStartTime,
    });
  };

  const handleSetWeight = (w: number) => {
    setWeightKg(w);
    saveDailyState('mariana-souza', { weight: w.toString() });
  };

  const handleSetDiaper = (tipo: string) => {
    const newCount = diaperCount + 1;
    setDiaperCount(newCount);
    setDiaperStatus(tipo);
    saveDailyState('mariana-souza', {
      diaperStatus: tipo,
    });
  };

  const handleToggleHygiene = (key: string) => {
    const nextChecks = { ...hygieneChecks, [key]: !hygieneChecks[key] };
    setHygieneChecks(nextChecks);
    saveDailyState('mariana-souza', {
      hygieneChecks: nextChecks,
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

  const handleAdministerMedication = (medId: string, notes?: string) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = `Hoje às ${nowTime}`;

    const updatedMeds = medications.map((med) => {
      if (med.id === medId) {
        const newHist = {
          id: `hist-${Date.now()}`,
          timestamp: nowFormatted,
          administeredBy: `${student.teacherName} (${student.teacherRole})`,
          dose: med.dose,
          pinConfirmed: true,
          notes: notes || 'Dose administrada conforme prescrição.',
        };
        return {
          ...med,
          lastAdministeredAt: nowFormatted,
          lastAdministeredBy: student.teacherName,
          history: [newHist, ...(med.history || [])],
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
        description: `Dose (${targetMed.dose}) ministrada com sucesso. ${notes || 'Prescrição médica autorizada pelos pais com PIN validado.'}`,
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

  const handleAddTimelineEvent = (newEvent: Omit<TimelineEvent, 'id'>) => {
    const eventWithId: TimelineEvent = {
      ...newEvent,
      id: `tl-custom-${Date.now()}`,
    };
    const updated = [eventWithId, ...timelineEvents];
    setTimelineEvents(updated);
    saveDailyState('mariana-souza', { timelineEvents: updated });
  };

  const handleAddNotice = (newNotice: Omit<NoticeItem, 'id'>) => {
    const noticeWithId: NoticeItem = {
      ...newNotice,
      id: `not-custom-${Date.now()}`,
    };
    const updated = [noticeWithId, ...notices];
    setNotices(updated);
    saveDailyState('mariana-souza', { notices: updated });
  };

  const handleSelectQuickNav = (id: string) => {
    setActiveQuickNav(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-24 selection:bg-[#5B46EB] selection:text-white relative">
      {/* Indicador de Conexão Nuvem */}
      <div className="fixed top-3 right-3 z-40">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 shadow-md border border-slate-200 text-[10px] font-black text-slate-700 backdrop-blur-xs">
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sincronia Nuvem Ativa</span>
        </div>
      </div>

      {/* Auto-started Toast */}
      {autoStartedToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h5 className="font-black text-emerald-200 uppercase tracking-wide">
              Cronômetro de Aula Ativado
            </h5>
            <p className="mt-1 text-emerald-100 leading-relaxed">
              O cronômetro foi iniciado e sincronizado em tempo real com o celular dos pais!
            </p>
          </div>
          <button 
            onClick={() => setAutoStartedToast(false)}
            className="text-emerald-300 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Sticky */}
      <TopNavbar
        currentDate={currentDate}
        currentTime={currentTime}
        studentName={student.name}
        studentBirth={student.birthDate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'avisos') handleSelectQuickNav('notices');
          else if (tab === 'medicamentos') handleSelectQuickNav('medications');
          else if (tab === 'diario') handleSelectQuickNav('timeline');
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* 2. Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Student Profile Card */}
        <StudentHeroCard
          student={student}
          activeQuickNav={activeQuickNav}
          onSelectQuickNav={handleSelectQuickNav}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* Institution & Teacher Hero Grid */}
        <HeaderHero
          student={student}
          activeQuickNav={activeQuickNav}
          onSelectQuickNav={handleSelectQuickNav}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* Governance Section */}
        <GovernanceSection
          student={student}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          elapsedSeconds={elapsedSeconds}
        />

        {/* Nutrition: Mamadeira, Água & Refeições Rápidas */}
        <FeedingWaterSection
          studentName={student.name}
          meals={meals}
          onUpdateMeal={handleUpdateMeal}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
          currentRole={currentRole}
          waterMl={waterMl}
          onAddWater={handleAddWater}
          bottleVolume={bottleVolume}
          bottleDone={bottleDone}
          onToggleBottle={handleToggleBottle}
          onSelectBottleVolume={handleSelectBottleVolume}
        />

        {/* Health, Sleep, Diaper Hygiene & Medications */}
        <HealthHygieneMedicationSection
          studentName={student.name}
          medications={medications}
          onAdministerMedication={handleAdministerMedication}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
          currentRole={currentRole}
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

        {/* Linha do Tempo & Auditoria */}
        <TimelineAuditSection
          student={student}
          events={timelineEvents}
          onAddEvent={handleAddTimelineEvent}
          currentRole={currentRole}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
        />

        {/* Diários Recebidos & Mural */}
        <RoutineNoticesSection
          student={student}
          notices={notices}
          onAddNotice={handleAddNotice}
          currentRole={currentRole}
        />

        {/* Diário Consolidado */}
        <ConsolidatedDailySummary
          student={student}
          meals={meals}
          medications={medications}
          timelineEvents={timelineEvents}
          elapsedSeconds={elapsedSeconds}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      </main>

      {/* 3. Barra Flutuante com Alternador de Perfil */}
      <BottomFloatingBar
        currentRole={currentRole}
        onSelectRole={(role) => setCurrentRole(role as any)}
        student={student}
        onScrollToTop={handleScrollToTop}
      />

      {/* 4. Modal de Relatório Diário */}
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
