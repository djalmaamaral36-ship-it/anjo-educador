import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Plus, 
  X, 
  Check, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Activity,
  Trash2,
  Smile,
  Search,
  Copy,
  ChevronRight,
  Heart,
  Sparkles,
  Sliders,
  Clock
} from 'lucide-react';
import { getFromDB, saveToDB, SALAS_INICIAIS } from '../data';
import { Idoso, Usuario, Classroom } from '../types';
import { VoiceInput } from './VoiceInput';

interface CoordinationPanelProps {
  key?: any;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    darkMode: boolean;
  };
  appMode?: string;
  usuarioAtual?: Usuario | null;
}

// Interface for Developmental Milestone Alerts
interface MilestoneAlert {
  id: string;
  studentId: string;
  studentName: string;
  classroomName: string;
  category: 'fala' | 'socioemocional' | 'sensorial';
  indicator: string;
  intensity: 'leve' | 'moderada' | 'recorrente';
  date: string;
  observations: string;
  registeredBy: string;
  time?: string;
}

// Interface for Conflict Mediation Logs
interface MediationLog {
  id: string;
  date: string;
  classroomName: string;
  studentsInvolved: string;
  description: string;
  actionTaken: string;
  familyNotified: boolean;
  registeredBy: string;
  time?: string;
}

