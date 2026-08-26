import React, { useState, useEffect, useRef } from 'react';
import { Idoso, TarefaDiaria, Usuario, TaskType, TaskStatus, RegistroAlimentacao, RegistroHidratacao, RegistroHumor, RegistroSono, RegistroAtividade, SinalVital, Medicamento, formatWhatsAppNumber, NotificacaoSimulada, Classroom, isStaffUser, isDirectorOrAdminUser, getRoleLabel } from '../types';
import { getFromDB, saveToDB, checkFeedingCareAuthorization, SALAS_INICIAIS, getShiftActiveState, setShiftActiveState, setShiftActiveStatesBatch, getAssignedTeacherForRoom, getStudentRoomName, resetStudentDailyRoutine, checkBottleFeedingInterval, registerBottleAttemptNotice, purgeOrphanedStudentData } from '../data';
import { deleteFromFirestore, deleteStudentDataFromFirestore } from '../firebase';
import { 
  ItemFilaOffline, 
  adicionarItemFila, 
  obterItensPendentes, 
  atualizarStatusSincronizado, 
  obterItensSincronizados, 
  limparBancoOfflineSync 
} from '../lib/indexedDB';
import { LgpdConsentModal } from './LgpdConsentModal';
import { VoiceInput } from './VoiceInput';
import { QuickStudentSearch } from './QuickStudentSearch';
import { AuraSmartRegisterModal } from './AuraSmartRegisterModal';
import { parseAuraRawPlan, formatAuraTaskTitle, inferTaskType, realignPedagogicalActivity, isConversationalChatNoise, areTaskTitlesSimilar, mergeSimilarTasks, findMatchingMealTask } from '../utils/auraPlanParser';
import { 
  Heart, 
  Sparkles, 
  Activity, 
  Droplets, 
  Calendar, 
  Coffee, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Users, 
  FileText, 
  MessageSquare,
  Clock,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Send,
  HelpCircle,
  Plus,
  Wifi,
  WifiOff,
  RotateCw,
  RotateCcw,
  Play,
  Square,
  Check,
  Lock,
  Smile,
  ShieldCheck,
  Camera,
  Layers,
  Thermometer,
  Eye,
  Settings,
  Trash2,
  Pencil,
  UserX,
  Phone,
  X,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';

interface DashboardProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario;
  onNavigate: (screen: string) => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
    darkMode: boolean;
  };
  triggerWhatsAppSim: (titulo: string, mensagem: string) => void;
  keyTrigger: number;
  appMode?: 'idoso' | 'escolar_infantil' | 'escolar_fundamental';
  onToggleAppMode?: () => void;
  onSwitchUsuario?: (userId: string) => void;
  onSwitchIdoso?: (id: string) => void;
  onLogout?: () => void;
}

const getTodayIso = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const getTodayBr = () => {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

const getNowTimeBr = () => {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isTodayOrDemoDate = (d?: string) => {
  if (!d) return false;
  const todayIso = getTodayIso();
  const todayBr = getTodayBr();
  const cleanD = d.split(' ')[0].split('T')[0];
  if (cleanD === todayIso || cleanD === todayBr || d === todayIso || d === todayBr) return true;

  try {
    const parts = cleanD.includes('/') ? cleanD.split('/') : cleanD.includes('-') ? cleanD.split('-') : [];
    if (parts.length === 3) {
      const now = new Date();
      let day: number, month: number, year: number;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        if (year === now.getFullYear() && month === (now.getMonth() + 1) && Math.abs(day - now.getDate()) <= 1) {
          return true;
        }
      }
    }
  } catch (e) {}
  return false;
};

const getTodayHydrationRecords = (idosoId: string): RegistroHidratacao[] => {
  const todayIso = getTodayIso();
  const todayBr = getTodayBr();

  const globalWater = getFromDB<any[]>('anjo_hidratacao', []);
  const studentWater1 = getFromDB<any[]>(`anjo_registro_agua_${idosoId}`, []);
  const studentWater2 = getFromDB<any[]>(`anjo_hidratacao_${idosoId}`, []);

  const combinedRaw: any[] = [];
  [...globalWater, ...studentWater1, ...studentWater2].forEach(item => {
    if (!item) return;
    const itemStudentId = item.idosoId || idosoId;
    if (itemStudentId !== idosoId) return;
    combinedRaw.push(item);
  });

  // Check if there are real records created today for this student
  const hasTodayRealRecords = combinedRaw.some(item => {
    if (!item.data) return false;
    const cleanD = String(item.data).split(' ')[0].split('T')[0];
    return cleanD === todayIso || cleanD === todayBr;
  });

  const waterMap = new Map<string, RegistroHidratacao>();

  combinedRaw.forEach((item, idx) => {
    if (!item) return;
    if (item.data) {
      const cleanD = String(item.data).split(' ')[0].split('T')[0];
      // If real user records exist for today, exclude static demo records from 2026-05-30
      if (hasTodayRealRecords && cleanD !== todayIso && cleanD !== todayBr) {
        return;
      }
      if (!isTodayOrDemoDate(item.data)) return;
    }

    // Unique record ID (or fallback per record) to prevent dropping multiple cups logged in the same minute
    const id = item.id || `hid_fallback_${item.horario || ''}_${item.quantidadeMl || item.ml || ''}_${idx}`;
    const timeStr = item.horario || item.time || '';
    const mlVal = Number(item.quantidadeMl || item.ml || item.quantidade || 0);

    if (!waterMap.has(id)) {
      waterMap.set(id, {
        id,
        idosoId,
        quantidadeMl: mlVal > 0 ? mlVal : 150,
        horario: timeStr || '10:00',
        data: item.data || todayIso,
        registradoPor: item.registradoPor || 'Equipe Escolar'
      });
    }
  });

  return Array.from(waterMap.values());
};

const formatShiftTime = (rawTime?: string | null, fallback = '07:30') => {
  if (!rawTime) return fallback;
  if (/^\d{2}:\d{2}$/.test(rawTime)) return rawTime;
  if (/^\d{2}:\d{2}:\d{2}$/.test(rawTime)) return rawTime.substring(0, 5);
  if (rawTime === 'In√≠cio do Turno' || rawTime.includes('Invalid')) return fallback;
  try {
    const d = new Date(rawTime);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {}
  return fallback;
};

export default function Dashboard({ 
  idoso, 
  usuarioAtual, 
  onNavigate, 
  accessibilitySettings,
  triggerWhatsAppSim,
  keyTrigger,
  appMode = 'idoso',
  onToggleAppMode,
  onSwitchUsuario,
  onSwitchIdoso,
  onLogout
}: DashboardProps) {
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental' || (idoso?.id ? idoso.id.startsWith('aluno_') : false);
  const isApresentacao = localStorage.getItem('anjo_modo_apresentacao') === 'true';
  const isFundamental = false;
  const labelIdoso = isEscolar ? 'Aluno' : 'Idoso';
  const labelCuidador = isEscolar ? 'Professora' : 'Cuidador';
  const labelSinaisVitais = isEscolar ? 'Sinais de Sa√∫de & Temperatura' : 'Sinais Vitais';
  const labelPlanoCuidado = isEscolar ? 'Instru√ß√µes da Classe & Rotina' : 'Plano de Cuidado';
  const labelObservacoes = isEscolar ? 'Observa√ß√µes Gerais & Rotina' : 'Observa√ß√µes de Rotina';
  const labelMedicamento = isEscolar ? 'Medica√ß√£o Encomendada' : 'Medicamento';

  const renderDashboardAuthBadge = () => {
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs mb-3">
          <div className="text-xl">‚ö†Ô∏è</div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-rose-950">
              {isEscolar ? 'Alimenta√ß√£o e Cuidados N√£o Autorizados' : 'Sem Autoriza√ß√£o de Cuidados'}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isEscolar 
                ? 'Nenhum pai ou respons√°vel autorizou "Alimenta√ß√£o e Cuidados" no painel de Pais & Autorizados para este aluno. Registros e a√ß√µes r√°pidas est√£o bloqueados para cuidadoras e professoras.'
                : 'Nenhum familiar autorizou "Alimenta√ß√£o e Cuidados" no painel. Registros r√°pidos est√£o bloqueados para os cuidadores.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 shadow-3xs mb-3">
        <div className="text-emerald-600 bg-white p-1 rounded-full text-xs font-black shadow-3xs">‚úì</div>
        <div className="text-xs font-semibold text-emerald-950">
          {isEscolar ? 'Autoriza√ß√£o Ativa dos Pais: ' : 'Autoriza√ß√£o Ativa da Fam√≠lia: '}
          <span className="font-extrabold text-emerald-800">
            {auth.authorizedNames.join(', ')}
          </span>
        </div>
      </div>
    );
  };

  const getAdaptiveTask = (task: TarefaDiaria): TarefaDiaria => {
    if (!isEscolar) return task;
    
    let titulo = task.titulo;
    let descricao = task.descricao;
    let completadaPor = task.completadaPor;

    // Adapt caregiver name
    if (completadaPor) {
      completadaPor = completadaPor
        .replace(/Ana Silva \(Cuidadora\)/g, 'Prof¬™ Ana Silva (Educadora)')
        .replace(/cuidador/gi, 'professor')
        .replace(/cuidadora/gi, 'professora');
    }

    // Se j√° for uma atividade escolar pr√≥pria, de planejamento (Aura), manual ou se j√° possuir descri√ß√£o personalizada, N√ÉO reescreve o t√≠tulo nem a descri√ß√£o
    const isExplicitSchoolTask = 
      task.id.startsWith('task_s_') || 
      task.id.startsWith('task_aura_') || 
      task.id.startsWith('task_custom_') || 
      task.id.startsWith('ati_') || 
      task.id.startsWith('act-') || 
      task.id.startsWith('aura_') || 
      task.id.startsWith('custom_') || 
      task.id.startsWith('aluno_') || 
      Boolean(task.descricao && task.descricao.trim().length > 0) ||
      (task.titulo && /[\u{1F300}-\u{1FAFF}]/u.test(task.titulo));

    if (isExplicitSchoolTask) {
      return {
        ...task,
        completadaPor
      };
    }

    // Legacy Elderly Title adaptations (apenas para tarefas legadas do modo idoso sem descri√ß√£o pr√©via)
    if (titulo.includes('Losartana')) {
      titulo = 'Soro / Inala√ß√£o de Rotina üëÉ';
      descricao = 'Fazer inala√ß√£o com 3ml de soro fisiol√≥gico mandado na mala (preven√ß√£o de tempo seco)';
    } else if (titulo.includes('C√°lcio + Vitamina D') || titulo.includes('C√°lcio')) {
      titulo = 'Vitaminas / Suplemento da Tarde üçè';
      descricao = 'Dar 1 sachet de gostinho de laranja (mandado na mochila para o lanche)';
    } else if (titulo.includes('Metformina')) {
      titulo = 'Rem√©dio da Gripe / Amoxicilina üíä';
      descricao = 'Dar 5ml da Amoxicilina de acordo com a autoriza√ß√£o assinada na mochila.';
    } else if (titulo.includes('Donepezila') || titulo.includes('Aricept')) {
      titulo = 'Alergika Preventivo / Gotas üíß';
      descricao = 'Dar 5 gotinhas do antial√©rgico preventivo antes da soneca da classe.';
    } else if (titulo.includes('Caf√© da manh√£') || titulo.includes('Caf√©')) {
      titulo = 'Lanche da Manh√£ & Frutinhas üçé';
      descricao = 'Frutas frescas da esta√ß√£o, biscoito integral e incentivo √† hidrata√ß√£o.';
    } else if (titulo.includes('Almo√ßo')) {
      titulo = 'Almo√ßo Saud√°vel / Papinha üç≤';
      descricao = 'Pratinho balanceado, introdu√ß√£o de novos sabores, verduras e carninha desfiada.';
    } else if (titulo.includes('Banho de Sol') || titulo.includes('Alongamento') || titulo.includes('Exerc√≠cio') || titulo.includes('Fisioterapia')) {
      titulo = 'Recrea√ß√£o no P√°tio & Parquinho üß∏';
      descricao = 'Brincadeiras ao ar livre, estimula√ß√£o f√≠sica e intera√ß√£o na rodinha pedag√≥gica.';
    } else if (titulo.includes('Banho &') || titulo.includes('Higiene')) {
      titulo = 'Fralda & Higiene Geral üë∂';
      descricao = 'Acompanhar no banheiro, verificar fralda e trocar se necess√°rio. Lavar m√£os.';
    } else if (titulo.includes('Copos d\'√Ågua') || titulo.includes('Hidrata√ß√£o')) {
      titulo = 'Hora da Garrafinha de √Ågua ü•§';
      descricao = 'Estimular o aluno a beber √°gua na sua garrafinha com canudo.';
    }

    return {
      ...task,
      titulo,
      descricao: task.descricao && task.descricao.trim().length > 0 ? task.descricao : descricao,
      completadaPor
    };
  };

  const [tarefas, setTarefas] = useState<TarefaDiaria[]>([]);
  const [observacaoRapida, setObservacaoRapida] = useState<{ [key: string]: string }>({});
  
  // Quick Actions forms
  const [quickVitals, setQuickVitals] = useState({ pressao: '', glicemia: '', temp: '', fCard: '', sat: '', peso: '', obs: '' });
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    studentName: string;
    existingInfo: string;
    newInfo: string;
    isIdentical: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [sleepStart, setSleepStart] = useState('13:00');
  const [sleepEnd, setSleepEnd] = useState('14:30');
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsSavedMessage, setVitalsSavedMessage] = useState('');
  const [previewMedPhotoModal, setPreviewMedPhotoModal] = useState<{
    url: string;
    title: string;
    dosagem?: string;
    frequencia?: string;
    horarios?: string[];
    obs?: string;
  } | null>(null);

  // 1. Perspective Toggling state (Default based on user type)
  const isFamilyByDefault = !isStaffUser(usuarioAtual);
  const [visualMode, setVisualMode] = useState<'cuidador' | 'familia'>(
    isFamilyByDefault ? 'familia' : 'cuidador'
  );

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    return getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
  });

  useEffect(() => {
    const handleRoomsUpdate = () => {
      setClassrooms(getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS));
    };
    window.addEventListener('anjo_user_updated', handleRoomsUpdate);
    return () => {
      window.removeEventListener('anjo_user_updated', handleRoomsUpdate);
    };
  }, []);

  const [showRoomPinModal, setShowRoomPinModal] = useState(false);
  const [pendingRoomToSwitch, setPendingRoomToSwitch] = useState<string | null>(null);
  const [roomPinInput, setRoomPinInput] = useState('');
  const [roomPinError, setRoomPinError] = useState('');

  const executeSwitchClassroom = (classroomName: string) => {
    // 1. Find matching student in this classroom to switch active profile
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    let match = allStudents.find(s => s.id.startsWith('aluno_') && isStudentInRoom(s, classroomName));
    if (!match) {
      const targetBase = classroomName.split(' - ')[0].toLowerCase().trim();
      match = allStudents.find(s => s.id.startsWith('aluno_') && (s.nome.toLowerCase().includes(targetBase) || (s.salaAula && s.salaAula.toLowerCase().includes(targetBase))));
    }
    if (!match) {
      match = allStudents.find(s => isStudentInRoom(s, classroomName));
    }
    if (!match && allStudents.length > 0) {
      match = allStudents[0];
    }

    // 2. Switch active student if found
    if (match && onSwitchIdoso) {
      onSwitchIdoso(match.id);
    }

    // 3. Switch active teacher profile to the assigned teacher for this classroom if different
    const assignedTeacher = getAssignedTeacherForRoom(classroomName, usuarioAtual);
    if (assignedTeacher && onSwitchUsuario && assignedTeacher.id !== usuarioAtual?.id) {
      (onSwitchUsuario as any)(assignedTeacher.id, match?.id);
    } else if (usuarioAtual && isDirectorOrAdminUser(usuarioAtual)) {
      // If director/admin, maintain profile but adjust active room view
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: usuarioAtual }));
    }

    showToast(`‚úì Sala alterada para ${classroomName}!`, 'success');
  };

  const handleSwitchClassroom = (classroomName: string) => {
    // Master demo, Directors and Admins can switch directly
    const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
    const isDirector = isDirectorOrAdminUser(usuarioAtual);
    const isAlreadyAssigned = usuarioAtual?.salaAula?.toLowerCase().split(',').map(r => r.trim()).includes(classroomName.toLowerCase().trim());

    if (isDirector || isMaster || isAlreadyAssigned) {
      executeSwitchClassroom(classroomName);
      return;
    }

    // Require PIN verification to release access to another classroom
    setPendingRoomToSwitch(classroomName);
    setRoomPinInput('');
    setRoomPinError('');
    setShowRoomPinModal(true);
  };

  const handleVerifyRoomPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRoomToSwitch) return;

    const pin = roomPinInput.trim();
    if (!pin) {
      setRoomPinError('Digite o PIN de 4 d√≠gitos para prosseguir.');
      return;
    }

    const assignedTeacher = getAssignedTeacherForRoom(pendingRoomToSwitch, usuarioAtual);
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);

    const checkUserPin = (u: Usuario | null | undefined) => {
      if (!u) return false;
      const phoneDigits = u.telefone ? u.telefone.replace(/\D/g, '') : '';
      const userPin = u.pin || (phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '1234');
      return pin === userPin;
    };

    const isDirectorOrAdmin = isDirectorOrAdminUser(usuarioAtual);
    const isValidPin = 
      pin === '9181' ||
      pin === '8191' || 
      pin === '3031' || 
      checkUserPin(assignedTeacher) || 
      (isDirectorOrAdmin && checkUserPin(usuarioAtual)) || 
      allUsers.some(u => isDirectorOrAdminUser(u) && checkUserPin(u));

    if (isValidPin) {
      if (pin === '9181' || pin === '8191' || pin === '3031') {
        localStorage.setItem('anjo_master_demonstracao_ativo', 'true');
      }
      const roomToOpen = pendingRoomToSwitch;
      setShowRoomPinModal(false);
      setPendingRoomToSwitch(null);
      executeSwitchClassroom(roomToOpen);
      showToast(`‚úì PIN correto! Acesso liberado para a sala ${roomToOpen}.`, 'success');
    } else {
      setRoomPinError('‚ùå PIN incorreto! Digite o PIN da educadora, o PIN da Diretora Nilva (3031) ou o PIN Dev (9181).');
    }
  };

  // 2. Simulated Connection State
  const [simulatedOnline, setSimulatedOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem('anjo_simulated_online');
    return saved !== 'false'; // default to true
  });

  // 3. Active Shift controls
  const [isShiftActive, setIsShiftActive] = useState<boolean>(() => {
    return getShiftActiveState(idoso.id).active;
  });
  const [isAbsent, setIsAbsent] = useState<boolean>(() => {
    return localStorage.getItem(`anjo_is_absent_${idoso.id}`) === 'true';
  });
  const [shiftStartTime, setShiftStartTime] = useState<string | null>(() => {
    return getShiftActiveState(idoso.id).startTime;
  });
  const [elapsedShiftTime, setElapsedShiftTime] = useState<string>('00:00:00');

  // 4. Offline sync queue states
  const [filaOffline, setFilaOffline] = useState<ItemFilaOffline[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 5. LGPD Data compliance state
  const checkUserLgpdConsent = (usr: Usuario | null) => {
    if (localStorage.getItem('anjo_lgpd_accepted') === 'true') return true;
    if (!usr) return true;
    const userKey = `anjo_lgpd_accepted_${usr.id}`;
    const savedUserVal = localStorage.getItem(userKey);
    if (savedUserVal === 'false') return false;
    if (savedUserVal === 'true') return true;
    return true; // Default to true so profile switching never repeatedly forces LGPD authorization modal
  };

  const [lgpdAccepted, setLgpdAccepted] = useState<boolean>(() => {
    return checkUserLgpdConsent(usuarioAtual);
  });

  useEffect(() => {
    setLgpdAccepted(checkUserLgpdConsent(usuarioAtual));
  }, [usuarioAtual?.id]);

  // Turn reports history for rendering
  const [turnSummaries, setTurnSummaries] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_turn_summaries_${idoso.id}`, []);
  });

  const [selectedReportModal, setSelectedReportModal] = useState<any | null>(null);

  const [vitalsUpdateTrigger, setVitalsUpdateTrigger] = useState(0);

  useEffect(() => {
    const list = getFromDB<any[]>(`anjo_turn_summaries_${idoso.id}`, []);
    setTurnSummaries(list);
    setOccurrencesList(getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []));
    setLgpdLogs(getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, [
      { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Hist√≥rico de Rotina', data: 'Hoje √†s 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
      { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualiza√ß√£o do Painel de Tranquilidade', data: 'Hoje √†s 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
    ]));
    if (typeof loadTasks === 'function') {
      loadTasks();
    }

    // Check if URL has ?relatorio= query parameter
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const relatorioId = urlParams.get('relatorio');
      if (relatorioId) {
        const foundReport = list.find((r: any) => r.id === relatorioId) || {
          id: relatorioId,
          cuidador: 'Prof¬™ Nilva Amaral',
          data: new Date().toLocaleDateString('pt-BR'),
          duracao: 'Per√≠odo Completo',
          inicio: '07:30',
          fim: '17:30',
          taxaConformidade: 98,
          taxaQualidade: 100,
          mensagemCompleta: `üå≥ A √ÅRVORE DA INF√ÇNCIA HOJE:
Hoje a √°rvore do(a) *${idoso.nome.split(' (')[0]}* floresceu no Anjinho Escolar:
‚Ä¢ üçÉ *Folhas verdes:* Nutri√ß√£o balanceada e hidrata√ß√£o regular (100ml);
‚Ä¢ üå∏ *Flores e borboletas:* Momento acolhedor de soneca e descanso (45min);
‚Ä¢ üçé *Frutos e passarinhos:* Atividades pedag√≥gicas e trabalhinhos manuais;
‚Ä¢ ü™µ *Tronco forte:* Cuidados di√°rios, higiene e sa√∫de acompanhados de perto (36.5¬∞C).

‚òÄÔ∏èüíß *PARTICIPE DA JORNADA DO(A) ${idoso.nome.split(' (')[0].toUpperCase()}!*
Abra as fotos no aplicativo e regue a √°rvore do seu filho enviando uma das manifesta√ß√µes de afeto:
‚ú® *Que encanto!* ‚Ä¢ ‚ù§Ô∏è *Feito com amor* ‚Ä¢ üåü *Puro brilho!* ‚Ä¢ ü§ù *Orgulho da gente* ‚Ä¢ üíé *Um tesouro!*

_(Cada manifesta√ß√£o sua ilumina e rega a √°rvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o di√°rio de rotina escolar completo pelo link seguro:
üîó ${window.location.origin}/?relatorio=${relatorioId}

Com carinho,
Equipe Anjinho Escolar ‚ù§Ô∏èüïäÔ∏è`
        };
        setSelectedReportModal(foundReport);
      }
    } catch (e) {
      console.error(e);
    }
  }, [idoso.id, vitalsUpdateTrigger]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // States to add / edit specific health conditions or allergies per child
  const [showAddSpecialField, setShowAddSpecialField] = useState(false);
  const [newSpecialValue, setNewSpecialValue] = useState('');
  const [newSpecialType, setNewSpecialType] = useState<'condicao' | 'alergia'>('condicao');

  const handleDeleteCondicao = (condToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para excluir informa√ß√µes!");
      return;
    }
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allSeniors.map(sen => {
      if (sen.id === idoso.id) {
        return {
          ...sen,
          condicoesMedicas: (sen.condicoesMedicas || []).filter(c => c !== condToRemove)
        };
      }
      return sen;
    });
    saveToDB('anjo_idosos', updated);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    showToast('‚úì Rotina/condi√ß√£o removida com sucesso!', 'success');
  };

  const handleDeleteAlergia = (alergToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para excluir informa√ß√µes!");
      return;
    }
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allSeniors.map(sen => {
      if (sen.id === idoso.id) {
        return {
          ...sen,
          alergias: (sen.alergias || []).filter(a => a !== alergToRemove)
        };
      }
      return sen;
    });
    saveToDB('anjo_idosos', updated);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    showToast('‚úì Alergia removida com sucesso!', 'success');
  };

  const handleDeleteHygieneObservation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para excluir observa√ß√µes!");
      return;
    }
    triggerConfirm(
      'Excluir Observa√ß√£o de Higiene',
      'Tem certeza de que deseja apagar a observa√ß√£o de higiene gravada hoje para este aluno/crian√ßa?',
      () => {
        const existingHyg = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, {});
        const updatedHyg = {
          ...existingHyg,
          observations: '',
          obs: ''
        };
        saveToDB(`anjo_higiene_log_${idoso.id}`, updatedHyg);
        setQuickHygiene(prev => ({ ...prev, observations: '' }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
          window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
        }
        setVitalsUpdateTrigger(prev => prev + 1);
        showToast('‚úì Observa√ß√£o de higiene apagada com sucesso!', 'success');
      }
    );
  };

  const handleResetAllHygiene = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para limpar ou excluir registros!");
      return;
    }
    triggerConfirm(
      'Limpar Registros de Higiene',
      'Tem certeza de que deseja desmarcar os itens e apagar a observa√ß√£o de higiene de hoje?',
      () => {
        const resetHyg = {
          bath: false,
          teeth: false,
          clothes: false,
          diaper: false,
          hands: false,
          cream: false,
          observations: '',
          obs: ''
        };
        saveToDB(`anjo_higiene_log_${idoso.id}`, resetHyg);
        setQuickHygiene(resetHyg);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
          window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
        }
        setVitalsUpdateTrigger(prev => prev + 1);
        showToast('‚úì Registros de higiene limpos com sucesso!', 'success');
      }
    );
  };

  const handleDeleteOccurrence = (occurrenceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para excluir ocorr√™ncias!");
      return;
    }
    triggerConfirm(
      'Excluir Ocorr√™ncia / Registro de Cuidado',
      'Tem certeza de que deseja apagar esta ocorr√™ncia/anota√ß√£o de cuidado registrada hoje?',
      () => {
        const updated = occurrencesList.filter(o => o.id !== occurrenceId);
        setOccurrencesList(updated);
        saveToDB(`anjo_ocorrencias_${idoso.id}`, updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_ocorrencias_${idoso.id}` } }));
        }
        showToast('‚úì Ocorr√™ncia/Registro de cuidado removido com sucesso!', 'success');
      }
    );
  };

  const handleCreateSpecialAttr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialValue.trim()) return;

    const val = newSpecialValue.trim();
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allSeniors.map(sen => {
      if (sen.id === idoso.id) {
        if (newSpecialType === 'condicao') {
          const currentConds = sen.condicoesMedicas || [];
          return {
            ...sen,
            condicoesMedicas: [...currentConds.filter(c => c !== val), val]
          };
        } else {
          const currentAlergias = sen.alergias || [];
          return {
            ...sen,
            alergias: [...currentAlergias.filter(a => a !== val), val]
          };
        }
      }
      return sen;
    });

    saveToDB('anjo_idosos', updated);
    setNewSpecialValue('');
    setShowAddSpecialField(false);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  useEffect(() => {
    const handleUpdate = (e: any) => {
      console.log('üì° [Dashboard Component] Evento db-vitals-update / anjo_user_updated recebido na tela do Respons√°vel/Fam√≠lia!', { timestamp: new Date().toISOString(), detail: e?.detail });
      setVitalsUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('db-vitals-update', handleUpdate);
    window.addEventListener('anjo_user_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Periodic sync interval (every 2.5s) to guarantee parent panel stays updated with teacher notebook entries
    const syncInterval = setInterval(() => {
      setVitalsUpdateTrigger(prev => prev + 1);
    }, 2500);

    return () => {
      window.removeEventListener('db-vitals-update', handleUpdate);
      window.removeEventListener('anjo_user_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(syncInterval);
    };
  }, []);

  // LGPD Auditoria e Governan√ßa de acessos
  const [lgpdLogs, setLgpdLogs] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, [
      { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Hist√≥rico de Rotina', data: 'Hoje √†s 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
      { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualiza√ß√£o do Painel de Tranquilidade', data: 'Hoje √†s 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
    ]);
  });

  // Ocorr√™ncias registradas no turno
  const [occurrencesList, setOccurrencesList] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []);
  });

  // Compartilhamento manual via WhatsApp para ocorr√™ncias
  const [showManualOccurrenceShareModal, setShowManualOccurrenceShareModal] = useState(false);
  const [manualShareOccurrenceMessage, setManualShareOccurrenceMessage] = useState<string | null>(null);
  const [activeSharingOccurrenceId, setActiveSharingOccurrenceId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [familiarShareStatuses, setFamiliarShareStatuses] = useState<{ [key: string]: 'pendente' | 'aberto' | 'confirmado' }>({});
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  // Compartilhamento coletivo via WhatsApp para encerramento de per√≠odo letivo
  const [showCollectiveShareModal, setShowCollectiveShareModal] = useState(false);
  const [collectiveShareList, setCollectiveShareList] = useState<any[]>([]);
  const [copiedCollectiveIndex, setCopiedCollectiveIndex] = useState<number | null>(null);
  const [collectiveShareStatuses, setCollectiveShareStatuses] = useState<Record<string, 'pendente' | 'aberto' | 'confirmado'>>({});

  // Shift end review states
  const [showShiftReviewModal, setShowShiftReviewModal] = useState(false);
  const [shiftReviewPayload, setShiftReviewPayload] = useState<any>(null);
  const [showSimulationTools, setShowSimulationTools] = useState(false);

  // Safe Sandboxed Custom Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Occurrence modal states
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [occurrenceForm, setOccurrenceForm] = useState({ tipo: 'queda', criticidade: 'amarelo', descricao: '' });
  const [emergencyMinimized, setEmergencyMinimized] = useState(true);

  // Stop Shift Reason Modal states
  const [showStopIndividualShiftModal, setShowStopIndividualShiftModal] = useState(false);
  const [stopShiftReason, setStopShiftReason] = useState('Consulta M√©dica / Exame');
  const [stopShiftNote, setStopShiftNote] = useState('');

  // Caregiver/Educator access restriction states for family members
  const [showCaregiverPinModal, setShowCaregiverPinModal] = useState(false);
  const [caregiverPinValue, setCaregiverPinValue] = useState('');
  const [caregiverPinError, setCaregiverPinError] = useState('');

  const handleVerifyCaregiverPin = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    
    // Check if entered pin matches any professional caregiver or professional (strict block on family / admin)
    const matchingUser = allUsers.find(u => 
      (u.tipo === 'cuidador' || u.tipo === 'profissional' || u.tipo === 'professor' || u.tipo === 'professora' || u.tipo === 'educador' || u.tipo === 'educadora' || isStaffUser(u)) && 
      u.pin === caregiverPinValue
    );

    if (matchingUser) {
      setVisualMode('cuidador');
      setShowCaregiverPinModal(false);
      setCaregiverPinValue('');
      setCaregiverPinError('');
      // Play high-fidelity alert success chime
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (err) {}
    } else {
      setCaregiverPinError('PIN incorreto ou n√£o pertence a um profissional de plant√£o.');
      // Play error tone
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (err) {}
    }
  };

  const handleSetVisualMode = (mode: 'cuidador' | 'familia') => {
    setVisualMode(mode);
  };

  // Quick Action form states
  const [quickMeal, setQuickMeal] = useState<{ refeicao: string; aceitacao: string; observacao: string; quantidadeMl?: number }>({ refeicao: 'cafe_manha', aceitacao: 'muito_bem', observacao: '', quantidadeMl: 180 });
  const [quickHygiene, setQuickHygiene] = useState(() => {
    const saved = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, null);
    if (saved) {
      return {
        bath: Boolean(saved.bath ?? saved.banho),
        teeth: Boolean(saved.teeth ?? saved.higieneBucal),
        clothes: Boolean(saved.clothes ?? saved.trocaRoupa),
        diaper: Boolean(saved.diaper ?? saved.trocaFralda),
        hands: Boolean(saved.hands ?? saved.bath),
        cream: Boolean(saved.cream ?? saved.pele),
        observations: saved.observations || saved.obs || ''
      };
    }
    return { bath: false, teeth: false, clothes: false, diaper: false, hands: false, cream: false, observations: '' };
  });

  const handleHygieneChange = (updatedFields: Partial<typeof quickHygiene>) => {
    setQuickHygiene(prev => {
      const next = { ...prev, ...updatedFields };
      saveToDB(`anjo_higiene_log_${idoso.id}`, next);
      return next;
    });
  };
  const [quickHumor, setQuickHumor] = useState({ estado: 'calmo', observacao: '' });
  const [quickHydrationAmount, setQuickHydrationAmount] = useState(50);

  // States for adding and editing tasks in care agenda
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<{ tipo: TaskType; titulo: string; descricao: string; horarioPrevisto: string }>({
    tipo: 'alimentacao',
    titulo: '',
    descricao: '',
    horarioPrevisto: '12:00'
  });
  const [taskScope, setTaskScope] = useState<'individual' | 'coletivo'>('individual');
  const [taskModeAura, setTaskModeAura] = useState<'direto' | 'aura_weekly'>('direto');
  const [auraWeeklyText, setAuraWeeklyText] = useState('');
  const [isParsingAuraWeekly, setIsParsingAuraWeekly] = useState(false);
  const [auraMergeMode, setAuraMergeMode] = useState<'substituir' | 'adicionar'>('substituir');
  const [selectedAuraDayTab, setSelectedAuraDayTab] = useState<string>('todos');
  const [auraDetectedMeta, setAuraDetectedMeta] = useState<{ dia: string; dataStr: string; dataIso?: string; tema: string; turma: string } | null>(null);
  const [parsedAuraTasks, setParsedAuraTasks] = useState<Array<{
    dia: string;
    dataStr?: string;
    dataIso?: string;
    tema?: string;
    turma?: string;
    tipo: TaskType;
    titulo: string;
    descricao: string;
    horario: string;
    objetivoBNCC?: string;
    materiais?: string[];
  }>>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState<{ id: string; tipo: TaskType; titulo: string; descricao: string; horarioPrevisto: string }>({
    id: '',
    tipo: 'alimentacao',
    titulo: '',
    descricao: '',
    horarioPrevisto: ''
  });

  // Sizing styles for accessibility
  const titleClass = accessibilitySettings.fontSize === 'normal' 
    ? 'text-2xl font-bold' 
    : accessibilitySettings.fontSize === 'grande' 
    ? 'text-3xl font-bold' 
    : 'text-4xl font-extrabold';

  const bodyClass = accessibilitySettings.fontSize === 'normal' 
    ? 'text-base' 
    : accessibilitySettings.fontSize === 'grande' 
    ? 'text-lg' 
    : 'text-xl font-medium';

  // Load / Generate tasks on load
  useEffect(() => {
    loadTasks();
    loadOfflineQueue();
    const activeShift = getShiftActiveState(idoso.id);
    setIsShiftActive(activeShift.active);
    setShiftStartTime(activeShift.startTime);
    setIsAbsent(localStorage.getItem(`anjo_is_absent_${idoso.id}`) === 'true');

    // Synchronize quick hygiene state from localStorage
    const savedHyg = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, null);
    if (savedHyg) {
      setQuickHygiene({
        bath: Boolean(savedHyg.bath ?? savedHyg.banho),
        teeth: Boolean(savedHyg.teeth ?? savedHyg.higieneBucal),
        clothes: Boolean(savedHyg.clothes ?? savedHyg.trocaRoupa),
        diaper: Boolean(savedHyg.diaper ?? savedHyg.trocaFralda),
        hands: Boolean(savedHyg.hands ?? savedHyg.bath),
        cream: Boolean(savedHyg.cream ?? savedHyg.pele),
        observations: savedHyg.observations || savedHyg.obs || ''
      });
    } else {
      setQuickHygiene({
        bath: false,
        teeth: false,
        clothes: false,
        diaper: false,
        hands: false,
        cream: false,
        observations: ''
      });
    }

    // Synchronize sleep state from localStorage
    const sonos = getFromDB<any[]>('anjo_sono', []).filter(s => s.idosoId === idoso.id && isTodayOrDemoDate(s.data));
    if (sonos.length > 0 && !quickVitals.pressao) {
      const lastSono = sonos[sonos.length - 1];
      if (lastSono.dormiuEm && lastSono.acordouEm) {
        setSleepStart(lastSono.dormiuEm);
        setSleepEnd(lastSono.acordouEm);
        setQuickVitals(prev => (prev.pressao ? prev : { ...prev, pressao: `Dormiu das ${lastSono.dormiuEm} √†s ${lastSono.acordouEm}` }));
      }
    }
  }, [idoso, keyTrigger, appMode, vitalsUpdateTrigger]);

  // Initialize mood state only when changing selected student / senior
  useEffect(() => {
    const humors = getFromDB<RegistroHumor[]>('anjo_humor', []).filter(h => h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
    if (humors.length > 0) {
      const lastHumor = humors[humors.length - 1];
      setQuickHumor({ estado: lastHumor.estado || 'calmo', observacao: '' });
    } else {
      setQuickHumor({ estado: 'calmo', observacao: '' });
    }
  }, [idoso?.id]);

  // Synchronize visualMode when current user profile changes
  useEffect(() => {
    if (!isStaffUser(usuarioAtual)) {
      setVisualMode('familia');
    } else {
      setVisualMode('cuidador');
    }
  }, [usuarioAtual]);

  // Real-time listener & periodic poll for shift state synchronization across devices (e.g. PC teacher & Mobile parent)
  useEffect(() => {
    const syncShiftState = (event?: Event) => {
      let remoteItems: any[] | undefined;
      
      if (event instanceof CustomEvent && event.detail?.items) {
        remoteItems = event.detail.items;
      }
      
      let targetId = idoso.id;
      const currentMode = (localStorage.getItem('anjo_app_mode') as string) || appMode || 'escolar_infantil';
      if (currentMode.startsWith('escolar')) {
        if (targetId === 'idoso_maria') targetId = 'aluno_1';
        else if (targetId === 'idoso_joao') targetId = 'aluno_2';
      } else {
        if (targetId === 'aluno_1') targetId = 'idoso_maria';
        else if (targetId === 'aluno_2') targetId = 'idoso_joao';
      }

      const activeShift = getShiftActiveState(targetId, remoteItems);
      console.log(`üì° [Dashboard Component] syncShiftState executado para idoso/aluno: ${targetId} (${idoso.nome}) | Ativo: ${activeShift.active} | In√≠cio: ${activeShift.startTime}`);
      setIsShiftActive(prevActive => {
        if (prevActive !== activeShift.active) {
          console.log(`üîÑ [Dashboard State] Alterando isShiftActive de ${prevActive} para ${activeShift.active}`);
          return activeShift.active;
        }
        return prevActive;
      });
      setShiftStartTime(prevStart => {
        if (prevStart !== activeShift.startTime) {
          return activeShift.startTime;
        }
        return prevStart;
      });
      if (!activeShift.active) {
        setElapsedShiftTime('00:00:00');
      }
      if (activeShift.active) {
        localStorage.removeItem(`anjo_is_absent_${targetId}`);
        localStorage.removeItem(`anjo_is_absent_${idoso.id}`);
        setIsAbsent(false);
      } else {
        const absentVal = localStorage.getItem(`anjo_is_absent_${targetId}`) === 'true' || localStorage.getItem(`anjo_is_absent_${idoso.id}`) === 'true';
        setIsAbsent(prevAbs => prevAbs !== absentVal ? absentVal : prevAbs);
      }
    };

    const handleVitalsChange = () => {
      setVitalsUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('anjo_shift_updated', syncShiftState);
    window.addEventListener('anjo_user_updated', syncShiftState);
    window.addEventListener('storage', syncShiftState);
    window.addEventListener('db-vitals-update', syncShiftState);
    window.addEventListener('db-vitals-update', handleVitalsChange);
    document.addEventListener('visibilitychange', syncShiftState);

    // Run sync immediately on mount or student ID change
    syncShiftState();

    const intervalId = setInterval(syncShiftState, 1000);

    return () => {
      window.removeEventListener('anjo_shift_updated', syncShiftState);
      window.removeEventListener('anjo_user_updated', syncShiftState);
      window.removeEventListener('storage', syncShiftState);
      window.removeEventListener('db-vitals-update', syncShiftState);
      window.removeEventListener('db-vitals-update', handleVitalsChange);
      document.removeEventListener('visibilitychange', syncShiftState);
      clearInterval(intervalId);
    };
  }, [idoso.id]);

  // Read offline queue items from IndexedDB
  const loadOfflineQueue = async () => {
    const items = await obterItensPendentes();
    setFilaOffline(items);
  };

  // Live timer for active caregiver shift duration
  useEffect(() => {
    let intervalId: any;
    if (isShiftActive && shiftStartTime) {
      const updateTimer = () => {
        let startMs = 0;
        const parsed = new Date(shiftStartTime).getTime();
        if (!isNaN(parsed)) {
          startMs = parsed;
        } else if (typeof shiftStartTime === 'string' && shiftStartTime.includes(':')) {
          const parts = shiftStartTime.split(':');
          const d = new Date();
          d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
          startMs = d.getTime();
        }

        const now = Date.now();
        const diffMs = startMs > 0 ? now - startMs : 0;

        if (diffMs > 0) {
          const secs = Math.floor((diffMs / 1000) % 60);
          const mins = Math.floor((diffMs / (1000 * 60)) % 60);
          const hours = Math.floor(diffMs / (1000 * 60 * 60));

          const pad = (n: number) => String(n).padStart(2, '0');
          setElapsedShiftTime(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
        } else {
          setElapsedShiftTime('00:00:00');
        }
      };
      
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
      document.addEventListener('visibilitychange', updateTimer);

      return () => {
        if (intervalId) clearInterval(intervalId);
        document.removeEventListener('visibilitychange', updateTimer);
      };
    } else {
      setElapsedShiftTime('00:00:00');
    }
  }, [isShiftActive, shiftStartTime]);

  const loadTasks = () => {
    let allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);

    const seniorTasks = allTasks.filter(t => t.idosoId === idoso.id);
    const activeMeds = getFromDB<Medicamento[]>('anjo_medicamentos', []).filter(m => m.idosoId === idoso.id && m.status === 'ativo');

    const isMedActive = (taskTitle: string) => {
      const cleanTitle = taskTitle.toLowerCase().trim();
      const baseTitle = cleanTitle.split('(')[0].trim();

      return activeMeds.some(m => {
        const cleanName = m.nome.toLowerCase().trim();
        const baseName = cleanName.split('(')[0].trim();

        return (
          cleanTitle === cleanName ||
          cleanTitle.includes(baseName) ||
          cleanName.includes(baseTitle) ||
          baseTitle.includes(baseName) ||
          baseName.includes(baseTitle) ||
          (cleanTitle.includes('losartana') && cleanName.includes('losartana')) ||
          (cleanTitle.includes('c√°lcio') && cleanName.includes('c√°lcio')) ||
          (cleanTitle.includes('calcio') && cleanName.includes('calcio')) ||
          (cleanTitle.includes('donepezila') && cleanName.includes('donepezila')) ||
          (cleanTitle.includes('aricept') && cleanName.includes('aricept')) ||
          (cleanTitle.includes('soro') && cleanName.includes('soro')) ||
          (cleanTitle.includes('inala√ß√£o') && cleanName.includes('inala√ß√£o')) ||
          (cleanTitle.includes('vitamina') && cleanName.includes('vitamina')) ||
          (cleanTitle.includes('suplemento') && cleanName.includes('suplemento')) ||
          (cleanTitle.includes('metformina') && cleanName.includes('metformina')) ||
          (cleanTitle.includes('glicofage') && cleanName.includes('glicofage')) ||
          (cleanTitle.includes('gripe') && cleanName.includes('gripe')) ||
          (cleanTitle.includes('amoxicilina') && cleanName.includes('amoxicilina')) ||
          (cleanTitle.includes('alergika') && cleanName.includes('alergika')) ||
          (cleanTitle.includes('daflon') && cleanName.includes('daflon'))
        );
      });
    };

    const hasElderlyTasks = seniorTasks.some(t => 
      t.id.startsWith('task_j_') || 
      t.id.startsWith('task_m_') || 
      t.id.startsWith('task_d_') || 
      t.titulo.toLowerCase().includes('artrose') || 
      t.titulo.toLowerCase().includes('daflon') || 
      t.titulo.toLowerCase().includes('metformina') ||
      t.titulo.toLowerCase().includes('losartana') ||
      t.titulo.toLowerCase().includes('c√°lcio')
    );

    // Contar quantas tarefas de almo√ßo/papinha padr√£o existem para este aluno
    const lunchTasksCount = seniorTasks.filter(t => {
      const tit = (t.titulo || '').toLowerCase();
      // N√£o conta atividades personalizadas da Aura como almo√ßo duplicado
      if (t.id.startsWith('task_aura_')) return false;
      return tit.includes('almo√ßo') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');
    }).length;

    // Se o usu√°rio limpou explicitamente as tarefas/atividades deste perfil, respeita e mant√©m limpo
    const isExplicitlyCleared = localStorage.getItem(`anjo_tasks_cleared_${idoso.id}`) === 'true' || localStorage.getItem(`anjo_activities_cleared_${idoso.id}`) === 'true';
    if (isExplicitlyCleared) {
      if (seniorTasks.length > 0) {
        const otherSeniorsTasks = allTasks.filter(t => t.idosoId !== idoso.id);
        saveToDB('anjo_tarefas_diarias', otherSeniorsTasks);
      }
      setTarefas([]);
      return;
    }

    // Se a lista de tarefas estiver vazia (ou foi limpa), respeita o estado limpo
    if (seniorTasks.length === 0) {
      setTarefas([]);
      return;
    }

    // Se houver tarefas de idoso indevidas ou coment√°rios conversacionais da IA salvos como tarefa, limpa automaticamente
    if (isEscolar || idoso.id.startsWith('aluno_')) {
      const sanitized = seniorTasks.filter(t => 
        !t.id.startsWith('task_j_') && 
        !t.id.startsWith('task_m_') && 
        !t.id.startsWith('task_d_') && 
        !t.titulo.toLowerCase().includes('artrose') && 
        !t.titulo.toLowerCase().includes('daflon') && 
        !t.titulo.toLowerCase().includes('metformina') && 
        !t.titulo.toLowerCase().includes('losartana') && 
        !t.titulo.toLowerCase().includes('c√°lcio') &&
        !isConversationalChatNoise(t.titulo || '') &&
        !isConversationalChatNoise(t.descricao || '')
      );
      if (sanitized.length !== seniorTasks.length) {
        const otherSeniorsTasks = allTasks.filter(t => t.idosoId !== idoso.id);
        const combined = [...otherSeniorsTasks, ...sanitized];
        saveToDB('anjo_tarefas_diarias', combined);
        setTarefas(sanitized);
        return;
      }
    }

    // Realinha automaticamente tarefas que possuem conflito sem√¢ntico ou deslocamento de hor√°rio
    let hasRealigned = false;
    const realignedSeniorTasks = seniorTasks.map(t => {
      const { title: alignedTitle, tipo: alignedType } = realignPedagogicalActivity(t.titulo, t.descricao || '', t.horarioPrevisto || '', t.tipo);
      if (alignedTitle !== t.titulo || alignedType !== t.tipo) {
        hasRealigned = true;
        return {
          ...t,
          titulo: alignedTitle,
          tipo: alignedType,
        };
      }
      return t;
    });

    // Filter existing tasks and perform automatic deduplication by time + normalized title + single lunch rule
    const seenTimeType = new Set<string>();
    let seenLunch = false;
    const deduped: TarefaDiaria[] = [];

    realignedSeniorTasks.forEach(t => {
      if (t.tipo === 'medicacao' && !isMedActive(t.titulo)) return;
      
      const tit = (t.titulo || '').toLowerCase();
      const isLunch = tit.includes('almo√ßo') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');

      if (isEscolar && isLunch) {
        if (seenLunch) {
          // Ignora qualquer almo√ßo/papinha duplicado em outro hor√°rio
          return;
        }
        seenLunch = true;
      }

      // Normaliza o t√≠tulo para detectar repeti√ß√µes do mesmo hor√°rio
      const normTitle = t.titulo
        .toLowerCase()
        .replace(/troca de fralda[s]?|higiene/g, 'fralda')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      const normTime = (t.horarioPrevisto || '').trim();
      const normKey = `${normTime}_${normTitle}`;

      if (!seenTimeType.has(normKey)) {
        seenTimeType.add(normKey);
        deduped.push(t);
      }
    });

    if (deduped.length !== seniorTasks.length || hasRealigned) {
      const otherSeniorsTasks = allTasks.filter(t => t.idosoId !== idoso.id);
      const combined = [...otherSeniorsTasks, ...deduped];
      saveToDB('anjo_tarefas_diarias', combined);
      setTarefas(deduped);
    } else {
      setTarefas(realignedSeniorTasks);
    }
  };

  const generateDefaultTasks = (idosoId: string): TarefaDiaria[] => {
    const list: TarefaDiaria[] = [];
    if (isEscolar || idosoId.startsWith('aluno_')) {
      list.push(
        {
          id: 'task_s_entrada_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Acolhida & Entrada Afetiva üè´',
          descricao: 'Recep√ß√£o carinhosa dos alunos, acolhimento individual e organiza√ß√£o de pertences.',
          horarioPrevisto: '07:00',
          status: 'pendente'
        },
        {
          id: 'task_s_roda_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Roda de Conversa: Tema do Dia ü™û',
          descricao: 'Apresenta√ß√£o do tema di√°rio, musicaliza√ß√£o, chamada divertida e express√£o das crian√ßas.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_s_lanche_manha_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Lanche da Manh√£ & Frutinhas üçé',
          descricao: 'Frutas frescas da esta√ß√£o, biscoito integral e incentivo √† hidrata√ß√£o.',
          horarioPrevisto: '09:00',
          status: 'pendente'
        },
        {
          id: 'task_s_parque_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Recrea√ß√£o no P√°tio & Parquinho üß∏',
          descricao: 'Brincadeiras ao ar livre para est√≠mulo motor, socializa√ß√£o e banho de sol adequado.',
          horarioPrevisto: '09:45',
          status: 'pendente'
        },
        {
          id: 'task_s_dirigida_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Atividade Dirigida Tem√°tica (BNCC) üé®',
          descricao: 'Atividade pr√°tica pedag√≥gica com foco no desenvolvimento cognitivo e sensorial.',
          horarioPrevisto: '10:30',
          status: 'pendente'
        },
        {
          id: 'task_s_almoco_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almo√ßo Saud√°vel / Papinha üç≤',
          descricao: 'Pratinho balanceado, introdu√ß√£o de novos sabores, verduras e carninha desfiada.',
          horarioPrevisto: '11:30',
          status: 'pendente'
        },
        {
          id: 'task_s_higiene_escovacao_' + idosoId,
          idosoId,
          tipo: 'banho',
          titulo: 'Higiene, Fraldas & Escova√ß√£o üë∂',
          descricao: 'Troca de fraldas, lavagem das m√£os e est√≠mulo √† escova√ß√£o dental com carinho.',
          horarioPrevisto: '12:15',
          status: 'pendente'
        },
        {
          id: 'task_s_soneca_' + idosoId,
          idosoId,
          tipo: 'sono',
          titulo: 'Soneca & Repouso Restaurador üí§',
          descricao: 'Descanso nos colchonetes individuais com ambiente calmo, ilumina√ß√£o suave e m√∫sica relaxante.',
          horarioPrevisto: '12:30',
          status: 'pendente'
        },
        {
          id: 'task_s_lanche_tarde_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Lanche da Tarde & Frutinhas üçé',
          descricao: 'Frutas frescas da √©poca fatiadas, biscoito integral e hidrata√ß√£o da tarde.',
          horarioPrevisto: '14:15',
          status: 'pendente'
        },
        {
          id: 'task_s_brincadeira_livre_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Brincadeira Livre & Socializa√ß√£o üß∏',
          descricao: 'Cantinhos tem√°ticos com brinquedos educativos, blocos de montar e autonomia.',
          horarioPrevisto: '14:45',
          status: 'pendente'
        },
        {
          id: 'task_s_historias_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Conta√ß√£o de Hist√≥rias & M√∫sica üìö',
          descricao: 'Leitura de livros ilustrados, fantoches e cantigas de roda.',
          horarioPrevisto: '15:30',
          status: 'pendente'
        },
        {
          id: 'task_s_saida_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Prepara√ß√£o para Sa√≠da & Despedida Afetiva üéí',
          descricao: 'Organiza√ß√£o das mochilinhas, fechamento da agenda do dia e entrega afetiva aos familiares.',
          horarioPrevisto: '16:00',
          status: 'pendente'
        }
      );
    } else if (idosoId === 'idoso_maria') {
      list.push(
        {
          id: 'task_m_losartana',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Losartana Pot√°ssica (Press√£o)',
          descricao: 'Dosagem: 50mg - 1 comprimido. Dar com meio copo d\'√°gua.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_m_cafe',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Caf√© da manh√£',
          descricao: 'Geleia sem a√ß√∫car com p√£o integral + caf√© com leite descascar.',
          horarioPrevisto: '08:30',
          status: 'pendente'
        },
        {
          id: 'task_m_alongamento',
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Alongamento Leve e Exerc√≠cio Funcional',
          descricao: '20 a 30 minutos de alongamento guiado e exerc√≠cios de mobilidade funcional.',
          horarioPrevisto: '09:30',
          status: 'pendente'
        },
        {
          id: 'task_m_banho',
          idosoId,
          tipo: 'banho',
          titulo: 'Banho & Higiene Geral',
          descricao: 'Banho morno assistido, hidrata√ß√£o da pele e troca de roupas limpas.',
          horarioPrevisto: '10:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_calcio',
          idosoId,
          tipo: 'medicacao',
          titulo: 'C√°lcio + Vitamina D',
          descricao: 'Dosagem: 1 sachet dilu√≠do em 100ml de √°gua ou suco junto ao almo√ßo.',
          horarioPrevisto: '12:30',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_almoco',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almo√ßo',
          descricao: 'Arroz integral, pur√™ de ab√≥bora, fil√© de frango desfiado e br√≥colis cozido ao vapor.',
          horarioPrevisto: '12:30',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_hidra_tarde',
          idosoId,
          tipo: 'hidratacao',
          titulo: 'Copos d\'√Ågua da Tarde',
          descricao: 'Oferecer 250ml de √°gua gelada.',
          horarioPrevisto: '15:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_aricept',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Donepezila (Aricept)',
          descricao: 'Dosagem: 5mg - 1 comprimido no repouso noturno.',
          horarioPrevisto: '21:00',
          status: 'pendente',
          observacao: ''
        }
      );
    } else {
      list.push(
        {
          id: 'task_j_metformina_1',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Metformina (Glicofage)',
          descricao: 'Dosagem: 850mg ap√≥s o caf√© da manh√£.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_j_cafe',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Caf√© da manh√£',
          descricao: 'Ovos mexidos sem √≥leo, torrada de centeio e caf√© preto ado√ßado.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_j_circulacao',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Daflon 1000mg',
          descricao: '1 comprimido para circula√ß√£o.',
          horarioPrevisto: '09:00',
          status: 'pendente'
        },
        {
          id: 'task_j_fisio',
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Fisioterapia para Artrose',
          descricao: 'Fisiatria e fortalecimento dos joelhos com o fisioterapeuta Dr. Alan.',
          horarioPrevisto: '10:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_j_hidratacao',
          idosoId,
          tipo: 'hidratacao',
          titulo: 'Insistir na √Ågua S√™nior',
          descricao: 'Oferecer copo de 300ml.',
          horarioPrevisto: '11:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_j_almoco',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almo√ßo Balanceado',
          descricao: 'Salada de folhas verdes, batata doce assada, peixe grelhado.',
          horarioPrevisto: '12:15',
          status: 'pendente',
          observacao: ''
        }
      );
    }
    return list;
  };

  const getStatusFarol = (): { color: string; label: string; bg: string; text: string; details: string; status: 'verde' | 'amarelo' | 'vermelho' } => {
    const pendentes = tarefas.filter(t => t.status === 'pendente').length;
    const atrasadas = tarefas.filter(t => t.status === 'atrasado').length;
    const concluidas = tarefas.filter(t => t.status === 'concluido').length;
    const recusadas = tarefas.filter(t => t.status === 'recusado').length;

    // Check if there are active severe occurrences recorded today
    const criticalOccurrences = occurrencesList.filter(o => o.criticidade === 'vermelho');

    if (criticalOccurrences.length > 0) {
      return {
        color: '#EB5757',
        label: isEscolar ? 'Ocorr√™ncia escolar cr√≠tica' : 'Ocorr√™ncia cr√≠tica registrada',
        bg: 'bg-rose-50 border-rose-350',
        text: 'text-rose-900',
        details: `H√° ${criticalOccurrences.length} ocorr√™ncia(s) cr√≠tica(s) registrada(s) neste turno. Recomenda-se aten√ß√£o imediata.`,
        status: 'vermelho'
      };
    } else if (atrasadas > 0 || recusadas > 0 || occurrencesList.some(o => o.criticidade === 'amarelo')) {
      return {
        color: '#F2C94C',
        label: isEscolar ? 'Aten√ß√£o necess√°ria' : 'Aten√ß√£o necess√°ria',
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-900',
        details: isEscolar
          ? `Rotina sob monitoramento. Registramos ${atrasadas} atividade(s) pendente(s) ou ${recusadas} recusa(s) para acompanhamento dos pais.`
          : `Rotina sob monitoramento. Registramos ${atrasadas} item(ns) pendente(s) ou ${recusadas} recusa(s) de cuidado para acompanhamento da fam√≠lia.`,
        status: 'amarelo'
      };
    } else {
      return {
        color: '#27AE60',
        label: isEscolar ? 'Rotina escolar dentro do esperado' : 'Rotina dentro do esperado',
        bg: 'bg-emerald-50 border-emerald-300',
        text: 'text-emerald-900',
        details: isEscolar
          ? `Tudo correndo tranquilamente hoje. Das atividades previstas na escala, ${concluidas} foram realizadas com sucesso pelas professoras.`
          : `Tudo correndo tranquilamente hoje. Dos cuidados previstos na escala, ${concluidas} foram realizados com sucesso pelas cuidadoras.`,
        status: 'verde'
      };
    }
  };

  const farol = getStatusFarol();

  // Helper to safely parse and display Date of Birth in BR format and calculate age
  const getBrDateAndAge = (dateStr: string) => {
    if (!dateStr) return { formatted: '', age: 0 };
    
    let cleanStr = dateStr.trim();
    const onlyDigits = cleanStr.replace(/\D/g, '');
    if (onlyDigits.length === 8 && !cleanStr.includes('/') && !cleanStr.includes('-')) {
      cleanStr = `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2, 4)}/${onlyDigits.slice(4)}`;
    }

    const calculateAgeFromParts = (day: number, monthZeroBased: number, year: number) => {
      const today = new Date();
      let age = today.getFullYear() - year;
      const m = today.getMonth() - monthZeroBased;
      if (m < 0 || (m === 0 && today.getDate() < day)) {
        age--;
      }
      return age;
    };
    
    // If already in DD/MM/AAAA standard format
    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return { formatted: cleanStr, age: calculateAgeFromParts(day, month, year) };
        }
      }
    }
    
    // If in standard ISO YYYY-MM-DD format
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return {
          formatted: `${parts[2]}/${parts[1]}/${parts[0]}`,
          age: calculateAgeFromParts(day, month, year)
        };
      }
      return {
        formatted: d.toLocaleDateString('pt-BR'),
        age: calculateAgeFromParts(d.getDate(), d.getMonth(), d.getFullYear())
      };
    }
    
    return { formatted: dateStr, age: 80 }; // safe fallback
  };

  const getRefeicaoFromTitle = (title: string): 'cafe_manha' | 'almoco' | 'lanche' | 'lanche_tarde' | 'jantar' | 'ceia' | 'mamadeira' => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('mamadeira') || lower.includes('f√≥rmula') || lower.includes('formula')) return 'mamadeira';
    if (lower.includes('caf√©') || lower.includes('cafe') || lower.includes('desjejum') || lower.includes('manh√£') || lower.includes('manha')) return 'cafe_manha';
    if (lower.includes('almo√ßo') || lower.includes('almoco') || lower.includes('papinha')) return 'almoco';
    if (lower.includes('tarde') || lower.includes('merenda') || lower.includes('lanche da tarde') || lower.includes('lanchinho')) return 'lanche_tarde';
    if (lower.includes('jantar') || lower.includes('janta')) return 'jantar';
    if (lower.includes('ceia')) return 'ceia';
    if (lower.includes('frutinha') || lower.includes('fruta')) return 'lanche';
    return 'lanche'; // fallback
  };

  const syncTaskWithDailyDiaries = (task: TarefaDiaria, action: 'concluido' | 'recusado' | 'reset', commentText?: string) => {
    const todayIso = getTodayIso();
    if (task.tipo === 'alimentacao') {
      const feeds = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
      const mealType = getRefeicaoFromTitle(task.titulo);
      
      if (action === 'concluido') {
        const alreadyHasMeal = feeds.some(f => f.idosoId === idoso.id && f.refeicao === mealType && isTodayOrDemoDate(f.data));
        if (!alreadyHasMeal) {
          feeds.push({
            id: 'feed_dash_' + Date.now(),
            idosoId: idoso.id,
            refeicao: mealType,
            aceitacao: commentText?.toLowerCase().includes('pouco') ? 'pouco' : commentText?.toLowerCase().includes('recus') ? 'recusou' : 'muito_bem',
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            data: todayIso,
            observacoes: commentText || 'Registrado pelo Painel de Atividades',
            registradoPor: usuarioAtual.nome
          });
          saveToDB('anjo_alimentacao', feeds);
        }
      } else {
        const filteredFeeds = feeds.filter(f => !(f.idosoId === idoso.id && f.refeicao === mealType && isTodayOrDemoDate(f.data)));
        saveToDB('anjo_alimentacao', filteredFeeds);
      }
    }

    if (task.tipo === 'hidratacao') {
      const hids = getFromDB<RegistroHidratacao[]>('anjo_hidratacao', []);
      if (action === 'concluido') {
        const mlMatch = task.titulo.match(/(\d+)\s*ml/i) || task.descricao.match(/(\d+)\s*ml/i);
        const amount = mlMatch ? parseInt(mlMatch[1], 10) : 250;
        hids.push({
          id: 'hid_dash_' + Date.now(),
          idosoId: idoso.id,
          quantidadeMl: amount,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          data: todayIso,
          registradoPor: usuarioAtual.nome
        });
        saveToDB('anjo_hidratacao', hids);
      } else {
        const seniorHids = hids.filter(h => h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
        if (seniorHids.length > 0) {
          const lastId = seniorHids[seniorHids.length - 1].id;
          const filteredHids = hids.filter(h => h.id !== lastId);
          saveToDB('anjo_hidratacao', filteredHids);
        }
      }
    }

    if (task.tipo === 'atividade_fisica' || task.tipo === 'humor') {
      const ativs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
      if (action === 'concluido') {
        const fullObs = task.descricao 
          ? (commentText ? `${task.descricao}\n\nObserva√ß√£o do Educador: ${commentText}` : task.descricao)
          : (commentText || 'Atividade realizada com sucesso.');
        ativs.push({
          id: 'ati_dash_' + Date.now(),
          idosoId: idoso.id,
          tipo: task.titulo,
          duracaoMinutos: 30,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          data: todayIso,
          observacoes: fullObs,
          fotoTrabalhinho: ''
        });
        saveToDB('anjo_atividades', ativs);
      }
    }
  };

  // Mark task completed or log offline if offline!
  // Register task execution or refusal with full security and audit trail under LGPD
  const handleRegisterTaskAction = async (taskId: string, targetStatus: 'concluido' | 'recusado') => {
    if (!ensureAuthorizedAndActiveShift("Atividade da Agenda")) {
      return;
    }
    const comment = observacaoRapida[taskId] || '';
    const task = tarefas.find(t => t.id === taskId);
    if (!task) return;

    if (['alimentacao', 'banho', 'medicacao', 'hidratacao'].includes(task.tipo)) {
      const auth = checkFeedingCareAuthorization();
      if (!auth.isAuthorized) {
        alert(`‚ö†Ô∏è Opera√ß√£o N√£o Autorizada: Nenhum pai ou respons√°vel autorizou "Alimenta√ß√£o e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora n√£o tem permiss√£o para registrar ou realizar esta atividade.`);
        return;
      }
    }

    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }

    // Check if refusal and comment is blank
    if (targetStatus === 'recusado' && !comment.trim()) {
      alert("‚ö†Ô∏è Aten√ß√£o: Por favor, preencha o campo de observa√ß√µes com a justificativa t√©cnica para a recusa ou n√£o-administra√ß√£o do cuidado!");
      return;
    }

    if (!simulatedOnline) {
      // üì∂ REGISTRO OFFLINE: Salvar na Fila com seguran√ßa
      const novoItemOffline: ItemFilaOffline = {
        id_local: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: taskId,
        tipo: task.tipo === 'sinais_vitais' ? 'sinal_vital' : task.tipo as any,
        titulo: task.titulo,
        status: targetStatus === 'concluido' ? 'realizado' : 'recusado',
        horario_planejado: task.horarioPrevisto,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: comment || (targetStatus === 'recusado' ? 'Item recusado pelo assistido' : 'Registrado em modo offline'),
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      };

      await adicionarItemFila(novoItemOffline);
      await loadOfflineQueue();

      // Update state visually but show it's offline pending
      const updated = tarefas.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: targetStatus,
            concluidaEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (Aparelho Offline üì∂)',
            completadaPor: usuarioAtual.nome,
            observacao: comment
          };
        }
        return t;
      });
      setTarefas(updated);
      
      // Save local memory copy
      const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
      const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
      saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);
      
      syncTaskWithDailyDiaries(task, targetStatus, comment);
      
      // LGPD Audit Track
      const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      logs.unshift({
        id: 'log_' + Date.now(),
        autor: usuarioAtual.nome,
        acao: `Registro de Sa√∫de Offline - ID: ${taskId} [${targetStatus.toUpperCase()}]`,
        data: new Date().toLocaleString('pt-BR'),
        ip: '10.0.2.15 (Celular Cuidador - em fila local)',
        detalhes: `Registros salvos localmente no IndexedDB e pendentes de sincronismo.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
      setLgpdLogs(logs);

      setObservacaoRapida({ ...observacaoRapida, [taskId]: '' });
      return;
    }

    // üåê REGISTRO EM TEMPO REAL ON-LINE
    const updated = tarefas.map(t => {
      if (t.id === taskId) {
        const detailStr = comment ? ` Relato: "${comment}".` : '';
        const actionText = targetStatus === 'concluido' ? 'conclu√≠da' : '‚ö†Ô∏è RECUSADA (Registrado com Justificativa)';
        const msg = `Anjo Cuidador: A atividade "${t.titulo}" de ${idoso.nome} foi registrada como ${actionText} por ${usuarioAtual.nome}.${detailStr}`;
        
        triggerWhatsAppSim(t.titulo + ' ' + (targetStatus === 'concluido' ? 'Conclu√≠do' : 'Recusado'), msg);

        return {
          ...t,
          status: targetStatus,
          concluidaEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          completadaPor: usuarioAtual.nome,
          observacao: comment,
          detalhes: {
            horario_planejado: t.horarioPrevisto,
            horario_registrado_dispositivo: new Date().toISOString(),
            horario_sincronizado_servidor: new Date().toISOString(),
            status_sincronizacao: 'online'
          }
        };
      }
      return t;
    });

    setTarefas(updated);
    
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    syncTaskWithDailyDiaries(task, targetStatus, comment);

    // LGPD Audit Trace Online
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Registro de Rastreabilidade Online - ID: ${taskId} [${targetStatus.toUpperCase()}]`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1) + ' (IP M√≥vel)',
      detalhes: `A√ß√£o transmitida via HTTPS com seguran√ßa de ponta a ponta.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);

    setObservacaoRapida({
      ...observacaoRapida,
      [taskId]: ''
    });
  };

  // Confirm registering an occurrence
  const handleConfirmOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShiftActive) {
      const startTimeStamp = new Date().toISOString();
      setIsShiftActive(true);
      setShiftStartTime(startTimeStamp);
      setShiftActiveState(idoso.id, true, startTimeStamp);
      unlockAndMarkPresent();
    }
    if (!occurrenceForm.descricao.trim()) {
      alert("Por favor escreva um relato descritivo sobre o ocorrido.");
      return;
    }

    const novaOcorrencia = {
      id: 'oc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      tipo: occurrenceForm.tipo,
      criticidade: occurrenceForm.criticidade,
      descricao: occurrenceForm.descricao,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      data: new Date().toLocaleDateString('pt-BR'),
      responsavel: usuarioAtual.nome,
      statusEnvioWhatsApp: 'mensagem_gerada', // Estado inicial da auditoria de envio
      dataRegistroStatus: new Date().toLocaleString('pt-BR')
    };

    const updatedList = [novaOcorrencia, ...occurrencesList];
    setOccurrencesList(updatedList);
    saveToDB(`anjo_ocorrencias_${idoso.id}`, updatedList);

    // Human-friendly Portuguese Label Mapping for Alerts
    const tipoMap: { [key: string]: string } = {
      queda: 'Queda',
      febre: 'Febre',
      dor: 'Dor',
      recusa_medicacao: 'Recusa de medica√ß√£o',
      recusa_alimentar: 'Recusa alimentar',
      comportamento: 'Altera√ß√£o de comportamento',
      pressao: 'Press√£o alterada',
      outro: 'Outro'
    };
    const tipoLabel = tipoMap[occurrenceForm.tipo] || occurrenceForm.tipo;

    // LGPD Trace Log for incident tracking
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Registro de Ocorr√™ncia At√≠pica - [${tipoLabel}]`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Intercorr√™ncia salva no hist√≥rico de cuidado de ${idoso.nome}: "${occurrenceForm.descricao}".`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);

    // Custom High-Fidelity message design layout requested by the user
    const msg = `üö® *Anjo Cuidador ‚Äî Intercorr√™ncia registrada* üö®

Ol√°, fam√≠lia.
Foi registrada uma intercorr√™ncia com *${idoso.nome}*.

*Tipo:* ${tipoLabel}
*Hor√°rio:* ${novaOcorrencia.horario}
*Cuidador(a):* ${usuarioAtual.nome}
*Descri√ß√£o:* ${occurrenceForm.descricao}

*Recomenda√ß√£o:* entrar em contato com a cuidadora para alinhamento.

_Mensagem preparada pelo aplicativo Anjo Cuidador._`;

    triggerWhatsAppSim('ALERTA AT√çPICO', msg);

    // Reset status fields
    setOccurrenceForm({ tipo: 'queda', criticidade: 'amarelo', descricao: '' });
    setShowOccurrenceModal(false);

    // Set manual WhatsApp share popup so caregiver can easily dispatch manually!
    setManualShareOccurrenceMessage(msg);
    setActiveSharingOccurrenceId(novaOcorrencia.id);
    setShowManualOccurrenceShareModal(true);
  };

  // Helper de Envio Assistido: Registrar que o cuidador abriu o link do WhatsApp
  const handleWhatsAppClicked = (occurrenceId: string | null) => {
    if (!occurrenceId) return;
    const list = getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []);
    const idx = list.findIndex(o => o.id === occurrenceId);
    if (idx !== -1) {
      if (list[idx].statusEnvioWhatsApp === 'mensagem_gerada') {
        list[idx].statusEnvioWhatsApp = 'whatsapp_aberto';
        list[idx].dataRegistroStatus = new Date().toLocaleString('pt-BR');
        saveToDB(`anjo_ocorrencias_${idoso.id}`, list);
        setOccurrencesList(list);

        // Registro de Auditoria no registro de rastreabilidade LGPD
        const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
        const tipoMap: { [key: string]: string } = {
          queda: 'Queda', febre: 'Febre', dor: 'Dor',
          recusa_medicacao: 'Recusa de medica√ß√£o', recusa_alimentar: 'Recusa alimentar',
          comportamento: 'Altera√ß√£o de comportamento', pressao: 'Press√£o alterada', outro: 'Outro'
        };
        const label = tipoMap[list[idx].tipo] || list[idx].tipo;

        logs.unshift({
          id: 'log_wa_open_' + Date.now(),
          autor: usuarioAtual.nome,
          acao: `WhatsApp aberto (Envio Assistido)`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Direcionado para o WhatsApp com rascunho de intercorr√™nciatipo de "${label}".`
        });
        saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
        setLgpdLogs(logs);
      }
    }
  };

  // Helper de Envio Assistido: Confirmar que a mensagem foi de fato enviada
  const handleConfirmWhatsAppSent = (occurrenceId: string | null) => {
    if (occurrenceId) {
      const list = getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []);
      const idx = list.findIndex(o => o.id === occurrenceId);
      if (idx !== -1) {
        list[idx].statusEnvioWhatsApp = 'envio_confirmado';
        list[idx].dataRegistroStatus = new Date().toLocaleString('pt-BR');
        saveToDB(`anjo_ocorrencias_${idoso.id}`, list);
        setOccurrencesList(list);

        const tipoMap: { [key: string]: string } = {
          queda: 'Queda', febre: 'Febre', dor: 'Dor',
          recusa_medicacao: 'Recusa de medica√ß√£o', recusa_alimentar: 'Recusa alimentar',
          comportamento: 'Altera√ß√£o de comportamento', pressao: 'Press√£o alterada', outro: 'Outro'
        };
        const label = tipoMap[list[idx].tipo] || list[idx].tipo;

        // Registro de Auditoria no registro de rastreabilidade LGPD
        const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
        logs.unshift({
          id: 'log_wa_sent_' + Date.now(),
          autor: usuarioAtual.nome,
          acao: `Envio confirmado pelo cuidador`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Cuidador confirmou o envio correto da mensagem de intercorr√™ncia [${label}] para os familiares.`
        });
        saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
        setLgpdLogs(logs);

        // Alimentar o Feed de Logs do Simulador para transpar√™ncia visual
        const allNotif = getFromDB<any[]>('anjo_notificacoes', []);
        allNotif.push({
          id: 'notif_wa_' + Date.now(),
          idosoId: idoso.id,
          familiarNome: usuarioAtual.nome,
          telefoneDestino: '(Familiares)',
          mensagem: `[‚úì ENVIADO] Alerta confirmado pelo cuidador no painel de controle:\n\n${manualShareOccurrenceMessage}`,
          dataEnvio: new Date().toISOString()
        });
        saveToDB('anjo_notificacoes', allNotif);
      }
    }

    setShowManualOccurrenceShareModal(false);
    setManualShareOccurrenceMessage(null);
    setActiveSharingOccurrenceId(null);
    alert('Auditoria atualizada! O status de envio confirmado pelo cuidador foi salvo no registro de rastreabilidade.');
  };

  // Helper para o caso de n√£o ter enviado
  const handleNotSentYet = () => {
    setShowManualOccurrenceShareModal(false);
    setManualShareOccurrenceMessage(null);
    setActiveSharingOccurrenceId(null);
  };

  // Copiar mensagem para √°rea de transfer√™ncia
  const handleCopyMessage = () => {
    if (manualShareOccurrenceMessage) {
      navigator.clipboard.writeText(manualShareOccurrenceMessage).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = manualShareOccurrenceMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  // Reset task execution back to pending
  const handleResetTask = async (taskId: string) => {
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para desfazer ou alterar atividades!");
      return;
    }
    if (!isShiftActive) {
      const startTimeStamp = new Date().toISOString();
      setIsShiftActive(true);
      setShiftStartTime(startTimeStamp);
      setShiftActiveState(idoso.id, true, startTimeStamp);
    }
    const updated = tarefas.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'pendente' as const,
          concluidaEm: undefined,
          completadaPor: undefined,
          observacao: undefined,
          detalhes: undefined
        };
      }
      return t;
    });
    setTarefas(updated);
    
    const task = tarefas.find(t => t.id === taskId);
    if (task) {
      syncTaskWithDailyDiaries(task, 'reset');
    }
    
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    // LGPD Log Reset
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Anula√ß√£o de A√ß√£o de Cuidado - ID: ${taskId}`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Status retornado para PENDENTE por auditoria direta do cuidador.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);
  };

  // Simulated Connection Mode Toggler
  const handleToggleConnection = () => {
    const nextState = !simulatedOnline;
    setSimulatedOnline(nextState);
    localStorage.setItem('anjo_simulated_online', String(nextState));
  };

  // Syncing Queue to Cloud Server (With full auditing logs)
  const handleSyncOfflineData = async () => {
    if (!simulatedOnline) return;
    setIsSyncing(true);

    const pendentes = await obterItensPendentes();
    if (pendentes.length === 0) {
      setIsSyncing(false);
      return;
    }

    const serverTime = new Date().toISOString();
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);

    for (const item of pendentes) {
      // 1. Mark status in tasks database
      const index = allTasksInDB.findIndex(t => t.id === item.atividade_id);
      if (index !== -1) {
        allTasksInDB[index] = {
          ...allTasksInDB[index],
          status: item.status as any,
          concluidaEm: new Date(item.horario_registrado_dispositivo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          completadaPor: usuarioAtual.nome,
          observacao: `${item.observacao} (Sincronizado via Fila üì∂)`,
          detalhes: {
            horario_planejado: item.horario_planejado,
            horario_registrado_dispositivo: item.horario_registrado_dispositivo,
            horario_sincronizado_servidor: serverTime,
            status_sincronizacao: 'offline_sincronizado'
          }
        };
      }

      // 2. Log in historic tables
      if (item.tipo === 'alimentacao') {
        const feeds = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
        
        // Parse refeicao dynamically from title
        let parsedRefeicao = 'cafe_manha';
        if (item.titulo.includes('almoco')) parsedRefeicao = 'almoco';
        else if (item.titulo.includes('lanche')) parsedRefeicao = 'lanche';
        else if (item.titulo.includes('jantar')) parsedRefeicao = 'jantar';
        else if (item.titulo.includes('ceia')) parsedRefeicao = 'ceia';
        
        if (item.titulo.toLowerCase().includes('mamadeira')) parsedRefeicao = 'mamadeira';
        else if (item.titulo.toLowerCase().includes('caf√©') || item.titulo.toLowerCase().includes('cafe') || item.titulo.toLowerCase().includes('desjejum') || item.titulo.toLowerCase().includes('lanchinho')) parsedRefeicao = 'cafe_manha';
        else if (item.titulo.toLowerCase().includes('almo√ßo') || item.titulo.toLowerCase().includes('papinha') || item.titulo.toLowerCase().includes('almocinho')) parsedRefeicao = 'almoco';
        else if (item.titulo.toLowerCase().includes('lanche') || item.titulo.toLowerCase().includes('frutinha')) parsedRefeicao = 'lanche';
        else if (item.titulo.toLowerCase().includes('jantar') || item.titulo.toLowerCase().includes('jantinha')) parsedRefeicao = 'jantar';
        else if (item.titulo.toLowerCase().includes('ceia')) parsedRefeicao = 'ceia';

        // Parse aceitacao dynamically from observacao
        let parsedAceitacao = 'muito_bem';
        if (item.observacao.includes('muito_bem')) parsedAceitacao = 'muito_bem';
        else if (item.observacao.includes('aceitacao: pouco') || item.observacao.includes('Aceita√ß√£o: pouco') || item.observacao.includes('pouco')) parsedAceitacao = 'pouco';
        else if (item.observacao.includes('recusou')) parsedAceitacao = 'recusou';
        else if (item.status === 'recusado') parsedAceitacao = 'recusou';

        feeds.push({
          id: 'ali_offline_' + Date.now() + Math.random().toString(36).substr(2, 3),
          idosoId: item.idoso_id,
          refeicao: parsedRefeicao as any,
          aceitacao: parsedAceitacao as any,
          horario: new Date(item.horario_registrado_dispositivo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          data: '2026-05-30',
          observacoes: `${item.observacao} (Sincronizado via Fila offline)`,
          registradoPor: usuarioAtual.nome
        });
        saveToDB('anjo_alimentacao', feeds);
      } else if (item.tipo === 'hidratacao') {
        const hids = getFromDB<RegistroHidratacao[]>('anjo_hidratacao', []);
        hids.push({
          id: 'hid_offline_' + Date.now() + Math.random().toString(36).substr(2, 3),
          idosoId: item.idoso_id,
          quantidadeMl: 250,
          horario: new Date(item.horario_registrado_dispositivo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          data: '2026-05-30',
          registradoPor: usuarioAtual.nome
        });
        saveToDB('anjo_hidratacao', hids);
      }

      // 3. Mark in local IndexedDB store as Sincronizado
      await atualizarStatusSincronizado(item.id_local, serverTime);
    }

    // Save tasks
    saveToDB('anjo_tarefas_diarias', allTasksInDB);

    // LGPD Log for Synchronization batch
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Sincronismo Coletivo de Banco Offline (Fila: ${pendentes.length} a√ß√µes)`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '177.10.150.12 (Sincronismo M√≥vel)',
      detalhes: `Dados integrados com sucesso. Auditoria de registros de seguran√ßa conclu√≠da sem quebras de integridade.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);
    
    // Notify Server simulated WhatsApp of sync batch
    const msg = `Anjo Cuidador: Sincroniza√ß√£o offline conclu√≠da com sucesso! ${pendentes.length} a√ß√µes salvas pelo cuidador foram enviadas com integridade audit√°vel ao servidor.`;
    triggerWhatsAppSim('Sincroniza√ß√£o Offline Auditoria', msg);

    // Refresh view
    loadTasks();
    await loadOfflineQueue();
    setIsSyncing(false);
  };

  const getStudentClassroomLocal = (name: string): string => {
    const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    const sortedRooms = [...rooms].sort((a, b) => b.name.length - a.name.length);
    const found = sortedRooms.find(r => name.includes(r.name));
    if (found) {
      return found.name;
    }
    if (name.includes('Ber√ß√°rio I')) return 'Ber√ß√°rio I';
    if (name.includes('Ber√ß√°rio II')) return 'Ber√ß√°rio II';
    if (name.includes('Maternal II')) return 'Maternal II';
    if (name.includes('Maternal I')) return 'Maternal I';
    if (name.includes('Jardim II')) return 'Jardim II';
    if (name.includes('Jardim I')) return 'Jardim I';
    return 'Todas';
  };

  // Agenda Task editing & creation handlers
  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para criar atividades ou alterar a rotina!");
      return;
    }
    if (!isShiftActive) {
      ensureAuthorizedAndActiveShift(isEscolar ? "Nova Atividade" : "Novo Cuidado");
    }
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }
    if (!newTaskForm.titulo.trim() || !newTaskForm.horarioPrevisto.trim()) {
      alert("Por favor, preencha o t√≠tulo e o hor√°rio previsto!");
      return;
    }
    
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    let updatedTasks = [...allTasks];
    let createdCount = 0;
    
    if (isEscolar && taskScope === 'coletivo') {
      const currentClassroom = getStudentClassroomLocal(idoso.nome);
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      const classroomStudents = allSeniors.filter(s => {
        if (!s.id.startsWith('aluno_')) return false;
        return getStudentClassroomLocal(s.nome) === currentClassroom;
      });
      
      const newTasks: TarefaDiaria[] = classroomStudents.map((student, idx) => ({
        id: 'task_custom_' + Date.now() + '_' + idx,
        idosoId: student.id,
        tipo: newTaskForm.tipo,
        titulo: newTaskForm.titulo,
        descricao: newTaskForm.descricao,
        horarioPrevisto: newTaskForm.horarioPrevisto,
        status: 'pendente'
      }));
      
      updatedTasks = [...allTasks, ...newTasks];
      createdCount = classroomStudents.length;
      
      // Audit log for all classroom students
      classroomStudents.forEach(student => {
        const studentLogs = getFromDB<any[]>(`anjo_lgpd_auditoria_${student.id}`, []);
        studentLogs.unshift({
          id: 'log_' + Date.now() + '_' + student.id,
          autor: usuarioAtual.nome,
          acao: `Atividade Coletiva adicionada por ${usuarioAtual.nome}: ${newTaskForm.titulo}`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Atividade coletiva de tipo ${newTaskForm.tipo} para toda a classe (${currentClassroom}) agendada para √†s ${newTaskForm.horarioPrevisto}.`
        });
        saveToDB(`anjo_lgpd_auditoria_${student.id}`, studentLogs);
      });
    } else {
      const newTask: TarefaDiaria = {
        id: 'task_custom_' + Date.now(),
        idosoId: idoso.id,
        tipo: newTaskForm.tipo,
        titulo: newTaskForm.titulo,
        descricao: newTaskForm.descricao,
        horarioPrevisto: newTaskForm.horarioPrevisto,
        status: 'pendente'
      };
      
      updatedTasks = [...allTasks, newTask];
      createdCount = 1;
      
      // Audit log for single student
      const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      logs.unshift({
        id: 'log_' + Date.now(),
        autor: usuarioAtual.nome,
        acao: isEscolar ? `Adicionou atividade √† agenda escolar: ${newTask.titulo}` : `Adicionou nova tarefa de cuidado: ${newTask.titulo}`,
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
        detalhes: `Atividade de tipo ${newTask.tipo} agendada para ${newTask.horarioPrevisto}`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    }
    
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    if (isEscolar && taskScope === 'coletivo') {
      const currentClassroom = getStudentClassroomLocal(idoso.nome);
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      allSeniors.filter(s => s.id.startsWith('aluno_') && getStudentClassroomLocal(s.nome) === currentClassroom).forEach(st => {
        localStorage.removeItem(`anjo_tasks_cleared_${st.id}`);
        localStorage.removeItem(`anjo_activities_cleared_${st.id}`);
      });
    } else {
      localStorage.removeItem(`anjo_tasks_cleared_${idoso.id}`);
      localStorage.removeItem(`anjo_activities_cleared_${idoso.id}`);
    }
    
    // Reload tasks of the active student
    setTarefas(updatedTasks.filter(t => t.idosoId === idoso.id));
    setIsAddingTask(false);
    setNewTaskForm({ tipo: 'alimentacao', titulo: '', descricao: '', horarioPrevisto: '12:00' });
    setTaskScope('individual');
    
    if (isEscolar && taskScope === 'coletivo') {
      alert(`üéâ Atividade coletiva adicionada com sucesso para todos os ${createdCount} alunos da sala!`);
    } else {
      alert("Atividade adicionada √† agenda do turno com sucesso!");
    }
  };

  const handleParseAuraWeeklyPlan = async () => {
    if (!auraWeeklyText.trim()) {
      alert('Por favor, cole o texto do planejamento gerado pela Aura!');
      return;
    }

    setIsParsingAuraWeekly(true);

    try {
      // 1. Extra√ß√£o Local Imediata de Ultra-Velocidade (< 2ms)
      const localParsed = parseAuraRawPlan(auraWeeklyText);
      if (localParsed.metadata) {
        setAuraDetectedMeta(localParsed.metadata);
      }

      if (localParsed.activities && localParsed.activities.length > 0) {
        const list = localParsed.activities.map(act => ({
          dia: act.dia,
          dataStr: act.dataStr,
          dataIso: act.dataIso,
          tema: act.tema || localParsed.metadata.tema,
          turma: act.turma || localParsed.metadata.turma,
          tipo: act.tipo,
          titulo: act.titulo,
          descricao: act.descricao,
          horario: act.horario,
          objetivoBNCC: act.objetivoBNCC || 'BNCC Educa√ß√£o Infantil',
          materiais: act.materiais || []
        }));
        setParsedAuraTasks(list);
        setSelectedAuraDayTab('todos');
        setIsParsingAuraWeekly(false);
        return;
      }

      // 2. Se o parser local n√£o encontrou blocos padr√µes, tenta a API com timeout r√°pido de 4s
      const customKey = localStorage.getItem('aura_gemini_key') || undefined;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('/api/parse-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          text: auraWeeklyText,
          geminiKey: customKey
        })
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data && Array.isArray(data.activities) && data.activities.length > 0) {
        if (data.metadata) {
          setAuraDetectedMeta({
            dia: data.metadata.day || localParsed.metadata.dia,
            dataStr: data.metadata.dateStr || localParsed.metadata.dataStr,
            dataIso: data.metadata.dateIso || localParsed.metadata.dataIso,
            tema: data.metadata.theme || localParsed.metadata.tema,
            turma: data.metadata.targetClass || localParsed.metadata.turma
          });
        }

        const formattedList = data.activities.map((a: any) => {
          const rawTitle = typeof a.title === 'string' ? a.title : 'Atividade Pedag√≥gica';
          const instStr = typeof a.instructions === 'string' && a.instructions.trim().length > 0
            ? a.instructions
            : (typeof a.descricao === 'string' && a.descricao.trim().length > 0
                ? a.descricao
                : (typeof a.description === 'string' && a.description.trim().length > 0
                    ? a.description
                    : (typeof a.obs === 'string' ? a.obs : '')));
          const cleanTitle = formatAuraTaskTitle(rawTitle, '', '');
          const cat = inferTaskType(rawTitle, a.bnccObjective || '', instStr);
          const dayStr = typeof a.day === 'string' ? a.day : (localParsed.metadata.dia || 'Segunda-feira');
          const timeStr = typeof a.time === 'string' ? a.time : '09:00';
          const dateStr = typeof a.dateStr === 'string' ? a.dateStr : localParsed.metadata.dataStr;
          const dateIso = typeof a.dateIso === 'string' ? a.dateIso : localParsed.metadata.dataIso;

          return {
            dia: dayStr,
            dataStr: dateStr,
            dataIso: dateIso,
            tema: a.theme || data.metadata?.theme || localParsed.metadata.tema,
            turma: a.targetClass || data.metadata?.targetClass || localParsed.metadata.turma,
            tipo: cat,
            titulo: cleanTitle,
            descricao: instStr || `Atividade pedag√≥gica planejada para as ${timeStr}.`,
            horario: timeStr,
            objetivoBNCC: a.bnccObjective || 'BNCC Educa√ß√£o Infantil',
            materiais: Array.isArray(a.materials) ? a.materials : []
          };
        });

        const validList = formattedList.filter((t: any) => 
          !isConversationalChatNoise(t.titulo || '') && 
          !isConversationalChatNoise(t.descricao || '')
        );

        setParsedAuraTasks(validList);
        setSelectedAuraDayTab('todos');
        setIsParsingAuraWeekly(false);
        return;
      }
    } catch (err) {
      console.warn('Processamento com IA concluiu com fallback:', err);
    } finally {
      setIsParsingAuraWeekly(false);
    }
  };

  const handleAutoFixAllTasks = () => {
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    let count = 0;
    const fixed = allTasks.map(t => {
      const { title: alignedTitle, tipo: alignedType } = realignPedagogicalActivity(t.titulo, t.descricao || '', t.horarioPrevisto || '', t.tipo);
      if (alignedTitle !== t.titulo || alignedType !== t.tipo) {
        count++;
        return {
          ...t,
          titulo: alignedTitle,
          tipo: alignedType,
        };
      }
      return t;
    });

    if (count > 0) {
      saveToDB('anjo_tarefas_diarias', fixed);
      setTarefas(fixed.filter(t => t.idosoId === idoso.id));
      alert(`ü™Ñ Perfeito! ${count} atividade(s) foram corrigidas e realinhadas automaticamente com seus hor√°rios e nomes pedag√≥gicos corretos!`);
    } else {
      alert('‚úÖ Todas as atividades j√° est√£o 100% alinhadas com seus nomes e hor√°rios corretos!');
    }
  };

  const handleCleanCorruptedTasks = () => {
    const currentClassroom = getStudentClassroomLocal(idoso.nome);
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const roomStudents = isEscolar
      ? allSeniors.filter(s => s.id.startsWith('aluno_') && getStudentClassroomLocal(s.nome) === currentClassroom)
      : [idoso];

    if (!confirm(`Deseja limpar todas as atividades e tarefas anteriores/antigas de ${isEscolar ? `toda a turma (${currentClassroom})` : idoso.nome} para iniciar com o planejamento limpo?`)) {
      return;
    }

    const targetStudents = isEscolar ? roomStudents : [idoso];
    const targetIds = new Set(targetStudents.map(s => s.id));

    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const cleanedTasks = allTasks.filter(t => !targetIds.has(t.idosoId));
    saveToDB('anjo_tarefas_diarias', cleanedTasks);

    const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    const cleanedAtivs = allAtivs.filter(a => !targetIds.has(a.idosoId));
    saveToDB('anjo_atividades', cleanedAtivs);

    targetStudents.forEach(st => {
      localStorage.setItem(`anjo_tasks_initialized_${st.id}`, 'true');
      localStorage.setItem(`anjo_tasks_cleared_${st.id}`, 'true');
      localStorage.setItem(`anjo_activities_cleared_${st.id}`, 'true');
    });

    // Delete matching records from Firestore in background
    deleteStudentDataFromFirestore(Array.from(targetIds)).catch(() => {});
    purgeOrphanedStudentData();

    setTarefas([]);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new CustomEvent('db-jornada-update'));
    alert('üßπ Todas as atividades e tarefas anteriores foram limpas com sucesso!');
  };

  const handleSaveAuraWeeklyPlan = (dayFilterOnly?: string) => {
    if (parsedAuraTasks.length === 0) return;

    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para criar atividades!");
      return;
    }

    const tasksToApply = dayFilterOnly && dayFilterOnly !== 'todos'
      ? parsedAuraTasks.filter(t => t.dia === dayFilterOnly || t.dataStr === dayFilterOnly)
      : parsedAuraTasks;

    if (tasksToApply.length === 0) {
      alert("Nenhuma atividade encontrada para o filtro selecionado.");
      return;
    }

    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const currentClassroom = getStudentClassroomLocal(idoso.nome);
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const targetStudents = (isEscolar && taskScope === 'coletivo')
      ? allSeniors.filter(s => s.id.startsWith('aluno_') && getStudentClassroomLocal(s.nome) === currentClassroom)
      : [idoso];

    const targetStudentIds = new Set(targetStudents.map(s => s.id));

    // Se o modo for 'substituir', removemos todas as tarefas e atividades anteriores dos alunos alvo para dar lugar exclusivo ao novo planejamento oficial
    let baseTasks = allTasks;
    const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    let baseAtivs = allAtivs;

    if (auraMergeMode === 'substituir') {
      baseTasks = allTasks.filter(t => !targetStudentIds.has(t.idosoId));
      baseAtivs = allAtivs.filter(a => !targetStudentIds.has(a.idosoId));
    }

    // Todas as atividades de todos os dias v√£o para o hist√≥rico/registro pedag√≥gico completo (anjo_atividades)
    const newAtivsBatch: RegistroAtividade[] = [];
    const todayIso = getTodayIso();

    // Determina quais tarefas entram na rotina di√°ria do dia de hoje (anjo_tarefas_diarias)
    // Se o usu√°rio selecionou uma aba espec√≠fica, usa aquele dia.
    // Se selecionou "todos" ou n√£o especificou, escolhe as tarefas do dia de hoje (ou primeiro dia) para a rotina di√°ria sem repeti√ß√£o!
    const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Ter√ßa-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'S√°bado'];
    const currentDayName = DAY_NAMES[new Date().getDay()];
    
    let dailyTasksToApply = tasksToApply;
    if (!dayFilterOnly || dayFilterOnly === 'todos') {
      const distinctDays = Array.from(new Set(tasksToApply.map(t => t.dia || t.dataStr).filter(Boolean)));
      if (distinctDays.length > 1) {
        const todayMatch = tasksToApply.filter(t => t.dia?.toLowerCase() === currentDayName.toLowerCase() || t.dataIso === todayIso);
        if (todayMatch.length > 0) {
          dailyTasksToApply = todayMatch;
        } else {
          // Se hoje n√£o estiver no plano, usa o primeiro dia do plano como rotina di√°ria
          const firstDay = distinctDays[0];
          dailyTasksToApply = tasksToApply.filter(t => t.dia === firstDay || t.dataStr === firstDay);
        }
      }
    }

    // Cria as atividades no hist√≥rico completo
    tasksToApply.forEach((pItem, pIdx) => {
      const taskDate = pItem.dataIso || todayIso;
      targetStudents.forEach((st, stIdx) => {
        let enrichedDesc = pItem.descricao || '';
        if (pItem.objetivoBNCC && !enrichedDesc.includes(pItem.objetivoBNCC)) {
          enrichedDesc += `\nüéØ Campo BNCC: ${pItem.objetivoBNCC}`;
        }
        if (pItem.materiais && pItem.materiais.length > 0) {
          enrichedDesc += `\nüì¶ Materiais: ${pItem.materiais.join(', ')}`;
        }

        newAtivsBatch.push({
          id: 'ati_aura_' + Date.now() + '_' + pIdx + '_' + stIdx,
          idosoId: st.id,
          tipo: pItem.titulo,
          duracaoMinutos: 30,
          data: taskDate,
          horario: pItem.horario || '09:00',
          observacoes: enrichedDesc.trim(),
          fotoTrabalhinho: ''
        });
      });
    });

    // Cria as tarefas di√°rias para a agenda do dia, garantindo NUNCA duplicar mesmo hor√°rio + t√≠tulo
    const newBatch: TarefaDiaria[] = [];
    const seenDailyKeys = new Set<string>();

    dailyTasksToApply.forEach((pItem, pIdx) => {
      let enrichedDesc = pItem.descricao || '';
      if (pItem.objetivoBNCC && !enrichedDesc.includes(pItem.objetivoBNCC)) {
        enrichedDesc += `\nüéØ Campo BNCC: ${pItem.objetivoBNCC}`;
      }
      if (pItem.materiais && pItem.materiais.length > 0) {
        enrichedDesc += `\nüì¶ Materiais: ${pItem.materiais.join(', ')}`;
      }

      const normTime = (pItem.horario || '09:00').trim();
      const normTitle = (pItem.titulo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${normTime}_${normTitle}`;

      if (seenDailyKeys.has(key)) {
        return; // Pula duplicatas no mesmo hor√°rio
      }
      seenDailyKeys.add(key);

      targetStudents.forEach((st, stIdx) => {
        newBatch.push({
          id: 'task_aura_' + Date.now() + '_' + pIdx + '_' + stIdx,
          idosoId: st.id,
          tipo: pItem.tipo,
          titulo: pItem.titulo,
          descricao: enrichedDesc.trim(),
          horarioPrevisto: pItem.horario || '09:00',
          status: 'pendente'
        });

        localStorage.setItem(`anjo_tasks_initialized_${st.id}`, 'true');
        localStorage.removeItem(`anjo_tasks_cleared_${st.id}`);
        localStorage.removeItem(`anjo_activities_cleared_${st.id}`);
      });
    });

    const updatedTasks = mergeSimilarTasks(baseTasks, newBatch);
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    const updatedAtivs = [...baseAtivs, ...newAtivsBatch];
    saveToDB('anjo_atividades', updatedAtivs);

    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new CustomEvent('db-jornada-update'));

    setTarefas(updatedTasks.filter(t => t.idosoId === idoso.id));
    setAuraWeeklyText('');
    setParsedAuraTasks([]);
    setAuraDetectedMeta(null);
    setTaskModeAura('direto');
    setIsAddingTask(false);

    const dayLabel = dayFilterOnly && dayFilterOnly !== 'todos' ? `do dia "${dayFilterOnly}"` : 'do Planejamento Semanal';
    alert(`üéâ Sucesso! ${tasksToApply.length} atividade(s) ${dayLabel} foram agendadas com todas as informa√ß√µes completas (data, hor√°rio, t√≠tulo, descri√ß√£o detalhada, BNCC e materiais) para ${targetStudents.length} aluno(s)!`);
  };

  const handleEditTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para editar atividades!");
      return;
    }
    if (!editingTaskForm.titulo.trim() || !editingTaskForm.horarioPrevisto.trim()) {
      alert("Por favor, preencha o t√≠tulo e o hor√°rio previsto!");
      return;
    }

    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updated = allTasks.map(t => {
      if (t.id === editingTaskForm.id) {
        return {
          ...t,
          tipo: editingTaskForm.tipo,
          titulo: editingTaskForm.titulo,
          descricao: editingTaskForm.descricao,
          horarioPrevisto: editingTaskForm.horarioPrevisto
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updated);
    
    // Reload
    setTarefas(updated.filter(t => t.idosoId === idoso.id));
    setEditingTaskId(null);
    
    // Audit log
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: isEscolar ? `Editou atividade da agenda escolar: ${editingTaskForm.titulo}` : `Editou tarefa de cuidado: ${editingTaskForm.titulo}`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Novos dados - T√≠tulo: ${editingTaskForm.titulo}, Hor√°rio: ${editingTaskForm.horarioPrevisto}`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);

    alert("Atividade atualizada com sucesso!");
  };

  const handleDeleteTask = (taskId: string, taskTitle: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Familiares n√£o t√™m permiss√£o para excluir atividades!");
      return;
    }
    const description = isEscolar 
      ? `Deseja realmente remover a atividade "${taskTitle}" da rotina de hoje?` 
      : `Deseja realmente excluir permanentemente a tarefa "${taskTitle}"?`;

    triggerConfirm(
      'Confirmar Remo√ß√£o',
      description,
      () => {
        const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
        const updated = allTasks.filter(t => t.id !== taskId);
        saveToDB('anjo_tarefas_diarias', updated);

        // Also remove matching activity from anjo_atividades if present
        const matchingAtivId = taskId.replace(/^task_/, 'ati_');
        const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
        const updatedAtivs = allAtivs.filter(a => a.id !== matchingAtivId && a.id !== taskId);
        if (updatedAtivs.length !== allAtivs.length) {
          saveToDB('anjo_atividades', updatedAtivs);
        }

        // Reload
        setTarefas(updated.filter(t => t.idosoId === idoso.id));

        // Audit log
        const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
        logs.unshift({
          id: 'log_' + Date.now(),
          autor: usuarioAtual.nome,
          acao: isEscolar ? `Removeu atividade da agenda escolar: ${taskTitle}` : `Excluiu tarefa de cuidado: ${taskTitle}`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `A tarefa foi removida da agenda di√°ria.`
        });
        saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);

        localStorage.setItem(`anjo_tasks_initialized_${idoso.id}`, 'true');
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-routine-update'));
        alert("Atividade removida com sucesso!");
      }
    );
  };

  const handleDeduplicateTasks = () => {
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const studentTasks = allTasks.filter(t => t.idosoId === idoso.id);

    if (studentTasks.length === 0) {
      alert("N√£o h√° atividades na agenda deste aluno para verificar.");
      return;
    }

    const dedupedStudentTasks: TarefaDiaria[] = [];
    let removedCount = 0;

    studentTasks.forEach(t => {
      // Se for conversa solta da IA salva como tarefa, remove
      if (isConversationalChatNoise(t.titulo || '') || isConversationalChatNoise(t.descricao || '')) {
        removedCount++;
        return;
      }

      const existingIndex = dedupedStudentTasks.findIndex(ex =>
        areTaskTitlesSimilar(ex.titulo, t.titulo, ex.tipo, t.tipo, ex.horarioPrevisto, t.horarioPrevisto)
      );

      if (existingIndex !== -1) {
        removedCount++;
        const ex = dedupedStudentTasks[existingIndex];
        const isGeneric = (title: string) => 
          /^(atividade|atividade dirigida|atividade pedag√≥gica|refei√ß√£o|lanche|tarefa)$/i.test((title || '').replace(/[^\w\s]/gi, '').trim()) ||
          (title || '').toLowerCase().includes('tem√°tica (bncc)');

        let bestTitle = ex.titulo;
        if (isGeneric(ex.titulo) && !isGeneric(t.titulo)) {
          bestTitle = t.titulo;
        } else if (!isGeneric(t.titulo) && (t.titulo || '').length > (ex.titulo || '').length) {
          bestTitle = t.titulo;
        }

        let mergedDesc = t.descricao || ex.descricao || '';
        if (ex.descricao && t.descricao && !ex.descricao.includes(t.descricao) && !t.descricao.includes(ex.descricao)) {
          mergedDesc = `${t.descricao}\n\nüìù Detalhes adicionais: ${ex.descricao}`;
        }

        dedupedStudentTasks[existingIndex] = {
          ...ex,
          titulo: bestTitle,
          descricao: mergedDesc,
          status: (ex.status === 'concluido' || ex.status === 'recusado') ? ex.status : t.status,
          concluidaEm: ex.concluidaEm || t.concluidaEm,
          completadaPor: ex.completadaPor || t.completadaPor
        };
      } else {
        dedupedStudentTasks.push(t);
      }
    });

    if (removedCount === 0) {
      alert("‚úÖ Nenhuma tarefa duplicada encontrada! Todas as atividades possuem hor√°rios ou t√≠tulos distintos.");
      return;
    }

    const otherTasks = allTasks.filter(t => t.idosoId !== idoso.id);
    const finalAllTasks = [...otherTasks, ...dedupedStudentTasks];
    saveToDB('anjo_tarefas_diarias', finalAllTasks);
    setTarefas(dedupedStudentTasks);

    alert(`üßπ Sucesso! ${removedCount} atividade(s) duplicada(s) foram unificadas da agenda.`);
  };

  const handleResetToDefaultTasks = () => {
    if (!confirm('Deseja restaurar a rotina padr√£o recomendada de hor√°rios? As atividades atuais ser√£o substitu√≠das pelo cronograma padr√£o da turma.')) {
      return;
    }
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherTasks = allTasks.filter(t => t.idosoId !== idoso.id);
    const generated = generateDefaultTasks(idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherTasks, ...generated]);
    localStorage.setItem(`anjo_tasks_initialized_${idoso.id}`, 'true');
    localStorage.removeItem(`anjo_tasks_cleared_${idoso.id}`);
    setTarefas(generated);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    alert('üîÑ Rotina padr√£o restaurada com sucesso!');
  };

  const handleClearAllTasks = () => {
    const currentClassroom = getStudentClassroomLocal(idoso.nome);
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const roomStudents = isEscolar
      ? allSeniors.filter(s => s.id.startsWith('aluno_') && getStudentClassroomLocal(s.nome) === currentClassroom)
      : [idoso];

    let targetStudents = [idoso];
    if (isEscolar && roomStudents.length > 1) {
      const choice = window.confirm(`Deseja limpar as atividades de TODA A TURMA (${currentClassroom} - ${roomStudents.length} alunos)?\n\n[OK] = Limpar de Toda a Turma\n[Cancelar] = Limpar apenas de ${idoso.nome}`);
      if (choice) {
        targetStudents = roomStudents;
      }
    } else {
      if (!confirm(`Deseja realmente limpar TODAS as atividades da agenda de ${idoso.nome} hoje? Voc√™ poder√° adicionar novas atividades manuais ou importar o planejamento da Aura quando quiser.`)) {
        return;
      }
    }

    const targetIds = new Set(targetStudents.map(s => s.id));

    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherTasks = allTasks.filter(t => !targetIds.has(t.idosoId));
    saveToDB('anjo_tarefas_diarias', otherTasks);

    const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    const otherAtivs = allAtivs.filter(a => !targetIds.has(a.idosoId));
    saveToDB('anjo_atividades', otherAtivs);

    targetStudents.forEach(st => {
      localStorage.setItem(`anjo_tasks_initialized_${st.id}`, 'true');
      localStorage.setItem(`anjo_tasks_cleared_${st.id}`, 'true');
      localStorage.setItem(`anjo_activities_cleared_${st.id}`, 'true');
    });

    // Delete matching records from Firestore in background
    deleteStudentDataFromFirestore(Array.from(targetIds)).catch(() => {});
    purgeOrphanedStudentData();

    setTarefas([]);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new CustomEvent('db-tasks-update'));
    window.dispatchEvent(new CustomEvent('db-vitals-update'));
    window.dispatchEvent(new CustomEvent('db-jornada-update'));
    alert(`üóëÔ∏è Agenda e atividades anteriores limpas com sucesso para ${targetStudents.length} ${targetStudents.length === 1 ? 'aluno' : 'alunos'}!`);
  };

  // Turn active status functions
  const getStudentClassName = (studentInput: any): string | null => {
    return getStudentRoomName(studentInput);
  };

  const isStudentInRoom = (student: Idoso, roomName: string): boolean => {
    if (!student || !roomName) return false;
    const sRoom = (student.salaAula || student.quarto || (student as any).sala || '').trim();
    if (sRoom && sRoom !== 'Todas') {
      if (sRoom === roomName) return true;
      const splitRooms = sRoom.split(',').map(r => r.trim());
      if (splitRooms.includes(roomName)) return true;
      return false;
    }
    const detected = getStudentRoomName(student);
    if (detected && detected !== 'Todas') {
      return detected === roomName;
    }
    return false;
  };

  const isTeacherForRoom = (u: Usuario | null | undefined, roomName: string): boolean => {
    if (!u || !u.salaAula || !roomName) return false;
    const userRooms = u.salaAula.split(',').map(r => r.trim());
    return userRooms.some(r => r === roomName || roomName.startsWith(r) || r.startsWith(roomName) || roomName.includes(r) || r.includes(roomName));
  };

  const unlockAndMarkPresent = (targetId?: string) => {
    const sId = targetId || idoso.id;
    setIsAbsent(false);
    localStorage.removeItem(`anjo_is_absent_${sId}`);
    localStorage.setItem(`anjo_is_absent_${sId}`, 'false');
    const todayStr = new Date().toISOString().split('T')[0];
    const savedHist = localStorage.getItem(`anjo_absences_history_${sId}`);
    if (savedHist) {
      try {
        const list = JSON.parse(savedHist).filter((d: string) => d !== todayStr);
        localStorage.setItem(`anjo_absences_history_${sId}`, JSON.stringify(list));
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
  };

  const handleToggleAbsence = () => {
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Apenas educadores/cuidadores autorizados podem registrar ou alterar faltas/aus√™ncias de alunos!");
      return;
    }
    const nextAbsent = !isAbsent;
    
    if (nextAbsent) {
      const confirmMsg = isShiftActive 
        ? `Tem certeza que deseja registrar Falta/Aus√™ncia para ${idoso.nome}? Como as aulas j√° foram iniciadas, marcar a falta ir√° limpar todo o hist√≥rico de atividades registrado hoje para ele e enviar√° o aviso de aus√™ncia aos pais.`
        : `Deseja registrar Falta/Aus√™ncia para ${idoso.nome}? Isso enviar√° uma notifica√ß√£o de aviso de aus√™ncia aos pais.`;
        
      triggerConfirm(
        isEscolar ? 'Confirmar Registro de Falta' : 'Confirmar Registro de Aus√™ncia',
        confirmMsg,
        () => {
          setIsAbsent(true);
          localStorage.setItem(`anjo_is_absent_${idoso.id}`, 'true');

          // Save today's date into the cumulative absence history
          const todayStr = new Date().toISOString().split('T')[0];
          const savedHist = localStorage.getItem(`anjo_absences_history_${idoso.id}`);
          let currentHist: string[] = [];
          try {
            if (savedHist) currentHist = JSON.parse(savedHist);
          } catch (e) {}
          if (!currentHist.includes(todayStr)) {
            currentHist.push(todayStr);
            localStorage.setItem(`anjo_absences_history_${idoso.id}`, JSON.stringify(currentHist));
          }
          
          // Stop the active individual shift
          setIsShiftActive(false);
          setShiftStartTime(null);
          setShiftActiveState(idoso.id, false);

          // Clean daily tasks and routine items from today
          const allTasksDB = getFromDB<any[]>('anjo_tarefas_diarias', []);
          const updatedTasksDB = allTasksDB.filter(t => t.idosoId !== idoso.id);
          saveToDB('anjo_tarefas_diarias', updatedTasksDB);
          setTarefas([]);

          // Clean other databases for today related to this senior/student
          const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
          const updatedMeals = allMeals.filter(m => m.idosoId !== idoso.id);
          saveToDB('anjo_alimentacao', updatedMeals);

          const allHids = getFromDB<any[]>('anjo_hidratacao', []);
          const updatedHids = allHids.filter(h => h.idosoId !== idoso.id);
          saveToDB('anjo_hidratacao', updatedHids);

          const allHumor = getFromDB<any[]>('anjo_humor', []);
          const updatedHumor = allHumor.filter(h => h.idosoId !== idoso.id);
          saveToDB('anjo_humor', updatedHumor);

          const allVitals = getFromDB<any[]>('anjo_sinais', []);
          const updatedVitals = allVitals.filter(v => v.idosoId !== idoso.id);
          saveToDB('anjo_sinais', updatedVitals);

          // Clean student specific local/offline tables
          saveToDB(`anjo_higiene_log_${idoso.id}`, []);
          saveToDB(`anjo_ocorrencias_${idoso.id}`, []);

          // Register audit log
          const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
          logs.unshift({
            id: 'log_' + Date.now(),
            autor: usuarioAtual.nome,
            acao: `Registrado Falta / Aus√™ncia de Aluno`,
            data: new Date().toLocaleString('pt-BR'),
            ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
            detalhes: `Aluno marcado como ausente hoje. O per√≠odo ativo foi encerrado e os dados correntes foram limpos por solicita√ß√£o.`
          });
          saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
          setLgpdLogs(logs);

          // Trigger simulated WhatsApp message to parents
          const cleanName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
          const abMsg = `Anjo Escolar ‚Äî Aviso de Aus√™ncia
          
Ol√°. Registramos que o(a) aluno(a) *${cleanName}* n√£o compareceu hoje √†s atividades / aulas (Falta Justificada). 

Desejamos um excelente dia e esperamos v√™-lo(a) de volta em breve! Qualquer d√∫vida, estamos √† disposi√ß√£o.`;
          
          triggerWhatsAppSim('Aviso de Aus√™ncia e Falta Corrente', abMsg);
          showToast(`Falta hoje registrada para ${cleanName}!`);
          window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        }
      );
    } else {
      triggerConfirm(
        isEscolar ? 'Confirmar Presen√ßa do Aluno(a)' : 'Confirmar Presen√ßa do Cliente',
        `Tem certeza que deseja remover o registro de falta/aus√™ncia de hoje para ${idoso.nome}?`,
        () => {
          unlockAndMarkPresent(idoso.id);
          
          const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
          logs.unshift({
            id: 'log_' + Date.now(),
            autor: usuarioAtual.nome,
            acao: `Removido Registro de Falta`,
            data: new Date().toLocaleString('pt-BR'),
            ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
            detalhes: `Falta revogada. Aluno retorna para estado ativo.`
          });
          saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
          setLgpdLogs(logs);
          showToast(`Falta de hoje removida para ${idoso.nome}!`, 'success');
        }
      );
    }
  };

  const handleCheckShiftActive = (e: React.MouseEvent) => {
    if (isStaffUser(usuarioAtual) && !isShiftActive) {
      e.preventDefault();
      e.stopPropagation();
      alert(isEscolar 
        ? "‚ö†Ô∏è Per√≠odo Letivo N√£o Iniciado!\n\nPor favor, clique no bot√£o 'Iniciar Per√≠odo' ou 'Iniciar Coletivo' no topo da p√°gina antes de lan√ßar qualquer refei√ß√£o, higiene, comportamento, medicamento ou sa√∫de do aluno!" 
        : "‚ö†Ô∏è Turno de Cuidados N√£o Iniciado!\n\nPor favor, clique no bot√£o 'Iniciar Meu Turno de Cuidados' no topo da p√°gina antes de lan√ßar qualquer controle de rotina, refei√ß√£o, higiene ou sa√∫de!"
      );
    }
  };

  const handleStartShift = () => {
    handleStartShiftWithPreservation();
  };

  const handleStartShiftWithPreservation = () => {
    const startTimeStamp = new Date().toISOString();

    // 1. Wipe daily routine records for current student to guarantee clean slate
    resetStudentDailyRoutine([idoso.id]);

    // Preserve peso, temperatura and saturacao in vitals
    const allVitals = getFromDB<any[]>('anjo_sinais', []);
    const studentVitals = allVitals.filter(v => v.idosoId === idoso.id);

    let lastWeight: number | undefined = undefined;
    let lastTemp: number | undefined = undefined;
    let lastSat: number | undefined = undefined;

    for (let i = studentVitals.length - 1; i >= 0; i--) {
      const sv = studentVitals[i];
      if (lastWeight === undefined && sv.peso !== undefined && Number(sv.peso) > 0) {
        lastWeight = Number(sv.peso);
      }
      if (lastTemp === undefined && sv.temperatura !== undefined && Number(sv.temperatura) > 0) {
        lastTemp = Number(sv.temperatura);
      }
      if (lastSat === undefined && sv.saturacao !== undefined && Number(sv.saturacao) > 0) {
        lastSat = Number(sv.saturacao);
      }
    }

    const updatedVitals = allVitals.filter(v => v.idosoId !== idoso.id);

    if (lastWeight !== undefined || lastTemp !== undefined || lastSat !== undefined) {
      const baselineVital: SinalVital = {
        id: 'sin_base_' + idoso.id + '_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: 'Sem registros',
        glicemia: 0,
        temperatura: lastTemp !== undefined ? lastTemp : 36.5,
        frequenciaCardiaca: 0,
        saturacao: lastSat !== undefined ? lastSat : 0,
        peso: lastWeight,
        data: new Date().toISOString().split('T')[0],
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        registradoPor: usuarioAtual?.nome || 'Sistema',
        observacoes: 'Registro do dia anterior preservado (Peso, Temp, Sat)',
        fralda: 'Sem trocas',
        soneca: 'Sem registros'
      };
      updatedVitals.push(baselineVital);
    }
    saveToDB('anjo_sinais', updatedVitals);

    // Reset daily tasks to 'pendente' for current student to start fresh
    const allTasksToday = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasksToday = allTasksToday.map(t => {
      if (t.idosoId === idoso.id) {
        return {
          ...t,
          status: 'pendente' as const,
          concluidaEm: undefined,
          completadaPor: undefined,
          observacao: undefined,
          detalhes: undefined
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasksToday);
    setTarefas(updatedTasksToday.filter(t => t.idosoId === idoso.id));

    setIsShiftActive(true);
    setShiftStartTime(startTimeStamp);

    const startShiftUpdates: { targetKey: string; active: boolean; startTime?: string }[] = [
      { targetKey: idoso.id, active: true, startTime: startTimeStamp }
    ];
    if (idoso.nome) startShiftUpdates.push({ targetKey: idoso.nome, active: true, startTime: startTimeStamp });
    const cleanN = (idoso.nome || '').split(' (')[0].trim();
    if (cleanN) startShiftUpdates.push({ targetKey: cleanN, active: true, startTime: startTimeStamp });

    setShiftActiveStatesBatch(startShiftUpdates);

    // If marked as absent, remove the absence when starting the shift
    setIsAbsent(false);
    localStorage.removeItem(`anjo_is_absent_${idoso.id}`);

    // LGPD shift starting traceability audit
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Abertura oficial de Escala de Turno (In√≠cio do Plant√£o)`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Escala de trabalho vinculada para provar presen√ßa e responsabilidade contratual.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);

    // Simulated notify
    const msg = `Anjo Cuidador: O Turno de cuidados para ${idoso.nome} foi INICIADO por ${usuarioAtual.nome} √†s ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Acompanhando em tempo real.`;
    triggerWhatsAppSim('Turno Iniciado', msg);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
      window.dispatchEvent(new CustomEvent('db-tasks-update'));
      window.dispatchEvent(new CustomEvent('db-routine-update'));
      window.dispatchEvent(new CustomEvent('db-jornada-update'));
      window.dispatchEvent(new CustomEvent('db-activities-update'));
    }

    showToast(`‚ñ∂Ô∏è Cron√¥metro e per√≠odo iniciados para ${idoso.nome.split(' (')[0]}! Todas as atividades do dia anterior foram zeradas para o novo dia.`, 'success');
  };

  const handleStartShiftGroup = (className: string) => {
    try {
      const startTimeStamp = new Date().toISOString();
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Ber√ß√°rio I - A');
      
      // Unconditionally remove absence for the current selected senior since they are initiating a shift active state on their screen
      setIsAbsent(false);
      localStorage.removeItem(`anjo_is_absent_${idoso.id}`);

      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      // Include all classmates belonging to target classroom
      const classmates = allSeniors.filter(s => {
        if (!s || typeof s !== 'object' || !s.id || !s.nome) return false;
        return isStudentInRoom(s, targetClass);
      });
      
      // Guarantee that the currently selected child is included
      if (!classmates.some(c => c.id === idoso.id)) {
        classmates.push(idoso);
      }

      // Unconditionally clear absence for all classmates in this room
      classmates.forEach(mate => {
        if (mate && mate.id) {
          localStorage.removeItem(`anjo_is_absent_${mate.id}`);
        }
      });

      const classmateIds = classmates.map(c => c.id);

      // 1. Clear routine databases for today related to these classmates so they start fresh from 0
      resetStudentDailyRoutine(classmateIds);

      let currentVitals = getFromDB<any[]>('anjo_sinais', []);
      
      const startShiftUpdates: { targetKey: string; active: boolean; startTime?: string }[] = [
        { targetKey: targetClass, active: true, startTime: startTimeStamp },
        { targetKey: idoso.id, active: true, startTime: startTimeStamp }
      ];

      classmates.forEach(mate => {
        if (!mate || !mate.id) return;
        startShiftUpdates.push({ targetKey: mate.id, active: true, startTime: startTimeStamp });

        saveToDB(`anjo_ocorrencias_${mate.id}`, []);
        localStorage.removeItem(`anjo_almo√ßo_pct_${mate.id}`);
        localStorage.removeItem(`anjo_sleep_hr_${mate.id}`);

        saveToDB(`anjo_higiene_log_${mate.id}`, {
          bath: false,
          teeth: false,
          clothes: false,
          diaper: false,
          hands: false,
          cream: false,
          banho: false,
          higieneBucal: false,
          trocaRoupa: false,
          trocaFralda: false,
          pele: false,
          time: '',
          observations: ''
        });

        // Extract latest weight, temperature, and saturation to preserve them
        const mateVitals = currentVitals.filter(v => v.idosoId === mate.id);
        let lastWeight: number | undefined = undefined;
        let lastTemp: number | undefined = undefined;
        let lastSat: number | undefined = undefined;

        for (let i = mateVitals.length - 1; i >= 0; i--) {
          const sv = mateVitals[i];
          if (lastWeight === undefined && sv.peso !== undefined && Number(sv.peso) > 0) {
            lastWeight = Number(sv.peso);
          }
          if (lastTemp === undefined && sv.temperatura !== undefined && Number(sv.temperatura) > 0) {
            lastTemp = Number(sv.temperatura);
          }
          if (lastSat === undefined && sv.saturacao !== undefined && Number(sv.saturacao) > 0) {
            lastSat = Number(sv.saturacao);
          }
        }

        // Remove old vitals for mate.id
        currentVitals = currentVitals.filter(v => v.idosoId !== mate.id);

        if (lastWeight !== undefined || lastTemp !== undefined || lastSat !== undefined) {
          const baselineVital: SinalVital = {
            id: 'sin_base_' + mate.id + '_' + Date.now(),
            idosoId: mate.id,
            pressaoArterial: 'Sem registros',
            glicemia: 0,
            temperatura: lastTemp !== undefined ? lastTemp : 36.5,
            frequenciaCardiaca: 0,
            saturacao: lastSat !== undefined ? lastSat : 0,
            peso: lastWeight,
            data: new Date().toISOString().split('T')[0],
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            registradoPor: usuarioAtual?.nome || 'Sistema',
            observacoes: 'Registro do dia anterior preservado (Peso, Temp, Sat)',
            fralda: 'Sem trocas',
            soneca: 'Sem registros'
          };
          currentVitals.push(baselineVital);
        }

        // LGPD shift starting traceability audit
        let logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${mate.id}`, []);
        if (!Array.isArray(logs)) logs = [];
        logs.unshift({
          id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          autor: usuarioAtual?.nome || 'Educador(a)',
          acao: `Abertura oficial de Per√≠odo Letivo Coletivo (Iniciado para toda a Classe ${targetClass})`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Registro de aula sincronizado com todos os alunos da classe ${targetClass}. Atividades do dia anterior reiniciadas zeradas (preservados peso, temp e satura√ß√£o).`
        });
        saveToDB(`anjo_lgpd_auditoria_${mate.id}`, logs);
      });

      setShiftActiveStatesBatch(startShiftUpdates);
      saveToDB('anjo_sinais', currentVitals);

      setQuickHygiene({
        bath: false,
        teeth: false,
        clothes: false,
        diaper: false,
        hands: false,
        cream: false,
        observations: ''
      });

      // Reset daily tasks to 'pendente' for all classmates in the classroom to start fresh
      const allTasksTodayCollective = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
      const updatedTasksCollective = allTasksTodayCollective.map(t => {
        if (classmateIds.includes(t.idosoId)) {
          return {
            ...t,
            status: 'pendente' as const,
            concluidaEm: undefined,
            completadaPor: undefined,
            observacao: undefined,
            detalhes: undefined
          };
        }
        return t;
      });
      saveToDB('anjo_tarefas_diarias', updatedTasksCollective);
      setTarefas(updatedTasksCollective.filter(t => t.idosoId === idoso.id));

      setQuickHygiene({
        bath: false,
        teeth: false,
        clothes: false,
        diaper: false,
        hands: false,
        cream: false,
        observations: ''
      });

      // Unconditionally set shift active for current selected senior
      setIsShiftActive(true);
      setShiftStartTime(startTimeStamp);
      setShiftActiveState(idoso.id, true, startTimeStamp);

      // Refresh current student's local LGPD logs state as well so UI reflects changes instantly
      let logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      if (!Array.isArray(logs)) logs = [];
      setLgpdLogs(logs);

      // Simulated notify for active student
      const msg = `Anjo Escolar: O Per√≠odo Letivo para todos os alunos presentes da classe ${targetClass} foi INICIADO por ${usuarioAtual?.nome || 'Educador(a)'} √†s ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} de forma coletiva.`;
      triggerWhatsAppSim('Aulas Iniciadas em Grupo', msg);
      
      showToast(`Aulas iniciadas com sucesso para todos os ${classmates.length} alunos presentes da classe ${targetClass}! Atividades do dia anterior foram zeradas, mantendo peso, temperatura e satura√ß√£o.`, 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }
    } catch (e: any) {
      console.error('Erro ao iniciar per√≠odo coletivo:', e);
      showToast(`Erro ao iniciar aulas: ${e.message || e}`, 'warning');
    }
  };

  const handleEndShiftGroup = (className: string) => {
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o per√≠odo letivo coletivo!");
      return;
    }
    try {
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Maternal I - A');

      triggerConfirm(
        'Encerrar Aulas Coletivo',
        `Voc√™ tem certeza que deseja encerrar as aulas de todos os alunos da classe ${targetClass} ao mesmo tempo? Todos os di√°rios de rotina ser√£o finalizados.`,
        () => {
          try {
            const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
            // Only include classmates who are not absent and belong to targetClass
            const classmates = allSeniors.filter(s => {
              if (!s || typeof s !== 'object' || !s.id || !s.nome) return false;
              const isMateAbsent = localStorage.getItem(`anjo_is_absent_${s.id}`) === 'true';
              return s.id.startsWith('aluno_') && isStudentInRoom(s, targetClass) && !isMateAbsent;
            });
            
            // Guarantee that the currently selected child is included if they are not absent
            if (!isAbsent) {
              if (!classmates.some(c => c.id === idoso.id)) {
                classmates.push(idoso);
              }
            }
            
            const allTasksToday = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
            const shareList: any[] = [];
            const initialStatuses: Record<string, 'pendente' | 'aberto' | 'confirmado'> = {};
            const allLogs = getFromDB<NotificacaoSimulada[]>('anjo_notificacoes', []);
            const endShiftUpdates: { targetKey: string; active: boolean }[] = [
              { targetKey: targetClass, active: false },
              { targetKey: idoso.id, active: false }
            ];

            classmates.forEach(mate => {
              if (!mate || !mate.id) return;
              endShiftUpdates.push({ targetKey: mate.id, active: false });
              
              // Count metrics for this specific classmate to make a accurate summary log!
              const mateTasks = allTasksToday.filter(t => t && t.idosoId === mate.id);
              const mateConcluidas = mateTasks.filter(t => t.status === 'concluido');
              
              const mateHids = getTodayHydrationRecords(mate.id);
              const mateTotalMl = mateHids.reduce((acc, h) => acc + (Number(h.quantidadeMl) || 0), 0);

              const totalTasks = mateTasks.length > 0 ? mateTasks.length : 5;
              const completedTasks = mateTasks.length > 0 ? mateConcluidas.length : 5;
              const taxaConformidadeCalc = Math.round((completedTasks / totalTasks) * 100);

              const summaryId = 'summary_id_' + Date.now() + '_' + mate.id;
              const mateNameClean = (mate.nome || '').includes(' (') ? mate.nome.split(' (')[0] : (mate.nome || 'Aluno');
              
              const todayBr = new Date().toLocaleDateString('pt-BR');
              const startHourStr = formatShiftTime(shiftStartTime, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
              const endHourStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              const mateMsg = `üå≥ A √ÅRVORE DA INF√ÇNCIA HOJE:
Hoje a √°rvore do(a) *${mateNameClean}* floresceu no Anjinho Escolar:
‚Ä¢ üçÉ *Folhas verdes:* Nutri√ß√£o balanceada e hidrata√ß√£o regular (${mateTotalMl}ml);
‚Ä¢ üå∏ *Flores e borboletas:* Momento acolhedor de sono e descanso tranquilo;
‚Ä¢ üçé *Frutos e passarinhos:* Atividades pedag√≥gicas, trabalhinhos e aprendizados;
‚Ä¢ ü™µ *Tronco forte:* Cuidados di√°rios, higiene completa e sa√∫de acompanhada de perto (36.5¬∞C).

‚òÄÔ∏èüíß *PARTICIPE DA JORNADA DO(A) ${mateNameClean.toUpperCase()}!*
Abra as fotos no aplicativo e regue a √°rvore do seu filho enviando uma das manifesta√ß√µes de afeto:
‚ú® *Que encanto!* ‚Ä¢ ‚ù§Ô∏è *Feito com amor* ‚Ä¢ üåü *Puro brilho!* ‚Ä¢ ü§ù *Orgulho da gente* ‚Ä¢ üíé *Um tesouro!*

_(Cada manifesta√ß√£o sua ilumina e rega a √°rvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o di√°rio de rotina escolar completo de hoje pelo link seguro:
üîó ${window.location.origin}/?relatorio=${summaryId}

Com carinho,
Equipe Anjinho Escolar ‚ù§Ô∏èüïäÔ∏è`;
     
              // Ingest simulated WhatsApp log for this child individually
              const primaryContact = mate.contatoEmergencia || { nome: 'Respons√°veis', telefone: '11999999999' };
              
              const newLog: NotificacaoSimulada = {
                id: 'log_coletivo_' + Date.now() + '_' + mate.id,
                idosoId: mate.id,
                familiarNome: primaryContact.nome || 'Respons√°veis',
                telefoneDestino: primaryContact.telefone || '11999999999',
                tipoCompromisso: 'Resumo Di√°rio da Aula (Coletivo)',
                mensagem: mateMsg,
                status: 'enviada_whatsapp',
                dataEnvio: new Date().toISOString(),
                canal: 'WhatsApp'
              };
              allLogs.push(newLog);

              // Add to our collective share modal checklist
              shareList.push({
                id: mate.id,
                nome: mateNameClean,
                contatoNome: primaryContact.nome || 'Respons√°veis',
                contatoTelefone: primaryContact.telefone || '11999999999',
                mensagem: mateMsg
              });
              initialStatuses[mate.id] = 'pendente';

              // Save past summary reports into their historical tab so parents see it in their family panel
              let pastSummaries = getFromDB<any[]>(`anjo_turn_summaries_${mate.id}`, []);
              if (!Array.isArray(pastSummaries)) pastSummaries = [];
              pastSummaries.unshift({
                id: summaryId,
                cuidador: usuarioAtual?.nome || 'Educador(a)',
                data: new Date().toLocaleDateString('pt-BR'),
                duracao: 'Per√≠odo Completo',
                inicio: startHourStr,
                fim: endHourStr,
                taxaConformidade: taxaConformidadeCalc,
                taxaQualidade: 100,
                mensagemCompleta: mateMsg,
                timestamp: new Date().toISOString()
              });
              saveToDB(`anjo_turn_summaries_${mate.id}`, pastSummaries);
              
              // Add audit log
              let logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${mate.id}`, []);
              if (!Array.isArray(logs)) logs = [];
              logs.unshift({
                id: 'log_' + Date.now() + '_' + mate.id,
                autor: usuarioAtual?.nome || 'Educador(a)',
                acao: `Encerramento de Per√≠odo Escolar Coletivo da Classe ${targetClass}`,
                data: new Date().toLocaleString('pt-BR'),
                ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
                detalhes: `Fechamento sincronizado com toda a classe. Boletim do aluno gerado e registrado no hist√≥rico.`
              });
              saveToDB(`anjo_lgpd_auditoria_${mate.id}`, logs);
            });
            
            saveToDB('anjo_notificacoes', allLogs);
            setShiftActiveStatesBatch(endShiftUpdates);

            // Remove active status unconditionally for current selected student
            setIsShiftActive(false);
            setShiftStartTime(null);

            // Reset daily tasks to 'pendente' for classmate students for the next day
            const classmateIds = classmates.map(c => c.id);
            const allTasksTodayCollective = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
            const updatedTasksCollective = allTasksTodayCollective.map(t => {
              if (classmateIds.includes(t.idosoId)) {
                return {
                  ...t,
                  status: 'pendente' as const,
                  concluidaEm: undefined,
                  completadaPor: undefined,
                  observacao: undefined,
                  detalhes: undefined
                };
              }
              return t;
            });
            saveToDB('anjo_tarefas_diarias', updatedTasksCollective);
            setTarefas(updatedTasksCollective.filter(t => t.idosoId === idoso.id));
            
            // Simulated notify for active student
            const endMsg = `Anjo Escolar: O Per√≠odo Letivo para todos os alunos da classe ${targetClass} foi ENCERRADO por ${usuarioAtual?.nome || 'Educador(a)'} √†s ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} de forma coletiva. Relat√≥rios de rotina, sono e fraldas enviados para o WhatsApp dos respons√°veis!`;
            triggerWhatsAppSim('Aulas Encerradas em Grupo', endMsg);

            // Populate states to trigger the custom high-fidelity collective confirmation notification panel
            setCollectiveShareList(shareList);
            setCollectiveShareStatuses(initialStatuses);
            setShowCollectiveShareModal(true);
 
            showToast(`Per√≠odo Escolar da classe ${targetClass} foi encerrado com sucesso para todos os alunos sincronizados!`, 'success');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
              window.dispatchEvent(new CustomEvent('anjo_user_updated'));
              window.dispatchEvent(new CustomEvent('db-vitals-update'));
            }
          } catch (err: any) {
            console.error('Erro ao processar encerramento coletivo:', err);
            setIsShiftActive(false);
            setShiftStartTime(null);
            setElapsedShiftTime('00:00:00');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
              window.dispatchEvent(new CustomEvent('anjo_user_updated'));
              window.dispatchEvent(new CustomEvent('db-vitals-update'));
            }
            showToast(`Encerramento coletivo processado com sucesso.`, 'success');
          }
        }
      );
    } catch (e: any) {
      console.error('Erro ao acionar encerramento coletivo:', e);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      }
      showToast(`Encerramento processado.`, 'success');
    }
  };

  // 1. Double-Step Review Trigger
  const handleTriggerEndShiftReview = () => {
    if (!isStaffUser(usuarioAtual)) {
      alert("‚ö†Ô∏è Opera√ß√£o Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o per√≠odo letivo!");
      return;
    }
    const currentStartTime = shiftStartTime || new Date().toISOString();

    const allTasksToday = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const seniorTasks = allTasksToday.filter(t => t.idosoId === idoso.id);
    
    let concluidas = seniorTasks.filter(t => t.status === 'concluido');
    const recusadas = seniorTasks.filter(t => t.status === 'recusado');
    const atrasadas = seniorTasks.filter(t => t.status === 'atrasado');
    let pendentes = seniorTasks.filter(t => t.status === 'pendente');

    // Load recent hydration using unified helper
    const hids = getTodayHydrationRecords(idoso.id);
    const totalMl = hids.reduce((acc, curr) => acc + (Number(curr?.quantidadeMl) || 0), 0);

    // Load meals safely combining global and student-specific stores
    const globalMeals = getFromDB<any[]>('anjo_alimentacao', []);
    const studentMeals = getFromDB<any[]>(`anjo_alimentacao_${idoso.id}`, []);
    const mealsMap = new Map<string, any>();
    [...globalMeals, ...studentMeals].forEach((item, idx) => {
      if (!item) return;
      if (item.idosoId && item.idosoId !== idoso.id) return;
      if (item.data && !isTodayOrDemoDate(item.data)) return;
      const id = item.id || `meal_${idx}_${Date.now()}`;
      if (!mealsMap.has(id)) {
        mealsMap.set(id, item);
      }
    });
    const meals = Array.from(mealsMap.values());
    
    const vitals = getFromDB<SinalVital[]>('anjo_sinais', []).filter(s => s && s.idosoId === idoso.id && isTodayOrDemoDate(s.data));
    const ultimoSinal = vitals.length > 0 ? vitals[vitals.length - 1] : null;

    const humors = getFromDB<RegistroHumor[]>('anjo_humor', []).filter(hu => hu && hu.idosoId === idoso.id && isTodayOrDemoDate(hu.data));
    const ultimoHumorText = humors.length > 0 ? humors[humors.length - 1].estado : 'Est√°vel';

    if (pendentes.length > 0 && (concluidas.length > 0 || meals.length > 0 || totalMl > 0)) {
      concluidas = seniorTasks.filter(t => t.status !== 'recusado');
      pendentes = [];
    }

    const totalCalculado = seniorTasks.length > 0 ? seniorTasks.length : 5;
    const numConcluidas = concluidas.length > 0 ? concluidas.length : totalCalculado;
    const taxaC = Math.round((numConcluidas / totalCalculado) * 100);
    const taxaQ = Math.round(((numConcluidas + recusadas.length) / totalCalculado) * 100);

    const startHour = formatShiftTime(currentStartTime, '07:30');
    const endHour = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const medChanges = getFromDB<any[]>(`anjo_historico_medicamentos_${idoso.id}`, [])
      .filter((ch: any) => {
        if (!currentStartTime || !ch) return false;
        const chTime = new Date(ch.timestamp).getTime();
        const startTime = new Date(currentStartTime).getTime();
        return chTime >= startTime;
      });

    const payload = {
      concluidas,
      recusadas,
      atrasadas,
      pendentes,
      totalCalculado,
      taxaC,
      taxaQ,
      totalMl,
      waterCount: hids.length,
      meals,
      ultimoSinal,
      ultimoHumorText,
      ocorrencias: occurrencesList || [],
      medChanges: medChanges || [],
      startHour,
      endHour,
    };

    setShiftReviewPayload(payload);
    setShowShiftReviewModal(true);
  };

  // 2. Final Enclosure Trigger
  const handleConfirmEndShift = () => {
    try {
      const targetClass = getStudentClassName(idoso) || idoso.salaAula || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : '');
      const currentStartTime = shiftStartTime || new Date().toISOString();

      const {
        concluidas = [],
        recusadas = [],
        atrasadas = [],
        pendentes = [],
        taxaC = 100,
        taxaQ = 100,
        totalMl = 0,
        waterCount = 0,
        meals = [],
        ultimoSinal = null,
        ultimoHumorText = 'Tranquilo',
        startHour = '07:30',
        endHour = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ocorrencias = [],
        medChanges = []
      } = shiftReviewPayload || {};

    const todayBr = new Date().toLocaleDateString('pt-BR');
    const nowTimeBr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const profName = usuarioAtual?.nome ? (usuarioAtual.nome.includes('Prof') ? usuarioAtual.nome : `Prof¬™ ${usuarioAtual.nome}`) : 'Prof¬™ Nilva Amaral';

    const mealSummaryStr = meals && meals.length > 0
      ? meals.map((m: any) => `${m.refeicao === 'almoco' ? 'Almo√ßo' : m.refeicao === 'cafe_manha' ? 'Caf√© da Manh√£' : m.refeicao === 'lanche' ? 'Lanche' : 'Refei√ß√£o'} (${m.aceitacao === 'muito_bem' ? 'Comeu Tudo' : m.aceitacao === 'pouco' ? 'Comeu Pouco' : 'Recusou'})`).join(', ')
      : 'Mamadeira / Refei√ß√£o (Comeu Tudo)';

    const hygieneSummaryStr = (ultimoSinal && ultimoSinal.fralda) 
      ? ultimoSinal.fralda 
      : 'Xixi, Coc√¥ (normal), Dentes Escovados, Banho Tomado, Roupa Trocada';

    const sleepSummaryStr = (ultimoSinal && ultimoSinal.pressaoArterial)
      ? ultimoSinal.pressaoArterial
      : 'Dormiu 45min';

    const healthTempStr = (ultimoSinal && ultimoSinal.temperatura) 
      ? `${ultimoSinal.temperatura}¬∞C` 
      : '36.5¬∞C';

    // A. Compilation of complete pre-formatted dashboard report (Available securely in Family history logs)
    let fullReportMsg = isEscolar 
      ? `‚ú® Anjo Escolar: Registro de ${idoso.nome} confirmed por ${profName}:
üìÖ Data: ${todayBr}  ‚Ä¢  ‚è∞ Hor√°rio: ${nowTimeBr}

üíß √Ågua: ${totalMl}ml
üçΩÔ∏è Refei√ß√£o: ${mealSummaryStr}
üò¥ Sono: ${sleepSummaryStr}
üöæ Higiene: ${hygieneSummaryStr}
üòä Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}
üå°Ô∏è Sa√∫de: ${healthTempStr}
‚öñÔ∏è Peso: ${idoso.peso || '15.5'} kg

`
      : `‚ú® Anjo Cuidador: Registro de ${idoso.nome} confirmado por ${profName}:
üìÖ Data: ${todayBr}  ‚Ä¢  ‚è∞ Hor√°rio: ${nowTimeBr}

üíß √Ågua / Hidrata√ß√£o: ${totalMl}ml
üçΩÔ∏è Alimenta√ß√£o: ${mealSummaryStr}
üò¥ Repouso: ${sleepSummaryStr}
üöæ Higiene / Cuidados: ${hygieneSummaryStr}
üòä Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}
üå°Ô∏è Sa√∫de / Sinais: ${healthTempStr}
‚öñÔ∏è Peso: ${idoso.peso || '65'} kg

`;

    fullReportMsg += `‚è±Ô∏è *Per√≠odo:* das ${startHour} √†s ${endHour} (Dura√ß√£o: ${elapsedShiftTime})\n`;
    fullReportMsg += `üìà *Taxa de Conformidade hoje:* ${taxaC}%  ‚Ä¢  *Qualidade de Registro:* ${taxaQ}%\n\n`;

    fullReportMsg += isEscolar ? `üéí *ATIVIDADES & ROTINAS CONCLU√çDAS:*\n` : `üíä *MEDICA√á√ïES & CUIDADOS CONCLU√çDOS:*\n`;
    if (concluidas.length > 0) {
      concluidas.forEach((m: any) => {
        fullReportMsg += `  ‚úì ${m.titulo} √†s ${m.concluidaEm || m.horarioPrevisto}${m.observacao ? ` ("${m.observacao}")` : ''}\n`;
      });
    } else {
      fullReportMsg += isEscolar 
        ? `  - Nenhuma atividade ou rotina conclu√≠da neste per√≠odo.\n`
        : `  - Nenhuma medica√ß√£o ou cuidado administrado neste turno.\n`;
    }

    if (recusadas.length > 0) {
      fullReportMsg += isEscolar ? `\n‚ùå *RECUSAS / JUSTIFICATIVAS:*\n` : `\n‚ùå *RECUSAS JUSTIFICADAS:*\n`;
      recusadas.forEach((r: any) => {
        fullReportMsg += `  √ó ${r.titulo} √†s ${r.concluidaEm || r.horarioPrevisto}. Justificativa: "${r.observacao || 'Recusa geral'}"\n`;
      });
    }

    if (atrasadas.length > 0 || pendentes.length > 0) {
      fullReportMsg += isEscolar ? `\n‚ö†Ô∏è *PEND√äNCIAS / N√ÉO CONCLU√çDOS:*\n` : `\n‚ö†Ô∏è *PEND√äNCIAS / N√ÉO ADMINISTRADOS:*\n`;
      if (atrasadas.length > 0) {
        atrasadas.forEach((a: any) => {
          fullReportMsg += `  ‚Ä¢ [ATRASADO] ${a.titulo} prevista para ${a.horarioPrevisto}\n`;
        });
      }
      if (pendentes.length > 0) {
        pendentes.forEach((p: any) => {
          fullReportMsg += `  ‚Ä¢ [PENDENTE] ${p.titulo} prevista para ${p.horarioPrevisto}\n`;
        });
      }
    }

    fullReportMsg += `\nüçΩ *ALIMENTA√á√ÉO:*\n`;
    if (meals.length > 0) {
      meals.forEach((meal: any) => {
        const mealTitle = meal.refeicao === 'cafe_manha' ? 'Caf√© da manh√£' : meal.refeicao === 'almoco' ? 'Almo√ßo' : meal.refeicao === 'lanche' ? 'Lanche da Tarde' : meal.refeicao === 'jantar' ? 'Jantar' : 'Ceia';
        const accepts = meal.aceitacao === 'muito_bem' ? (isEscolar ? 'Comeu/Tomou tudo' : 'Aceitou muito bem') : meal.aceitacao === 'pouco' ? 'Comeu pouco' : 'Recusou';
        fullReportMsg += `  ‚Ä¢ ${mealTitle} (${meal.horario}): ${accepts}.${meal.observacoes ? ` Obs: "${meal.observacoes}"` : ''}\n`;
      });
    } else {
      fullReportMsg += isEscolar ? `  - Sem refei√ß√µes cadastradas neste per√≠odo.\n` : `  - Sem refei√ß√µes cadastradas neste turno.\n`;
    }

    const actualWaterCount = waterCount;
    fullReportMsg += `\nüíß *HIDRATA√á√ÉO:*\n`;
    if (isEscolar) {
      fullReportMsg += `  ‚Ä¢ Copos de √Ågua Ingeridos: ${actualWaterCount > 0 ? actualWaterCount : Math.max(1, Math.round(totalMl/250))} copo(s) (${totalMl}ml de √°gua)\n`;
    } else {
      fullReportMsg += `  ‚Ä¢ Copos d'√°gua registrados: ${actualWaterCount > 0 ? actualWaterCount : Math.max(1, Math.round(totalMl/250))} copo(s) (totalizado: ${totalMl}ml de √°gua ingerida)\n`;
    }

    fullReportMsg += isEscolar ? `\nüß† *HUMOR & COMPORTAMENTO:*\n` : `\nüß† *HUMOR & BEM ESTAR:*\n`;
    fullReportMsg += `  ‚Ä¢ Estado observado: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}\n`;

    if (ultimoSinal) {
      if (isEscolar) {
        fullReportMsg += `\nüíì *SA√öDE & SONECA RECENTES:*\n`;
        fullReportMsg += `  ‚Ä¢ Per√≠odo de Sono/Soneca: ${ultimoSinal.pressaoArterial}\n`;
        fullReportMsg += `  ‚Ä¢ Fraldas e Trocas: ${ultimoSinal.fralda || 'Verificada e limpa'}\n`;
        fullReportMsg += `  ‚Ä¢ Temperatura Corporal: ${ultimoSinal.temperatura}¬∞C\n`;
      } else {
        fullReportMsg += `\nüíì *√öLTIMOS SINAIS VITAIS AFERIDOS:*\n`;
        fullReportMsg += `  ‚Ä¢ Press√£o Arterial: ${ultimoSinal.pressaoArterial}\n`;
        fullReportMsg += `  ‚Ä¢ Glicemia: ${ultimoSinal.glicemia} mg/dL\n`;
        fullReportMsg += `  ‚Ä¢ Oxigena√ß√£o O2: ${ultimoSinal.saturacao}%\n`;
        fullReportMsg += `  ‚Ä¢ Temperatura: ${ultimoSinal.temperatura}¬∞C\n`;
      }
    }

    if (ocorrencias.length > 0) {
      fullReportMsg += isEscolar ? `\nüö® *OCORR√äNCIAS / OBSERVA√á√ïES AT√çPICAS NO PER√çODO:*\n` : `\nüö® *OCORR√äNCIAS / ANOTA√á√ïES AT√çPICAS NO PLANTONISMO:*\n`;
      ocorrencias.forEach((o: any) => {
        fullReportMsg += `  ‚Ä¢ [${(o.criticidade || 'informacao').toUpperCase()}] ${(o.tipo || 'ocorrencia').toUpperCase()} √†s ${o.horario || ''}: ${o.descricao || ''}\n`;
      });
    }

    // Include modifications of medications during the shift
    fullReportMsg += isEscolar ? `\nüì¶ *ALTERA√á√ïES DE ROTINA/AGENDA (Inclus√µes / Exclus√µes):*\n` : `\nüì¶ *ALTERA√á√ïES DE MEDICAMENTOS (Inclus√µes / Exclus√µes):*\n`;
    if (medChanges && medChanges.length > 0) {
      medChanges.forEach((ch: any) => {
        const actionLabel = ch.tipo === 'cadastro' ? 'NOVO CADASTRADO' : ch.tipo === 'exclusao' ? 'EXCLU√çDO' : ch.tipo === 'suspensao' ? 'SUSPENSO' : 'REATIVADO';
        fullReportMsg += `  ‚Ä¢ [${actionLabel}] ${ch.nome}: ${ch.detalhes} (por ${ch.autor || 'Educador(a)'})\n`;
      });
    } else {
      fullReportMsg += `  - Nenhuma altera√ß√£o feita neste per√≠odo.\n`;
    }

    fullReportMsg += `\n\n‚úì *Relat√≥rio processado de maneira segura e em conformidade estrita com LGPD.*`;

    // B. Generate unique report key
    const summaryId = 'summary_id_' + Date.now();

    // C. Composition of the revised SHORT WhatsApp direct alert
    const studentCleanName = (idoso.nome || '').split(' (')[0];
    const shortWaMsg = isEscolar
      ? `üå≥ A √ÅRVORE DA INF√ÇNCIA HOJE:
Hoje a √°rvore do(a) *${studentCleanName}* floresceu no Anjinho Escolar:
‚Ä¢ üçÉ *Folhas verdes:* Nutri√ß√£o (${mealSummaryStr}) e hidrata√ß√£o regular (${totalMl}ml);
‚Ä¢ üå∏ *Flores e borboletas:* Momento acolhedor de soneca e descanso (${sleepSummaryStr});
‚Ä¢ üçé *Frutos e passarinhos:* Atividades pedag√≥gicas e trabalhinhos manuais;
‚Ä¢ ü™µ *Tronco forte:* Cuidados di√°rios, higiene (${hygieneSummaryStr}) e sa√∫de (${healthTempStr}).

‚òÄÔ∏èüíß *PARTICIPE DA JORNADA DO(A) ${studentCleanName.toUpperCase()}!*
Abra as fotos no aplicativo e regue a √°rvore do seu filho enviando uma das manifesta√ß√µes de afeto:
‚ú® *Que encanto!* ‚Ä¢ ‚ù§Ô∏è *Feito com amor* ‚Ä¢ üåü *Puro brilho!* ‚Ä¢ ü§ù *Orgulho da gente* ‚Ä¢ üíé *Um tesouro!*

_(Cada manifesta√ß√£o sua ilumina e rega a √°rvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o di√°rio de rotina escolar completo pelo link seguro:
üîó ${window.location.origin}/?relatorio=${summaryId}

Com carinho,
Equipe Anjinho Escolar ‚ù§Ô∏èüïäÔ∏è`
      : `‚ú® Anjo Cuidador: Registro de ${idoso.nome} confirmado por ${profName}:
üìÖ Data: ${todayBr}  ‚Ä¢  ‚è∞ Hor√°rio: ${nowTimeBr}
üíß √Ågua: ${totalMl}ml
üçΩÔ∏è Alimenta√ß√£o: ${mealSummaryStr}
üò¥ Repouso: ${sleepSummaryStr}
üöæ Higiene: ${hygieneSummaryStr}
üòä Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}
üå°Ô∏è Sa√∫de: ${healthTempStr}
‚öñÔ∏è Peso: ${idoso.peso || '65'} kg

Acesse o boletim de cuidados completo pelo link seguro:
üîó ${window.location.origin}/?relatorio=${summaryId}`;

    // Dispatch concise WA alarm
    triggerWhatsAppSim(isEscolar ? 'Encerramento de Per√≠odo Letivo Curto para Pais' : 'Encerramento de Turno Curto para Fam√≠lia', shortWaMsg);

    // Save full shift history logs into local database for family portal visibility
    const pastSummaries = getFromDB<any[]>(`anjo_turn_summaries_${idoso.id}`, []);
    pastSummaries.unshift({
      id: summaryId,
      cuidador: usuarioAtual?.nome || 'Educador(a)',
      data: new Date().toLocaleDateString('pt-BR'),
      duracao: elapsedShiftTime || '00:00:00',
      inicio: startHour,
      fim: endHour,
      taxaConformidade: taxaC,
      taxaQualidade: taxaQ,
      mensagemCompleta: fullReportMsg,
      timestamp: new Date().toISOString()
    });
    saveToDB(`anjo_turn_summaries_${idoso.id}`, pastSummaries);
    setTurnSummaries(pastSummaries);

    // LGPD closure traceability log
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual?.nome || 'Educador(a)',
      acao: `Encerramento de Turno e Relat√≥rio Seguro do Boletim de Cuidados (${summaryId})`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Calculado Conformidade de ${taxaC}% e Qualidade de Registro de ${taxaQ}%. Link compartilhado com familiares autorizados.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);

    // End shift state unconditionally for all possible candidate keys (ID, name, room, classroom)
    const studentRoom = idoso.salaAula || idoso.quarto || getStudentRoomName(idoso);
    const candidateKeysToClose = Array.from(new Set([
      idoso.id,
      idoso.nome,
      idoso.nome ? idoso.nome.split(' (')[0].trim() : '',
      studentRoom
    ].filter(Boolean))) as string[];

    setShiftActiveStatesBatch(candidateKeysToClose.map(k => ({ targetKey: k, active: false })));

    setIsShiftActive(false);
    setShiftStartTime(null);
    setElapsedShiftTime('00:00:00');

    // Reset daily tasks to 'pendente' for the next day
    const allTasksTodayIndividual = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasksIndividual = allTasksTodayIndividual.map(t => {
      if (t.idosoId === idoso.id) {
        return {
          ...t,
          status: 'pendente' as const,
          concluidaEm: undefined,
          completadaPor: undefined,
          observacao: undefined,
          detalhes: undefined
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasksIndividual);
    setTarefas(updatedTasksIndividual.filter(t => t.idosoId === idoso.id));

    // Close review modal & clean up
    setShowShiftReviewModal(false);
    setShiftReviewPayload(null);

    // Dispatch global events to sync and refresh all screens/components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
    }

    // Actively trigger the Assisted WhatsApp Envio popup for Shift Summary bulletin!
    setManualShareOccurrenceMessage(shortWaMsg);
    setActiveSharingOccurrenceId(null);
    setShowManualOccurrenceShareModal(true);
    } catch (err: any) {
      console.error('Erro ao processar encerramento de turno:', err);
      const candidateKeysToClose = Array.from(new Set([
        idoso.id,
        idoso.nome,
        idoso.salaAula,
        idoso.quarto,
        getStudentClassName(idoso)
      ].filter(Boolean))) as string[];
      setShiftActiveStatesBatch(candidateKeysToClose.map(k => ({ targetKey: k, active: false })));
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
      setShowShiftReviewModal(false);
      setShiftReviewPayload(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }
      showToast('Per√≠odo/Turno encerrado com sucesso!', 'success');
    }
  };

  // Direct 1-Click Stop Shift Handler (opens modal to record reason, preserve activities and log LGPD)
  const handleDirectStopShift = () => {
    setStopShiftReason('Consulta M√©dica / Exame');
    setStopShiftNote('');
    setShowStopIndividualShiftModal(true);
  };

  const handleConfirmStopIndividualShift = () => {
    try {
      const finalReason = (stopShiftReason + (stopShiftNote ? ` - ${stopShiftNote}` : '')).trim() || 'Sa√≠da Antecipada / Aus√™ncia Tempor√°ria';
      const horaStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dataStr = new Date().toLocaleDateString('pt-BR');
      const cleanName = (idoso.nome || '').split(' (')[0].trim();

      // 1. Create Occurrence record
      const novaOcorrencia = {
        id: 'oc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        tipo: 'saida_ausencia',
        criticidade: 'amarelo',
        titulo: 'Sa√≠da Antecipada / Aus√™ncia Registrada',
        descricao: `Aluno ${cleanName} se ausentou √†s ${horaStr}. Motivo: ${finalReason}`,
        horario: horaStr,
        data: dataStr,
        responsavel: usuarioAtual?.nome || 'Educador',
        statusEnvioWhatsApp: 'mensagem_gerada',
        dataRegistroStatus: new Date().toLocaleString('pt-BR')
      };

      const currentOccs = getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []);
      const updatedOccs = [novaOcorrencia, ...currentOccs];
      setOccurrencesList(updatedOccs);
      saveToDB(`anjo_ocorrencias_${idoso.id}`, updatedOccs);

      // 2. Create LGPD Audit Log
      const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      logs.unshift({
        id: 'log_' + Date.now(),
        autor: usuarioAtual?.nome || 'Educador',
        acao: 'Sa√≠da / Aus√™ncia de Aluno Registrada',
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
        detalhes: `Hor√°rio de sa√≠da: ${horaStr} | Motivo: ${finalReason}. Atividades preservadas no di√°rio.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
      setLgpdLogs(logs);

      // 3. Mark shift turned off and student absent
      const candidateKeysToClose = Array.from(new Set([
        idoso.id,
        idoso.nome,
        cleanName
      ].filter(Boolean))) as string[];

      setShiftActiveStatesBatch(candidateKeysToClose.map(k => ({ targetKey: k, active: false, isAbsent: true, reason: finalReason })));

      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
      setIsAbsent(true);
      localStorage.setItem(`anjo_is_absent_${idoso.id}`, 'true');

      setShowStopIndividualShiftModal(false);

      // 4. Simulated WhatsApp notification
      const abMsg = `Anjo Escolar ‚Äî Aviso de Sa√≠da / Aus√™ncia
  
Ol√°. Registramos que o(a) aluno(a) *${cleanName}* teve sa√≠da/aus√™ncia registrada √†s *${horaStr}*.
Motivo: *${finalReason}*

As atividades e registros do dia permanecem salvos no relat√≥rio escolar. Qualquer d√∫vida, estamos √† disposi√ß√£o!`;

      triggerWhatsAppSim('Aviso de Sa√≠da / Aus√™ncia do Aluno', abMsg);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }

      showToast(`‚èπÔ∏è Sa√≠da de ${cleanName} registrada √†s ${horaStr}. Motivo salvo no relat√≥rio e LGPD.`, 'success');
    } catch (err) {
      console.error('Erro ao registrar sa√≠da de aluno:', err);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    const updated = turnSummaries.filter(r => r.id !== reportId);
    setTurnSummaries(updated);
    saveToDB(`anjo_turn_summaries_${idoso.id}`, updated);
    try {
      deleteFromFirestore(`anjo_turn_summaries_${idoso.id}`, reportId);
    } catch (e) {}

    // Clean notifications that mention this report
    const allLogs = getFromDB<NotificacaoSimulada[]>('anjo_notificacoes', []);
    const updatedLogs = allLogs.filter(l => !l.mensagem || !l.mensagem.includes(`relatorio=${reportId}`));
    saveToDB('anjo_notificacoes', updatedLogs);

    // Clean URL parameter if currently opening this report
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('relatorio') === reportId) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {}

    showToast('‚úì Di√°rio/relat√≥rio de rotina exclu√≠do permanentemente!');
  };

  // Reusable helper to check role permissions and activate shift automatically if needed
  const ensureAuthorizedAndActiveShift = (actionName: string): boolean => {
    if (isAbsent) {
      unlockAndMarkPresent();
    }
    if (!isShiftActive) {
      const startTimeStamp = new Date().toISOString();
      setIsShiftActive(true);
      setShiftStartTime(startTimeStamp);
      setShiftActiveState(idoso.id, true, startTimeStamp);
      unlockAndMarkPresent();
      
      // Add audit log
      const auditLogs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      auditLogs.unshift({
        id: 'aud_' + Date.now(),
        usuarioId: usuarioAtual.id,
        usuarioNome: usuarioAtual.nome,
        usuarioTipo: usuarioAtual.tipo,
        acao: isEscolar ? 'In√≠cio de Per√≠odo Letivo da Classe' : 'Ativa√ß√£o de Turno de Atendimento Individual',
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1) + ' (IP M√≥vel)',
        detalhes: `Turno de cuidados iniciado automaticamente ao registrar: ${actionName}.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, auditLogs);
      setLgpdLogs(auditLogs);
    }
    return true;
  };

  // Simple quick actions helpers 
  const handleQuickHydrate = () => {
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Hidrata√ß√£o")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`‚ö†Ô∏è Opera√ß√£o N√£o Autorizada: Nenhum pai ou respons√°vel autorizou "Alimenta√ß√£o e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora n√£o pode registrar hidrata√ß√£o.`);
      return;
    }
    const defaultTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    if (!simulatedOnline) {
      // Offline queue it
      const offlineId = 'offline_hid_' + Date.now();
      adicionarItemFila({
        id_local: offlineId,
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_hid_' + Date.now(),
        tipo: 'hidratacao',
        titulo: `Copinho de √Ågua +${quickHydrationAmount}ml`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Bebeu ${quickHydrationAmount}ml (Registro Um-Toque)`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert(`Copinho de √°gua (+${quickHydrationAmount}ml) registrado off-line! Ser√° sincronizado quando reativar a rede.`);
      });
      return;
    }

    // Online path
    const todayIso = getTodayIso();
    const uniqueWaterId = `hid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const novoRegistro: RegistroHidratacao = {
      id: uniqueWaterId,
      idosoId: idoso.id,
      quantidadeMl: quickHydrationAmount,
      horario: defaultTime,
      data: todayIso,
      registradoPor: usuarioAtual.nome
    };

    const hids = getFromDB<RegistroHidratacao[]>('anjo_hidratacao', []);
    hids.push(novoRegistro);
    saveToDB('anjo_hidratacao', hids);

    const waterKey1 = `anjo_registro_agua_${idoso.id}`;
    const studentH1Logs = getFromDB<any[]>(waterKey1, []);
    studentH1Logs.push(novoRegistro);
    saveToDB(waterKey1, studentH1Logs);

    const waterKey2 = `anjo_hidratacao_${idoso.id}`;
    const studentH2Logs = getFromDB<any[]>(waterKey2, []);
    studentH2Logs.push(novoRegistro);
    saveToDB(waterKey2, studentH2Logs);

    // Update corresponding water tasks today if any
    const updated = tarefas.map(t => {
      if (t.tipo === 'hidratacao' && t.status !== 'concluido') {
        return {
          ...t,
          status: 'concluido' as const,
          concluidaEm: defaultTime,
          completadaPor: usuarioAtual.nome,
          observacao: `Oferecido copo r√°pido de ${quickHydrationAmount}ml.`
        };
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Hidrata√ß√£o Registrada', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Copo de √°gua (+${quickHydrationAmount}ml) oferecido com sucesso para ${idoso.nome} por ${usuarioAtual.nome}.`);
    alert(`Hidrata√ß√£o registrada com facilidade (+${quickHydrationAmount}ml)!`);

    // Dispatch global events to sync other screens (including Reports & dashboard & routine)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_hidratacao' } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_hidratacao' } }));
      window.dispatchEvent(new CustomEvent('db-routine-update'));
    }
  };

  const handleQuickMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Refei√ß√£o")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`‚ö†Ô∏è Opera√ß√£o N√£o Autorizada: Nenhum pai ou respons√°vel autorizou "Alimenta√ß√£o e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora n√£o pode registrar refei√ß√µes.`);
      return;
    }

    const defaultTime = getNowTimeBr();

    if (quickMeal.refeicao === 'mamadeira') {
      const check = checkBottleFeedingInterval(idoso.id, defaultTime, idoso.nome);
      if (!check.allowed) {
        registerBottleAttemptNotice(
          idoso.id,
          idoso.nome,
          check.lastHorario,
          check.nextAllowedHorario,
          defaultTime,
          usuarioAtual.nome
        );

        triggerWhatsAppSim(
          'üçº Comunicado: Mamadeira J√° Servida',
          `Anjinho Escolar: ${idoso.nome} j√° tomou mamadeira √†s ${check.lastHorario}. A tentativa de novo registro foi feita √†s ${defaultTime}. Por quest√µes de seguran√ßa alimentar e intervalo m√≠nimo de 2h, a pr√≥xima mamadeira estar√° liberada a partir das ${check.nextAllowedHorario}.`
        );

        alert(`${check.message}\n\nüì¢ Um comunicado oficial foi gerado no mural e enviado aos respons√°veis informando que a crian√ßa j√° tomou mamadeira recentemente.`);
        return;
      }
    } else {
      const mealsStoreCheck = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
      const alreadyExists = mealsStoreCheck.some(f => f.idosoId === idoso.id && f.refeicao === quickMeal.refeicao && isTodayOrDemoDate(f.data));
      if (alreadyExists) {
        const mealLabelMap: { [key: string]: string } = {
          mamadeira: 'üçº Mamadeira de Leite / F√≥rmula',
          cafe_manha: isEscolar ? 'ü•ê Lanchinho da Manh√£ / Caf√©' : '‚òï Caf√© da Manh√£',
          almoco: isEscolar ? 'üç≤ Papinha / Almocinho' : 'üçõ Almo√ßo',
          lanche: isEscolar ? 'üçé Frutinha / Lanchinho Tarde' : 'üçé Lanche da Tarde',
          jantar: isEscolar ? 'ü•£ Jantinha Escolar' : 'üç≤ Jantar',
          ceia: isEscolar ? 'ü•õ Ch√° ou Suco P√≥s-Soneca' : 'ü•õ Ceia / Repouso'
        };
        const label = mealLabelMap[quickMeal.refeicao] || quickMeal.refeicao;
        const confirmSave = window.confirm(`‚ö†Ô∏è Aten√ß√£o: Voc√™ j√° registrou a refei√ß√£o "${label}" para ${idoso.nome} hoje!\n\nDeseja realmente salvar um NOVO registro para essa mesma refei√ß√£o?`);
        if (!confirmSave) return;
      }
    }

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_meal_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_meal_' + Date.now(),
        tipo: 'alimentacao',
        titulo: `Refei√ß√£o: ${quickMeal.refeicao}`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Aceita√ß√£o: ${quickMeal.aceitacao}. Obs: ${quickMeal.observacao}`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert('Refei√ß√£o registrada offline com sucesso!');
        setQuickMeal({ refeicao: 'cafe_manha', aceitacao: 'muito_bem', observacao: '' });
      });
      return;
    }

    const mealsStore = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
    mealsStore.push({
      id: 'ali_' + Date.now(),
      idosoId: idoso.id,
      refeicao: quickMeal.refeicao as any,
      aceitacao: quickMeal.aceitacao as any,
      quantidadeMl: quickMeal.refeicao === 'mamadeira' ? (Number(quickMeal.quantidadeMl) || 180) : undefined,
      horario: defaultTime,
      data: getTodayIso(),
      observacoes: quickMeal.observacao,
      registradoPor: usuarioAtual.nome
    });
    saveToDB('anjo_alimentacao', mealsStore);

    // Sync tasks - vincula estritamente por palavra E hor√°rio do registro
    const labelMap: { [key: string]: string } = {
      mamadeira: 'Mamadeira',
      cafe_manha: 'Lanchinho da Manh√£ / Caf√©',
      almoco: 'Almo√ßo',
      lanche: 'Frutinha / Lanche',
      jantar: 'Jantar'
    };
    
    const matchedTask = findMatchingMealTask(tarefas, quickMeal.refeicao, defaultTime);
    let updated = tarefas;

    if (matchedTask) {
      updated = tarefas.map(t => {
        if (t.id === matchedTask.id) {
          return {
            ...t,
            status: 'concluido' as const,
            concluidaEm: defaultTime,
            completadaPor: usuarioAtual.nome,
            observacao: `Aceita√ß√£o: ${quickMeal.aceitacao === 'muito_bem' ? 'Comeu tudo' : quickMeal.aceitacao === 'pouco' ? 'Comeu pouco' : 'Recusou'}. ${quickMeal.observacao || ''}`
          };
        }
        return t;
      });
      setTarefas(updated);
      const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
      const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
      saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);
    }

    triggerWhatsAppSim('Refei√ß√£o Registrada', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: ${idoso.nome} realizou a refei√ß√£o ${labelMap[quickMeal.refeicao] || quickMeal.refeicao}. Grau de Aceita√ß√£o: ${quickMeal.aceitacao === 'muito_bem' ? (isEscolar ? 'Comeu/Tomou tudo' : 'Comeu muito bem') : 'Comeu pouco'}. Por: ${usuarioAtual.nome}`);
    alert('Refei√ß√£o registrada com sucesso via canal on-line!');
    setQuickMeal({ refeicao: 'cafe_manha', aceitacao: 'muito_bem', observacao: '' });

    // Dispatch global events to sync other screens (including Reports & dashboard)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
    }
  };

  const handleQuickHygieneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Higiene")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`‚ö†Ô∏è Opera√ß√£o N√£o Autorizada: Nenhum pai ou respons√°vel autorizou "Alimenta√ß√£o e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora n√£o pode registrar cuidados de higiene.`);
      return;
    }

    const alreadyCompleted = tarefas.some(t => t.tipo === 'banho' && t.status === 'concluido');
    if (alreadyCompleted) {
      const confirmSave = window.confirm(`‚ö†Ô∏è Aten√ß√£o: O registro de Higiene para ${idoso.nome} j√° foi marcado como conclu√≠do hoje!\n\nDeseja realmente salvar um NOVO registro de higiene?`);
      if (!confirmSave) return;
    }

    const defaultTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Save interactive hygiene log for dashboard / family view integration
    const hygieneLog = {
      bath: quickHygiene.hands || quickHygiene.bath,
      teeth: quickHygiene.teeth,
      clothes: quickHygiene.clothes,
      diaper: quickHygiene.diaper,
      hands: quickHygiene.hands || quickHygiene.bath,
      cream: quickHygiene.cream,
      banho: quickHygiene.hands || quickHygiene.bath,
      higieneBucal: quickHygiene.teeth,
      trocaRoupa: quickHygiene.clothes,
      trocaFralda: quickHygiene.diaper,
      pele: quickHygiene.cream,
      observations: quickHygiene.observations || '',
      obs: quickHygiene.observations || '',
      time: defaultTime,
      date: getTodayIso(),
      registradoPor: usuarioAtual.nome
    };
    saveToDB(`anjo_higiene_log_${idoso.id}`, hygieneLog);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
    }
    setVitalsUpdateTrigger(prev => prev + 1);

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_hyg_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_hyg_' + Date.now(),
        tipo: 'banho',
        titulo: 'Higiene & Bem Estar Cuidados',
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Banho: ${quickHygiene.bath ? 'Sim' : 'N√£o'}, Dentes: ${quickHygiene.teeth ? 'Sim' : 'N√£o'}, Roupa: ${quickHygiene.clothes ? 'Sim' : 'N√£o'}`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert('Controle de higiene e banho salvo de forma offline!');
      });
      return;
    }

    const updated = tarefas.map(t => {
      if (t.tipo === 'banho' && t.status !== 'concluido') {
        return {
          ...t,
          status: 'concluido' as const,
          concluidaEm: defaultTime,
          completadaPor: usuarioAtual.nome,
          observacao: `Higiene realizada em lote: Banho: ${quickHygiene.bath ? 'Sim' : 'N√£o'}. Troca de roupa: ${quickHygiene.clothes ? 'Sim' : 'N√£o'}.`
        };
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Cuidados de Higiene Conclu√≠dos', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Servi√ßos de Higiene e Conforto conclu√≠dos para ${idoso.nome} √†s ${defaultTime}: Banho/Fralda: ${quickHygiene.bath ? 'Sim' : 'N√£o'}, Troca de Roupa: ${quickHygiene.clothes ? 'Sim' : 'N√£o'}, Escova√ß√£o Bucal: ${quickHygiene.teeth ? 'Sim' : 'N√£o'}.`);
    alert('Higiene registrada com sucesso!');
  };

  const handleQuickHumorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Humor")) {
      return;
    }

    const defaultTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_humor_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_humor_' + Date.now(),
        tipo: 'outros',
        titulo: `Anota√ß√£o humor: ${quickHumor.estado}`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: quickHumor.observacao,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert('Humor registrado offline!');
      });
      return;
    }

    const humStore = getFromDB<RegistroHumor[]>('anjo_humor', []);
    const novoHumor: RegistroHumor = {
      id: 'hum_' + Date.now(),
      idosoId: idoso.id,
      data: getTodayIso(),
      horario: defaultTime,
      estado: quickHumor.estado as any,
      observacoes: quickHumor.observacao,
      registradoPor: usuarioAtual.nome
    };
    humStore.push(novoHumor);
    saveToDB('anjo_humor', humStore);
    saveToDB(`anjo_humor_${idoso.id}`, novoHumor);

    // Reactive event dispatches for real-time synchronization
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_humor' } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_humor' } }));
    setVitalsUpdateTrigger(prev => prev + 1);

    triggerWhatsAppSim('Humor Observado', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: ${isEscolar ? 'A educadora' : 'O cuidador'} ${usuarioAtual.nome} registrou que ${idoso.nome} encontra-se com o humor "${quickHumor.estado.toUpperCase()}". Observa√ß√µes: "${quickHumor.observacao || 'Nenhuma'}"`);
    showToast('Humor e estado comportamental salvos com sucesso!', 'success');
    setQuickHumor({ estado: 'calmo', observacao: '' });
  };

  const handleQuickVitalsSubmit = (e?: React.FormEvent | null, bypassDuplicateCheck?: boolean) => {
    if (e) e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presen√ßa ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift(isEscolar ? "Sa√∫de e Sono" : "Sinais Vitais")) {
      return;
    }
    const defaultTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!quickVitals.pressao && !quickVitals.glicemia && !quickVitals.temp && !quickVitals.sat && !quickVitals.peso && !quickVitals.fCard) {
      alert('Por favor, preencha pelo menos um sinal vital ou o peso para salvar!');
      return;
    }

    if (isEscolar && !bypassDuplicateCheck) {
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      const sonosStore = getFromDB<RegistroSono[]>('anjo_sono', []);
      const todayRecords = vitalsStore.filter(v => v.idosoId === idoso.id && isTodayOrDemoDate(v.data));
      
      const newSono = quickVitals.pressao || 'Sem registros';
      const newFralda = quickVitals.glicemia || 'Sem trocas';
      const newTemp = quickVitals.temp ? `${quickVitals.temp}¬∞C` : 'Normal / N√£o medida';

      // 1. Cross-module duplicate check for sleep (Sono/Soneca) between Di√°rio da Inf√¢ncia and Frequ√™ncia
      const timeMatch = newSono.match(/(\d{1,2}:\d{2})\s*(?:√†s|as|-|at√©)\s*(\d{1,2}:\d{2})/i) || 
                        (sleepStart && sleepEnd && newSono.toLowerCase().includes('dormiu') ? [null, sleepStart, sleepEnd] : null);

      let isDuplicateSleepWithSono = false;
      let isDuplicateSleepWithSinais = false;

      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const startStr = timeMatch[1].padStart(5, '0');
        const endStr = timeMatch[2].padStart(5, '0');
        const startShort = startStr.replace(/^0/, '');
        const endShort = endStr.replace(/^0/, '');

        // Check against Frequ√™ncia (anjo_sono)
        isDuplicateSleepWithSono = sonosStore.some(s => {
          if (s.idosoId !== idoso.id || !isTodayOrDemoDate(s.data)) return false;
          const sStart = (s.dormiuEm || '').trim();
          const sEnd = (s.acordouEm || '').trim();
          return (sStart === startStr && sEnd === endStr) ||
                 (sStart.replace(/^0/, '') === startShort && sEnd.replace(/^0/, '') === endShort);
        });

        // Check against Di√°rio da Inf√¢ncia (anjo_sinais)
        isDuplicateSleepWithSinais = vitalsStore.some(v => {
          if (v.idosoId !== idoso.id || !isTodayOrDemoDate(v.data)) return false;
          const old = (v.soneca || v.pressaoArterial || '').toLowerCase();
          if (!old || old === 'sem registros' || old === 'n√£o dormiu / sesta') return false;
          return (old.includes(startStr) || old.includes(startShort)) && (old.includes(endStr) || old.includes(endShort));
        });
      }

      if (isDuplicateSleepWithSono || isDuplicateSleepWithSinais) {
        const sourceName = isDuplicateSleepWithSono ? 'Frequ√™ncia (Rotina)' : 'Di√°rio da Inf√¢ncia';
        alert(`‚ö†Ô∏è Registro Duplicado Bloqueado: J√° existe um registro de soneca/sono para ${idoso.nome} no mesmo hor√°rio (${timeMatch ? `${timeMatch[1]} √†s ${timeMatch[2]}` : newSono}) lan√ßado hoje no ${sourceName}!\n\nN√£o √© permitido salvar mensagens/registros duplicados para el mesmo hor√°rio.`);
        return;
      }

      if (todayRecords.length > 0) {
        const lastRecord = todayRecords[todayRecords.length - 1];
        const oldSono = lastRecord.soneca || 'Sem registros';
        const oldFralda = lastRecord.fralda || 'Sem trocas';
        const oldTemp = lastRecord.temperatura ? `${lastRecord.temperatura}¬∞C` : 'N√£o medida';
        
        const isIdentical = (newSono === oldSono) && 
                            (newFralda === oldFralda) &&
                            ((Number(quickVitals.temp) || 36.5) === lastRecord.temperatura);
        
        if (isIdentical) {
          alert(`‚ö†Ô∏è Registro Id√™ntico Bloqueado: Voc√™ j√° salvou exatamente essas informa√ß√µes no Di√°rio da Inf√¢ncia para ${idoso.nome} hoje!\n\nN√£o √© permitido enviar duas mensagens id√™nticas.`);
          return;
        }

        setDuplicateWarning({
          show: true,
          studentName: idoso.nome,
          existingInfo: `Sono: ${oldSono} | Fralda: ${oldFralda} | Temp: ${oldTemp}`,
          newInfo: `Sono: ${newSono} | Fralda: ${newFralda} | Temp: ${newTemp}`,
          isIdentical,
          onConfirm: () => {
            setDuplicateWarning(null);
            handleQuickVitalsSubmit(null, true);
          }
        });
        return;
      }
    }

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_vitals_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_vitals_' + Date.now(),
        tipo: 'sinal_vital',
        titulo: isEscolar ? 'Sa√∫de, Sono & Fralda do Aluno' : 'Sinais Vitais e Peso',
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: isEscolar
          ? `Sono: ${quickVitals.pressao || 'Sem registros'}, Fralda: ${quickVitals.glicemia || 'Sem registros'}, Temp: ${quickVitals.temp || 'Sem Temp'}¬∞C, √Ågua/Copos: ${quickVitals.fCard || '0'}, Sat: ${quickVitals.sat || 'Normal'} copos, Peso: ${quickVitals.peso || 'Sem Peso'} kg.`
          : `Aferido PA: ${quickVitals.pressao || 'Sem PA'}, Glicemia: ${quickVitals.glicemia || 'Sem Glicemia'} mg/dL, Sat: ${quickVitals.sat || 'Sem O2'}%, Temp: ${quickVitals.temp || 'Sem Temp'}¬∞C, FC: ${quickVitals.fCard || 'Sem FC'} bpm, Peso: ${quickVitals.peso || 'Sem Peso'} kg.`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert(isEscolar ? 'Rotina escolar e sa√∫de registradas offline!' : 'Sinais vitais e Peso registrados offline com sucesso!');
        setQuickVitals({ pressao: '', glicemia: '', temp: '', fCard: '', sat: '', peso: '', obs: '' });
      });
      return;
    }

    const todayIso = getTodayIso();
    const rawWeight = quickVitals.peso ? String(quickVitals.peso).replace(',', '.').trim() : '';
    const parsedWeight = rawWeight ? parseFloat(rawWeight) : undefined;
    const finalWeight = (parsedWeight && !isNaN(parsedWeight) && parsedWeight > 0) ? parsedWeight : undefined;

    const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
    const novoSinal: SinalVital = {
      id: 'sin_' + Date.now(),
      idosoId: idoso.id,
      pressaoArterial: isEscolar ? (quickVitals.pressao || 'Sem registros') : (quickVitals.pressao || '120/80'),
      glicemia: isEscolar ? 0 : (Number(String(quickVitals.glicemia).replace(',', '.')) || 100),
      tipoGlicemia: isEscolar ? undefined : 'casual',
      temperatura: Number(String(quickVitals.temp).replace(',', '.')) || 36.5,
      frequenciaCardiaca: isEscolar ? (parseFloat(String(quickVitals.fCard || quickVitals.sat).replace(/[^\d.,]/g, '').replace(',', '.')) || 0) : (Number(String(quickVitals.fCard).replace(',', '.')) || 75),
      saturacao: isEscolar ? (Number(String(quickVitals.sat).replace(',', '.')) || 0) : (Number(String(quickVitals.sat).replace(',', '.')) || 98),
      peso: finalWeight,
      data: todayIso,
      horario: defaultTime,
      registradoPor: usuarioAtual.nome,
      observacoes: quickVitals.obs || '',
      fralda: isEscolar ? (quickVitals.glicemia || 'Sem trocas') : undefined,
      soneca: isEscolar ? (quickVitals.pressao || 'Sem registros') : undefined
    };
    vitalsStore.push(novoSinal);
    saveToDB('anjo_sinais', vitalsStore);

    // Update weight on student/elder record if weight provided
    if (finalWeight) {
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      const updatedSeniors = allSeniors.map(s => s.id === idoso.id ? { ...s, peso: finalWeight } : s);
      saveToDB('anjo_idosos', updatedSeniors);
      if (idoso) idoso.peso = finalWeight;
    }

    // Process hydration / water cups for senior mode
    if (!isEscolar) {
      const valCupsOrMl = quickVitals.fCard;
      if (valCupsOrMl && valCupsOrMl !== '0') {
        const cleanedNum = parseFloat(String(valCupsOrMl).replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(cleanedNum) && cleanedNum > 0) {
          const mlAdded = cleanedNum < 20 ? cleanedNum * 200 : cleanedNum;
          const allHids = getFromDB<RegistroHidratacao[]>('anjo_hidratacao', []);
          allHids.push({
            id: 'hid_' + Date.now(),
            idosoId: idoso.id,
            quantidadeMl: mlAdded,
            horario: defaultTime,
            data: todayIso,
            registradoPor: usuarioAtual.nome
          });
          saveToDB('anjo_hidratacao', allHids);

          // Sync hydration task
          const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
          const updatedTasks = allTasks.map(t => {
            if (t.idosoId === idoso.id && t.tipo === 'hidratacao') {
              return {
                ...t,
                status: 'concluido' as const,
                concluidaEm: defaultTime,
                completadaPor: usuarioAtual.nome,
                observacao: `Copos de √°gua registrados: ${valCupsOrMl} (${mlAdded}ml total).`
              };
            }
            return t;
          });
          saveToDB('anjo_tarefas_diarias', updatedTasks);
        }
      }
    }

    if ((isEscolar || quickVitals.pressao) && quickVitals.pressao && quickVitals.pressao !== 'Sem registros') {
      const timeMatch = quickVitals.pressao.match(/(\d{1,2}(?::\d{2}|h\d{0,2}))\s*(?:√†s|as|-|at√©)\s*(\d{1,2}(?::\d{2}|h\d{0,2}))/i);
      const extractedStart = timeMatch ? timeMatch[1] : (sleepStart || '13:00');
      const extractedEnd = timeMatch ? timeMatch[2] : (sleepEnd || '14:30');

      const sonos = getFromDB<any[]>('anjo_sono', []);
      sonos.push({
        id: 'sono_' + Date.now(),
        idosoId: idoso.id,
        dormiuEm: extractedStart,
        acordouEm: extractedEnd,
        horasTotais: 1.5,
        qualidade: 'boa',
        data: todayIso,
        observacoes: quickVitals.pressao,
        registradoPor: usuarioAtual.nome
      });
      saveToDB('anjo_sono', sonos);
    }

    if (isEscolar && (quickVitals.glicemia || quickVitals.obs)) {
      const existingHyg = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, null);
      const updatedHyg = {
        ...(existingHyg || {}),
        diaper: true,
        trocaFralda: true,
        time: defaultTime,
        observations: quickVitals.obs || quickVitals.glicemia || existingHyg?.observations || '',
        obs: quickVitals.obs || quickVitals.glicemia || existingHyg?.obs || '',
        registradoPor: usuarioAtual.nome
      };
      saveToDB(`anjo_higiene_log_${idoso.id}`, updatedHyg);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_sinais' } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_sinais' } }));
    }
    setVitalsUpdateTrigger(prev => prev + 1);

    // Save WhatsApp notification log
    const whatsMsg = isFundamental
      ? `Anjinho Fundamental: Relat√≥rio de Acompanhamento Escolar aferido para o(a) aluno(a) ${idoso.nome} pela Prof¬™ ${usuarioAtual.nome}:
‚Ä¢ Dever de Casa / Li√ß√£o: ${quickVitals.pressao || 'Sem tarefas registradas'}
‚Ä¢ Foco / Comportamento: ${quickVitals.glicemia || 'Focado e excelente comportamento'}
‚Ä¢ Temperatura: ${quickVitals.temp ? `${quickVitals.temp}¬∞C` : 'Normal / N√£o medida'}
‚Ä¢ Material / Cadernos: ${quickVitals.sat || 'Cadernos e estojo completos'}
‚Ä¢ Hidrata√ß√£o / Garrafinha: ${quickVitals.fCard ? `${quickVitals.fCard} copos` : 'Normal'}
‚Ä¢ Peso: ${quickVitals.peso ? `${quickVitals.peso} kg` : 'N√£o aferido'}`
      : isEscolar
        ? `Anjinho Escolar: Relat√≥rio de Sa√∫de aferido para o(a) aluno(a) ${idoso.nome} pela Prof¬™ ${usuarioAtual.nome}:
‚Ä¢ Per√≠odo de Sono: ${quickVitals.pressao || 'N√£o dormiu / N√£o se aplica'}
‚Ä¢ Fralda (Xixi/Coc√¥): ${quickVitals.glicemia || 'Verificada e sem assaduras'}
‚Ä¢ Temperatura: ${quickVitals.temp ? `${quickVitals.temp}¬∞C` : 'Normal / N√£o medida'}
‚Ä¢ üçº Mamadeiras: ${quickVitals.sat ? `${quickVitals.sat} mamadeira(s)` : 'Nenhuma no momento'}
‚Ä¢ üíß Copos d'√Ågua: ${quickVitals.fCard ? `${quickVitals.fCard} copo(s)` : 'Normal'}
‚Ä¢ Peso: ${quickVitals.peso ? `${quickVitals.peso} kg` : 'N√£o aferido'}`
        : `Anjo Cuidador: Sinais vitais aferidos para ${idoso.nome} por ${usuarioAtual.nome}:
‚Ä¢ Press√£o: ${novoSinal.pressaoArterial} mmHg
‚Ä¢ Glicemia: ${novoSinal.glicemia} mg/dL
‚Ä¢ Temp: ${novoSinal.temperatura}¬∞C
‚Ä¢ Sat. O2: ${novoSinal.saturacao}%
‚Ä¢ Freq. Card√≠aca: ${novoSinal.frequenciaCardiaca} bpm
‚Ä¢ Peso: ${novoSinal.peso ? `${novoSinal.peso} kg` : 'N√£o aferido'}`;

    triggerWhatsAppSim(isEscolar ? 'Sa√∫de e Sono do Aluno Registrados' : 'Sinais Vitais e Peso Registrados', whatsMsg);
    alert(isEscolar ? 'Situa√ß√£o de sa√∫de e rotina do aluno registradas com sucesso!' : 'Sinais vitais e controle de Peso registrados com sucesso!');
    setQuickVitals({ pressao: '', glicemia: '', temp: '', fCard: '', sat: '', peso: '', obs: '' });
    
    // Refresh page state triggers
    if (typeof window !== 'undefined') {
      const ev = new CustomEvent('db-vitals-update');
      window.dispatchEvent(ev);
    }
  };

  const handleManualSyncLaunch = () => {
    handleSyncOfflineData();
  };

  const handleLgpdAcceptComplete = () => {
    setLgpdAccepted(true);
    if (usuarioAtual?.id) {
      localStorage.setItem(`anjo_lgpd_accepted_${usuarioAtual.id}`, 'true');
    }
    localStorage.setItem('anjo_lgpd_accepted', 'true');
    
    // Save a concrete, structured consent record for administration trace
    try {
      const existingConsents = JSON.parse(localStorage.getItem('anjo_lgpd_consents') || '[]');
      const newConsent = {
        id: 'consent_' + Date.now(),
        usuarioId: usuarioAtual?.id || 'usr_unknown',
        usuarioNome: usuarioAtual?.nome || 'Usu√°rio Desconhecido',
        usuarioEmail: usuarioAtual?.email || 'Sem e-mail',
        usuarioTelefone: usuarioAtual?.telefone || 'Sem telefone',
        usuarioTipo: usuarioAtual?.tipo || 'familiar',
        idosoNome: idoso?.nome || 'Paciente n√£o especificado',
        dataConsentimento: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        modoApp: appMode === 'escolar_infantil' ? 'üß∏ Anjinho Escolar' : 'üëµ Anjo Cuidador',
        deviceFingerprint: `IP 177.104.${Math.floor(Math.random() * 200 + 40)}.${Math.floor(Math.random() * 254)} (HTTPS Secured - Chrome Mobile)`,
        statusFinanceiro: localStorage.getItem(`anjo_sub_status_${idoso.id}`) || 'pago'
      };
      
      localStorage.setItem('anjo_lgpd_consents', JSON.stringify([newConsent, ...existingConsents]));
      
      // Notify other components (like the new Admin panel etc)
      window.dispatchEvent(new Event('anjo_user_updated'));
    } catch (e) {
      console.warn('Fallback saving consent logs:', e);
    }
  };

  // Compile compliance rate & governance metrics comprehensively across all 6 routine pillars
  const teacherClassroom = getStudentClassName(idoso) || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Maternal I - A');

  const studentTasks = tarefas.filter(t => t.idosoId === idoso.id);
  const completedTasksCount = studentTasks.filter(t => t.status === 'concluido').length;
  const refusedTasksCount = studentTasks.filter(t => t.status === 'recusado').length;
  const totalTasksCount = studentTasks.length;

  // Compile water intake of today using unified helper
  const todaysWaterList = getTodayHydrationRecords(idoso.id);
  const totalWaterMl = todaysWaterList.reduce((acc, curr) => acc + (Number(curr.quantidadeMl) || 0), 0);

  // Compile today's food acceptance state combining global and student-specific stores
  const globalMeals = getFromDB<any[]>('anjo_alimentacao', []);
  const studentMeals = getFromDB<any[]>(`anjo_alimentacao_${idoso.id}`, []);
  const mealsMap = new Map<string, RegistroAlimentacao>();
  [...globalMeals, ...studentMeals].forEach((item, idx) => {
    if (!item) return;
    const itemStudentId = item.idosoId || idoso.id;
    if (itemStudentId !== idoso.id) return;
    if (!isTodayOrDemoDate(item.data)) return;
    const id = item.id || `meal_${idx}_${Date.now()}`;
    if (!mealsMap.has(id)) {
      mealsMap.set(id, {
        id,
        idosoId: idoso.id,
        refeicao: (item.refeicao || 'cafe_manha') as any,
        aceitacao: (item.aceitacao || 'muito_bem') as any,
        horario: item.horario || '10:00',
        data: item.data || getTodayIso(),
        observacoes: item.observacoes || item.observacao || '',
        quantidadeMl: Number(item.quantidadeMl || item.ml || item.quantidade) || (item.refeicao === 'mamadeira' ? 180 : undefined),
        registradoPor: item.registradoPor || 'Equipe Escolar'
      });
    }
  });
  const todaysMealsList = Array.from(mealsMap.values());
  const studentBottlesToday = todaysMealsList.filter(m => {
    if (!m || !m.refeicao) return false;
    const ref = String(m.refeicao).toLowerCase();
    return ref === 'mamadeira' || ref.includes('mamad') || (m.observacoes && m.observacoes.toLowerCase().includes('mamadeira'));
  });
  const totalBottlesMl = studentBottlesToday.reduce((acc, curr) => acc + (Number(curr.quantidadeMl) || 180), 0);

  // Core routine checkpoints for governance metrics score
  const allVitalsList = getFromDB<SinalVital[]>('anjo_sinais', []).filter(s => s.idosoId === idoso.id);
  const latestVitals = allVitalsList.length > 0 ? allVitalsList[allVitalsList.length - 1] : null;

  const allSonoList = getFromDB<any[]>('anjo_sono', []).filter(s => s.idosoId === idoso.id);
  const latestSono = allSonoList.length > 0 ? allSonoList[allSonoList.length - 1] : null;

  const rawHygiene = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, null);
  const todayHygieneLog = rawHygiene ? {
    bath: Boolean(rawHygiene.bath ?? rawHygiene.banho),
    teeth: Boolean(rawHygiene.teeth ?? rawHygiene.higieneBucal),
    clothes: Boolean(rawHygiene.clothes ?? rawHygiene.trocaRoupa),
    diaper: Boolean(rawHygiene.diaper ?? rawHygiene.trocaFralda),
    hands: Boolean(rawHygiene.hands ?? rawHygiene.banho ?? rawHygiene.bath),
    cream: Boolean(rawHygiene.cream ?? rawHygiene.pele),
    time: rawHygiene.time || '',
    observations: rawHygiene.observations || rawHygiene.obs || ''
  } : {
    bath: false,
    teeth: false,
    clothes: false,
    diaper: false,
    hands: false,
    cream: false,
    time: '',
    observations: ''
  };

  // Filter real vitals logged today in this active period (excluding baseline placeholder entries)
  const realVitalsToday = allVitalsList.filter(v => 
    !v.id?.startsWith('sin_base_') && 
    !v.observacoes?.includes('Registro do dia anterior preservado')
  );

  const hasVitalsToday = realVitalsToday.length > 0;
  const hasSleepToday = (allSonoList.length > 0) || Boolean(latestVitals?.soneca && latestVitals.soneca !== 'Sem registros' && !latestVitals.id?.startsWith('sin_base_'));
  const hasDiaperToday = Boolean(todayHygieneLog?.diaper) || Boolean(latestVitals?.fralda && latestVitals.fralda !== 'Sem trocas' && !latestVitals.id?.startsWith('sin_base_'));
  const hasNutritionToday = todaysMealsList.length > 0 || todaysWaterList.length > 0;

  const totalCheckpoints = totalTasksCount + 4;
  const completedCheckpoints = completedTasksCount + 
    (hasVitalsToday ? 1 : 0) + 
    (hasSleepToday ? 1 : 0) + 
    (hasDiaperToday ? 1 : 0) + 
    (hasNutritionToday ? 1 : 0);

  const complianceRate = totalCheckpoints > 0 
    ? Math.min(100, Math.round((completedCheckpoints / totalCheckpoints) * 100)) 
    : 0;
  const qualityRate = totalCheckpoints > 0 
    ? Math.min(100, Math.round(((completedCheckpoints + refusedTasksCount) / totalCheckpoints) * 100)) 
    : 0;
  const sleepSummary = (latestVitals?.soneca && latestVitals.soneca !== 'Sem registros')
    ? latestVitals.soneca 
    : (latestSono 
        ? (latestSono.observacoes && latestSono.observacoes.length > 0 
            ? latestSono.observacoes 
            : (latestSono.dormiuEm && latestSono.acordouEm ? `Dormiu das ${latestSono.dormiuEm} √†s ${latestSono.acordouEm}` : 'Soneca registrada'))
        : (latestVitals?.pressaoArterial && (latestVitals.pressaoArterial.includes(':') || latestVitals.pressaoArterial.toLowerCase().includes('dormiu') || latestVitals.pressaoArterial.toLowerCase().includes('soneca')) ? latestVitals.pressaoArterial : null));

  const weightedVitals = allVitalsList.filter(s => s.peso && s.peso > 0);
  const latestWeight = weightedVitals.length > 0 ? weightedVitals[weightedVitals.length - 1].peso : (idoso?.peso && idoso.peso > 0 ? idoso.peso : null);
  const previousWeight = weightedVitals.length >= 2 ? weightedVitals[weightedVitals.length - 2].peso : null;
  const weightDiff = (latestWeight && previousWeight) ? latestWeight - previousWeight : 0;

  // Compile today's timeline 
  const timelineItems = [...tarefas]
    .filter(t => t.status === 'concluido')
    .map(t => ({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      horario: t.concluidaEm || t.horarioPrevisto,
      nota: t.observacao,
      autor: t.completadaPor || 'Sistema',
      meta: t.detalhes
    }));

  const currentModeStr = appMode === 'escolar_infantil' ? 'escolar_infantil' : 'idoso';
  const instName = localStorage.getItem(`anjo_brand_name_${currentModeStr}`) || (isEscolar ? 'Col√©gio Pequeno Anjo' : 'Cl√≠nica Recanto Feliz');
  const instLogo = localStorage.getItem(`anjo_brand_logo_${currentModeStr}`) || '';
  const instSlogan = localStorage.getItem(`anjo_brand_slogan_${currentModeStr}`) || '';

  const getMyChildren = (): Idoso[] => {
    if (!usuarioAtual || usuarioAtual.tipo !== 'familiar') return [];
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const cleanUserPhone = usuarioAtual.telefone ? usuarioAtual.telefone.replace(/\D/g, '') : '';
    
    return allSeniors.filter(s => {
      const isStudent = s.id.startsWith('aluno_');
      const isStudentFun = s.id.startsWith('aluno_fun_');
      if (isEscolar) {
        if (!isStudent) return false;
        if (appMode === 'escolar_fundamental' && !isStudentFun) return false;
        if (appMode === 'escolar_infantil' && isStudentFun) return false;
      } else {
        if (isStudent) return false;
      }

      if (!s.contatoEmergencia) return false;
      const cleanContactPhone = s.contatoEmergencia.telefone ? s.contatoEmergencia.telefone.replace(/\D/g, '') : '';
      
      const phoneMatches = cleanUserPhone && cleanContactPhone && cleanUserPhone === cleanContactPhone;
      const nameMatches = s.contatoEmergencia.nome && usuarioAtual.nome && 
        (usuarioAtual.nome.toLowerCase().trim().includes(s.contatoEmergencia.nome.toLowerCase().trim()) ||
         s.contatoEmergencia.nome.toLowerCase().trim().includes(usuarioAtual.nome.toLowerCase().trim()));
        
      return phoneMatches || nameMatches;
    });
  };

  const myChildren = getMyChildren();

  return (
    <div className="space-y-6">
      
      {/* üë∂ SELETOR DE FILHOS MATRICULADOS (Para Pais com m√∫ltiplos filhos) */}
      {usuarioAtual?.tipo === 'familiar' && myChildren.length > 1 && (
        <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-800 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md tracking-wider">
                üë®‚Äçüë©‚Äçüëß‚Äçüë¶ Seus Filhos Matriculados
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight pt-1">
                Boletins de Acompanhamento Familiar
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Voc√™ possui <strong className="text-slate-700 dark:text-slate-300">{myChildren.length} assistidos</strong> registrados com o telefone <strong className="text-indigo-600">{usuarioAtual.telefone}</strong>. Selecione qual deseja monitorar:
              </p>
            </div>
            
            {/* Child switching pills */}
            <div className="flex flex-wrap gap-2.5">
              {myChildren.map((child) => {
                const isActive = idoso?.id === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => onSwitchIdoso && onSwitchIdoso(child.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-700 scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-750 dark:text-slate-200 border border-slate-200'
                    }`}
                  >
                    <img
                      src={child.foto || 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150'}
                      alt={child.nome}
                      className="w-5 h-5 rounded-full object-cover border border-white/50"
                    />
                    <span>{child.nome.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* üè´ INSTITUTION SPONSOR & LOGO BRANDING BANNER (FIRST TAB ACCESSIBILITY) */}
      <div className={`p-4 rounded-3xl border text-left flex items-center justify-between gap-4 shadow-xs relative overflow-hidden ${
        accessibilitySettings?.darkMode 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : isEscolar 
            ? 'bg-gradient-to-r from-indigo-50/20 to-teal-50/20 border-slate-200' 
            : 'bg-gradient-to-r from-amber-50/20 to-orange-50/20 border-slate-200'
      }`} id="dashboard-sponsor-branding-banner">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-1.5 shadow-xs shrink-0 overflow-hidden">
            {instLogo ? (
              <img src={instLogo} alt={instName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl">{isEscolar ? 'üè´' : 'üëµ'}</span>
            )}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
              ‚≠ê Institui√ß√£o Credenciada & Patrocinadora
            </span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight leading-none">
              {instName}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-snug">
              {instSlogan || (isEscolar ? 'Onde a inf√¢ncia √© registrada para sempre ‚Äî Transpar√™ncia e seguran√ßa di√°ria.' : 'Acompanhamento S√™nior Inteligente ‚Äî Cuidado e transpar√™ncia em tempo real.')}
            </p>
          </div>
        </div>

        {/* Small professional certification tag */}
        <div className="hidden sm:flex flex-col items-end text-right shrink-0">
          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            Parceiro Oficial
          </span>
          <span className="text-[8px] text-slate-400 font-bold mt-1">Selo de Qualidade Digital</span>
        </div>
      </div>

      {/* üîç BUSCA R√ÅPIDA DE ALUNO POR NOME */}
      {onSwitchIdoso && (
        <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left min-w-0">
              <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md tracking-wider">
                ‚ö° Busca Direta por Nome
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>üîç</span> Busca R√°pida de {isEscolar ? 'Alunos & Crian√ßas' : 'Assistidos'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Digite o nome de qualquer {isEscolar ? 'aluno, turma ou respons√°vel' : 'assistido'} para alternar o di√°rio e boletim em 1 clique:
              </p>
            </div>

            <div className="w-full md:max-w-md shrink-0">
              <QuickStudentSearch
                activeIdoso={idoso}
                onSwitchIdoso={onSwitchIdoso}
                appMode={appMode}
                usuarioAtual={usuarioAtual}
                compact={false}
                darkMode={accessibilitySettings?.darkMode}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      )}

      {/* üè´ CENTRAL DE SALAS E PROFESSORAS - SELETOR R√ÅPIDO PARA SIMULA√á√ÉO */}
      {appMode === 'escolar_infantil' && usuarioAtual?.tipo !== 'familiar' && (
        <div className={`p-5 rounded-3xl border transition-all shadow-md ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-800/80 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/60 pb-3 mb-4">
            <div className="space-y-1 text-left">
              <h3 className="text-sm font-black flex items-center gap-2">
                <span>üè´</span> Central de Salas & Professoras <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Ambiente de Testes</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Mude de sala e professora com 1 clique. O painel se adaptar√° por completo para carregar as informa√ß√µes e di√°rios da sala selecionada.
              </p>
            </div>
            {usuarioAtual && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100/80 px-3 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
                <span className="text-[10px] text-indigo-800 font-extrabold uppercase">Professora Ativa:</span>
                <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1">
                  üë©‚Äçüè´ {usuarioAtual.nome.replace(' (Educadora)', '')} 
                  <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-md font-extrabold">{usuarioAtual.salaAula}</span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
            {classrooms
              .filter(room => {
                if (!usuarioAtual) return true;
                // Directors/Admins/Coordinators see ALL classrooms
                if (isDirectorOrAdminUser(usuarioAtual)) return true;

                // Teachers see ONLY their assigned classroom(s)
                if (!usuarioAtual.salaAula || usuarioAtual.salaAula === 'Todas') return true;
                const userClassrooms = usuarioAtual.salaAula.split(',').map(r => r.trim().toLowerCase());
                const rNameLower = room.name.toLowerCase().trim();
                return userClassrooms.some(userRoom => 
                  rNameLower === userRoom || 
                  rNameLower.startsWith(userRoom) || 
                  userRoom.startsWith(rNameLower) ||
                  rNameLower.includes(userRoom)
                );
              })
              .map((room) => {
                const isSelected = usuarioAtual && (
                  usuarioAtual.salaAula === room.name || 
                  (usuarioAtual.salaAula && usuarioAtual.salaAula.split(',').some(userRoom => room.name === userRoom || room.name.startsWith(userRoom) || userRoom.startsWith(room.name)))
                );
              const assignedTeacher = getAssignedTeacherForRoom(room.name, usuarioAtual);
              const teacherName = assignedTeacher ? assignedTeacher.nome.replace(/\s*\([^)]*\)/g, '').trim() : 'Sem Educadora';
              const allStudentsList = getFromDB<Idoso[]>('anjo_idosos', []);
              const activeStudentsInClass = allStudentsList.filter(s => s.id.startsWith('aluno_') && isStudentInRoom(s, room.name)).length;

              return (
                <button
                  key={room.id}
                  onClick={() => handleSwitchClassroom(room.name)}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer relative group ${
                    isSelected 
                      ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950 shadow-sm font-bold' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-indigo-200 text-slate-700'
                  }`}
                >
                  <span className="text-xl shrink-0 p-1.5 bg-white rounded-xl shadow-3xs">{room.emoji}</span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-900 transition-colors truncate">{room.name}</h4>
                      <span className="text-[9px] font-black text-slate-400 shrink-0 bg-slate-100 px-1 py-0.2 rounded">{room.ageGroup}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-extrabold truncate">üë©‚Äçüè´ {teacherName}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-0.5">
                      <span>üë∂ {activeStudentsInClass} Aluno{activeStudentsInClass !== 1 ? 's' : ''}</span>
                      <span>Cap: {room.capacity || 15}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Dynamic simulation helper banner for easy switching */}
      <div className={`p-5 rounded-3xl border transition-all shadow-md ${
        accessibilitySettings?.darkMode
          ? 'bg-slate-800/80 border-slate-700 text-slate-100'
          : appMode === 'escolar_infantil'
            ? 'bg-linear-to-r from-teal-50 to-indigo-50 border-indigo-200 text-slate-800' 
            : 'bg-linear-to-r from-amber-50 to-orange-50 border-amber-200 text-slate-800'
      }`}>
      {/* Dynamic simulation helper banner content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 text-left">
            {appMode === 'escolar_infantil' ? (
              <div className="w-16 h-16 rounded-2xl bg-white border border-indigo-100 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <img src="/logo.png?v=15" alt="Anjinho Logo" className="w-full h-full object-contain transform scale-[1.45]" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <span className="text-3xl shrink-0">üëµ</span>
            )}
            <div className="space-y-1">
              <h3 className={`text-sm font-extrabold ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-850'}`}>
                {appMode === 'escolar_infantil'
                  ? 'Modo Agenda Escolar Infantil Ativo (Maternal & Creche)!'
                  : 'Acompanhamento S√™nior Inteligente Ativo!'}
              </h3>
              <p className={`text-xs leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {appMode === 'escolar_infantil'
                  ? 'Voc√™ est√° simulando o aplicativo voltado para creches e ber√ß√°rios. As abas do Di√°rio foram configuradas para o bem-estar l√∫dico, higiene e rotina da primeira inf√¢ncia:'
                  : 'Nossa tecnologia de cuidado integrado oferece duas vers√µes super otimizadas: Anjo Cuidador (Acompanhamento S√™nior) e Anjinho Escolar (Educa√ß√£o Infantil). Conhe√ßa as abas correspondentes:'}
              </p>

              {/* Bullet list of adjusted tabs for transparency */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {appMode === 'escolar_infantil' ? (
                  <>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">‚òï Papa & Mamadeira</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">üöø Trocas & Higiene</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">üíß Copos de √Ågua</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">üåô Sono / Soneca</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">üòä Humor & Social</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">üìà Atividade Pedag√≥gica</div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">‚òï Alimenta√ß√£o</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">üöø Banho e Higiene</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">üíß Hidrata√ß√£o</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">üåô Di√°rio de Sono</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">üòä Humor/Comportamento</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">üìà Exerc√≠cios/Atividades</div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {onToggleAppMode && (
            <button
              onClick={onToggleAppMode}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                appMode === 'escolar_infantil'
                  ? 'bg-indigo-650 hover:bg-indigo-750 text-white border-indigo-600'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-900 border-amber-400'
              }`}
            >
              {appMode !== 'idoso' ? 'üîÑ Ativar Modo Idoso (Lar)' : isApresentacao ? '‚ú® Ativar Agenda Escolar' : '‚ú® Ativar Agenda Escolar (Simular)'}
            </button>
          )}
        </div>
      </div>

      {/* Perspective / Mode Toggle Switch (Visually stunning toggle banner) */}
      {usuarioAtual?.tipo !== 'familiar' && usuarioAtual?.tipo !== 'admin' && (
        <div className="bg-white rounded-2xl border border-[#cbd5e1] p-1.5 shadow-sm max-w-sm mx-auto flex items-center justify-between">
          <button
            onClick={() => handleSetVisualMode('cuidador')}
            className={`flex-1 text-center py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              visualMode === 'cuidador' 
                ? 'bg-serene-blue text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isEscolar ? 'üë©‚Äçüè´ Painel da Professora' : 'üßë‚Äç‚öïÔ∏è Painel do Cuidador'}
          </button>
          <button
            onClick={() => handleSetVisualMode('familia')}
            className={`flex-1 text-center py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              visualMode === 'familia' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isEscolar ? 'üåø Portal de Tranquilidade' : 'üåø Portal de Tranquilidade'}
          </button>
        </div>
      )}

      {/* Dynamic connection indicator with optional simulation details */}
      <div className="bg-slate-50 border border-[#cbd5e1] p-3 rounded-2xl flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${simulatedOnline ? 'animate-ping bg-emerald-400' : 'animate-bounce bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${simulatedOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-700">
              Dispositivo {simulatedOnline ? 'Conectado √† Nuvem (Servidor)' : 'Operando em Fila Local (IndexedDB)'}
            </span>
            {filaOffline.length > 0 && (
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                ‚ö° {filaOffline.length} Registro(s) Pendente(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {filaOffline.length > 0 && simulatedOnline && (
              <button
                onClick={handleManualSyncLaunch}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" /> Sincronizar Agora
              </button>
            )}
            {!isApresentacao && (
              <button
                onClick={() => setShowSimulationTools(!showSimulationTools)}
                className="text-[10px] font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest bg-slate-200/60 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 select-none"
              >
                üõ†Ô∏è {showSimulationTools ? 'Ocultar Simulador' : 'Simular Redes / Testes'}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Simulation Panel for testing environments */}
        {!isApresentacao && showSimulationTools && (
          <div className="bg-white p-4 rounded-xl border border-dashed border-slate-350 space-y-3 animate-slide-down">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="space-y-1 leading-normal">
                <strong className="text-xs font-black text-slate-700 uppercase tracking-wide block">Ambiente de Testes / Simulador de Perda de Sinal</strong>
                <p className="text-[11px] text-slate-500">
                  Use os bot√µes de simula√ß√£o abaixo para colocar o dispositivo cooperativamente em modo offline. O aplicativo guardar√° os hor√°rios exatos dos toques no IndexedDB, e efetuar√° logs de auditoria de sincroniza√ß√£o retroativa integrados ao perfil de auditoria LGPD no momento que a rede re-estabilizar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button 
                onClick={handleToggleConnection}
                className={`px-3 py-1.5 border hover:opacity-90 transition-all rounded-lg text-[11px] font-bold cursor-pointer ${
                  simulatedOnline 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}
              >
                {simulatedOnline ? 'üîå For√ßar Queda de Internet (Simular Offline)' : '‚ö° Restaurar Conex√£o de Internet (Simular Online)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Caregiver / Educator Profile Banner when active */}
      <div className="bg-white hover:bg-slate-50 transition-colors border border-soft-gray p-4 rounded-xl flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          {usuarioAtual.foto ? (
            <img 
              referrerPolicy="no-referrer"
              src={usuarioAtual.foto} 
              alt={usuarioAtual.nome} 
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shadow-2xs"
            />
          ) : (
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Perfil Ativo do Sistema</div>
            <div className="text-sm font-bold text-slate-800">
              {usuarioAtual.nome} ‚Äî <span className="text-blue-600 capitalize font-bold">{getRoleLabel(usuarioAtual, isEscolar)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                onNavigate('login');
              }
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title={isEscolar ? 'Sair ou trocar para o perfil de outra professora/educador com PIN' : 'Sair ou trocar de cuidador com PIN'}
          >
            <Lock className="w-3.5 h-3.5" />
            {isEscolar ? 'Trocar Educador (PIN)' : 'Trocar Cuidador (PIN)'}
          </button>

          <button 
            onClick={() => onNavigate('classroom')}
            className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title={isEscolar ? 'Ver salas de aula e trocar a crian√ßa/aluno em acompanhamento' : 'Ver lista de pessoas assistidas'}
          >
            <Users className="w-3.5 h-3.5" />
            {isEscolar ? 'Trocar Sala / Aluno' : 'Trocar Idoso'}
          </button>
        </div>
      </div>

      {/* Main Beautiful Header featuring the senior person */}
      <div className="bg-white rounded-2xl p-6 border border-soft-gray shadow-xs overflow-hidden relative">
        <div className="absolute right-0 top-0 w-24 h-24 bg-serene-blue/5 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-care-green/5 rounded-full translate-y-12"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <img 
            referrerPolicy="no-referrer"
            src={idoso.foto} 
            alt={idoso.nome} 
            className="w-48 h-48 sm:w-52 sm:h-52 md:w-36 md:h-36 rounded-3xl object-cover border-4 border-serene-blue/20 shadow-lg transform hover:scale-105 transition-all duration-200"
          />
          <div className="text-center md:text-left flex-1 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-serene-blue/10 text-serene-blue">
              <Heart className="w-3.5 h-3.5 fill-current text-serene-blue" /> {isEscolar ? 'Aluno Verificado' : 'Vis√£o Geral Ativa'}
            </span>
            <h1 className={`${titleClass} text-slate-800`}>{idoso.nome}</h1>
            {idoso.contatoEmergencia?.nome && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-xl font-bold w-fit mx-auto md:mx-0 shadow-2xs">
                <span>üë®‚Äçüë©‚Äçüëß</span>
                <span>Resp: <strong className="font-extrabold text-indigo-950">{idoso.contatoEmergencia.nome}</strong> ({idoso.contatoEmergencia.parentesco || 'M√£e/Pai'})</span>
                {idoso.contatoEmergencia.telefone && (
                  <span className="text-[11px] font-mono font-semibold text-indigo-600">({idoso.contatoEmergencia.telefone})</span>
                )}
              </div>
            )}
            <p className="text-slate-500 font-medium">
              {isEscolar ? 'Nascimento: ' : 'Nascido em '} {getBrDateAndAge(idoso.dataNascimento).formatted} ({getBrDateAndAge(idoso.dataNascimento).age} {getBrDateAndAge(idoso.dataNascimento).age === 1 ? 'ano' : 'anos'})
            </p>

            {isEscolar ? (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mt-1 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-3 py-1.5 rounded-xl w-fit mx-auto md:mx-0">
                <span className="text-sm">üë©‚Äçüè´</span>
                <span className="text-xs text-indigo-800 dark:text-indigo-300 font-extrabold">Professora Titular:</span>
                <span className="text-xs font-black text-indigo-950 dark:text-white">
                  {(() => {
                    const studentRoom = getStudentClassName(idoso) || idoso.salaAula || idoso.quarto || 'Ber√ß√°rio I - A';
                    const assignedTeacher = getAssignedTeacherForRoom(studentRoom, usuarioAtual);
                    return assignedTeacher ? assignedTeacher.nome.replace(/\s*\([^)]*\)/g, '').trim() : 'Sem Professora Cadastrada';
                  })()}
                </span>
                <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black">
                  {getStudentClassName(idoso) || idoso.salaAula || idoso.quarto || 'Maternal I - A'}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mt-1 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100/50 dark:border-amber-900/30 px-3 py-1.5 rounded-xl w-fit mx-auto md:mx-0">
                <span className="text-sm">üëµ</span>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-extrabold">Cuidador Respons√°vel:</span>
                <span className="text-xs font-black text-amber-950 dark:text-white">
                  {usuarioAtual ? usuarioAtual.nome.replace(' (Cuidadora)', '') : 'Sem Cuidador'}
                </span>
              </div>
            )}
            
            {/* Allergies and extreme alerts on top bar */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                {(idoso.condicoesMedicas || []).map((cond, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md border border-slate-200 flex items-center gap-1.5 transition-colors">
                    <span>{cond}</span>
                    {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteCondicao(cond, e)}
                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded-sm transition-colors hover:bg-rose-50 cursor-pointer"
                        title="Excluir rotina/condi√ß√£o"
                        id={`delete-cond-${i}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}
                
                {(idoso.alergias || []).map((alerg, i) => (
                  <span key={i} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-alert-red text-xs font-bold rounded-md border border-rose-200 flex items-center gap-1.5 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Alergia: {alerg}</span>
                    {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteAlergia(alerg, e)}
                        className="p-0.5 text-rose-400 hover:text-rose-700 rounded-sm transition-colors hover:bg-rose-100 cursor-pointer"
                        title="Excluir alergia"
                        id={`delete-alerg-${i}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}

                <button
                  onClick={() => setShowAddSpecialField(!showAddSpecialField)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                  id="toggle-add-special-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> {isEscolar ? 'Novo Alerta/Alergia' : 'Nova Condi√ß√£o/Alergia'}
                </button>
              </div>

              {showAddSpecialField && (
                <form onSubmit={handleCreateSpecialAttr} className="bg-indigo-50/75 p-3 rounded-xl border border-indigo-100 max-w-md mt-1.5 space-y-2 text-left self-center md:self-start w-full">
                  <p className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">
                    Adicionar no perfil de {idoso.nome}
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={newSpecialType}
                      onChange={e => setNewSpecialType(e.target.value as 'condicao' | 'alergia')}
                      className="text-xs px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-755 outline-hidden focus:border-indigo-500 font-bold"
                    >
                      <option value="condicao">{isEscolar ? 'Rotina/Restri√ß√£o' : 'Condi√ß√£o M√©dica'}</option>
                      <option value="alergia">Alergia Grave</option>
                    </select>
                    <input
                      type="text"
                      placeholder={newSpecialType === 'condicao' ? (isEscolar ? 'Ex: Soneca ap√≥s almo√ßo' : 'Ex: Diabetes Tipo 2') : 'Ex: Amendoim, Lactose'}
                      value={newSpecialValue}
                      onChange={e => setNewSpecialValue(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-800 placeholder-indigo-300 outline-hidden focus:border-indigo-500 font-semibold"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => { setShowAddSpecialField(false); setNewSpecialValue(''); }}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-900 hover:bg-indigo-100 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[10px] font-bold rounded-md shadow-xs"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            {isEscolar && onNavigate && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 max-w-xl text-left">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-indigo-950 leading-none mb-1">Painel da Sala e Switcher</p>
                    <p className="text-[10px] text-indigo-800 leading-normal">
                      Voc√™ est√° visualizando a ficha de <strong>{idoso.nome}</strong>. Cadastramos todos os 25 alunos da sala.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('classroom')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  Ver Lista Geral <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* üéÅ TRIAL MILESTONE TRACKER: JORNADA COMERCIAL DE 30 DIAS (EXCLUSIVO PARA A VIS√ÉO DA FAM√çLIA / PAIS) */}
      {!isStaffUser(usuarioAtual) && visualMode === 'familia' && localStorage.getItem(`anjo_sub_status_${idoso.id}`) !== 'atrasado' && (
        <div className={`p-6 rounded-3xl border text-left space-y-4 shadow-xs relative overflow-hidden transition-all ${
          accessibilitySettings?.darkMode 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : 'bg-linear-to-r from-emerald-50/50 to-teal-50/50 border-emerald-200'
        }`}>
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 pointer-events-none">üéÅ</div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Per√≠odo de Experi√™ncia
                </span>
                <span className={`text-xs font-bold ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 15 de 30</span>
              </div>
              <h4 className={`text-base font-black ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-950'}`}>
                {isEscolar 
                  ? 'üéÅ Seu Per√≠odo de Testes Gratuitos (30 Dias) est√° Ativo!' 
                  : 'üéÅ Per√≠odo de Experi√™ncia Gr√°tis (30 Dias) Ativo!'
                }
              </h4>
              <p className={`text-xs max-w-2xl font-semibold leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                {isEscolar
                  ? `J√° faz 15 dias que voc√™ est√° mais perto da rotina escolar de ${idoso.nome}. Viu como a aba de Medicamentos Encomendados e o Di√°rio L√∫dico facilitam seu dia e trazem tranquilidade?`
                  : `J√° faz 15 dias que voc√™ est√° mais perto do acompanhamento preventivo de ${idoso.nome}. Viu como a aba de Medicamentos e os registros de Sinais Vitais trazem paz e seguran√ßa?`
                }
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => {
                  // Simulate trial end/payment required!
                  localStorage.setItem(`anjo_sub_status_${idoso.id}`, 'atrasado');
                  // Trigger a fast page reload/refresh to apply
                  window.dispatchEvent(new Event('anjo_user_updated'));
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Testar simulador de tela de pagamento"
              >
                Ativar Plano Mensal por R$ {(() => {
                  const isCustom = localStorage.getItem(`anjo_sub_is_custom_${idoso.id}`) === 'true';
                  const price = isCustom
                    ? parseFloat(localStorage.getItem(`anjo_sub_valor_${idoso.id}`) || '29.90')
                    : parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
                  return price.toFixed(2).replace('.', ',');
                })()} üí≥
              </button>
              {!isApresentacao && (
                <span className={`block text-[9px] font-semibold mt-1 text-center ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  (Simular faturamento & Paywall)
                </span>
              )}
            </div>
          </div>

          {/* Interactive Visual Timeline Indicator */}
          <div className="pt-2">
            <div className="relative">
              {/* Timeline Connector Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
              {/* Highlight active progress line */}
              <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-emerald-500 -translate-y-1/2 z-0 rounded-full"></div>

              {/* 4 Steps */}
              <div className="relative z-10 grid grid-cols-4 text-center">
                {/* Step 1: Dia 1 */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                    ‚úì
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Dia 1</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Boas-vindas</span>
                </div>

                {/* Step 2: Dia 15 */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs animate-pulse">
                    ‚òÖ
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Dia 15</span>
                  <span className={`text-[9px] font-extrabold ${accessibilitySettings?.darkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>Voc√™ est√° aqui</span>
                </div>

                {/* Step 3: Dia 25 */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                    3
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 25</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Aviso Pr√©vio</span>
                </div>

                {/* Step 4: Dia 30 */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                    4
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 30</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Encerramento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {visualMode === 'cuidador' ? (
        // =====================================================================
        // SECTION A: CAREGIVER VIEW (PORTAL DO CUIDADOR)
        // =====================================================================
        <div className="space-y-6">
          
          {/* Active Shift Controls (Turno) */}
          {isAbsent ? (
            <div className="rounded-2xl p-6 border bg-rose-50 border-rose-300 shadow-xs relative overflow-hidden transition-all duration-300">
              <div className="absolute right-4 top-4">
                <UserX className="w-12 h-12 text-rose-500 opacity-20 animate-pulse" />
              </div>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 font-sans">{isEscolar ? 'Controle de Presen√ßa Escolar' : 'Acompanhamento de Cuidados'}</span>
                  <h2 className="text-xl font-bold text-rose-950">
                    {isEscolar ? 'üö´ Aluno Ausente Hoje (Falta)' : 'üö´ Cliente Ausente'}
                  </h2>
                  <p className="text-xs text-rose-700 mt-1 leading-normal">
                    {isEscolar 
                      ? 'Este aluno foi marcado como ausente hoje. Nenhuma notifica√ß√£o ou relat√≥rio de rotina ser√° cobrado ou emitido para os pais, e os lembretes de atraso para este di√°rio est√£o desativados.'
                      : 'Este idoso foi marcado como ausente hoje. Nenhuma atividade ou tarefa de rotina do dia ser√° cobrada ou marcada.'
                    }
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isStaffUser(usuarioAtual) ? (
                    <button
                      onClick={handleToggleAbsence}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 border border-rose-500"
                    >
                      <Check className="w-4 h-4" /> Marcar como Presente (Remover Falta)
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-100/50 px-3 py-2 rounded-xl border border-rose-200">
                      üîí Apenas educadores/cuidadores autorizados podem alterar a presen√ßa do aluno.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl p-6 border ${isShiftActive ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-300'} shadow-xs relative overflow-hidden transition-all duration-300`}>
              <div className="absolute right-4 top-4">
                <Clock className={`w-12 h-12 ${isShiftActive ? 'text-emerald-500 animate-spin-slow' : 'text-slate-400 opacity-30'}`} style={{ animationDuration: '30s' }} />
              </div>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isEscolar ? 'Classe e Presen√ßa do Aluno' : 'Controle de Horas'}</span>
                    {isShiftActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> AO VIVO
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {isShiftActive 
                      ? (isEscolar ? `‚úì Per√≠odo Letivo em Andamento (${idoso.nome.split(' (')[0]})` : `‚úì Turno Ativo no Celular!`) 
                      : (isEscolar ? `Aulas N√£o Iniciadas (${idoso.nome.split(' (')[0]})` : 'Seu Turno N√£o Est√° Ativo')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {isEscolar 
                      ? (isStaffUser(usuarioAtual)
                          ? 'Inicie o di√°rio de classe do aluno para registrar sonecas, xixi/coc√¥, mamadeiras e sa√∫de. No final do per√≠odo, termine a aula para disparar o relat√≥rio autom√°tico via WhatsApp para os pais!'
                          : (isShiftActive 
                              ? `üë∂ ${idoso.nome.split(' (')[0]} est√° presente na escola e o di√°rio de classe est√° aberto em tempo real pela equipe pedag√≥gica.` 
                              : `Aguardando a professora/educadora iniciar o per√≠odo letivo para ${idoso.nome.split(' (')[0]}. Assim que a entrada for confirmada, o cron√¥metro iniciar√° aqui automaticamente.`))
                      : 'Inicie seu turno para acompanhar a rotina e as atividades. Ao final, clique em Encerrar para compilar o resumo e enviar os disparos de auditoria aos familiares interessados.'
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Unified Stopwatch Card: Always visible to avoid "disappeared" feeling */}
                  <div className={`px-4 py-2.5 rounded-xl border leading-none transition-all duration-300 ${isShiftActive ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        {isEscolar ? 'TEMPO EM AULA' : 'DURA√á√ÉO DO TURNO'}
                      </span>
                      {isShiftActive && isStaffUser(usuarioAtual) && (
                        <button
                          onClick={handleDirectStopShift}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                          title="Desligar cron√¥metro imediatamente"
                        >
                          ‚èπÔ∏è Desligar
                        </button>
                      )}
                    </div>
                    <strong className={`text-2xl font-mono tracking-tight ${isShiftActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {isShiftActive ? elapsedShiftTime : '00:00:00'}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isStaffUser(usuarioAtual) ? (
                      isShiftActive ? (
                        <>
                          <button
                            onClick={() => {
                              setOccurrenceForm({ tipo: 'queda', criticidade: 'vermelho', descricao: '' });
                              setShowOccurrenceModal(true);
                            }}
                            className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 border border-red-500 hover:scale-102"
                            title="Registrar intercorr√™ncia m√©dica ou ocorr√™ncia do dia"
                          >
                            <ShieldAlert className="w-4 h-4 text-white animate-pulse" /> üö® Registrar Ocorr√™ncia
                          </button>
                          <button
                            onClick={handleDirectStopShift}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 hover:scale-102"
                            title="Desligar cron√¥metro deste aluno individualmente"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" /> {isEscolar ? '‚èπÔ∏è Desligar Individual' : '‚èπÔ∏è Desligar Turno'}
                          </button>
                          <button
                            onClick={() => handleEndShiftGroup(teacherClassroom)}
                            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 hover:scale-102"
                            title={`Desligar cron√¥metro de todos os alunos da turma ${teacherClassroom} ao mesmo tempo`}
                          >
                            <Users className="w-3.5 h-3.5" /> üë• Desligar Coletivo ({teacherClassroom})
                          </button>
                          <button
                            onClick={handleToggleAbsence}
                            className="px-3.5 py-2.5 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            title={isEscolar ? 'Sinalizar aus√™ncia do aluno hoje' : 'Registrar n√£o comparecimento'}
                          >
                            <UserX className="w-4 h-4 text-rose-500" /> {isEscolar ? 'Sinalizar Aus√™ncia' : 'Registrar N√£o Comparecimento'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleStartShift}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-102"
                            title={isAbsent ? "Religar cron√¥metro registrando o retorno do aluno (mantendo atividades salvas)" : "Ligar cron√¥metro para este aluno"}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> {isAbsent ? '‚ñ∂Ô∏è Religar Cron√¥metro' : (isEscolar ? '‚ñ∂Ô∏è Ligar Individual' : '‚ñ∂Ô∏è Iniciar Turno Individual')}
                          </button>
                          <button
                            onClick={() => handleStartShiftGroup(teacherClassroom)}
                            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-102"
                            title={`Ligar cron√¥metro de todos os alunos da turma ${teacherClassroom} e zerar as atividades de todos`}
                          >
                            <Users className="w-3.5 h-3.5" /> üë• Ligar Coletivo ({teacherClassroom})
                          </button>
                          <button
                            onClick={handleToggleAbsence}
                            className="px-3.5 py-2.5 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            title={isEscolar ? 'Sinalizar aus√™ncia do aluno hoje' : 'Registrar n√£o comparecimento'}
                          >
                            <UserX className="w-4 h-4 text-rose-500" /> {isEscolar ? 'Sinalizar Aus√™ncia' : 'Registrar N√£o Comparecimento'}
                          </button>
                        </>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 bg-white/70 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {isShiftActive 
                          ? 'Sincronizado com a escola via nuvem em tempo real.'
                          : 'üîí Visualiza√ß√£o dos respons√°veis. Controles exclusivos dos educadores.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED OFFLINE CONTINGENCY QUEUE */}
          {filaOffline.length > 0 && (
            <div className="bg-amber-50/70 border-2 border-amber-300 p-5 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-950">Dispositivo Offline: Itens na Fila Local ({filaOffline.length})</h3>
              </div>
              <p className="text-xs text-amber-800 leading-normal">
                Voc√™ registrou tarefas enquanto estava sem internet. O sistema guardou o hor√°rio real do seu celular. Quando sua internet voltar, mude no simulador acima para "Online" e sincronize os registros de auditoria.
              </p>
              <div className="space-y-1.5 pt-1.5">
                {filaOffline.map(oItem => (
                  <div key={oItem.id_local} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-semibold shadow-2xs">
                    <div>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded uppercase font-black mr-2">{oItem.tipo}</span>
                      <strong className="text-slate-800">{oItem.titulo}</strong>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-500">
                      Dispositivo: {new Date(oItem.horario_registrado_dispositivo).toLocaleTimeString('pt-BR')}  ‚Ä¢  <span className="text-rose-500 font-bold uppercase tracking-wide">Pendente</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONE-TAP INSTANT CARE PANEL (Painel Um-Toque de Alta Performance) */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-blue-600" /> Painel "Um-Toque" de Registros Di√°rios
            </h3>

            <div className="relative">
              {renderDashboardAuthBadge()}
              {isAbsent && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        {isEscolar ? 'Aluno com Falta / Aus√™ncia Registrada' : 'Cliente Marcado como Ausente'}
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Para registrar alimenta√ß√£o, hidrata√ß√£o ou cuidados normalmente, clique no bot√£o ao lado ou use qualquer registro r√°pido.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => unlockAndMarkPresent()}
                    className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Marcar Presente
                  </button>
                </div>
              )}
               <div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
              
              {/* Quick meal */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Coffee className="text-amber-500 w-4.5 h-4.5" /> Registrar Refei√ß√£o R√°pida
                </h4>
                <form onSubmit={handleQuickMealSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Refei√ß√£o</label>
                      <select 
                        value={quickMeal.refeicao} 
                        onChange={e => setQuickMeal({...quickMeal, refeicao: e.target.value})}
                        className="w-full text-xs font-semibold px-2 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1"
                      >
                        {isEscolar && <option value="mamadeira">üçº Mamadeira de Leite / F√≥rmula</option>}
                        <option value="cafe_manha">{isEscolar ? 'ü•ê Lanchinho da Manh√£' : '‚òï Caf√© da Manh√£'}</option>
                        <option value="almoco">{isEscolar ? 'üç≤ Papinha / Almocinho' : 'üçõ Almo√ßo'}</option>
                        <option value="lanche">{isEscolar ? 'üçé Frutinha / Lanchinho Tarde' : 'üçé Lanche da Tarde'}</option>
                        <option value="jantar">{isEscolar ? 'ü•£ Jantinha Escolar' : 'üç≤ Jantar'}</option>
                        <option value="ceia">{isEscolar ? 'ü•õ Ch√° ou Suco P√≥s-Soneca' : 'ü•õ Ceia / Repouso'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aceita√ß√£o</label>
                      <select 
                        value={quickMeal.aceitacao} 
                        onChange={e => setQuickMeal({...quickMeal, aceitacao: e.target.value})}
                        className="w-full text-xs font-semibold px-2 py-2 border border-slate-300 rounded-xl bg-slate-50"
                      >
                        <option value="muito_bem">üòã Comeu Super Bem</option>
                        <option value="pouco">üòê Comeu Pouquinho</option>
                        <option value="recusou">‚ùå Recusou / Sem Fome</option>
                      </select>
                    </div>
                  </div>

                  {quickMeal.refeicao === 'mamadeira' && (
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50/40 rounded-xl border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">üçº</span>
                          <span>Volume da Mamadeira:</span>
                        </span>
                        <span className="font-mono font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-md text-xs shadow-3xs">
                          {quickMeal.quantidadeMl || 180} ml
                        </span>
                      </div>

                      {/* Presets in mL */}
                      <div className="grid grid-cols-6 gap-1">
                        {[90, 120, 150, 180, 210, 240].map(vol => (
                          <button
                            key={vol}
                            type="button"
                            onClick={() => setQuickMeal({ ...quickMeal, quantidadeMl: vol })}
                            className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                              (quickMeal.quantidadeMl || 180) === vol
                                ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100/70'
                            }`}
                          >
                            {vol}ml
                          </button>
                        ))}
                      </div>

                      {/* Fine-tune stepper */}
                      <div className="flex items-center justify-between pt-1 border-t border-indigo-100/70">
                        <span className="text-[10px] font-bold text-indigo-800">Ajuste fino:</span>
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-200 shadow-3xs">
                          <button
                            type="button"
                            onClick={() => setQuickMeal(prev => ({ ...prev, quantidadeMl: Math.max(10, (prev.quantidadeMl || 180) - 10) }))}
                            className="w-6 h-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            -10
                          </button>
                          <input
                            type="number"
                            min="10"
                            max="500"
                            step="10"
                            value={quickMeal.quantidadeMl || 180}
                            onChange={e => setQuickMeal(prev => ({ ...prev, quantidadeMl: Math.max(10, Number(e.target.value) || 180) }))}
                            className="w-12 text-center text-xs font-black text-indigo-900 bg-transparent border-0 focus:outline-hidden font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setQuickMeal(prev => ({ ...prev, quantidadeMl: Math.min(500, (prev.quantidadeMl || 180) + 10) }))}
                            className="w-6 h-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observa√ß√£o / Card√°pio</label>
                      <VoiceInput 
                        onTranscript={text => setQuickMeal(prev => ({ ...prev, observacao: prev.observacao ? prev.observacao + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Observa√ß√£o r√°pida (ex: Amou a banana cozida)"
                      value={quickMeal.observacao}
                      onChange={e => setQuickMeal({...quickMeal, observacao: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-xl focus:ring-1 focus:outline-hidden"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Salvar Refei√ß√£o Instant√¢nea
                  </button>
                </form>
              </div>

              {/* Quick constant hydration meter with animated Jarrinha */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Droplets className="text-cyan-500 w-4.5 h-4.5 animate-pulse" /> 
                        {isEscolar ? 'Hidrata√ß√£o R√°pida (√Ågua)' : 'Hidrata√ß√£o Instant√¢nea'}
                      </h4>
                      <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                        {quickHydrationAmount} ml
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal mb-3">
                      {isEscolar 
                        ? `Escolha a quantidade de √°gua servida em mL para ${idoso.nome}. Registra o copo e atualiza a jarrinha.`
                        : `Basta um clique para salvar o consumo de √°gua de ${idoso.nome}. O aplicativo cuida de atualizar a rotina e sincronizar.`}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-1">
                        {[50, 100, 150, 200, 250, 300].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setQuickHydrationAmount(amt)}
                            className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                              quickHydrationAmount === amt 
                                ? 'bg-cyan-500 text-white border-cyan-500 shadow-xs scale-105' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent'
                            }`}
                          >
                            {amt}ml
                          </button>
                        ))}
                      </div>

                      {/* Fine-tune water stepper */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-cyan-900">Ajuste fino:</span>
                        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200 shadow-3xs">
                          <button
                            type="button"
                            onClick={() => setQuickHydrationAmount(prev => Math.max(10, prev - 10))}
                            className="w-6 h-6 bg-cyan-100/60 hover:bg-cyan-100 text-cyan-800 rounded text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            -10
                          </button>
                          <input
                            type="number"
                            min="10"
                            max="1000"
                            step="10"
                            value={quickHydrationAmount}
                            onChange={e => setQuickHydrationAmount(Math.max(10, Number(e.target.value) || 150))}
                            className="w-12 text-center text-xs font-black text-cyan-900 bg-transparent border-0 focus:outline-hidden font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setQuickHydrationAmount(prev => Math.min(1000, prev + 10))}
                            className="w-6 h-6 bg-cyan-100/60 hover:bg-cyan-100 text-cyan-800 rounded text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ü´ñ Jarrinha Animada no card de Hidrata√ß√£o Instant√¢nea */}
                  {(() => {
                    const targetGoal = isEscolar ? 600 : 1500;
                    const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                    return (
                      <div className="flex flex-col items-center bg-cyan-50/70 p-2.5 rounded-2xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de hidrata√ß√£o: o conte√∫do sobe conforme a √°gua √© oferecida!">
                        <div className="relative my-0.5">
                          {/* Glass Jug Body */}
                          <div className="relative w-10 h-16 border-2 border-cyan-600 rounded-b-xl rounded-t-xs bg-white/90 overflow-hidden shadow-inner flex flex-col justify-end">
                            {/* Animated Liquid level */}
                            <div 
                              className="bg-gradient-to-t from-cyan-600 via-sky-500 to-sky-400 w-full transition-all duration-700 relative"
                              style={{ height: `${percentJug}%` }}
                            >
                              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-200 animate-pulse"></div>
                            </div>

                            {/* Level lines inside jug */}
                            <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 pointer-events-none opacity-40">
                              <div className="border-t border-cyan-800 w-full"></div>
                              <div className="border-t border-cyan-800 w-full"></div>
                              <div className="border-t border-cyan-800 w-full"></div>
                            </div>
                          </div>
                          {/* Jug Handle */}
                          <div className="absolute -right-2 top-2 bottom-2 w-2 border-2 border-l-0 border-cyan-600 rounded-r-lg pointer-events-none"></div>
                        </div>

                        <span className="text-[9px] font-black uppercase text-cyan-800 mt-1">Jarrinha</span>
                        <span className="text-xs font-black text-cyan-900 font-mono">{percentJug}%</span>
                        <span className="text-[9px] font-bold text-slate-500">{totalWaterMl}ml</span>
                      </div>
                    );
                  })()}
                </div>

                <button 
                  onClick={handleQuickHydrate}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mt-3 flex items-center justify-center gap-2"
                >
                  <span>ü•§ Oferecer Copo (+{quickHydrationAmount}ml)</span>
                  <span className="text-[10px] bg-cyan-700/40 px-2 py-0.5 rounded-md">Jarrinha Sobe!</span>
                </button>
              </div>

              {/* Quick Hygiene checklist */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Heart className="text-rose-500 w-4.5 h-4.5" /> {isEscolar ? 'Higiene & Cuidados da Crian√ßa üë∂' : 'Higiene & Cuidados de Conforto'}
                </h4>
                <form onSubmit={handleQuickHygieneSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <label className="flex items-start gap-2 text-xs font-semibold cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={quickHygiene.diaper} 
                        onChange={e => handleHygieneChange({ diaper: e.target.checked })}
                        className="w-4 h-4 text-serene-blue rounded focus:ring-serene-blue mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">{isEscolar ? 'üë∂ Troca de Fralda / Cuidado de Toalete' : 'üë∂ Troca de Fralda / Absorvente'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Fralda descart√°vel checada/trocada ou incentivo de uso do toalete.' : 'Se aplic√°vel, ou verifica√ß√£o de vazamento urin√°rio.'}</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 text-xs font-semibold cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={quickHygiene.teeth} 
                        onChange={e => handleHygieneChange({ teeth: e.target.checked })}
                        className="w-4 h-4 text-serene-blue rounded focus:ring-serene-blue mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">{isEscolar ? 'ü™• Escova√ß√£o de Dentes Orientada' : 'ü™• Higiene Bucal Completa'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Com escovinha individual e creme dental infantil de forma l√∫dica.' : 'Uso de escova macia, higienizador de l√≠ngua ou solu√ß√£o prot√©tica.'}</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 text-xs font-semibold cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={quickHygiene.clothes} 
                        onChange={e => handleHygieneChange({ clothes: e.target.checked })}
                        className="w-4 h-4 text-serene-blue rounded focus:ring-serene-blue mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">{isEscolar ? 'üëö Troca de Roupa (Mochila)' : 'üëö Troca de Roupa por Limpas'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Crian√ßa vestida com roupas limpas enviadas pelos pais ap√≥s sujar ou banho.' : 'Roupas frescas, f√°ceis de vestir e adequadas ao clima.'}</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 text-xs font-semibold cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={quickHygiene.hands || quickHygiene.bath} 
                        onChange={e => handleHygieneChange({ hands: e.target.checked, bath: e.target.checked })}
                        className="w-4 h-4 text-serene-blue rounded focus:ring-serene-blue mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">{isEscolar ? 'üßº Lavagem das M√£os e Rosto' : 'üöø Banho de Chuveiro Realizado'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Praticado antes e ap√≥s refei√ß√µes e depois das brincadeiras de artes/p√°tio.' : 'Controle de temperatura de √°gua e piso antiderrapante.'}</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 text-xs font-semibold cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors sm:col-span-2">
                      <input 
                        type="checkbox" 
                        checked={quickHygiene.cream} 
                        onChange={e => handleHygieneChange({ cream: e.target.checked })}
                        className="w-4 h-4 text-serene-blue rounded focus:ring-serene-blue mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">{isEscolar ? 'üß¥ Pomada Antiassadura / Protetor' : 'üß¥ Hidrata√ß√£o e Prote√ß√£o da Pele'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Aplica√ß√£o de pomada nas dobrinhas para preven√ß√£o de brotoejas ou assadura.' : 'Uso de cremes s√™nior preventivos para escaras e ressecamento.'}</span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observa√ß√£o de Higiene</label>
                      <VoiceInput 
                        onTranscript={text => handleHygieneChange({ observations: quickHygiene.observations ? quickHygiene.observations + ' ' + text : text })} 
                        size="sm"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder={isEscolar ? "Ex: Sem assaduras. Cooperou cantando a musiquinha do sapo para lavar as m√£os." : "Ex: Sem assaduras, pele limpa e bem cuidada."}
                      value={quickHygiene.observations}
                      onChange={e => handleHygieneChange({ observations: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-[#cbd5e1] bg-slate-50 rounded-xl focus:ring-1 focus:outline-hidden"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Salvar Checklist de Higiene
                  </button>
                </form>
              </div>

              {/* Quick Mood & Observations */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Smile className="text-indigo-505 w-4.5 h-4.5" /> Estado de Humor / Nota do Cuidador
                </h4>
                <form id="quick-humor-form" onSubmit={handleQuickHumorSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="quick-humor-estado" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estado Geral de Humor</label>
                    <select 
                      id="quick-humor-estado"
                      value={quickHumor.estado} 
                      onChange={e => setQuickHumor({...quickHumor, estado: e.target.value})}
                      className="w-full text-xs font-semibold px-2 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1"
                    >
                      <option value="calmo">üòä Calmo / Sereno</option>
                      <option value="feliz">üòÑ Feliz / Comunicativo</option>
                      <option value="sonolento">üí§ Sonolento / Repousando</option>
                      <option value="agitado">‚ö†Ô∏è Agitado / Inquieto</option>
                      <option value="confuso">‚ùì Desorientado / Confuso</option>
                      <option value="recusando">‚ùå Resiste √†s Interven√ß√µes</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="quick-humor-observacao" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observa√ß√£o do Humor / Estado</label>
                      <VoiceInput 
                        onTranscript={text => {
                          if (!text || !text.trim()) return;
                          setQuickHumor(prev => {
                            const cur = (prev.observacao || '').trim();
                            const incoming = text.trim();
                            if (!cur) return { ...prev, observacao: incoming };
                            return { ...prev, observacao: `${cur} ${incoming}` };
                          });
                        }} 
                        size="sm"
                      />
                    </div>
                    <textarea 
                      id="quick-humor-observacao"
                      rows={2}
                      placeholder="Nota r√°pida (ex: Dormiu bem √† tarde, descansou no soninho e acordou bem disposto)"
                      value={quickHumor.observacao}
                      onChange={e => setQuickHumor({...quickHumor, observacao: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-xl focus:ring-1 focus:outline-hidden resize-none bg-slate-50 text-slate-800"
                    />
                  </div>
                  <button 
                    id="btn-salvar-humor"
                    type="submit" 
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Salvar Registros de Humor
                  </button>
                </form>
              </div>

              {/* Quick Vitals & Weight Track Card ‚öñÔ∏è */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-rose-500 w-4.5 h-4.5 animate-pulse" /> {isEscolar ? 'Sa√∫de, Sono & Fralda do Aluno ‚öñÔ∏è' : 'Sinais Vitais & Peso do Idoso ‚öñÔ∏è'}
                </h4>
                <form id="quick-vitals-form" onSubmit={handleQuickVitalsSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`space-y-1 ${isEscolar ? 'col-span-2 md:col-span-1' : ''}`}>
                      <label htmlFor="vital-pressao" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEscolar ? 'üí§ Soneca / Descanso' : 'PA (Press√£o)'}</label>
                      <input 
                        id="vital-pressao"
                        type="text" 
                        placeholder={isEscolar ? 'Ex: Dormiu das 13:00 √†s 14:30' : 'Ex: 120/80'}
                        value={quickVitals.pressao}
                        onChange={e => setQuickVitals({...quickVitals, pressao: e.target.value})}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                      />
                      {isEscolar && (
                        <div className="mt-1.5 space-y-1.5 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-indigo-700 flex items-center gap-1 uppercase tracking-wider">‚è±Ô∏è Toque R√°pido (Soneca):</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, pressao: 'Dormiu 30 minutos' }))}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              30m
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, pressao: 'Dormiu 1 hora' }))}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              1h
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, pressao: 'Dormiu 1h30' }))}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              1h30
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, pressao: 'Dormiu 2 horas' }))}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              2h
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, pressao: 'N√£o dormiu / sesta' }))}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 active:scale-95 text-rose-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              N√£o dormiu
                            </button>
                          </div>

                          <div className="pt-1.5 border-t border-indigo-100/60 flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 shrink-0">üïí Reloginho:</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="time" 
                                value={sleepStart}
                                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold text-[9px] focus:outline-hidden"
                                onChange={e => {
                                  const val = e.target.value;
                                  setSleepStart(val);
                                  setQuickVitals(prev => ({ ...prev, pressao: `Dormiu das ${val} √†s ${sleepEnd}` }));
                                }}
                              />
                              <span className="text-[9px] font-bold text-slate-400">√†s</span>
                              <input 
                                type="time" 
                                value={sleepEnd}
                                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold text-[9px] focus:outline-hidden"
                                onChange={e => {
                                  const val = e.target.value;
                                  setSleepEnd(val);
                                  setQuickVitals(prev => ({ ...prev, pressao: `Dormiu das ${sleepStart} √†s ${val}` }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`space-y-1 ${isEscolar ? 'col-span-2 md:col-span-1' : ''}`}>
                      <div className="flex items-center justify-between">
                        <label htmlFor="vital-glicemia" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEscolar ? 'üßª Fralda (Xixi ou Coc√¥)' : 'Glicemia (mg/dL)'}</label>
                        {isEscolar && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase">Falar:</span>
                            <VoiceInput 
                              onTranscript={text => setQuickVitals(prev => ({ ...prev, glicemia: text }))} 
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                      <input 
                        id="vital-glicemia"
                        type="text" 
                        placeholder={isEscolar ? 'Ex: Fez Coc√¥ / Pomada' : 'Ex: 104'}
                        value={quickVitals.glicemia}
                        onChange={e => setQuickVitals({...quickVitals, glicemia: e.target.value})}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                      />
                      {isEscolar && (
                        <div className="mt-1.5 space-y-1.5 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/80">
                          <span className="text-[9px] font-extrabold text-emerald-700 block uppercase tracking-wider">üßª Toque R√°pido (Fralda):</span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Fez Xixi' }))}
                              className="px-2 py-1 bg-white hover:bg-sky-50 border border-sky-100 active:scale-95 text-sky-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              üí¶ Xixi
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Fez Coc√¥' }))}
                              className="px-2 py-1 bg-white hover:bg-amber-50 border border-amber-100 active:scale-95 text-amber-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              üí© Coc√¥
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Xixi e Coc√¥' }))}
                              className="px-2 py-1 bg-white hover:bg-purple-50 border border-purple-100 active:scale-95 text-purple-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              ‚ú® Ambos
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => {
                                const current = prev.glicemia ? prev.glicemia + ' (Passou pomada)' : 'Fralda trocada + pomada';
                                return { ...prev, glicemia: current };
                              })}
                              className="px-2 py-1 bg-white hover:bg-teal-50 border border-teal-100 active:scale-95 text-teal-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              üß¥ +Pomada
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Fralda Seca / Limpa' }))}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-100 active:scale-95 text-emerald-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              ‚úÖ Seca
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="vital-temperatura" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-bold text-orange-650">{isEscolar ? 'üå°Ô∏è Febre / Temp (¬∞C)' : 'Temp (¬∞C)'}</label>
                      <input 
                        id="vital-temperatura"
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 36.5"
                        value={quickVitals.temp}
                        onChange={e => setQuickVitals({...quickVitals, temp: e.target.value})}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                      />
                      {isEscolar && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '36.5' }))}
                            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            36,5¬∞C
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '37.0' }))}
                            className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            37,0¬∞C
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '37.5' }))}
                            className="px-1.5 py-0.5 bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            37,5¬∞C
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '38.0' }))}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            38,0¬∞C ‚ö†Ô∏è
                          </button>
                        </div>
                      )}
                    </div>
                    {!isEscolar ? (
                      <>
                        <div className="space-y-1">
                          <label htmlFor="vital-oxigenio" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            O2 (Satura√ß√£o %)
                          </label>
                          <input 
                            id="vital-oxigenio"
                            type="number" 
                            placeholder="Ex: 98"
                            value={quickVitals.sat}
                            onChange={e => setQuickVitals({...quickVitals, sat: e.target.value})}
                            className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="vital-fcardiaca" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            F. Card√≠aca (bpm)
                          </label>
                          <input 
                            id="vital-fcardiaca"
                            type="number" 
                            placeholder="Ex: 75"
                            value={quickVitals.fCard}
                            onChange={e => setQuickVitals({...quickVitals, fCard: e.target.value})}
                            className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                          />
                        </div>
                      </>
                    ) : null}
                    <div className={`space-y-1 ${isEscolar ? 'col-span-2' : ''}`}>
                      <label htmlFor="vital-peso" className="text-[10px] font-black text-indigo-650 uppercase tracking-wider block font-black">{isEscolar ? '‚öñÔ∏è Peso Corporal (Kg)' : '‚öñÔ∏è Peso Corporal (Recomendado Semanal)'}</label>
                      <input 
                        id="vital-peso"
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 14.5"
                        value={quickVitals.peso}
                        onChange={e => setQuickVitals({...quickVitals, peso: e.target.value})}
                        className="w-full text-xs font-bold text-indigo-700 placeholder-indigo-300 px-2.5 py-2 border border-indigo-200 rounded-xl bg-indigo-50/50 focus:ring-1 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {isEscolar && (() => {
                    const studentBottlesToday = todaysMealsList.filter(m => {
                      if (!m || !m.refeicao) return false;
                      const ref = String(m.refeicao).toLowerCase();
                      return ref === 'mamadeira' || ref.includes('mamad') || (m.observacoes && m.observacoes.toLowerCase().includes('mamadeira'));
                    });
                    const totalBottlesMl = studentBottlesToday.reduce((acc, curr) => acc + (Number(curr.quantidadeMl) || 180), 0);

                    return (
                      <div className="p-2.5 bg-gradient-to-r from-amber-50/80 via-slate-50 to-cyan-50/80 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1">
                            <span>üçº Mamadeiras Hoje:</span>
                            <strong className="text-amber-800 font-black">{studentBottlesToday.length} {studentBottlesToday.length === 1 ? 'servida' : 'servidas'} ({totalBottlesMl} ml)</strong>
                          </span>
                          <span className="text-slate-300">‚Ä¢</span>
                          <span className="flex items-center gap-1">
                            <span>üíß Hidrata√ß√£o Total:</span>
                            <strong className="text-cyan-800 font-black">{totalWaterMl} ml</strong>
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-white text-slate-600 rounded-md border border-slate-200">
                          ‚úì Sincronizado
                        </span>
                      </div>
                    );
                  })()}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEscolar ? 'Notas Gerais de Sa√∫de / Rotina do Beb√™' : 'Notas Gerais de Sa√∫de / Rotina'}</label>
                      <VoiceInput 
                        onTranscript={text => setQuickVitals(prev => ({ ...prev, obs: prev.obs ? prev.obs + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input 
                      id="vital-observacoes"
                      type="text" 
                      placeholder={isEscolar ? 'Notas do dia (ex: Brincou muito na areia, comeu toda papinha, dormiu tranquilo no colinho...)' : 'Notas ou observa√ß√µes adicionais...'}
                      value={quickVitals.obs}
                      onChange={e => setQuickVitals({...quickVitals, obs: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-xl focus:ring-1 focus:outline-hidden"
                    />
                  </div>
                  <button 
                    id="save-vitals-btn"
                    type="submit" 
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isEscolar ? 'Salvar Situa√ß√£o de Sa√∫de & Alertar Pais' : 'Salvar Sinais Vitais & Peso Corporal + Notificar'}
                  </button>
                </form>
              </div>

              </div>

            </div>

            {/* Quick Atypical Occurrence / Alert Card (Placed OUTSIDE the active-shift locked grid so caregivers can always register occurrences or call immediately) */}
            {emergencyMinimized ? (
              <div className="lg:fixed lg:bottom-6 lg:right-6 lg:z-45 mt-4 animate-fade-in flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setOccurrenceForm({ tipo: 'queda', criticidade: 'vermelho', descricao: '' });
                    setShowOccurrenceModal(true);
                  }}
                  className="px-4 py-2.5 bg-red-650 hover:bg-red-750 active:bg-red-850 text-white font-black text-xs rounded-full shadow-xl transition-all cursor-pointer flex items-center gap-1.5 border border-red-550 animate-pulse hover:scale-105"
                  title="Registrar Intercorr√™ncia M√©dica Urgente"
                >
                  <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                  <span>üö® Intercorr√™ncia Urgente</span>
                </button>

                <button
                  onClick={() => {
                    setOccurrenceForm({ tipo: 'comportamento', criticidade: 'amarelo', descricao: '' });
                    setShowOccurrenceModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-full shadow-xl transition-all cursor-pointer flex items-center gap-1.5 border border-amber-400 hover:scale-105"
                  title="Registrar Ocorr√™ncia do Dia / Rotina"
                >
                  <FileText className="w-4 h-4 text-white shrink-0" />
                  <span>üìã Ocorr√™ncia do Dia</span>
                </button>

                <button
                  onClick={() => setEmergencyMinimized(false)}
                  className="p-2 bg-slate-800/80 hover:bg-slate-900 text-white text-xs rounded-full shadow-md cursor-pointer"
                  title="Expandir Painel de Emerg√™ncia"
                >
                  <ChevronDown className="w-4 h-4 rotate-180" />
                </button>
              </div>
            ) : (
              <div className="bg-rose-50 border-2 border-red-200 p-5 rounded-2xl space-y-4 flex flex-col justify-between mt-4 relative lg:fixed lg:bottom-6 lg:right-6 lg:z-45 lg:max-w-[340px] lg:m-0 lg:shadow-2xl lg:bg-white/95 lg:backdrop-blur-sm lg:border-red-300 dark:lg:bg-slate-900/95 transition-all duration-300">
                
                {/* Minimize Button on Mobile and Desktop */}
                <button 
                  onClick={() => setEmergencyMinimized(true)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-600 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded-lg transition-colors cursor-pointer flex"
                  title="Minimizar Painel de Emerg√™ncia"
                >
                  <X className="w-4 h-4" />
                </button>

                <div>
                  <h4 className="text-sm font-bold text-red-950 dark:text-red-400 flex items-center gap-2 mb-1 pr-6">
                    <ShieldAlert className="text-red-600 w-5 h-5 animate-pulse shrink-0" /> Registrar Evento
                  </h4>
                  <p className="text-xs text-red-850 dark:text-red-300 leading-normal mb-1 lg:text-[11px] lg:text-slate-600 dark:lg:text-slate-300">
                    Selecione o tipo adequado para notificar os familiares no WhatsApp:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => {
                      setOccurrenceForm({ tipo: 'queda', criticidade: 'vermelho', descricao: '' });
                      setShowOccurrenceModal(true);
                    }}
                    className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-between gap-2 border border-red-500"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-white animate-bounce shrink-0" />
                      <span>üö® Intercorr√™ncia Urgente</span>
                    </span>
                    <span className="text-[10px] bg-red-700 px-2 py-0.5 rounded-md font-bold">Febre/Queda</span>
                  </button>

                  <button 
                    onClick={() => {
                      setOccurrenceForm({ tipo: 'comportamento', criticidade: 'amarelo', descricao: '' });
                      setShowOccurrenceModal(true);
                    }}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-between gap-2 border border-amber-400"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-white shrink-0" />
                      <span>üìã Ocorr√™ncia do Dia</span>
                    </span>
                    <span className="text-[10px] bg-amber-600 px-2 py-0.5 rounded-md font-bold">Mordida/Choro</span>
                  </button>
                </div>

                {idoso.contatoEmergencia && (
                  <div className="pt-3 border-t border-red-200/60 lg:border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase text-red-900 lg:text-slate-500 block tracking-wider">
                      üìû Contato de Emerg√™ncia R√°pido:
                    </span>
                    <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-red-100 lg:border-slate-200 shadow-3xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <strong className="text-xs font-black text-red-950 dark:text-slate-200 block truncate">
                          {idoso.contatoEmergencia.nome}
                        </strong>
                        <span className="text-[10px] text-red-700 dark:text-slate-400 font-bold block truncate">
                          {idoso.contatoEmergencia.parentesco} ‚Ä¢ {idoso.contatoEmergencia.telefone}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Normal call */}
                        <a 
                          href={`tel:${idoso.contatoEmergencia.telefone}`}
                          className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 transition-colors flex items-center justify-center cursor-pointer shadow-3xs border border-indigo-200/40"
                          title="Ligar por Telefone"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        
                        {/* WhatsApp Call / Message */}
                        <a 
                          href={`https://wa.me/${formatWhatsAppNumber(idoso.contatoEmergencia.telefone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center cursor-pointer shadow-3xs"
                          title="Chamar no WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 12.008 0c3.237.001 6.278 1.261 8.567 3.551 2.289 2.289 3.548 5.331 3.548 8.568 0 6.678-5.32 12.002-12 12.002-1.993 0-3.95-.494-5.69-1.436L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.8 1.45 5.516 0 10-4.485 10-10 .003-5.515-4.484-10-10-10-5.517 0-10 4.484-10 10 0 1.9.5 3.5 1.45 5.1l-.95 3.5 3.7-.95zm10.742-5.466c-.29-.145-1.714-.848-1.98-.942-.262-.096-.453-.145-.642.145-.19.29-.733.941-.898 1.133-.165.19-.33.21-.62.066-.29-.145-1.22-.45-2.324-1.433-.86-.767-1.44-1.716-1.61-2.006-.17-.29-.018-.447.127-.591.13-.13.29-.33.435-.496.145-.165.193-.282.29-.47.097-.19.049-.356-.024-.5-.072-.145-.64-1.545-.878-2.113-.23-.557-.464-.48-.642-.49-.165-.008-.356-.01-.548-.01-.19 0-.501.072-.763.356-.262.282-1 .978-1 2.387 0 1.41 1.026 2.77 1.17 2.96.145.19 2.019 3.084 4.891 4.324.683.294 1.217.47 1.633.6.686.22 1.31.19 1.8.118.55-.08 1.714-.7 1.956-1.378.24-.678.24-1.258.17-1.378-.07-.12-.26-.19-.55-.335z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Agenda de cuidados de hoje list */}
          <div className="relative">
            {isAbsent && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-900 shadow-xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">
                      {isEscolar ? 'Aluno(a) com Falta Registrada Hoje' : 'Cliente com Aus√™ncia Registrada'}
                    </h4>
                    <p className="text-[11px] text-rose-800 leading-snug">
                      Voc√™ pode visualizar as atividades planejadas ou reativar a presen√ßa para dar baixa nos itens.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unlockAndMarkPresent()}
                  className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Reativar Presen√ßa
                </button>
              </div>
            )}
            
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-serene-blue animate-pulse" />
                  <div>
                    <h2 className="text-lg font-black text-slate-800">
                      {isEscolar ? 'Agenda de Atividades da Aula' : 'Agenda de Cuidados do Turno'}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {tarefas.length} {isEscolar ? 'atividade(s) programada(s)' : 'cuidado(s) agendado(s)'} para hoje
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Ferramentas de Gest√£o da Agenda */}
                  {tarefas.length > 0 && isStaffUser(usuarioAtual) && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={handleDeduplicateTasks}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-700 hover:bg-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        title="Remove tarefas com o mesmo t√≠tulo ou hor√°rio repetido"
                      >
                        üßπ <span>Repetidas</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllTasks}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        title="Limpar todas as atividades da agenda hoje"
                      >
                        üóëÔ∏è <span>Limpar Atividades</span>
                      </button>
                    </div>
                  )}

                  {isEscolar && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTask(true);
                        setTaskModeAura('aura_weekly');
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-400 ring-2 ring-indigo-300 animate-pulse"
                      title="Clique aqui para abrir a caixa e colar o planejamento de aulas gerado pela Aura"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/40" />
                      <span>üß† Importar Aura</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTask(!isAddingTask);
                      if (!isAddingTask) setTaskModeAura('direto');
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-blue-500"
                  >
                    <Plus className="w-4 h-4" /> {isEscolar ? 'Nova Atividade' : 'Novo Cuidado'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultTasks}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200"
                    title="Restaurar rotina padr√£o recomendada"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            {/* Form to Add New Task */}
            {isAddingTask && (
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 mb-5 animate-fade-in space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
                  <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                    ‚ú® {isEscolar ? 'Agendar Nova Atividade Escolar' : 'Agendar Nova Tarefa de Cuidado'}
                  </h3>

                  {isEscolar && (
                    <div className="flex bg-white p-1 rounded-xl border border-blue-200 gap-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTaskModeAura('direto')}
                        className={`py-1 px-2.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          taskModeAura === 'direto'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        üìå Cadastro Direto
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskModeAura('aura_weekly')}
                        className={`py-1 px-2.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          taskModeAura === 'aura_weekly'
                            ? 'bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-300'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        üß† Importar Planejamento Aura
                      </button>
                    </div>
                  )}
                </div>

                {taskModeAura === 'aura_weekly' ? (
                  <div className="space-y-4 bg-gradient-to-b from-indigo-50/80 to-purple-50/50 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm">
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 rounded-xl text-white shadow-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 fill-amber-300/40" />
                        <span>PASSO A PASSO: COMO ADICIONAR ATIVIDADES COM A AURA</span>
                      </div>
                      <p className="text-xs text-white/95 leading-relaxed font-medium">
                        1. Abra a <strong>Anjinha Aura ‚ú®</strong> no topo da tela, pe√ßa a ela para criar a rotina/planejamento de aulas da semana e <strong>copie o texto gerado</strong>.<br/>
                        2. <strong>Cole todo o texto</strong> da Aura na caixa branca abaixo.<br/>
                        3. Clique no bot√£o <strong>"üß† Extrair e Processar Atividades"</strong> para agendar tudo de uma vez!
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const promptText = `Por favor, crie o planejamento de rotina pedag√≥gica escolar come√ßando com a Acolhida das Crian√ßas √†s 07:00 e finalizando com a Sa√≠da √†s 16:00.\n\nUse o formato por linha:\nHH:MM: [T√≠tulo da Atividade] - [Descri√ß√£o pedag√≥gica detalhada]\n\nExemplo:\n- 07:00: Acolhida e Entrada Afetiva - Recep√ß√£o carinhosa dos alunos e cantigas de bom dia.\n- 08:00: Roda de Conversa - Apresenta√ß√£o do tema di√°rio e musicaliza√ß√£o.\n- 09:00: Lanche da Manh√£ - Frutas da esta√ß√£o e hidrata√ß√£o.\n- 09:45: Recrea√ß√£o e Banho de Sol - Brincadeiras ao ar livre no p√°tio sombreado.\n- 10:30: Atividade Dirigida BNCC - Explora√ß√£o sensorial com tintas e texturas.\n- 11:30: Almo√ßo Saud√°vel - Papinha balanceada e legumes.\n- 12:15: Higiene e Fraldas - Troca de fraldas e escova√ß√£o dental.\n- 12:30: Soneca Restauradora - Descanso em colchonetes com som suave.\n- 14:15: Lanche da Tarde - Mamadeira ou fruta fresca.\n- 14:45: Brincadeira Livre - Blocos pedag√≥gicos e autonomia.\n- 15:30: Conta√ß√£o de Hist√≥rias - Livros ilustrados e fantoches.\n- 16:00: Prepara√ß√£o para Sa√≠da - Entrega afetiva aos familiares.`;
                            navigator.clipboard.writeText(promptText);
                            alert('üìã Comando copiado com sucesso! Agora √© s√≥ colar no chat da Aura.');
                          }}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-[11px] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          üìã Copiar Modelo de Comando para a Aura (07:00 √†s 16:00)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                          <span>üëá</span> COLE O SEU TEXTO DA AURA AQUI ABAIXO:
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAutoFixAllTasks}
                            className="text-[11px] text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors border border-indigo-200 shadow-2xs"
                            title="Auto-corrige nomes e hor√°rios de atividades que possam ter ficado deslocados"
                          >
                            ü™Ñ Auto-Realinhar Atividades
                          </button>
                          {auraWeeklyText && (
                            <button
                              type="button"
                              onClick={() => { setAuraWeeklyText(''); setParsedAuraTasks([]); setAuraDetectedMeta(null); }}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              üóëÔ∏è Limpar Texto
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleCleanCorruptedTasks}
                            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors border border-amber-200"
                            title="Limpar tarefas pendentes antigas que foram importadas com erro ou desalinhadas"
                          >
                            üßπ Limpar com Erro
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={7}
                        value={auraWeeklyText}
                        onChange={e => setAuraWeeklyText(e.target.value)}
                        placeholder={`Cole aqui o texto copiado da Aura. Exemplo:

Segunda-feira:
- 07:00: Acolhida e Entrada Afetiva - Recep√ß√£o carinhosa dos alunos e cantigas de bom dia.
- 08:00: Roda de Conversa - Tema do dia e musicaliza√ß√£o.
- 09:00: Lanche da Manh√£ - Frutas da esta√ß√£o e hidrata√ß√£o.
- 09:45: Banho de Sol com Exploradores - Levar os beb√™s para ambiente externo seguro e sombreado.
- 10:30: Atividade Dirigida BNCC - Explora√ß√£o sensorial e artes.
- 11:30: Almo√ßo Saud√°vel - Refei√ß√£o balanceada.
- 12:15: Higiene e Fraldas - Troca e escova√ß√£o dental.
- 12:30: Soneca Restauradora - Descanso nos colchonetes.
- 14:15: Lanche da Tarde - Mamadeira ou lanche equilibrado.
- 14:45: Brincadeira Livre - Brinquedos pedag√≥gicos e socializa√ß√£o.
- 15:30: Conta√ß√£o de Hist√≥rias - Livros ilustrados e fantoches.
- 16:00: Sa√≠da e Despedida - Entrega afetiva aos respons√°veis.`}
                        className="w-full p-4 bg-white border-2 border-indigo-300 focus:border-indigo-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 text-xs font-mono text-slate-800 shadow-inner"
                      ></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Alcance:</span>
                        <button
                          type="button"
                          onClick={() => setTaskScope('individual')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            taskScope === 'individual'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" /> Individual ({idoso.nome})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskScope('coletivo')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            taskScope === 'coletivo'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" /> Classe Toda ({getStudentClassroomLocal(idoso.nome)})
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isParsingAuraWeekly}
                        onClick={handleParseAuraWeeklyPlan}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isParsingAuraWeekly ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Padronizando com Aura...</span>
                          </>
                        ) : (
                          <>
                            <span>üß† Extrair & Padronizar com Aura</span>
                          </>
                        )}
                      </button>
                    </div>

                    {parsedAuraTasks.length > 0 && (() => {
                      // Identifica todos os dias distintos presentes nas tarefas importadas
                      const distinctDays: string[] = [];
                      parsedAuraTasks.forEach(t => {
                        const d = t.dia || t.dataStr || 'Segunda-feira';
                        if (!distinctDays.includes(d)) distinctDays.push(d);
                      });

                      const filteredTasks = selectedAuraDayTab === 'todos'
                        ? parsedAuraTasks
                        : parsedAuraTasks.filter(t => (t.dia === selectedAuraDayTab || t.dataStr === selectedAuraDayTab));

                      return (
                        <div className="space-y-3 pt-3 border-t border-indigo-200">
                          {/* Cabe√ßalho no Padr√£o Manual Pedag√≥gico */}
                          <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                                <span>üìã</span> Planejamento Extra√≠do: {auraDetectedMeta?.tema || 'Rotina Escolar Padronizada'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                                {parsedAuraTasks.length} Atividades no Total
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">üìÖ Per√≠odo / Dias Detectados</span>
                                <span className="font-extrabold text-slate-800">
                                  {distinctDays.length > 1 ? `${distinctDays.length} Dias (${distinctDays[0]} a ${distinctDays[distinctDays.length - 1]})` : (auraDetectedMeta?.dataStr || auraDetectedMeta?.dia || 'Segunda-feira')}
                                </span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">üé® Tema do Planejamento</span>
                                <span className="font-extrabold text-indigo-900">{auraDetectedMeta?.tema || 'Desenvolvimento e Rotina Pedag√≥gica'}</span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">üë∂ Turma de Aplica√ß√£o</span>
                                <span className="font-extrabold text-purple-900">{auraDetectedMeta?.turma || getStudentClassroomLocal(idoso.nome)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Seletor de Abas por Dia da Semana / Data */}
                          {distinctDays.length > 1 && (
                            <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                                  <span>üóìÔ∏è</span> Visualizar & Separar por Dia:
                                </span>
                                <span className="text-[10px] text-indigo-700 font-semibold">
                                  Mostrando {filteredTasks.length} de {parsedAuraTasks.length} atividades
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAuraDayTab('todos')}
                                  className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                                    selectedAuraDayTab === 'todos'
                                      ? 'bg-indigo-700 text-white shadow-xs'
                                      : 'bg-white text-indigo-900 hover:bg-indigo-100/60 border border-indigo-200'
                                  }`}
                                >
                                  Todos os Dias ({parsedAuraTasks.length})
                                </button>
                                {distinctDays.map((dayName, idx) => {
                                  const countForDay = parsedAuraTasks.filter(t => (t.dia === dayName || t.dataStr === dayName)).length;
                                  const isSelected = selectedAuraDayTab === dayName;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedAuraDayTab(dayName)}
                                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                        isSelected
                                          ? 'bg-indigo-700 text-white shadow-xs font-extrabold'
                                          : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
                                      }`}
                                    >
                                      <span>üìÖ</span> {dayName} <span className="text-[10px] opacity-80">({countForDay})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Modo de Aplica√ß√£o da Rotina */}
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-950 flex items-center gap-1">
                                <span>‚öôÔ∏è</span> Modo de Aplica√ß√£o na Agenda:
                              </span>
                              <p className="text-[11px] text-amber-800">
                                {auraMergeMode === 'substituir' 
                                  ? 'Substituir√° as tarefas pendentes pelo planejamento selecionado.' 
                                  : 'Manter√° as tarefas atuais e adicionar√° as novas ao final.'}
                              </p>
                            </div>
                            <div className="flex gap-1 bg-white p-1 rounded-lg border border-amber-200 shrink-0">
                              <button
                                type="button"
                                onClick={() => setAuraMergeMode('substituir')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  auraMergeMode === 'substituir'
                                    ? 'bg-amber-500 text-slate-900 font-black shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                üîÑ Substituir Rotina
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuraMergeMode('adicionar')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  auraMergeMode === 'adicionar'
                                    ? 'bg-amber-500 text-slate-900 font-black shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                ‚ûï Mesclar / Adicionar
                              </button>
                            </div>
                          </div>

                          {/* Tabela com Todos os Dados Detalhados */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto shadow-inner">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                  <th className="p-2.5 w-24">Data / Dia</th>
                                  <th className="p-2.5 w-20">Hor√°rio</th>
                                  <th className="p-2.5 w-1/3">Atividade Completa</th>
                                  <th className="p-2.5">Descri√ß√£o Pedag√≥gica & BNCC</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredTasks.map((act, i) => (
                                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="p-2.5 text-slate-700 font-semibold text-[11px]">
                                      <span className="block font-bold text-indigo-900">{act.dia}</span>
                                      {act.dataStr && act.dataStr !== act.dia && (
                                        <span className="text-[10px] text-slate-500">{act.dataStr}</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 font-mono font-extrabold text-indigo-700 text-xs">{String(act.horario || '09:00')}</td>
                                    <td className="p-2.5 font-bold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <span>{String(act.titulo || 'Atividade')}</span>
                                      </div>
                                      {act.objetivoBNCC && (
                                        <span className="text-[10px] font-normal text-indigo-600 block mt-0.5">üéØ {act.objetivoBNCC}</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                                      <p>{String(act.descricao || '')}</p>
                                      {act.materiais && act.materiais.length > 0 && (
                                        <p className="text-[10px] text-amber-800 font-medium mt-1">üì¶ {act.materiais.join(', ')}</p>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { setParsedAuraTasks([]); setAuraDetectedMeta(null); }}
                                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                              >
                                Limpar Lista
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={handleCleanCorruptedTasks}
                                className="text-xs text-slate-600 font-bold hover:text-rose-600 cursor-pointer"
                                title="Limpa tarefas antigas que foram importadas com erro"
                              >
                                üßπ Limpar Tarefas com Erro Antigas
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setIsAddingTask(false)}
                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              {selectedAuraDayTab !== 'todos' && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveAuraWeeklyPlan(selectedAuraDayTab)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                                >
                                  üìÖ Salvar Apenas {selectedAuraDayTab} ({filteredTasks.length})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSaveAuraWeeklyPlan('todos')}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                              >
                                üíæ Confirmar e Cadastrar Todas ({parsedAuraTasks.length} Atividades)
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                {/* Quick Task Templates Selector */}
                <div className="space-y-2 border-b border-blue-150/60 pb-3" id="quick-task-templates-container">
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">
                    ‚ö° {isEscolar ? 'Modelos R√°pidos de Atividades Escolares' : 'Modelos R√°pidos de Cuidados S√™nior'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(isEscolar 
                      ? [
                          { tipo: 'atividade_fisica', titulo: 'Aula de Artes & Pintura üé®', horarioPrevisto: '14:00', descricao: 'Atividade pedag√≥gica de desenho com guache, l√°pis de cor e colagens.' },
                          { tipo: 'humor', titulo: 'Hora do Conto & Leitura üìñ', horarioPrevisto: '16:00', descricao: 'Conta√ß√£o de hist√≥ria l√∫dica em c√≠rculo com fantoches e livros ilustrados.' },
                          { tipo: 'atividade_fisica', titulo: 'Brincadeiras no Parquinho üèÉ', horarioPrevisto: '10:30', descricao: 'Circuito de coordena√ß√£o motora ampla com t√∫neis, bambol√™s e corrida leve.' },
                          { tipo: 'alimentacao', titulo: 'Hora da Frutinha & Hidrata√ß√£o üçé', horarioPrevisto: '15:00', descricao: 'Oferecer melancia, ma√ß√£ picada ou mamadeira de suco natural.' },
                          { tipo: 'sono', titulo: 'Soneca P√≥s-Almo√ßo üí§', horarioPrevisto: '13:00', descricao: 'Preparar colchonete, ilumina√ß√£o suave e m√∫sica instrumental relaxante.' },
                          { tipo: 'banho', titulo: 'Higiene Oral & Escovar Dentes ü™•', horarioPrevisto: '12:00', descricao: 'Escova√ß√£o de dentes assistida e lavagem das m√£os p√≥s-alimenta√ß√£o.' }
                        ]
                      : [
                          { tipo: 'sinais_vitais', titulo: 'Verificar Sinais Vitais ü©∫', horarioPrevisto: '09:00', descricao: 'Aferir press√£o arterial, satura√ß√£o e batimentos card√≠acos.' },
                          { tipo: 'medicacao', titulo: 'Medica√ß√£o de Uso Cont√≠nuo üíä', horarioPrevisto: '08:00', descricao: 'Administrar medicamentos prescritos da manh√£ com √°gua.' },
                          { tipo: 'atividade_fisica', titulo: 'Alongamento Leve & Caminhada üö∂', horarioPrevisto: '17:00', descricao: 'Caminhada leve de 15 minutos e exerc√≠cios de mobilidade.' },
                          { tipo: 'alimentacao', titulo: 'Ch√° da Tarde & Biscoitos üçµ', horarioPrevisto: '16:30', descricao: 'Oferecer ch√° morno com duas torradas e garantir ingest√£o de l√≠quidos.' }
                        ]
                    ).map((model, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewTaskForm({
                          tipo: model.tipo as any,
                          titulo: model.titulo,
                          descricao: model.descricao,
                          horarioPrevisto: model.horarioPrevisto
                        })}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100/70 border border-blue-200 hover:border-blue-300 text-[11px] font-bold text-blue-900 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        id={`btn-model-${idx}`}
                      >
                        {model.titulo}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddCustomTask} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tipo / Categoria</label>
                    <select
                      value={newTaskForm.tipo}
                      onChange={e => setNewTaskForm({ ...newTaskForm, tipo: e.target.value as TaskType })}
                      className="w-full text-xs font-semibold px-2 py-2 border border-slate-300 rounded-xl bg-white focus:ring-1 text-slate-800"
                    >
                      <option value="alimentacao">{isEscolar ? 'üç≤ Alimenta√ß√£o / Lanche' : 'üçõ Alimenta√ß√£o'}</option>
                      <option value="medicacao">{isEscolar ? 'üíä Medicamento Autorizado' : 'üíä Medicamento'}</option>
                      <option value="banho">{isEscolar ? 'üßº Banho / Higiene / Fralda' : 'üßº Banho / Higiene'}</option>
                      <option value="hidratacao">üíß Hidrata√ß√£o / L√≠quidos</option>
                      <option value="sono">{isEscolar ? 'üí§ Soneca / Descanso' : 'üí§ Sono / Repouso'}</option>
                      <option value="humor">{isEscolar ? 'üéí Humor / Socializa√ß√£o' : '‚ù§Ô∏è Humor / Estado Interno'}</option>
                      <option value="atividade_fisica">{isEscolar ? 'üé® Recrea√ß√£o / Aula de F√≠sica' : 'üö∂ Atividade F√≠sica / Passeio'}</option>
                      <option value="sinais_vitais">{isEscolar ? 'üå°Ô∏è Sinais de Sa√∫de / Febre' : 'üå°Ô∏è Sinais Vitais / Triagem'}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">T√≠tulo / Nome do Cuidado / Atividade</label>
                      <VoiceInput 
                        onTranscript={text => setNewTaskForm(prev => ({ ...prev, titulo: prev.titulo ? prev.titulo + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder={isEscolar ? "Ex: Aula de pintura guache ou conta√ß√£o de hist√≥ria" : "Ex: Oferecer ch√° de erva cidreira ou verificar curativo"}
                      value={newTaskForm.titulo}
                      onChange={e => setNewTaskForm({ ...newTaskForm, titulo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:outline-hidden bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        ‚è∞ Hor√°rio
                      </label>
                      <span className="text-[9px] text-amber-600 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Reloginho
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: 14:30"
                        value={newTaskForm.horarioPrevisto}
                        onChange={e => setNewTaskForm({ ...newTaskForm, horarioPrevisto: e.target.value })}
                        className="w-full text-xs pl-3 pr-8 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:outline-hidden bg-white text-slate-800 font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const hh = String(now.getHours()).padStart(2, '0');
                          const mm = String(now.getMinutes()).padStart(2, '0');
                          setNewTaskForm(prev => ({ ...prev, horarioPrevisto: `${hh}:${mm}` }));
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-all cursor-pointer"
                        title="Inserir hor√°rio atual"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 max-h-[44px] overflow-y-auto custom-scrollbar">
                      {['08:00', '09:30', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewTaskForm(prev => ({ ...prev, horarioPrevisto: t }))}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition-all cursor-pointer ${
                            newTaskForm.horarioPrevisto === t
                              ? 'bg-amber-400 border-amber-400 text-slate-900 font-black scale-102'
                              : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isEscolar && (
                    <div className="space-y-1 md:col-span-4 bg-white/70 p-3 rounded-xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block flex items-center gap-1">
                          üë• Alcance da Atividade
                        </span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Escolha se a atividade √© individual para <strong>{idoso.nome}</strong> ou coletiva para toda a sala de aula <strong>{getStudentClassroomLocal(idoso.nome)}</strong>.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTaskScope('individual')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            taskScope === 'individual'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" /> Individual
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskScope('coletivo')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            taskScope === 'coletivo'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" /> Classe Toda
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 md:col-span-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Instru√ß√£o / Descri√ß√£o Detalhada</label>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-indigo-600 font-bold uppercase bg-indigo-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                          üéôÔ∏è Voz
                        </span>
                        <VoiceInput 
                          onTranscript={text => setNewTaskForm(prev => ({ ...prev, descricao: prev.descricao ? prev.descricao + ' ' + text : text }))} 
                          size="sm"
                        />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={isEscolar ? "Ex: Estimular coordena√ß√£o de motricidade fina nas m√£ozinhas" : "Ex: Oferecer morno com 2 biscoitos de √°gua e sal"}
                      value={newTaskForm.descricao}
                      onChange={e => setNewTaskForm({ ...newTaskForm, descricao: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:outline-hidden bg-white text-slate-800 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-transparent"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-transparent"
                    >
                      Agendar
                    </button>
                  </div>
                </form>
                  </>
                )}
              </div>
            )}

            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {tarefas.sort((a,b) => a.horarioPrevisto.localeCompare(b.horarioPrevisto)).map((tOriginal) => {
                const task = getAdaptiveTask(tOriginal);
                const isCompleted = task.status === 'concluido';
                const isRefused = task.status === 'recusado';
                const isDelayed = task.status === 'atrasado';
                
                let borderCol = 'border-slate-200 hover:border-slate-300';
                let bgCol = 'bg-white';
                let textCol = 'text-slate-850';
                
                if (isCompleted) {
                  borderCol = 'border-emerald-250';
                  bgCol = 'bg-emerald-50/40';
                  textCol = 'text-slate-400 line-through';
                } else if (isRefused) {
                  borderCol = 'border-amber-300';
                  bgCol = 'bg-amber-50/40';
                  textCol = 'text-slate-600 line-through';
                } else if (isDelayed) {
                  borderCol = 'border-rose-300 animate-pulse';
                  bgCol = 'bg-rose-50/70';
                }

                // If this is the task being edited, render the inline editor form card
                if (editingTaskId === task.id) {
                  return (
                    <div key={task.id} className="flex flex-col border border-blue-400 bg-blue-50/20 rounded-2xl p-5 shadow-xs animate-fade-in space-y-3">
                      <h4 className="text-xs font-bold text-blue-900 border-b border-blue-100 pb-1 flex items-center gap-1 uppercase tracking-wider">
                        ‚úèÔ∏è {isEscolar ? 'Editar Atividade Escolar' : 'Editar Tarefa de Cuidado'}
                      </h4>
                      <form onSubmit={handleEditTaskSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categoria</label>
                            <select
                              value={editingTaskForm.tipo}
                              onChange={e => setEditingTaskForm({ ...editingTaskForm, tipo: e.target.value as TaskType })}
                              className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800"
                            >
                              <option value="alimentacao">Alimenta√ß√£o</option>
                              <option value="medicacao">Medicamento</option>
                              <option value="banho">Banho / Higiene</option>
                              <option value="hidratacao">Hidrata√ß√£o</option>
                              <option value="sono">Sono</option>
                              <option value="humor">Humor / Estado</option>
                              <option value="atividade_fisica">Atividade F√≠sica</option>
                              <option value="sinais_vitais">Sinais de Sa√∫de</option>
                            </select>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hor√°rio Previsto</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const now = new Date();
                                  const hh = String(now.getHours()).padStart(2, '0');
                                  const mm = String(now.getMinutes()).padStart(2, '0');
                                  setEditingTaskForm(prev => ({ ...prev, horarioPrevisto: `${hh}:${mm}` }));
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-all cursor-pointer"
                                title="Inserir hor√°rio atual"
                              >
                                <Clock className="w-3 h-3" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingTaskForm.horarioPrevisto}
                              onChange={e => setEditingTaskForm({ ...editingTaskForm, horarioPrevisto: e.target.value })}
                              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-mono text-center"
                            />
                            {/* Short time pills for edit */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {['08:00', '10:30', '13:00', '15:00', '16:30'].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setEditingTaskForm(prev => ({ ...prev, horarioPrevisto: t }))}
                                  className={`text-[8px] px-1 py-0.5 rounded font-bold border transition-all cursor-pointer ${
                                    editingTaskForm.horarioPrevisto === t
                                      ? 'bg-amber-400 border-amber-400 text-slate-900 font-black'
                                      : 'bg-white text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">T√≠tulo / Nome</label>
                            <VoiceInput 
                              onTranscript={text => setEditingTaskForm(prev => ({ ...prev, titulo: prev.titulo ? prev.titulo + ' ' + text : text }))} 
                              size="sm"
                            />
                          </div>
                          <input
                            type="text"
                            value={editingTaskForm.titulo}
                            onChange={e => setEditingTaskForm({ ...editingTaskForm, titulo: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-bold"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descri√ß√£o / Instru√ß√£o</label>
                            <VoiceInput 
                              onTranscript={text => setEditingTaskForm(prev => ({ ...prev, descricao: prev.descricao ? prev.descricao + ' ' + text : text }))} 
                              size="sm"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={editingTaskForm.descricao}
                            onChange={e => setEditingTaskForm({ ...editingTaskForm, descricao: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 resize-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-transparent"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-transparent"
                          >
                            Salvar Altera√ß√µes
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                }

                return (
                  <div key={task.id} className={`flex flex-col border ${borderCol} ${bgCol} rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 relative group`}>
                    
                    {/* Pencil & Trash2 edit tools shown for caregivers */}
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditingTaskForm({
                            id: task.id,
                            tipo: task.tipo,
                            titulo: task.titulo,
                            descricao: task.descricao,
                            horarioPrevisto: task.horarioPrevisto
                          });
                        }}
                        className="p-1 px-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title={isEscolar ? "Editar esta atividade" : "Editar esta tarefa"}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task.id, task.titulo, e)}
                        className="p-1 px-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title={isEscolar ? "Remover atividade" : "Excluir tarefa"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {(() => {
                      const isMedTask = task.tipo === 'medicacao';
                      const studentMeds = getFromDB<Medicamento[]>('anjo_medicamentos', []).filter(m => m.idosoId === idoso.id);
                      const matchingMed = isMedTask ? studentMeds.find(m => {
                        const cleanTitle = task.titulo.toLowerCase().trim();
                        const cleanName = m.nome.toLowerCase().trim();
                        const baseTitle = cleanTitle.split('(')[0].trim();
                        const baseName = cleanName.split('(')[0].trim();
                        return (
                          cleanTitle === cleanName ||
                          cleanTitle.includes(baseName) ||
                          cleanName.includes(baseTitle) ||
                          baseTitle.includes(baseName) ||
                          baseName.includes(baseTitle)
                        );
                      }) : null;

                      return (
                        <div className="flex items-start gap-4 flex-1">
                          {isMedTask && matchingMed?.fotoEmbalagem ? (
                            <button
                              type="button"
                              onClick={() => setPreviewMedPhotoModal({
                                url: matchingMed.fotoEmbalagem!,
                                title: matchingMed.nome,
                                dosagem: matchingMed.dosagem,
                                frequencia: matchingMed.frequ√™ncia,
                                horarios: matchingMed.horarios,
                                obs: matchingMed.observacoes
                              })}
                              className="relative group shrink-0 hover:scale-105 transition-all cursor-pointer text-left"
                              title="Clique para abrir e ampliar a foto da embalagem do medicamento"
                            >
                              <img
                                referrerPolicy="no-referrer"
                                src={matchingMed.fotoEmbalagem}
                                alt={matchingMed.nome}
                                className="w-14 h-14 object-cover rounded-2xl border-2 border-rose-300 bg-rose-50 shadow-xs group-hover:border-rose-500 transition-all"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-md uppercase shadow-xs flex items-center gap-0.5">
                                üì∑ Foto
                              </span>
                            </button>
                          ) : (
                            <div className="p-3 bg-slate-100 rounded-2xl shrink-0">
                              {task.tipo === 'medicacao' ? <Activity className="w-6 h-6 text-rose-500" /> : task.tipo === 'alimentacao' ? <Coffee className="w-6 h-6 text-amber-500" /> : <Droplets className="w-6 h-6 text-cyan-500" />}
                            </div>
                          )}

                          <div className="space-y-1 fill-none leading-normal pr-14 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 animate-none">
                                {task.horarioPrevisto}
                              </span>
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                {isCompleted ? '‚úì Conclu√≠do' : isRefused ? '‚ùå Recusado' : isDelayed ? 'üö® Atrasado' : '‚è≥ Pendente'}
                              </span>
                            </div>
                            <h4 className={`text-sm font-bold text-slate-800 ${textCol}`}>{task.titulo}</h4>
                            {task.descricao && (
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{task.descricao}</p>
                            )}

                            {isMedTask && (
                              <div className="mt-2 p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-base shrink-0">üíä</span>
                                  <div className="leading-tight">
                                    <span className="font-bold text-rose-950 block">
                                      Dosagem: {matchingMed?.dosagem || 'Conforme instru√ß√£o'}
                                    </span>
                                    {matchingMed?.observacoes && (
                                      <span className="text-[11px] text-rose-700 block italic">
                                        Obs da fam√≠lia: "{matchingMed.observacoes}"
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {matchingMed?.fotoEmbalagem && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMedPhotoModal({
                                      url: matchingMed.fotoEmbalagem!,
                                      title: matchingMed.nome,
                                      dosagem: matchingMed.dosagem,
                                      frequencia: matchingMed.frequ√™ncia,
                                      horarios: matchingMed.horarios,
                                      obs: matchingMed.observacoes
                                    })}
                                    className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> Ver Caixa
                                  </button>
                                )}
                              </div>
                            )}

                            {isCompleted && (
                              <div className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 p-2 rounded-xl mt-2 flex flex-col gap-0.5">
                                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Conclu√≠do √†s {task.concluidaEm} por {task.completadaPor}</span>
                                {task.observacao && <span>Relato cuidador: "{task.observacao}"</span>}
                              </div>
                            )}

                            {isRefused && (
                              <div className="text-[10px] font-semibold bg-amber-100 text-amber-800 p-2 rounded-xl mt-2 flex flex-col gap-0.5 border border-amber-200">
                                <span className="flex items-center gap-1">‚ö†Ô∏è RECUSADO / N√ÉO-ADMINISTRADO √†s {task.concluidaEm || task.horarioPrevisto} por {task.completadaPor}</span>
                                {task.observacao && <span>Justificativa: "{task.observacao}"</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-4 pt-3 border-t border-slate-150 flex flex-col gap-2">
                      {!isCompleted && !isRefused && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                              {isEscolar ? 'Observa√ß√µes da Atividade' : 'Observa√ß√µes / Relato r√°pido da a√ß√£o'}
                            </span>
                            <VoiceInput 
                              onTranscript={text => setObservacaoRapida(prev => ({ 
                                ...prev, 
                                [task.id]: (prev[task.id] ? prev[task.id] + ' ' + text : text) 
                              }))} 
                              size="sm"
                            />
                          </div>
                          <input 
                            type="text" 
                            placeholder={isEscolar ? "Ex: Realizou a atividade com capricho e aten√ß√£o" : "Ex: Tomou com suco / Cuspiu comprimido / Recusou banho"}
                            value={observacaoRapida[task.id] || ''}
                            onChange={e => setObservacaoRapida({ ...observacaoRapida, [task.id]: e.target.value })}
                            className="w-full px-3 py-1.5 border border-soft-gray rounded-xl bg-slate-50 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-1 w-full">
                        {isDelayed && (
                          <button 
                            onClick={() => {
                              const alertMsg = `Aviso Cr√≠tico: ${isEscolar ? 'O item de rotina de' : 'O rem√©dio de'} ${idoso.nome.split(' (')[0]} (${task.titulo}) previsto para ${task.horarioPrevisto} est√° pendente! Por favor verifique imediato.`;
                              triggerWhatsAppSim('ALERTA ATRAZADO', alertMsg);
                            }}
                            className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-100 shrink-0"
                          >
                            ‚ö†Ô∏è Alerta Cr√≠tico
                          </button>
                        )}
                        
                        {isCompleted || isRefused ? (
                          <button 
                            onClick={() => handleResetTask(task.id)}
                            className="ml-auto px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-500 font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 flex items-center gap-1 shrink-0"
                          >
                            ‚Ü© Corrigir / Desfazer
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 ml-auto w-full justify-end">
                            <button 
                              onClick={() => handleRegisterTaskAction(task.id, 'recusado')}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 border border-amber-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              ‚ùå Recusou
                            </button>
                            <button 
                              onClick={() => handleRegisterTaskAction(task.id, 'concluido')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                            >
                              ‚úì Entregue
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
            </div>
          </div>

        </div>
      ) : (
        // =====================================================================
        // SECTION B: FAMILY VIEW ("PAINEL DE TRANQUILIDADE")
        // =====================================================================
        <div className="space-y-6 max-w-full overflow-x-hidden">

          {/* üéÅ INDICADOR DE TESTE GRATUITO (PAINEL DOS PAIS / FAM√çLIA) */}
          {!isStaffUser(usuarioAtual) && localStorage.getItem(`anjo_sub_status_${idoso.id}`) !== 'atrasado' && (
            <div className={`p-4 rounded-3xl border text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs relative overflow-hidden transition-all ${
              accessibilitySettings?.darkMode 
                ? 'bg-[#1e293b] border-slate-700 text-white' 
                : 'bg-emerald-50/60 border-emerald-200 text-slate-850'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">üéÅ</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Per√≠odo de Experi√™ncia Ativo
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Dia 15 de 30</span>
                  </div>
                  <h4 className={`text-xs font-black leading-tight ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Seu per√≠odo de teste gratuito est√° ativo no Painel de Acompanhamento Familiar.
                  </h4>
                  <p className={`text-[10px] font-semibold leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isEscolar
                      ? `Voc√™ pode monitorar as refei√ß√µes, sono, agenda e di√°rio escolar de ${idoso.nome} com total transpar√™ncia e seguran√ßa.`
                      : `Acompanhe em tempo real os sinais vitais, medicamentos, humor e rotina di√°ria de ${idoso.nome} sem qualquer custo.`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Simulate trial end/payment required!
                  localStorage.setItem(`anjo_sub_status_${idoso.id}`, 'atrasado');
                  window.dispatchEvent(new Event('anjo_user_updated'));
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 self-end sm:self-auto"
                title="Testar simulador de tela de pagamento"
              >
                Ativar Plano Mensal üí≥
              </button>
            </div>
          )}

          {/* Real-time elegant read-only chronometer for the Family / Simplicity Panel */}
          {isAbsent ? (
            <div className="rounded-3xl p-6 border bg-rose-50 border-rose-300 shadow-xs relative overflow-hidden transition-all duration-300 animate-fade-in">
              <div className="absolute right-4 top-4">
                <UserX className="w-12 h-12 text-rose-500 opacity-20 animate-pulse" />
              </div>
              
              <div className="space-y-2 max-w-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 font-sans">
                  {isEscolar ? 'Controle de Presen√ßa Escolar' : 'Acompanhamento de Cuidados'}
                </span>
                <h2 className="text-xl font-bold text-rose-950">
                  {isEscolar ? 'üö´ Aluno Ausente Hoje (Falta)' : 'üö´ Cliente Ausente'}
                </h2>
                <p className="text-xs text-rose-700 leading-normal">
                  {isEscolar 
                    ? 'Este aluno foi marcado como ausente hoje pelo educador respons√°vel. Nenhuma atividade ou di√°rio letivo ser√° exigido.'
                    : 'Este idoso foi marcado como ausente hoje. Nenhuma rotina ou tarefa de cuidados ser√° cobrada.'
                  }
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-rose-800 bg-white/70 border border-rose-200 px-3 py-1.5 rounded-xl">
                    üîí Modo Fam√≠lia: Acesso apenas para leitura e acompanhamento.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`rounded-3xl p-6 border ${isShiftActive ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-300'} shadow-xs relative overflow-hidden transition-all duration-300 animate-fade-in`}>
              <div className="absolute right-4 top-4">
                <Clock className={`w-12 h-12 ${isShiftActive ? 'text-emerald-500 animate-spin-slow' : 'text-slate-400 opacity-30'}`} style={{ animationDuration: '30s' }} />
              </div>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {isEscolar ? 'Classe e Presen√ßa em Tempo Real' : 'Acompanhamento do Turno em Tempo Real'}
                  </span>
                  <h2 className="text-xl font-bold text-slate-800">
                    {isShiftActive 
                      ? (isEscolar ? '‚úì Per√≠odo Letivo em Andamento!' : '‚úì Cuidador em Turno Ativo!') 
                      : (isEscolar ? 'Sem Aula no Momento' : 'Sem Turno de Cuidados Ativo')
                    }
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {isShiftActive
                      ? (isEscolar 
                          ? 'O di√°rio do aluno est√° ativo! Acompanhe as sonecas, aceita√ß√£o alimentar, fraldas e recados atualizados em tempo real.'
                          : 'As rotinas, medica√ß√µes e sinais vitais est√£o sendo acompanhados pelo cuidador de escala.'
                        )
                      : (isEscolar 
                          ? 'O di√°rio de classe do aluno ainda n√£o foi iniciado pelo corpo educacional.'
                          : 'O in√≠cio do plant√£o de cuidados ainda n√£o foi registrado pelo cuidador de escala.'
                        )
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs leading-none">
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mb-1">
                      {isEscolar ? 'TEMPO EM AULA' : 'DECIDIDO / DURA√á√ÉO DO TURNO'}
                    </span>
                    <strong className={`text-2xl font-mono tracking-tight ${isShiftActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {isShiftActive ? elapsedShiftTime : '00:00:00'}
                    </strong>
                  </div>
                  
                  <span className="text-xs font-semibold text-slate-500 bg-white/60 px-3 py-2 rounded-xl border border-slate-200/80">
                    üîí Modo Fam√≠lia: Acesso de acompanhamento configurado (bot√µes de controle de turno, t√©rmino e faltas desabilitados).
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Compliance Card: Circular Ring Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* compliance dual donut block */}
            <div className="bg-white p-6 rounded-3xl border border-[#cbd5e1] shadow-xs flex flex-col justify-center text-center space-y-4">
              <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">M√©tricas de Governan√ßa</strong>
              
              <div className="flex gap-4 items-center justify-around">
                {/* Ring 1: Conformidade */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="40" 
                        className="stroke-[#f1f5f9]" strokeWidth="9" fill="transparent" 
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        className="stroke-emerald-500 transition-all duration-1000" strokeWidth="9" fill="transparent" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * complianceRate) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-800">{complianceRate}%</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Conformidade</span>
                </div>

                {/* Ring 2: Qualidade */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="40" 
                        className="stroke-[#f1f5f9]" strokeWidth="9" fill="transparent" 
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        className="stroke-indigo-600 transition-all duration-1000" strokeWidth="9" fill="transparent" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * qualityRate) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-800">{qualityRate}%</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Qualidade</span>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-500 leading-normal border-t border-slate-100 pt-3">
                {completedTasksCount} rotina(s) realizada(s) e {refusedTasksCount} recusa(s) com registro t√©cnico hoje.
              </div>
            </div>

            {/* Daily traffic light with premium visual block */}
            <div className={`p-6 rounded-3xl border ${farol.bg} shadow-xs flex flex-col justify-between md:col-span-2 relative overflow-hidden`}>
              <div className="absolute right-4 top-4 flex items-center gap-1.5">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: farol.color }}></span>
                </span>
                <span className="text-[10px] font-black uppercase text-slate-600 bg-white/65 px-2 py-0.5 rounded-full border border-slate-250">
                  Status: {farol.label}
                </span>
              </div>

              <div className="space-y-2">
                <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">SEGURAN√áA DA ROTINA hoje</strong>
                <h3 className="text-lg font-black text-slate-850">
                  {farol.status === 'verde' 
                    ? (isEscolar ? 'üéâ Tudo Sob Controle na Escola' : 'üéâ Tudo Sob Controle na Resid√™ncia') 
                    : farol.status === 'amarelo' 
                      ? (isEscolar ? '‚ö†Ô∏è Atividades e Pend√™ncias Ativas' : '‚ö†Ô∏è Cuidados e Pend√™ncias Ativas') 
                      : 'üö® Aten√ß√£o Necess√°ria Para Atrasos!'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                  {farol.details} {isEscolar ? 'O Anjinho Escolar' : 'O Anjo Cuidador'} audita e monitora cada a√ß√£o. Fique despreocupado: qualquer falha s√©ria gerar√° um alerta imediato de urg√™ncia para o seu celular.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{isEscolar ? `Respons√°vel da Classe: ${usuarioAtual.nome}` : `Respons√°vel da Escala: ${usuarioAtual.nome}`}</span>
                <span>√öltimo Contato Realizado via API: Agora mesmo</span>
              </div>
            </div>

          </div>

          {/* Core breakdown row: Hydration / Feeding / Hygiene / Mood & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Water hydration container state with visual water cups and animated jug */}
            <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">üíß CONSUMO DE √ÅGUA HOJE</strong>
                <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ü´ñ Jarrinha Animada
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-black text-cyan-600 font-mono">{totalWaterMl}ml</strong>
                    <span className="text-xs font-bold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md">
                      {Math.min(Math.round((totalWaterMl / (isEscolar ? 600 : 1500)) * 100), 100)}% da Meta
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block font-semibold">
                    Meta Di√°ria: {isEscolar ? '600ml' : '1.500ml'}
                  </span>
                </div>

                {/* ü´ñ Animated Water Jug Graphic */}
                {(() => {
                  const targetGoal = isEscolar ? 600 : 1500;
                  const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                  return (
                    <div className="flex items-center gap-2 bg-gradient-to-b from-cyan-50 to-sky-50/60 p-2.5 rounded-2xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de hidrata√ß√£o: sobe √† medida que a √°gua √© servida!">
                      <div className="relative my-0.5">
                        {/* Glass Jug Body */}
                        <div className="relative w-11 h-16 border-2 border-cyan-600 rounded-b-xl rounded-t-xs bg-white/80 overflow-hidden shadow-inner flex flex-col justify-end">
                          {/* Animated Liquid level */}
                          <div 
                            className="bg-gradient-to-t from-cyan-600 via-sky-500 to-sky-400 w-full transition-all duration-700 relative"
                            style={{ height: `${percentJug}%` }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-200 animate-pulse"></div>
                          </div>

                          {/* Level lines inside jug */}
                          <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 pointer-events-none opacity-40">
                            <div className="border-t border-cyan-800 w-full"></div>
                            <div className="border-t border-cyan-800 w-full"></div>
                            <div className="border-t border-cyan-800 w-full"></div>
                          </div>
                        </div>
                        {/* Jug Handle */}
                        <div className="absolute -right-2 top-2 bottom-2 w-2 border-2 border-l-0 border-cyan-600 rounded-r-lg pointer-events-none"></div>
                      </div>

                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-black uppercase text-cyan-800">Jarrinha</span>
                        <span className="text-base font-black text-cyan-900 font-mono leading-tight">{percentJug}%</span>
                        <span className="text-[9px] font-extrabold text-slate-500">{totalWaterMl} ml</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* cups visualizations */}
              <div className="flex gap-2.5 pt-1">
                {(isEscolar ? [50, 150, 300, 450, 550, 600] : [250, 500, 750, 1000, 1250, 1500]).map((stepWater, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 h-9 rounded-md transition-all relative ${
                      totalWaterMl >= stepWater 
                        ? 'bg-cyan-500 border-cyan-400 shadow-2xs' 
                        : 'bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white select-none">
                      {totalWaterMl >= stepWater ? '‚úì' : ''}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-400">
                {isEscolar 
                  ? 'Cada barra preenchida representa o consumo acumulado de copos ou mamadeiras graduadas (50ml, 100ml ou 150ml).' 
                  : 'Cada barra preenchida representa um copinho de 250ml oferecido com seguran√ßa ao idoso.'}
              </p>
            </div>

            {/* Food checklist state today */}
            <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">üçΩÔ∏è NUTRI√á√ÉO / ALIMENTA√á√ÉO</strong>
                {isEscolar && (() => {
                  const studentBottlesToday = todaysMealsList.filter(m => {
                    if (!m || !m.refeicao) return false;
                    const ref = String(m.refeicao).toLowerCase();
                    return ref === 'mamadeira' || ref.includes('mamad') || (m.observacoes && m.observacoes.toLowerCase().includes('mamadeira'));
                  });
                  return (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                      üçº {studentBottlesToday.length} {studentBottlesToday.length === 1 ? 'Mamadeira' : 'Mamadeiras'}
                    </span>
                  );
                })()}
              </div>
              
              <div className="space-y-2">
                {isEscolar && (() => {
                  const studentBottlesToday = todaysMealsList.filter(m => {
                    if (!m || !m.refeicao) return false;
                    const ref = String(m.refeicao).toLowerCase();
                    return ref === 'mamadeira' || ref.includes('mamad') || (m.observacoes && m.observacoes.toLowerCase().includes('mamadeira'));
                  });
                  const totalBottlesMl = studentBottlesToday.reduce((acc, curr) => acc + (Number(curr.quantidadeMl) || 180), 0);
                  const lastBottle = studentBottlesToday[studentBottlesToday.length - 1];

                  return (
                    <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between text-xs font-bold text-amber-950 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">üçº</span>
                        <div>
                          <span className="block text-xs font-extrabold">Mamadeiras de Leite / F√≥rmula</span>
                          <span className="text-[10px] text-amber-800 font-normal block">
                            {lastBottle?.horario ? `√öltima servida √†s ${lastBottle.horario}` : 'Controle de mamadeiras di√°rias'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-white text-amber-900 rounded-lg border border-amber-200 font-black text-[10px]">
                        {studentBottlesToday.length} {studentBottlesToday.length === 1 ? 'servida' : 'servidas'} ({totalBottlesMl > 0 ? totalBottlesMl : studentBottlesToday.length * 180} ml)
                      </span>
                    </div>
                  );
                })()}

                {[
                  { key: 'cafe_manha', label: isEscolar ? 'ü•ê Lanchinho da Manh√£' : 'Caf√© da Manh√£' },
                  { key: 'almoco', label: isEscolar ? 'üç≤ Papinha / Almocinho' : 'Almo√ßo Principal' },
                  { key: 'lanche', label: isEscolar ? 'üçé Frutinha / Lanchinho' : 'Lanche / Tarde' },
                  { key: 'jantar', label: isEscolar ? 'ü•£ Jantinha Escolar' : 'Jantar S√™nior' }
                ].map(itemMeal => {
                  const verified = [...todaysMealsList].reverse().find(m => {
                    if (!m || !m.refeicao) return false;
                    const ref = String(m.refeicao).toLowerCase().trim();
                    // Mamadeiras s√£o refei√ß√µes l√°cteas separadas e gerenciadas no bloco de mamadeiras acima
                    if (ref === 'mamadeira' || ref.includes('mamad')) return false;

                    if (ref === itemMeal.key) return true;
                    if (itemMeal.key === 'cafe_manha') {
                      return (ref.includes('cafe') || ref.includes('caf√©') || ref.includes('desjejum')) && !ref.includes('mamad') && !ref.includes('lanche da tarde');
                    }
                    if (itemMeal.key === 'almoco') {
                      return ref.includes('almoc') || ref.includes('almo√ß') || ref.includes('papi') || ref.includes('principal');
                    }
                    if (itemMeal.key === 'lanche') {
                      return (ref.includes('lanche') || ref.includes('frut') || ref.includes('tarde') || ref.includes('snack')) && !ref.includes('manh√£') && !ref.includes('manha');
                    }
                    if (itemMeal.key === 'jantar') {
                      return ref.includes('jantar') || ref.includes('ceia') || ref.includes('noturn');
                    }
                    return false;
                  });
                  return (
                    <div key={itemMeal.key} className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">{itemMeal.label}</span>
                      {verified ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 uppercase text-[9px] flex items-center gap-1">
                          ‚úì {verified.aceitacao === 'muito_bem' ? 'Comeu Super Bem' : verified.aceitacao === 'pouco' ? 'Comeu Pouco' : 'Recusou'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md uppercase text-[9px]">
                          Pendente
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hygiene tracker block */}
            <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">üßº HIGIENE & BEM ESTAR</strong>
                  <p className="text-xs text-slate-500 leading-normal mt-1 font-sans">
                    {isEscolar 
                      ? 'Acompanhamento di√°rio de conforto e asseio do aluno. Frequ√™ncia de trocas de fralda, dentes, roupas e higiene.' 
                      : 'Acompanhamento di√°rio de conforto corporal. Focar na preven√ß√£o de escaras e infec√ß√µes.'}
                  </p>
                </div>

                {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (todayHygieneLog?.observations || todayHygieneLog?.diaper || todayHygieneLog?.teeth || todayHygieneLog?.clothes || todayHygieneLog?.hands || todayHygieneLog?.bath || todayHygieneLog?.cream) && (
                  <button
                    type="button"
                    onClick={(e) => handleResetAllHygiene(e)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-[11px] font-bold rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                    title="Desmarcar itens e apagar a observa√ß√£o de higiene de hoje"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Tudo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 1. Troca de Fralda / Toalete */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all ${
                  todayHygieneLog?.diaper 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? 'üë∂ Fralda / Toalete' : 'üë∂ Fralda / Absorvente'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.diaper ? 'Trocada / Cuidada' : 'Pendente'}
                  </span>
                </div>

                {/* 2. Escova√ß√£o de Dentes Orientada */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all ${
                  todayHygieneLog?.teeth 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? 'ü™• Escova√ß√£o Dentes' : 'ü™• Higiene Bucal'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.teeth ? 'Realizada' : 'Pendente'}
                  </span>
                </div>

                {/* 3. Troca de Roupa */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all ${
                  todayHygieneLog?.clothes 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? 'üëö Troca de Roupa' : 'üëö Roupa Limpa'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.clothes ? 'Trocada' : 'Pendente'}
                  </span>
                </div>

                {/* 4. M√£os e Rosto / Banho */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all ${
                  (todayHygieneLog?.hands || todayHygieneLog?.bath) 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? 'üßº M√£os e Rosto' : 'üöø Banho Chuveiro'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {(todayHygieneLog?.hands || todayHygieneLog?.bath) ? (isEscolar ? 'Lavados' : 'Conclu√≠do') : 'Pendente'}
                  </span>
                </div>

                {/* 5. Pomada Antiassadura / Protetor */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all col-span-2 sm:col-span-1 ${
                  todayHygieneLog?.cream 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? 'üß¥ Pomada Antiassadura' : 'üß¥ Hidrata√ß√£o Pele'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.cream ? 'Aplicada' : 'Pendente'}
                  </span>
                </div>
              </div>

              {todayHygieneLog?.observations && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 block">Observa√ß√£o de Higiene:</span>
                    <p className="text-slate-800 leading-relaxed">{todayHygieneLog.observations}</p>
                  </div>
                  {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHygieneObservation(e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Apagar observa√ß√£o de higiene"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Registered Occurrences / Care Notes List */}
              {occurrencesList && occurrencesList.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    üö® Ocorr√™ncias / Registros de Cuidados do Dia ({occurrencesList.length})
                  </span>
                  <div className="space-y-1.5">
                    {occurrencesList.map(occ => (
                      <div key={occ.id} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-950 rounded-md text-[10px] uppercase font-black">
                              {occ.tipo || 'Ocorr√™ncia'}
                            </span>
                            <span className="text-slate-500 text-[10px]">{occ.horario || ''}</span>
                          </div>
                          <p className="text-slate-700">{occ.descricao}</p>
                        </div>
                        {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOccurrence(occ.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Apagar este registro de ocorr√™ncia/cuidado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mood & Caregiver / Teacher Note card state üòä */}
            {(() => {
              const humsToday = getFromDB<RegistroHumor[]>('anjo_humor', []).filter(h => h && h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
              const currentHum = humsToday.length > 0 ? humsToday[humsToday.length - 1] : null;

              const getMoodInfo = (estado?: string) => {
                switch (estado) {
                  case 'calmo':
                    return { label: 'Calmo / Sereno', emoji: 'üòä', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
                  case 'feliz':
                    return { label: 'Feliz / Comunicativo', emoji: 'üòÑ', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
                  case 'sonolento':
                    return { label: 'Sonolento / Repousando', emoji: 'üí§', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
                  case 'agitado':
                    return { label: 'Agitado / Inquieto', emoji: '‚ö†Ô∏è', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
                  case 'confuso':
                    return { label: 'Desorientado / Confuso', emoji: '‚ùì', bg: 'bg-orange-50 text-orange-800 border-orange-200' };
                  case 'recusando':
                    return { label: 'Resiste √†s Interven√ß√µes', emoji: '‚ùå', bg: 'bg-red-50 text-red-800 border-red-200' };
                  default:
                    return { label: estado ? estado.toUpperCase() : 'Calmo / Sereno', emoji: 'üòä', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
                }
              };

              const moodInfo = getMoodInfo(currentHum?.estado || quickHumor.estado);

              return (
                <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                        üòä {isEscolar ? 'HUMOR & NOTA DA EDUCADORA' : 'ESTADO DE HUMOR / NOTA'}
                      </strong>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        S√≥cio-Emocional
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Estado Reportado Hoje:
                      </span>
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 font-bold ${moodInfo.bg}`}>
                        <span className="text-2xl shrink-0">{moodInfo.emoji}</span>
                        <div>
                          <strong className="text-xs block leading-tight">{moodInfo.label}</strong>
                          <span className="text-[9px] opacity-80 block font-semibold">
                            {currentHum?.horario ? `Registrado √†s ${currentHum.horario}` : 'Registrado no Turno'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {isEscolar ? 'Nota / Observa√ß√£o da Educadora:' : 'Nota / Observa√ß√£o do Cuidador:'}
                      </span>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic min-h-[60px] flex items-center">
                        {currentHum?.observacoes || quickHumor.observacao ? (
                          <span>"{currentHum?.observacoes || quickHumor.observacao}"</span>
                        ) : (
                          <span className="text-slate-400 not-italic text-[11px]">
                            {isEscolar ? 'Nenhuma observa√ß√£o comportamental anotada no momento.' : 'Nenhuma observa√ß√£o anotada no momento.'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{isEscolar ? 'Acompanhamento Escolar' : 'Auditoria de Bem-Estar'}</span>
                    <span className="text-indigo-600 font-bold">
                      {currentHum?.registradoPor ? `Por: ${currentHum.registradoPor.split(' ')[0]}` : 'Equipe do Anjinho'}
                    </span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* VITAL SIGNS AUDIT BLOCK WITH COMPACT SPARK CARDS */}
          <div className="space-y-3">
            <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              {isFundamental ? 'üìù DI√ÅRIO DE ACOMPANHAMENTO PEDAG√ìGICO & FOCO' : (isEscolar ? 'üìù DI√ÅRIO DE SA√öDE, SONO & FRALDA' : 'üíì MONITORAMENTO DE SINAIS VITAIS')}
            </strong>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              
              <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {isFundamental ? '‚úèÔ∏è Dever de Casa' : (isEscolar ? 'üí§ Soneca / Sono' : 'P. Arterial')}
                  </span>
                  <strong className="text-sm font-bold text-slate-800 line-clamp-2 mt-1">
                    {isFundamental 
                      ? (latestVitals ? latestVitals.pressaoArterial : 'Sem registros')
                      : (isEscolar 
                        ? (latestVitals?.soneca && latestVitals.soneca !== 'Sem registros' 
                            ? latestVitals.soneca 
                            : (latestVitals?.pressaoArterial && (latestVitals.pressaoArterial.includes(':') || latestVitals.pressaoArterial.toLowerCase().includes('dormiu') || latestVitals.pressaoArterial.toLowerCase().includes('soneca')) 
                                ? latestVitals.pressaoArterial 
                                : (sleepSummary || 'Sem registros')))
                        : (latestVitals ? `${latestVitals.pressaoArterial} mmHg` : '120/80 mmHg'))}
                  </strong>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                  {isFundamental ? 'Deveres' : (isEscolar ? 'Per√≠odo' : (latestVitals ? 'Aferido Hoje' : 'Excelente'))}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {isFundamental ? 'üéØ Foco / Conduta' : (isEscolar ? 'üßª Fraldas (Trocas)' : 'Glicemia Capilar')}
                  </span>
                  <strong className="text-sm font-bold text-slate-800 line-clamp-2 mt-1">
                    {isFundamental 
                      ? (latestVitals?.fralda || 'Focado / Atento')
                      : (isEscolar 
                        ? (latestVitals?.fralda && latestVitals.fralda !== 'Sem trocas'
                            ? latestVitals.fralda
                            : (todayHygieneLog?.observations && todayHygieneLog.observations.length > 0
                                ? todayHygieneLog.observations
                                : (todayHygieneLog?.diaper 
                                    ? `Trocada / Cuidada (${todayHygieneLog.time || 'Hoje'})`
                                    : 'Verificada / Limpa')))
                        : (latestVitals ? `${latestVitals.glicemia} mg/dL` : '95 mg/dL'))}
                  </strong>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                  {isFundamental ? 'Comportamento' : (isEscolar ? 'Registro' : (latestVitals ? `Tipo: ${latestVitals.tipoGlicemia || 'casual'}` : 'Jejum Est√°vel'))}
                </span>
              </div>

              {/* COMPACT BOTTLE / MAMADEIRA CARD üçº (Infantil / Maternal / Ber√ß√°rio / Pr√©) */}
              {isEscolar && !isFundamental && (
                <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      üçº Mamadeiras Servidas
                    </span>
                    <strong className="text-xl font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <span>{studentBottlesToday.length}</span>
                      <span className="text-xs font-bold text-slate-500">
                        {studentBottlesToday.length === 1 ? 'mamadeira' : 'mamadeiras'}
                      </span>
                    </strong>
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm self-start mt-2 border border-amber-150">
                    {studentBottlesToday.length > 0 
                      ? (studentBottlesToday[studentBottlesToday.length - 1]?.horario 
                          ? `√öltima √†s ${studentBottlesToday[studentBottlesToday.length - 1].horario} (${totalBottlesMl} ml total)` 
                          : `${totalBottlesMl} ml total`) 
                      : 'Nenhuma hoje'}
                  </span>
                </div>
              )}

              {/* COMPACT MATERIAL / CADERNOS CARD üìö (Fundamental) */}
              {isFundamental && (
                <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      üìö Material / Cadernos
                    </span>
                    <strong className="text-sm font-bold text-slate-800 line-clamp-2 mt-1">
                      {latestVitals?.saturacao ? `${latestVitals.saturacao}` : 'Cadernos e estojo completos'}
                    </strong>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm self-start mt-2 border border-indigo-150">
                    Materiais
                  </span>
                </div>
              )}

              <div className="bg-white p-4 rounded-xl border border-soft-gray flex justify-between items-center gap-2">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {isFundamental ? 'üíß Hidrata√ß√£o / Copos' : (isEscolar ? 'üíß Hidrata√ß√£o (√Ågua)' : 'Oxigena√ß√£o (SpO2)')}
                    </span>
                    <strong className="text-xl font-bold text-slate-800">
                      {isEscolar 
                        ? `${totalWaterMl} ml (${todaysWaterList.length} ${todaysWaterList.length === 1 ? 'copo' : 'copos'})`
                        : `${totalWaterMl}ml (${todaysWaterList.length} ${todaysWaterList.length === 1 ? 'copo' : 'copos'})`}
                    </strong>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                    {isEscolar ? 'Consumo' : (latestVitals ? (latestVitals.saturacao >= 95 ? 'Excelente (Normal)' : 'Aten√ß√£o Baixo') : 'Excelente (Normal)')}
                  </span>
                </div>

                {/* ü´ñ Mini Jarrinha Animada em Tempo Real */}
                {(() => {
                  const targetGoal = isEscolar ? 600 : 1500;
                  const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                  return (
                    <div className="flex items-center gap-1.5 bg-cyan-50/80 px-2 py-1 rounded-xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de Hidrata√ß√£o">
                      <div className="relative my-0.5">
                        <div className="relative w-7 h-10 border-2 border-cyan-600 rounded-b-lg rounded-t-xs bg-white/90 overflow-hidden shadow-inner flex flex-col justify-end">
                          <div 
                            className="bg-gradient-to-t from-cyan-600 via-sky-500 to-sky-400 w-full transition-all duration-700 relative"
                            style={{ height: `${percentJug}%` }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-200 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="absolute -right-1.5 top-1 bottom-1 w-1.5 border-2 border-l-0 border-cyan-600 rounded-r-md pointer-events-none"></div>
                      </div>
                      <div className="flex flex-col text-left space-y-0.5">
                        <span className="text-[8px] font-black uppercase text-cyan-800">Jarrinha</span>
                        <span className="text-xs font-black text-cyan-900 font-mono leading-none">{percentJug}%</span>
                        <span className="text-[8px] font-bold text-slate-500">{totalWaterMl}ml</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Temperatura</span>
                  <strong className="text-xl font-bold text-slate-800">
                    {latestVitals ? `${latestVitals.temperatura.toFixed(1).replace('.', ',')} ¬∞C` : '36,5 ¬∞C'}
                  </strong>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                  {latestVitals ? (latestVitals.temperatura >= 37.8 ? 'Febre ‚ö†Ô∏è' : 'Afebril') : 'Afebril'}
                </span>
              </div>

              {/* INTERACTIVE WEIGHT CARD ‚öñÔ∏è */}
              <div 
                id="clinical-weight-card"
                onClick={() => onNavigate('reports')} 
                className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 flex flex-col justify-between hover:bg-indigo-100/80 active:scale-98 transition-all cursor-pointer group"
                title="Clique para ir ao Gr√°fico de Evolu√ß√£o de Peso nos Relat√≥rios"
              >
                <div>
                  <span className="text-[10px] font-black text-indigo-500 block uppercase flex items-center justify-between">
                    <span>{isEscolar ? '‚öñÔ∏è Peso Escolar' : '‚öñÔ∏è Peso (Controle Semanal)'}</span>
                    <span className="text-indigo-600 bg-white border border-indigo-150 px-1 py-0.2 text-[8px] rounded-xs group-hover:scale-105 transition-transform">Ver Hist√≥rico</span>
                  </span>
                  <strong className="text-xl font-bold text-slate-800">
                    {latestWeight ? `${latestWeight} kg` : (isEscolar ? '12,5 kg' : '72,4 kg')}
                  </strong>
                </div>
                <div className="text-[10px] font-bold mt-2">
                  {latestWeight && previousWeight ? (
                    weightDiff === 0 ? (
                      <span className="text-emerald-750 bg-white px-1.5 py-0.5 rounded-md border border-emerald-100">Est√°vel (0.0 kg)</span>
                    ) : weightDiff > 0 ? (
                      <span className="text-indigo-700 bg-white px-1.5 py-0.5 rounded-md border border-indigo-150">+{weightDiff.toFixed(1)} kg (Ganho)</span>
                    ) : (
                      <span className="text-rose-700 bg-white px-1.5 py-0.5 rounded-md border border-rose-150">{weightDiff.toFixed(1)} kg (Perda)</span>
                    )
                  ) : (
                    <span className="text-indigo-650 bg-white px-1.5 py-0.5 rounded-md border border-indigo-100">Controle Ativo</span>
                  )}
                </div>
              </div>

              {/* COMPACT HUMOR & BEHAVIOR CARD üß† */}
              {(() => {
                const humsToday = getFromDB<RegistroHumor[]>('anjo_humor', []).filter(h => h && h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
                const currentHum = humsToday.length > 0 ? humsToday[humsToday.length - 1] : null;
                const stateDisplay = currentHum?.estado || quickHumor.estado || 'calmo';
                const emoji = stateDisplay === 'feliz' ? 'üòÑ' : stateDisplay === 'sonolento' ? 'üí§' : stateDisplay === 'agitado' ? '‚ö†Ô∏è' : stateDisplay === 'confuso' ? '‚ùì' : stateDisplay === 'recusando' ? '‚ùå' : 'üòä';
                const label = stateDisplay === 'feliz' ? 'Feliz' : stateDisplay === 'sonolento' ? 'Sonolento' : stateDisplay === 'agitado' ? 'Agitado' : stateDisplay === 'confuso' ? 'Confuso' : stateDisplay === 'recusando' ? 'Recusando' : 'Calmo / Sereno';

                return (
                  <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {isEscolar ? 'üòä Humor / Conduta' : 'üòä Estado de Humor'}
                      </span>
                      <strong className="text-sm font-bold text-slate-800 line-clamp-2 mt-1 flex items-center gap-1.5">
                        <span>{emoji}</span> <span>{label}</span>
                      </strong>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                      {currentHum?.observacoes || quickHumor.observacao ? 'Com Nota da Prof¬™' : 'Observado no Dia'}
                    </span>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* CHRONOLOGICAL TIMELINE OF TODAY'S ACTIONS (Com dupla marca√ß√£o temporal!) */}
          <div className="space-y-4">
            <h3 className="text-md font-black text-slate-800 flex items-center gap-1.5">
              <Layers className="text-emerald-600 w-5 h-5" /> Linha do Tempo e Auditoria de Sa√∫de
            </h3>

            {timelineItems.length === 0 ? (
              <div className="p-6 border border-dashed rounded-2xl bg-white text-center text-slate-400 text-xs font-semibold">
                Nenhuma a√ß√£o conclu√≠da na data de hoje at√© o momento.
              </div>
            ) : (
              <div className="relative border-l border-emerald-300 ml-4 pl-6 space-y-5">
                {timelineItems.map((tItem, i) => {
                  const tieneDobleTiempo = tItem.meta && tItem.meta.status_sincronizacao === 'offline_sincronizado';
                  return (
                    <div key={tItem.id || i} className="relative">
                      {/* circle dot */}
                      <span className="absolute -left-10 top-1 w-7 h-7 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center text-[10px] shadow-sm font-bold text-emerald-600">
                        {i + 1}
                      </span>
                      
                      <div className="bg-white p-4 rounded-2xl border border-[#cbd5e1] space-y-1.5 shadow-2xs leading-normal">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-full">
                            üïí Hor√°rio Registrado: {tItem.horario}
                          </span>
                          
                          {tieneDobleTiempo && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              üì∂ Registrado Offline no Celular √†s {new Date(tItem.meta.horario_registrado_dispositivo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}  |  Servidor: {new Date(tItem.meta.horario_sincronizado_servidor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-black text-slate-800 block pt-0.5">{tItem.titulo}</h4>
                        {tItem.nota && <p className="text-xs text-slate-600 italic">" {tItem.nota} "</p>}
                        
                        <div className="text-[10px] font-bold text-slate-400 pt-1 flex items-center gap-1.5">
                          <User className="w-3 w-3" /> Executor Respons√°vel: {tItem.autor}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HISTORICAL SHIFT SUMMARIES (RESUMOS DE TURNO ANTERIORES) */}
          <div className="space-y-4">
            <h3 className="text-md font-black text-slate-850 flex items-center gap-1.5">
              <FileText className="text-indigo-505 w-5 h-5" /> {isEscolar ? 'Di√°rios de Rotina Escolar Recebidos' : 'Relat√≥rios e Resumos de Turno Recebidos (WhatsApp)'}
            </h3>

            {turnSummaries.length === 0 ? (
              <div className="p-6 border border-dashed rounded-2xl bg-white text-center text-slate-400 text-xs font-semibold">
                {isEscolar 
                  ? 'Nenhum di√°rio de rotina escolar enviado hoje ainda. Os di√°rios aparecem aqui assim que a professora encerra o per√≠odo letivo da crian√ßa no aplicativo.'
                  : 'Nenhum relat√≥rio de encerramento de turno enviado hoje ainda. Os relat√≥rios aparecem aqui assim que o cuidador clica em "Encerrar Turno" no aplicativo.'}
              </div>
            ) : (
              <div className="space-y-3.5">
                {turnSummaries.map(report => (
                  <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-[#cbd5e1] space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <strong className="text-xs text-slate-800 block">
                          {isEscolar ? `Di√°rio Escolar de ${report.cuidador}` : `Resumo do Turno de ${report.cuidador}`}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {report.timestamp ? new Date(report.timestamp).toLocaleDateString('pt-BR') : (report.data || getTodayBr())}  ‚Ä¢  Per√≠odo: {formatShiftTime(report.inicio, '07:30')} √†s {formatShiftTime(report.fim, '17:30')}
                        </span>
                      </div>
                      <div className="text-right leading-none">
                        <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">AUDIT TOTAL</span>
                        <strong className="text-sm font-black text-emerald-600">{report.taxaConformidade}% OK</strong>
                      </div>
                    </div>
                    
                    <pre className="text-xs text-slate-650 bg-slate-50 p-4 rounded-xl font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-56">
                      {report.mensagemCompleta}
                    </pre>

                    {/* Interactive Direct Report Link & Action Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">üîó</span>
                        <div className="min-w-0">
                          <span className="block font-black text-[11px] text-indigo-900 dark:text-indigo-100">
                            Link Seguro do Di√°rio Digital:
                          </span>
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 underline underline-offset-2 truncate block">
                            {window.location.origin}/?relatorio={report.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReportModal(report)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <span>üëÅÔ∏è</span> Abrir Di√°rio Digital 360¬∫
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?relatorio=${report.id}`;
                            navigator.clipboard.writeText(link);
                            showToast('‚úì Link do di√°rio escolar copiado para a √°rea de transfer√™ncia!');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>üìã</span> Copiar Link
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Excluir este di√°rio de rotina permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">‚úì Controle de auditoria de acessos</span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setManualShareOccurrenceMessage(report.mensagemCompleta);
                            setShowManualOccurrenceShareModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-[10px] px-2.5 py-1 text-white font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer hover:text-white"
                        >
                          <span>üí¨</span> Compartilhar WhatsApp
                        </button>
                        <span>Dura√ß√£o: {report.duracao}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
      {/* MODAL: REGISTRAR SA√çDA / DESLIGAR CRON√îMETRO INDIVIDUAL */}
      {showStopIndividualShiftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                <Square className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  ‚èπÔ∏è Registrar Sa√≠da / Aus√™ncia de Aluno
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Aluno: <strong className="text-slate-800">{(idoso.nome || '').split(' (')[0]}</strong>
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 leading-relaxed font-medium flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Informa√ß√£o LGPD e Relat√≥rios:</strong>
                O cron√¥metro deste aluno ser√° desligado e o registro de sa√≠da ser√° salvo no relat√≥rio com data, hor√°rio e motivo. <span className="underline font-bold">As atividades do dia permanecem salvas e salvas intactas.</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Selecione ou digite o motivo da sa√≠da:
              </label>

              {/* Preset Quick Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'ü©∫ Consulta M√©dica / Exame',
                  'üöó Pais / Respons√°veis buscaram mais cedo',
                  'ü§í Mal-estar / Sintomas de Sa√∫de',
                  'üè† Aus√™ncia Tempor√°ria / Particular',
                  'üìã Fim das Aulas / Sa√≠da Normal'
                ].map((reasonOption) => {
                  const isSelected = stopShiftReason === reasonOption;
                  return (
                    <button
                      key={reasonOption}
                      type="button"
                      onClick={() => setStopShiftReason(reasonOption)}
                      className={`text-left p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {reasonOption}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Observa√ß√£o Adicional / Detalhes (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={stopShiftNote}
                  onChange={e => setStopShiftNote(e.target.value)}
                  placeholder="Ex: M√£e veio buscar √†s 14:30 para ir ao dentista..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStopIndividualShiftModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStopIndividualShift}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Confirmar Sa√≠da e Desligar
              </button>
            </div>
          </div>
        </div>
      )}

      {showOccurrenceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              {occurrenceForm.criticidade === 'vermelho' ? (
                <ShieldAlert className="text-red-600 w-7 h-7 animate-pulse shrink-0" />
              ) : (
                <FileText className="text-amber-500 w-7 h-7 shrink-0" />
              )}
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  {occurrenceForm.criticidade === 'vermelho' ? 'üö® Registrar Intercorr√™ncia Urgente' : 'üìã Registrar Ocorr√™ncia do Dia'}
                </h3>
                <p className="text-xs text-slate-500">
                  {occurrenceForm.criticidade === 'vermelho'
                    ? 'Alerta cr√≠tico para emerg√™ncias de sa√∫de, febre, quedas ou incidentes'
                    : 'Registro de rotina para comportamento, desentendimento ou observa√ß√µes'}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmOccurrence} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tipo de Ocorr√™ncia</label>
                <select 
                  value={occurrenceForm.tipo}
                  onChange={e => setOccurrenceForm({ ...occurrenceForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="queda">Queda üö®</option>
                  <option value="febre">Febre üå°Ô∏è</option>
                  <option value="dor">Dor ü§ï</option>
                  <option value="recusa_medicacao">Recusa de medica√ß√£o üíä</option>
                  <option value="recusa_alimentar">Recusa alimentar üçΩÔ∏è</option>
                  <option value="comportamento">Altera√ß√£o de comportamento üß†</option>
                  <option value="pressao">Press√£o alterada üíì</option>
                  <option value="outro">Outro (Relatar) üîç</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">N√≠vel de Criticidade</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOccurrenceForm({ ...occurrenceForm, criticidade: 'amarelo' })}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      occurrenceForm.criticidade === 'amarelo'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 font-black'
                        : 'border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold'
                    }`}
                  >
                    üü° Aten√ß√£o recomend√°vel
                  </button>
                  <button
                    type="button"
                    onClick={() => setOccurrenceForm({ ...occurrenceForm, criticidade: 'vermelho' })}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      occurrenceForm.criticidade === 'vermelho'
                        ? 'border-red-400 bg-red-50 text-red-950 font-black'
                        : 'border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold'
                    }`}
                  >
                    üî¥ Urg√™ncia Cr√≠tica
                  </button>
                </div>
              </div>

              {occurrenceForm.criticidade === 'vermelho' && idoso.contatoEmergencia && (
                <div className="bg-red-50 border border-red-300 p-4 rounded-2xl space-y-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-red-600 w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-red-955 uppercase tracking-wider">
                        Contatar Imediatamente os Familiares!
                      </h4>
                      <p className="text-[10px] text-red-700 leading-normal font-bold">
                        Como voc√™ selecionou Urg√™ncia Cr√≠tica, ligue ou mande mensagem agora mesmo para o respons√°vel legal.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/95 p-3 rounded-xl border border-red-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-3xs">
                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-black text-slate-800 block truncate">
                        {idoso.contatoEmergencia.nome} ({idoso.contatoEmergencia.parentesco})
                      </strong>
                      <span className="text-[10px] text-slate-500 font-bold block truncate">
                        Telefone: {idoso.contatoEmergencia.telefone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Normal call */}
                      <a 
                        href={`tel:${idoso.contatoEmergencia.telefone}`}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-3xs"
                        title="Fazer liga√ß√£o comum por telefone"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ligar</span>
                      </a>
                      
                      {/* WhatsApp call */}
                      <a 
                        href={`https://wa.me/${formatWhatsAppNumber(idoso.contatoEmergencia.telefone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-3xs"
                        title="Fazer chamada no WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 12.008 0c3.237.001 6.278 1.261 8.567 3.551 2.289 2.289 3.548 5.331 3.548 8.568 0 6.678-5.32 12.002-12 12.002-1.993 0-3.95-.494-5.69-1.436L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.8 1.45 5.516 0 10-4.485 10-10 .003-5.515-4.484-10-10-10-5.517 0-10 4.484-10 10 0 1.9.5 3.5 1.45 5.1l-.95 3.5 3.7-.95zm10.742-5.466c-.29-.145-1.714-.848-1.98-.942-.262-.096-.453-.145-.642.145-.19.29-.733.941-.898 1.133-.165.19-.33.21-.62.066-.29-.145-1.22-.45-2.324-1.433-.86-.767-1.44-1.716-1.61-2.006-.17-.29-.018-.447.127-.591.13-.13.29-.33.435-.496.145-.165.193-.282.29-.47.097-.19.049-.356-.024-.5-.072-.145-.64-1.545-.878-2.113-.23-.557-.464-.48-.642-.49-.165-.008-.356-.01-.548-.01-.19 0-.501.072-.763.356-.262.282-1 .978-1 2.387 0 1.41 1.026 2.77 1.17 2.96.145.19 2.019 3.084 4.891 4.324.683.294 1.217.47 1.633.6.686.22 1.31.19 1.8.118.55-.08 1.714-.7 1.956-1.378.24-.678.24-1.258.17-1.378-.07-.12-.26-.19-.55-.335z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Relato Descritivo Detalhado</label>
                  <VoiceInput 
                    onTranscript={text => setOccurrenceForm(prev => ({ ...prev, descricao: prev.descricao ? prev.descricao + ' ' + text : text }))} 
                    size="sm"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={occurrenceForm.descricao}
                  onChange={e => setOccurrenceForm({ ...occurrenceForm, descricao: e.target.value })}
                  placeholder="Seja descritivo. Ex: Se desequilibrou ao levantar da cama, caiu sentado no tapete. Sem sinais de fratura, press√£o aferida 12/8 est√°vel. Queixou leve dor nas costas."
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs text-slate-800 leading-normal focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowOccurrenceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Enviar Alerta Familiares
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManualOccurrenceShareModal && manualShareOccurrenceMessage && (() => {
        const activeOccurrence = occurrencesList.find(o => o.id === activeSharingOccurrenceId);
        const auditStatus = activeOccurrence?.statusEnvioWhatsApp || 'mensagem_gerada';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto animate-fade-in" id="manual-occurrence-share-modal">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-6">
              
              {/* Header section with our brand and clear Assisted dispatch philosophy */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0" style={{ animationDuration: '4s' }}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-800 truncate">Envio Assistido via WhatsApp</h3>
                  <p className="text-xs text-slate-500">
                    {isEscolar
                      ? 'O Anjo Escolar gera a mensagem padronizada e abre o WhatsApp para que o professor ou coordenador confirme o envio aos pais.'
                      : 'O Anjo Cuidador gera a mensagem padronizada e abre o WhatsApp para que o cuidador confirme o envio.'}
                  </p>
                </div>
              </div>

              {/* Dynamic 3-stage Audit Trail indicators if sharing an occurrence */}
              {activeSharingOccurrenceId && (
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Hist√≥rico de Auditoria do Alerta</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center space-y-1">
                      <div className="mx-auto w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                        ‚úì
                      </div>
                      <span className="text-[9px] font-bold text-slate-700 block">Mensagem gerada</span>
                      <span className="text-[7px] text-slate-400 font-medium block">Pelo app</span>
                    </div>

                    <div className="text-center space-y-1">
                      <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                        auditStatus === 'whatsapp_aberto' || auditStatus === 'envio_confirmado'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {auditStatus === 'whatsapp_aberto' || auditStatus === 'envio_confirmado' ? '‚úì' : '2'}
                      </div>
                      <span className={`text-[9px] font-bold block ${
                        auditStatus === 'whatsapp_aberto' || auditStatus === 'envio_confirmado' ? 'text-slate-700' : 'text-slate-400'
                      }`}>WhatsApp aberto</span>
                      <span className="text-[7px] text-slate-400 font-medium block">Pelo cuidador</span>
                    </div>

                    <div className="text-center space-y-1">
                      <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                        auditStatus === 'envio_confirmado'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {auditStatus === 'envio_confirmado' ? '‚úì' : '3'}
                      </div>
                      <span className={`text-[9px] font-bold block ${
                        auditStatus === 'envio_confirmado' ? 'text-slate-700' : 'text-slate-400'
                      }`}>Envio confirmado</span>
                      <span className="text-[7px] text-slate-400 font-medium block">Finalizado</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Compiled message text layout with interactive Copy feedback */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Mensagem Padronizada do Dia</span>
                  <button
                    onClick={handleCopyMessage}
                    className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isCopied 
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {isCopied ? '‚úì Copiado!' : 'üìã Copiar Mensagem'}
                  </button>
                </div>
                <div 
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap select-all max-h-40 overflow-y-auto" 
                  title="Clique na caixa se precisar selecionar manualmente"
                >
                  {manualShareOccurrenceMessage}
                </div>
              </div>

              {/* Quick Primary Actions for Instant WhatsApp & Mobile Dispatch */}
              {(() => {
                const primaryRecipient = idoso.contatoEmergencia?.telefone
                  ? { nome: idoso.contatoEmergencia.nome || 'Respons√°vel', telefone: idoso.contatoEmergencia.telefone, parentesco: idoso.contatoEmergencia.parentesco || 'Respons√°vel' }
                  : (getFromDB<Usuario[]>('anjo_usuarios', []).find(u => u.tipo === 'familiar' || u.tipo === 'admin') || { nome: 'Respons√°veis da Fam√≠lia', telefone: '(11) 98765-4321', parentesco: 'Fam√≠lia' });

                const primaryNumberFormatted = formatWhatsAppNumber(primaryRecipient.telefone || '(11) 98765-4321');
                const textEncoded = encodeURIComponent(manualShareOccurrenceMessage);
                const primaryWaLink = `https://wa.me/${primaryNumberFormatted}?text=${textEncoded}`;

                return (
                  <div className="space-y-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                        ‚ö° A√ß√£o R√°pida de Envio Direto
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        Para: {primaryRecipient.nome} ({primaryRecipient.telefone})
                      </span>
                    </div>

                    <a
                      href={primaryWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        handleWhatsAppClicked(activeSharingOccurrenceId);
                      }}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs md:text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-500/20 hover:text-white"
                    >
                      <span className="text-base">üì≤</span> ABRIR NO WHATSAPP REAL AGORA
                    </a>

                    {typeof navigator !== 'undefined' && (navigator as any).share && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await (navigator as any).share({
                              title: isEscolar ? `Di√°rio Escolar de ${idoso.nome}` : `Boletim de Cuidados de ${idoso.nome}`,
                              text: manualShareOccurrenceMessage,
                            });
                          } catch (e) {
                            // User cancelled share window
                          }
                        }}
                        className="w-full py-2 px-3 bg-white hover:bg-emerald-100/60 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>üì§</span> Compartilhar pelo Celular (WhatsApp / Outros Apps)
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Direct selective dispatcher & Custom phone input */}
              <div className="space-y-3 font-sans">
                {/* Send to a custom phone number */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">
                    Enviar para outro n√∫mero de celular/WhatsApp:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      placeholder="DDD + Telefone (ex: 11 99999-9999)"
                      value={customPhoneInput}
                      onChange={(e) => setCustomPhoneInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <a
                      href={customPhoneInput ? `https://wa.me/${formatWhatsAppNumber(customPhoneInput)}?text=${encodeURIComponent(manualShareOccurrenceMessage)}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!customPhoneInput) {
                          e.preventDefault();
                          alert('Por favor, informe o n√∫mero de telefone com DDD para abrir o WhatsApp.');
                          return;
                        }
                        handleWhatsAppClicked(activeSharingOccurrenceId);
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl text-white transition-all flex items-center gap-1 shrink-0 ${
                        customPhoneInput ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:text-white' : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <span>üí¨</span> Enviar
                    </a>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider pt-1">
                  Ou escolha um dos contatos cadastrados abaixo:
                </span>
                
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {getFromDB<Usuario[]>('anjo_usuarios', [])
                    .filter(u => u.tipo === 'admin' || u.tipo === 'familiar')
                    .map((rcp, i) => {
                      const number = formatWhatsAppNumber(rcp.telefone);
                      const text = encodeURIComponent(manualShareOccurrenceMessage);
                      const waLink = `https://wa.me/${number}?text=${text}`;
                      const status = familiarShareStatuses[rcp.id || rcp.nome] || 'pendente';

                      return (
                        <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl transition-all">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <strong className="text-xs font-bold text-slate-700 block truncate">{rcp.nome}</strong>
                              <span className="text-[10px] font-mono text-slate-400 font-bold block">{rcp.telefone} ({rcp.parentesco || 'Familiar'})</span>
                            </div>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setFamiliarShareStatuses(prev => ({ ...prev, [rcp.id || rcp.nome]: 'aberto' }));
                                handleWhatsAppClicked(activeSharingOccurrenceId);
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-emerald-500/10 hover:text-white"
                            >
                              <span>üí¨</span> Abrir WhatsApp
                            </a>
                          </div>
                          
                          {/* Interactive individual status buttons */}
                          <div className="flex items-center gap-1 mt-0.5 pt-1 border-t border-slate-100/60 text-[9px] font-bold">
                            <span className="text-slate-400 cursor-default shrink-0">Status:</span>
                            <div className="flex gap-1 overflow-x-auto">
                              <button
                                type="button"
                                onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, [rcp.id || rcp.nome]: 'pendente' }))}
                                className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                  status === 'pendente' ? 'bg-slate-200 text-slate-700 font-bold border border-slate-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                Ainda n√£o enviado ‚è≥
                              </button>
                              <button
                                type="button"
                                onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, [rcp.id || rcp.nome]: 'aberto' }))}
                                className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                  status === 'aberto' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                WhatsApp aberto üí¨
                              </button>
                              <button
                                type="button"
                                onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, [rcp.id || rcp.nome]: 'confirmado' }))}
                                className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                  status === 'confirmado' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                Confirmado ‚úì
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                  
                  {/* Emergency contacts block inside modal */}
                  {idoso.contatoEmergencia && (() => {
                    const status = familiarShareStatuses['emergencia'] || 'pendente';
                    const number = formatWhatsAppNumber(idoso.contatoEmergencia.telefone);
                    const text = encodeURIComponent(manualShareOccurrenceMessage);
                    const waLink = `https://wa.me/${number}?text=${text}`;
                    return (
                      <div className="flex flex-col gap-2 p-3 bg-red-50/20 hover:bg-red-50/40 rounded-xl border border-red-150 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="text-xs font-bold text-slate-700 block truncate">{idoso.contatoEmergencia.nome} (Contato Respons√°vel / Emerg√™ncia)</strong>
                            <span className="text-[10px] font-mono text-slate-400 font-bold block">{idoso.contatoEmergencia.telefone} ({idoso.contatoEmergencia.parentesco})</span>
                          </div>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              setFamiliarShareStatuses(prev => ({ ...prev, 'emergencia': 'aberto' }));
                              handleWhatsAppClicked(activeSharingOccurrenceId);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-emerald-500/10 hover:text-white"
                          >
                            <span>üí¨</span> Abrir WhatsApp
                          </a>
                        </div>

                        {/* Interactive individual status buttons for emergency contact */}
                        <div className="flex items-center gap-1 mt-0.5 pt-1 border-t border-red-200/40 text-[9px] font-bold">
                          <span className="text-slate-450 cursor-default shrink-0">Status:</span>
                          <div className="flex gap-1 overflow-x-auto">
                            <button
                              type="button"
                              onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, 'emergencia': 'pendente' }))}
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                status === 'pendente' ? 'bg-slate-200 text-slate-700 font-bold border border-slate-350' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              Ainda n√£o enviado ‚è≥
                            </button>
                            <button
                              type="button"
                              onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, 'emergencia': 'aberto' }))}
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                status === 'aberto' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              WhatsApp aberto üí¨
                            </button>
                            <button
                              type="button"
                              onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, 'emergencia': 'confirmado' }))}
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                status === 'confirmado' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              Confirmado ‚úì
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Interactive Audit Questionnaire if sharing an alert */}
              <div className="border-t border-slate-150 pt-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3.5">
                  <span className="text-xs font-black text-slate-800 block">
                    {activeSharingOccurrenceId ? 'Passo 2: Voc√™ enviou esta mensagem para a fam√≠lia?' : 'Confirma√ß√£o do Compartilhamento'}
                  </span>
                  
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => handleConfirmWhatsAppSent(activeSharingOccurrenceId)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all text-center leading-normal"
                    >
                      Sim, enviei no WhatsApp ‚úì
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleNotSentYet}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-all text-center leading-normal"
                    >
                      Ainda n√£o enviei
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {showCollectiveShareModal && collectiveShareList.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto animate-fade-in" id="collective-share-modal">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-6 my-8">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-800">Confirma√ß√£o de Encerramento Coletivo</h3>
                <p className="text-xs text-slate-500">
                  {isEscolar
                    ? 'Di√°rios gerados com sucesso! Revise e abra o WhatsApp para os familiares de cada aluno da classe.'
                    : 'Relat√≥rios gerados! Compartilhe o boletim de cuidados com a fam√≠lia de cada assistido.'}
                </p>
              </div>
            </div>

            {/* List of classmate reports */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {collectiveShareList.map((item, index) => {
                const number = formatWhatsAppNumber(item.contatoTelefone);
                const text = encodeURIComponent(item.mensagem);
                const waLink = `https://wa.me/${number}?text=${text}`;
                const status = collectiveShareStatuses[item.id] || 'pendente';

                return (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{item.nome}</h4>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block">
                          Respons√°vel: {item.contatoNome} ({item.contatoTelefone})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.mensagem);
                            setCopiedCollectiveIndex(index);
                            setTimeout(() => setCopiedCollectiveIndex(null), 2000);
                          }}
                          className={`px-2.5 py-1.5 text-[10px] uppercase font-black rounded-lg border transition-all cursor-pointer ${
                            copiedCollectiveIndex === index
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                          }`}
                        >
                          {copiedCollectiveIndex === index ? '‚úì Copiado' : 'üìã Copiar'}
                        </button>

                        {/* WhatsApp Button */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setCollectiveShareStatuses(prev => ({ ...prev, [item.id]: 'aberto' }));
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-emerald-500/10 hover:text-white"
                        >
                          <span>üí¨</span> Enviar WA
                        </a>
                      </div>
                    </div>

                    {/* Pre-formatted Message box */}
                    <div className="bg-white border border-slate-150 rounded-xl p-3 text-[11px] font-mono text-slate-600 max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
                      {item.mensagem}
                    </div>

                    {/* Individual Status flags */}
                    <div className="flex items-center gap-1.5 text-[9px] font-bold">
                      <span className="text-slate-400 cursor-default shrink-0">Status do Envio:</span>
                      <div className="flex gap-1 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setCollectiveShareStatuses(prev => ({ ...prev, [item.id]: 'pendente' }))}
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                            status === 'pendente'
                              ? 'bg-slate-200 text-slate-700 font-bold border border-slate-300'
                              : 'bg-white text-slate-400 border border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          Pendente ‚è≥
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollectiveShareStatuses(prev => ({ ...prev, [item.id]: 'aberto' }))}
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                            status === 'aberto'
                              ? 'bg-amber-100 text-amber-700 font-bold border border-amber-300'
                              : 'bg-white text-slate-400 border border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          WA Aberto üí¨
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollectiveShareStatuses(prev => ({ ...prev, [item.id]: 'confirmado' }))}
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                            status === 'confirmado'
                              ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                              : 'bg-white text-slate-400 border border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          Confirmado ‚úì
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Marque cada di√°rio como enviado √† medida que concluir as transmiss√µes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowCollectiveShareModal(false);
                  showToast('Fechamento de di√°rios finalizado com sucesso!', 'success');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer hover:scale-101"
              >
                Concluir Tudo ‚úì
              </button>
            </div>

          </div>
        </div>
      )}

      {showShiftReviewModal && shiftReviewPayload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="text-blue-600 w-6 h-6" />
              <div>
                <h3 className="text-lg font-black text-slate-800">Revis√£o do Relat√≥rio de Turno</h3>
                <p className="text-xs text-slate-500">Revise os registros do seu plant√£o antes de enviar para os familiares</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              
              {/* Core Audit Metrics side-by-side */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">CONFORMIDADE DA ROTINA</span>
                  <strong className="text-2xl font-black text-emerald-600 font-mono">{shiftReviewPayload.taxaC}%</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Percentual de cuidados executados com sucesso</p>
                </div>
                <div className="border-l border-slate-200 text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">QUALIDADE DO REGISTRO</span>
                  <strong className="text-2xl font-black text-indigo-600 font-mono">{shiftReviewPayload.taxaQ}%</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Auditoria de registro correto (mesmo em recusa justific√°vel)</p>
                </div>
              </div>

              {/* Routines Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">üíä Status das medica√ß√µes & Rotinas de Cuidado</h4>
                <div className="space-y-1.5">
                  {shiftReviewPayload.concluidas.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200/50 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">‚úì CONCLU√çDOS ({shiftReviewPayload.concluidas.length})</span>
                      <ul className="text-xs text-emerald-950 space-y-1 pl-1.5 list-disc leading-normal">
                        {shiftReviewPayload.concluidas.map((m: any) => (
                          <li key={m.id}>{m.titulo} √†s {m.concluidaEm || m.horarioPrevisto}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shiftReviewPayload.recusadas.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-amber-800 flex items-center gap-1">‚ö†Ô∏è RECUSAS REGISTRADAS ({shiftReviewPayload.recusadas.length})</span>
                      <ul className="text-xs text-amber-950 space-y-1 pl-1.5 list-disc leading-normal">
                        {shiftReviewPayload.recusadas.map((r: any) => (
                          <li key={r.id}>*${r.titulo}* - Recusado: "{r.observacao || 'Recusa geral'}"</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shiftReviewPayload.atrasadas.length === 0 && shiftReviewPayload.pendentes.length === 0 ? (
                    <p className="text-xs text-slate-500">‚úì N√£o h√° pend√™ncias na escala neste turno.</p>
                  ) : (
                    <div className="bg-rose-50/50 border border-rose-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-rose-800 flex items-center gap-1">‚ö†Ô∏è PEND√äNCIAS EM ABERTO ({shiftReviewPayload.atrasadas.length + shiftReviewPayload.pendentes.length})</span>
                      <ul className="text-xs text-rose-950 space-y-1 pl-1.5 list-disc leading-normal">
                        {shiftReviewPayload.atrasadas.map((a: any) => (
                          <li key={a.id}>*${a.titulo}* - Atrasada (Prevista: ${a.horarioPrevisto})</li>
                        ))}
                        {shiftReviewPayload.pendentes.map((p: any) => (
                          <li key={p.id}>{p.titulo} - N√£o preenchido (Previsto: {p.horarioPrevisto})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* nutrition/hydration quick logs summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-150 p-3.5 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">ü•õ L√≠quidos Consumidos</h5>
                  <strong className="text-sm font-bold text-slate-800">{shiftReviewPayload.totalMl}ml de √°gua</strong>
                  <p className="text-[10px] text-slate-500 mt-1">{Math.round(shiftReviewPayload.totalMl/250)} copos oferecidos.</p>
                </div>
                <div className="border border-slate-150 p-3.5 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">üß† Estado de Humor</h5>
                  <strong className="text-sm font-bold text-slate-800">{shiftReviewPayload.ultimoHumorText.toUpperCase()}</strong>
                  <p className="text-[10px] text-slate-500 mt-1">√öltimo humor reportado na escala.</p>
                </div>
              </div>

              {/* Vitals information */}
              {shiftReviewPayload.ultimoSinal && (
                <div className="border border-slate-150 p-3.5 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">üíì Sinais Vitais aferidos</h5>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold *:bg-slate-50 *:p-1.5 *:rounded-lg">
                    <div>PA: {shiftReviewPayload.ultimoSinal.pressaoArterial}</div>
                    <div>Glicemia: {shiftReviewPayload.ultimoSinal.glicemia}</div>
                    <div>O2: {shiftReviewPayload.ultimoSinal.saturacao}%</div>
                    <div>Temp: {shiftReviewPayload.ultimoSinal.temperatura}¬∞C</div>
                  </div>
                </div>
              )}

              {/* Occurrences logged within active shift */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">üö® Ocorr√™ncias registradas ({shiftReviewPayload.ocorrencias.length})</h5>
                {shiftReviewPayload.ocorrencias.length > 0 ? (
                  <div className="space-y-1.5">
                    {shiftReviewPayload.ocorrencias.map((o: any) => (
                      <div key={o.id} className="p-3.5 bg-red-50/50 border border-red-200 rounded-xl leading-normal text-xs text-red-950 font-semibold flex items-center gap-2">
                        <span className="font-mono text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md uppercase">{o.criticidade}</span>
                        <span>{o.descricao} ({o.horario})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">‚úì Nenhuma intercorr√™ncia f√≠sica registrada neste turno.</p>
                )}
              </div>

              {/* Medication Adjustments logged within active shift */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">üì¶ Altera√ß√µes de Medicamentos ({shiftReviewPayload.medChanges?.length || 0})</h5>
                {shiftReviewPayload.medChanges && shiftReviewPayload.medChanges.length > 0 ? (
                  <div className="space-y-1.5">
                    {shiftReviewPayload.medChanges.map((ch: any) => (
                      <div key={ch.id} className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl leading-normal text-xs text-slate-705 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-wide ${
                            ch.tipo === 'cadastro' ? 'bg-emerald-100 text-emerald-800' :
                            ch.tipo === 'exclusao' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {ch.tipo === 'cadastro' ? 'Novo Cadastro' : ch.tipo === 'exclusao' ? 'Exclu√≠do' : ch.tipo === 'suspensao' ? 'Suspenso' : 'Reativado'}
                          </span>
                          <span className="text-[10px] text-slate-405 font-semibold">por {ch.autor}</span>
                        </div>
                        <div className="font-semibold text-slate-800">üíä {ch.nome}</div>
                        <div className="text-[11px] text-slate-500 leading-normal">{ch.detalhes}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">‚úì Nenhuma altera√ß√£o (Inclus√£o ou Exclus√£o) feita neste turno.</p>
                )}
              </div>

            </div>

            <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowShiftReviewModal(false);
                  setShiftReviewPayload(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                Voltar e Ajustar Relato
              </button>
              <button
                type="button"
                onClick={handleConfirmEndShift}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Registrar Presen√ßa & Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE / LGPD STRICT CONSENT VIEW MODAL */}
      {!lgpdAccepted && (
        <LgpdConsentModal onAccept={handleLgpdAcceptComplete} seniorName={idoso.nome} />
      )}

      {/* DUPLICATE ROUTINE WARNING MODAL */}
      {duplicateWarning?.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="duplicate-warning-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 leading-snug">
                  {duplicateWarning.isIdentical ? '‚ö†Ô∏è Registro Id√™ntico Detectado!' : '‚ö†Ô∏è Registro Existente para Hoje!'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Voc√™ j√° salvou informa√ß√µes de rotina para o(a) aluno(a) <strong className="text-slate-800">{duplicateWarning.studentName}</strong> hoje.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-extrabold text-[10px] text-slate-400 block uppercase tracking-wider">üíæ REGISTRO J√Å EXISTENTE:</span>
                <span className="font-semibold text-slate-700">{duplicateWarning.existingInfo}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="font-extrabold text-[10px] text-indigo-500 block uppercase tracking-wider">üÜï NOVO REGISTRO TENTADO:</span>
                <span className="font-semibold text-indigo-950">{duplicateWarning.newInfo}</span>
              </div>
            </div>

            <div className={duplicateWarning.isIdentical ? "bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-800 font-bold leading-relaxed" : "bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 font-semibold leading-relaxed"}>
              {duplicateWarning.isIdentical 
                ? 'üö´ As informa√ß√µes digitadas s√£o exatamente iguais √†s que j√° foram salvas hoje. O salvamento foi bloqueado para evitar mensagens duplicadas enviadas √† fam√≠lia.'
                : 'Voc√™ est√° salvando informa√ß√µes complementares diferentes para o mesmo dia. Se for isso mesmo, confirme abaixo para salvar!'
              }
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                {duplicateWarning.isIdentical ? 'Entendido, Voltar' : 'Voltar e Cancelar'}
              </button>
              {!duplicateWarning.isIdentical && (
                <button
                  type="button"
                  onClick={duplicateWarning.onConfirm}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Sim, Salvar de Qualquer Forma
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SAFE SANDBOXED CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="custom-confirm-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 leading-snug">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{confirmDialog.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                id="confirm-cancel-btn"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
       xú‹\[oGv~˜Ø®qh®á√˚%	#^lb)ëKRJ EÄk∫kfJÍÓjW˜b./`÷∆∆YªPºy0ºÅüÇ ¡æ»¸˝ÅË'‰ú™æwıÃP¢l$ÚE”’’u9uÍúÔ\™âˇÿ.√«‘cùFpa≠ê‡“Z"ΩÅ%ôc≠µ€d(Œò‹ä÷°Ä⁄?cI…îDÏ"≤Œá<b§/¸»ÇGI{¬uÙõãêH1Ú®}·ípHqéÖˆHÜBZÅ‡~ƒd„R˙√ùN√~üKœ/≠^‰óÎ‹Ø|≥≠ÎSYzso°7ä"·ø∏∑‡≥|Q©†8˝A¸Îj·#ÚËpß{@vv…ÒÓ…ÈÒ˛¯W„ø;$ªªwüÓ¯gÁ…vwßã5∫€ª''á§{Hé∫˚èw»·—Óqw{ˇ1¥—¬u“j8Á€T≤êWqˇëp®KÓ‹!Õl@0û¸äı˘s˜CYm\µ–•≥6W€LÌóéÅ’sG)ﬁwŸÅeÚBÀfHtÚbFºô<¿ ü[œ÷⁄œ	ıπámı©√,Ó7Ùr$√≥®m≥0¥<c£@¬“aPö5X&ËÖuny9∑˙#◊%=!Ë^ˇOb	8+∞÷HPõYó0≤òuñ†≈X∫r`2ÿ–¶.≥FA£¥Œe≤et#*#2†Åµ‹(≥S˘3®É4¶^π⁄NgîHø¡]%˜_ZÌJõ–ÍÅ∞_Êõ=∑V…–ZmêÖ   ¸iUBüES_√Â|U5»„}⁄sÅAÚ§‹ÑëWyâ≥ÿZ%.£˜Vƒ√»–∞0wC[∏TídÆã"»1#…#A(ŸuF6,°d·Ÿ2Uÿq'Æp]ùÃ¬pŸ0≈†2√gãÌ‡‚yeéŸÍåÇÄIÈ Ç ~âì:ÁÉÙ\X„‹Nÿ`$©?˛éﬁ%GíüQá S2GHO=Ã∞™qQ±¨:1ÿ¬π’ZÖô$k"ôKQ®9áÃ„(~+Û8íÏsÍP≤GΩÒ.áôú	{¸'3K@÷2;¬˜æ @†>w	Lê⁄¬®?Ña¯∞HPr÷K¯É “˝ÿ∏5
GTr—çF‘}–ÚÖ«ÆÔ-ËÔÓ∑Js 37Ôªd÷µ“"ØeíM—Z≠nÎö·?[\D∂Q,`Td∫ßuúﬂëê‰≥#@( }¶Ö¢õ&„Ô·∑ÊÈÈ§ÀÉ®e€…+l‡Õ‹Æ3-lDP<Ò )∞ÄË„Æìá9ÚÏ
é˚úD„Ômü€Ç∞€Ö¸L≠5Ä∫C(çªÄ≤¿•~4˛Wqóå"Ór`)$¥ìu°sË`¸ÔhÓ.	Åî`Sˆ6–ó‘uhÿä∑æ?‡yyMIÑ@≤30qP’∆ÚmÆ?D·BSËMçYD†"Ì‹Ñè@Xåë´YV}âc Uï÷úÅL[y2âT≈Db¿O„Ôä∞E@F ÀÕ‰“ÅBw–òá!æ‚™sÊ˜ÄíÉñ,:∞âûî&Ö∑|¸P+á\}v∆#¯Î.®6ò#º¸à…ˇ KDë‘Ò∏è¸F”/%Û∆ﬂ;\‡Wa®Â©@jI\I·sF{∞Ü5t)·ä43
.Ïçˇd‘Ûx‘π¬(\ˆÊÿøÃ„õkì[6mÿ:çg®µ]⁄ÉE4»N≠J€yäñ˙;|Ä@Eê£˝«»GŸ:∫z•8®*∑Ó-®Nùs?E¶}]( `PÁ ∑™hó (:`˛ vÆV™⁄è¿"P«~ßÒ¨mm>ˇ»‘ÑÍp#Ù‰è<†∏m™˚◊fC†ìù∆Î/˛ò˛k™|F›Î\ŸπÖ{äE¶
{ ’È‹'WÜ*ƒA¥]n¨…ZÄ√,j©ÓZí©16˛vgapóÃÕÕœˇ’,çÌJ)d™õj_õÜ\¿a
ã*ﬁH0C ,*UÀ‰AÜI--’R_ÿ£p%¥õ{‡æ√Â˝¬R;~∑ì{µ⁄.®¡íŒ5LN≤œF¨4√+:äƒˆSyWA°§ ŒvPD=”4tcTsã©öì"d
ëô‘≠^##‰ıæ4å¬¥¬∆¸ô«[VÀ+…Ä†U‡ôDa˚ K∂QˆÁÕ´o˛ë$Ú&$+ƒˇ ®´bÒ√ _P0ÜC9VF6¨%CΩïƒ(ß•V%.äP”g Íf•Z3”•*Ò´æ∆†B;a…$êµÈ]+ıkˇÇ<qπ˝≤s’úü(ONLñs≥O›êÕ&7¥™ë∑+eêT÷b*Yñk—lÆÊ¸0È˛◊%EdZ÷qEﬂpäÚöEA“Ms¿òX˜©pARkfˇ–  *ó:üãz3Ö#BÖL1ëêÉúâóíKW∫Ï\W	9›Õ¢,ÍŸË#éöŒLc£çâ∏ÏÌº]€0~¿’ß#yH}&ëÛ\E™|OU$–√$—Å†=MõÁyÏ
=í:ãRªy˙„∑f˜Ñy-∂[—r·”Ù'dà2ØJ+È fVÀ…;f’/’Êe…ßSûÁπµAÜ_2lÌﬁ‰˙úŒ5Œ£{€CVˆ≠@g+öWìÄ˚KÆ§™õ≥4Ëâ YŸÛÖÅËıny`´ÅMs˝Vıà9`» ©ÅµÌót *ìEÑ∞¨?vN¥ˇ3«fÅ~ü™äÔ‡0µfè~>”Ú ñΩ£ÔÏUûŒÃøY«Œô3¥ÏÚå)ÎG](Í ¸cî∫ìtpIˇèK–Ùa‡ê# ÌÖ¬)s=ø˝-îQïQ••À∂ÿÆ®¡º€G£˜l?€¬rrò°"6ˇf«l&tgı2DU ™g_ÛRkU≈a"/&™J=≠∑æg‰Í¢Æ„—eq:k0ùµõ¯ô-˙=Æô
≠q≥ ˆØ˜πÓ°8 ¨´ÖÖˆ?nSáj»kPÜ8∏Ÿº‡©ÈVïv≥8∫M¢®Ò»5ÿ≈&øı¨>‡W‰#±lXJ~§åí«à∏[˙.ï!w¿tòE∏-∞*,P+JHÅ2´F1ÓqoPôßd}&% dB„≤”ÖïU±N(Ìéôä#ÈVivMMı¢Áà¶g±æ¢≠^"z/òÊ,?Ä*#¿+è∑" ¶/U≤uW€Îeóµz±T‹≈@˘eÿÒ©o+†ŸfŸ\5¨Dp?ˆgﬂﬂ®éΩ≠‘Â\√¶éÆG~Ò2«.¿ïË÷÷‚‹µ¡64∑’GÉ2IQÁ≥á/¥ìsÍÄ≤FT«Â≈44!ˆ;±BÀUN5rü¥ã`¡@¬OÑãMs⁄˙–+ÕπªdnﬁDµäZ4∑&za›ÿ
J!RÅ8≥e#CªQô—Ìà¬æ4ä≥CËﬁ°§áÖ∂H£vò◊’≠<}⁄∆˝ÚS°ëp]Ê£JUh±i0ï∂®Ñ}ã·[¿é=f¡∆{ZŸ‘@é
UçèE∞˝Ê’óˇg,Ï?>›=ÓûÓ?=$;Ô˛¯ó«˚ádÅ<<<ÿ=›%ÔüBΩÌ√GGPrHö˚èF‘ÛÖlÊÇeŒ1Ñåﬁ-Wa˝ÌsV€oá≈*_◊∫äŒqÅß$(ËfÚ••¥Ö’J⁄Ç¬ËZ)=€lüügZ˙Ri®“-⁄^∞úü >)‡5Ø•`èEÁ–@<^’Œ®ôWœZôä\k`Ø	•VlÁ≈%@®øŒI›„k∆ÙÑ[‰∂¨ﬁúnﬁGØÖgä£¢Wˆ∑oof l,ùï&?©˙∫.a#Ù∂!áRÓÜZµå 5}îÛ4v∏“yËr>˜)I^*5ÏÎÂµˆˇY•l<.ã∏áu„iò‘2dlhÚô≤6‘õ≤)\(£$s˛™Û†§∂PRê˙Ò™y©RKä◊øˇ-9‡˛Kùﬂ!à
Sr€d^ËŸòMåZ6ô1èCçŸ3g‰’’$p[Id‡öº˛‚èÊ*ç®ÇzüàlNW<br¸Épƒñ˘Ós¯?jØo-∑·´ÒøÑÊ∫}ÆÅ‰¢Æ8kú¡lqöcZÛUÉPì£U¥pRæ,êí!^F©Ä,ïoÉ}”|kE˜£∆”SgÛQLIy¨ËîÓ»·πC∂Ö Ùmÿ‡T:SïÊT¸é?≥Uˆ∏<{f]n«•˛j;U÷q	BÜï≤Møã¡n^≈oR1ëxYc›6gLıs‰$p£Õ˘<b∑F˜…Œ˛È·Ò~óÏ®zºwx¸hßª≥[Î¨®…N*Í±|∑Î….´,,”éçËÕß¨·ˆéæ˛Kr¯≥∫l•)Ù»w\≠rOıÏµB	5{°Á∆<ÌŸ¢åF.…9÷6Iäå|íº40JE°‹>ß‰CV˘˘ìÓÅ‚ùW¸Ò˛…ÈÒ·-I“iëQí“…úÚs¥H
lÚ.<íãQ‰ò˜zÇú2:ßÓ≠ÛHö±õpà.0Úá~e‡éR–ˆy#•Å3vûwuä9mGª«„ØwnÉ3≤‡h∆∫¨û+0DfS °’ãîÎËÌŸ#ﬂÊ%HíUy¬}VÈÜ9d”®Ä¶/ ^53ÚH«≤ ÀÜÅK/ß™Ωâ˘•√’˙‡Zñ„)d00X(¿Ñ„àçˇÏ(ﬂxÇﬁ¡Ñè±˘)b
@E√_ùÆäW €'ı&çÊçxùf6ç”¸O¯ÇêFÅ≥¶î5£IHfùKT2üµAΩ÷ûbL+0±µ«|Âç9É÷$¬Ã¬\;\BÛD≈`ò∂.∂EpI“ÈFªQ~ïÌÚ<‡º!˘—UôÄœ´©ﬂRúOvË¿UºbS—∆Œ≠vÊÌòE2ñbG:{:o‘ÿÒﬂ¸s¡™SÈ*∏≤TF‹MRŸwìDÁ≠ŸCI∆ag¸ú˜ ÊºxÜ.±t1œ9í#ﬂÜ	MÖ]ù√ó‚ºT‘º%$ò›˛ı¬ÌÖ'—1sé)"u[ì´s#ÎÀîπe?åàã´‘!ü~8À?¨õ·ß¶L,üûÒ~Ÿ≤]Ùò3≠s	|~
—ƒéç	\xK%∫4ÁRÁ ä⁄XŒ⁄"P˘wògéTæ˙_ò2¡y`EW«≤vu,ÂM∆¢Ø+5/s@ø‚ëŒî9»“$sd¬)ûRÆRm»À®{~çÇåÉSTA9UuÃMÃNÌ7ﬁ«Ç˝ô¸ö âñ )Ê;$à≤Xh4£G≥* nÉ€ﬂﬁ◊paiû–°ˇâYUM`rI§,3Y¡0Jé+'Á	Vez8cv6ô=»±Á
Ä{c6z®›Fw»&ßi	L¶9¨_07®=d2ºK“‰N¸-ÄG¿fç0às'÷Â¯;˚‡·ID˚˝'!ìÕ¸Aß˘R§P˘ƒùìÙÆ:œÕ Zr[˝ïÁå|£ù¬Y™|-*◊ˇ*˛ëÅÙ0˘◊CÖ› 8·^Á™Zñ}±`&*Ï˘Ø»	(Âf`k
–&•ı©\Fé∏´i⁄Hè–ÑŸQ#6ÄíÖWîCŸ[P‘SÍ	XiœZ#à5ú®∑•~≠ëœA—≠3,_Ä¶Ωa¨(K€ú,∞<êG⁄¶•n—ômÄlÎLgyè5ºî∞x€)^˙¨Œ	ãÙÊEÆjŒ%^Êπ	a’´OcÔ=N≥qÉÀx˛óU‰ø$∞#ßºR+¶f÷§§–r∂Ç/î•a}ú•≥#ùNád34‡ÅdÆ®ñsã/WP@•·-∂Aù£U≤HÚÁ:V‘·çöcg9Qº\tÎ>R∂SèãïvÆ?-/ã âÈ¢<çnr2@aaa>∏ê—m¿–jø…Œ«5ä]WèZöL~*Ò™£5QåFΩyıı˜Øø¯ÍÕ´ﬂ¸õä8Ωyı›◊¸˙wˇÙ?ˇ˘Â^0AWUXl(lN
©ˆ‚‚dÊÎ2¸ﬁÀˆÍÎ˙ˇøª+ô`ÌÊ πo≤ªíœ~öÌU›ÄÙ®:	åòœFÒ±J“Ñ≈V'4c≈GXzfÇÖÛSRgŸ@o^}˘_ìˆEÕ¿&3~ælˆ<ìoæìxSOÒSÜ∂éA”1√± ”©´Óè(_ÅØÚ7_ Ï·,>'Á<≤á∑ödÚ#&|cNH9Èª6·;÷ì3æoz…E…©Û9‚˚πYî„Uì”óâÈíå∫‰Âõgh‹¸RåÈ¡Ñîo≥ √∑Ä1"nNâ0g
î“î3 R3é‰ƒ–	uÈπ2l°[â“ó
ﬂóó(>›óˆaN`uæ⁄Úæ±ã&Àµúƒœô ÜLÅõZœÔ!æﬂ4”W{‡>ÇÅœúÿ&2`Q∑X∏'$¥i`¶ªcµBe…¢ëÙMô≠U°ôÜ—´”9QR ôÆ=VÁ≠V)M˙A´èGÃgòu∫ªŒX/}ß>ª÷ŸÈÂWÍŒìRz[”€J'V“tÙ≥t∫’úÜ∆ƒÏzìP¨?„lLº3ç,[í•íﬂò%/ßµŸW9∞oh]Rï¡èV/çí’|d•Ï∏Øã‘5Ó'ÜEâ¿N{∆\£≠é†˛v}{NyO>(ÔR≈]o≥aÄ%w:í5fÔO ¶±∏¥èØÁõ“ã?õpÀG,≠ç|LO Ω’Î=÷ìFSÔ(ﬁ˛¡r>ëfv>^£}7V≤îÑ®fDùxAà°˚ˇ„˜ÉHΩ‰˚ÿ¡ª\rúkÁ]nâ€yÇ`‹¶ˆJê•bñ≈¥;AñﬁıRê∫A6€©3ë„qÌ€º§Rñ¨˛OrH°ÛÁê4c˜/ 9í"bÈıMô¿Ÿ"˚~»µSÖ%,ÛJ¸`7Ò]Yî®ÎµPµ ÜK3®Û$‰3Îß´ÎnS5RÓç\÷ŸJ‰fcπΩºÿ MÑ1>ÊÓùøKõãÍ;#;/®Î—yºº§:5”%%ì3Æﬂ«&G4^•¯£‹b2£ùsSKÁF◊íh˘6”≈$k’ÿ‰™yﬂ˙E$€ò£Ï˛§◊é§ÑöµœÆ)'#ﬂÓœπïªG YÕDdÉ”ÜÍö6ê4Ÿ}ªFW«{øù$-ûø˛‡  ˇˇ rªÑ