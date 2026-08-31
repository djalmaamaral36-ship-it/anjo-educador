// UTF-8 encoded: AAAA3AoAAA
// Vercel Production Build Commit: 1787865194
// AI Studio Sync Version: 1787862757
// Vercel build fix update: 514140926665909969
import React, { useState, useEffect, useRef } from 'react';
import { Idoso, TarefaDiaria, Usuario, TaskType, TaskStatus, RegistroAlimentacao, RegistroHidratacao, RegistroHumor, RegistroSono, RegistroAtividade, SinalVital, Medicamento, formatWhatsAppNumber, NotificacaoSimulada, Classroom, isStaffUser, isDirectorOrAdminUser, getRoleLabel } from '../types';
import { getFromDB, saveToDB, checkFeedingCareAuthorization, SALAS_INICIAIS, getShiftActiveState, setShiftActiveState, setShiftActiveStatesBatch, getAssignedTeacherForRoom, getStudentRoomName, resetStudentDailyRoutine, checkBottleFeedingInterval, registerBottleAttemptNotice, purgeOrphanedStudentData, saveHygieneLog, getHygieneLog, saveMealRecord, getStudentMealsToday, isStudentIdMatch, getAllPossibleStudentKeys, downloadReportFile } from '../data';
import { deleteFromFirestore, deleteStudentDataFromFirestore, db, forceReconnectFirestore, startFirebaseSync } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
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
import { parseAuraRawPlan, formatAuraTaskTitle, inferTaskType, realignPedagógicalActivity, isConversationalChatNoise, areTaskTitlesSimilar, mergeSimilarTasks, findMatchingMealTask } from '../utils/auraPlanParser';
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
,
  AlertCircle, Download, Printer, Copy} from 'lucide-react';

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
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
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
    if (!isStudentIdMatch(itemStudentId, idosoId)) return;
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
  if (rawTime === 'Inicio do Turno' || rawTime.includes('Invalid')) return fallback;
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
  const labelSinaisVitais = isEscolar ? 'Sinais de Saude & Temperatura' : 'Sinais Vitais';
  const labelPlanoCuidado = isEscolar ? 'Instrucoes da Classe & Rotina' : 'Plano de Cuidado';
  const labelObservacoes = isEscolar ? 'Observacoes Gerais & Rotina' : 'Observacoes de Rotina';
  const labelMedicamento = isEscolar ? 'Medicacao Encomendada' : 'Medicamento';

  const renderDashboardAuthBadge = () => {
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs mb-3">
          <div className="text-xl"> [!] </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-rose-950">
              {isEscolar ? 'Alimentacao e Cuidados Nao Autorizados' : 'Sem Autorizacao de Cuidados'}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isEscolar 
                ? 'Nenhum pai ou responsavel autorizou "Alimentacao e Cuidados" no painel de Pais & Autorizados para este aluno. Registros e acoes rapidas estao bloqueados para cuidadoras e professoras.'
                : 'Nenhum familiar autorizou "Alimentacao e Cuidados" no painel. Registros rapidos estao bloqueados para os cuidadores.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 shadow-3xs mb-3">
        <div className="text-emerald-600 bg-white p-1 rounded-full text-xs font-black shadow-3xs"></div>
        <div className="text-xs font-semibold text-emerald-950">
          {isEscolar ? 'Autorizacao Ativa dos Pais: ' : 'Autorizacao Ativa da Familia: '}
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
        .replace(/Ana Silva \(Cuidadora\)/g, 'Profa Ana Silva (Educadora)')
        .replace(/cuidador/gi, 'professor')
        .replace(/cuidadora/gi, 'professora');
    }

    // Se ja for uma atividade escolar propria, de planejamento (Aura), manual ou se ja possuir descricao personalizada, NAO reescreve o titulo nem a descricao
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

    // Legacy Elderly Title adaptations (apenas para tarefas legadas do modo idoso sem descricao previa)
    if (titulo.includes('Losartana')) {
      titulo = 'Soro / Inalacao de Rotina ';
      descricao = 'Fazer inalacao com 3ml de soro fisiologico mandado na mala (prevencao de tempo seco)';
    } else if (titulo.includes('Calcio + Vitamina D') || titulo.includes('Calcio')) {
      titulo = 'Vitaminas / Suplemento da Tarde ';
      descricao = 'Dar 1 sachet de gostinho de laranja (mandado na mochila para o lanche)';
    } else if (titulo.includes('Metformina')) {
      titulo = 'Remedio da Gripe / Amoxicilina ';
      descricao = 'Dar 5ml da Amoxicilina de acordo com a autorizacao assinada na mochila.';
    } else if (titulo.includes('Donepezila') || titulo.includes('Aricept')) {
      titulo = 'Alergika Preventivo / Gotas ';
      descricao = 'Dar 5 gotinhas do antialergico preventivo antes da soneca da classe.';
    } else if (titulo.includes('Cafe da manha') || titulo.includes('Cafe')) {
      titulo = 'Lanche da Manha & Frutinhas ';
      descricao = 'Frutas frescas da estacao, biscoito integral e incentivo A hidratacao.';
    } else if (titulo.includes('Almoco')) {
      titulo = 'Almoco Saudavel / Papinha ';
      descricao = 'Pratinho balanceado, introducao de novos sabores, verduras e carninha desfiada.';
    } else if (titulo.includes('Banho de Sol') || titulo.includes('Alongamento') || titulo.includes('Exercicio') || titulo.includes('Fisioterapia')) {
      titulo = 'Recreacao no Patio & Parquinho ';
      descricao = 'Brincadeiras ao ar livre, estimulacao fisica e interacao na rodinha pedagógica.';
    } else if (titulo.includes('Banho &') || titulo.includes('Higiene')) {
      titulo = 'Fralda & Higiene Geral ';
      descricao = 'Acompanhar no banheiro, verificar fralda e trocar se necessario. Lavar maos.';
    } else if (titulo.includes('Copos d\'Agua') || titulo.includes('Hidratacao')) {
      titulo = 'Hora da Garrafinha de Agua ';
      descricao = 'Estimular o aluno a beber agua na sua garrafinha com canudo.';
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
  const [quickVitals, setQuickVitals] = useState({ pressao: '', glicemia: '', temp: '', fCard: '', sat: '', peso: '', obs: '', bath: false, clothes: false, teeth: false, hands: false, cream: false });
  const [quickSleepText, setQuickSleepText] = useState('');
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

    showToast(` Sala alterada para ${classroomName}!`, 'success');
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
      setRoomPinError('Digite o PIN de 4 digitos para prosseguir.');
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
      showToast(` PIN correto! Acesso liberado para a sala ${roomToOpen}.`, 'success');
    } else {
      setRoomPinError(' PIN incorreto! Digite o PIN da educadora, o PIN da Diretora Nilva (3031) ou o PIN Dev (9181).');
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
  const timerIntervalRef = useRef<any>(null);
  const isTimerActiveRef = useRef<boolean>(false);

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
  const [isSyncingParent, setIsSyncingParent] = useState(false);

  const handleSyncParentShiftState = async () => {
    setIsSyncingParent(true);
    try {
      await forceReconnectFirestore();
      startFirebaseSync(true);

      let remoteShiftStates: any[] = [];
      try {
        const snap = await getDocs(collection(db, 'anjo_shift_states'));
        remoteShiftStates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (remoteShiftStates.length > 0) {
          localStorage.setItem('anjo_shift_states', JSON.stringify(remoteShiftStates));
        }
      } catch (e) {
        console.warn('Direct Firestore fetch fallback:', e);
      }

      let targetId = idoso.id;
      const currentMode = (localStorage.getItem('anjo_app_mode') as string) || appMode || 'escolar_infantil';
      if (currentMode.startsWith('escolar')) {
        if (targetId === 'idoso_maria') targetId = 'aluno_1';
        else if (targetId === 'idoso_joao') targetId = 'aluno_2';
      }
      const possibleKeys = getAllPossibleStudentKeys(targetId);

      const activeState = getShiftActiveState(targetId, remoteShiftStates.length > 0 ? remoteShiftStates : undefined);

      if (activeState.active) {
        possibleKeys.forEach(k => {
          localStorage.removeItem(`anjo_is_absent_${k}`);
          localStorage.setItem(`anjo_shift_active_${k}`, 'true');
          if (activeState.startTime) {
            localStorage.setItem(`anjo_shift_start_time_${k}`, activeState.startTime);
          }
        });
        setIsAbsent(false);
        setIsShiftActive(true); console.log(' [Dashboard] Manually setting shift active to true');
        setShiftStartTime(activeState.startTime);
      } else {
        setIsShiftActive(false);
      }

      window.dispatchEvent(new CustomEvent('anjo_shift_updated', { detail: { items: remoteShiftStates } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));

      alert(
        activeState.active
          ? '✅ Cronômetro e diário escolar sincronizados com a escola em tempo real! (Período Letivo em andamento).'
          : '✅ Cronômetro e diário escolar sincronizados com a nuvem! (Período Letivo não iniciado no momento).'
      );
    } catch (err) {
      console.error('Erro ao sincronizar cronometro dos pais:', err);
    } finally {
      setIsSyncingParent(false);
    }
  };

  useEffect(() => {
    const list = getFromDB<any[]>(`anjo_turn_summaries_${idoso.id}`, []);
    setTurnSummaries(list);
    setOccurrencesList(getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []));
    setLgpdAudits(getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, [
      { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Historico de Rotina', data: 'Hoje As 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
      { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualizacao do Painel de Tranquilidade', data: 'Hoje As 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
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
          cuidador: 'Profa Nilva Amaral',
          data: new Date().toLocaleDateString('pt-BR'),
          duracao: 'PeriodoCompleto',
          inicio: '07:30',
          fim: '17:30',
          taxaConformidade: 98,
          taxaQualidade: 100,
          mensagemCompleta: ` A ARVORE DA INFANCIA HOJE:
Hoje a árvore do(a) *${idoso.nome.split(' (')[0]}* floresceu no Anjinho Escolar:
  *Folhas verdes:* Nutricao balanceada e hidratacao regular (100ml);
  *Flores e borboletas:* Momento acolhedor de soneca e descanso (45min);
  *Frutos e passarinhos:* Atividades pedagógicas e trabalhinhos manuais;
  *Tronco forte:* Cuidados diarios, higiene e saude acompanhados de perto (36.5°C).

 *PARTICIPE DA JORNADA DO(A) ${idoso.nome.split(' (')[0].toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestacoes de afeto:
 *Que encanto!*   *Feito com amor*   *Puro brilho!*   *Orgulho da gente*   *Um tesouro!*

_(Cada manifestacao sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diario de rotina escolar completo pelo link seguro:
 ${window.location.origin}/?relatorio=${relatorioId}

Com carinho,
Equipe Anjinho Escolar`
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
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para excluir informacoes!");
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
    showToast(' Rotina/condicao removida com sucesso!', 'success');
  };

  const handleDeleteAlergia = (alergToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para excluir informacoes!");
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
    showToast(' Alergia removida com sucesso!', 'success');
  };

  const handleDeleteHygieneObservation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para excluir observacoes!");
      return;
    }
    triggerConfirm(
      'Excluir Observacao de Higiene',
      'Tem certeza de que deseja apagar a observacao de higiene gravada hoje para este aluno/crianca?',
      () => {
        const existingHyg = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, {});
        const updatedHyg = {
          ...existingHyg,
          observations: '',
          obs: ''
        };
        saveHygieneLog(idoso.id, updatedHyg);
        setQuickHygiene(prev => ({ ...prev, observations: '' }));
        setVitalsUpdateTrigger(prev => prev + 1);
        showToast(' Observacao de higiene apagada com sucesso!', 'success');
      }
    );
  };

  const handleResetAllHygiene = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para limpar ou excluir registros!");
      return;
    }
    triggerConfirm(
      'Limpar Registros de Higiene',
      'Tem certeza de que deseja desmarcar os itens e apagar a observacao de higiene de hoje?',
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
        saveHygieneLog(idoso.id, resetHyg);
        setQuickHygiene(resetHyg);
        setVitalsUpdateTrigger(prev => prev + 1);
        showToast(' Registros de higiene limpos com sucesso!', 'success');
      }
    );
  };

  const handleDeleteOccurrence = (occurrenceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para excluir ocorrencias!");
      return;
    }
    triggerConfirm(
      'Excluir Ocorrencia / Registro de Cuidado',
      'Tem certeza de que deseja apagar esta ocorrencia/anotacao de cuidado registrada hoje?',
      () => {
        const updated = occurrencesList.filter(o => o.id !== occurrenceId);
        setOccurrencesList(updated);
        saveToDB(`anjo_ocorrencias_${idoso.id}`, updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_ocorrencias_${idoso.id}` } }));
        }
        showToast(' Ocorrencia/Registro de cuidado removido com sucesso!', 'success');
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
      console.log(' [Dashboard Component] Evento db-vitals-update / anjo_user_updated recebido na tela do Responsavel/Familia!', { timestamp: new Date().toISOString(), detail: e?.detail });
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
      window.removeEventListener("db-vitals-update", handleUpdate);
      window.removeEventListener("anjo_user_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      clearInterval(syncInterval);
    };
  }, [visualMode]);
  const [lgpdAudits, setLgpdAudits] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, [
      { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Historico de Rotina', data: 'Hoje As 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
      { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualizacao do Painel de Tranquilidade', data: 'Hoje As 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
    ]);
  });

  // Ocorrencias registradas no turno
  const [occurrencesList, setOccurrencesList] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []);
  });

  // Compartilhamento manual via WhatsApp para ocorrencias
  const [showManualOccurrenceShareModal, setShowManualOccurrenceShareModal] = useState(false);
  const [manualShareOccurrenceMessage, setManualShareOccurrenceMessage] = useState<string | null>(null);
  const [activeSharingOccurrenceId, setActiveSharingOccurrenceId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [familiarShareStatuses, setFamiliarShareStatuses] = useState<{ [key: string]: 'pendente' | 'aberto' | 'confirmado' }>({});
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  // Compartilhamento coletivo via WhatsApp para encerramento de periodo letivo
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };
// Occurrence modal states
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [occurrenceForm, setOccurrenceForm] = useState({ tipo: 'queda', criticidade: 'amarelo', descricao: '' });
  const [emergencyMinimized, setEmergencyMinimized] = useState(true);

  // Stop Shift Reason Modal states
  const [showStopIndividualShiftModal, setShowStopIndividualShiftModal] = useState(false);
  const [stopShiftReason, setStopShiftReason] = useState('Consulta Medica / Exame');
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
      setCaregiverPinError('PIN incorreto ou nao pertence a um profissional de plantao.');
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
    if (!isStaffUser(usuarioAtual) && mode === 'cuidador') {
      setVisualMode('familia');
      return;
    }
    setVisualMode(mode);
  };

  // Quick Action form states
  const [quickMeal, setQuickMeal] = useState<{ refeicao: string; aceitacao: string; observacao: string; quantidadeMl?: number }>({ refeicao: 'mamadeira', aceitacao: 'muito_bem', observacao: '', quantidadeMl: 180 });
  const [quickHygiene, setQuickHygiene] = useState(() => {
    const saved = getHygieneLog(idoso.id);
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
      // Only write to localStorage/trigger re-renders on checkbox changes, not on observations text field keystroke typing
      if (!('observations' in updatedFields)) {
        const defaultTime = getNowTimeBr();
        const hygieneLog = {
          ...next,
          banho: next.bath,
          higieneBucal: next.teeth,
          trocaRoupa: next.clothes,
          trocaFralda: next.diaper,
          pele: next.cream,
          observations: next.observations || '',
          obs: next.observations || '',
          time: defaultTime,
          date: getTodayIso(),
          registradoPor: usuarioAtual?.nome || 'Pai / Responsavel'
        };
        saveHygieneLog(idoso.id, hygieneLog);
      }
      return next;
    });
  };

  const handleToggleHygieneCard = (field: 'diaper' | 'teeth' | 'clothes' | 'hands' | 'cream') => {
    setQuickHygiene(prev => {
      const next = { ...prev };
      if (field === 'diaper') {
        // Cycle: Pendente -> Fez Xixi -> Fez Coco -> Ambos -> Seca -> Pendente
        const currentText = prev.observations || '';
        if (!prev.diaper) {
          next.diaper = true;
          next.observations = 'Fez Xixi';
        } else if (currentText === 'Fez Xixi') {
          next.observations = 'Fez Coco';
        } else if (currentText === 'Fez Coco') {
          next.observations = 'Xixi e Coco';
        } else if (currentText === 'Xixi e Coco') {
          next.observations = 'Fralda Seca / Limpa';
        } else {
          next.diaper = false;
          next.observations = '';
        }
      }
      if (field === 'diaper') { /* already handled above */ } else
      if (field === 'teeth') next.teeth = !prev.teeth;
      if (field === 'clothes') next.clothes = !prev.clothes;
      if (field === 'hands') next.hands = !prev.hands;
      if (field === 'cream') next.cream = !prev.cream;
      
      const defaultTime = getNowTimeBr();
      const hygieneLog = {
        ...next,
        banho: next.bath,
        higieneBucal: next.teeth,
        trocaRoupa: next.clothes,
        trocaFralda: next.diaper,
        pele: next.cream,
        observations: next.observations || '',
        obs: next.observations || '',
        time: defaultTime,
        date: getTodayIso(),
        registradoPor: usuarioAtual?.nome || 'Pai / Responsavel'
      };
      saveHygieneLog(idoso.id, hygieneLog);
      setVitalsUpdateTrigger(p => p + 1);
      showToast('Registro de higiene salvo com sucesso!', 'success');
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

    // Synchronize sleep state from localStorage
    const sonos = getFromDB<any[]>('anjo_sono', []).filter(s => s.idosoId === idoso.id && isTodayOrDemoDate(s.data));
    if (sonos.length > 0) {
      const lastSono = sonos[sonos.length - 1];
      if (lastSono.dormiuEm && lastSono.acordouEm) {
        setSleepStart(lastSono.dormiuEm);
        setSleepEnd(lastSono.acordouEm);
        if (!isEscolar && !quickVitals.pressao) {
          setQuickVitals(prev => (prev.pressao ? prev : { ...prev, pressao: `Dormiu das ${lastSono.dormiuEm} As ${lastSono.acordouEm}` }));
        }
      }
    }
  }, [idoso, keyTrigger, appMode]);

  // Synchronize separate quickSleepText state for escolar mode
  useEffect(() => {
    if (isEscolar) {
      const sonos = getFromDB<any[]>('anjo_sono', []).filter(s => s.idosoId === idoso.id && isTodayOrDemoDate(s.data));
      if (sonos.length > 0) {
        const lastSono = sonos[sonos.length - 1];
        if (lastSono.observacoes) {
          setQuickSleepText(lastSono.observacoes);
        } else if (lastSono.dormiuEm && lastSono.acordouEm) {
          setQuickSleepText('Dormiu das ' + lastSono.dormiuEm + ' As ' + lastSono.acordouEm);
        }
      } else {
        setQuickSleepText('');
      }
    }
  }, [idoso, keyTrigger, appMode]);

  // Synchronize quick hygiene state from getHygieneLog
  useEffect(() => {
    if (!idoso?.id) return;
    const savedHyg = getHygieneLog(idoso.id);
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
      // Synchronize checkboxes in quickVitals
      setQuickVitals(prev => ({
        ...prev,
        bath: Boolean(savedHyg.bath ?? savedHyg.banho),
        teeth: Boolean(savedHyg.teeth ?? savedHyg.higieneBucal),
        clothes: Boolean(savedHyg.clothes ?? savedHyg.trocaRoupa),
        hands: Boolean(savedHyg.hands ?? savedHyg.bath),
        cream: Boolean(savedHyg.cream ?? savedHyg.pele),
      }));
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
      setQuickVitals(prev => ({
        ...prev,
        bath: false,
        teeth: false,
        clothes: false,
        hands: false,
        cream: false,
      }));
    }
  }, [idoso?.id, vitalsUpdateTrigger]);

  // Synchronize text inputs only when changing selected student
  useEffect(() => {
    if (!idoso?.id) return;
    const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []).filter(v => v.idosoId === idoso.id && isTodayOrDemoDate(v.data));
    const latestVital = vitalsStore.length > 0 ? vitalsStore[vitalsStore.length - 1] : null;

    setQuickVitals(prev => ({
      ...prev,
      pressao: '',
      glicemia: latestVital?.fralda && latestVital.fralda !== 'Sem trocas' ? latestVital.fralda : '',
      temp: (latestVital?.temperatura && latestVital.temperatura > 0) ? String(latestVital.temperatura) : '',
      fCard: '',
      sat: '',
      peso: idoso.peso ? String(idoso.peso) : '',
      obs: '',
    }));
  }, [idoso?.id]);

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
    if (usuarioAtual && !isStaffUser(usuarioAtual)) {
      setVisualMode('familia');
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
      console.log(` [Dashboard Component] syncShiftState executado para idoso/aluno: ${targetId} (${idoso.nome}) | Ativo: ${activeShift.active} | Inicio: ${activeShift.startTime}`);
      setIsShiftActive(prevActive => {
        if (prevActive !== activeShift.active) {
          console.log(` [Dashboard State] Alterando isShiftActive de ${prevActive} para ${activeShift.active}`);
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
    window.addEventListener('storage', syncShiftState);
    window.addEventListener('db-vitals-update', handleVitalsChange);
    document.addEventListener('visibilitychange', syncShiftState);

    // Run sync immediately on mount or student ID change
    syncShiftState();

    const intervalId = setInterval(syncShiftState, 1000);

    return () => {
      window.removeEventListener('anjo_shift_updated', syncShiftState);
      window.removeEventListener('storage', syncShiftState);
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

  // Live timer for active caregiver shift duration (Ref-based, aggressive clear & auto-expire)
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isShiftActive && shiftStartTime) {
      isTimerActiveRef.current = true;

      const calculateElapsed = (startMs: number): string => {
        const diffMs = Math.max(0, Date.now() - startMs);
        const totalSecs = Math.floor(diffMs / 1000);
        const secs = totalSecs % 60;
        const mins = Math.floor(totalSecs / 60) % 60;
        const hours = Math.floor(totalSecs / 3600);
        const pad = (n: number) => String(n).padStart(2, '0');
        return pad(hours) + ':' + pad(mins) + ':' + pad(secs);
      };

      const updateTimer = () => {
        const activeState = getShiftActiveState(idoso.id);
        if (!activeState.active || !isTimerActiveRef.current) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerActiveRef.current = false;
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');
          return;
        }

        let startMs = 0;
        const activeStartTime = activeState.startTime || shiftStartTime || localStorage.getItem('anjo_shift_start_time_' + idoso.id);
        if (activeStartTime) {
          const parsed = new Date(activeStartTime).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            startMs = parsed;
          }
        }

        if (startMs === 0) {
          setElapsedShiftTime('00:00:00');
          return;
        }

        // Auto-expire stale shifts older than 🍼 hours (e.g. 33 hrs)
        if ((Date.now() - startMs) > (14 * 60 * 60 * 1000)) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerActiveRef.current = false;
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');
          try {
            localStorage.setItem('anjo_shift_active', 'false');
            localStorage.setItem('anjo_shift_active_' + idoso.id, 'false');
            localStorage.removeItem('anjo_shift_start_time_' + idoso.id);
          } catch(e) {}
          return;
        }

        setElapsedShiftTime(calculateElapsed(startMs));
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      document.addEventListener('visibilitychange', updateTimer);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        document.removeEventListener('visibilitychange', updateTimer);
      };
    } else {
      isTimerActiveRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setElapsedShiftTime('00:00:00');
    }
  }, [isShiftActive, shiftStartTime, idoso.id]);


  // Force sync from localStorage if state desyncs
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
          (cleanTitle.includes('calcio') && cleanName.includes('calcio')) ||
          (cleanTitle.includes('calcio') && cleanName.includes('calcio')) ||
          (cleanTitle.includes('donepezila') && cleanName.includes('donepezila')) ||
          (cleanTitle.includes('aricept') && cleanName.includes('aricept')) ||
          (cleanTitle.includes('soro') && cleanName.includes('soro')) ||
          (cleanTitle.includes('inalacao') && cleanName.includes('inalacao')) ||
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
      t.titulo.toLowerCase().includes('calcio')
    );

    // Contar quantas tarefas de almoco/papinha padrao existem para este aluno
    const lunchTasksCount = seniorTasks.filter(t => {
      const tit = (t.titulo || '').toLowerCase();
      // Nao conta atividades personalizadas da Aura como almoco duplicado
      if (t.id.startsWith('task_aura_')) return false;
      return tit.includes('almoco') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');
    }).length;

    // Se o usuario limpou explicitamente as tarefas/atividades deste perfil, respeita e mantem limpo
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

    // Se houver tarefas de idoso indevidas ou comentarios conversacionais da IA salvos como tarefa, limpa automaticamente
    if (isEscolar || idoso.id.startsWith('aluno_')) {
      const sanitized = seniorTasks.filter(t => 
        !t.id.startsWith('task_j_') && 
        !t.id.startsWith('task_m_') && 
        !t.id.startsWith('task_d_') && 
        !t.titulo.toLowerCase().includes('artrose') && 
        !t.titulo.toLowerCase().includes('daflon') && 
        !t.titulo.toLowerCase().includes('metformina') && 
        !t.titulo.toLowerCase().includes('losartana') && 
        !t.titulo.toLowerCase().includes('calcio') &&
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

    // Realinha automaticamente tarefas que possuem conflito sem ou deslocamento de horario
    let hasRealigned = false;
    const realignedSeniorTasks = seniorTasks.map(t => {
      const { title: alignedTitle, tipo: alignedType } = realignPedagógicalActivity(t.titulo, t.descricao || '', t.horarioPrevisto || '', t.tipo);
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
      const isLunch = tit.includes('almoco') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');

      if (isEscolar && isLunch) {
        if (seenLunch) {
          // Ignora qualquer almoco/papinha duplicado em outro horario
          return;
        }
        seenLunch = true;
      }

      // Normaliza o titulo para detectar repeticoes do mesmo horario
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
          titulo: 'Acolhida & Entrada Afetiva ',
          descricao: 'Recepcao carinhosa dos alunos, acolhimento individual e organizacao de pertences.',
          horarioPrevisto: '07:00',
          status: 'pendente'
        },
        {
          id: 'task_s_roda_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Roda de Conversa: Tema do Dia ',
          descricao: 'Apresentacao do tema diario, musicalizacao, chamada divertida e expressao das criancas.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_s_lanche_manha_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Lanche da Manha & Frutinhas ',
          descricao: 'Frutas frescas da estacao, biscoito integral e incentivo A hidratacao.',
          horarioPrevisto: '09:00',
          status: 'pendente'
        },
        {
          id: 'task_s_parque_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Recreacao no Patio & Parquinho ',
          descricao: 'Brincadeiras ao ar livre para estimulo motor, socializacao e banho de sol adequado.',
          horarioPrevisto: '09:45',
          status: 'pendente'
        },
        {
          id: 'task_s_dirigida_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Atividade Dirigida Tematica (BNCC) ',
          descricao: 'Atividade pratica pedagógica com foco no desenvolvimento cognitivo e sensorial.',
          horarioPrevisto: '10:30',
          status: 'pendente'
        },
        {
          id: 'task_s_almoco_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almoco Saudavel / Papinha ',
          descricao: 'Pratinho balanceado, introducao de novos sabores, verduras e carninha desfiada.',
          horarioPrevisto: '11:30',
          status: 'pendente'
        },
        {
          id: 'task_s_higiene_escovacao_' + idosoId,
          idosoId,
          tipo: 'banho',
          titulo: 'Higiene, Fraldas & Escovacao ',
          descricao: 'Troca de fraldas, lavagem das maos e estimulo A escovacao dental com carinho.',
          horarioPrevisto: '12:15',
          status: 'pendente'
        },
        {
          id: 'task_s_soneca_' + idosoId,
          idosoId,
          tipo: 'sono',
          titulo: 'Soneca & Repouso Restaurador ',
          descricao: 'Descanso nos colchonetes individuais com ambiente calmo, iluminacao suave e musica relaxante.',
          horarioPrevisto: '12:30',
          status: 'pendente'
        },
        {
          id: 'task_s_lanche_tarde_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Lanche da Tarde & Frutinhas ',
          descricao: 'Frutas frescas da epoca fatiadas, biscoito integral e hidratacao da tarde.',
          horarioPrevisto: '14:15',
          status: 'pendente'
        },
        {
          id: 'task_s_brincadeira_livre_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Brincadeira Livre & Socializacao ',
          descricao: 'Cantinhos tematicos com brinquedos educativos, blocos de montar e autonomia.',
          horarioPrevisto: '14:45',
          status: 'pendente'
        },
        {
          id: 'task_s_historias_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Contacao de Historias & Musica ',
          descricao: 'Leitura de livros ilustrados, fantoches e cantigas de roda.',
          horarioPrevisto: '15:30',
          status: 'pendente'
        },
        {
          id: 'task_s_saida_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Preparacao para Saida & Despedida Afetiva ',
          descricao: 'Organizacao das mochilinhas, fechamento da agenda do dia e entrega afetiva aos familiares.',
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
          titulo: 'Losartana Potassica (Pressao)',
          descricao: 'Dosagem: 50mg - 1 comprimido. Dar com meio copo d\'agua.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_m_cafe',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Cafe da manha',
          descricao: 'Geleia sem acucar com pao integral + cafe com leite descascar.',
          horarioPrevisto: '08:30',
          status: 'pendente'
        },
        {
          id: 'task_m_alongamento',
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Alongamento Leve e Exercicio Funcional',
          descricao: '20 a 30 minutos de alongamento guiado e exercicios de mobilidade funcional.',
          horarioPrevisto: '09:30',
          status: 'pendente'
        },
        {
          id: 'task_m_banho',
          idosoId,
          tipo: 'banho',
          titulo: 'Banho & Higiene Geral',
          descricao: 'Banho morno assistido, hidratacao da pele e troca de roupas limpas.',
          horarioPrevisto: '10:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_calcio',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Calcio + Vitamina D',
          descricao: 'Dosagem: 1 sachet diluido em 100ml de agua ou suco junto ao almoco.',
          horarioPrevisto: '12:30',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_almoco',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almoco',
          descricao: 'Arroz integral, pure de abobora, file de frango desfiado e brocolis cozido ao vapor.',
          horarioPrevisto: '12:30',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_hidra_tarde',
          idosoId,
          tipo: 'hidratacao',
          titulo: 'Copos d\'Agua da Tarde',
          descricao: 'Oferecer 250ml de agua gelada.',
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
          descricao: 'Dosagem: 850mg apos o cafe da manha.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_j_cafe',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Cafe da manha',
          descricao: 'Ovos mexidos sem oleo, torrada de centeio e cafe preto adocado.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_j_circulacao',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Daflon 1000mg',
          descricao: '1 comprimido para circulacao.',
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
          titulo: 'Insistir na Agua Senior',
          descricao: 'Oferecer copo de 300ml.',
          horarioPrevisto: '11:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_j_almoco',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almoco Balanceado',
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
        label: isEscolar ? 'Ocorrencia escolar critica' : 'Ocorrencia critica registrada',
        bg: 'bg-rose-50 border-rose-350',
        text: 'text-rose-900',
        details: `Ha ${criticalOccurrences.length} ocorrencia(s) critica(s) registrada(s) neste turno. Recomenda-se atencao imediata.`,
        status: 'vermelho'
      };
    } else if (atrasadas > 0 || recusadas > 0 || occurrencesList.some(o => o.criticidade === 'amarelo')) {
      return {
        color: '#F2C94C',
        label: isEscolar ? 'Atencao necessaria' : 'Atencao necessaria',
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-900',
        details: isEscolar
          ? `Rotina sob monitoramento. Registramos ${atrasadas} atividade(s) pendente(s) ou ${recusadas} recusa(s) para acompanhamento dos pais.`
          : `Rotina sob monitoramento. Registramos ${atrasadas} item(ns) pendente(s) ou ${recusadas} recusa(s) de cuidado para acompanhamento da familia.`,
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
    if (lower.includes('mamadeira') || lower.includes('formula') || lower.includes('formula')) return 'mamadeira';
    if (lower.includes('cafe') || lower.includes('cafe') || lower.includes('desjejum') || lower.includes('manha') || lower.includes('manha')) return 'cafe_manha';
    if (lower.includes('almoco') || lower.includes('almoco') || lower.includes('papinha')) return 'almoco';
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
            horario: getNowTimeBr(),
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
          horario: getNowTimeBr(),
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
          ? (commentText ? `${task.descricao}\n\nObservacao do Educador: ${commentText}` : task.descricao)
          : (commentText || 'Atividade realizada com sucesso.');
        ativs.push({
          id: 'ati_dash_' + Date.now(),
          idosoId: idoso.id,
          tipo: task.titulo,
          duracaoMinutos: 30,
          horario: getNowTimeBr(),
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
        alert(` [!]  Operacao Nao Autorizada: Nenhum pai ou responsavel autorizou "Alimentacao e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora nao tem permissao para registrar ou realizar esta atividade.`);
        return;
      }
    }

    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }

    // Check if refusal and comment is blank
    if (targetStatus === 'recusado' && !comment.trim()) {
      alert(" [!]  Atencao: Por favor, preencha o campo de observacoes com a justificativa tecnica para a recusa ou nao-administracao do cuidado!");
      return;
    }

    if (!simulatedOnline) {
      //  REGISTRO OFFLINE: Salvar na Fila com seguranca
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
        status_sincronização: 'pendente'
      };

      await adicionarItemFila(novoItemOffline);
      await loadOfflineQueue();

      // Update state visually but show it's offline pending
      const updated = tarefas.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: targetStatus,
            concluidaEm: getNowTimeBr() + ' (Aparelho Offline )',
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
        acao: `Registro de Saude Offline - ID: ${taskId} [${targetStatus.toUpperCase()}]`,
        data: new Date().toLocaleString('pt-BR'),
        ip: '10.0.2.15 (Celular Cuidador - em fila local)',
        detalhes: `Registros salvos localmente no IndexedDB e pendentes de sincronismo.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
      setLgpdAudits(logs);

      setObservacaoRapida({ ...observacaoRapida, [taskId]: '' });
      return;
    }

    //  REGISTRO EM TEMPO REAL ON-LINE
    const updated = tarefas.map(t => {
      if (t.id === taskId) {
        const detailStr = comment ? ` Relato: "${comment}".` : '';
        const actionText = targetStatus === 'concluido' ? 'concluida' : ' [!]  RECUSADA (Registrado com Justificativa)';
        const msg = `AnjoCuidador: A atividade "${t.titulo}" de ${idoso.nome} foi registrada como ${actionText} por ${usuarioAtual.nome}.${detailStr}`;
        
        triggerWhatsAppSim(t.titulo + ' ' + (targetStatus === 'concluido' ? 'Concluido' : 'Recusado'), msg);

        return {
          ...t,
          status: targetStatus,
          concluidaEm: getNowTimeBr(),
          completadaPor: usuarioAtual.nome,
          observacao: comment,
          detalhes: {
            horario_planejado: t.horarioPrevisto,
            horario_registrado_dispositivo: new Date().toISOString(),
            horario_sincronizado_servidor: new Date().toISOString(),
            status_sincronização: 'online'
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
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1) + ' (IP Movel)',
      detalhes: `Acao transmitida via HTTPS com seguranca de ponta a ponta.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdAudits(logs);

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
      setIsShiftActive(true); console.log(' [Dashboard] Manually setting shift active to true');
      setShiftStartTime(startTimeStamp);
      localStorage.setItem('anjo_shift_active', 'true');
      localStorage.setItem('anjo_shift_active_ts', String(Date.now()));
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
      horario: getNowTimeBr(),
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
      recusa_medicacao: 'Recusa de medicacao',
      recusa_alimentar: 'Recusa alimentar',
      comportamento: 'Alteracao de comportamento',
      pressao: 'Pressao alterada',
      outro: 'Outro'
    };
    const tipoLabel = tipoMap[occurrenceForm.tipo] || occurrenceForm.tipo;

    // LGPD Trace Log for incident tracking
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Registro de Ocorrencia Atipica - [${tipoLabel}]`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Intercorrência salva no historico de cuidado de ${idoso.nome}: "${occurrenceForm.descricao}".`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdAudits(logs);

    // Custom High-Fidelity message design layout requested by the user
    const msg = ` *AnjoCuidador  Intercorrência registrada* 

Ola, familia.
Foi registrada uma intercorrência com *${idoso.nome}*.

*Tipo:* ${tipoLabel}
*Horario:* ${novaOcorrencia.horario}
*Cuidador(a):* ${usuarioAtual.nome}
*Descricao:* ${occurrenceForm.descricao}

*Recomendacao:* entrar em contato com a cuidadora para alinhamento.

_Mensagem preparada pelo aplicativo AnjoCuidador._`;

    triggerWhatsAppSim('ALERTA ATIPICO', msg);

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
          recusa_medicacao: 'Recusa de medicacao', recusa_alimentar: 'Recusa alimentar',
          comportamento: 'Alteracao de comportamento', pressao: 'Pressao alterada', outro: 'Outro'
        };
        const label = tipoMap[list[idx].tipo] || list[idx].tipo;

        logs.unshift({
          id: 'log_wa_open_' + Date.now(),
          autor: usuarioAtual.nome,
          acao: `WhatsApp aberto (Envio Assistido)`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Direcionado para o WhatsApp com rascunho de intercorrênciatipo de "${label}".`
        });
        saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
        setLgpdAudits(logs);
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
          recusa_medicacao: 'Recusa de medicacao', recusa_alimentar: 'Recusa alimentar',
          comportamento: 'Alteracao de comportamento', pressao: 'Pressao alterada', outro: 'Outro'
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
          detalhes: `Cuidador confirmou o envio correto da mensagem de intercorrência [${label}] para os familiares.`
        });
        saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
        setLgpdAudits(logs);

        // Alimentar o Feed de Logs do Simulador para transparencia visual
        const allNotif = getFromDB<any[]>('anjo_notificacoes', []);
        allNotif.push({
          id: 'notif_wa_' + Date.now(),
          idosoId: idoso.id,
          familiarNome: usuarioAtual.nome,
          telefoneDestino: '(Familiares)',
          mensagem: `[ ENVIADO] Alerta confirmado pelo cuidador no painel de controle:\n\n${manualShareOccurrenceMessage}`,
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

  // Helper para o caso de nao ter enviado
  const handleNotSentYet = () => {
    setShowManualOccurrenceShareModal(false);
    setManualShareOccurrenceMessage(null);
    setActiveSharingOccurrenceId(null);
  };

  // Copiar mensagem para area de transferencia
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
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para desfazer ou alterar atividades!");
      return;
    }
    if (!isShiftActive) {
      const startTimeStamp = new Date().toISOString();
      setIsShiftActive(true); console.log(' [Dashboard] Manually setting shift active to true');
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
      acao: `Anulacao de Acao de Cuidado - ID: ${taskId}`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Status retornado para PENDENTE por auditoria direta do cuidador.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdAudits(logs);
  };

  // Simulated Connection Mode Toggler
  const handleToggleConnection = () => {
    const nextState = !simulatedOnline;
    setSimulatedOnline(nextState);
    localStorage.setItem('anjo_simulated_online', String(nextState));
  };

  // Syncing Queue toCloud Server (With full auditing logs)
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
          observacao: `${item.observacao} (Sincronizado via Fila )`,
          detalhes: {
            horario_planejado: item.horario_planejado,
            horario_registrado_dispositivo: item.horario_registrado_dispositivo,
            horario_sincronizado_servidor: serverTime,
            status_sincronização: 'offline_sincronizado'
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
        else if (item.titulo.toLowerCase().includes('cafe') || item.titulo.toLowerCase().includes('cafe') || item.titulo.toLowerCase().includes('desjejum') || item.titulo.toLowerCase().includes('lanchinho')) parsedRefeicao = 'cafe_manha';
        else if (item.titulo.toLowerCase().includes('almoco') || item.titulo.toLowerCase().includes('papinha') || item.titulo.toLowerCase().includes('almocinho')) parsedRefeicao = 'almoco';
        else if (item.titulo.toLowerCase().includes('lanche') || item.titulo.toLowerCase().includes('frutinha')) parsedRefeicao = 'lanche';
        else if (item.titulo.toLowerCase().includes('jantar') || item.titulo.toLowerCase().includes('jantinha')) parsedRefeicao = 'jantar';
        else if (item.titulo.toLowerCase().includes('ceia')) parsedRefeicao = 'ceia';

        // Parse aceitacao dynamically from observacao
        let parsedAceitacao = 'muito_bem';
        if (item.observacao.includes('muito_bem')) parsedAceitacao = 'muito_bem';
        else if (item.observacao.includes('aceitacao: pouco') || item.observacao.includes('Aceitacao: pouco') || item.observacao.includes('pouco')) parsedAceitacao = 'pouco';
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
      acao: `SincronismoColetivo de Banco Offline (Fila: ${pendentes.length} acoes)`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '177.10.150.12 (Sincronismo Movel)',
      detalhes: `Dados integrados com sucesso. Auditoria de registros de seguranca concluida sem quebras de integridade.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdAudits(logs);
    
    // Notify Server simulated WhatsApp of sync batch
    const msg = `AnjoCuidador: Sincronização offline concluida com sucesso! ${pendentes.length} acoes salvas pelo cuidador foram enviadas com integridade auditavel ao servidor.`;
    triggerWhatsAppSim('Sincronização Offline Auditoria', msg);

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
    if (name.includes('Bercario I')) return 'Bercario I';
    if (name.includes('Bercario II')) return 'Bercario II';
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
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para criar atividades ou alterar a rotina!");
      return;
    }
    if (!isShiftActive) {
      ensureAuthorizedAndActiveShift(isEscolar ? "Nova Atividade" : "NovoCuidado");
    }
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!newTaskForm.titulo.trim() || !newTaskForm.horarioPrevisto.trim()) {
      alert("Por favor, preencha o titulo e o horario previsto!");
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
          detalhes: `Atividade coletiva de tipo ${newTaskForm.tipo} para toda a classe (${currentClassroom}) agendada para As ${newTaskForm.horarioPrevisto}.`
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
        acao: isEscolar ? `Adicionou atividade A agenda escolar: ${newTask.titulo}` : `Adicionou nova tarefa de cuidado: ${newTask.titulo}`,
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
      alert(` Atividade coletiva adicionada com sucesso para todos os ${createdCount} alunos da sala!`);
    } else {
      alert("Atividade adicionada A agenda do turno com sucesso!");
    }
  };

  const handleParseAuraWeeklyPlan = async () => {
    if (!auraWeeklyText.trim()) {
      alert('Por favor, cole o texto do planejamento gerado pela Aura!');
      return;
    }

    setIsParsingAuraWeekly(true);

    try {
      // 1. Extracao Local Imediata de Ultra-Velocidade (< 2ms)
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
          objetivoBNCC: act.objetivoBNCC || 'BNCC Educacao Infantil',
          materiais: act.materiais || []
        }));
        setParsedAuraTasks(list);
        setSelectedAuraDayTab('todos');
        setIsParsingAuraWeekly(false);
        return;
      }

      // 2. Se o parser local nao encontrou blocos padroes, tenta a API com timeout rapido de 4s
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
          const rawTitle = typeof a.title === 'string' ? a.title : 'Atividade Pedagógica';
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
            descricao: instStr || `Atividade pedagógica planejada para as ${timeStr}.`,
            horario: timeStr,
            objetivoBNCC: a.bnccObjective || 'BNCC Educacao Infantil',
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
      const { title: alignedTitle, tipo: alignedType } = realignPedagógicalActivity(t.titulo, t.descricao || '', t.horarioPrevisto || '', t.tipo);
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
      alert(` Perfeito! ${count} atividade(s) foram corrigidas e realinhadas automaticamente com seus horarios e nomes pedagogicos corretos!`);
    } else {
      alert(' Todas as atividades ja estao 100% alinhadas com seus nomes e horarios corretos!');
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
    alert(' Todas as atividades e tarefas anteriores foram limpas com sucesso!');
  };

  const handleSaveAuraWeeklyPlan = (dayFilterOnly?: string) => {
    if (parsedAuraTasks.length === 0) return;

    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para criar atividades!");
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

    // Todas as atividades de todos os dias vao para o historico/registro pedagogico completo (anjo_atividades)
    const newAtivsBatch: RegistroAtividade[] = [];
    const todayIso = getTodayIso();

    // Determina quais tarefas entram na rotina diaria do dia de hoje (anjo_tarefas_diarias)
    // Se o usuario selecionou uma aba especifica, usa aquele dia.
    // Se selecionou "todos" ou nao especificou, escolhe as tarefas do dia de hoje (ou primeiro dia) para a rotina diaria sem repeticao!
    const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
    const currentDayName = DAY_NAMES[new Date().getDay()];
    
    let dailyTasksToApply = tasksToApply;
    if (!dayFilterOnly || dayFilterOnly === 'todos') {
      const distinctDays = Array.from(new Set(tasksToApply.map(t => t.dia || t.dataStr).filter(Boolean)));
      if (distinctDays.length > 1) {
        const todayMatch = tasksToApply.filter(t => t.dia?.toLowerCase() === currentDayName.toLowerCase() || t.dataIso === todayIso);
        if (todayMatch.length > 0) {
          dailyTasksToApply = todayMatch;
        } else {
          // Se hoje nao estiver no plano, usa o primeiro dia do plano como rotina diaria
          const firstDay = distinctDays[0];
          dailyTasksToApply = tasksToApply.filter(t => t.dia === firstDay || t.dataStr === firstDay);
        }
      }
    }

    // Cria as atividades no historico completo
    tasksToApply.forEach((pItem, pIdx) => {
      const taskDate = pItem.dataIso || todayIso;
      targetStudents.forEach((st, stIdx) => {
        let enrichedDesc = pItem.descricao || '';
        if (pItem.objetivoBNCC && !enrichedDesc.includes(pItem.objetivoBNCC)) {
          enrichedDesc += `\n Campo BNCC: ${pItem.objetivoBNCC}`;
        }
        if (pItem.materiais && pItem.materiais.length > 0) {
          enrichedDesc += `\n Materiais: ${pItem.materiais.join(', ')}`;
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

    // Cria as tarefas diarias para a agenda do dia, garantindo NUNCA duplicar mesmo horario + titulo
    const newBatch: TarefaDiaria[] = [];
    const seenDailyKeys = new Set<string>();

    dailyTasksToApply.forEach((pItem, pIdx) => {
      let enrichedDesc = pItem.descricao || '';
      if (pItem.objetivoBNCC && !enrichedDesc.includes(pItem.objetivoBNCC)) {
        enrichedDesc += `\n Campo BNCC: ${pItem.objetivoBNCC}`;
      }
      if (pItem.materiais && pItem.materiais.length > 0) {
        enrichedDesc += `\n Materiais: ${pItem.materiais.join(', ')}`;
      }

      const normTime = (pItem.horario || '09:00').trim();
      const normTitle = (pItem.titulo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${normTime}_${normTitle}`;

      if (seenDailyKeys.has(key)) {
        return; // Pula duplicatas no mesmo horario
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
    alert(` Sucesso! ${tasksToApply.length} atividade(s) ${dayLabel} foram agendadas com todas as informacoes completas (data, horario, titulo, descricao detalhada, BNCC e materiais) para ${targetStudents.length} aluno(s)!`);
  };

  const handleEditTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para editar atividades!");
      return;
    }
    if (!editingTaskForm.titulo.trim() || !editingTaskForm.horarioPrevisto.trim()) {
      alert("Por favor, preencha o titulo e o horario previsto!");
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
      detalhes: `Novos dados - Titulo: ${editingTaskForm.titulo}, Horario: ${editingTaskForm.horarioPrevisto}`
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
      alert(" [!]  Operacao Bloqueada: Familiares nao tem permissao para excluir atividades!");
      return;
    }
    const description = isEscolar 
      ? `Deseja realmente remover a atividade "${taskTitle}" da rotina de hoje?` 
      : `Deseja realmente excluir permanentemente a tarefa "${taskTitle}"?`;

    triggerConfirm(
      'Confirmar Remocao',
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
          detalhes: `A tarefa foi removida da agenda diaria.`
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
      alert("Nao ha atividades na agenda deste aluno para verificar.");
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
          /^(atividade|atividade dirigida|atividade pedagógica|refeicao|lanche|tarefa)$/i.test((title || '').replace(/[^\w\s]/gi, '').trim()) ||
          (title || '').toLowerCase().includes('tematica (bncc)');

        let bestTitle = ex.titulo;
        if (isGeneric(ex.titulo) && !isGeneric(t.titulo)) {
          bestTitle = t.titulo;
        } else if (!isGeneric(t.titulo) && (t.titulo || '').length > (ex.titulo || '').length) {
          bestTitle = t.titulo;
        }

        let mergedDesc = t.descricao || ex.descricao || '';
        if (ex.descricao && t.descricao && !ex.descricao.includes(t.descricao) && !t.descricao.includes(ex.descricao)) {
          mergedDesc = `${t.descricao}\n\n Detalhes adicionais: ${ex.descricao}`;
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
      alert(" Nenhuma tarefa duplicada encontrada! Todas as atividades possuem horarios ou titulos distintos.");
      return;
    }

    const otherTasks = allTasks.filter(t => t.idosoId !== idoso.id);
    const finalAllTasks = [...otherTasks, ...dedupedStudentTasks];
    saveToDB('anjo_tarefas_diarias', finalAllTasks);
    setTarefas(dedupedStudentTasks);

    alert(` Sucesso! ${removedCount} atividade(s) duplicada(s) foram unificadas da agenda.`);
  };

  const handleResetToDefaultTasks = () => {
    if (!confirm('Deseja restaurar a rotina padrao recomendada de horarios? As atividades atuais serao substituidas pelo cronograma padrao da turma.')) {
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
    alert(' Rotina padrao restaurada com sucesso!');
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
      if (!confirm(`Deseja realmente limpar TODAS as atividades da agenda de ${idoso.nome} hoje? Voce podera adicionar novas atividades manuais ou importar o planejamento da Aura quando quiser.`)) {
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
    alert(`  Agenda e atividades anteriores limpas com sucesso para ${targetStudents.length} ${targetStudents.length === 1 ? 'aluno' : 'alunos'}!`);
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
      alert(" [!]  Operacao Bloqueada: Apenas educadores/cuidadores autorizados podem registrar ou alterar faltas/ausencias de alunos!");
      return;
    }
    const nextAbsent = !isAbsent;
    
    if (nextAbsent) {
      const confirmMsg = isShiftActive 
        ? `Tem certeza que deseja registrar Falta/Ausencia para ${idoso.nome}? Como as aulas ja foram iniciadas, marcar a falta ira limpar todo o historico de atividades registrado hoje para ele e enviara o aviso de ausencia aos pais.`
        : `Deseja registrar Falta/Ausencia para ${idoso.nome}? Isso enviara uma notificacao de aviso de ausencia aos pais.`;
        
      triggerConfirm(
        isEscolar ? 'Confirmar Registro de Falta' : 'Confirmar Registro de Ausencia',
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
            acao: `Registrado Falta / Ausencia de Aluno`,
            data: new Date().toLocaleString('pt-BR'),
            ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
            detalhes: `Aluno marcado como ausente hoje. O periodo ativo foi encerrado e os dados correntes foram limpos por solicitacao.`
          });
          saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
          setLgpdAudits(logs);

          // Trigger simulated WhatsApp message to parents
          const cleanName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
          const abMsg = `Anjo Escolar  Aviso de Ausencia
          
Ola. Registramos que o(a) aluno(a) *${cleanName}* nao compareceu hoje As atividades / aulas (Falta Justificada). 

Desejamos um excelente dia e esperamos ve-lo(a) de volta em breve! Qualquer duvida, estamos A disposicao.`;
          
          triggerWhatsAppSim('Aviso de Ausencia e Falta Corrente', abMsg);
          showToast(`Falta hoje registrada para ${cleanName}!`);
          window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        }
      );
    } else {
      triggerConfirm(
        isEscolar ? 'Confirmar Presença do Aluno(a)' : 'Confirmar Presença doCliente',
        `Tem certeza que deseja remover o registro de falta/ausencia de hoje para ${idoso.nome}?`,
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
          setLgpdAudits(logs);
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
        ? " [!]  Periodo Letivo Nao Iniciado!\n\nPor favor, clique no botao 'Iniciar Periodo' ou 'Iniciar Coletivo' no topo da pagina antes de lancar qualquer refeicao, higiene, comportamento, medicamento ou saude do aluno!" 
        : " [!]  Turno de Cuidados Nao Iniciado!\n\nPor favor, clique no botao 'Iniciar Meu Turno de Cuidados' no topo da pagina antes de lancar qualquer controle de rotina, refeicao, higiene ou saude!"
      );
    }
  };

  const handleStartShift = () => {
    handleStartShiftWithPreservation();
  };

  const handleStartShiftWithPreservation = () => {
    const startTimeStamp = new Date().toISOString();
    const nowTs = Date.now();

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
        horario: getNowTimeBr(),
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

    setIsShiftActive(true); console.log(' [Dashboard] Manually setting shift active to true');
    setShiftStartTime(startTimeStamp);
    localStorage.setItem('anjo_shift_active', 'true');
    localStorage.setItem('anjo_shift_active_ts', String(nowTs));
    localStorage.setItem('anjo_shift_active_' + idoso.id, 'true');
    localStorage.setItem('anjo_shift_active_' + idoso.id + '_ts', String(nowTs));
    localStorage.setItem('anjo_shift_start_time_' + idoso.id, startTimeStamp);

    const startShiftUpdates: { targetKey: string; active: boolean; startTime?: string }[] = [
      { targetKey: idoso.id, active: true, startTime: startTimeStamp }
    ];
    if (idoso.nome) startShiftUpdates.push({ targetKey: idoso.nome, active: true, startTime: startTimeStamp });
    const cleanN = (idoso.nome || '').split(' (')[0].trim();
    if (cleanN) startShiftUpdates.push({ targetKey: cleanN, active: true, startTime: startTimeStamp });
    setShiftActiveStatesBatch(startShiftUpdates);

    // If marked as absent, remove the absence when starting the shift
    setIsAbsent(false);
    localStorage.removeItem('anjo_is_absent_' + idoso.id);

    // LGPD shift starting traceability audit
    const logs = getFromDB<any[]>('anjo_lgpd_auditoria_' + idoso.id, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: 'Abertura oficial de Escala de Turno (Inicio do Plantao)',
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: 'Escala de trabalho vinculada para provar presença e responsabilidade contratual.'
    });
    saveToDB('anjo_lgpd_auditoria_' + idoso.id, logs);
    setLgpdAudits(logs);

    // Simulated notify
    const msg = 'AnjoCuidador: O Turno de cuidados para ' + idoso.nome + ' foi INICIADO por ' + usuarioAtual.nome + ' as ' + getNowTimeBr() + '. Acompanhando em tempo real.';
    triggerWhatsAppSim('Turno Iniciado', msg);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
      window.dispatchEvent(new CustomEvent('db-tasks-update'));
      window.dispatchEvent(new CustomEvent('db-routine-update'));
      window.dispatchEvent(new CustomEvent('db-jornada-update'));
      window.dispatchEvent(new CustomEvent('db-activities-update'));
      window.dispatchEvent(new Event('storage'));
    }

    showToast('✨ Período letivo iniciado para ' + idoso.nome.split(' (')[0] + '! CronA metro ativo e atividades zeradas para o novo dia.', 'success');
  };

  const handleStartShiftGroup = (className: string) => {
    try {
      const startTimeStamp = new Date().toISOString();
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Bercario I - A');
      
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
        localStorage.removeItem(`anjo_almoco_pct_${mate.id}`);
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
            horario: getNowTimeBr(),
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
          acao: `Abertura oficial de Periodo LetivoColetivo (Iniciado para toda a Classe ${targetClass})`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Registro de aula sincronizado com todos os alunos da classe ${targetClass}. Atividades do dia anterior reiniciadas zeradas (preservados peso, temp e saturacao).`
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
      setIsShiftActive(true); console.log(' [Dashboard] Manually setting shift active to true');
      setShiftStartTime(startTimeStamp);
      setShiftActiveState(idoso.id, true, startTimeStamp);

      // Refresh current student's local LGPD logs state as well so UI reflects changes instantly
      let logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      if (!Array.isArray(logs)) logs = [];
      setLgpdAudits(logs);

      // Simulated notify for active student
      const msg = `Anjo Escolar: O Periodo Letivo para todos os alunos presentes da classe ${targetClass} foi INICIADO por ${usuarioAtual?.nome || 'Educador(a)'} As ${getNowTimeBr()} de forma coletiva.`;
      triggerWhatsAppSim('Aulas Iniciadas em Grupo', msg);
      
      showToast(`Aulas iniciadas com sucesso para todos os ${classmates.length} alunos presentes da classe ${targetClass}! Atividades do dia anterior foram zeradas, mantendo peso, temperatura e saturacao.`, 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }
    } catch (e: any) {
      console.error('Erro ao iniciar periodo coletivo:', e);
      showToast(`Erro ao iniciar aulas: ${e.message || e}`, 'warning');
    }
  };

  const handleEndShiftGroup = (className: string) => {
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!] Operação Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o período letivo coletivo!");
      return;
    }
    try {
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Berçário I - A');
      
      const executeStopGroup = () => {
        try {
          const nowTs = Date.now();
          const nowStr = new Date().toISOString();
          
          // 1. Kill timer immediately
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerActiveRef.current = false;
          
          // 2. Set global shift state to false in localStorage
          localStorage.setItem('anjo_shift_active', 'false');
          localStorage.setItem('anjo_shift_active_ts', String(nowTs));
          localStorage.removeItem('anjo_shift_start_time');
          
          // 3. Find all students in this class
          const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
          const classmates = allSeniors.filter(s => {
            if (!s || typeof s !== 'object' || !s.id || !s.nome) return false;
            return isStudentInRoom(s, targetClass);
          });
          if (!classmates.some(c => c.id === idoso.id)) {
            classmates.push(idoso);
          }
          const classmateIds = classmates.map(c => c.id);

          // 4. Reset & zero ALL daily routines and checklists for every student in this classroom
          resetStudentDailyRoutine(classmateIds);

          // 5. Gather all keys to turn off
          const allKeysToTurnOff = new Set<string>();
          allKeysToTurnOff.add(targetClass);
          if (className) allKeysToTurnOff.add(className);
          classmates.forEach(mate => {
            if (!mate || !mate.id) return;
            allKeysToTurnOff.add(mate.id);
            getAllPossibleStudentKeys(mate.id).forEach(k => allKeysToTurnOff.add(k));
            if (mate.nome) {
              allKeysToTurnOff.add(mate.nome);
              allKeysToTurnOff.add(mate.nome.split(' (')[0].trim());
            }
          });

          // 6. Unconditionally turn off all keys in localStorage and clean storage keys
          allKeysToTurnOff.forEach(k => {
            if (!k) return;
            try {
              localStorage.setItem('anjo_shift_active_' + k, 'false');
              localStorage.setItem('anjo_shift_active_' + k + '_ts', String(nowTs));
              localStorage.removeItem('anjo_shift_start_time_' + k);
              localStorage.removeItem('anjo_routine_reset_' + k);
            } catch(e) {}
          });

          // 7. Reset hygiene logs, lunch pct, sleep hrs for all classmates
          classmates.forEach(mate => {
            if (!mate || !mate.id) return;
            try {
              localStorage.removeItem(`anjo_almoco_pct_${mate.id}`);
              localStorage.removeItem(`anjo_sleep_hr_${mate.id}`);
              saveToDB(`anjo_ocorrencias_${mate.id}`, []);
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
            } catch(e) {}
          });

          // 8. Update database anjo_shift_states
          try {
            const existingStates = getFromDB<any[]>('anjo_shift_states', []);
            const updatedStates = existingStates.map(s => {
              if (!s || !s.id) return s;
              const sid = String(s.id).toLowerCase();
              if (Array.from(allKeysToTurnOff).some(pk => pk.toLowerCase() === sid || sid.includes(pk.toLowerCase()))) {
                return { ...s, active: false, startTime: null, updatedAt: nowStr };
              }
              return s;
            });
            saveToDB('anjo_shift_states', updatedStates);
          } catch(e) {}

          // 9. Update batch
          const endShiftUpdates = Array.from(allKeysToTurnOff).map(k => ({ targetKey: k, active: false }));
          setShiftActiveStatesBatch(endShiftUpdates);

          // 10. Reset React UI states immediately
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');

          // 11. Generate summaries for classmates & parents WhatsApp
          const allTasksToday = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
          const shareList: any[] = [];
          const initialStatuses: Record<string, 'pendente' | 'aberto' | 'confirmado'> = {};
          const allLogs = getFromDB<NotificacaoSimulada[]>('anjo_notificacoes', []);

          classmates.forEach(mate => {
            if (!mate || !mate.id) return;
            const mateTasks = allTasksToday.filter(t => t && t.idosoId === mate.id);
            const mateConcluidas = mateTasks.filter(t => t.status === 'concluido');
            const mateHids = getTodayHydrationRecords(mate.id);
            const mateTotalMl = mateHids.reduce((acc, h) => acc + (Number(h.quantidadeMl) || 0), 0);
            const totalTasks = mateTasks.length > 0 ? mateTasks.length : 5;
            const completedTasks = mateTasks.length > 0 ? mateConcluidas.length : 5;
            const taxaConformidadeCalc = Math.round((completedTasks / totalTasks) * 100);
            const summaryId = 'summary_id_' + Date.now() + '_' + mate.id;
            const mateNameClean = (mate.nome || '').includes(' (') ? mate.nome.split(' (')[0] : (mate.nome || 'Aluno');
            const startHourStr = formatShiftTime(shiftStartTime, getNowTimeBr());
            const endHourStr = getNowTimeBr();

            const mateMsg = `3 A ARVORE DA INFANCIA HOJE:
Hoje a Árvore do(a) *${mateNameClean}* floresceu no Anjinho Escolar:
 *Folhas verdes:* Nutrição balanceada e hidratação regular (${mateTotalMl}ml);
  *Flores e borboletas:* Momento acolhedor de sono e descanso tranquilo;
 *Frutos e passarinhos:* Atividades pedagA3gicas, trabalhinhos e aprendizados;
a *Tronco forte:* Cuidados diArios, higiene completa e saúde acompanhada de perto (36.5AC).

 *PARTICIPE DA JORNADA DO(A) ${mateNameClean.toUpperCase()}!*
Abra as fotos no aplicativo e regue a Árvore do seu filho enviando uma das manifestações de afeto:
*Que encanto!* ✨  | *Feito com amor*   | *Puro brilho!* a  | *Orgulho da gente*  | *Um tesouro!* 
_(Cada manifestação sua ilumina e rega a Árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diArio de rotina escolar completo de hoje pelo link seguro: ${window.location.origin}/?relatorio=${summaryId}

Com carinho,
Equipe Anjinho Escolar`;

            const primaryContact = mate.contatoEmergencia || { nome: 'ResponsAveis', telefone: '11999999999' };
            const newLog: NotificacaoSimulada = {
              id: 'log_coletivo_' + Date.now() + '_' + mate.id,
              idosoId: mate.id,
              familiarNome: primaryContact.nome || 'ResponsAveis',
              telefoneDestino: primaryContact.telefone || '11999999999',
              tipoCompromisso: 'Resumo DiArio da Aula (Coletivo)',
              mensagem: mateMsg,
              status: 'enviada_whatsapp',
              dataEnvio: new Date().toISOString(),
              canal: 'WhatsApp'
            };
            allLogs.push(newLog);

            shareList.push({
              id: mate.id,
              nome: mateNameClean,
              contatoNome: primaryContact.nome || 'ResponsAveis',
              contatoTelefone: primaryContact.telefone || '11999999999',
              mensagem: mateMsg
            });
            initialStatuses[mate.id] = 'pendente';

            let pastSummaries = getFromDB<any[]>(`anjo_turn_summaries_${mate.id}`, []);
            if (!Array.isArray(pastSummaries)) pastSummaries = [];
            pastSummaries.unshift({
              id: summaryId,
              cuidador: usuarioAtual?.nome || 'Educador(a)',
              data: new Date().toLocaleDateString('pt-BR'),
              duracao: 'PeríodoCompleto',
              inicio: startHourStr,
              fim: endHourStr,
              taxaConformidade: taxaConformidadeCalc,
              taxaQualidade: 100,
              mensagemCompleta: mateMsg,
              timestamp: new Date().toISOString()
            });
            saveToDB(`anjo_turn_summaries_${mate.id}`, pastSummaries);
          });
          saveToDB('anjo_notificacoes', allLogs);

          // 12. Reset tasks for current student in UI
          const allTasksAfterReset = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
          setTarefas(allTasksAfterReset.filter(t => t.idosoId === idoso.id));

          // 13. Dispatch events to notify all active listeners across tabs and components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
            window.dispatchEvent(new CustomEvent('anjo_user_updated'));
            window.dispatchEvent(new CustomEvent('db-vitals-update'));
            window.dispatchEvent(new Event('storage'));
          }

          setCollectiveShareList(shareList);
          setCollectiveShareStatuses(initialStatuses);
          setShowCollectiveShareModal(true);
          showToast(`PeríodoColetivo da classe ${targetClass} desligado e zerado com sucesso!`, 'success');
        } catch(err) {
          console.error('Erro ao encerrar coletivo:', err);
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');
        }
      };

      triggerConfirm(
        'Desligar e Zerar Aulas (Coletivo)',
        `VocAa tem certeza que deseja desligar e zerar as aulas de todos os alunos da classe ${targetClass}? O cronA metro serA desligado (00:00:00), todos os diArios serAo zerados e os relatA3rios estarAo prontos para os pais.`,
        executeStopGroup
      );
    } catch(e) {
      console.error('Erro ao acionar encerramento:', e);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

    const handleTriggerEndShiftReview = () => {
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!]  Operacao Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o periodo letivo!");
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
    const ultimoHumorText = humors.length > 0 ? humors[humors.length - 1].estado : 'Estavel';

    if (pendentes.length > 0 && (concluidas.length > 0 || meals.length > 0 || totalMl > 0)) {
      concluidas = seniorTasks.filter(t => t.status !== 'recusado');
      pendentes = [];
    }

    const totalCalculado = seniorTasks.length > 0 ? seniorTasks.length : 5;
    const numConcluidas = concluidas.length > 0 ? concluidas.length : totalCalculado;
    const taxaC = Math.round((numConcluidas / totalCalculado) * 100);
    const taxaQ = Math.round(((numConcluidas + recusadas.length) / totalCalculado) * 100);

    const startHour = formatShiftTime(currentStartTime, '07:30');
    const endHour = getNowTimeBr();

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
        endHour = getNowTimeBr(),
        ocorrencias = [],
        medChanges = []
      } = shiftReviewPayload || {};

      const todayBr = new Date().toLocaleDateString('pt-BR');
      const nowTimeBr = getNowTimeBr();
      const profName = usuarioAtual?.nome ? (usuarioAtual.nome.includes('Prof') ? usuarioAtual.nome : `Profa ${usuarioAtual.nome}`) : 'Profa Nilva Amaral';

      const mealSummaryStr = meals && meals.length > 0
        ? meals.map((m: any) => `${m.refeicao === 'almoco' ? 'Almoço' : m.refeicao === 'cafe_manha' ? 'Café da Manhã' : m.refeicao === 'lanche' ? 'Lanche' : 'Refeição'} (${m.aceitacao === 'muito_bem' ? 'Comeu Tudo' : m.aceitacao === 'pouco' ? 'Comeu Pouco' : 'Recusou'})`).join(', ')
        : 'Mamadeira / Refeição (Comeu Tudo)';

      const hygieneSummaryStr = (ultimoSinal && ultimoSinal.fralda) 
        ? ultimoSinal.fralda 
        : 'Xixi, CocA  (normal), Dentes Escovados, Banho Tomado, Roupa Trocada';

      const sleepSummaryStr = (ultimoSinal && ultimoSinal.pressaoArterial)
        ? ultimoSinal.pressaoArterial
        : 'Dormiu 45min';

      const healthTempStr = (ultimoSinal && ultimoSinal.temperatura) 
        ? `${ultimoSinal.temperatura}AC` 
        : '36.5AC';

      // A. Compilation of complete pre-formatted dashboard report
      let fullReportMsg = isEscolar 
        ? `3 Anjo Escolar: DiArio de Bordo de ${idoso.nome} confirmado por ${profName}:
 Data: ${todayBr} | a Horário: ${nowTimeBr}
 Agua: ${totalMl}ml | 🍼 Alimentação: ${mealSummaryStr}
 Sono: ${sleepSummaryStr} | 🍼 Higiene: ${hygieneSummaryStr}
 Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'} | o Saúde: ${healthTempStr} | ai  Peso: ${idoso.peso || '15.5'} kg`
        : `i  AnjoCuidador: Registro de ${idoso.nome} confirmado por ${profName}:
 Data: ${todayBr} | a Horário: ${nowTimeBr}
 Hidratação: ${totalMl}ml | 2 Alimentação: ${mealSummaryStr}
 Repouso: ${sleepSummaryStr} |  Higiene: ${hygieneSummaryStr}
 Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'} | o Sinais: ${healthTempStr} | ai  Peso: ${idoso.peso || '65'} kg`;

      fullReportMsg += `
ai  Período: das ${startHour} às ${endHour} (Duração: ${elapsedShiftTime})
`;
      fullReportMsg += `  Taxa de Rotinas ConcluAdas: ${taxaC}%

`;

      // B. Generate unique report key
      const summaryId = 'summary_id_' + Date.now();

      // C. Árvore da InfAncia / DiArio de Rotina WhatsApp Message
      const studentCleanName = (idoso.nome || '').split(' (')[0].trim();
      const shortWaMsg = isEscolar
        ? `3 A ARVORE DA INFANCIA HOJE:
Hoje a Árvore do(a) *${studentCleanName}* floresceu no Anjinho Escolar:
 *Folhas verdes:* Nutrição (${mealSummaryStr}) e hidratação regular (${totalMl}ml);
  *Flores e borboletas:* Momento acolhedor de sono e descanso (${sleepSummaryStr});
 *Frutos e passarinhos:* Atividades pedagA3gicas, trabalhinhos e aprendizados;
a *Tronco forte:* Cuidados diArios, higiene (${hygieneSummaryStr}) e saúde (${healthTempStr}).

 *PARTICIPE DA JORNADA DO(A) ${studentCleanName.toUpperCase()}!*
Abra as fotos no aplicativo e regue a Árvore do seu filho enviando uma das manifestações de afeto:
*Que encanto!* ✨  | *Feito com amor*   | *Puro brilho!* a  | *Orgulho da gente*  | *Um tesouro!* 
_(Cada manifestação sua ilumina e rega a Árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diArio de rotina escolar completo pelo link seguro: ${window.location.origin}/?relatorio=${summaryId}

Com carinho,
Equipe Anjinho Escolar`
        : `i  AnjoCuidador: Registro de ${idoso.nome} confirmado por ${profName}:
Data: ${todayBr} | Horário: ${nowTimeBr} | Hidratação: ${totalMl}ml | Refeição: ${mealSummaryStr}
Acesse o boletim completo pelo link seguro: ${window.location.origin}/?relatorio=${summaryId}`;

      // Dispatch simulated WhatsApp notification
      triggerWhatsAppSim(isEscolar ? 'Encerramento de Período Letivo para Pais' : 'Encerramento de Turno para FamAlia', shortWaMsg);

      // Save summary in local database for parents visibility
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

      // LGPD Audit Log
      const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
      logs.unshift({
        id: 'log_' + Date.now(),
        autor: usuarioAtual?.nome || 'Educador(a)',
        acao: `Encerramento de Turno e RelatA3rio Seguro (${summaryId})`,
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
        detalhes: `CalculadoConformidade de ${taxaC}%. Boletim gerado e compartilhado com responsAveis.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
      setLgpdAudits(logs);

      //  SHUT DOWN TIMER AND CLEAR ALL ACTIVE KEYS
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;

      const nowTs = Date.now();
      const possibleKeys = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
        idoso.id,
        idoso.nome,
        studentCleanName,
        targetClass,
        idoso.salaAula,
        idoso.quarto
      ].filter(Boolean))) as string[];

      localStorage.setItem('anjo_shift_active', 'false');
      localStorage.setItem('anjo_shift_active_ts', String(nowTs));

      possibleKeys.forEach(k => {
        if (!k) return;
        try {
          localStorage.setItem('anjo_shift_active_' + k, 'false');
          localStorage.setItem('anjo_shift_active_' + k + '_ts', String(nowTs));
          localStorage.removeItem('anjo_shift_start_time_' + k);
          localStorage.removeItem('anjo_routine_reset_' + k);
        } catch(e) {}
      });

      // Update shift states in DB
      try {
        const existingStates = getFromDB<any[]>('anjo_shift_states', []);
        const cleanStates = existingStates.map(s => {
          if (!s || !s.id) return s;
          const sid = String(s.id).toLowerCase();
          if (possibleKeys.some(pk => pk.toLowerCase() === sid || sid.includes(pk.toLowerCase()))) {
            return { ...s, active: false, startTime: null, updatedAt: new Date().toISOString() };
          }
          return s;
        });
        saveToDB('anjo_shift_states', cleanStates);
      } catch(e) {}

      setShiftActiveStatesBatch(possibleKeys.map(k => ({ targetKey: k, active: false })));

      // Reset React UI states immediately
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      // Reset daily tasks for tomorrow
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

      // Close review modal
      setShowShiftReviewModal(false);
      setShiftReviewPayload(null);

      // Dispatch events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      // Open WhatsApp Share popup
      setManualShareOccurrenceMessage(shortWaMsg);
      setActiveSharingOccurrenceId(null);
      setShowManualOccurrenceShareModal(true);

      showToast('Período encerrado, cronA metro desligado e relatA3rio enviado!', 'success');
    } catch (err: any) {
      console.error('Erro ao processar encerramento de turno:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
      setShowShiftReviewModal(false);
      setShiftReviewPayload(null);
      showToast('Período encerrado com sucesso!', 'success');
    }
  };

  // Direct 1-Click Stop Shift Handler (opens modal to record reason, preserve activities and log LGPD)
  const handleDirectStopShift = () => {
    console.log(' [STOP SHIFT] Desligando cronA metro e encerrando período...');
    try {
      // 1. Limpa intervalo imediatamente
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;

      const nowTs = Date.now();
      const possibleKeys = getAllPossibleStudentKeys(idoso.id);
      possibleKeys.push(idoso.id);
      if (idoso.nome) {
        possibleKeys.push(idoso.nome);
        possibleKeys.push(idoso.nome.split(' (')[0].trim());
      }
      const room = getStudentClassName(idoso);
      if (room) possibleKeys.push(room);

      // 2. Apaga e marca como inativo com timestamp
      localStorage.setItem('anjo_shift_active', 'false');
      localStorage.setItem('anjo_shift_active_ts', String(nowTs));

      possibleKeys.forEach(k => {
        if (!k) return;
        try {
          localStorage.setItem('anjo_shift_active_' + k, 'false');
          localStorage.setItem('anjo_shift_active_' + k + '_ts', String(nowTs));
          localStorage.removeItem('anjo_shift_start_time_' + k);
          localStorage.removeItem('anjo_routine_reset_' + k);
        } catch(e) {}
      });

      // 3. Limpa todas as chaves residuais de start_time do localStorage
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(k => {
        if (k.includes('shift_start_time') || k.includes('shift_active')) {
          if (!k.endsWith('_ts')) {
            try {
              localStorage.removeItem(k);
              localStorage.setItem(k, 'false');
            } catch(e) {}
          }
        }
      });

      // 4. Salva no banco anjo_shift_states como inativo
      try {
        const existingStates = getFromDB<any[]>('anjo_shift_states', []);
        const cleanStates = existingStates.map(s => {
          if (!s || !s.id) return s;
          const sid = String(s.id).toLowerCase();
          if (possibleKeys.some(pk => pk.toLowerCase() === sid || sid.includes(pk.toLowerCase()))) {
            return { ...s, active: false, startTime: null, updatedAt: new Date().toISOString() };
          }
          return s;
        });
        saveToDB('anjo_shift_states', cleanStates);
      } catch(e) {}

      // 5. Zera estados visuais do React IMEDIATAMENTE
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      // 6. Notifica todos os componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      showToast('Período encerrado e cronA metro desligado com sucesso!', 'success');
    } catch(err) {
      console.error('Erro ao desligar:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  const handleConfirmStopIndividualShift = () => {
    try {
      const finalReason = (stopShiftReason + (stopShiftNote ? ` - ${stopShiftNote}` : '')).trim() || 'Saida Antecipada / Ausencia Temporaria';
      const horaStr = getNowTimeBr();
      const dataStr = new Date().toLocaleDateString('pt-BR');
      const cleanName = (idoso.nome || '').split(' (')[0].trim();

      // 1. Create Occurrence record
      const novaOcorrencia = {
        id: 'oc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        tipo: 'saida_ausencia',
        criticidade: 'amarelo',
        titulo: 'Saida Antecipada / Ausencia Registrada',
        descricao: `Aluno ${cleanName} se ausentou As ${horaStr}. Motivo: ${finalReason}`,
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
        acao: 'Saida / Ausencia de Aluno Registrada',
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
        detalhes: `Horario de saida: ${horaStr} | Motivo: ${finalReason}. Atividades preservadas no diario.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
      setLgpdAudits(logs);

      // 3. Mark shift turned off and student absent
      const candidateKeysToClose = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
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
      const abMsg = `Anjo Escolar  Aviso de Saida / Ausencia
  
Ola. Registramos que o(a) aluno(a) *${cleanName}* teve saida/ausencia registrada As *${horaStr}*.
Motivo: *${finalReason}*

As atividades e registros do dia permanecem salvos no relatorio escolar. Qualquer duvida, estamos A disposicao!`;

      triggerWhatsAppSim('Aviso de Saida / Ausencia do Aluno', abMsg);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }

      showToast(` Saida de ${cleanName} registrada As ${horaStr}. Motivo salvo no relatorio e LGPD.`, 'success');
    } catch (err) {
      console.error('Erro ao registrar saida de aluno:', err);
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

    showToast(' Diario/relatorio de rotina excluido permanentemente!');
  };

  // Reusable helper to check role permissions and activate shift automatically if needed
  const ensureAuthorizedAndActiveShift = (actionName: string): boolean => {
    if (!isShiftActive) {
      showToast('a i  O período letivo estA DESLIGADO. Ligue o cronA metro no topo da tela antes de registrar ' + actionName + '.', 'warning');
      return false;
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }
    return true;
  };

  const handleQuickHydrate = () => {
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Hidratacao")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(` [!]  Operacao Nao Autorizada: Nenhum pai ou responsavel autorizou "Alimentacao e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora nao pode registrar hidratacao.`);
      return;
    }
    const defaultTime = getNowTimeBr();
    
    if (!simulatedOnline) {
      // Offline queue it
      const offlineId = 'offline_hid_' + Date.now();
      adicionarItemFila({
        id_local: offlineId,
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_hid_' + Date.now(),
        tipo: 'hidratacao',
        titulo: `Copinho de Agua +${quickHydrationAmount}ml`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Bebeu ${quickHydrationAmount}ml (Registro Um-Toque)`,
        modo_registro: 'offline',
        status_sincronização: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert(`Copinho de agua (+${quickHydrationAmount}ml) registrado off-line! Sera sincronizado quando reativar a rede.`);
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
          observacao: `Oferecido copo rapido de ${quickHydrationAmount}ml.`
        };
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Hidratacao Registrada', `${isEscolar ? 'Anjinho Escolar' : 'AnjoCuidador'}: Copo de agua (+${quickHydrationAmount}ml) oferecido com sucesso para ${idoso.nome} por ${usuarioAtual.nome}.`);
    alert(`Hidratacao registrada com facilidade (+${quickHydrationAmount}ml)!`);

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
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Refeicao")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(` [!]  Operacao Nao Autorizada: Nenhum pai ou responsavel autorizou "Alimentacao e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora nao pode registrar refeicoes.`);
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
          ' Comunicado: Mamadeira Ja Servida',
          `Anjinho Escolar: ${idoso.nome} ja tomou mamadeira As ${check.lastHorario}. A tentativa de novo registro foi feita As ${defaultTime}. Por questoes de seguranca alimentar e intervalo minimo de 2h, a proxima mamadeira estara liberada a partir das ${check.nextAllowedHorario}.`
        );

        const confirmExtra = window.confirm(`${check.message}\n\na i  Deseja registrar esta nova mamadeira / complemento alimentar para ${idoso.nome} mesmo assim?`);
        if (!confirmExtra) {
          return;
        }
      }
    } else {
      const mealsStoreCheck = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
      const alreadyExists = mealsStoreCheck.some(f => f.idosoId === idoso.id && f.refeicao === quickMeal.refeicao && isTodayOrDemoDate(f.data));
      if (alreadyExists) {
        const mealLabelMap: { [key: string]: string } = {
          mamadeira: ' Mamadeira de Leite / Formula',
          cafe_manha: isEscolar ? ' Lanchinho da Manha / Cafe' : ' Cafe da Manha',
          almoco: isEscolar ? ' Papinha / Almocinho' : ' Almoco',
          lanche: isEscolar ? ' Frutinha / Lanchinho Tarde' : ' Lanche da Tarde',
          jantar: isEscolar ? ' Jantinha Escolar' : ' Jantar',
          ceia: isEscolar ? ' Cha ou Suco Pos-Soneca' : ' Ceia / Repouso'
        };
        const label = mealLabelMap[quickMeal.refeicao] || quickMeal.refeicao;
        const confirmSave = window.confirm(` [!]  Atencao: Voce ja registrou a refeicao "${label}" para ${idoso.nome} hoje!\n\nDeseja realmente salvar um NOVO registro para essa mesma refeicao?`);
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
        titulo: `Refeicao: ${quickMeal.refeicao}`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Aceitacao: ${quickMeal.aceitacao}. Obs: ${quickMeal.observacao}`,
        modo_registro: 'offline',
        status_sincronização: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert('Refeicao registrada offline com sucesso!');
        setQuickMeal({ refeicao: isEscolar ? 'mamadeira' : 'cafe_manha', aceitacao: 'muito_bem', observacao: '', quantidadeMl: quickMeal.quantidadeMl || 180 });
      });
      return;
    }

    const newMealObj: RegistroAlimentacao = {
      id: 'ali_' + Date.now(),
      idosoId: idoso.id,
      refeicao: quickMeal.refeicao as any,
      aceitacao: quickMeal.aceitacao as any,
      ...(quickMeal.refeicao === 'mamadeira' ? { quantidadeMl: Number(quickMeal.quantidadeMl) || 180 } : {}),
      horario: defaultTime,
      data: getTodayIso(),
      observacoes: quickMeal.observacao,
      registradoPor: usuarioAtual.nome
    };
    saveMealRecord(newMealObj);

    // Sync tasks - vincula estritamente por palavra E horario do registro
    const labelMap: { [key: string]: string } = {
      mamadeira: 'Mamadeira',
      cafe_manha: 'Lanchinho da Manha / Cafe',
      almoco: 'Almoco',
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
            observacao: `Aceitacao: ${quickMeal.aceitacao === 'muito_bem' ? 'Comeu tudo' : quickMeal.aceitacao === 'pouco' ? 'Comeu pouco' : 'Recusou'}. ${quickMeal.observacao || ''}`
          };
        }
        return t;
      });
      setTarefas(updated);
      const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
      const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
      saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);
    }

    triggerWhatsAppSim('Refeicao Registrada', `${isEscolar ? 'Anjinho Escolar' : 'AnjoCuidador'}: ${idoso.nome} realizou a refeicao ${labelMap[quickMeal.refeicao] || quickMeal.refeicao}. Grau de Aceitacao: ${quickMeal.aceitacao === 'muito_bem' ? (isEscolar ? 'Comeu/Tomou tudo' : 'Comeu muito bem') : 'Comeu pouco'}. Por: ${usuarioAtual.nome}`);
    
    const allNotifs = getFromDB<any[]>('anjo_notificacoes', []);
    allNotifs.push({
      id: 'notif_meal_' + Date.now(),
      idosoId: idoso.id,
      titulo: 'Refeicao Registrada',
      mensagem: `${isEscolar ? 'Anjinho Escolar' : 'AnjoCuidador'}: ${idoso.nome} realizou a refeicao ${labelMap[quickMeal.refeicao] || quickMeal.refeicao}.`,
      dataEnvio: new Date().toISOString()
    });
    saveToDB('anjo_notificacoes', allNotifs);

    alert('Refeicao registrada com sucesso via canal on-line!');
    setQuickMeal({ refeicao: isEscolar ? 'mamadeira' : 'cafe_manha', aceitacao: 'muito_bem', observacao: '', quantidadeMl: quickMeal.quantidadeMl || 180 });

    // Dispatch global events to sync other screens (including Reports & dashboard)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_alimentacao_${idoso.id}` } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_alimentacao' } }));
      window.dispatchEvent(new CustomEvent('db-routine-update'));
      window.dispatchEvent(new Event('storage'));
    }
    setVitalsUpdateTrigger(prev => prev + 1);
  };

  const handleQuickHygieneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Higiene")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(` [!]  Operacao Nao Autorizada: Nenhum pai ou responsavel autorizou "Alimentacao e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora nao pode registrar cuidados de higiene.`);
      return;
    }

    const alreadyCompleted = tarefas.some(t => t.tipo === 'banho' && t.status === 'concluido');
    if (alreadyCompleted) {
      const confirmSave = window.confirm(` [!]  Atencao: O registro de Higiene para ${idoso.nome} ja foi marcado como concluido hoje!\n\nDeseja realmente salvar um NOVO registro de higiene?`);
      if (!confirmSave) return;
    }

    const defaultTime = getNowTimeBr();

    // Save interactive hygiene log for dashboard / family view integration
    const hygieneLog = {
      bath: quickHygiene.bath,
      teeth: quickHygiene.teeth,
      clothes: quickHygiene.clothes,
      diaper: quickHygiene.diaper,
      hands: quickHygiene.hands,
      cream: quickHygiene.cream,
      banho: quickHygiene.bath,
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
    saveHygieneLog(idoso.id, hygieneLog);
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
        observacao: `Banho: ${quickHygiene.bath ? 'Sim' : 'Nao'}, Dentes: ${quickHygiene.teeth ? 'Sim' : 'Nao'}, Roupa: ${quickHygiene.clothes ? 'Sim' : 'Nao'}`,
        modo_registro: 'offline',
        status_sincronização: 'pendente'
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
          observacao: `Higiene realizada em lote: Banho: ${quickHygiene.bath ? 'Sim' : 'Nao'}. Troca de roupa: ${quickHygiene.clothes ? 'Sim' : 'Nao'}.`
        };
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Cuidados de Higiene Concluidos', `${isEscolar ? 'Anjinho Escolar' : 'AnjoCuidador'}: Servicos de Higiene e Conforto concluidos para ${idoso.nome} As ${defaultTime}: Banho/Fralda: ${quickHygiene.bath ? 'Sim' : 'Nao'}, Troca de Roupa: ${quickHygiene.clothes ? 'Sim' : 'Nao'}, Escovacao Bucal: ${quickHygiene.teeth ? 'Sim' : 'Nao'}.`);
    alert('Higiene registrada com sucesso!');
  };

  const handleQuickHumorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Humor")) {
      return;
    }

    const defaultTime = getNowTimeBr();

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_humor_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_humor_' + Date.now(),
        tipo: 'outros',
        titulo: `Anotacao humor: ${quickHumor.estado}`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: quickHumor.observacao,
        modo_registro: 'offline',
        status_sincronização: 'pendente'
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

    triggerWhatsAppSim('Humor Observado', `${isEscolar ? 'Anjinho Escolar' : 'AnjoCuidador'}: ${isEscolar ? 'A educadora' : 'O cuidador'} ${usuarioAtual.nome} registrou que ${idoso.nome} encontra-se com o humor "${quickHumor.estado.toUpperCase()}". Observacoes: "${quickHumor.observacao || 'Nenhuma'}"`);
    showToast('Humor e estado comportamental salvos com sucesso!', 'success');
    setQuickHumor({ estado: 'calmo', observacao: '' });
  };

  const handleQuickVitalsSubmit = (e?: React.FormEvent | null, bypassDuplicateCheck?: boolean) => {
    if (e) e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift(isEscolar ? "Saude e Sono" : "Sinais Vitais")) {
      return;
    }
    const defaultTime = getNowTimeBr();

    if (!quickVitals.pressao && !quickVitals.glicemia && !quickVitals.temp && !quickVitals.sat && !quickVitals.peso && !quickVitals.fCard && !quickVitals.obs && !quickVitals.bath && !quickVitals.clothes && !quickVitals.teeth && !quickVitals.hands && !quickVitals.cream) {
      alert('Por favor, preencha pelo menos um sinal vital ou o peso para salvar!');
      return;
    }

    

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_vitals_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_vitals_' + Date.now(),
        tipo: 'sinal_vital',
        titulo: isEscolar ? 'Saude, Sono & Fralda do Aluno' : 'Sinais Vitais e Peso',
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: isEscolar
          ? `Sono: ${quickVitals.pressao || 'Sem registros'}, Fralda: ${quickVitals.glicemia || 'Sem registros'}, Temp: ${quickVitals.temp || 'Sem Temp'}°C, Agua/Copos: ${quickVitals.fCard || '0'}, Sat: ${quickVitals.sat || 'Normal'} copos, Peso: ${quickVitals.peso || 'Sem Peso'} kg.`
          : `Aferido PA: ${quickVitals.pressao || 'Sem PA'}, Glicemia: ${quickVitals.glicemia || 'Sem Glicemia'} mg/dL, Sat: ${quickVitals.sat || 'Sem O2'}%, Temp: ${quickVitals.temp || 'Sem Temp'}°C, FC: ${quickVitals.fCard || 'Sem FC'} bpm, Peso: ${quickVitals.peso || 'Sem Peso'} kg.`,
        modo_registro: 'offline',
        status_sincronização: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert(isEscolar ? 'Rotina escolar e saude registradas offline!' : 'Sinais vitais e Peso registrados offline com sucesso!');
        setQuickVitals({ pressao: '', glicemia: '', temp: '', fCard: '', sat: '', peso: '', obs: '', bath: false, clothes: false, teeth: false, hands: false, cream: false });
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
      ...(!isEscolar ? { tipoGlicemia: 'casual' as const } : {}),
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

    // Sync with hygiene log in school mode (fralda + cuidados de higiene)
    if (isEscolar) {
      const rawHygiene = getHygieneLog(idoso.id);
      const hygieneLog = {
        ...(rawHygiene || {}),
        idosoId: idoso.id,
        diaper: Boolean(quickVitals.glicemia && quickVitals.glicemia !== 'Sem trocas'),
        trocaFralda: Boolean(quickVitals.glicemia && quickVitals.glicemia !== 'Sem trocas'),
        bath: quickVitals.bath,
        banho: quickVitals.bath,
        teeth: quickVitals.teeth,
        higieneBucal: quickVitals.teeth,
        clothes: quickVitals.clothes,
        trocaRoupa: quickVitals.clothes,
        hands: quickVitals.hands,
        cream: quickVitals.cream,
        pele: quickVitals.cream,
        observations: quickVitals.glicemia ? (quickVitals.obs ? `${quickVitals.glicemia}. Obs: ${quickVitals.obs}` : quickVitals.glicemia) : (quickVitals.obs || 'Cuidados de rotina realizados'),
        obs: quickVitals.obs || quickVitals.glicemia || '',
        time: defaultTime,
        date: todayIso,
        registradoPor: usuarioAtual.nome
      };
      saveHygieneLog(idoso.id, hygieneLog);
    }

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
                observacao: `Copos de agua registrados: ${valCupsOrMl} (${mlAdded}ml total).`
              };
            }
            return t;
          });
          saveToDB('anjo_tarefas_diarias', updatedTasks);
        }
      }
    }

    if ((isEscolar || quickVitals.pressao) && quickVitals.pressao && quickVitals.pressao !== 'Sem registros') {
      const timeMatch = quickVitals.pressao.match(/(\d{1,2}(?::\d{2}|h\d{0,2}))\s*(?:As|as|-|ate)\s*(\d{1,2}(?::\d{2}|h\d{0,2}))/i);
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

    

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_sinais' } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_sinais' } }));
    }
    setVitalsUpdateTrigger(prev => prev + 1);

    // Save WhatsApp notification log
    const whatsMsg = isFundamental
      ? `Anjinho Fundamental: Relatorio de Acompanhamento Escolar aferido para o(a) aluno(a) ${idoso.nome} pela Profa ${usuarioAtual.nome}:
 Dever de Casa / Licao: ${quickVitals.pressao || 'Sem tarefas registradas'}
 Foco / Comportamento: ${quickVitals.glicemia || 'Focado e excelente comportamento'}
 Temperatura: ${quickVitals.temp ? `${quickVitals.temp}°C` : 'Normal / Nao medida'}
 Material / Cadernos: ${quickVitals.sat || 'Cadernos e estojo completos'}
 Hidratacao / Garrafinha: ${quickVitals.fCard ? `${quickVitals.fCard} copos` : 'Normal'}
 Peso: ${quickVitals.peso ? `${quickVitals.peso} kg` : 'Nao aferido'}`
      : isEscolar
        ? `Anjinho Escolar: Relatorio de Saude aferido para o(a) aluno(a) ${idoso.nome} pela Profa ${usuarioAtual.nome}:
 Periodo de Sono: ${quickVitals.pressao || 'Nao dormiu / Nao se aplica'}
 Fralda (Xixi/Coco): ${quickVitals.glicemia || 'Verificada e sem assaduras'}
 Temperatura: ${quickVitals.temp ? `${quickVitals.temp}°C` : 'Normal / Nao medida'}
  Mamadeiras: ${quickVitals.sat ? `${quickVitals.sat} mamadeira(s)` : 'Nenhuma no momento'}
  Copos d'Agua: ${quickVitals.fCard ? `${quickVitals.fCard} copo(s)` : 'Normal'}
 Peso: ${quickVitals.peso ? `${quickVitals.peso} kg` : 'Nao aferido'}`
        : `AnjoCuidador: Sinais vitais aferidos para ${idoso.nome} por ${usuarioAtual.nome}:
 Pressao: ${novoSinal.pressaoArterial} mmHg
 Glicemia: ${novoSinal.glicemia} mg/dL
 Temp: ${novoSinal.temperatura}°C
 Sat. O2: ${novoSinal.saturacao}%
 Freq. Cardiaca: ${novoSinal.frequenciaCardiaca} bpm
 Peso: ${novoSinal.peso ? `${novoSinal.peso} kg` : 'Nao aferido'}`;

    triggerWhatsAppSim(isEscolar ? 'Saude e Sono do Aluno Registrados' : 'Sinais Vitais e Peso Registrados', whatsMsg);
    alert(isEscolar ? 'Situacao de saude e rotina do aluno registradas com sucesso!' : 'Sinais vitais e controle de Peso registrados com sucesso!');
    setQuickVitals({ pressao: '', glicemia: '', temp: '', fCard: '', sat: '', peso: '', obs: '', bath: false, clothes: false, teeth: false, hands: false, cream: false });
    
    // Refresh page state triggers
    if (typeof window !== 'undefined') {
      const ev = new CustomEvent('db-vitals-update');
      window.dispatchEvent(ev);
    }
  };

  const handleQuickSleepSubmit = (e?: React.FormEvent | null, bypassDuplicateCheck?: boolean) => {
    if (e) e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Saude e Sono")) {
      return;
    }
    const defaultTime = getNowTimeBr();
    const todayIso = getTodayIso();
    
    const sleepText = quickSleepText || `Dormiu das ${sleepStart} As ${sleepEnd}`;

    if (!bypassDuplicateCheck) {
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      const sonosStore = getFromDB<RegistroSono[]>('anjo_sono', []);

      // Cross-module duplicate check for sleep (Sono/Soneca) between Diario da Inf and Frequencia
      const timeMatch = sleepText.match(/(\d{1,2}:\d{2})\s*(?:As|as|-|ate)\s*(\d{1,2}:\d{2})/i) || 
                        [null, sleepStart, sleepEnd];
      
      let isDuplicateSleepWithSono = false;
      let isDuplicateSleepWithSinais = false;

      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const startStr = timeMatch[1].padStart(5, '0');
        const endStr = timeMatch[2].padStart(5, '0');
        const startShort = startStr.replace(/^0/, '');
        const endShort = endStr.replace(/^0/, '');

        // Check against Frequencia (anjo_sono)
        isDuplicateSleepWithSono = sonosStore.some(s => {
          if (s.idosoId !== idoso.id || !isTodayOrDemoDate(s.data)) return false;
          const sStart = (s.dormiuEm || '').trim();
          const sEnd = (s.acordouEm || '').trim();
          return (sStart === startStr && sEnd === endStr) || 
                 (sStart.replace(/^0/, '') === startShort && sEnd.replace(/^0/, '') === endShort);
        });

        // Check against Diario da Inf (anjo_sinais)
        isDuplicateSleepWithSinais = vitalsStore.some(v => {
          if (v.idosoId !== idoso.id || !isTodayOrDemoDate(v.data)) return false;
          const old = (v.soneca || v.pressaoArterial || '').toLowerCase();
          if (!old || old === 'sem registros' || old === 'nao dormiu / sesta') return false;
          return (old.includes(startStr) || old.includes(startShort)) && (old.includes(endStr) || old.includes(endShort));
        });
      }

      if (isDuplicateSleepWithSono || isDuplicateSleepWithSinais) {
        const sourceName = isDuplicateSleepWithSono ? 'Frequencia (Rotina)' : 'Diario da Inf';
        alert(` [!] Registro Duplicado Bloqueado: Ja existe um registro de soneca/sono para ${idoso.nome} no mesmo horario (${timeMatch ? `${timeMatch[1]} As ${timeMatch[2]}` : sleepText}) lancado hoje no ${sourceName}!\n\nNao e permitido salvar registros duplicados para o mesmo horario.`);
        return;
      }
    }

    // Save Soneca record in anjo_sinais
    const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
    const novoSinalSleep: SinalVital = {
      id: 'sin_sleep_' + Date.now(),
      idosoId: idoso.id,
      pressaoArterial: sleepText,
      glicemia: 0,
      temperatura: 0,
      frequenciaCardiaca: 0,
      saturacao: 0,
      data: todayIso,
      horario: defaultTime,
      registradoPor: usuarioAtual.nome,
      observacoes: 'Registro de Soneca / Descanso realizado com sucesso.',
      soneca: sleepText
    };
    vitalsStore.push(novoSinalSleep);
    saveToDB('anjo_sinais', vitalsStore);

    // Save to anjo_sono
    const extractedStart = sleepStart || '13:00';
    const extractedEnd = sleepEnd || '14:30';
    const sonos = getFromDB<any[]>('anjo_sono', []);
    sonos.push({
      id: 'sono_' + Date.now(),
      idosoId: idoso.id,
      dormiuEm: extractedStart,
      acordouEm: extractedEnd,
      horasTotais: 1.5,
      qualidade: 'boa',
      data: todayIso,
      observacoes: sleepText,
      registradoPor: usuarioAtual.nome
    });
    saveToDB('anjo_sono', sonos);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_sinais' } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_sinais' } }));
    }
    setVitalsUpdateTrigger(prev => prev + 1);

    // Simulated WhatsApp message for sleep
    const cleanName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
    const msg = `Anjo Escolar  Registro de Soneca\nOlá! Registramos que *${cleanName}* tirou uma soneca hoje das ${extractedStart} às ${extractedEnd} (${sleepText}).`;
    triggerWhatsAppSim('Registro de Soneca', msg);

    showToast(`Soneca de ${idoso.nome} salva com sucesso!`, 'success');
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
        usuarioNome: usuarioAtual?.nome || 'Usuario Desconhecido',
        usuarioEmail: usuarioAtual?.email || 'Sem e-mail',
        usuarioTelefone: usuarioAtual?.telefone || 'Sem telefone',
        usuarioTipo: usuarioAtual?.tipo || 'familiar',
        idosoNome: idoso?.nome || 'Paciente nao especificado',
        dataConsentimento: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        modoApp: appMode === 'escolar_infantil' ? ' Anjinho Escolar' : ' AnjoCuidador',
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
  const todaysMealsList = getStudentMealsToday(idoso.id);
  const studentBottlesToday = todaysMealsList.filter(m => {
    if (!m || !m.refeicao) return false;
    const ref = String(m.refeicao).toLowerCase();
    return ref === 'mamadeira' || ref.includes('mamad') || (m.observacoes && m.observacoes.toLowerCase().includes('mamadeira'));
  });
  const totalBottlesMl = studentBottlesToday.reduce((acc, curr) => acc + (Number(curr.quantidadeMl) || 180), 0);

  // Core routine checkpoints for governance metrics score
  const allVitalsList = getFromDB<SinalVital[]>('anjo_sinais', []).filter(s => isStudentIdMatch(s.idosoId, idoso.id) && isTodayOrDemoDate(s.data));
  const latestVitals = allVitalsList.length > 0 ? allVitalsList[allVitalsList.length - 1] : null;

  const vitalsWithTemp = allVitalsList.filter(v => v.temperatura && v.temperatura > 0);
  const latestVitalsWithTemp = vitalsWithTemp.length > 0 ? vitalsWithTemp[vitalsWithTemp.length - 1] : null;
  const diaperVitals = allVitalsList.filter(v => v.fralda && v.fralda !== 'Sem trocas' && !v.id?.startsWith('sin_base_'));
  const latestDiaperVital = diaperVitals.length > 0 ? diaperVitals[diaperVitals.length - 1] : null;

  const sleepVitals = allVitalsList.filter(v => v.soneca && v.soneca !== 'Sem registros' && !v.id?.startsWith('sin_base_'));
  const latestSleepVital = sleepVitals.length > 0 ? sleepVitals[sleepVitals.length - 1] : null;

  const allSonoList = getFromDB<any[]>('anjo_sono', []).filter(s => isStudentIdMatch(s.idosoId, idoso.id));
  const latestSono = allSonoList.length > 0 ? allSonoList[allSonoList.length - 1] : null;

  const rawHygiene = getHygieneLog(idoso.id);
  const todayHygieneLog = rawHygiene ? {
    bath: Boolean(rawHygiene.bath ?? rawHygiene.banho),
    teeth: Boolean(rawHygiene.teeth ?? rawHygiene.higieneBucal),
    clothes: Boolean(rawHygiene.clothes ?? rawHygiene.trocaRoupa),
    diaper: Boolean(rawHygiene.diaper ?? rawHygiene.trocaFralda),
    hands: Boolean(rawHygiene.hands ?? rawHygiene.banho ?? rawHygiene.bath),
    cream: Boolean(rawHygiene.cream ?? rawHygiene.pele),
    time: rawHygiene.time || '',
    observations: rawHygiene.observations || rawHygiene.obs || '',
    registradoPor: rawHygiene.registradoPor || ''
  } : {
    bath: false,
    teeth: false,
    clothes: false,
    diaper: false,
    hands: false,
    cream: false,
    time: '',
    observations: '',
    registradoPor: ''
  };

  // Filter real vitals logged today in this active period (excluding baseline placeholder entries)
  const realVitalsToday = allVitalsList.filter(v => 
    !v.id?.startsWith('sin_base_') && 
    !v.observacoes?.includes('Registro do dia anterior preservado')
  );

  const hasVitalsToday = realVitalsToday.length > 0;
  const hasSleepToday = (allSonoList.length > 0) || Boolean(latestSleepVital?.soneca);
  const hasDiaperToday = Boolean(todayHygieneLog?.diaper) || Boolean(latestDiaperVital?.fralda);
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
  const sleepSummary = latestSleepVital?.soneca
    ? latestSleepVital.soneca 
    : (latestSono 
        ? (latestSono.observacoes && latestSono.observacoes.length > 0 
            ? latestSono.observacoes 
            : (latestSono.dormiuEm && latestSono.acordouEm ? `Dormiu das ${latestSono.dormiuEm} As ${latestSono.acordouEm}` : 'Soneca registrada'))
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
  const instName = localStorage.getItem(`anjo_brand_name_${currentModeStr}`) || (isEscolar ? 'Colegio Pequeno Anjo' : 'Clinica Recanto Feliz');
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
      
      
      {usuarioAtual?.tipo === 'familiar' && myChildren.length > 1 && (
        <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-800 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md tracking-wider">
                 Seus Filhos Matriculados
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight pt-1">
                Boletins de Acompanhamento Familiar
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Voce possui <strong className="text-slate-700 dark:text-slate-300">{myChildren.length} assistidos</strong> registrados com o telefone <strong className="text-indigo-600">{usuarioAtual.telefone}</strong>. Selecione qual deseja monitorar:
              </p>
            </div>
            
            
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
              <span className="text-xl">{isEscolar ? '' : ''}</span>
            )}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
               InstituicaoCredenciada & Patrocinadora
            </span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight leading-none">
              {instName}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-snug">
              {instSlogan || (isEscolar ? 'Onde a inf e registrada para sempre  Transparencia e seguranca diaria.' : 'Acompanhamento Senior Inteligente  Cuidado e transparencia em tempo real.')}
            </p>
          </div>
        </div>

        
        <div className="hidden sm:flex flex-col items-end text-right shrink-0">
          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            Parceiro Oficial
          </span>
          <span className="text-[8px] text-slate-400 font-bold mt-1">Selo de Qualidade Digital</span>
        </div>
      </div>

      
      {onSwitchIdoso && (
        <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left min-w-0">
              <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md tracking-wider">
                 Busca Direta por Nome
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span></span> Busca Rapida de {isEscolar ? 'Alunos & Criancas' : 'Assistidos'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Digite o nome de qualquer {isEscolar ? 'aluno, turma ou responsavel' : 'assistido'} para alternar o diario e boletim em 1 clique:
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

      
      {appMode === 'escolar_infantil' && usuarioAtual?.tipo !== 'familiar' && (
        <div className={`p-5 rounded-3xl border transition-all shadow-md ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-800/80 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/60 pb-3 mb-4">
            <div className="space-y-1 text-left">
              <h3 className="text-sm font-black flex items-center gap-2">
                <span></span> Central de Salas & Professoras <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Ambiente de Testes</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Mude de sala e professora com 1 clique. O painel se adaptara por completo para carregar as informacoes e diarios da sala selecionada.
              </p>
            </div>
            {usuarioAtual && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100/80 px-3 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
                <span className="text-[10px] text-indigo-800 font-extrabold uppercase">Professora Ativa:</span>
                <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1">
                   {usuarioAtual.nome.replace(' (Educadora)', '')} 
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
                    <p className="text-[10px] text-slate-500 font-extrabold truncate"> {teacherName}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-0.5">
                      <span> {activeStudentsInClass} Aluno{activeStudentsInClass !== 1 ? 's' : ''}</span>
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
      
      
      <div className={`p-5 rounded-3xl border transition-all shadow-md ${
        accessibilitySettings?.darkMode
          ? 'bg-slate-800/80 border-slate-700 text-slate-100'
          : appMode === 'escolar_infantil'
            ? 'bg-linear-to-r from-teal-50 to-indigo-50 border-indigo-200 text-slate-800' 
            : 'bg-linear-to-r from-amber-50 to-orange-50 border-amber-200 text-slate-800'
      }`}>
      
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 text-left">
            {appMode === 'escolar_infantil' ? (
              <div className="w-16 h-16 rounded-2xl bg-white border border-indigo-100 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <img src="/logo.png?v=15" alt="Anjinho Logo" className="w-full h-full object-contain transform scale-[1.45]" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <span className="text-3xl shrink-0"></span>
            )}
            <div className="space-y-1">
              <h3 className={`text-sm font-extrabold ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-850'}`}>
                {appMode === 'escolar_infantil'
                  ? 'Modo Agenda Escolar Infantil Ativo (Maternal & Creche)!'
                  : 'Acompanhamento Senior Inteligente Ativo!'}
              </h3>
              <p className={`text-xs leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {appMode === 'escolar_infantil'
                  ? 'Voce esta simulando o aplicativo voltado para creches e bercarios. As abas do Diario foram configuradas para o bem-estar ludico, higiene e rotina da primeira inf'
                  : 'Nossa tecnologia de cuidado integrado oferece duas versoes super otimizadas: AnjoCuidador (Acompanhamento Senior) e Anjinho Escolar (Educacao Infantil). Conheca as abas correspondentes:'}
              </p>

              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {appMode === 'escolar_infantil' ? (
                  <>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg"> Papa & Mamadeira</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg"> Trocas & Higiene</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg"> Copos de Agua</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg"> Sono / Soneca</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg"> Humor & Social</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg"> Atividade Pedagógica</div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg"> Alimentacao</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg"> Banho e Higiene</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg"> Hidratacao</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg"> Diario de Sono</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg"> Humor/Comportamento</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg"> Exercicios/Atividades</div>
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
              {appMode !== 'idoso' ? ' Ativar Modo Idoso (Lar)' : isApresentacao ? ' Ativar Agenda Escolar' : ' Ativar Agenda Escolar (Simular)'}
            </button>
          )}
        </div>
      </div>

      
      {isStaffUser(usuarioAtual) && (
<div className="bg-white rounded-2xl border border-[#cbd5e1] p-1.5 shadow-sm max-w-md mx-auto flex items-center justify-between gap-1.5">
        <button
          onClick={() => handleSetVisualMode('cuidador')}
          className={`flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            (visualMode as string) === 'cuidador' 
              ? 'bg-serene-blue text-white shadow-md ring-2 ring-indigo-400/30' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>{isEscolar ? 'AULA' : 'Saude'}</span>
          <span>{isEscolar ? 'Painel da Professora' : 'Painel doCuidador'}</span>
        </button>
        <button
          onClick={() => handleSetVisualMode('familia')}
          className={`flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            visualMode === 'familia' 
              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>PAX</span>
          <span>{isEscolar ? 'Portal de Tranquilidade' : 'Portal de Tranquilidade'}</span>
        </button>
      </div>
      )}

      
      <div className="bg-slate-50 border border-[#cbd5e1] p-3 rounded-2xl flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${simulatedOnline ? 'animate-ping bg-emerald-400' : 'animate-bounce bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${simulatedOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-700">
              Dispositivo {simulatedOnline ? 'Conectado A Nuvem (Servidor)' : 'Operando em Fila Local (IndexedDB)'}
            </span>
            {filaOffline.length > 0 && (
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                 {filaOffline.length} Registro(s) Pendente(s)
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
                 [!]  {showSimulationTools ? 'Ocultar Simulador' : 'Simular Redes / Testes'}
              </button>
            )}
          </div>
        </div>

        
        {!isApresentacao && showSimulationTools && (
          <div className="bg-white p-4 rounded-xl border border-dashed border-slate-350 space-y-3 animate-slide-down">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="space-y-1 leading-normal">
                <strong className="text-xs font-black text-slate-700 uppercase tracking-wide block">Ambiente de Testes / Simulador de Perda de Sinal</strong>
                <p className="text-[11px] text-slate-500">
                  Use os botoes de simulacao abaixo para colocar o dispositivo cooperativamente em modo offline. O aplicativo guardara os horarios exatos dos toques no IndexedDB, e efetuara logs de auditoria de sincronização retroativa integrados ao perfil de auditoria LGPD no momento que a rede re-estabilizar.
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
                {simulatedOnline ? ' Forcar Queda de Internet (Simular Offline)' : ' Restaurar Conexao de Internet (Simular Online)'}
              </button>
            </div>
          </div>
        )}
      </div>

      
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
              {usuarioAtual.nome}  <span className="text-blue-600 capitalize font-bold">{getRoleLabel(usuarioAtual, isEscolar)}</span>
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
            title={isEscolar ? 'Ver salas de aula e trocar a crianca/aluno em acompanhamento' : 'Ver lista de pessoas assistidas'}
          >
            <Users className="w-3.5 h-3.5" />
            {isEscolar ? 'Trocar Sala / Aluno' : 'Trocar Idoso'}
          </button>
        </div>
      </div>

      
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
              <Heart className="w-3.5 h-3.5 fill-current text-serene-blue" /> {isEscolar ? 'Aluno Verificado' : 'Visao Geral Ativa'}
            </span>
            <h1 className={`${titleClass} text-slate-800`}>{idoso.nome}</h1>
            {idoso.contatoEmergencia?.nome && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-xl font-bold w-fit mx-auto md:mx-0 shadow-2xs">
                <span></span>
                <span>Resp: <strong className="font-extrabold text-indigo-950">{idoso.contatoEmergencia.nome}</strong> ({idoso.contatoEmergencia.parentesco || 'Mae/Pai'})</span>
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
                <span className="text-sm"></span>
                <span className="text-xs text-indigo-800 dark:text-indigo-300 font-extrabold">Professora Titular:</span>
                <span className="text-xs font-black text-indigo-950 dark:text-white">
                  {(() => {
                    const studentRoom = getStudentClassName(idoso) || idoso.salaAula || idoso.quarto || 'Bercario I - A';
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
                <span className="text-sm"></span>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-extrabold">Cuidador Responsavel:</span>
                <span className="text-xs font-black text-amber-950 dark:text-white">
                  {usuarioAtual ? usuarioAtual.nome.replace(' (Cuidadora)', '') : 'Sem Cuidador'}
                </span>
              </div>
            )}
            
            
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
                        title="Excluir rotina/condicao"
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
                  <Plus className="w-3.5 h-3.5" /> {isEscolar ? 'Novo Alerta/Alergia' : 'Nova Condicao/Alergia'}
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
                      <option value="condicao">{isEscolar ? 'Rotina/Restricao' : 'Condicao Medica'}</option>
                      <option value="alergia">Alergia Grave</option>
                    </select>
                    <input
                      type="text"
                      placeholder={newSpecialType === 'condicao' ? (isEscolar ? 'Ex: Soneca apos almoco' : 'Ex: Diabetes Tipo 2') : 'Ex: Amendoim, Lactose'}
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
                      Voce esta visualizando a ficha de <strong>{idoso.nome}</strong>. Cadastramos todos os 25 alunos da sala.
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

      
      {!isStaffUser(usuarioAtual) && visualMode === 'familia' && localStorage.getItem(`anjo_sub_status_${idoso.id}`) !== 'atrasado' && (
        <div className={`p-6 rounded-3xl border text-left space-y-4 shadow-xs relative overflow-hidden transition-all ${
          accessibilitySettings?.darkMode 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : 'bg-linear-to-r from-emerald-50/50 to-teal-50/50 border-emerald-200'
        }`}>
          
          <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Periodo de Experiencia
                </span>
                <span className={`text-xs font-bold ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 15 de 30</span>
              </div>
              <h4 className={`text-base font-black ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-950'}`}>
                {isEscolar 
                  ? ' Seu Periodo de Testes Gratuitos (30 Dias) esta Ativo!' 
                  : ' Periodo de Experiencia Gratis (30 Dias) Ativo!'
                }
              </h4>
              <p className={`text-xs max-w-2xl font-semibold leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                {isEscolar
                  ? `Ja faz 15 dias que voce esta mais perto da rotina escolar de ${idoso.nome}. Viu como a aba de Medicamentos Encomendados e o Diario Ludico facilitam seu dia e trazem tranquilidade?`
                  : `Ja faz 15 dias que voce esta mais perto do acompanhamento preventivo de ${idoso.nome}. Viu como a aba de Medicamentos e os registros de Sinais Vitais trazem paz e seguranca?`
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
                })()} 
              </button>
              {!isApresentacao && (
                <span className={`block text-[9px] font-semibold mt-1 text-center ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  (Simular faturamento & Paywall)
                </span>
              )}
            </div>
          </div>

          
          <div className="pt-2">
            <div className="relative">
              
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
              
              <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-emerald-500 -translate-y-1/2 z-0 rounded-full"></div>

              
              <div className="relative z-10 grid grid-cols-4 text-center">
                
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                    
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Dia 1</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Boas-vindas</span>
                </div>

                
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs animate-pulse">
                    
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Dia 15</span>
                  <span className={`text-[9px] font-extrabold ${accessibilitySettings?.darkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>Voce esta aqui</span>
                </div>

                
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                    3
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 25</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Aviso Previo</span>
                </div>

                
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

      {(visualMode as string) === 'cuidador' ? (
        // =====================================================================
        // SECTION A: CAREGIVER VIEW (PORTAL DO CUIDADOR)
        // =====================================================================
        <div className="space-y-6">
          
          
          {isAbsent ? (
            <div className="rounded-2xl p-6 border bg-rose-50 border-rose-300 shadow-xs relative overflow-hidden transition-all duration-300">
              <div className="absolute right-4 top-4">
                <UserX className="w-12 h-12 text-rose-500 opacity-20 animate-pulse" />
              </div>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 font-sans">{isEscolar ? 'Controle de Presença Escolar' : 'Acompanhamento de Cuidados'}</span>
                  <h2 className="text-xl font-bold text-rose-950">
                    {isEscolar ? ' Aluno Ausente Hoje (Falta)' : ' Cliente Ausente'}
                  </h2>
                  <p className="text-xs text-rose-700 mt-1 leading-normal">
                    {isEscolar 
                      ? 'Este aluno foi marcado como ausente hoje. Nenhuma notificacao ou relatorio de rotina sera cobrado ou emitido para os pais, e os lembretes de atraso para este diario estao desativados.'
                      : 'Este idoso foi marcado como ausente hoje. Nenhuma atividade ou tarefa de rotina do dia sera cobrada ou marcada.'
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
                       Apenas educadores/cuidadores autorizados podem alterar a presença do aluno.
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isEscolar ? 'Classe e Presença do Aluno' : 'Controle de Horas'}</span>
                    {isShiftActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> AO VIVO
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {isShiftActive 
                      ? (isEscolar ? ` Periodo Letivo em Andamento (${idoso.nome.split(' (')[0]})` : ` Turno Ativo noCelular!`) 
                      : (isEscolar ? `Aulas Nao Iniciadas (${idoso.nome.split(' (')[0]})` : 'Seu Turno Nao Esta Ativo')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {isEscolar 
                      ? (isStaffUser(usuarioAtual)
                          ? 'Inicie o diario de classe do aluno para registrar sonecas, xixi/coco, mamadeiras e saude. No final do periodo, termine a aula para disparar o relatorio automatico via WhatsApp para os pais!'
                          : (isShiftActive 
                              ? ` ${idoso.nome.split(' (')[0]} esta presente na escola e o diario de classe esta aberto em tempo real pela equipe pedagógica.` 
                              : `Aguardando a professora/educadora iniciar o periodo letivo para ${idoso.nome.split(' (')[0]}. Assim que a entrada for confirmada, o cronometro iniciara aqui automaticamente.`))
                      : 'Inicie seu turno para acompanhar a rotina e as atividades. Ao final, clique em Encerrar para compilar o resumo e enviar os disparos de auditoria aos familiares interessados.'
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  
                  <div className={`px-4 py-2.5 rounded-xl border leading-none transition-all duration-300 ${isShiftActive ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        {isEscolar ? 'TEMPO EM AULA' : 'DURACAO DO TURNO'}
                      </span>
                      {isStaffUser(usuarioAtual) && (
                        <button
                          type="button"
                          onClick={handleDirectStopShift}
                          className="text-[10px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md cursor-pointer transition-all border border-rose-200"
                          title="Zerar cronA metro e encerrar contagem imediatamente"
                        >
                          a1 Zerar / Desligar
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
                            onClick={handleTriggerEndShiftReview}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:scale-102"
                            title="Revisar rotinas apontadas, encerrar o período escolar, desligar o cronA metro e enviar relatA3rio para os pais"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" /> {isEscolar ? 'Desligar Individual' : 'Desligar Turno'}
                          </button>
                          <button
                            onClick={() => handleEndShiftGroup(teacherClassroom)}
                            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 hover:scale-102"
                            title={`Desligar cronometro de todos os alunos da turma ${teacherClassroom} e enviar relatA3rios coletivos`}
                          >
                            <Users className="w-3.5 h-3.5" /> Desligar Coletivo ({teacherClassroom})
                          </button>
                          <button
                            onClick={handleDirectStopShift}
                            className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 hover:scale-102"
                            title="Desligamento direto de emergAancia do cronA metro"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" /> Desligar Direto
                          </button>
                          <button
                            onClick={() => {
                              setOccurrenceForm({ tipo: 'queda', criticidade: 'vermelho', descricao: '' });
                              setShowOccurrenceModal(true);
                            }}
                            className="px-3 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                            title="Registrar intercorrAancia mAdica ou ocorrAancia do dia"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-white" /> OcorrAancia
                          </button>
                          <button
                            onClick={handleToggleAbsence}
                            className="px-3 py-2.5 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-1"
                            title={isEscolar ? 'Sinalizar ausAancia do aluno hoje' : 'Registrar nAo comparecimento'}
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-500" /> {isEscolar ? 'AusAancia' : 'Falta'}
                          </button>
                        </>) : (
                        <>
                          <button
                            onClick={handleStartShift}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-102"
                            title={isAbsent ? "Religar cronometro registrando o retorno do aluno (mantendo atividades salvas)" : "Ligar cronometro para este aluno"}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> {isAbsent ? ' Religar Cronometro' : (isEscolar ? ' Ligar Individual' : ' Iniciar Turno Individual')}
                          </button>
                          <button
                            onClick={() => handleStartShiftGroup(teacherClassroom)}
                            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-102"
                            title={`Ligar cronometro de todos os alunos da turma ${teacherClassroom} e zerar as atividades de todos`}
                          >
                            <Users className="w-3.5 h-3.5" />  Ligar Coletivo ({teacherClassroom})
                          </button>
                          <button
                            onClick={handleToggleAbsence}
                            className="px-3.5 py-2.5 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            title={isEscolar ? 'Sinalizar ausencia do aluno hoje' : 'Registrar nao comparecimento'}
                          >
                            <UserX className="w-4 h-4 text-rose-500" /> {isEscolar ? 'Sinalizar Ausencia' : 'Registrar NaoComparecimento'}
                          </button>
                        </>
                      )
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600 bg-white/70 px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
                          <span className={`w-2 h-2 rounded-full ${isShiftActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {isShiftActive
                            ? 'Sincronizado com a escola em tempo real.'
                            : 'Visualizacao dos responsaveis.'}
                        </span>
                        <button
                          type="button"
                          onClick={handleSyncParentShiftState}
                          disabled={isSyncingParent}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          title="Clique para sincronizar o cronômetro com a escola via nuvem"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isSyncingParent ? 'animate-spin' : ''}`} />
                          <span>{isSyncingParent ? 'Sincronizando...' : '🔄 Sincronizar Cronômetro'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          
          {filaOffline.length > 0 && (
            <div className="bg-amber-50/70 border-2 border-amber-300 p-5 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-950">Dispositivo Offline: Itens na Fila Local ({filaOffline.length})</h3>
              </div>
              <p className="text-xs text-amber-800 leading-normal">
                Voce registrou tarefas enquanto estava sem internet. O sistema guardou o horario real do seu celular. Quando sua internet voltar, mude no simulador acima para "Online" e sincronize os registros de auditoria.
              </p>
              <div className="space-y-1.5 pt-1.5">
                {filaOffline.map(oItem => (
                  <div key={oItem.id_local} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-semibold shadow-2xs">
                    <div>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded uppercase font-black mr-2">{oItem.tipo}</span>
                      <strong className="text-slate-800">{oItem.titulo}</strong>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-500">
                      Dispositivo: {new Date(oItem.horario_registrado_dispositivo).toLocaleTimeString('pt-BR')}    <span className="text-rose-500 font-bold uppercase tracking-wide">Pendente</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-blue-600" /> Painel "Um-Toque" de Registros Diarios
              </h3>

              <div className="relative">
                {renderDashboardAuthBadge()}
              {!isShiftActive && (
                <div className="mb-4 p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-950 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-lg shrink-0">
                      a i 
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        {isEscolar ? 'Período Letivo Desligado / Aguardando Início' : 'Turno de Cuidados Desligado'}
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        {isEscolar 
                          ? 'Para registrar mamadeiras, refeições, hidratação, sono, trocas de fralda ou saúde do aluno, inicie o período letivo.'
                          : 'Para registrar refeições, hidratação, sono, higiene ou sinais vitais, inicie o turno.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleStartShift}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Ligar Individual
                    </button>
                    {isEscolar && (
                      <button
                        type="button"
                        onClick={() => handleStartShiftGroup(teacherClassroom)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
                      >
                        <Users className="w-3.5 h-3.5" /> Ligar Coletivo
                      </button>
                    )}
                  </div>
                </div>
              )}
              {isAbsent && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        {isEscolar ? 'Aluno com Falta / Ausencia Registrada' : 'Cliente Marcado como Ausente'}
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Para registrar alimentacao, hidratacao ou cuidados normalmente, clique no botao ao lado ou use qualquer registro rapido.
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
              
              
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Coffee className="text-amber-500 w-4.5 h-4.5" />
                    {isEscolar ? 'Alimentação & Mamadeira' : 'Refeição RApida'}
                  </h4>
                  {isEscolar && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                      {studentBottlesToday.length} {studentBottlesToday.length === 1 ? 'mamadeira hoje' : 'mamadeiras hoje'}
                    </span>
                  )}
                </div>

                {isEscolar && studentBottlesToday.length > 0 && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span className="flex items-center gap-1">
                        <span>14</span>
                        <span>Mamadeiras Registradas Hoje ({studentBottlesToday.length}):</span>
                      </span>
                      <span className="font-mono bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-black text-[11px]">
                        Total: {studentBottlesToday.reduce((acc, curr) => acc + (Number(curr.quantidadeMl) || 180), 0)} ml
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {studentBottlesToday.map((b, idx) => (
                        <span key={b.id || idx} className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-amber-200 text-amber-900 shadow-3xs flex items-center gap-1">
                          <strong className="text-amber-950 font-black">{idx + 1}Aa mamadeira:</strong> {b.horario} ({b.quantidadeMl || 180} ml)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleQuickMealSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Refeicao</label>
                      <select
                        value={quickMeal.refeicao}
                        onChange={e => setQuickMeal({ ...quickMeal, refeicao: e.target.value })}
                        className="w-full text-xs font-bold px-2.5 py-2 border border-[#cbd5e1] rounded-xl bg-white text-slate-800 focus:ring-1 focus:outline-hidden"
                      >
                        <option value="mamadeira">🍼 Mamadeira de Leite</option>
                        <option value="lanche_manha">a Lanche da Manha / Frutas</option>
                        <option value="almoco">2 Almoco Saudavel / Papinha</option>
                        <option value="lanche_tarde"> Frutinhas / Lanche da Tarde</option>
                        <option value="jantar"> Jantar / Sopinha</option>
                        <option value="agua"> Garrafinha de Agua</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aceitacao</label>
                      <select 
                        value={quickMeal.aceitacao} 
                        onChange={e => setQuickMeal({...quickMeal, aceitacao: e.target.value})}
                        className="w-full text-xs font-semibold px-2 py-2 border border-[#cbd5e1] rounded-xl bg-slate-50"
                      >
                        <option value="muito_bem">Tomou Tudo / Super Bem</option>
                        <option value="metade">Tomou a Maior Parte</option>
                        <option value="pouco">Tomou Pouquinho</option>
                        <option value="recusou">Recusou</option>
                      </select>
                    </div>
                  </div>

                  {quickMeal.refeicao === 'mamadeira' && (
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50/40 rounded-xl border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base"></span>
                          <span>Volume da Mamadeira:</span>
                        </span>
                        <span className="font-mono font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-md text-xs shadow-3xs">
                          {quickMeal.quantidadeMl || 180} ml
                        </span>
                      </div>

                      
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {[60, 90, 120, 150, 180, 210, 240, 300].map(vol => (
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observacao / Cardapio</label>
                      <VoiceInput 
                        onTranscript={text => setQuickMeal(prev => ({ ...prev, observacao: prev.observacao ? prev.observacao + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Observacao rapida (ex: Amou a banana cozida)"
                      value={quickMeal.observacao}
                      onChange={e => setQuickMeal({...quickMeal, observacao: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-xl focus:ring-1 focus:outline-hidden"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {quickMeal.refeicao === 'mamadeira'
                      ? `🍼 Registrar Mamadeira (${quickMeal.quantidadeMl || 180} ml)`
                      : 'Registrar Refeição'}
                  </button>
                </form>
              </div>

              
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Droplets className="text-cyan-500 w-4.5 h-4.5 animate-pulse" /> 
                        {isEscolar ? 'Hidratacao Rapida (Agua)' : 'Hidratacao Instant'}
                      </h4>
                      <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                        {quickHydrationAmount} ml
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal mb-3">
                      {isEscolar 
                        ? `Escolha a quantidade de agua servida em mL para ${idoso.nome}. Registra o copo e atualiza a jarrinha.`
                        : `Basta um clique para salvar o consumo de agua de ${idoso.nome}. O aplicativo cuida de atualizar a rotina e sincronizar.`}
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

                  
                  {(() => {
                    const targetGoal = isEscolar ? 600 : 1500;
                    const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                    return (
                      <div className="flex flex-col items-center bg-cyan-50/70 p-2.5 rounded-2xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de hidratacao: o conteudo sobe conforme a agua e oferecida!">
                        <div className="relative my-0.5">
                          
                          <div className="relative w-10 h-16 border-2 border-cyan-600 rounded-b-xl rounded-t-xs bg-white/90 overflow-hidden shadow-inner flex flex-col justify-end">
                            
                            <div 
                              className="bg-gradient-to-t from-cyan-600 via-sky-500 to-sky-400 w-full transition-all duration-700 relative"
                              style={{ height: `${percentJug}%` }}
                            >
                              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-200 animate-pulse"></div>
                            </div>

                            
                            <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 pointer-events-none opacity-40">
                              <div className="border-t border-cyan-800 w-full"></div>
                              <div className="border-t border-cyan-800 w-full"></div>
                              <div className="border-t border-cyan-800 w-full"></div>
                            </div>
                          </div>
                          
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
                  <span> Oferecer Copo (+{quickHydrationAmount}ml)</span>
                  <span className="text-[10px] bg-cyan-700/40 px-2 py-0.5 rounded-md">Jarrinha Sobe!</span>
                </button>
              </div>

              
              

              
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Smile className="text-indigo-505 w-4.5 h-4.5" /> Estado de Humor / Nota doCuidador
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
                      <option value="calmo"> Calmo / Sereno</option>
                      <option value="feliz"> Feliz / Comunicativo</option>
                      <option value="sonolento"> Sonolento / Repousando</option>
                      <option value="agitado"> [!]  Agitado / Inquieto</option>
                      <option value="confuso"> Desorientado / Confuso</option>
                      <option value="recusando"> Resiste As Intervencoes</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="quick-humor-observacao" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observacao do Humor / Estado</label>
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
                      placeholder="Nota rapida (ex: Dormiu bem A tarde, descansou no soninho e acordou bem disposto)"
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

              
              {isEscolar ? (
                <>
                  {/* CARD 1: REGISTRO DE SONECA / DESCANSO DO ALUNO */}
                  <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4 shadow-2xs">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="text-indigo-500 w-4.5 h-4.5 animate-pulse" /> Soneca & Descanso do Aluno
                    </h4>
                    <form onSubmit={handleQuickSleepSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Soneca / Descanso</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Dormiu das 13:00 As 14:30"
                          value={quickSleepText}
                          onChange={e => setQuickSleepText(e.target.value)}
                          className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                        />
                        <div className="mt-1.5 space-y-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-indigo-700 flex items-center gap-1 uppercase tracking-wider">Toque Rapido (Soneca):</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setQuickSleepText('Dormiu 30 minutos')}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              30m
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickSleepText('Dormiu 1 hora')}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              1h
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickSleepText('Dormiu 1h30')}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              1h30
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickSleepText('Dormiu 2 horas')}
                              className="px-2 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-100 active:scale-95 text-indigo-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              2h
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickSleepText('Nao dormiu / sesta')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 active:scale-95 text-rose-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              Nao dormiu
                            </button>
                          </div>
                          <div className="pt-1.5 border-t border-indigo-100/60 flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 shrink-0">Reloginho:</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="time" 
                                value={sleepStart}
                                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold text-[9px] focus:outline-hidden"
                                onChange={e => {
                                  const val = e.target.value;
                                  setSleepStart(val);
                                  setQuickSleepText(`Dormiu das ${val} As ${sleepEnd}`);
                                }}
                              />
                              <span className="text-[9px] font-bold text-slate-400">As</span>
                              <input 
                                type="time" 
                                value={sleepEnd}
                                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold text-[9px] focus:outline-hidden"
                                onChange={e => {
                                  const val = e.target.value;
                                  setSleepEnd(val);
                                  setQuickSleepText(`Dormiu das ${sleepStart} As ${val}`);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Salvar Soneca & Notificar Pais
                      </button>
                    </form>
                  </div>

                  {/* CARD 2: SAUDE, FRALDA & CUIDADOS DO ALUNO */}
                  <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4 shadow-2xs">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="text-rose-500 w-4.5 h-4.5 animate-pulse" /> Saude, Fralda & Cuidados do Aluno
                    </h4>
                    <form id="quick-vitals-form" onSubmit={handleQuickVitalsSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="col-span-2 md:col-span-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <label htmlFor="vital-glicemia-escolar" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fralda (Xixi ou Coco)</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Falar:</span>
                              <VoiceInput 
                                onTranscript={text => setQuickVitals(prev => ({ ...prev, glicemia: text }))} 
                                size="sm"
                              />
                            </div>
                          </div>
                          <input 
                            id="vital-glicemia-escolar"
                            type="text" 
                            placeholder="Ex: Fez Coco / Pomada"
                            value={quickVitals.glicemia}
                            onChange={e => setQuickVitals({...quickVitals, glicemia: e.target.value})}
                            className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                          />
                          <div className="mt-1.5 space-y-1.5 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">
                                📍 Selecao Rapida de Fralda / Toalete:
                              </span>
                              {quickVitals.glicemia && (
                                <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                  {quickVitals.glicemia}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Apenas Xixi' }))}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border shadow-2xs ${
                                  (quickVitals.glicemia === 'Apenas Xixi' || quickVitals.glicemia === 'Fez Xixi')
                                    ? 'bg-sky-500 text-white border-sky-600 ring-2 ring-sky-300'
                                    : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                                }`}
                              >
                                <span>💧</span> Xixi
                              </button>
                          </div>
                    </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