export default function CoordinationPanel({ accessibilitySettings, appMode, usuarioAtual }: CoordinationPanelProps) {
  if (usuarioAtual?.tipo === 'familiar') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-red-100 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-200">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-lg font-black text-slate-800">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          Esta tela é exclusiva para a equipe de Coordenação Pedagógica. Responsáveis têm acesso aos dados individuais de seus filhos através do Diário da Infância.
        </p>
      </div>
    );
  }

  const isDark = accessibilitySettings.darkMode;

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0].substring(0, 5);
  };

  // State managers
  const [students, setStudents] = useState<Idoso[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('Todas');

  // Development Alarms state
  const [milestoneAlerts, setMilestoneAlerts] = useState<MilestoneAlert[]>([]);
  const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<Idoso | null>(null);
  const [newAlertForm, setNewAlertForm] = useState({
    category: 'fala' as 'fala' | 'socioemocional' | 'sensorial',
    indicator: '',
    intensity: 'leve' as 'leve' | 'moderada' | 'recorrente',
    observations: '',
    time: getCurrentTime()
  });

  // Referrals state (sharing with DirectorPanel storage key)
  const [pedagogicalReferrals, setPedagogicalReferrals] = useState<any[]>([]);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [newReferralForm, setNewReferralForm] = useState({
    studentName: '',
    tipo: 'pedagogico_geral',
    reason: '',
    time: getCurrentTime()
  });
  const [customStudentName, setCustomStudentName] = useState('');
  const [searchReferrals, setSearchReferrals] = useState('');
  const [searchStudentForReferral, setSearchStudentForReferral] = useState('');
  const [searchAlerts, setSearchAlerts] = useState('');
  const [searchStudentForAlert, setSearchStudentForAlert] = useState('');
  const [searchMediation, setSearchMediation] = useState('');

  // Mediation Logs state
  const [mediationLogs, setMediationLogs] = useState<MediationLog[]>([]);
  const [showMediationForm, setShowMediationForm] = useState(false);
  const [newMediationForm, setNewMediationForm] = useState({
    classroomName: '',
    studentsInvolved: '',
    description: '',
    actionTaken: '',
    familyNotified: false,
    time: getCurrentTime()
  });

  // Alert generation / message copy helpers
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSubTab, setActiveTab] = useState<'early_alerts' | 'referrals' | 'conflict_mediation'>('early_alerts');

  // Load initial data
  useEffect(() => {
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    setStudents(allStudents.filter(s => s.id.startsWith('aluno_')));

    const allRooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    setClassrooms(allRooms);

    // Initial classroom selection
    if (allRooms.length > 0 && selectedClassroom === 'Todas') {
      setSelectedClassroom(allRooms[0].name);
    }

    // Load Pedagogical Referrals from DB
    const savedReferrals = getFromDB<any[]>('anjo_encaminhamentos_pedagogicos', []);
    if (savedReferrals.length === 0) {
      const defaultReferrals = [
        {
          id: 'ref_1',
          classroomName: 'Maternal I',
          studentName: 'Arthur Silva',
          tipo: 'pedagogico_geral',
          reason: 'Dificuldade de socialização em grupo e choro persistente na hora da despedida.',
          data: '2026-05-10',
          registeredBy: 'Coordenação Pedagógica'
        },
        {
          id: 'ref_2',
          classroomName: 'Maternal II',
          studentName: 'Beatriz Souza',
          tipo: 'fonoaudiologia',
          reason: 'Atraso de fala expressiva identificado no diário pedagógico e conversado com a coordenação.',
          data: '2026-05-12',
          registeredBy: 'Profª Estela Pinto'
        },
        {
          id: 'ref_3',
          classroomName: 'Maternal II',
          studentName: 'Guilherme Santos',
          tipo: 'terapia_ocupacional',
          reason: 'Hipersensibilidade tátil severa relatada no momento do banho e resistência a texturas de massinha.',
          data: '2026-05-14',
          registeredBy: 'Profª Estela Pinto'
        }
      ];
      saveToDB('anjo_encaminhamentos_pedagogicos', defaultReferrals);
      setPedagogicalReferrals(defaultReferrals);
    } else {
      setPedagogicalReferrals(savedReferrals);
    }

    // Load Development Alerts
    const savedAlerts = getFromDB<MilestoneAlert[]>('anjo_alertas_desenvolvimento', []);
    if (savedAlerts.length === 0) {
      const defaultAlerts: MilestoneAlert[] = [
        {
          id: 'alert_1',
          studentId: 'aluno_1',
          studentName: 'Maria Eduarda',
          classroomName: 'Maternal I',
          category: 'fala',
          indicator: 'Ausência de fala espontânea ou tentativas de comunicação aos 2 anos e meio.',
          intensity: 'moderada',
          date: '2026-05-11',
          observations: 'Notado em interações na roda de música. Prefere apontar ou puxar o braço da professora.',
          registeredBy: 'Coordenação Pedagógica'
        },
        {
          id: 'alert_2',
          studentId: 'aluno_2',
          studentName: 'Enzo Gabriel',
          classroomName: 'Maternal II',
          category: 'socioemocional',
          indicator: 'Isolamento contínuo durante o brincar livre e recusa em participar de atividades coletivas.',
          intensity: 'recorrente',
          date: '2026-05-15',
          observations: 'Brinca apenas no canto da sala enfileirando carrinhos de brinquedo na mesma ordem.',
          registeredBy: 'Coordenação Pedagógica'
        }
      ];
      saveToDB('anjo_alertas_desenvolvimento', defaultAlerts);
      setMilestoneAlerts(defaultAlerts);
    } else {
      setMilestoneAlerts(savedAlerts);
    }

    // Load Mediation Logs
    const savedMediation = getFromDB<MediationLog[]>('anjo_mediacao_conflitos', []);
    if (savedMediation.length === 0) {
      const defaultLogs: MediationLog[] = [
        {
          id: 'log_1',
          date: '2026-05-18',
          classroomName: 'Maternal II',
          studentsInvolved: 'João e Lucas',
          description: 'Disputa física por um urso de pelúcia na transição para o lanche. Ocorreu uma mordida leve no braço de João.',
          actionTaken: 'Separados de forma neutra. Aplicado gelo em João. Realizado círculo de sentimentos sobre morder. Pais de ambos informados confidencialmente.',
          familyNotified: true,
          registeredBy: 'Coordenação'
        }
      ];
      saveToDB('anjo_mediacao_conflitos', defaultLogs);
      setMediationLogs(defaultLogs);
    } else {
      setMediationLogs(savedMediation);
    }
  }, []);

  // Filter students by selected classroom
  const getCleanClassName = (roomName: string) => {
    return roomName.replace(/🧸|🎒|🏫|🎨|👶|🌈|⭐|🌻/g, '').trim().toLowerCase();
  };

  const filteredStudents = students.filter(s => {
    if (selectedClassroom === 'Todas') return true;
    const cleanRoom = getCleanClassName(selectedClassroom);
    return s.nome.toLowerCase().includes(cleanRoom);
  });

  // Category Translation Helpers
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'fala': return '🗣️ Fala & Linguagem';
      case 'socioemocional': return '🧠 Socioemocional';
      case 'sensorial': return '🎨 Integração Sensorial';
      default: return cat;
    }
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'leve': return '🟢 Leve / Início';
      case 'moderada': return '🟡 Moderada / Frequente';
      case 'recorrente': return '🔴 Recorrente / Severa';
      default: return intensity;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'leve': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'moderada': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'recorrente': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Handle adding milestone alert
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAlert) return;
    if (!newAlertForm.indicator.trim()) {
      alert('Selecione ou insira um indicador de atraso.');
      return;
    }

    const newAlert: MilestoneAlert = {
      id: 'alert_' + Date.now(),
      studentId: selectedStudentForAlert.id,
      studentName: selectedStudentForAlert.nome.split(' (')[0],
      classroomName: selectedClassroom,
      category: newAlertForm.category,
      indicator: newAlertForm.indicator,
      intensity: newAlertForm.intensity,
      date: new Date().toISOString().split('T')[0],
      time: newAlertForm.time || getCurrentTime(),
      observations: newAlertForm.observations,
      registeredBy: usuarioAtual?.nome || 'Coordenação Pedagógica'
    };

    const updated = [newAlert, ...milestoneAlerts];
    setMilestoneAlerts(updated);
    saveToDB('anjo_alertas_desenvolvimento', updated);

    // Reset
    setSelectedStudentForAlert(null);
    setNewAlertForm({
      category: 'fala',
      indicator: '',
      intensity: 'leve',
      observations: '',
      time: getCurrentTime()
    });
  };

  // Handle deleting an alert
  const handleDeleteAlert = (id: string) => {
    if (window.confirm('Excluir este alerta de marco do desenvolvimento?')) {
      const updated = milestoneAlerts.filter(a => a.id !== id);
      setMilestoneAlerts(updated);
      saveToDB('anjo_alertas_desenvolvimento', updated);
    }
  };

  // Handle adding referral
  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStudentName = newReferralForm.studentName === 'custom' || !newReferralForm.studentName
      ? customStudentName.trim()
      : newReferralForm.studentName;

    if (!finalStudentName) {
      alert('Informe o nome do aluno.');
      return;
    }
    if (!newReferralForm.reason.trim()) {
      alert('Descreva o motivo do encaminhamento.');
      return;
    }

    const newRef = {
      id: 'ref_' + Date.now(),
      classroomName: selectedClassroom === 'Todas' ? 'Maternal I' : selectedClassroom,
      studentName: finalStudentName,
      tipo: newReferralForm.tipo,
      reason: newReferralForm.reason,
      data: new Date().toISOString().split('T')[0],
      time: newReferralForm.time || getCurrentTime(),
      registeredBy: usuarioAtual?.nome || 'Coordenação Pedagógica'
    };

    const updated = [newRef, ...pedagogicalReferrals];
    setPedagogicalReferrals(updated);
    saveToDB('anjo_encaminhamentos_pedagogicos', updated);

    // Reset
    setShowReferralForm(false);
    setNewReferralForm({
      studentName: '',
      tipo: 'pedagogico_geral',
      reason: '',
      time: getCurrentTime()
    });
    setCustomStudentName('');
  };

  // Handle deleting referral
  const handleDeleteReferral = (id: string) => {
    if (window.confirm('Excluir este encaminhamento?')) {
      const updated = pedagogicalReferrals.filter(r => r.id !== id);
      setPedagogicalReferrals(updated);
      saveToDB('anjo_encaminhamentos_pedagogicos', updated);
    }
  };

  // Handle adding mediation log
  const handleAddMediation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediationForm.studentsInvolved || !newMediationForm.description) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const newLog: MediationLog = {
      id: 'med_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: newMediationForm.time || getCurrentTime(),
      classroomName: newMediationForm.classroomName || selectedClassroom,
      studentsInvolved: newMediationForm.studentsInvolved,
      description: newMediationForm.description,
      actionTaken: newMediationForm.actionTaken,
      familyNotified: newMediationForm.familyNotified,
      registeredBy: usuarioAtual?.nome || 'Coordenação'
    };

    const updated = [newLog, ...mediationLogs];
    setMediationLogs(updated);
    saveToDB('anjo_mediacao_conflitos', updated);

    // Reset
    setShowMediationForm(false);
    setNewMediationForm({
      classroomName: '',
      studentsInvolved: '',
      description: '',
      actionTaken: '',
      familyNotified: false,
      time: getCurrentTime()
    });
  };

  // Copy welcome message to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Generate generic message
  const generateWelcomingMessage = (student: string, obs: string, cat: string) => {
    return `"Olá, responsável por ${student}! Esperamos que esteja bem. Observando o desenvolvimento de ${student} em nossas vivências de ${cat} e interações pedagógicas, notamos que ela/ele tem demonstrado ${obs}. Gostaríamos de convidar vocês para um café com nossa coordenação na próxima quarta-feira para conversarmos em parceria sobre como podemos potencializar o desenvolvimento infantil de forma integral. Contem conosco!"`;
  };

  const getReferralTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'fonoaudiologia': return '🗣️ Fonoaudiologia';
      case 'psicologia': return '🧠 Psicologia';
      case 'terapia_ocupacional': return '🎨 Terapia Ocupacional';
      default: return '📝 Geral / Coordenação';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-fade-in text-left">
      
      {/* 👑 Welcome and Header */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-pink-50/20 border-indigo-100 text-slate-800'
      } shadow-xs relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100/60 dark:bg-indigo-950/40 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
              👩‍🏫 Portal Confidencial da Coordenação Pedagógica
            </div>
            <h2 className="text-xl md:text-2xl font-black font-display tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Painel de Coordenação & Acompanhamento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed font-semibold">
              Espaço de monitoramento específico da coordenação pedagógica. Ao contrário do Diretor (gestão global e financeira), 
              o Coordenador atua na orientação das turmas, identificação precoce de marcos de desenvolvimento de alunos e mediação de conflitos.
            </p>
          </div>
        </div>

        {/* Classroom Quick Filter Row */}
        <div className="mt-5 pt-4 border-t border-slate-100/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Turma de Trabalho:</span>
            <div className="flex items-center gap-1.5 bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100/10 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-slate-500">
              <span>🎒 Alunos Filtrados:</span>
              <span className="text-indigo-600 font-extrabold">{filteredStudents.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 py-1">
            <button
              onClick={() => setSelectedClassroom('Todas')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                selectedClassroom === 'Todas'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Todas as Turmas ({classrooms.length})
            </button>
            {classrooms.map((room) => (
              <button
                key={room.name}
                onClick={() => setSelectedClassroom(room.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                  selectedClassroom === room.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {room.emoji} {room.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🧭 Tabs Controller */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1.5 pb-0">
        <button
          onClick={() => setActiveTab('early_alerts')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all relative cursor-pointer ${
            activeSubTab === 'early_alerts'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🧠 Identificação Precoce ({milestoneAlerts.filter(a => selectedClassroom === 'Todas' || a.classroomName === selectedClassroom).length})
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all relative cursor-pointer ${
            activeSubTab === 'referrals'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🗣️ Encaminhamentos ({pedagogicalReferrals.filter(r => selectedClassroom === 'Todas' || r.classroomName === selectedClassroom).length})
        </button>
        <button
          onClick={() => setActiveTab('conflict_mediation')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all relative cursor-pointer ${
            activeSubTab === 'conflict_mediation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🤝 Mediação de Conflitos ({mediationLogs.filter(m => selectedClassroom === 'Todas' || m.classroomName === selectedClassroom).length})
        </button>
      </div>

      {/* 🧠 SECTION 1: Identificação Precoce de Atraso no Desenvolvimento */}
      {activeSubTab === 'early_alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Alarms Register / Guidelines (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-4 rounded-3xl border space-y-3.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h4 className="text-xs font-extrabold uppercase text-indigo-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Diretrizes de Identificação
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500 font-semibold">
                O Anjinho atua no rastreamento passivo da rotina pedagógica diária. A coordenação deve revisar e 
                registrar sinais formais de atenção.
              </p>
              
              <div className="space-y-2.5">
                <div className="p-3 bg-white dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-300 block">🗣️ Fala & Linguagem:</span>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                    Ausência de palavras inteligíveis aos 2 anos; ecolalia persistente ou perda de vocabulário prévio.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-300 block">🧠 Socioemocional:</span>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                    Falta de contato visual ou compartilhamento de atenção; isolamento intencional persistente no pátio.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-300 block">🎨 Integração Sensorial:</span>
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                    Pânico ou reações severas de choro com barulhos de sala de aula; recusa alimentar extrema por texturas.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-200/50 text-amber-800 dark:text-amber-400 text-[10px] font-semibold leading-relaxed">
                💡 <strong>Conduta Ética:</strong> Nunca afirme diagnósticos (ex: &quot;Este aluno tem Autismo&quot;). Registre fatos objetivos observados (ex: &quot;O aluno enfileira brinquedos e não atende a comandos verbais de roda&quot;).
              </div>
            </div>
          </div>

          {/* Right Column: Students Checklist and Alerts List (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Trigger Button for a specific student */}
            <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'} space-y-4`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100/15 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-400">📝 Registrar Sinal de Alerta / Acompanhamento</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Selecione um aluno da turma para registrar um sinal de atraso monitorado.</p>
                </div>
              </div>

              {selectedStudentForAlert ? (
                <form onSubmit={handleAddAlert} className="space-y-4 animate-slide-down">
                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">Aluno Selecionado:</span>
                      <p className="text-sm font-black text-slate-800 dark:text-white">👦 {selectedStudentForAlert.nome}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedStudentForAlert(null)}
                      className="px-2.5 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer font-bold"
                    >
                      Alterar Aluno
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Categoria</label>
                      <select
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        value={newAlertForm.category}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, category: e.target.value as any })}
                      >
                        <option value="fala">🗣️ Fala & Linguagem</option>
                        <option value="socioemocional">🧠 Socioemocional</option>
                        <option value="sensorial">🎨 Integração Sensorial</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Intensidade / Frequência</label>
                      <select
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        value={newAlertForm.intensity}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, intensity: e.target.value as any })}
                      >
                        <option value="leve">Leve / Início</option>
                        <option value="moderada">Moderada / Frequente</option>
                        <option value="recorrente">Recorrente / Severa</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Sinal / Comportamento Alvo</label>
                      <select
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        value={newAlertForm.indicator}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, indicator: e.target.value })}
                        required
                      >
                        <option value="">-- Selecione o Sinal --</option>
                        {newAlertForm.category === 'fala' && (
                          <>
                            <option value="Ausência de fala espontânea ou tentativas de comunicação aos 2 anos e meio.">Ausência de fala expressiva espontânea</option>
                            <option value="Ecolalia imediata ou tardia sistemática em vez de responder perguntas simples.">Ecolalia persistente</option>
                            <option value="Não atende a comandos verbais de rotina nem responde ao próprio nome.">Não atende ao próprio nome</option>
                          </>
                        )}
                        {newAlertForm.category === 'socioemocional' && (
                          <>
                            <option value="Isolamento contínuo durante o brincar livre e recusa em participar de atividades coletivas.">Isolamento voluntário persistente</option>
                            <option value="Choro ou angústia extrema incontrolável sem motivos claros ou gatilhos.">Choro inconsolável diário</option>
                            <option value="Resistência severa a transições simples de rotina e apego rígido a regras de objetos.">Aversão rígida a transições</option>
                          </>
                        )}
                        {newAlertForm.category === 'sensorial' && (
                          <>
                            <option value="Irritabilidade severa ou pânico com barulhos cotidianos (liquidificador, portão, recreio).">Hipersensibilidade auditiva</option>
                            <option value="Recusa total de alimentos sólidos ou de determinadas cores e texturas.">Seletividade alimentar extrema</option>
                            <option value="Choro e asco corporal ao tocar massinha, tintas ou alimentos úmidos.">Aversão a texturas e toques</option>
                          </>
                        )}
                        <option value="Outro sinal atípico observado detalhado nas notas abaixo...">✍️ Outro sinal (especificar nas observações)...</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> Horário do Fato
                      </label>
                      <input
                        type="time"
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        value={newAlertForm.time}
                        onChange={(e) => setNewAlertForm({ ...newAlertForm, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Observações Detalhadas (Confidencial)</label>
                      <VoiceInput 
                        onTranscript={(text) => setNewAlertForm(prev => ({ ...prev, observations: prev.observations ? prev.observations + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <textarea
                      placeholder="Descreva fatos específicos observados na sala de aula ou pátio, incluindo datas e reações da criança..."
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold h-20 focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      value={newAlertForm.observations}
                      onChange={(e) => setNewAlertForm({ ...newAlertForm, observations: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForAlert(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
                    >
                      Salvar Alerta de Desenvolvimento
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150/40 pb-2.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Selecione o Aluno Abaixo:</span>
                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Buscar aluno por nome..."
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-[11px] font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none border ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        value={searchStudentForAlert}
                        onChange={(e) => setSearchStudentForAlert(e.target.value)}
                      />
                    </div>
                  </div>

                  {(() => {
                    const displayed = searchStudentForAlert.trim() !== ''
                      ? students.filter(st => st.nome.toLowerCase().includes(searchStudentForAlert.toLowerCase()))
                      : filteredStudents;

                    if (displayed.length === 0) {
                      return (
                        <div className="py-6 text-center text-slate-400 text-xs font-bold">
                          Nenhum aluno encontrado para &quot;{searchStudentForAlert}&quot;.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                        {displayed.map((st) => {
                          const hasAlerts = milestoneAlerts.some(a => a.studentId === st.id);
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudentForAlert(st);
                                setSearchStudentForAlert(''); // clear on select
                                setNewAlertForm(prev => ({ ...prev, indicator: '' }));
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer hover:scale-103 ${
                                hasAlerts 
                                  ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/10' 
                                  : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800'
                              }`}
                            >
                              <span className="block truncate text-slate-850 dark:text-slate-100">👦 {st.nome.split(' (')[0]}</span>
                              <span className={`text-[8px] font-semibold mt-1 block ${hasAlerts ? 'text-amber-600' : 'text-slate-400'}`}>
                                {hasAlerts ? '⚠️ Sinais Registrados' : '✅ Monitorado'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* List of Registered Early Alerts */}
            <div className="space-y-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Lista de Alertas e Sinais de Desenvolvimento Ativos
                </h4>
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Filtrar alertas por aluno ou sinal..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-[11px] font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={searchAlerts}
                    onChange={(e) => setSearchAlerts(e.target.value)}
                  />
                </div>
              </div>
              
              {(() => {
                const filtered = milestoneAlerts.filter(a => {
                  const matchesSearch = a.studentName.toLowerCase().includes(searchAlerts.toLowerCase()) || 
                                        a.indicator.toLowerCase().includes(searchAlerts.toLowerCase());
                  const matchesClassroom = selectedClassroom === 'Todas' || a.classroomName === selectedClassroom;
                  return searchAlerts.trim() !== '' ? matchesSearch : matchesClassroom;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2">
                      <p className="text-xs font-black text-slate-400">Nenhum sinal crítico registrado para os filtros aplicados.</p>
                      <p className="text-[10px] text-slate-500">Isso indica que as crianças estão atingindo os marcos esperados para a idade ou estão sob monitoramento discreto das professoras.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((alertItem) => (
                      <div 
                        key={alertItem.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs relative ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              👦 {alertItem.studentName}
                            </span>
                            <button
                              onClick={() => handleDeleteAlert(alertItem.id)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                              title="Excluir alerta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-md">
                              {getCategoryLabel(alertItem.category)}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${getIntensityColor(alertItem.intensity)}`}>
                              {getIntensityLabel(alertItem.intensity)}
                            </span>
                          </div>

                          <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-normal bg-slate-50 dark:bg-slate-950/30 p-2 rounded-xl">
                            🚨 {alertItem.indicator}
                          </p>

                          {alertItem.observations && (
                            <div className="p-2 border-l-2 border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 italic">
                              &ldquo;{alertItem.observations}&rdquo;
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100/10 flex flex-wrap items-center justify-between text-[9px] font-semibold text-slate-400 gap-2">
                          <span>Registrado por: <strong className="text-slate-600 dark:text-slate-300">{alertItem.registeredBy}</strong></span>
                          <span className="flex items-center gap-1">
                            📅 {alertItem.date}
                            {alertItem.time && (
                              <span className="inline-flex items-center gap-0.5 ml-1 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                <Clock className="w-2.5 h-2.5" /> {alertItem.time}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Welcoming message generator inside the card */}
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100/10 text-left space-y-1.5">
                          <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">📞 Mensagem de Acolhimento Sugerida</span>
                          <p className="text-[8.5px] leading-relaxed text-slate-500 italic">
                            {generateWelcomingMessage(alertItem.studentName, 'comportamentos de foco atípicos', alertItem.category === 'fala' ? 'comunicação' : 'convivência social')}
                          </p>
                          <button
                            onClick={() => handleCopyText(
                              generateWelcomingMessage(alertItem.studentName, 'comportamentos de foco atípicos', alertItem.category === 'fala' ? 'comunicação' : 'convivência social'),
                              alertItem.id
                            )}
                            className="w-full py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[8px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5 text-indigo-500" />
                            {copiedText === alertItem.id ? '✓ Copiado!' : 'Copiar Texto para WhatsApp'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* 🗣️ SECTION 2: Encaminhamentos Pedagógicos */}
      {activeSubTab === 'referrals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100">Prontuário de Encaminhamentos Confidenciais</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Direcionamento para especialistas externos em conjunto com a família</p>
            </div>
            
            <button
              onClick={() => setShowReferralForm(!showReferralForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              {showReferralForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showReferralForm ? 'Fechar Formulário' : 'Novo Encaminhamento'}
            </button>
          </div>

          {/* New Referral Form */}
          {showReferralForm && (
            <form onSubmit={handleAddReferral} className={`p-5 rounded-3xl border text-left max-w-2xl mx-auto space-y-4 animate-slide-down ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-150 text-slate-800'
            }`}>
              <h5 className="text-xs font-extrabold uppercase text-indigo-600 flex items-center gap-1">
                📝 Lançar Novo Registro de Encaminhamento
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Selecione o Aluno</label>
                  {newReferralForm.studentName ? (
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      <span className="truncate">👦 {newReferralForm.studentName === 'custom' ? `Outro: ${customStudentName || 'Digite abaixo'}` : newReferralForm.studentName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewReferralForm(prev => ({ ...prev, studentName: '' }));
                          setCustomStudentName('');
                        }}
                        className="text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase cursor-pointer"
                      >
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Pesquisar aluno por nome..."
                          className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                          value={searchStudentForReferral}
                          onChange={(e) => setSearchStudentForReferral(e.target.value)}
                        />
                      </div>
                      
                      {(() => {
                        const matching = searchStudentForReferral.trim() !== ''
                          ? students.filter(st => st.nome.toLowerCase().includes(searchStudentForReferral.toLowerCase()))
                          : filteredStudents;

                        if (matching.length === 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setNewReferralForm(prev => ({ ...prev, studentName: 'custom' }));
                              }}
                              className={`w-full p-2 rounded-xl border border-dashed text-center text-xs font-bold ${
                                isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800/40' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              ✍️ Digitar nome manualmente...
                            </button>
                          );
                        }

                        return (
                          <div className="max-h-36 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-1.5 space-y-1 bg-slate-50/30 dark:bg-slate-900/10">
                            {matching.slice(0, 5).map(st => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  setNewReferralForm(prev => ({ ...prev, studentName: st.nome.split(' (')[0] }));
                                  setSearchStudentForReferral('');
                                }}
                                className={`w-full p-1.5 rounded-lg text-left text-xs font-semibold transition-all hover:bg-indigo-600 hover:text-white ${
                                  isDark ? 'text-slate-200' : 'text-slate-700'
                                }`}
                              >
                                👦 {st.nome.split(' (')[0]}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setNewReferralForm(prev => ({ ...prev, studentName: 'custom' }));
                              }}
                              className="w-full p-1.5 rounded-lg text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/20"
                            >
                              ✍️ Outro Aluno (Digitar nome)...
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
 
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Especialidade Alvo</label>
                   <select
                     className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                       isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                     }`}
                     required
                     value={newReferralForm.tipo}
                     onChange={(e) => setNewReferralForm({ ...newReferralForm, tipo: e.target.value })}
                   >
                     <option value="pedagogico_geral">📝 Geral / Coordenação</option>
                     <option value="fonoaudiologia">🗣️ Fonoaudiologia</option>
                     <option value="psicologia">🧠 Psicologia (Socioemocional)</option>
                     <option value="terapia_ocupacional">🎨 Terapia Ocupacional</option>
                   </select>
                 </div>
 
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                     <Clock className="w-3.5 h-3.5 text-indigo-500" /> Horário
                   </label>
                   <input
                     type="time"
                     className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                       isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                     }`}
                     value={newReferralForm.time}
                     onChange={(e) => setNewReferralForm({ ...newReferralForm, time: e.target.value })}
                     required
                   />
                 </div>
               </div>
 
               {/* Typed student name if custom selected */}
               {(newReferralForm.studentName === 'custom') && (
                 <div className="space-y-1.5 animate-slide-down">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Nome do Aluno</label>
                   <input
                     type="text"
                     placeholder="Ex: Pedro Henrique"
                     className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                       isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                     }`}
                     required
                     value={customStudentName}
                     onChange={(e) => setCustomStudentName(e.target.value)}
                   />
                 </div>
               )}
 
               <div className="space-y-1.5">
                 <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Relato do Motivo / Justificativa</label>
                   <VoiceInput 
                     onTranscript={(text) => setNewReferralForm(prev => ({ ...prev, reason: prev.reason ? prev.reason + ' ' + text : text }))} 
                     size="sm"
                   />
                 </div>
                 <textarea
                   placeholder="Descreva de forma ética os comportamentos observados, reações físicas e justificativa do encaminhamento..."
                   className={`w-full p-2.5 rounded-xl border text-xs font-semibold h-24 focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                     isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                   }`}
                   required
                   value={newReferralForm.reason}
                   onChange={(e) => setNewReferralForm({ ...newReferralForm, reason: e.target.value })}
                 />
               </div>
 
               <div className="flex justify-end gap-2">
                 <button
                   type="button"
                   onClick={() => {
                     setShowReferralForm(false);
                     setNewReferralForm({ studentName: '', tipo: 'pedagogico_geral', reason: '', time: getCurrentTime() });
                   }}
                   className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
                 >
                   Registrar Encaminhamento
                 </button>
               </div>
             </form>
           )}
 
           {/* Search bar and referrals history */}
           <div className="space-y-4">
             <div className="relative max-w-md text-left">
               <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
               <input
                 type="text"
                 placeholder="Pesquisar por aluno no prontuário ou buscar alunos na escola..."
                 className={`w-full pl-9 pr-4 py-2.5 rounded-full text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none border ${
                   isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                 }`}
                 value={searchReferrals}
                 onChange={(e) => setSearchReferrals(e.target.value)}
               />
             </div>
 
             {/* Referrals Cards Grid */}
             {(() => {
               const filtered = pedagogicalReferrals.filter(r => {
                 const matchesSearch = r.studentName.toLowerCase().includes(searchReferrals.toLowerCase()) || 
                                       r.reason.toLowerCase().includes(searchReferrals.toLowerCase());
                 const matchesClassroom = selectedClassroom === 'Todas' || r.classroomName === selectedClassroom;
                 return searchReferrals.trim() !== '' ? matchesSearch : matchesClassroom;
               });

               // Also search for matching students in the school who don't have active referrals
               const matchingStudentsInSchool = searchReferrals.trim() !== ''
                 ? students.filter(st => {
                     const nameClean = st.nome.toLowerCase();
                     const searchClean = searchReferrals.toLowerCase();
                     const matchesName = nameClean.includes(searchClean);
                     const alreadyReferred = filtered.some(r => r.studentName.toLowerCase().includes(st.nome.split(' (')[0].toLowerCase()));
                     return matchesName && !alreadyReferred;
                   })
                 : [];
 
               return (
                 <div className="space-y-4">
                   {/* If there are school students matching but without referrals, show them prominently */}
                   {matchingStudentsInSchool.length > 0 && (
                     <div className={`p-4 rounded-3xl border border-dashed text-left space-y-3 ${
                       isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-indigo-50/30 border-indigo-200'
                     }`}>
                       <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                         🔍 Alunos Encontrados na Escola (Sem Encaminhamento Registrado):
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                         {matchingStudentsInSchool.map(st => {
                           const shortName = st.nome.split(' (')[0];
                           const details = st.nome.includes('(') ? st.nome.split('(')[1].replace(')', '') : 'Membro da escola';
                           return (
                             <div 
                               key={st.id} 
                               className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                                 isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-200'
                               }`}
                             >
                               <div className="truncate text-left">
                                 <span className="text-xs font-black text-slate-800 dark:text-white block truncate">
                                   👦 {shortName}
                                 </span>
                                 <span className="text-[9px] text-slate-400 font-extrabold uppercase truncate block">
                                   {details}
                                 </span>
                               </div>
                               <button
                                 onClick={() => {
                                   setNewReferralForm({
                                     studentName: shortName,
                                     tipo: 'pedagogico_geral',
                                     reason: '',
                                     time: getCurrentTime()
                                   });
                                   setShowReferralForm(true);
                                 }}
                                 className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                               >
                                 <Plus className="w-2.5 h-2.5" /> Encaminhar
                               </button>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {filtered.length === 0 ? (
                     matchingStudentsInSchool.length === 0 ? (
                       <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2 text-slate-400">
                         <p className="text-xs font-black">Nenhum aluno ou encaminhamento registrado para os filtros de busca.</p>
                       </div>
                     ) : null
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((ref) => (
                    <div 
                      key={ref.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs relative ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                      }`}
                    >
                      <div className="space-y-2 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-black text-slate-800 dark:text-white block">
                              👦 {ref.studentName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase">
                              🏫 {ref.classroomName}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteReferral(ref.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                            title="Excluir encaminhamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/10">
                            {getReferralTipoLabel(ref.tipo)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                            📅 {ref.data}
                            {ref.time && (
                              <span className="inline-flex items-center gap-0.5 ml-1 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                <Clock className="w-2.5 h-2.5" /> {ref.time}
                              </span>
                            )}
                          </span>
                        </div>

                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl italic leading-relaxed">
                          &ldquo;{ref.reason}&rdquo;
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100/10 text-[9px] text-slate-400 font-bold flex items-center justify-between">
                        <span>Registrado por:</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{ref.registeredBy}</span>
                      </div>
                    </div>
                  ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        </div>
      )}

      {/* 🤝 SECTION 3: Mediação de Conflitos */}
      {activeSubTab === 'conflict_mediation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Protocol Guidelines (4 cols) */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <div className={`p-5 rounded-3xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
              <h4 className="text-xs font-extrabold uppercase text-rose-600 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-rose-500" /> Protocolo de Mediação
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500 font-semibold">
                Pequenas agressões físicas (mordidas, puxões) e disputas territoriais de brinquedos são comuns na primeira infância. 
                Nossa atuação deve ser focada no desenvolvimento socioemocional e mediação assertiva.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-slate-950/40 rounded-2xl border border-rose-100/35 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 block">🛡️ Eixo 1: Proteção e Limite</span>
                  <p className="text-[9px] text-slate-400 leading-normal font-medium">
                    Separar fisicamente e acolher imediatamente a criança atingida de forma carinhosa e neutra. Sem gritos.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950/40 rounded-2xl border border-rose-100/35 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 block">🤝 Eixo 2: Empatia e Cuidado</span>
                  <p className="text-[9px] text-slate-400 leading-normal font-medium">
                    Envolver a criança que bateu/mordeu no cuidado ao amigo (ajudar com o gelo, dar o urso). Estimular a responsabilidade social.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950/40 rounded-2xl border border-rose-100/35 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 block">📋 Eixo 3: Sigilo & Comunicação</span>
                  <p className="text-[9px] text-slate-400 leading-normal font-medium">
                    Informar os responsáveis no privado de maneira discreta, resguardando sempre a identidade da outra criança envolvida.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Logs Registry (8 cols) */}
          <div className="lg:col-span-8 space-y-6 text-left">
            
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Livro de Ocorrências e Mediações Realizadas
              </h4>
              <button
                onClick={() => setShowMediationForm(!showMediationForm)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-750 text-white text-[10px] font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-3xs"
              >
                {showMediationForm ? 'Fechar Registro' : '+ Registrar Ocorrência'}
              </button>
            </div>

            {/* New Mediation Log Form */}
            {showMediationForm && (
              <form onSubmit={handleAddMediation} className={`p-5 rounded-3xl border text-left space-y-3.5 animate-slide-down ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-150'
              }`}>
                <h5 className="text-xs font-extrabold uppercase text-rose-600">✍️ Registrar Mediação Ativa</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Sala / Turma</label>
                    <select
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-rose-500/20 outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                      value={newMediationForm.classroomName}
                      onChange={(e) => setNewMediationForm({ ...newMediationForm, classroomName: e.target.value })}
                    >
                      <option value="">-- Selecione a Turma --</option>
                      {classrooms.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Alunos Envolvidos</label>
                    <input
                      type="text"
                      placeholder="Ex: João e Lucas Santos"
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-rose-500/20 outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                      value={newMediationForm.studentsInvolved}
                      onChange={(e) => setNewMediationForm({ ...newMediationForm, studentsInvolved: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" /> Horário do Ocorrido
                    </label>
                    <input
                      type="time"
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-rose-500/20 outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      value={newMediationForm.time}
                      onChange={(e) => setNewMediationForm({ ...newMediationForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Descrição da Ocorrência / Conflito</label>
                    <VoiceInput 
                      onTranscript={(text) => setNewMediationForm(prev => ({ ...prev, description: prev.description ? prev.description + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <textarea
                    placeholder="Relate os fatos de forma imparcial (ex: disputa de brinquedo, agressão física, mordida, etc.)"
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold h-20 focus:ring-2 focus:ring-rose-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                    value={newMediationForm.description}
                    onChange={(e) => setNewMediationForm({ ...newMediationForm, description: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Medidas Pedagógicas de Resolução Adotadas</label>
                    <VoiceInput 
                      onTranscript={(text) => setNewMediationForm(prev => ({ ...prev, actionTaken: prev.actionTaken ? prev.actionTaken + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <textarea
                    placeholder="Ex: Diálogo sobre sentimentos, círculo de empatia com a turma, entrega de brinquedo compartilhado..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold h-20 focus:ring-2 focus:ring-rose-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                    value={newMediationForm.actionTaken}
                    onChange={(e) => setNewMediationForm({ ...newMediationForm, actionTaken: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="familyNotifiedCheck"
                    className="rounded text-rose-600 focus:ring-rose-500/20"
                    checked={newMediationForm.familyNotified}
                    onChange={(e) => setNewMediationForm({ ...newMediationForm, familyNotified: e.target.checked })}
                  />
                  <label htmlFor="familyNotifiedCheck" className="text-[10px] font-black text-slate-500 uppercase cursor-pointer select-none">
                    Pais/Responsáveis foram notificados confidencialmente
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediationForm(false);
                      setNewMediationForm({
                        classroomName: '',
                        studentsInvolved: '',
                        description: '',
                        actionTaken: '',
                        familyNotified: false,
                        time: getCurrentTime()
                      });
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
                  >
                    Registrar no Livro Confidencial
                  </button>
                </div>
              </form>
            )}

            {/* Mediation Logs List with Search */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Livro de Ocorrências e Mediações Realizadas
                </h4>
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Pesquisar conflitos por aluno ou relato..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-[11px] font-semibold focus:ring-2 focus:ring-rose-500/20 outline-none border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={searchMediation}
                    onChange={(e) => setSearchMediation(e.target.value)}
                  />
                </div>
              </div>

              {(() => {
                const filtered = mediationLogs.filter(m => {
                  const matchesSearch = m.studentsInvolved.toLowerCase().includes(searchMediation.toLowerCase()) || 
                                        m.description.toLowerCase().includes(searchMediation.toLowerCase());
                  const matchesClassroom = selectedClassroom === 'Todas' || m.classroomName === selectedClassroom;
                  return searchMediation.trim() !== '' ? matchesSearch : matchesClassroom;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2 text-slate-400">
                      <p className="text-xs font-black">Nenhuma ocorrência mediada encontrada para os filtros aplicados.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((log) => (
                      <div 
                        key={log.id}
                        className={`p-4 rounded-3xl border space-y-3 shadow-xs relative ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                        }`}
                      >
                        <div className="flex items-start justify-between border-b border-slate-100/10 pb-2">
                          <div>
                            <span className="text-xs font-black text-slate-800 dark:text-white block">
                              🤝 Envolvidos: {log.studentsInvolved}
                            </span>
                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">
                              🏫 {log.classroomName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 justify-end mb-1">
                              📅 {log.date}
                              {log.time && (
                                <span className="inline-flex items-center gap-0.5 ml-1 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                  <Clock className="w-2.5 h-2.5" /> {log.time}
                                </span>
                              )}
                            </span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${
                              log.familyNotified 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400'
                            }`}>
                              {log.familyNotified ? '✓ Pais Notificados' : '⚠️ Notificação Pendente'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs leading-relaxed font-semibold">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Incidente:</span>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300 italic">
                              &ldquo;{log.description}&rdquo;
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-rose-500 block">Mediação Realizada:</span>
                            <p className="text-[10px] text-slate-700 dark:text-slate-200">
                              {log.actionTaken}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100/10 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                          <span>Registrado por: <strong className="text-slate-600 dark:text-slate-300">{log.registeredBy}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
