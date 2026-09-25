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
import { CheckCircle2, X } from 'lucide-react';

export function App() {
  const [student, setStudent] = useState(INITIAL_STUDENT);
  const [meals, setMeals] = useState<MealStatus[]>(INITIAL_MEALS);
  const [medications, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('diario');
  const [activeQuickNav, setActiveQuickNav] = useState('timeline');
  const [currentRole, setCurrentRole] = useState<'professor' | 'familia'>('professor');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(3 * 3600 + 45 * 60);
  const [autoStartedToast, setAutoStartedToast] = useState(false);

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

  const currentDate = '24/09/2026';
  const currentTime = '10:15:00';

  const triggerBlockedNotice = () => {
    setIsPaused(false);
    setAutoStartedToast(true);
    setTimeout(() => {
      setAutoStartedToast(false);
    }, 3000);
  };

  const handleUpdateMeal = (mealId: string, status: MealStatus['status']) => {
    if (isPaused) {
      setIsPaused(false);
    }
    setMeals(prev =>
      prev.map(m => (m.id === mealId ? { ...m, status } : m))
    );

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

  const handleAdministerMedication = (medId: string, notes?: string) => {
    if (isPaused) {
      setIsPaused(false);
    }
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = `Hoje às ${nowTime}`;

    setMedications(prev =>
      prev.map(med => {
        if (med.id === medId) {
          const newHist = {
            id: `hist-${Date.now()}`,
            timestamp: nowFormatted,
            administeredBy: `${student.teacherName} (${student.teacherRole})`,
            dose: med.dose,
            pinConfirmed: true,
            notes: notes || 'Dose administrada conforme prescrição.'
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

    const targetMed = medications.find(m => m.id === medId);
    if (targetMed) {
      setTimelineEvents(prev => [
        {
          id: `tl-med-${Date.now()}`,
          time: nowTime,
          title: `Medicamento: ${targetMed.name}`,
          description: `Dose (${targetMed.dose}) ministrada com sucesso. ${notes || 'Prescrição médica autorizada pelos pais com PIN validado.'}`,
          category: 'medicamento',
          registeredBy: `${student.teacherName} (${student.teacherRole})`,
          badge: 'PIN Legal • Ministrado',
          badgeColor: 'purple',
          icon: 'pill',
          verified: true
        },
        ...prev
      ]);
    }
  };

  const handleAddTimelineEvent = (newEvent: Omit<TimelineEvent, 'id'>) => {
    if (isPaused) {
      setIsPaused(false);
    }
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
      {autoStartedToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h5 className="font-black text-emerald-200 uppercase tracking-wide">
              Cronômetro de Aula Ativado
            </h5>
            <p className="mt-1 text-emerald-100 leading-relaxed">
              O cronômetro foi iniciado automaticamente para permitir o registro e baixa em tempo real das rotinas no celular.
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

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <StudentHeroCard
          student={student}
          activeQuickNav={activeQuickNav}
          onSelectQuickNav={handleSelectQuickNav}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        <HeaderHero
          student={student}
          activeQuickNav={activeQuickNav}
          onSelectQuickNav={handleSelectQuickNav}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        <GovernanceSection
          student={student}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          elapsedSeconds={elapsedSeconds}
        />

        <FeedingWaterSection
          studentName={student.name}
          meals={meals}
          onUpdateMeal={handleUpdateMeal}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
        />

        <HealthHygieneMedicationSection
          studentName={student.name}
          medications={medications}
          onAdministerMedication={handleAdministerMedication}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
          currentRole={currentRole}
        />

        <TimelineAuditSection
          student={student}
          events={timelineEvents}
          onAddEvent={handleAddTimelineEvent}
          currentRole={currentRole}
          isPaused={isPaused}
          onBlockedAction={triggerBlockedNotice}
        />

        <RoutineNoticesSection
          student={student}
          notices={notices}
          onAddNotice={handleAddNotice}
          currentRole={currentRole}
        />

        <ConsolidatedDailySummary
          student={student}
          meals={meals}
          medications={medications}
          timelineEvents={timelineEvents}
          elapsedSeconds={elapsedSeconds}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      </main>

      <BottomFloatingBar
        currentRole={currentRole}
        onSelectRole={(role) => setCurrentRole(role as any)}
        student={student}
        onScrollToTop={handleScrollToTop}
      />

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
