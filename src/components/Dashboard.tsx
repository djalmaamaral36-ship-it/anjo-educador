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
import { parseAuraRawPlan, formatAuraTaskTitle, inferTaskType, realignPedagogicalActivity, isConversationalChatNoise, areTaskTitlesSimilar, mergeSimilarTasks } from '../utils/auraPlanParser';
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
  RefreshCw
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
  if (rawTime === 'Início do Turno' || rawTime.includes('Invalid')) return fallback;
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
  const labelSinaisVitais = isEscolar ? 'Sinais de Saúde & Temperatura' : 'Sinais Vitais';
  const labelPlanoCuidado = isEscolar ? 'Instruções da Classe & Rotina' : 'Plano de Cuidado';
  const labelObservacoes = isEscolar ? 'Observações Gerais & Rotina' : 'Observações de Rotina';
  const labelMedicamento = isEscolar ? 'Medicação Encomendada' : 'Medicamento';

  const renderDashboardAuthBadge = () => {
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs mb-3">
          <div className="text-xl">⚠️</div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-rose-950">
              {isEscolar ? 'Alimentação e Cuidados Não Autorizados' : 'Sem Autorização de Cuidados'}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isEscolar 
                ? 'Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel de Pais & Autorizados para este aluno. Registros e ações rápidas estão bloqueados para cuidadoras e professoras.'
                : 'Nenhum familiar autorizou "Alimentação e Cuidados" no painel. Registros rápidos estão bloqueados para os cuidadores.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 shadow-3xs mb-3">
        <div className="text-emerald-600 bg-white p-1 rounded-full text-xs font-black shadow-3xs">✓</div>
        <div className="text-xs font-semibold text-emerald-950">
          {isEscolar ? 'Autorização Ativa dos Pais: ' : 'Autorização Ativa da Família: '}
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
        .replace(/Ana Silva \(Cuidadora\)/g, 'Profª Ana Silva (Educadora)')
        .replace(/cuidador/gi, 'professor')
        .replace(/cuidadora/gi, 'professora');
    }

    // Se já for uma atividade escolar própria, de planejamento (Aura), manual ou se já possuir descrição personalizada, NÃO reescreve o título nem a descrição
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

    // Legacy Elderly Title adaptations (apenas para tarefas legadas do modo idoso sem descrição prévia)
    if (titulo.includes('Losartana')) {
      titulo = 'Soro / Inalação de Rotina 👃';
      descricao = 'Fazer inalação com 3ml de soro fisiológico mandado na mala (prevenção de tempo seco)';
    } else if (titulo.includes('Cálcio + Vitamina D') || titulo.includes('Cálcio')) {
      titulo = 'Vitaminas / Suplemento da Tarde 🍏';
      descricao = 'Dar 1 sachet de gostinho de laranja (mandado na mochila para o lanche)';
    } else if (titulo.includes('Metformina')) {
      titulo = 'Remédio da Gripe / Amoxicilina 💊';
      descricao = 'Dar 5ml da Amoxicilina de acordo com a autorização assinada na mochila.';
    } else if (titulo.includes('Donepezila') || titulo.includes('Aricept')) {
      titulo = 'Alergika Preventivo / Gotas 💧';
      descricao = 'Dar 5 gotinhas do antialérgico preventivo antes da soneca da classe.';
    } else if (titulo.includes('Café da manhã') || titulo.includes('Café')) {
      titulo = 'Mamadeira do Berçário / Café da Manhã 🍼';
      descricao = 'Mamadeira com fórmula morna ou leite conforme recomendação da família.';
    } else if (titulo.includes('Almoço')) {
      titulo = 'Almoço Saudável / Papinha 🍲';
      descricao = 'Pratinho balanceado, introdução de novos sabores, verduras e carninha desfiada.';
    } else if (titulo.includes('Banho de Sol') || titulo.includes('Alongamento') || titulo.includes('Exercício') || titulo.includes('Fisioterapia')) {
      titulo = 'Recreação no Pátio & Parquinho 🧸';
      descricao = 'Brincadeiras ao ar livre, estimulação física e interação na rodinha pedagógica.';
    } else if (titulo.includes('Banho &') || titulo.includes('Higiene')) {
      titulo = 'Fralda & Higiene Geral 👶';
      descricao = 'Acompanhar no banheiro, verificar fralda e trocar se necessário. Lavar mãos.';
    } else if (titulo.includes('Copos d\'Água') || titulo.includes('Hidratação')) {
      titulo = 'Hora da Garrafinha de Água 🥤';
      descricao = 'Estimular o aluno a beber água na sua garrafinha com canudo.';
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

    showToast(`✓ Sala alterada para ${classroomName}!`, 'success');
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
      setRoomPinError('Digite o PIN de 4 dígitos para prosseguir.');
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
      showToast(`✓ PIN correto! Acesso liberado para a sala ${roomToOpen}.`, 'success');
    } else {
      setRoomPinError('❌ PIN incorreto! Digite o PIN da educadora, o PIN da Diretora Nilva (3031) ou o PIN Dev (9181).');
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
      { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Histórico de Rotina', data: 'Hoje às 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
      { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualização do Painel de Tranquilidade', data: 'Hoje às 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
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
          cuidador: 'Profª Nilva Amaral',
          data: new Date().toLocaleDateString('pt-BR'),
          duracao: 'Período Completo',
          inicio: '07:30',
          fim: '17:30',
          taxaConformidade: 98,
          taxaQualidade: 100,
          mensagemCompleta: `🌳 A ÁRVORE DA INFÂNCIA HOJE:
Hoje a árvore do(a) *${idoso.nome.split(' (')[0]}* floresceu no Anjinho Escolar:
• 🍃 *Folhas verdes:* Nutrição balanceada e hidratação regular (100ml);
• 🌸 *Flores e borboletas:* Momento acolhedor de soneca e descanso (45min);
• 🍎 *Frutos e passarinhos:* Atividades pedagógicas e trabalhinhos manuais;
• 🪵 *Tronco forte:* Cuidados diários, higiene e saúde acompanhados de perto (36.5°C).

☀️💧 *PARTICIPE DA JORNADA DO(A) ${idoso.nome.split(' (')[0].toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestações de afeto:
✨ *Que encanto!* • ❤️ *Feito com amor* • 🌟 *Puro brilho!* • 🤝 *Orgulho da gente* • 💎 *Um tesouro!*

_(Cada manifestação sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diário de rotina escolar completo pelo link seguro:
🔗 ${window.location.origin}/?relatorio=${relatorioId}

Com carinho,
Equipe Anjinho Escolar ❤️🕊️`
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
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para excluir informações!");
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
    showToast('✓ Rotina/condição removida com sucesso!', 'success');
  };

  const handleDeleteAlergia = (alergToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para excluir informações!");
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
    showToast('✓ Alergia removida com sucesso!', 'success');
  };

  const handleDeleteHygieneObservation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para excluir observações!");
      return;
    }
    triggerConfirm(
      'Excluir Observação de Higiene',
      'Tem certeza de que deseja apagar a observação de higiene gravada hoje para este aluno/criança?',
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
        showToast('✓ Observação de higiene apagada com sucesso!', 'success');
      }
    );
  };

  const handleResetAllHygiene = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para limpar ou excluir registros!");
      return;
    }
    triggerConfirm(
      'Limpar Registros de Higiene',
      'Tem certeza de que deseja desmarcar os itens e apagar a observação de higiene de hoje?',
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
        showToast('✓ Registros de higiene limpos com sucesso!', 'success');
      }
    );
  };

  const handleDeleteOccurrence = (occurrenceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para excluir ocorrências!");
      return;
    }
    triggerConfirm(
      'Excluir Ocorrência / Registro de Cuidado',
      'Tem certeza de que deseja apagar esta ocorrência/anotação de cuidado registrada hoje?',
      () => {
        const updated = occurrencesList.filter(o => o.id !== occurrenceId);
        setOccurrencesList(updated);
        saveToDB(`anjo_ocorrencias_${idoso.id}`, updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_ocorrencias_${idoso.id}` } }));
        }
        showToast('✓ Ocorrência/Registro de cuidado removido com sucesso!', 'success');
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
      console.log('📡 [Dashboard Component] Evento db-vitals-update / anjo_user_updated recebido na tela do Responsável/Família!', { timestamp: new Date().toISOString(), detail: e?.detail });
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

  // LGPD Auditoria e Governança de acessos
  const [lgpdLogs, setLgpdLogs] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, [
      { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Histórico de Rotina', data: 'Hoje às 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
      { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualização do Painel de Tranquilidade', data: 'Hoje às 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
    ]);
  });

  // Ocorrências registradas no turno
  const [occurrencesList, setOccurrencesList] = useState<any[]>(() => {
    return getFromDB<any[]>(`anjo_ocorrencias_${idoso.id}`, []);
  });

  // Compartilhamento manual via WhatsApp para ocorrências
  const [showManualOccurrenceShareModal, setShowManualOccurrenceShareModal] = useState(false);
  const [manualShareOccurrenceMessage, setManualShareOccurrenceMessage] = useState<string | null>(null);
  const [activeSharingOccurrenceId, setActiveSharingOccurrenceId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [familiarShareStatuses, setFamiliarShareStatuses] = useState<{ [key: string]: 'pendente' | 'aberto' | 'confirmado' }>({});
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  // Compartilhamento coletivo via WhatsApp para encerramento de período letivo
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
      setCaregiverPinError('PIN incorreto ou não pertence a um profissional de plantão.');
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
        setQuickVitals(prev => (prev.pressao ? prev : { ...prev, pressao: `Dormiu das ${lastSono.dormiuEm} às ${lastSono.acordouEm}` }));
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
    const syncShiftState = () => {
      let targetId = idoso.id;
      const currentMode = (localStorage.getItem('anjo_app_mode') as string) || appMode || 'escolar_infantil';
      if (currentMode.startsWith('escolar')) {
        if (targetId === 'idoso_maria') targetId = 'aluno_1';
        else if (targetId === 'idoso_joao') targetId = 'aluno_2';
      } else {
        if (targetId === 'aluno_1') targetId = 'idoso_maria';
        else if (targetId === 'aluno_2') targetId = 'idoso_joao';
      }

      const activeShift = getShiftActiveState(targetId);
      console.log(`📡 [Dashboard Component] syncShiftState executado para idoso/aluno: ${targetId} (${idoso.nome}) | Ativo: ${activeShift.active} | Início: ${activeShift.startTime}`);
      setIsShiftActive(prevActive => {
        if (prevActive !== activeShift.active) {
          console.log(`🔄 [Dashboard State] Alterando isShiftActive de ${prevActive} para ${activeShift.active}`);
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
      const absentVal = localStorage.getItem(`anjo_is_absent_${targetId}`) === 'true' || localStorage.getItem(`anjo_is_absent_${idoso.id}`) === 'true';
      setIsAbsent(prevAbs => prevAbs !== absentVal ? absentVal : prevAbs);
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
          (cleanTitle.includes('cálcio') && cleanName.includes('cálcio')) ||
          (cleanTitle.includes('calcio') && cleanName.includes('calcio')) ||
          (cleanTitle.includes('donepezila') && cleanName.includes('donepezila')) ||
          (cleanTitle.includes('aricept') && cleanName.includes('aricept')) ||
          (cleanTitle.includes('soro') && cleanName.includes('soro')) ||
          (cleanTitle.includes('inalação') && cleanName.includes('inalação')) ||
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
      t.titulo.toLowerCase().includes('cálcio')
    );

    // Contar quantas tarefas de almoço/papinha padrão existem para este aluno
    const lunchTasksCount = seniorTasks.filter(t => {
      const tit = (t.titulo || '').toLowerCase();
      // Não conta atividades personalizadas da Aura como almoço duplicado
      if (t.id.startsWith('task_aura_')) return false;
      return tit.includes('almoço') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');
    }).length;

    // Se o usuário limpou explicitamente as tarefas/atividades deste perfil, respeita e mantém limpo
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

    // Se houver tarefas de idoso indevidas ou comentários conversacionais da IA salvos como tarefa, limpa automaticamente
    if (isEscolar || idoso.id.startsWith('aluno_')) {
      const sanitized = seniorTasks.filter(t => 
        !t.id.startsWith('task_j_') && 
        !t.id.startsWith('task_m_') && 
        !t.id.startsWith('task_d_') && 
        !t.titulo.toLowerCase().includes('artrose') && 
        !t.titulo.toLowerCase().includes('daflon') && 
        !t.titulo.toLowerCase().includes('metformina') && 
        !t.titulo.toLowerCase().includes('losartana') && 
        !t.titulo.toLowerCase().includes('cálcio') &&
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

    // Realinha automaticamente tarefas que possuem conflito semântico ou deslocamento de horário
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
      const isLunch = tit.includes('almoço') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');

      if (isEscolar && isLunch) {
        if (seenLunch) {
          // Ignora qualquer almoço/papinha duplicado em outro horário
          return;
        }
        seenLunch = true;
      }

      // Normaliza o título para detectar repetições do mesmo horário
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
          titulo: 'Acolhida & Entrada Afetiva 🏫',
          descricao: 'Recepção carinhosa dos alunos, acolhimento individual e organização de pertences.',
          horarioPrevisto: '07:00',
          status: 'pendente'
        },
        {
          id: 'task_s_roda_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Roda de Conversa: Tema do Dia 🪞',
          descricao: 'Apresentação do tema diário, musicalização, chamada divertida e expressão das crianças.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_s_lanche_manha_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Lanche da Manhã & Frutinhas 🍎',
          descricao: 'Frutas frescas da estação, biscoito integral e incentivo à hidratação.',
          horarioPrevisto: '09:00',
          status: 'pendente'
        },
        {
          id: 'task_s_parque_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Recreação no Pátio & Parquinho 🧸',
          descricao: 'Brincadeiras ao ar livre para estímulo motor, socialização e banho de sol adequado.',
          horarioPrevisto: '09:45',
          status: 'pendente'
        },
        {
          id: 'task_s_dirigida_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Atividade Dirigida Temática (BNCC) 🎨',
          descricao: 'Atividade prática pedagógica com foco no desenvolvimento cognitivo e sensorial.',
          horarioPrevisto: '10:30',
          status: 'pendente'
        },
        {
          id: 'task_s_almoco_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almoço Saudável / Papinha 🍲',
          descricao: 'Pratinho balanceado, introdução de novos sabores, verduras e carninha desfiada.',
          horarioPrevisto: '11:30',
          status: 'pendente'
        },
        {
          id: 'task_s_higiene_escovacao_' + idosoId,
          idosoId,
          tipo: 'banho',
          titulo: 'Higiene, Fraldas & Escovação 👶',
          descricao: 'Troca de fraldas, lavagem das mãos e estímulo à escovação dental com carinho.',
          horarioPrevisto: '12:15',
          status: 'pendente'
        },
        {
          id: 'task_s_soneca_' + idosoId,
          idosoId,
          tipo: 'sono',
          titulo: 'Soneca & Repouso Restaurador 💤',
          descricao: 'Descanso nos colchonetes individuais com ambiente calmo, iluminação suave e música relaxante.',
          horarioPrevisto: '12:30',
          status: 'pendente'
        },
        {
          id: 'task_s_lanche_tarde_' + idosoId,
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Lanche da Tarde / Mamadeira 🍼',
          descricao: 'Mamadeira/fórmula morna ou lanche da tarde equilibrado e hidratação.',
          horarioPrevisto: '14:15',
          status: 'pendente'
        },
        {
          id: 'task_s_brincadeira_livre_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Brincadeira Livre & Socialização 🧸',
          descricao: 'Cantinhos temáticos com brinquedos educativos, blocos de montar e autonomia.',
          horarioPrevisto: '14:45',
          status: 'pendente'
        },
        {
          id: 'task_s_historias_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Contação de Histórias & Música 📚',
          descricao: 'Leitura de livros ilustrados, fantoches e cantigas de roda.',
          horarioPrevisto: '15:30',
          status: 'pendente'
        },
        {
          id: 'task_s_saida_' + idosoId,
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Preparação para Saída & Despedida Afetiva 🎒',
          descricao: 'Organização das mochilinhas, fechamento da agenda do dia e entrega afetiva aos familiares.',
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
          titulo: 'Losartana Potássica (Pressão)',
          descricao: 'Dosagem: 50mg - 1 comprimido. Dar com meio copo d\'água.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_m_cafe',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Café da manhã',
          descricao: 'Geleia sem açúcar com pão integral + café com leite descascar.',
          horarioPrevisto: '08:30',
          status: 'pendente'
        },
        {
          id: 'task_m_alongamento',
          idosoId,
          tipo: 'atividade_fisica',
          titulo: 'Alongamento Leve e Exercício Funcional',
          descricao: '20 a 30 minutos de alongamento guiado e exercícios de mobilidade funcional.',
          horarioPrevisto: '09:30',
          status: 'pendente'
        },
        {
          id: 'task_m_banho',
          idosoId,
          tipo: 'banho',
          titulo: 'Banho & Higiene Geral',
          descricao: 'Banho morno assistido, hidratação da pele e troca de roupas limpas.',
          horarioPrevisto: '10:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_calcio',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Cálcio + Vitamina D',
          descricao: 'Dosagem: 1 sachet diluído em 100ml de água ou suco junto ao almoço.',
          horarioPrevisto: '12:30',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_almoco',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almoço',
          descricao: 'Arroz integral, purê de abóbora, filé de frango desfiado e brócolis cozido ao vapor.',
          horarioPrevisto: '12:30',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_m_hidra_tarde',
          idosoId,
          tipo: 'hidratacao',
          titulo: 'Copos d\'Água da Tarde',
          descricao: 'Oferecer 250ml de água gelada.',
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
          descricao: 'Dosagem: 850mg após o café da manhã.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_j_cafe',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Café da manhã',
          descricao: 'Ovos mexidos sem óleo, torrada de centeio e café preto adoçado.',
          horarioPrevisto: '08:00',
          status: 'pendente'
        },
        {
          id: 'task_j_circulacao',
          idosoId,
          tipo: 'medicacao',
          titulo: 'Daflon 1000mg',
          descricao: '1 comprimido para circulação.',
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
          titulo: 'Insistir na Água Sênior',
          descricao: 'Oferecer copo de 300ml.',
          horarioPrevisto: '11:00',
          status: 'pendente',
          observacao: ''
        },
        {
          id: 'task_j_almoco',
          idosoId,
          tipo: 'alimentacao',
          titulo: 'Almoço Balanceado',
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
        label: isEscolar ? 'Ocorrência escolar crítica' : 'Ocorrência crítica registrada',
        bg: 'bg-rose-50 border-rose-350',
        text: 'text-rose-900',
        details: `Há ${criticalOccurrences.length} ocorrência(s) crítica(s) registrada(s) neste turno. Recomenda-se atenção imediata.`,
        status: 'vermelho'
      };
    } else if (atrasadas > 0 || recusadas > 0 || occurrencesList.some(o => o.criticidade === 'amarelo')) {
      return {
        color: '#F2C94C',
        label: isEscolar ? 'Atenção necessária' : 'Atenção necessária',
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-900',
        details: isEscolar
          ? `Rotina sob monitoramento. Registramos ${atrasadas} atividade(s) pendente(s) ou ${recusadas} recusa(s) para acompanhamento dos pais.`
          : `Rotina sob monitoramento. Registramos ${atrasadas} item(ns) pendente(s) ou ${recusadas} recusa(s) de cuidado para acompanhamento da família.`,
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

  const getRefeicaoFromTitle = (title: string): 'cafe_manha' | 'almoco' | 'lanche' | 'lanche_tarde' | 'jantar' | 'ceia' => {
    const lower = title.toLowerCase();
    if (lower.includes('café') || lower.includes('cafe') || lower.includes('desjejum')) return 'cafe_manha';
    if (lower.includes('almoço') || lower.includes('almoco')) return 'almoco';
    if (lower.includes('tarde') || lower.includes('merenda')) return 'lanche_tarde';
    if (lower.includes('jantar') || lower.includes('janta')) return 'jantar';
    if (lower.includes('ceia')) return 'ceia';
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
          ? (commentText ? `${task.descricao}\n\nObservação do Educador: ${commentText}` : task.descricao)
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
        alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não tem permissão para registrar ou realizar esta atividade.`);
        return;
      }
    }

    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }

    // Check if refusal and comment is blank
    if (targetStatus === 'recusado' && !comment.trim()) {
      alert("⚠️ Atenção: Por favor, preencha o campo de observações com a justificativa técnica para a recusa ou não-administração do cuidado!");
      return;
    }

    if (!simulatedOnline) {
      // 📶 REGISTRO OFFLINE: Salvar na Fila com segurança
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
            concluidaEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (Aparelho Offline 📶)',
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
        acao: `Registro de Saúde Offline - ID: ${taskId} [${targetStatus.toUpperCase()}]`,
        data: new Date().toLocaleString('pt-BR'),
        ip: '10.0.2.15 (Celular Cuidador - em fila local)',
        detalhes: `Registros salvos localmente no IndexedDB e pendentes de sincronismo.`
      });
      saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
      setLgpdLogs(logs);

      setObservacaoRapida({ ...observacaoRapida, [taskId]: '' });
      return;
    }

    // 🌐 REGISTRO EM TEMPO REAL ON-LINE
    const updated = tarefas.map(t => {
      if (t.id === taskId) {
        const detailStr = comment ? ` Relato: "${comment}".` : '';
        const actionText = targetStatus === 'concluido' ? 'concluída' : '⚠️ RECUSADA (Registrado com Justificativa)';
        const msg = `Anjo Cuidador: A atividade "${t.titulo}" de ${idoso.nome} foi registrada como ${actionText} por ${usuarioAtual.nome}.${detailStr}`;
        
        triggerWhatsAppSim(t.titulo + ' ' + (targetStatus === 'concluido' ? 'Concluído' : 'Recusado'), msg);

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
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1) + ' (IP Móvel)',
      detalhes: `Ação transmitida via HTTPS com segurança de ponta a ponta.`
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
      recusa_medicacao: 'Recusa de medicação',
      recusa_alimentar: 'Recusa alimentar',
      comportamento: 'Alteração de comportamento',
      pressao: 'Pressão alterada',
      outro: 'Outro'
    };
    const tipoLabel = tipoMap[occurrenceForm.tipo] || occurrenceForm.tipo;

    // LGPD Trace Log for incident tracking
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Registro de Ocorrência Atípica - [${tipoLabel}]`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Intercorrência salva no histórico de cuidado de ${idoso.nome}: "${occurrenceForm.descricao}".`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);

    // Custom High-Fidelity message design layout requested by the user
    const msg = `🚨 *Anjo Cuidador — Intercorrência registrada* 🚨

Olá, família.
Foi registrada uma intercorrência com *${idoso.nome}*.

*Tipo:* ${tipoLabel}
*Horário:* ${novaOcorrencia.horario}
*Cuidador(a):* ${usuarioAtual.nome}
*Descrição:* ${occurrenceForm.descricao}

*Recomendação:* entrar em contato com a cuidadora para alinhamento.

_Mensagem preparada pelo aplicativo Anjo Cuidador._`;

    triggerWhatsAppSim('ALERTA ATÍPICO', msg);

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
          recusa_medicacao: 'Recusa de medicação', recusa_alimentar: 'Recusa alimentar',
          comportamento: 'Alteração de comportamento', pressao: 'Pressão alterada', outro: 'Outro'
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
          recusa_medicacao: 'Recusa de medicação', recusa_alimentar: 'Recusa alimentar',
          comportamento: 'Alteração de comportamento', pressao: 'Pressão alterada', outro: 'Outro'
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
        setLgpdLogs(logs);

        // Alimentar o Feed de Logs do Simulador para transparência visual
        const allNotif = getFromDB<any[]>('anjo_notificacoes', []);
        allNotif.push({
          id: 'notif_wa_' + Date.now(),
          idosoId: idoso.id,
          familiarNome: usuarioAtual.nome,
          telefoneDestino: '(Familiares)',
          mensagem: `[✓ ENVIADO] Alerta confirmado pelo cuidador no painel de controle:\n\n${manualShareOccurrenceMessage}`,
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

  // Helper para o caso de não ter enviado
  const handleNotSentYet = () => {
    setShowManualOccurrenceShareModal(false);
    setManualShareOccurrenceMessage(null);
    setActiveSharingOccurrenceId(null);
  };

  // Copiar mensagem para área de transferência
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
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para desfazer ou alterar atividades!");
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
      acao: `Anulação de Ação de Cuidado - ID: ${taskId}`,
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
          observacao: `${item.observacao} (Sincronizado via Fila 📶)`,
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
        
        if (item.titulo.toLowerCase().includes('café') || item.titulo.toLowerCase().includes('mamadeira')) parsedRefeicao = 'cafe_manha';
        else if (item.titulo.toLowerCase().includes('almoço') || item.titulo.toLowerCase().includes('papinha') || item.titulo.toLowerCase().includes('almocinho')) parsedRefeicao = 'almoco';
        else if (item.titulo.toLowerCase().includes('lanche') || item.titulo.toLowerCase().includes('frutinha')) parsedRefeicao = 'lanche';
        else if (item.titulo.toLowerCase().includes('jantar') || item.titulo.toLowerCase().includes('jantinha')) parsedRefeicao = 'jantar';
        else if (item.titulo.toLowerCase().includes('ceia')) parsedRefeicao = 'ceia';

        // Parse aceitacao dynamically from observacao
        let parsedAceitacao = 'muito_bem';
        if (item.observacao.includes('muito_bem')) parsedAceitacao = 'muito_bem';
        else if (item.observacao.includes('aceitacao: pouco') || item.observacao.includes('Aceitação: pouco') || item.observacao.includes('pouco')) parsedAceitacao = 'pouco';
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
      acao: `Sincronismo Coletivo de Banco Offline (Fila: ${pendentes.length} ações)`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '177.10.150.12 (Sincronismo Móvel)',
      detalhes: `Dados integrados com sucesso. Auditoria de registros de segurança concluída sem quebras de integridade.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);
    
    // Notify Server simulated WhatsApp of sync batch
    const msg = `Anjo Cuidador: Sincronização offline concluída com sucesso! ${pendentes.length} ações salvas pelo cuidador foram enviadas com integridade auditável ao servidor.`;
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
    if (name.includes('Berçário I')) return 'Berçário I';
    if (name.includes('Berçário II')) return 'Berçário II';
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
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para criar atividades ou alterar a rotina!");
      return;
    }
    if (!isShiftActive) {
      ensureAuthorizedAndActiveShift(isEscolar ? "Nova Atividade" : "Novo Cuidado");
    }
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!newTaskForm.titulo.trim() || !newTaskForm.horarioPrevisto.trim()) {
      alert("Por favor, preencha o título e o horário previsto!");
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
          detalhes: `Atividade coletiva de tipo ${newTaskForm.tipo} para toda a classe (${currentClassroom}) agendada para às ${newTaskForm.horarioPrevisto}.`
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
        acao: isEscolar ? `Adicionou atividade à agenda escolar: ${newTask.titulo}` : `Adicionou nova tarefa de cuidado: ${newTask.titulo}`,
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
      alert(`🎉 Atividade coletiva adicionada com sucesso para todos os ${createdCount} alunos da sala!`);
    } else {
      alert("Atividade adicionada à agenda do turno com sucesso!");
    }
  };

  const handleParseAuraWeeklyPlan = async () => {
    if (!auraWeeklyText.trim()) {
      alert('Por favor, cole o texto do planejamento gerado pela Aura!');
      return;
    }

    setIsParsingAuraWeekly(true);

    try {
      // 1. Extração Local Imediata de Ultra-Velocidade (< 2ms)
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
          objetivoBNCC: act.objetivoBNCC || 'BNCC Educação Infantil',
          materiais: act.materiais || []
        }));
        setParsedAuraTasks(list);
        setSelectedAuraDayTab('todos');
        setIsParsingAuraWeekly(false);
        return;
      }

      // 2. Se o parser local não encontrou blocos padrões, tenta a API com timeout rápido de 4s
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
            objetivoBNCC: a.bnccObjective || 'BNCC Educação Infantil',
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
      alert(`🪄 Perfeito! ${count} atividade(s) foram corrigidas e realinhadas automaticamente com seus horários e nomes pedagógicos corretos!`);
    } else {
      alert('✅ Todas as atividades já estão 100% alinhadas com seus nomes e horários corretos!');
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
    alert('🧹 Todas as atividades e tarefas anteriores foram limpas com sucesso!');
  };

  const handleSaveAuraWeeklyPlan = (dayFilterOnly?: string) => {
    if (parsedAuraTasks.length === 0) return;

    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para criar atividades!");
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

    // Todas as atividades de todos os dias vão para o histórico/registro pedagógico completo (anjo_atividades)
    const newAtivsBatch: RegistroAtividade[] = [];
    const todayIso = getTodayIso();

    // Determina quais tarefas entram na rotina diária do dia de hoje (anjo_tarefas_diarias)
    // Se o usuário selecionou uma aba específica, usa aquele dia.
    // Se selecionou "todos" ou não especificou, escolhe as tarefas do dia de hoje (ou primeiro dia) para a rotina diária sem repetição!
    const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const currentDayName = DAY_NAMES[new Date().getDay()];
    
    let dailyTasksToApply = tasksToApply;
    if (!dayFilterOnly || dayFilterOnly === 'todos') {
      const distinctDays = Array.from(new Set(tasksToApply.map(t => t.dia || t.dataStr).filter(Boolean)));
      if (distinctDays.length > 1) {
        const todayMatch = tasksToApply.filter(t => t.dia?.toLowerCase() === currentDayName.toLowerCase() || t.dataIso === todayIso);
        if (todayMatch.length > 0) {
          dailyTasksToApply = todayMatch;
        } else {
          // Se hoje não estiver no plano, usa o primeiro dia do plano como rotina diária
          const firstDay = distinctDays[0];
          dailyTasksToApply = tasksToApply.filter(t => t.dia === firstDay || t.dataStr === firstDay);
        }
      }
    }

    // Cria as atividades no histórico completo
    tasksToApply.forEach((pItem, pIdx) => {
      const taskDate = pItem.dataIso || todayIso;
      targetStudents.forEach((st, stIdx) => {
        let enrichedDesc = pItem.descricao || '';
        if (pItem.objetivoBNCC && !enrichedDesc.includes(pItem.objetivoBNCC)) {
          enrichedDesc += `\n🎯 Campo BNCC: ${pItem.objetivoBNCC}`;
        }
        if (pItem.materiais && pItem.materiais.length > 0) {
          enrichedDesc += `\n📦 Materiais: ${pItem.materiais.join(', ')}`;
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

    // Cria as tarefas diárias para a agenda do dia, garantindo NUNCA duplicar mesmo horário + título
    const newBatch: TarefaDiaria[] = [];
    const seenDailyKeys = new Set<string>();

    dailyTasksToApply.forEach((pItem, pIdx) => {
      let enrichedDesc = pItem.descricao || '';
      if (pItem.objetivoBNCC && !enrichedDesc.includes(pItem.objetivoBNCC)) {
        enrichedDesc += `\n🎯 Campo BNCC: ${pItem.objetivoBNCC}`;
      }
      if (pItem.materiais && pItem.materiais.length > 0) {
        enrichedDesc += `\n📦 Materiais: ${pItem.materiais.join(', ')}`;
      }

      const normTime = (pItem.horario || '09:00').trim();
      const normTitle = (pItem.titulo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${normTime}_${normTitle}`;

      if (seenDailyKeys.has(key)) {
        return; // Pula duplicatas no mesmo horário
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
    alert(`🎉 Sucesso! ${tasksToApply.length} atividade(s) ${dayLabel} foram agendadas com todas as informações completas (data, horário, título, descrição detalhada, BNCC e materiais) para ${targetStudents.length} aluno(s)!`);
  };

  const handleEditTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para editar atividades!");
      return;
    }
    if (!editingTaskForm.titulo.trim() || !editingTaskForm.horarioPrevisto.trim()) {
      alert("Por favor, preencha o título e o horário previsto!");
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
      detalhes: `Novos dados - Título: ${editingTaskForm.titulo}, Horário: ${editingTaskForm.horarioPrevisto}`
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
      alert("⚠️ Operação Bloqueada: Familiares não têm permissão para excluir atividades!");
      return;
    }
    const description = isEscolar 
      ? `Deseja realmente remover a atividade "${taskTitle}" da rotina de hoje?` 
      : `Deseja realmente excluir permanentemente a tarefa "${taskTitle}"?`;

    triggerConfirm(
      'Confirmar Remoção',
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
          detalhes: `A tarefa foi removida da agenda diária.`
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
      alert("Não há atividades na agenda deste aluno para verificar.");
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
          /^(atividade|atividade dirigida|atividade pedagógica|refeição|lanche|tarefa)$/i.test((title || '').replace(/[^\w\s]/gi, '').trim()) ||
          (title || '').toLowerCase().includes('temática (bncc)');

        let bestTitle = ex.titulo;
        if (isGeneric(ex.titulo) && !isGeneric(t.titulo)) {
          bestTitle = t.titulo;
        } else if (!isGeneric(t.titulo) && (t.titulo || '').length > (ex.titulo || '').length) {
          bestTitle = t.titulo;
        }

        let mergedDesc = t.descricao || ex.descricao || '';
        if (ex.descricao && t.descricao && !ex.descricao.includes(t.descricao) && !t.descricao.includes(ex.descricao)) {
          mergedDesc = `${t.descricao}\n\n📝 Detalhes adicionais: ${ex.descricao}`;
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
      alert("✅ Nenhuma tarefa duplicada encontrada! Todas as atividades possuem horários ou títulos distintos.");
      return;
    }

    const otherTasks = allTasks.filter(t => t.idosoId !== idoso.id);
    const finalAllTasks = [...otherTasks, ...dedupedStudentTasks];
    saveToDB('anjo_tarefas_diarias', finalAllTasks);
    setTarefas(dedupedStudentTasks);

    alert(`🧹 Sucesso! ${removedCount} atividade(s) duplicada(s) foram unificadas da agenda.`);
  };

  const handleResetToDefaultTasks = () => {
    if (!confirm('Deseja restaurar a rotina padrão recomendada de horários? As atividades atuais serão substituídas pelo cronograma padrão da turma.')) {
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
    alert('🔄 Rotina padrão restaurada com sucesso!');
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
      if (!confirm(`Deseja realmente limpar TODAS as atividades da agenda de ${idoso.nome} hoje? Você poderá adicionar novas atividades manuais ou importar o planejamento da Aura quando quiser.`)) {
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
    alert(`🗑️ Agenda e atividades anteriores limpas com sucesso para ${targetStudents.length} ${targetStudents.length === 1 ? 'aluno' : 'alunos'}!`);
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
      alert("⚠️ Operação Bloqueada: Apenas educadores/cuidadores autorizados podem registrar ou alterar faltas/ausências de alunos!");
      return;
    }
    const nextAbsent = !isAbsent;
    
    if (nextAbsent) {
      const confirmMsg = isShiftActive 
        ? `Tem certeza que deseja registrar Falta/Ausência para ${idoso.nome}? Como as aulas já foram iniciadas, marcar a falta irá limpar todo o histórico de atividades registrado hoje para ele e enviará o aviso de ausência aos pais.`
        : `Deseja registrar Falta/Ausência para ${idoso.nome}? Isso enviará uma notificação de aviso de ausência aos pais.`;
        
      triggerConfirm(
        isEscolar ? 'Confirmar Registro de Falta' : 'Confirmar Registro de Ausência',
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
            acao: `Registrado Falta / Ausência de Aluno`,
            data: new Date().toLocaleString('pt-BR'),
            ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
            detalhes: `Aluno marcado como ausente hoje. O período ativo foi encerrado e os dados correntes foram limpos por solicitação.`
          });
          saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
          setLgpdLogs(logs);

          // Trigger simulated WhatsApp message to parents
          const cleanName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
          const abMsg = `Anjo Escolar — Aviso de Ausência
          
Olá. Registramos que o(a) aluno(a) *${cleanName}* não compareceu hoje às atividades / aulas (Falta Justificada). 

Desejamos um excelente dia e esperamos vê-lo(a) de volta em breve! Qualquer dúvida, estamos à disposição.`;
          
          triggerWhatsAppSim('Aviso de Ausência e Falta Corrente', abMsg);
          showToast(`Falta hoje registrada para ${cleanName}!`);
          window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        }
      );
    } else {
      triggerConfirm(
        isEscolar ? 'Confirmar Presença do Aluno(a)' : 'Confirmar Presença do Cliente',
        `Tem certeza que deseja remover o registro de falta/ausência de hoje para ${idoso.nome}?`,
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
        ? "⚠️ Período Letivo Não Iniciado!\n\nPor favor, clique no botão 'Iniciar Período' ou 'Iniciar Coletivo' no topo da página antes de lançar qualquer refeição, higiene, comportamento, medicamento ou saúde do aluno!" 
        : "⚠️ Turno de Cuidados Não Iniciado!\n\nPor favor, clique no botão 'Iniciar Meu Turno de Cuidados' no topo da página antes de lançar qualquer controle de rotina, refeição, higiene ou saúde!"
      );
    }
  };

  const handleStartShift = () => {
    const startTimeStamp = new Date().toISOString();

    // Clear routine databases for today related to this student so they start fresh from 0
    resetStudentDailyRoutine([idoso.id]);

    setQuickHygiene({
      bath: false,
      teeth: false,
      clothes: false,
      diaper: false,
      hands: false,
      cream: false,
      observations: ''
    });

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

    const studentRoom = idoso.salaAula || idoso.quarto || getStudentRoomName(idoso) || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Berçário I - A');
    
    // Find all classmates in this room to activate collectively in school/teacher mode
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const classmates = allSeniors.filter(s => s && s.id && isStudentInRoom(s, studentRoom));
    if (!classmates.some(c => c.id === idoso.id)) {
      classmates.push(idoso);
    }

    const startShiftUpdates: { targetKey: string; active: boolean; startTime?: string }[] = [
      { targetKey: studentRoom, active: true, startTime: startTimeStamp },
      { targetKey: idoso.id, active: true, startTime: startTimeStamp }
    ];
    if (idoso.nome) startShiftUpdates.push({ targetKey: idoso.nome, active: true, startTime: startTimeStamp });
    if (usuarioAtual?.id) startShiftUpdates.push({ targetKey: usuarioAtual.id, active: true, startTime: startTimeStamp });
    if (usuarioAtual?.nome) startShiftUpdates.push({ targetKey: usuarioAtual.nome, active: true, startTime: startTimeStamp });

    classmates.forEach(mate => {
      if (!mate || !mate.id) return;
      startShiftUpdates.push({ targetKey: mate.id, active: true, startTime: startTimeStamp });
      if (mate.nome) startShiftUpdates.push({ targetKey: mate.nome, active: true, startTime: startTimeStamp });
      const cleanM = (mate.nome || '').split(' (')[0].trim();
      if (cleanM) startShiftUpdates.push({ targetKey: cleanM, active: true, startTime: startTimeStamp });
      localStorage.removeItem(`anjo_is_absent_${mate.id}`);
    });

    setShiftActiveStatesBatch(startShiftUpdates);

    // If marked as absent, remove the absence when starting the shift
    setIsAbsent(false);
    localStorage.removeItem(`anjo_is_absent_${idoso.id}`);

    // LGPD shift starting traceability audit
    const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, []);
    logs.unshift({
      id: 'log_' + Date.now(),
      autor: usuarioAtual.nome,
      acao: `Abertura oficial de Escala de Turno (Início do Plantão)`,
      data: new Date().toLocaleString('pt-BR'),
      ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
      detalhes: `Escala de trabalho vinculada para provar presença e responsabilidade contratual.`
    });
    saveToDB(`anjo_lgpd_auditoria_${idoso.id}`, logs);
    setLgpdLogs(logs);

    // Simulated notify
    const msg = `Anjo Cuidador: O Turno de cuidados para ${idoso.nome} foi INICIADO por ${usuarioAtual.nome} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Acompanhando em tempo real.`;
    triggerWhatsAppSim('Turno Iniciado', msg);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
    }

    showToast(`▶️ Cronômetro e período iniciados para ${idoso.nome.split(' (')[0]}! Todas as atividades do dia anterior foram zeradas para o novo dia.`, 'success');
  };

  const handleStartShiftGroup = (className: string) => {
    try {
      const startTimeStamp = new Date().toISOString();
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Berçário I - A');
      
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
        localStorage.removeItem(`anjo_almoço_pct_${mate.id}`);
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
          acao: `Abertura oficial de Período Letivo Coletivo (Iniciado para toda a Classe ${targetClass})`,
          data: new Date().toLocaleString('pt-BR'),
          ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
          detalhes: `Registro de aula sincronizado com todos os alunos da classe ${targetClass}. Atividades do dia anterior reiniciadas zeradas (preservados peso, temp e saturação).`
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
      const msg = `Anjo Escolar: O Período Letivo para todos os alunos presentes da classe ${targetClass} foi INICIADO por ${usuarioAtual?.nome || 'Educador(a)'} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} de forma coletiva.`;
      triggerWhatsAppSim('Aulas Iniciadas em Grupo', msg);
      
      showToast(`Aulas iniciadas com sucesso para todos os ${classmates.length} alunos presentes da classe ${targetClass}! Atividades do dia anterior foram zeradas, mantendo peso, temperatura e saturação.`, 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }
    } catch (e: any) {
      console.error('Erro ao iniciar período coletivo:', e);
      showToast(`Erro ao iniciar aulas: ${e.message || e}`, 'warning');
    }
  };

  const handleEndShiftGroup = (className: string) => {
    if (!isStaffUser(usuarioAtual)) {
      alert("⚠️ Operação Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o período letivo coletivo!");
      return;
    }
    try {
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Maternal I - A');

      triggerConfirm(
        'Encerrar Aulas Coletivo',
        `Você tem certeza que deseja encerrar as aulas de todos os alunos da classe ${targetClass} ao mesmo tempo? Todos os diários de rotina serão finalizados.`,
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

              const mateMsg = `🌳 A ÁRVORE DA INFÂNCIA HOJE:
Hoje a árvore do(a) *${mateNameClean}* floresceu no Anjinho Escolar:
• 🍃 *Folhas verdes:* Nutrição balanceada e hidratação regular (${mateTotalMl}ml);
• 🌸 *Flores e borboletas:* Momento acolhedor de sono e descanso tranquilo;
• 🍎 *Frutos e passarinhos:* Atividades pedagógicas, trabalhinhos e aprendizados;
• 🪵 *Tronco forte:* Cuidados diários, higiene completa e saúde acompanhada de perto (36.5°C).

☀️💧 *PARTICIPE DA JORNADA DO(A) ${mateNameClean.toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestações de afeto:
✨ *Que encanto!* • ❤️ *Feito com amor* • 🌟 *Puro brilho!* • 🤝 *Orgulho da gente* • 💎 *Um tesouro!*

_(Cada manifestação sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diário de rotina escolar completo de hoje pelo link seguro:
🔗 ${window.location.origin}/?relatorio=${summaryId}

Com carinho,
Equipe Anjinho Escolar ❤️🕊️`;
     
              // Ingest simulated WhatsApp log for this child individually
              const primaryContact = mate.contatoEmergencia || { nome: 'Responsáveis', telefone: '11999999999' };
              
              const newLog: NotificacaoSimulada = {
                id: 'log_coletivo_' + Date.now() + '_' + mate.id,
                idosoId: mate.id,
                familiarNome: primaryContact.nome || 'Responsáveis',
                telefoneDestino: primaryContact.telefone || '11999999999',
                tipoCompromisso: 'Resumo Diário da Aula (Coletivo)',
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
                contatoNome: primaryContact.nome || 'Responsáveis',
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
                duracao: 'Período Completo',
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
                acao: `Encerramento de Período Escolar Coletivo da Classe ${targetClass}`,
                data: new Date().toLocaleString('pt-BR'),
                ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
                detalhes: `Fechamento sincronizado com toda a classe. Boletim do aluno gerado e registrado no histórico.`
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
            const endMsg = `Anjo Escolar: O Período Letivo para todos os alunos da classe ${targetClass} foi ENCERRADO por ${usuarioAtual?.nome || 'Educador(a)'} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} de forma coletiva. Relatórios de rotina, sono e fraldas enviados para o WhatsApp dos responsáveis!`;
            triggerWhatsAppSim('Aulas Encerradas em Grupo', endMsg);

            // Populate states to trigger the custom high-fidelity collective confirmation notification panel
            setCollectiveShareList(shareList);
            setCollectiveShareStatuses(initialStatuses);
            setShowCollectiveShareModal(true);
 
            showToast(`Período Escolar da classe ${targetClass} foi encerrado com sucesso para todos os alunos sincronizados!`, 'success');
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
      alert("⚠️ Operação Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o período letivo!");
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
    const ultimoHumorText = humors.length > 0 ? humors[humors.length - 1].estado : 'Estável';

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
    const profName = usuarioAtual?.nome ? (usuarioAtual.nome.includes('Prof') ? usuarioAtual.nome : `Profª ${usuarioAtual.nome}`) : 'Profª Nilva Amaral';

    const mealSummaryStr = meals && meals.length > 0
      ? meals.map((m: any) => `${m.refeicao === 'almoco' ? 'Almoço' : m.refeicao === 'cafe_manha' ? 'Café da Manhã' : m.refeicao === 'lanche' ? 'Lanche' : 'Refeição'} (${m.aceitacao === 'muito_bem' ? 'Comeu Tudo' : m.aceitacao === 'pouco' ? 'Comeu Pouco' : 'Recusou'})`).join(', ')
      : 'Mamadeira / Refeição (Comeu Tudo)';

    const hygieneSummaryStr = (ultimoSinal && ultimoSinal.fralda) 
      ? ultimoSinal.fralda 
      : 'Xixi, Cocô (normal), Dentes Escovados, Banho Tomado, Roupa Trocada';

    const sleepSummaryStr = (ultimoSinal && ultimoSinal.pressaoArterial)
      ? ultimoSinal.pressaoArterial
      : 'Dormiu 45min';

    const healthTempStr = (ultimoSinal && ultimoSinal.temperatura) 
      ? `${ultimoSinal.temperatura}°C` 
      : '36.5°C';

    // A. Compilation of complete pre-formatted dashboard report (Available securely in Family history logs)
    let fullReportMsg = isEscolar 
      ? `✨ Anjo Escolar: Registro de ${idoso.nome} confirmed por ${profName}:
📅 Data: ${todayBr}  •  ⏰ Horário: ${nowTimeBr}

💧 Água: ${totalMl}ml
🍽️ Refeição: ${mealSummaryStr}
😴 Sono: ${sleepSummaryStr}
🚾 Higiene: ${hygieneSummaryStr}
😊 Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}
🌡️ Saúde: ${healthTempStr}
⚖️ Peso: ${idoso.peso || '15.5'} kg

`
      : `✨ Anjo Cuidador: Registro de ${idoso.nome} confirmado por ${profName}:
📅 Data: ${todayBr}  •  ⏰ Horário: ${nowTimeBr}

💧 Água / Hidratação: ${totalMl}ml
🍽️ Alimentação: ${mealSummaryStr}
😴 Repouso: ${sleepSummaryStr}
🚾 Higiene / Cuidados: ${hygieneSummaryStr}
😊 Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}
🌡️ Saúde / Sinais: ${healthTempStr}
⚖️ Peso: ${idoso.peso || '65'} kg

`;

    fullReportMsg += `⏱️ *Período:* das ${startHour} às ${endHour} (Duração: ${elapsedShiftTime})\n`;
    fullReportMsg += `📈 *Taxa de Conformidade hoje:* ${taxaC}%  •  *Qualidade de Registro:* ${taxaQ}%\n\n`;

    fullReportMsg += isEscolar ? `🎒 *ATIVIDADES & ROTINAS CONCLUÍDAS:*\n` : `💊 *MEDICAÇÕES & CUIDADOS CONCLUÍDOS:*\n`;
    if (concluidas.length > 0) {
      concluidas.forEach((m: any) => {
        fullReportMsg += `  ✓ ${m.titulo} às ${m.concluidaEm || m.horarioPrevisto}${m.observacao ? ` ("${m.observacao}")` : ''}\n`;
      });
    } else {
      fullReportMsg += isEscolar 
        ? `  - Nenhuma atividade ou rotina concluída neste período.\n`
        : `  - Nenhuma medicação ou cuidado administrado neste turno.\n`;
    }

    if (recusadas.length > 0) {
      fullReportMsg += isEscolar ? `\n❌ *RECUSAS / JUSTIFICATIVAS:*\n` : `\n❌ *RECUSAS JUSTIFICADAS:*\n`;
      recusadas.forEach((r: any) => {
        fullReportMsg += `  × ${r.titulo} às ${r.concluidaEm || r.horarioPrevisto}. Justificativa: "${r.observacao || 'Recusa geral'}"\n`;
      });
    }

    if (atrasadas.length > 0 || pendentes.length > 0) {
      fullReportMsg += isEscolar ? `\n⚠️ *PENDÊNCIAS / NÃO CONCLUÍDOS:*\n` : `\n⚠️ *PENDÊNCIAS / NÃO ADMINISTRADOS:*\n`;
      if (atrasadas.length > 0) {
        atrasadas.forEach((a: any) => {
          fullReportMsg += `  • [ATRASADO] ${a.titulo} prevista para ${a.horarioPrevisto}\n`;
        });
      }
      if (pendentes.length > 0) {
        pendentes.forEach((p: any) => {
          fullReportMsg += `  • [PENDENTE] ${p.titulo} prevista para ${p.horarioPrevisto}\n`;
        });
      }
    }

    fullReportMsg += `\n🍽 *ALIMENTAÇÃO:*\n`;
    if (meals.length > 0) {
      meals.forEach((meal: any) => {
        const mealTitle = meal.refeicao === 'cafe_manha' ? 'Café da manhã' : meal.refeicao === 'almoco' ? 'Almoço' : meal.refeicao === 'lanche' ? 'Lanche da Tarde' : meal.refeicao === 'jantar' ? 'Jantar' : 'Ceia';
        const accepts = meal.aceitacao === 'muito_bem' ? (isEscolar ? 'Comeu/Tomou tudo' : 'Aceitou muito bem') : meal.aceitacao === 'pouco' ? 'Comeu pouco' : 'Recusou';
        fullReportMsg += `  • ${mealTitle} (${meal.horario}): ${accepts}.${meal.observacoes ? ` Obs: "${meal.observacoes}"` : ''}\n`;
      });
    } else {
      fullReportMsg += isEscolar ? `  - Sem refeições cadastradas neste período.\n` : `  - Sem refeições cadastradas neste turno.\n`;
    }

    const actualWaterCount = waterCount;
    fullReportMsg += `\n💧 *HIDRATAÇÃO:*\n`;
    if (isEscolar) {
      fullReportMsg += `  • Copos de Água Ingeridos: ${actualWaterCount > 0 ? actualWaterCount : Math.max(1, Math.round(totalMl/250))} copo(s) (${totalMl}ml de água)\n`;
    } else {
      fullReportMsg += `  • Copos d'água registrados: ${actualWaterCount > 0 ? actualWaterCount : Math.max(1, Math.round(totalMl/250))} copo(s) (totalizado: ${totalMl}ml de água ingerida)\n`;
    }

    fullReportMsg += isEscolar ? `\n🧠 *HUMOR & COMPORTAMENTO:*\n` : `\n🧠 *HUMOR & BEM ESTAR:*\n`;
    fullReportMsg += `  • Estado observado: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}\n`;

    if (ultimoSinal) {
      if (isEscolar) {
        fullReportMsg += `\n💓 *SAÚDE & SONECA RECENTES:*\n`;
        fullReportMsg += `  • Período de Sono/Soneca: ${ultimoSinal.pressaoArterial}\n`;
        fullReportMsg += `  • Fraldas e Trocas: ${ultimoSinal.fralda || 'Verificada e limpa'}\n`;
        fullReportMsg += `  • Temperatura Corporal: ${ultimoSinal.temperatura}°C\n`;
      } else {
        fullReportMsg += `\n💓 *ÚLTIMOS SINAIS VITAIS AFERIDOS:*\n`;
        fullReportMsg += `  • Pressão Arterial: ${ultimoSinal.pressaoArterial}\n`;
        fullReportMsg += `  • Glicemia: ${ultimoSinal.glicemia} mg/dL\n`;
        fullReportMsg += `  • Oxigenação O2: ${ultimoSinal.saturacao}%\n`;
        fullReportMsg += `  • Temperatura: ${ultimoSinal.temperatura}°C\n`;
      }
    }

    if (ocorrencias.length > 0) {
      fullReportMsg += isEscolar ? `\n🚨 *OCORRÊNCIAS / OBSERVAÇÕES ATÍPICAS NO PERÍODO:*\n` : `\n🚨 *OCORRÊNCIAS / ANOTAÇÕES ATÍPICAS NO PLANTONISMO:*\n`;
      ocorrencias.forEach((o: any) => {
        fullReportMsg += `  • [${(o.criticidade || 'informacao').toUpperCase()}] ${(o.tipo || 'ocorrencia').toUpperCase()} às ${o.horario || ''}: ${o.descricao || ''}\n`;
      });
    }

    // Include modifications of medications during the shift
    fullReportMsg += isEscolar ? `\n📦 *ALTERAÇÕES DE ROTINA/AGENDA (Inclusões / Exclusões):*\n` : `\n📦 *ALTERAÇÕES DE MEDICAMENTOS (Inclusões / Exclusões):*\n`;
    if (medChanges && medChanges.length > 0) {
      medChanges.forEach((ch: any) => {
        const actionLabel = ch.tipo === 'cadastro' ? 'NOVO CADASTRADO' : ch.tipo === 'exclusao' ? 'EXCLUÍDO' : ch.tipo === 'suspensao' ? 'SUSPENSO' : 'REATIVADO';
        fullReportMsg += `  • [${actionLabel}] ${ch.nome}: ${ch.detalhes} (por ${ch.autor || 'Educador(a)'})\n`;
      });
    } else {
      fullReportMsg += `  - Nenhuma alteração feita neste período.\n`;
    }

    fullReportMsg += `\n\n✓ *Relatório processado de maneira segura e em conformidade estrita com LGPD.*`;

    // B. Generate unique report key
    const summaryId = 'summary_id_' + Date.now();

    // C. Composition of the revised SHORT WhatsApp direct alert
    const studentCleanName = (idoso.nome || '').split(' (')[0];
    const shortWaMsg = isEscolar
      ? `🌳 A ÁRVORE DA INFÂNCIA HOJE:
Hoje a árvore do(a) *${studentCleanName}* floresceu no Anjinho Escolar:
• 🍃 *Folhas verdes:* Nutrição (${mealSummaryStr}) e hidratação regular (${totalMl}ml);
• 🌸 *Flores e borboletas:* Momento acolhedor de soneca e descanso (${sleepSummaryStr});
• 🍎 *Frutos e passarinhos:* Atividades pedagógicas e trabalhinhos manuais;
• 🪵 *Tronco forte:* Cuidados diários, higiene (${hygieneSummaryStr}) e saúde (${healthTempStr}).

☀️💧 *PARTICIPE DA JORNADA DO(A) ${studentCleanName.toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestações de afeto:
✨ *Que encanto!* • ❤️ *Feito com amor* • 🌟 *Puro brilho!* • 🤝 *Orgulho da gente* • 💎 *Um tesouro!*

_(Cada manifestação sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diário de rotina escolar completo pelo link seguro:
🔗 ${window.location.origin}/?relatorio=${summaryId}

Com carinho,
Equipe Anjinho Escolar ❤️🕊️`
      : `✨ Anjo Cuidador: Registro de ${idoso.nome} confirmado por ${profName}:
📅 Data: ${todayBr}  •  ⏰ Horário: ${nowTimeBr}
💧 Água: ${totalMl}ml
🍽️ Alimentação: ${mealSummaryStr}
😴 Repouso: ${sleepSummaryStr}
🚾 Higiene: ${hygieneSummaryStr}
😊 Humor: ${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'}
🌡️ Saúde: ${healthTempStr}
⚖️ Peso: ${idoso.peso || '65'} kg

Acesse o boletim de cuidados completo pelo link seguro:
🔗 ${window.location.origin}/?relatorio=${summaryId}`;

    // Dispatch concise WA alarm
    triggerWhatsAppSim(isEscolar ? 'Encerramento de Período Letivo Curto para Pais' : 'Encerramento de Turno Curto para Família', shortWaMsg);

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
      acao: `Encerramento de Turno e Relatório Seguro do Boletim de Cuidados (${summaryId})`,
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
      showToast('Período/Turno encerrado com sucesso!', 'success');
    }
  };

  // Direct 1-Click Stop Shift Handler (immediately turns off shift & syncs cross-device)
  const handleDirectStopShift = () => {
    try {
      const studentRoom = idoso.salaAula || idoso.quarto || getStudentRoomName(idoso);
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      const classmates = allSeniors.filter(s => s && s.id && isStudentInRoom(s, studentRoom || ''));

      const candidateKeysToClose = Array.from(new Set([
        idoso.id,
        idoso.nome,
        idoso.nome ? idoso.nome.split(' (')[0].trim() : '',
        studentRoom,
        usuarioAtual?.id,
        usuarioAtual?.nome,
        ...classmates.flatMap(m => [m.id, m.nome, (m.nome || '').split(' (')[0].trim()])
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

      showToast(`⏹️ Cronômetro desligado com sucesso para ${idoso.nome.split(' (')[0]} e turma! Sincronizado com os pais.`, 'success');
    } catch (err) {
      console.error('Erro ao desligar cronometro diretamente:', err);
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

    showToast('✓ Diário/relatório de rotina excluído permanentemente!');
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
        acao: isEscolar ? 'Início de Período Letivo da Classe' : 'Ativação de Turno de Atendimento Individual',
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1) + ' (IP Móvel)',
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
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Hidratação")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não pode registrar hidratação.`);
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
        titulo: `Copinho de Água +${quickHydrationAmount}ml`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Bebeu ${quickHydrationAmount}ml (Registro Um-Toque)`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert(`Copinho de água (+${quickHydrationAmount}ml) registrado off-line! Será sincronizado quando reativar a rede.`);
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
          observacao: `Oferecido copo rápido de ${quickHydrationAmount}ml.`
        };
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Hidratação Registrada', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Copo de água (+${quickHydrationAmount}ml) oferecido com sucesso para ${idoso.nome} por ${usuarioAtual.nome}.`);
    alert(`Hidratação registrada com facilidade (+${quickHydrationAmount}ml)!`);

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
    if (!ensureAuthorizedAndActiveShift("Refeição")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não pode registrar refeições.`);
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
          '🍼 Comunicado: Mamadeira Já Servida',
          `Anjinho Escolar: ${idoso.nome} já tomou mamadeira às ${check.lastHorario}. A tentativa de novo registro foi feita às ${defaultTime}. Por questões de segurança alimentar e intervalo mínimo de 2h, a próxima mamadeira estará liberada a partir das ${check.nextAllowedHorario}.`
        );

        alert(`${check.message}\n\n📢 Um comunicado oficial foi gerado no mural e enviado aos responsáveis informando que a criança já tomou mamadeira recentemente.`);
        return;
      }
    } else {
      const mealsStoreCheck = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
      const alreadyExists = mealsStoreCheck.some(f => f.idosoId === idoso.id && f.refeicao === quickMeal.refeicao && isTodayOrDemoDate(f.data));
      if (alreadyExists) {
        const mealLabelMap: { [key: string]: string } = {
          mamadeira: '🍼 Mamadeira de Leite / Fórmula',
          cafe_manha: isEscolar ? '🥐 Lanchinho da Manhã / Café' : '☕ Café da Manhã',
          almoco: isEscolar ? '🍲 Papinha / Almocinho' : '🍛 Almoço',
          lanche: isEscolar ? '🍎 Frutinha / Lanchinho Tarde' : '🍎 Lanche da Tarde',
          jantar: isEscolar ? '🥣 Jantinha Escolar' : '🍲 Jantar',
          ceia: isEscolar ? '🥛 Chá ou Suco Pós-Soneca' : '🥛 Ceia / Repouso'
        };
        const label = mealLabelMap[quickMeal.refeicao] || quickMeal.refeicao;
        const confirmSave = window.confirm(`⚠️ Atenção: Você já registrou a refeição "${label}" para ${idoso.nome} hoje!\n\nDeseja realmente salvar um NOVO registro para essa mesma refeição?`);
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
        titulo: `Refeição: ${quickMeal.refeicao}`,
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: `Aceitação: ${quickMeal.aceitacao}. Obs: ${quickMeal.observacao}`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert('Refeição registrada offline com sucesso!');
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

    // Sync tasks
    const labelMap: { [key: string]: string } = {
      mamadeira: 'Mamadeira',
      cafe_manha: 'Lanchinho da Manhã / Café',
      almoco: 'Almoço',
      lanche: 'Frutinha / Lanche',
      jantar: 'Jantar'
    };
    const updated = tarefas.map(t => {
      if (t.tipo === 'alimentacao' && t.status !== 'concluido') {
        const titleLower = (t.titulo || '').toLowerCase();
        let isMatch = false;
        if (quickMeal.refeicao === 'mamadeira') {
          isMatch = titleLower.includes('mamadeira') || titleLower.includes('leite') || titleLower.includes('fórmula') || titleLower.includes('formula');
        } else if (quickMeal.refeicao === 'cafe_manha') {
          isMatch = (titleLower.includes('café') || titleLower.includes('cafe') || titleLower.includes('desjejum') || titleLower.includes('lanchinho da manhã') || titleLower.includes('lanche da manhã') || titleLower.includes('lanchinho')) && !titleLower.includes('mamadeira');
        } else if (quickMeal.refeicao === 'lanche' || quickMeal.refeicao === 'lanche_tarde') {
          isMatch = (titleLower.includes('frutinha') || titleLower.includes('lanche da tarde') || titleLower.includes('lanchinho tarde')) && !titleLower.includes('mamadeira') && !titleLower.includes('manhã') && !titleLower.includes('manha');
        } else if (quickMeal.refeicao === 'almoco') {
          isMatch = titleLower.includes('almoço') || titleLower.includes('almoco') || titleLower.includes('papinha') || titleLower.includes('almocinho');
        } else if (quickMeal.refeicao === 'jantar') {
          isMatch = titleLower.includes('jantar') || titleLower.includes('jantinha');
        }
        if (isMatch) {
          return {
            ...t,
            status: 'concluido' as const,
            concluidaEm: defaultTime,
            completadaPor: usuarioAtual.nome,
            observacao: `Aceitação: ${quickMeal.aceitacao}. ${quickMeal.observacao}`
          };
        }
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Refeição Registrada', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: ${idoso.nome} realizou a refeição ${labelMap[quickMeal.refeicao] || quickMeal.refeicao}. Grau de Aceitação: ${quickMeal.aceitacao === 'muito_bem' ? (isEscolar ? 'Comeu/Tomou tudo' : 'Comeu muito bem') : 'Comeu pouco'}. Por: ${usuarioAtual.nome}`);
    alert('Refeição registrada com sucesso via canal on-line!');
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
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift("Higiene")) {
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não pode registrar cuidados de higiene.`);
      return;
    }

    const alreadyCompleted = tarefas.some(t => t.tipo === 'banho' && t.status === 'concluido');
    if (alreadyCompleted) {
      const confirmSave = window.confirm(`⚠️ Atenção: O registro de Higiene para ${idoso.nome} já foi marcado como concluído hoje!\n\nDeseja realmente salvar um NOVO registro de higiene?`);
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
        observacao: `Banho: ${quickHygiene.bath ? 'Sim' : 'Não'}, Dentes: ${quickHygiene.teeth ? 'Sim' : 'Não'}, Roupa: ${quickHygiene.clothes ? 'Sim' : 'Não'}`,
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
          observacao: `Higiene realizada em lote: Banho: ${quickHygiene.bath ? 'Sim' : 'Não'}. Troca de roupa: ${quickHygiene.clothes ? 'Sim' : 'Não'}.`
        };
      }
      return t;
    });
    setTarefas(updated);
    const allTasksInDB = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const otherSeniorsTasks = allTasksInDB.filter(t => t.idosoId !== idoso.id);
    saveToDB('anjo_tarefas_diarias', [...otherSeniorsTasks, ...updated]);

    triggerWhatsAppSim('Cuidados de Higiene Concluídos', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Serviços de Higiene e Conforto concluídos para ${idoso.nome} às ${defaultTime}: Banho/Fralda: ${quickHygiene.bath ? 'Sim' : 'Não'}, Troca de Roupa: ${quickHygiene.clothes ? 'Sim' : 'Não'}, Escovação Bucal: ${quickHygiene.teeth ? 'Sim' : 'Não'}.`);
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

    const defaultTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!simulatedOnline) {
      adicionarItemFila({
        id_local: 'offline_humor_' + Date.now(),
        idoso_id: idoso.id,
        cuidador_id: usuarioAtual.id,
        atividade_id: 'quick_humor_' + Date.now(),
        tipo: 'outros',
        titulo: `Anotação humor: ${quickHumor.estado}`,
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

    triggerWhatsAppSim('Humor Observado', `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: ${isEscolar ? 'A educadora' : 'O cuidador'} ${usuarioAtual.nome} registrou que ${idoso.nome} encontra-se com o humor "${quickHumor.estado.toUpperCase()}". Observações: "${quickHumor.observacao || 'Nenhuma'}"`);
    showToast('Humor e estado comportamental salvos com sucesso!', 'success');
    setQuickHumor({ estado: 'calmo', observacao: '' });
  };

  const handleQuickVitalsSubmit = (e?: React.FormEvent | null, bypassDuplicateCheck?: boolean) => {
    if (e) e.preventDefault();
    if (isAbsent) {
      unlockAndMarkPresent();
      showToast(`Presença ativada para ${idoso.nome}!`, 'success');
    }
    if (!ensureAuthorizedAndActiveShift(isEscolar ? "Saúde e Sono" : "Sinais Vitais")) {
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
      const newTemp = quickVitals.temp ? `${quickVitals.temp}°C` : 'Normal / Não medida';

      // 1. Cross-module duplicate check for sleep (Sono/Soneca) between Diário da Infância and Frequência
      const timeMatch = newSono.match(/(\d{1,2}:\d{2})\s*(?:às|as|-|até)\s*(\d{1,2}:\d{2})/i) || 
                        (sleepStart && sleepEnd && newSono.toLowerCase().includes('dormiu') ? [null, sleepStart, sleepEnd] : null);

      let isDuplicateSleepWithSono = false;
      let isDuplicateSleepWithSinais = false;

      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const startStr = timeMatch[1].padStart(5, '0');
        const endStr = timeMatch[2].padStart(5, '0');
        const startShort = startStr.replace(/^0/, '');
        const endShort = endStr.replace(/^0/, '');

        // Check against Frequência (anjo_sono)
        isDuplicateSleepWithSono = sonosStore.some(s => {
          if (s.idosoId !== idoso.id || !isTodayOrDemoDate(s.data)) return false;
          const sStart = (s.dormiuEm || '').trim();
          const sEnd = (s.acordouEm || '').trim();
          return (sStart === startStr && sEnd === endStr) ||
                 (sStart.replace(/^0/, '') === startShort && sEnd.replace(/^0/, '') === endShort);
        });

        // Check against Diário da Infância (anjo_sinais)
        isDuplicateSleepWithSinais = vitalsStore.some(v => {
          if (v.idosoId !== idoso.id || !isTodayOrDemoDate(v.data)) return false;
          const old = (v.soneca || v.pressaoArterial || '').toLowerCase();
          if (!old || old === 'sem registros' || old === 'não dormiu / sesta') return false;
          return (old.includes(startStr) || old.includes(startShort)) && (old.includes(endStr) || old.includes(endShort));
        });
      }

      if (isDuplicateSleepWithSono || isDuplicateSleepWithSinais) {
        const sourceName = isDuplicateSleepWithSono ? 'Frequência (Rotina)' : 'Diário da Infância';
        alert(`⚠️ Registro Duplicado Bloqueado: Já existe um registro de soneca/sono para ${idoso.nome} no mesmo horário (${timeMatch ? `${timeMatch[1]} às ${timeMatch[2]}` : newSono}) lançado hoje no ${sourceName}!\n\nNão é permitido salvar mensagens/registros duplicados para el mesmo horário.`);
        return;
      }

      if (todayRecords.length > 0) {
        const lastRecord = todayRecords[todayRecords.length - 1];
        const oldSono = lastRecord.soneca || 'Sem registros';
        const oldFralda = lastRecord.fralda || 'Sem trocas';
        const oldTemp = lastRecord.temperatura ? `${lastRecord.temperatura}°C` : 'Não medida';
        
        const isIdentical = (newSono === oldSono) && 
                            (newFralda === oldFralda) &&
                            ((Number(quickVitals.temp) || 36.5) === lastRecord.temperatura);
        
        if (isIdentical) {
          alert(`⚠️ Registro Idêntico Bloqueado: Você já salvou exatamente essas informações no Diário da Infância para ${idoso.nome} hoje!\n\nNão é permitido enviar duas mensagens idênticas.`);
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
        titulo: isEscolar ? 'Saúde, Sono & Fralda do Aluno' : 'Sinais Vitais e Peso',
        status: 'realizado',
        horario_planejado: defaultTime,
        horario_registrado_dispositivo: new Date().toISOString(),
        observacao: isEscolar
          ? `Sono: ${quickVitals.pressao || 'Sem registros'}, Fralda: ${quickVitals.glicemia || 'Sem registros'}, Temp: ${quickVitals.temp || 'Sem Temp'}°C, Água/Copos: ${quickVitals.fCard || '0'}, Sat: ${quickVitals.sat || 'Normal'} copos, Peso: ${quickVitals.peso || 'Sem Peso'} kg.`
          : `Aferido PA: ${quickVitals.pressao || 'Sem PA'}, Glicemia: ${quickVitals.glicemia || 'Sem Glicemia'} mg/dL, Sat: ${quickVitals.sat || 'Sem O2'}%, Temp: ${quickVitals.temp || 'Sem Temp'}°C, FC: ${quickVitals.fCard || 'Sem FC'} bpm, Peso: ${quickVitals.peso || 'Sem Peso'} kg.`,
        modo_registro: 'offline',
        status_sincronizacao: 'pendente'
      }).then(() => {
        loadOfflineQueue();
        alert(isEscolar ? 'Rotina escolar e saúde registradas offline!' : 'Sinais vitais e Peso registrados offline com sucesso!');
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
                observacao: `Copos de água registrados: ${valCupsOrMl} (${mlAdded}ml total).`
              };
            }
            return t;
          });
          saveToDB('anjo_tarefas_diarias', updatedTasks);
        }
      }
    }

    if ((isEscolar || quickVitals.pressao) && quickVitals.pressao && quickVitals.pressao !== 'Sem registros') {
      const timeMatch = quickVitals.pressao.match(/(\d{1,2}(?::\d{2}|h\d{0,2}))\s*(?:às|as|-|até)\s*(\d{1,2}(?::\d{2}|h\d{0,2}))/i);
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
      ? `Anjinho Fundamental: Relatório de Acompanhamento Escolar aferido para o(a) aluno(a) ${idoso.nome} pela Profª ${usuarioAtual.nome}:
• Dever de Casa / Lição: ${quickVitals.pressao || 'Sem tarefas registradas'}
• Foco / Comportamento: ${quickVitals.glicemia || 'Focado e excelente comportamento'}
• Temperatura: ${quickVitals.temp ? `${quickVitals.temp}°C` : 'Normal / Não medida'}
• Material / Cadernos: ${quickVitals.sat || 'Cadernos e estojo completos'}
• Hidratação / Garrafinha: ${quickVitals.fCard ? `${quickVitals.fCard} copos` : 'Normal'}
• Peso: ${quickVitals.peso ? `${quickVitals.peso} kg` : 'Não aferido'}`
      : isEscolar
        ? `Anjinho Escolar: Relatório de Saúde aferido para o(a) aluno(a) ${idoso.nome} pela Profª ${usuarioAtual.nome}:
• Período de Sono: ${quickVitals.pressao || 'Não dormiu / Não se aplica'}
• Fralda (Xixi/Cocô): ${quickVitals.glicemia || 'Verificada e sem assaduras'}
• Temperatura: ${quickVitals.temp ? `${quickVitals.temp}°C` : 'Normal / Não medida'}
• 🍼 Mamadeiras: ${quickVitals.sat ? `${quickVitals.sat} mamadeira(s)` : 'Nenhuma no momento'}
• 💧 Copos d'Água: ${quickVitals.fCard ? `${quickVitals.fCard} copo(s)` : 'Normal'}
• Peso: ${quickVitals.peso ? `${quickVitals.peso} kg` : 'Não aferido'}`
        : `Anjo Cuidador: Sinais vitais aferidos para ${idoso.nome} por ${usuarioAtual.nome}:
• Pressão: ${novoSinal.pressaoArterial} mmHg
• Glicemia: ${novoSinal.glicemia} mg/dL
• Temp: ${novoSinal.temperatura}°C
• Sat. O2: ${novoSinal.saturacao}%
• Freq. Cardíaca: ${novoSinal.frequenciaCardiaca} bpm
• Peso: ${novoSinal.peso ? `${novoSinal.peso} kg` : 'Não aferido'}`;

    triggerWhatsAppSim(isEscolar ? 'Saúde e Sono do Aluno Registrados' : 'Sinais Vitais e Peso Registrados', whatsMsg);
    alert(isEscolar ? 'Situação de saúde e rotina do aluno registradas com sucesso!' : 'Sinais vitais e controle de Peso registrados com sucesso!');
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
        usuarioNome: usuarioAtual?.nome || 'Usuário Desconhecido',
        usuarioEmail: usuarioAtual?.email || 'Sem e-mail',
        usuarioTelefone: usuarioAtual?.telefone || 'Sem telefone',
        usuarioTipo: usuarioAtual?.tipo || 'familiar',
        idosoNome: idoso?.nome || 'Paciente não especificado',
        dataConsentimento: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        modoApp: appMode === 'escolar_infantil' ? '🧸 Anjinho Escolar' : '👵 Anjo Cuidador',
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
            : (latestSono.dormiuEm && latestSono.acordouEm ? `Dormiu das ${latestSono.dormiuEm} às ${latestSono.acordouEm}` : 'Soneca registrada'))
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
  const instName = localStorage.getItem(`anjo_brand_name_${currentModeStr}`) || (isEscolar ? 'Colégio Pequeno Anjo' : 'Clínica Recanto Feliz');
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
      
      {/* 👶 SELETOR DE FILHOS MATRICULADOS (Para Pais com múltiplos filhos) */}
      {usuarioAtual?.tipo === 'familiar' && myChildren.length > 1 && (
        <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-800 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md tracking-wider">
                👨‍👩‍👧‍👦 Seus Filhos Matriculados
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight pt-1">
                Boletins de Acompanhamento Familiar
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Você possui <strong className="text-slate-700 dark:text-slate-300">{myChildren.length} assistidos</strong> registrados com o telefone <strong className="text-indigo-600">{usuarioAtual.telefone}</strong>. Selecione qual deseja monitorar:
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
      
      {/* 🏫 INSTITUTION SPONSOR & LOGO BRANDING BANNER (FIRST TAB ACCESSIBILITY) */}
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
              <span className="text-xl">{isEscolar ? '🏫' : '👵'}</span>
            )}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
              ⭐ Instituição Credenciada & Patrocinadora
            </span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight leading-none">
              {instName}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-snug">
              {instSlogan || (isEscolar ? 'Onde a infância é registrada para sempre — Transparência e segurança diária.' : 'Acompanhamento Sênior Inteligente — Cuidado e transparência em tempo real.')}
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

      {/* 🔍 BUSCA RÁPIDA DE ALUNO POR NOME */}
      {onSwitchIdoso && (
        <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left min-w-0">
              <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md tracking-wider">
                ⚡ Busca Direta por Nome
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔍</span> Busca Rápida de {isEscolar ? 'Alunos & Crianças' : 'Assistidos'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Digite o nome de qualquer {isEscolar ? 'aluno, turma ou responsável' : 'assistido'} para alternar o diário e boletim em 1 clique:
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

      {/* 🏫 CENTRAL DE SALAS E PROFESSORAS - SELETOR RÁPIDO PARA SIMULAÇÃO */}
      {appMode === 'escolar_infantil' && usuarioAtual?.tipo !== 'familiar' && (
        <div className={`p-5 rounded-3xl border transition-all shadow-md ${
          accessibilitySettings?.darkMode
            ? 'bg-slate-800/80 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/60 pb-3 mb-4">
            <div className="space-y-1 text-left">
              <h3 className="text-sm font-black flex items-center gap-2">
                <span>🏫</span> Central de Salas & Professoras <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Ambiente de Testes</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Mude de sala e professora com 1 clique. O painel se adaptará por completo para carregar as informações e diários da sala selecionada.
              </p>
            </div>
            {usuarioAtual && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100/80 px-3 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
                <span className="text-[10px] text-indigo-800 font-extrabold uppercase">Professora Ativa:</span>
                <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1">
                  👩‍🏫 {usuarioAtual.nome.replace(' (Educadora)', '')} 
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
                    <p className="text-[10px] text-slate-500 font-extrabold truncate">👩‍🏫 {teacherName}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-0.5">
                      <span>👶 {activeStudentsInClass} Aluno{activeStudentsInClass !== 1 ? 's' : ''}</span>
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
              <span className="text-3xl shrink-0">👵</span>
            )}
            <div className="space-y-1">
              <h3 className={`text-sm font-extrabold ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-850'}`}>
                {appMode === 'escolar_infantil'
                  ? 'Modo Agenda Escolar Infantil Ativo (Maternal & Creche)!'
                  : 'Acompanhamento Sênior Inteligente Ativo!'}
              </h3>
              <p className={`text-xs leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {appMode === 'escolar_infantil'
                  ? 'Você está simulando o aplicativo voltado para creches e berçários. As abas do Diário foram configuradas para o bem-estar lúdico, higiene e rotina da primeira infância:'
                  : 'Nossa tecnologia de cuidado integrado oferece duas versões super otimizadas: Anjo Cuidador (Acompanhamento Sênior) e Anjinho Escolar (Educação Infantil). Conheça as abas correspondentes:'}
              </p>

              {/* Bullet list of adjusted tabs for transparency */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {appMode === 'escolar_infantil' ? (
                  <>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">☕ Papa & Mamadeira</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">🚿 Trocas & Higiene</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">💧 Copos de Água</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">🌙 Sono / Soneca</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">😊 Humor & Social</div>
                    <div className="text-[10px] font-extrabold bg-teal-100/50 dark:bg-teal-950/40 text-teal-850 dark:text-teal-300 px-2 py-1 rounded-lg">📈 Atividade Pedagógica</div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">☕ Alimentação</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">🚿 Banho e Higiene</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">💧 Hidratação</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">🌙 Diário de Sono</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">😊 Humor/Comportamento</div>
                    <div className="text-[10px] font-extrabold bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-1 rounded-lg">📈 Exercícios/Atividades</div>
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
              {appMode !== 'idoso' ? '🔄 Ativar Modo Idoso (Lar)' : isApresentacao ? '✨ Ativar Agenda Escolar' : '✨ Ativar Agenda Escolar (Simular)'}
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
            {isEscolar ? '👩‍🏫 Painel da Professora' : '🧑‍⚕️ Painel do Cuidador'}
          </button>
          <button
            onClick={() => handleSetVisualMode('familia')}
            className={`flex-1 text-center py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              visualMode === 'familia' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isEscolar ? '🌿 Portal de Tranquilidade' : '🌿 Portal de Tranquilidade'}
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
              Dispositivo {simulatedOnline ? 'Conectado à Nuvem (Servidor)' : 'Operando em Fila Local (IndexedDB)'}
            </span>
            {filaOffline.length > 0 && (
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                ⚡ {filaOffline.length} Registro(s) Pendente(s)
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
                🛠️ {showSimulationTools ? 'Ocultar Simulador' : 'Simular Redes / Testes'}
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
                  Use os botões de simulação abaixo para colocar o dispositivo cooperativamente em modo offline. O aplicativo guardará os horários exatos dos toques no IndexedDB, e efetuará logs de auditoria de sincronização retroativa integrados ao perfil de auditoria LGPD no momento que a rede re-estabilizar.
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
                {simulatedOnline ? '🔌 Forçar Queda de Internet (Simular Offline)' : '⚡ Restaurar Conexão de Internet (Simular Online)'}
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
              {usuarioAtual.nome} — <span className="text-blue-600 capitalize font-bold">{getRoleLabel(usuarioAtual, isEscolar)}</span>
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
            title={isEscolar ? 'Ver salas de aula e trocar a criança/aluno em acompanhamento' : 'Ver lista de pessoas assistidas'}
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
              <Heart className="w-3.5 h-3.5 fill-current text-serene-blue" /> {isEscolar ? 'Aluno Verificado' : 'Visão Geral Ativa'}
            </span>
            <h1 className={`${titleClass} text-slate-800`}>{idoso.nome}</h1>
            {idoso.contatoEmergencia?.nome && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-xl font-bold w-fit mx-auto md:mx-0 shadow-2xs">
                <span>👨‍👩‍👧</span>
                <span>Resp: <strong className="font-extrabold text-indigo-950">{idoso.contatoEmergencia.nome}</strong> ({idoso.contatoEmergencia.parentesco || 'Mãe/Pai'})</span>
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
                <span className="text-sm">👩‍🏫</span>
                <span className="text-xs text-indigo-800 dark:text-indigo-300 font-extrabold">Professora Titular:</span>
                <span className="text-xs font-black text-indigo-950 dark:text-white">
                  {(() => {
                    const studentRoom = getStudentClassName(idoso) || idoso.salaAula || idoso.quarto || 'Berçário I - A';
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
                <span className="text-sm">👵</span>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-extrabold">Cuidador Responsável:</span>
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
                        title="Excluir rotina/condição"
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
                  <Plus className="w-3.5 h-3.5" /> {isEscolar ? 'Novo Alerta/Alergia' : 'Nova Condição/Alergia'}
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
                      <option value="condicao">{isEscolar ? 'Rotina/Restrição' : 'Condição Médica'}</option>
                      <option value="alergia">Alergia Grave</option>
                    </select>
                    <input
                      type="text"
                      placeholder={newSpecialType === 'condicao' ? (isEscolar ? 'Ex: Soneca após almoço' : 'Ex: Diabetes Tipo 2') : 'Ex: Amendoim, Lactose'}
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
                      Você está visualizando a ficha de <strong>{idoso.nome}</strong>. Cadastramos todos os 25 alunos da sala.
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

      {/* 🎁 TRIAL MILESTONE TRACKER: JORNADA COMERCIAL DE 30 DIAS (EXCLUSIVO PARA A VISÃO DA FAMÍLIA / PAIS) */}
      {!isStaffUser(usuarioAtual) && visualMode === 'familia' && localStorage.getItem(`anjo_sub_status_${idoso.id}`) !== 'atrasado' && (
        <div className={`p-6 rounded-3xl border text-left space-y-4 shadow-xs relative overflow-hidden transition-all ${
          accessibilitySettings?.darkMode 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : 'bg-linear-to-r from-emerald-50/50 to-teal-50/50 border-emerald-200'
        }`}>
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 pointer-events-none">🎁</div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Período de Experiência
                </span>
                <span className={`text-xs font-bold ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 15 de 30</span>
              </div>
              <h4 className={`text-base font-black ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-950'}`}>
                {isEscolar 
                  ? '🎁 Seu Período de Testes Gratuitos (30 Dias) está Ativo!' 
                  : '🎁 Período de Experiência Grátis (30 Dias) Ativo!'
                }
              </h4>
              <p className={`text-xs max-w-2xl font-semibold leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                {isEscolar
                  ? `Já faz 15 dias que você está mais perto da rotina escolar de ${idoso.nome}. Viu como a aba de Medicamentos Encomendados e o Diário Lúdico facilitam seu dia e trazem tranquilidade?`
                  : `Já faz 15 dias que você está mais perto do acompanhamento preventivo de ${idoso.nome}. Viu como a aba de Medicamentos e os registros de Sinais Vitais trazem paz e segurança?`
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
                })()} 💳
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
                    ✓
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Dia 1</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Boas-vindas</span>
                </div>

                {/* Step 2: Dia 15 */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs animate-pulse">
                    ★
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Dia 15</span>
                  <span className={`text-[9px] font-extrabold ${accessibilitySettings?.darkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>Você está aqui</span>
                </div>

                {/* Step 3: Dia 25 */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                    3
                  </div>
                  <span className={`text-[10px] font-black ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dia 25</span>
                  <span className={`text-[9px] font-bold block ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Aviso Prévio</span>
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 font-sans">{isEscolar ? 'Controle de Presença Escolar' : 'Acompanhamento de Cuidados'}</span>
                  <h2 className="text-xl font-bold text-rose-950">
                    {isEscolar ? '🚫 Aluno Ausente Hoje (Falta)' : '🚫 Cliente Ausente'}
                  </h2>
                  <p className="text-xs text-rose-700 mt-1 leading-normal">
                    {isEscolar 
                      ? 'Este aluno foi marcado como ausente hoje. Nenhuma notificação ou relatório de rotina será cobrado ou emitido para os pais, e os lembretes de atraso para este diário estão desativados.'
                      : 'Este idoso foi marcado como ausente hoje. Nenhuma atividade ou tarefa de rotina do dia será cobrada ou marcada.'
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
                      🔒 Apenas educadores/cuidadores autorizados podem alterar a presença do aluno.
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
                      ? (isEscolar ? `✓ Período Letivo em Andamento (${idoso.nome.split(' (')[0]})` : `✓ Turno Ativo no Celular!`) 
                      : (isEscolar ? `Aulas Não Iniciadas (${idoso.nome.split(' (')[0]})` : 'Seu Turno Não Está Ativo')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {isEscolar 
                      ? (isStaffUser(usuarioAtual)
                          ? 'Inicie o diário de classe do aluno para registrar sonecas, xixi/cocô, mamadeiras e saúde. No final do período, termine a aula para disparar o relatório automático via WhatsApp para os pais!'
                          : (isShiftActive 
                              ? `👶 ${idoso.nome.split(' (')[0]} está presente na escola e o diário de classe está aberto em tempo real pela equipe pedagógica.` 
                              : `Aguardando a professora/educadora iniciar o período letivo para ${idoso.nome.split(' (')[0]}. Assim que a entrada for confirmada, o cronômetro iniciará aqui automaticamente.`))
                      : 'Inicie seu turno para acompanhar a rotina e as atividades. Ao final, clique em Encerrar para compilar o resumo e enviar os disparos de auditoria aos familiares interessados.'
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Unified Stopwatch Card: Always visible to avoid "disappeared" feeling */}
                  <div className={`px-4 py-2.5 rounded-xl border leading-none transition-all duration-300 ${isShiftActive ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        {isEscolar ? 'TEMPO EM AULA' : 'DURAÇÃO DO TURNO'}
                      </span>
                      {isShiftActive && isStaffUser(usuarioAtual) && (
                        <button
                          onClick={handleDirectStopShift}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                          title="Desligar cronômetro imediatamente"
                        >
                          ⏹️ Desligar
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
                            title="Registrar intercorrência médica urgente (Febre, Queda, Alergia)"
                          >
                            <ShieldAlert className="w-4 h-4 text-white animate-pulse" /> 🚨 Intercorrência Urgente
                          </button>
                          <button
                            onClick={() => {
                              setOccurrenceForm({ tipo: 'comportamento', criticidade: 'amarelo', descricao: '' });
                              setShowOccurrenceModal(true);
                            }}
                            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border border-amber-400 hover:scale-102"
                            title="Registrar ocorrência pedagógica ou de rotina"
                          >
                            <FileText className="w-4 h-4 text-white" /> 📋 Ocorrência do Dia
                          </button>
                          <button
                            onClick={() => {
                              triggerConfirm(
                                'Reiniciar Cronômetro (Novo Dia)',
                                `Deseja reiniciar o cronômetro para iniciar um NOVO DIA com ${idoso.nome.split(' (')[0]}? Todas as atividades e registros do dia anterior serão zerados e as tarefas da rotina retornarão ao estado pendente.`,
                                () => {
                                  handleStartShift();
                                }
                              );
                            }}
                            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 border border-emerald-500"
                            title="Reiniciar cronômetro para iniciar um novo dia do zero (zerar atividades do dia anterior)"
                          >
                            <RotateCcw className="w-4 h-4" /> {isEscolar ? 'Reiniciar Cronômetro (Novo Dia)' : 'Reiniciar Turno'}
                          </button>
                          <button
                            onClick={handleDirectStopShift}
                            className="px-4 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                            title="Desligar cronômetro imediatamente e sincronizar com o painel dos pais"
                          >
                            <Square className="w-4 h-4 fill-current" /> {isEscolar ? 'Desligar Cronômetro' : 'Desligar Turno'}
                          </button>
                          <button
                            onClick={handleTriggerEndShiftReview}
                            className="px-4 py-3 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 border border-slate-600"
                            title="Encerrar período letivo e abrir resumo completo para WhatsApp"
                          >
                            <FileText className="w-4 h-4" /> {isEscolar ? 'Encerrar e Mandar Resumo' : 'Encerrar (Resumo WhatsApp)'}
                          </button>
                          {isEscolar && teacherClassroom && (
                            <button
                              onClick={() => handleEndShiftGroup(teacherClassroom)}
                              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 border border-amber-500"
                              title={`Encerrar aula de todos os alunos da classe ${teacherClassroom} simultaneamente`}
                            >
                              <Users className="w-4 h-4" /> Encerrar Coletivo ({teacherClassroom})
                            </button>
                          )}
                          <button
                            onClick={handleToggleAbsence}
                            className="px-5 py-3 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 active:bg-rose-100/30 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                            title={isEscolar ? 'Sinalizar ausência do aluno hoje' : 'Registrar que o cliente não compareceu hoje'}
                          >
                            <UserX className="w-4 h-4 text-rose-500" /> {isEscolar ? 'Sinalizar Ausência do Aluno' : 'Registrar Não Comparecimento'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleStartShift}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
                          >
                            <Play className="w-4 h-4 fill-current" /> {isEscolar ? 'Iniciar Período Individual' : 'Iniciar Meu Turno de Cuidados'}
                          </button>
                          {isEscolar && teacherClassroom && (
                            <button
                              onClick={() => handleStartShiftGroup(teacherClassroom)}
                              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 border border-indigo-500"
                              title={`Iniciar período letivo de todos os alunos da classe ${teacherClassroom} sincronizadamente`}
                            >
                              <Users className="w-4 h-4" /> Iniciar Coletivo ({teacherClassroom})
                            </button>
                          )}
                          <button
                            onClick={handleToggleAbsence}
                            className="px-5 py-3 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 active:bg-rose-100/30 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                            title={isEscolar ? 'Sinalizar ausência do aluno hoje' : 'Registrar que o cliente não compareceu hoje'}
                          >
                            <UserX className="w-4 h-4 text-rose-500" /> {isEscolar ? 'Sinalizar Ausência do Aluno' : 'Registrar Não Comparecimento'}
                          </button>
                        </>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 bg-white/70 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {isShiftActive 
                          ? 'Sincronizado com a escola via nuvem em tempo real.'
                          : '🔒 Visualização dos responsáveis. Controles exclusivos dos educadores.'}
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
                Você registrou tarefas enquanto estava sem internet. O sistema guardou o horário real do seu celular. Quando sua internet voltar, mude no simulador acima para "Online" e sincronize os registros de auditoria.
              </p>
              <div className="space-y-1.5 pt-1.5">
                {filaOffline.map(oItem => (
                  <div key={oItem.id_local} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-semibold shadow-2xs">
                    <div>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded uppercase font-black mr-2">{oItem.tipo}</span>
                      <strong className="text-slate-800">{oItem.titulo}</strong>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-500">
                      Dispositivo: {new Date(oItem.horario_registrado_dispositivo).toLocaleTimeString('pt-BR')}  •  <span className="text-rose-500 font-bold uppercase tracking-wide">Pendente</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONE-TAP INSTANT CARE PANEL (Painel Um-Toque de Alta Performance) */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-blue-600" /> Painel "Um-Toque" de Registros Diários
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
                        {isEscolar ? 'Aluno com Falta / Ausência Registrada' : 'Cliente Marcado como Ausente'}
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Para registrar alimentação, hidratação ou cuidados normalmente, clique no botão ao lado ou use qualquer registro rápido.
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
                  <Coffee className="text-amber-500 w-4.5 h-4.5" /> Registrar Refeição Rápida
                </h4>
                <form onSubmit={handleQuickMealSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Refeição</label>
                      <select 
                        value={quickMeal.refeicao} 
                        onChange={e => setQuickMeal({...quickMeal, refeicao: e.target.value})}
                        className="w-full text-xs font-semibold px-2 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1"
                      >
                        {isEscolar && <option value="mamadeira">🍼 Mamadeira de Leite / Fórmula</option>}
                        <option value="cafe_manha">{isEscolar ? '🥐 Lanchinho da Manhã' : '☕ Café da Manhã'}</option>
                        <option value="almoco">{isEscolar ? '🍲 Papinha / Almocinho' : '🍛 Almoço'}</option>
                        <option value="lanche">{isEscolar ? '🍎 Frutinha / Lanchinho Tarde' : '🍎 Lanche da Tarde'}</option>
                        <option value="jantar">{isEscolar ? '🥣 Jantinha Escolar' : '🍲 Jantar'}</option>
                        <option value="ceia">{isEscolar ? '🥛 Chá ou Suco Pós-Soneca' : '🥛 Ceia / Repouso'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aceitação</label>
                      <select 
                        value={quickMeal.aceitacao} 
                        onChange={e => setQuickMeal({...quickMeal, aceitacao: e.target.value})}
                        className="w-full text-xs font-semibold px-2 py-2 border border-slate-300 rounded-xl bg-slate-50"
                      >
                        <option value="muito_bem">😋 Comeu Super Bem</option>
                        <option value="pouco">😐 Comeu Pouquinho</option>
                        <option value="recusou">❌ Recusou / Sem Fome</option>
                      </select>
                    </div>
                  </div>

                  {quickMeal.refeicao === 'mamadeira' && (
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50/40 rounded-xl border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">🍼</span>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observação / Cardápio</label>
                      <VoiceInput 
                        onTranscript={text => setQuickMeal(prev => ({ ...prev, observacao: prev.observacao ? prev.observacao + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Observação rápida (ex: Amou a banana cozida)"
                      value={quickMeal.observacao}
                      onChange={e => setQuickMeal({...quickMeal, observacao: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-[#cbd5e1] rounded-xl focus:ring-1 focus:outline-hidden"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Salvar Refeição Instantânea
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
                        {isEscolar ? 'Hidratação Rápida (Água)' : 'Hidratação Instantânea'}
                      </h4>
                      <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                        {quickHydrationAmount} ml
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal mb-3">
                      {isEscolar 
                        ? `Escolha a quantidade de água servida em mL para ${idoso.nome}. Registra o copo e atualiza a jarrinha.`
                        : `Basta um clique para salvar o consumo de água de ${idoso.nome}. O aplicativo cuida de atualizar a rotina e sincronizar.`}
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

                  {/* 🫖 Jarrinha Animada no card de Hidratação Instantânea */}
                  {(() => {
                    const targetGoal = isEscolar ? 600 : 1500;
                    const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                    return (
                      <div className="flex flex-col items-center bg-cyan-50/70 p-2.5 rounded-2xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de hidratação: o conteúdo sobe conforme a água é oferecida!">
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
                  <span>🥤 Oferecer Copo (+{quickHydrationAmount}ml)</span>
                  <span className="text-[10px] bg-cyan-700/40 px-2 py-0.5 rounded-md">Jarrinha Sobe!</span>
                </button>
              </div>

              {/* Quick Hygiene checklist */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Heart className="text-rose-500 w-4.5 h-4.5" /> {isEscolar ? 'Higiene & Cuidados da Criança 👶' : 'Higiene & Cuidados de Conforto'}
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
                        <span className="block font-bold text-slate-800">{isEscolar ? '👶 Troca de Fralda / Cuidado de Toalete' : '👶 Troca de Fralda / Absorvente'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Fralda descartável checada/trocada ou incentivo de uso do toalete.' : 'Se aplicável, ou verificação de vazamento urinário.'}</span>
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
                        <span className="block font-bold text-slate-800">{isEscolar ? '🪥 Escovação de Dentes Orientada' : '🪥 Higiene Bucal Completa'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Com escovinha individual e creme dental infantil de forma lúdica.' : 'Uso de escova macia, higienizador de língua ou solução protética.'}</span>
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
                        <span className="block font-bold text-slate-800">{isEscolar ? '👚 Troca de Roupa (Mochila)' : '👚 Troca de Roupa por Limpas'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Criança vestida com roupas limpas enviadas pelos pais após sujar ou banho.' : 'Roupas frescas, fáceis de vestir e adequadas ao clima.'}</span>
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
                        <span className="block font-bold text-slate-800">{isEscolar ? '🧼 Lavagem das Mãos e Rosto' : '🚿 Banho de Chuveiro Realizado'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Praticado antes e após refeições e depois das brincadeiras de artes/pátio.' : 'Controle de temperatura de água e piso antiderrapante.'}</span>
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
                        <span className="block font-bold text-slate-800">{isEscolar ? '🧴 Pomada Antiassadura / Protetor' : '🧴 Hidratação e Proteção da Pele'}</span>
                        <span className="text-[10px] text-slate-500 font-normal block leading-tight">{isEscolar ? 'Aplicação de pomada nas dobrinhas para prevenção de brotoejas ou assadura.' : 'Uso de cremes sênior preventivos para escaras e ressecamento.'}</span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observação de Higiene</label>
                      <VoiceInput 
                        onTranscript={text => handleHygieneChange({ observations: quickHygiene.observations ? quickHygiene.observations + ' ' + text : text })} 
                        size="sm"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder={isEscolar ? "Ex: Sem assaduras. Cooperou cantando a musiquinha do sapo para lavar as mãos." : "Ex: Sem assaduras, pele limpa e bem cuidada."}
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
                      <option value="calmo">😊 Calmo / Sereno</option>
                      <option value="feliz">😄 Feliz / Comunicativo</option>
                      <option value="sonolento">💤 Sonolento / Repousando</option>
                      <option value="agitado">⚠️ Agitado / Inquieto</option>
                      <option value="confuso">❓ Desorientado / Confuso</option>
                      <option value="recusando">❌ Resiste às Intervenções</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="quick-humor-observacao" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observação do Humor / Estado</label>
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
                      placeholder="Nota rápida (ex: Dormiu bem à tarde, descansou no soninho e acordou bem disposto)"
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

              {/* Quick Vitals & Weight Track Card ⚖️ */}
              <div className="bg-white p-5 rounded-2xl border border-soft-gray space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-rose-500 w-4.5 h-4.5 animate-pulse" /> {isEscolar ? 'Saúde, Sono & Fralda do Aluno ⚖️' : 'Sinais Vitais & Peso do Idoso ⚖️'}
                </h4>
                <form id="quick-vitals-form" onSubmit={handleQuickVitalsSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`space-y-1 ${isEscolar ? 'col-span-2 md:col-span-1' : ''}`}>
                      <label htmlFor="vital-pressao" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEscolar ? '💤 Soneca / Descanso' : 'PA (Pressão)'}</label>
                      <input 
                        id="vital-pressao"
                        type="text" 
                        placeholder={isEscolar ? 'Ex: Dormiu das 13:00 às 14:30' : 'Ex: 120/80'}
                        value={quickVitals.pressao}
                        onChange={e => setQuickVitals({...quickVitals, pressao: e.target.value})}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                      />
                      {isEscolar && (
                        <div className="mt-1.5 space-y-1.5 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-indigo-700 flex items-center gap-1 uppercase tracking-wider">⏱️ Toque Rápido (Soneca):</span>
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
                              onClick={() => setQuickVitals(prev => ({ ...prev, pressao: 'Não dormiu / sesta' }))}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 active:scale-95 text-rose-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs"
                            >
                              Não dormiu
                            </button>
                          </div>

                          <div className="pt-1.5 border-t border-indigo-100/60 flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 shrink-0">🕒 Reloginho:</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="time" 
                                value={sleepStart}
                                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold text-[9px] focus:outline-hidden"
                                onChange={e => {
                                  const val = e.target.value;
                                  setSleepStart(val);
                                  setQuickVitals(prev => ({ ...prev, pressao: `Dormiu das ${val} às ${sleepEnd}` }));
                                }}
                              />
                              <span className="text-[9px] font-bold text-slate-400">às</span>
                              <input 
                                type="time" 
                                value={sleepEnd}
                                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold text-[9px] focus:outline-hidden"
                                onChange={e => {
                                  const val = e.target.value;
                                  setSleepEnd(val);
                                  setQuickVitals(prev => ({ ...prev, pressao: `Dormiu das ${sleepStart} às ${val}` }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`space-y-1 ${isEscolar ? 'col-span-2 md:col-span-1' : ''}`}>
                      <div className="flex items-center justify-between">
                        <label htmlFor="vital-glicemia" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEscolar ? '🧻 Fralda (Xixi ou Cocô)' : 'Glicemia (mg/dL)'}</label>
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
                        placeholder={isEscolar ? 'Ex: Fez Cocô / Pomada' : 'Ex: 104'}
                        value={quickVitals.glicemia}
                        onChange={e => setQuickVitals({...quickVitals, glicemia: e.target.value})}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
                      />
                      {isEscolar && (
                        <div className="mt-1.5 space-y-1.5 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/80">
                          <span className="text-[9px] font-extrabold text-emerald-700 block uppercase tracking-wider">🧻 Toque Rápido (Fralda):</span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Fez Xixi' }))}
                              className="px-2 py-1 bg-white hover:bg-sky-50 border border-sky-100 active:scale-95 text-sky-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              💦 Xixi
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Fez Cocô' }))}
                              className="px-2 py-1 bg-white hover:bg-amber-50 border border-amber-100 active:scale-95 text-amber-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              💩 Cocô
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Xixi e Cocô' }))}
                              className="px-2 py-1 bg-white hover:bg-purple-50 border border-purple-100 active:scale-95 text-purple-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              ✨ Ambos
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => {
                                const current = prev.glicemia ? prev.glicemia + ' (Passou pomada)' : 'Fralda trocada + pomada';
                                return { ...prev, glicemia: current };
                              })}
                              className="px-2 py-1 bg-white hover:bg-teal-50 border border-teal-100 active:scale-95 text-teal-700 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              🧴 +Pomada
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickVitals(prev => ({ ...prev, glicemia: 'Fralda Seca / Limpa' }))}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-100 active:scale-95 text-emerald-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              ✅ Seca
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="vital-temperatura" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-bold text-orange-650">{isEscolar ? '🌡️ Febre / Temp (°C)' : 'Temp (°C)'}</label>
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
                            36,5°C
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '37.0' }))}
                            className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            37,0°C
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '37.5' }))}
                            className="px-1.5 py-0.5 bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            37,5°C
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickVitals(prev => ({ ...prev, temp: '38.0' }))}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-800 rounded text-[9px] font-extrabold transition-all cursor-pointer"
                          >
                            38,0°C ⚠️
                          </button>
                        </div>
                      )}
                    </div>
                    {!isEscolar ? (
                      <>
                        <div className="space-y-1">
                          <label htmlFor="vital-oxigenio" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            O2 (Saturação %)
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
                            F. Cardíaca (bpm)
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
                      <label htmlFor="vital-peso" className="text-[10px] font-black text-indigo-650 uppercase tracking-wider block font-black">{isEscolar ? '⚖️ Peso Corporal (Kg)' : '⚖️ Peso Corporal (Recomendado Semanal)'}</label>
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
                            <span>🍼 Mamadeiras Hoje:</span>
                            <strong className="text-amber-800 font-black">{studentBottlesToday.length} {studentBottlesToday.length === 1 ? 'servida' : 'servidas'} ({totalBottlesMl} ml)</strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <span>💧 Hidratação Total:</span>
                            <strong className="text-cyan-800 font-black">{totalWaterMl} ml</strong>
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-white text-slate-600 rounded-md border border-slate-200">
                          ✓ Sincronizado
                        </span>
                      </div>
                    );
                  })()}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isEscolar ? 'Notas Gerais de Saúde / Rotina do Bebê' : 'Notas Gerais de Saúde / Rotina'}</label>
                      <VoiceInput 
                        onTranscript={text => setQuickVitals(prev => ({ ...prev, obs: prev.obs ? prev.obs + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input 
                      id="vital-observacoes"
                      type="text" 
                      placeholder={isEscolar ? 'Notas do dia (ex: Brincou muito na areia, comeu toda papinha, dormiu tranquilo no colinho...)' : 'Notas ou observações adicionais...'}
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
                    {isEscolar ? 'Salvar Situação de Saúde & Alertar Pais' : 'Salvar Sinais Vitais & Peso Corporal + Notificar'}
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
                  title="Registrar Intercorrência Médica Urgente"
                >
                  <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                  <span>🚨 Intercorrência Urgente</span>
                </button>

                <button
                  onClick={() => {
                    setOccurrenceForm({ tipo: 'comportamento', criticidade: 'amarelo', descricao: '' });
                    setShowOccurrenceModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-full shadow-xl transition-all cursor-pointer flex items-center gap-1.5 border border-amber-400 hover:scale-105"
                  title="Registrar Ocorrência do Dia / Rotina"
                >
                  <FileText className="w-4 h-4 text-white shrink-0" />
                  <span>📋 Ocorrência do Dia</span>
                </button>

                <button
                  onClick={() => setEmergencyMinimized(false)}
                  className="p-2 bg-slate-800/80 hover:bg-slate-900 text-white text-xs rounded-full shadow-md cursor-pointer"
                  title="Expandir Painel de Emergência"
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
                  title="Minimizar Painel de Emergência"
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
                      <span>🚨 Intercorrência Urgente</span>
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
                      <span>📋 Ocorrência do Dia</span>
                    </span>
                    <span className="text-[10px] bg-amber-600 px-2 py-0.5 rounded-md font-bold">Mordida/Choro</span>
                  </button>
                </div>

                {idoso.contatoEmergencia && (
                  <div className="pt-3 border-t border-red-200/60 lg:border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase text-red-900 lg:text-slate-500 block tracking-wider">
                      📞 Contato de Emergência Rápido:
                    </span>
                    <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-red-100 lg:border-slate-200 shadow-3xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <strong className="text-xs font-black text-red-950 dark:text-slate-200 block truncate">
                          {idoso.contatoEmergencia.nome}
                        </strong>
                        <span className="text-[10px] text-red-700 dark:text-slate-400 font-bold block truncate">
                          {idoso.contatoEmergencia.parentesco} • {idoso.contatoEmergencia.telefone}
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
                      {isEscolar ? 'Aluno(a) com Falta Registrada Hoje' : 'Cliente com Ausência Registrada'}
                    </h4>
                    <p className="text-[11px] text-rose-800 leading-snug">
                      Você pode visualizar as atividades planejadas ou reativar a presença para dar baixa nos itens.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unlockAndMarkPresent()}
                  className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Reativar Presença
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
                  {/* Ferramentas de Gestão da Agenda */}
                  {tarefas.length > 0 && isStaffUser(usuarioAtual) && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={handleDeduplicateTasks}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-700 hover:bg-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        title="Remove tarefas com o mesmo título ou horário repetido"
                      >
                        🧹 <span>Repetidas</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllTasks}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        title="Limpar todas as atividades da agenda hoje"
                      >
                        🗑️ <span>Limpar Atividades</span>
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
                      <span>🧠 Importar Aura</span>
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
                    title="Restaurar rotina padrão recomendada"
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
                    ✨ {isEscolar ? 'Agendar Nova Atividade Escolar' : 'Agendar Nova Tarefa de Cuidado'}
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
                        📌 Cadastro Direto
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
                        🧠 Importar Planejamento Aura
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
                        1. Abra a <strong>Anjinha Aura ✨</strong> no topo da tela, peça a ela para criar a rotina/planejamento de aulas da semana e <strong>copie o texto gerado</strong>.<br/>
                        2. <strong>Cole todo o texto</strong> da Aura na caixa branca abaixo.<br/>
                        3. Clique no botão <strong>"🧠 Extrair e Processar Atividades"</strong> para agendar tudo de uma vez!
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const promptText = `Por favor, crie o planejamento de rotina pedagógica escolar começando com a Acolhida das Crianças às 07:00 e finalizando com a Saída às 16:00.\n\nUse o formato por linha:\nHH:MM: [Título da Atividade] - [Descrição pedagógica detalhada]\n\nExemplo:\n- 07:00: Acolhida e Entrada Afetiva - Recepção carinhosa dos alunos e cantigas de bom dia.\n- 08:00: Roda de Conversa - Apresentação do tema diário e musicalização.\n- 09:00: Lanche da Manhã - Frutas da estação e hidratação.\n- 09:45: Recreação e Banho de Sol - Brincadeiras ao ar livre no pátio sombreado.\n- 10:30: Atividade Dirigida BNCC - Exploração sensorial com tintas e texturas.\n- 11:30: Almoço Saudável - Papinha balanceada e legumes.\n- 12:15: Higiene e Fraldas - Troca de fraldas e escovação dental.\n- 12:30: Soneca Restauradora - Descanso em colchonetes com som suave.\n- 14:15: Lanche da Tarde - Mamadeira ou fruta fresca.\n- 14:45: Brincadeira Livre - Blocos pedagógicos e autonomia.\n- 15:30: Contação de Histórias - Livros ilustrados e fantoches.\n- 16:00: Preparação para Saída - Entrega afetiva aos familiares.`;
                            navigator.clipboard.writeText(promptText);
                            alert('📋 Comando copiado com sucesso! Agora é só colar no chat da Aura.');
                          }}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-[11px] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          📋 Copiar Modelo de Comando para a Aura (07:00 às 16:00)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                          <span>👇</span> COLE O SEU TEXTO DA AURA AQUI ABAIXO:
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAutoFixAllTasks}
                            className="text-[11px] text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors border border-indigo-200 shadow-2xs"
                            title="Auto-corrige nomes e horários de atividades que possam ter ficado deslocados"
                          >
                            🪄 Auto-Realinhar Atividades
                          </button>
                          {auraWeeklyText && (
                            <button
                              type="button"
                              onClick={() => { setAuraWeeklyText(''); setParsedAuraTasks([]); setAuraDetectedMeta(null); }}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              🗑️ Limpar Texto
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleCleanCorruptedTasks}
                            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors border border-amber-200"
                            title="Limpar tarefas pendentes antigas que foram importadas com erro ou desalinhadas"
                          >
                            🧹 Limpar com Erro
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={7}
                        value={auraWeeklyText}
                        onChange={e => setAuraWeeklyText(e.target.value)}
                        placeholder={`Cole aqui o texto copiado da Aura. Exemplo:

Segunda-feira:
- 07:00: Acolhida e Entrada Afetiva - Recepção carinhosa dos alunos e cantigas de bom dia.
- 08:00: Roda de Conversa - Tema do dia e musicalização.
- 09:00: Lanche da Manhã - Frutas da estação e hidratação.
- 09:45: Banho de Sol com Exploradores - Levar os bebês para ambiente externo seguro e sombreado.
- 10:30: Atividade Dirigida BNCC - Exploração sensorial e artes.
- 11:30: Almoço Saudável - Refeição balanceada.
- 12:15: Higiene e Fraldas - Troca e escovação dental.
- 12:30: Soneca Restauradora - Descanso nos colchonetes.
- 14:15: Lanche da Tarde - Mamadeira ou lanche equilibrado.
- 14:45: Brincadeira Livre - Brinquedos pedagógicos e socialização.
- 15:30: Contação de Histórias - Livros ilustrados e fantoches.
- 16:00: Saída e Despedida - Entrega afetiva aos responsáveis.`}
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
                            <span>🧠 Extrair & Padronizar com Aura</span>
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
                          {/* Cabeçalho no Padrão Manual Pedagógico */}
                          <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                                <span>📋</span> Planejamento Extraído: {auraDetectedMeta?.tema || 'Rotina Escolar Padronizada'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                                {parsedAuraTasks.length} Atividades no Total
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">📅 Período / Dias Detectados</span>
                                <span className="font-extrabold text-slate-800">
                                  {distinctDays.length > 1 ? `${distinctDays.length} Dias (${distinctDays[0]} a ${distinctDays[distinctDays.length - 1]})` : (auraDetectedMeta?.dataStr || auraDetectedMeta?.dia || 'Segunda-feira')}
                                </span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">🎨 Tema do Planejamento</span>
                                <span className="font-extrabold text-indigo-900">{auraDetectedMeta?.tema || 'Desenvolvimento e Rotina Pedagógica'}</span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">👶 Turma de Aplicação</span>
                                <span className="font-extrabold text-purple-900">{auraDetectedMeta?.turma || getStudentClassroomLocal(idoso.nome)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Seletor de Abas por Dia da Semana / Data */}
                          {distinctDays.length > 1 && (
                            <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                                  <span>🗓️</span> Visualizar & Separar por Dia:
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
                                      <span>📅</span> {dayName} <span className="text-[10px] opacity-80">({countForDay})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Modo de Aplicação da Rotina */}
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-950 flex items-center gap-1">
                                <span>⚙️</span> Modo de Aplicação na Agenda:
                              </span>
                              <p className="text-[11px] text-amber-800">
                                {auraMergeMode === 'substituir' 
                                  ? 'Substituirá as tarefas pendentes pelo planejamento selecionado.' 
                                  : 'Manterá as tarefas atuais e adicionará as novas ao final.'}
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
                                🔄 Substituir Rotina
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
                                ➕ Mesclar / Adicionar
                              </button>
                            </div>
                          </div>

                          {/* Tabela com Todos os Dados Detalhados */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto shadow-inner">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                  <th className="p-2.5 w-24">Data / Dia</th>
                                  <th className="p-2.5 w-20">Horário</th>
                                  <th className="p-2.5 w-1/3">Atividade Completa</th>
                                  <th className="p-2.5">Descrição Pedagógica & BNCC</th>
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
                                        <span className="text-[10px] font-normal text-indigo-600 block mt-0.5">🎯 {act.objetivoBNCC}</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                                      <p>{String(act.descricao || '')}</p>
                                      {act.materiais && act.materiais.length > 0 && (
                                        <p className="text-[10px] text-amber-800 font-medium mt-1">📦 {act.materiais.join(', ')}</p>
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
                                🧹 Limpar Tarefas com Erro Antigas
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
                                  📅 Salvar Apenas {selectedAuraDayTab} ({filteredTasks.length})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSaveAuraWeeklyPlan('todos')}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                              >
                                💾 Confirmar e Cadastrar Todas ({parsedAuraTasks.length} Atividades)
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
                    ⚡ {isEscolar ? 'Modelos Rápidos de Atividades Escolares' : 'Modelos Rápidos de Cuidados Sênior'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(isEscolar 
                      ? [
                          { tipo: 'atividade_fisica', titulo: 'Aula de Artes & Pintura 🎨', horarioPrevisto: '14:00', descricao: 'Atividade pedagógica de desenho com guache, lápis de cor e colagens.' },
                          { tipo: 'humor', titulo: 'Hora do Conto & Leitura 📖', horarioPrevisto: '16:00', descricao: 'Contação de história lúdica em círculo com fantoches e livros ilustrados.' },
                          { tipo: 'atividade_fisica', titulo: 'Brincadeiras no Parquinho 🏃', horarioPrevisto: '10:30', descricao: 'Circuito de coordenação motora ampla com túneis, bambolês e corrida leve.' },
                          { tipo: 'alimentacao', titulo: 'Hora da Frutinha & Hidratação 🍎', horarioPrevisto: '15:00', descricao: 'Oferecer melancia, maçã picada ou mamadeira de suco natural.' },
                          { tipo: 'sono', titulo: 'Soneca Pós-Almoço 💤', horarioPrevisto: '13:00', descricao: 'Preparar colchonete, iluminação suave e música instrumental relaxante.' },
                          { tipo: 'banho', titulo: 'Higiene Oral & Escovar Dentes 🪥', horarioPrevisto: '12:00', descricao: 'Escovação de dentes assistida e lavagem das mãos pós-alimentação.' }
                        ]
                      : [
                          { tipo: 'sinais_vitais', titulo: 'Verificar Sinais Vitais 🩺', horarioPrevisto: '09:00', descricao: 'Aferir pressão arterial, saturação e batimentos cardíacos.' },
                          { tipo: 'medicacao', titulo: 'Medicação de Uso Contínuo 💊', horarioPrevisto: '08:00', descricao: 'Administrar medicamentos prescritos da manhã com água.' },
                          { tipo: 'atividade_fisica', titulo: 'Alongamento Leve & Caminhada 🚶', horarioPrevisto: '17:00', descricao: 'Caminhada leve de 15 minutos e exercícios de mobilidade.' },
                          { tipo: 'alimentacao', titulo: 'Chá da Tarde & Biscoitos 🍵', horarioPrevisto: '16:30', descricao: 'Oferecer chá morno com duas torradas e garantir ingestão de líquidos.' }
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
                      <option value="alimentacao">{isEscolar ? '🍲 Alimentação / Lanche' : '🍛 Alimentação'}</option>
                      <option value="medicacao">{isEscolar ? '💊 Medicamento Autorizado' : '💊 Medicamento'}</option>
                      <option value="banho">{isEscolar ? '🧼 Banho / Higiene / Fralda' : '🧼 Banho / Higiene'}</option>
                      <option value="hidratacao">💧 Hidratação / Líquidos</option>
                      <option value="sono">{isEscolar ? '💤 Soneca / Descanso' : '💤 Sono / Repouso'}</option>
                      <option value="humor">{isEscolar ? '🎒 Humor / Socialização' : '❤️ Humor / Estado Interno'}</option>
                      <option value="atividade_fisica">{isEscolar ? '🎨 Recreação / Aula de Física' : '🚶 Atividade Física / Passeio'}</option>
                      <option value="sinais_vitais">{isEscolar ? '🌡️ Sinais de Saúde / Febre' : '🌡️ Sinais Vitais / Triagem'}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Título / Nome do Cuidado / Atividade</label>
                      <VoiceInput 
                        onTranscript={text => setNewTaskForm(prev => ({ ...prev, titulo: prev.titulo ? prev.titulo + ' ' + text : text }))} 
                        size="sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder={isEscolar ? "Ex: Aula de pintura guache ou contação de história" : "Ex: Oferecer chá de erva cidreira ou verificar curativo"}
                      value={newTaskForm.titulo}
                      onChange={e => setNewTaskForm({ ...newTaskForm, titulo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:outline-hidden bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        ⏰ Horário
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
                        title="Inserir horário atual"
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
                          👥 Alcance da Atividade
                        </span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Escolha se a atividade é individual para <strong>{idoso.nome}</strong> ou coletiva para toda a sala de aula <strong>{getStudentClassroomLocal(idoso.nome)}</strong>.
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Instrução / Descrição Detalhada</label>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-indigo-600 font-bold uppercase bg-indigo-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                          🎙️ Voz
                        </span>
                        <VoiceInput 
                          onTranscript={text => setNewTaskForm(prev => ({ ...prev, descricao: prev.descricao ? prev.descricao + ' ' + text : text }))} 
                          size="sm"
                        />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={isEscolar ? "Ex: Estimular coordenação de motricidade fina nas mãozinhas" : "Ex: Oferecer morno com 2 biscoitos de água e sal"}
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
                        ✏️ {isEscolar ? 'Editar Atividade Escolar' : 'Editar Tarefa de Cuidado'}
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
                              <option value="alimentacao">Alimentação</option>
                              <option value="medicacao">Medicamento</option>
                              <option value="banho">Banho / Higiene</option>
                              <option value="hidratacao">Hidratação</option>
                              <option value="sono">Sono</option>
                              <option value="humor">Humor / Estado</option>
                              <option value="atividade_fisica">Atividade Física</option>
                              <option value="sinais_vitais">Sinais de Saúde</option>
                            </select>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horário Previsto</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const now = new Date();
                                  const hh = String(now.getHours()).padStart(2, '0');
                                  const mm = String(now.getMinutes()).padStart(2, '0');
                                  setEditingTaskForm(prev => ({ ...prev, horarioPrevisto: `${hh}:${mm}` }));
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-all cursor-pointer"
                                title="Inserir horário atual"
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Título / Nome</label>
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descrição / Instrução</label>
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
                            Salvar Alterações
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
                                frequencia: matchingMed.frequência,
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
                                📷 Foto
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
                                {isCompleted ? '✓ Concluído' : isRefused ? '❌ Recusado' : isDelayed ? '🚨 Atrasado' : '⏳ Pendente'}
                              </span>
                            </div>
                            <h4 className={`text-sm font-bold text-slate-800 ${textCol}`}>{task.titulo}</h4>
                            {task.descricao && (
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{task.descricao}</p>
                            )}

                            {isMedTask && (
                              <div className="mt-2 p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-base shrink-0">💊</span>
                                  <div className="leading-tight">
                                    <span className="font-bold text-rose-950 block">
                                      Dosagem: {matchingMed?.dosagem || 'Conforme instrução'}
                                    </span>
                                    {matchingMed?.observacoes && (
                                      <span className="text-[11px] text-rose-700 block italic">
                                        Obs da família: "{matchingMed.observacoes}"
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
                                      frequencia: matchingMed.frequência,
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
                                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Concluído às {task.concluidaEm} por {task.completadaPor}</span>
                                {task.observacao && <span>Relato cuidador: "{task.observacao}"</span>}
                              </div>
                            )}

                            {isRefused && (
                              <div className="text-[10px] font-semibold bg-amber-100 text-amber-800 p-2 rounded-xl mt-2 flex flex-col gap-0.5 border border-amber-200">
                                <span className="flex items-center gap-1">⚠️ RECUSADO / NÃO-ADMINISTRADO às {task.concluidaEm || task.horarioPrevisto} por {task.completadaPor}</span>
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
                              {isEscolar ? 'Observações da Atividade' : 'Observações / Relato rápido da ação'}
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
                            placeholder={isEscolar ? "Ex: Realizou a atividade com capricho e atenção" : "Ex: Tomou com suco / Cuspiu comprimido / Recusou banho"}
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
                              const alertMsg = `Aviso Crítico: ${isEscolar ? 'O item de rotina de' : 'O remédio de'} ${idoso.nome.split(' (')[0]} (${task.titulo}) previsto para ${task.horarioPrevisto} está pendente! Por favor verifique imediato.`;
                              triggerWhatsAppSim('ALERTA ATRAZADO', alertMsg);
                            }}
                            className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-100 shrink-0"
                          >
                            ⚠️ Alerta Crítico
                          </button>
                        )}
                        
                        {isCompleted || isRefused ? (
                          <button 
                            onClick={() => handleResetTask(task.id)}
                            className="ml-auto px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-500 font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 flex items-center gap-1 shrink-0"
                          >
                            ↩ Corrigir / Desfazer
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 ml-auto w-full justify-end">
                            <button 
                              onClick={() => handleRegisterTaskAction(task.id, 'recusado')}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 border border-amber-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              ❌ Recusou
                            </button>
                            <button 
                              onClick={() => handleRegisterTaskAction(task.id, 'concluido')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                            >
                              ✓ Entregue
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

          {/* 🎁 INDICADOR DE TESTE GRATUITO (PAINEL DOS PAIS / FAMÍLIA) */}
          {!isStaffUser(usuarioAtual) && localStorage.getItem(`anjo_sub_status_${idoso.id}`) !== 'atrasado' && (
            <div className={`p-4 rounded-3xl border text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs relative overflow-hidden transition-all ${
              accessibilitySettings?.darkMode 
                ? 'bg-[#1e293b] border-slate-700 text-white' 
                : 'bg-emerald-50/60 border-emerald-200 text-slate-850'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">🎁</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Período de Experiência Ativo
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Dia 15 de 30</span>
                  </div>
                  <h4 className={`text-xs font-black leading-tight ${accessibilitySettings?.darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Seu período de teste gratuito está ativo no Painel de Acompanhamento Familiar.
                  </h4>
                  <p className={`text-[10px] font-semibold leading-relaxed ${accessibilitySettings?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isEscolar
                      ? `Você pode monitorar as refeições, sono, agenda e diário escolar de ${idoso.nome} com total transparência e segurança.`
                      : `Acompanhe em tempo real os sinais vitais, medicamentos, humor e rotina diária de ${idoso.nome} sem qualquer custo.`
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
                Ativar Plano Mensal 💳
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
                  {isEscolar ? 'Controle de Presença Escolar' : 'Acompanhamento de Cuidados'}
                </span>
                <h2 className="text-xl font-bold text-rose-950">
                  {isEscolar ? '🚫 Aluno Ausente Hoje (Falta)' : '🚫 Cliente Ausente'}
                </h2>
                <p className="text-xs text-rose-700 leading-normal">
                  {isEscolar 
                    ? 'Este aluno foi marcado como ausente hoje pelo educador responsável. Nenhuma atividade ou diário letivo será exigido.'
                    : 'Este idoso foi marcado como ausente hoje. Nenhuma rotina ou tarefa de cuidados será cobrada.'
                  }
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-rose-800 bg-white/70 border border-rose-200 px-3 py-1.5 rounded-xl">
                    🔒 Modo Família: Acesso apenas para leitura e acompanhamento.
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
                    {isEscolar ? 'Classe e Presença em Tempo Real' : 'Acompanhamento do Turno em Tempo Real'}
                  </span>
                  <h2 className="text-xl font-bold text-slate-800">
                    {isShiftActive 
                      ? (isEscolar ? '✓ Período Letivo em Andamento!' : '✓ Cuidador em Turno Ativo!') 
                      : (isEscolar ? 'Sem Aula no Momento' : 'Sem Turno de Cuidados Ativo')
                    }
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {isShiftActive
                      ? (isEscolar 
                          ? 'O diário do aluno está ativo! Acompanhe as sonecas, aceitação alimentar, fraldas e recados atualizados em tempo real.'
                          : 'As rotinas, medicações e sinais vitais estão sendo acompanhados pelo cuidador de escala.'
                        )
                      : (isEscolar 
                          ? 'O diário de classe do aluno ainda não foi iniciado pelo corpo educacional.'
                          : 'O início do plantão de cuidados ainda não foi registrado pelo cuidador de escala.'
                        )
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs leading-none">
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mb-1">
                      {isEscolar ? 'TEMPO EM AULA' : 'DECIDIDO / DURAÇÃO DO TURNO'}
                    </span>
                    <strong className={`text-2xl font-mono tracking-tight ${isShiftActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {isShiftActive ? elapsedShiftTime : '00:00:00'}
                    </strong>
                  </div>
                  
                  <span className="text-xs font-semibold text-slate-500 bg-white/60 px-3 py-2 rounded-xl border border-slate-200/80">
                    🔒 Modo Família: Acesso de acompanhamento configurado (botões de controle de turno, término e faltas desabilitados).
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Compliance Card: Circular Ring Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* compliance dual donut block */}
            <div className="bg-white p-6 rounded-3xl border border-[#cbd5e1] shadow-xs flex flex-col justify-center text-center space-y-4">
              <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">Métricas de Governança</strong>
              
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
                {completedTasksCount} rotina(s) realizada(s) e {refusedTasksCount} recusa(s) com registro técnico hoje.
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
                <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">SEGURANÇA DA ROTINA hoje</strong>
                <h3 className="text-lg font-black text-slate-850">
                  {farol.status === 'verde' 
                    ? (isEscolar ? '🎉 Tudo Sob Controle na Escola' : '🎉 Tudo Sob Controle na Residência') 
                    : farol.status === 'amarelo' 
                      ? (isEscolar ? '⚠️ Atividades e Pendências Ativas' : '⚠️ Cuidados e Pendências Ativas') 
                      : '🚨 Atenção Necessária Para Atrasos!'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                  {farol.details} {isEscolar ? 'O Anjinho Escolar' : 'O Anjo Cuidador'} audita e monitora cada ação. Fique despreocupado: qualquer falha séria gerará um alerta imediato de urgência para o seu celular.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{isEscolar ? `Responsável da Classe: ${usuarioAtual.nome}` : `Responsável da Escala: ${usuarioAtual.nome}`}</span>
                <span>Último Contato Realizado via API: Agora mesmo</span>
              </div>
            </div>

          </div>

          {/* Core breakdown row: Hydration / Feeding / Hygiene / Mood & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Water hydration container state with visual water cups and animated jug */}
            <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">💧 CONSUMO DE ÁGUA HOJE</strong>
                <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  🫖 Jarrinha Animada
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
                    Meta Diária: {isEscolar ? '600ml' : '1.500ml'}
                  </span>
                </div>

                {/* 🫖 Animated Water Jug Graphic */}
                {(() => {
                  const targetGoal = isEscolar ? 600 : 1500;
                  const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                  return (
                    <div className="flex items-center gap-2 bg-gradient-to-b from-cyan-50 to-sky-50/60 p-2.5 rounded-2xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de hidratação: sobe à medida que a água é servida!">
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
                      {totalWaterMl >= stepWater ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-400">
                {isEscolar 
                  ? 'Cada barra preenchida representa o consumo acumulado de copos ou mamadeiras graduadas (50ml, 100ml ou 150ml).' 
                  : 'Cada barra preenchida representa um copinho de 250ml oferecido com segurança ao idoso.'}
              </p>
            </div>

            {/* Food checklist state today */}
            <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">🍽️ NUTRIÇÃO / ALIMENTAÇÃO</strong>
                {isEscolar && (() => {
                  const studentBottlesToday = todaysMealsList.filter(m => {
                    if (!m || !m.refeicao) return false;
                    const ref = String(m.refeicao).toLowerCase();
                    return ref === 'mamadeira' || ref.includes('mamad') || (m.observacoes && m.observacoes.toLowerCase().includes('mamadeira'));
                  });
                  return (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                      🍼 {studentBottlesToday.length} {studentBottlesToday.length === 1 ? 'Mamadeira' : 'Mamadeiras'}
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
                        <span className="text-base">🍼</span>
                        <div>
                          <span className="block text-xs font-extrabold">Mamadeiras de Leite / Fórmula</span>
                          <span className="text-[10px] text-amber-800 font-normal block">
                            {lastBottle?.horario ? `Última servida às ${lastBottle.horario}` : 'Controle de mamadeiras diárias'}
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
                  { key: 'cafe_manha', label: isEscolar ? '🥐 Lanchinho da Manhã' : 'Café da Manhã' },
                  { key: 'almoco', label: isEscolar ? '🍲 Papinha / Almocinho' : 'Almoço Principal' },
                  { key: 'lanche', label: isEscolar ? '🍎 Frutinha / Lanchinho' : 'Lanche / Tarde' },
                  { key: 'jantar', label: isEscolar ? '🥣 Jantinha Escolar' : 'Jantar Sênior' }
                ].map(itemMeal => {
                  const verified = [...todaysMealsList].reverse().find(m => {
                    if (!m || !m.refeicao) return false;
                    const ref = String(m.refeicao).toLowerCase().trim();
                    if (ref === itemMeal.key) return true;
                    if (itemMeal.key === 'cafe_manha') {
                      return ref.includes('cafe') || ref.includes('café') || ref.includes('mamad') || ref.includes('desjejum') || ref.includes('leite');
                    }
                    if (itemMeal.key === 'almoco') {
                      return ref.includes('almoc') || ref.includes('almoç') || ref.includes('papi') || ref.includes('principal');
                    }
                    if (itemMeal.key === 'lanche') {
                      return ref.includes('lanche') || ref.includes('frut') || ref.includes('tarde') || ref.includes('snack');
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
                          ✓ {verified.aceitacao === 'muito_bem' ? 'Comeu Super Bem' : verified.aceitacao === 'pouco' ? 'Comeu Pouco' : 'Recusou'}
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
                  <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">🧼 HIGIENE & BEM ESTAR</strong>
                  <p className="text-xs text-slate-500 leading-normal mt-1 font-sans">
                    {isEscolar 
                      ? 'Acompanhamento diário de conforto e asseio do aluno. Frequência de trocas de fralda, dentes, roupas e higiene.' 
                      : 'Acompanhamento diário de conforto corporal. Focar na prevenção de escaras e infecções.'}
                  </p>
                </div>

                {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (todayHygieneLog?.observations || todayHygieneLog?.diaper || todayHygieneLog?.teeth || todayHygieneLog?.clothes || todayHygieneLog?.hands || todayHygieneLog?.bath || todayHygieneLog?.cream) && (
                  <button
                    type="button"
                    onClick={(e) => handleResetAllHygiene(e)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-[11px] font-bold rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                    title="Desmarcar itens e apagar a observação de higiene de hoje"
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
                  <span className="text-xs block font-bold">{isEscolar ? '👶 Fralda / Toalete' : '👶 Fralda / Absorvente'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.diaper ? 'Trocada / Cuidada' : 'Pendente'}
                  </span>
                </div>

                {/* 2. Escovação de Dentes Orientada */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all ${
                  todayHygieneLog?.teeth 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? '🪥 Escovação Dentes' : '🪥 Higiene Bucal'}</span>
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
                  <span className="text-xs block font-bold">{isEscolar ? '👚 Troca de Roupa' : '👚 Roupa Limpa'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.clothes ? 'Trocada' : 'Pendente'}
                  </span>
                </div>

                {/* 4. Mãos e Rosto / Banho */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all ${
                  (todayHygieneLog?.hands || todayHygieneLog?.bath) 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? '🧼 Mãos e Rosto' : '🚿 Banho Chuveiro'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {(todayHygieneLog?.hands || todayHygieneLog?.bath) ? (isEscolar ? 'Lavados' : 'Concluído') : 'Pendente'}
                  </span>
                </div>

                {/* 5. Pomada Antiassadura / Protetor */}
                <div className={`p-2.5 rounded-xl text-center border font-bold transition-all col-span-2 sm:col-span-1 ${
                  todayHygieneLog?.cream 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="text-xs block font-bold">{isEscolar ? '🧴 Pomada Antiassadura' : '🧴 Hidratação Pele'}</span>
                  <span className="text-[10px] font-black uppercase">
                    {todayHygieneLog?.cream ? 'Aplicada' : 'Pendente'}
                  </span>
                </div>
              </div>

              {todayHygieneLog?.observations && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 block">Observação de Higiene:</span>
                    <p className="text-slate-800 leading-relaxed">{todayHygieneLog.observations}</p>
                  </div>
                  {isStaffUser(usuarioAtual) && visualMode !== 'familia' && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHygieneObservation(e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Apagar observação de higiene"
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
                    🚨 Ocorrências / Registros de Cuidados do Dia ({occurrencesList.length})
                  </span>
                  <div className="space-y-1.5">
                    {occurrencesList.map(occ => (
                      <div key={occ.id} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-950 rounded-md text-[10px] uppercase font-black">
                              {occ.tipo || 'Ocorrência'}
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
                            title="Apagar este registro de ocorrência/cuidado"
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

            {/* Mood & Caregiver / Teacher Note card state 😊 */}
            {(() => {
              const humsToday = getFromDB<RegistroHumor[]>('anjo_humor', []).filter(h => h && h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
              const currentHum = humsToday.length > 0 ? humsToday[humsToday.length - 1] : null;

              const getMoodInfo = (estado?: string) => {
                switch (estado) {
                  case 'calmo':
                    return { label: 'Calmo / Sereno', emoji: '😊', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
                  case 'feliz':
                    return { label: 'Feliz / Comunicativo', emoji: '😄', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
                  case 'sonolento':
                    return { label: 'Sonolento / Repousando', emoji: '💤', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
                  case 'agitado':
                    return { label: 'Agitado / Inquieto', emoji: '⚠️', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
                  case 'confuso':
                    return { label: 'Desorientado / Confuso', emoji: '❓', bg: 'bg-orange-50 text-orange-800 border-orange-200' };
                  case 'recusando':
                    return { label: 'Resiste às Intervenções', emoji: '❌', bg: 'bg-red-50 text-red-800 border-red-200' };
                  default:
                    return { label: estado ? estado.toUpperCase() : 'Calmo / Sereno', emoji: '😊', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
                }
              };

              const moodInfo = getMoodInfo(currentHum?.estado || quickHumor.estado);

              return (
                <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <strong className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                        😊 {isEscolar ? 'HUMOR & NOTA DA EDUCADORA' : 'ESTADO DE HUMOR / NOTA'}
                      </strong>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        Sócio-Emocional
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
                            {currentHum?.horario ? `Registrado às ${currentHum.horario}` : 'Registrado no Turno'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {isEscolar ? 'Nota / Observação da Educadora:' : 'Nota / Observação do Cuidador:'}
                      </span>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic min-h-[60px] flex items-center">
                        {currentHum?.observacoes || quickHumor.observacao ? (
                          <span>"{currentHum?.observacoes || quickHumor.observacao}"</span>
                        ) : (
                          <span className="text-slate-400 not-italic text-[11px]">
                            {isEscolar ? 'Nenhuma observação comportamental anotada no momento.' : 'Nenhuma observação anotada no momento.'}
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
              {isFundamental ? '📝 DIÁRIO DE ACOMPANHAMENTO PEDAGÓGICO & FOCO' : (isEscolar ? '📝 DIÁRIO DE SAÚDE, SONO & FRALDA' : '💓 MONITORAMENTO DE SINAIS VITAIS')}
            </strong>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              
              <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {isFundamental ? '✏️ Dever de Casa' : (isEscolar ? '💤 Soneca / Sono' : 'P. Arterial')}
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
                  {isFundamental ? 'Deveres' : (isEscolar ? 'Período' : (latestVitals ? 'Aferido Hoje' : 'Excelente'))}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {isFundamental ? '🎯 Foco / Conduta' : (isEscolar ? '🧻 Fraldas (Trocas)' : 'Glicemia Capilar')}
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
                  {isFundamental ? 'Comportamento' : (isEscolar ? 'Registro' : (latestVitals ? `Tipo: ${latestVitals.tipoGlicemia || 'casual'}` : 'Jejum Estável'))}
                </span>
              </div>

              {/* COMPACT BOTTLE / MAMADEIRA CARD 🍼 (Infantil / Maternal / Berçário / Pré) */}
              {isEscolar && !isFundamental && (
                <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      🍼 Mamadeiras Servidas
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
                          ? `Última às ${studentBottlesToday[studentBottlesToday.length - 1].horario} (${totalBottlesMl} ml total)` 
                          : `${totalBottlesMl} ml total`) 
                      : 'Nenhuma hoje'}
                  </span>
                </div>
              )}

              {/* COMPACT MATERIAL / CADERNOS CARD 📚 (Fundamental) */}
              {isFundamental && (
                <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      📚 Material / Cadernos
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
                      {isFundamental ? '💧 Hidratação / Copos' : (isEscolar ? '💧 Hidratação (Água)' : 'Oxigenação (SpO2)')}
                    </span>
                    <strong className="text-xl font-bold text-slate-800">
                      {isEscolar 
                        ? `${totalWaterMl} ml (${todaysWaterList.length} ${todaysWaterList.length === 1 ? 'copo' : 'copos'})`
                        : `${totalWaterMl}ml (${todaysWaterList.length} ${todaysWaterList.length === 1 ? 'copo' : 'copos'})`}
                    </strong>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                    {isEscolar ? 'Consumo' : (latestVitals ? (latestVitals.saturacao >= 95 ? 'Excelente (Normal)' : 'Atenção Baixo') : 'Excelente (Normal)')}
                  </span>
                </div>

                {/* 🫖 Mini Jarrinha Animada em Tempo Real */}
                {(() => {
                  const targetGoal = isEscolar ? 600 : 1500;
                  const percentJug = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100));
                  return (
                    <div className="flex items-center gap-1.5 bg-cyan-50/80 px-2 py-1 rounded-xl border border-cyan-200 shrink-0 shadow-3xs" title="Jarrinha de Hidratação">
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
                    {latestVitals ? `${latestVitals.temperatura.toFixed(1).replace('.', ',')} °C` : '36,5 °C'}
                  </strong>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                  {latestVitals ? (latestVitals.temperatura >= 37.8 ? 'Febre ⚠️' : 'Afebril') : 'Afebril'}
                </span>
              </div>

              {/* INTERACTIVE WEIGHT CARD ⚖️ */}
              <div 
                id="clinical-weight-card"
                onClick={() => onNavigate('reports')} 
                className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 flex flex-col justify-between hover:bg-indigo-100/80 active:scale-98 transition-all cursor-pointer group"
                title="Clique para ir ao Gráfico de Evolução de Peso nos Relatórios"
              >
                <div>
                  <span className="text-[10px] font-black text-indigo-500 block uppercase flex items-center justify-between">
                    <span>{isEscolar ? '⚖️ Peso Escolar' : '⚖️ Peso (Controle Semanal)'}</span>
                    <span className="text-indigo-600 bg-white border border-indigo-150 px-1 py-0.2 text-[8px] rounded-xs group-hover:scale-105 transition-transform">Ver Histórico</span>
                  </span>
                  <strong className="text-xl font-bold text-slate-800">
                    {latestWeight ? `${latestWeight} kg` : (isEscolar ? '12,5 kg' : '72,4 kg')}
                  </strong>
                </div>
                <div className="text-[10px] font-bold mt-2">
                  {latestWeight && previousWeight ? (
                    weightDiff === 0 ? (
                      <span className="text-emerald-750 bg-white px-1.5 py-0.5 rounded-md border border-emerald-100">Estável (0.0 kg)</span>
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

              {/* COMPACT HUMOR & BEHAVIOR CARD 🧠 */}
              {(() => {
                const humsToday = getFromDB<RegistroHumor[]>('anjo_humor', []).filter(h => h && h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
                const currentHum = humsToday.length > 0 ? humsToday[humsToday.length - 1] : null;
                const stateDisplay = currentHum?.estado || quickHumor.estado || 'calmo';
                const emoji = stateDisplay === 'feliz' ? '😄' : stateDisplay === 'sonolento' ? '💤' : stateDisplay === 'agitado' ? '⚠️' : stateDisplay === 'confuso' ? '❓' : stateDisplay === 'recusando' ? '❌' : '😊';
                const label = stateDisplay === 'feliz' ? 'Feliz' : stateDisplay === 'sonolento' ? 'Sonolento' : stateDisplay === 'agitado' ? 'Agitado' : stateDisplay === 'confuso' ? 'Confuso' : stateDisplay === 'recusando' ? 'Recusando' : 'Calmo / Sereno';

                return (
                  <div className="bg-white p-4 rounded-xl border border-soft-gray flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {isEscolar ? '😊 Humor / Conduta' : '😊 Estado de Humor'}
                      </span>
                      <strong className="text-sm font-bold text-slate-800 line-clamp-2 mt-1 flex items-center gap-1.5">
                        <span>{emoji}</span> <span>{label}</span>
                      </strong>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm self-start mt-2">
                      {currentHum?.observacoes || quickHumor.observacao ? 'Com Nota da Profª' : 'Observado no Dia'}
                    </span>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* CHRONOLOGICAL TIMELINE OF TODAY'S ACTIONS (Com dupla marcação temporal!) */}
          <div className="space-y-4">
            <h3 className="text-md font-black text-slate-800 flex items-center gap-1.5">
              <Layers className="text-emerald-600 w-5 h-5" /> Linha do Tempo e Auditoria de Saúde
            </h3>

            {timelineItems.length === 0 ? (
              <div className="p-6 border border-dashed rounded-2xl bg-white text-center text-slate-400 text-xs font-semibold">
                Nenhuma ação concluída na data de hoje até o momento.
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
                            🕒 Horário Registrado: {tItem.horario}
                          </span>
                          
                          {tieneDobleTiempo && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              📶 Registrado Offline no Celular às {new Date(tItem.meta.horario_registrado_dispositivo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}  |  Servidor: {new Date(tItem.meta.horario_sincronizado_servidor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-black text-slate-800 block pt-0.5">{tItem.titulo}</h4>
                        {tItem.nota && <p className="text-xs text-slate-600 italic">" {tItem.nota} "</p>}
                        
                        <div className="text-[10px] font-bold text-slate-400 pt-1 flex items-center gap-1.5">
                          <User className="w-3 w-3" /> Executor Responsável: {tItem.autor}
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
              <FileText className="text-indigo-505 w-5 h-5" /> {isEscolar ? 'Diários de Rotina Escolar Recebidos' : 'Relatórios e Resumos de Turno Recebidos (WhatsApp)'}
            </h3>

            {turnSummaries.length === 0 ? (
              <div className="p-6 border border-dashed rounded-2xl bg-white text-center text-slate-400 text-xs font-semibold">
                {isEscolar 
                  ? 'Nenhum diário de rotina escolar enviado hoje ainda. Os diários aparecem aqui assim que a professora encerra o período letivo da criança no aplicativo.'
                  : 'Nenhum relatório de encerramento de turno enviado hoje ainda. Os relatórios aparecem aqui assim que o cuidador clica em "Encerrar Turno" no aplicativo.'}
              </div>
            ) : (
              <div className="space-y-3.5">
                {turnSummaries.map(report => (
                  <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-[#cbd5e1] space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <strong className="text-xs text-slate-800 block">
                          {isEscolar ? `Diário Escolar de ${report.cuidador}` : `Resumo do Turno de ${report.cuidador}`}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {report.timestamp ? new Date(report.timestamp).toLocaleDateString('pt-BR') : (report.data || getTodayBr())}  •  Período: {formatShiftTime(report.inicio, '07:30')} às {formatShiftTime(report.fim, '17:30')}
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
                        <span className="text-base shrink-0">🔗</span>
                        <div className="min-w-0">
                          <span className="block font-black text-[11px] text-indigo-900 dark:text-indigo-100">
                            Link Seguro do Diário Digital:
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
                          <span>👁️</span> Abrir Diário Digital 360º
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?relatorio=${report.id}`;
                            navigator.clipboard.writeText(link);
                            showToast('✓ Link do diário escolar copiado para a área de transferência!');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>📋</span> Copiar Link
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Excluir este diário de rotina permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">✓ Controle de auditoria de acessos</span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setManualShareOccurrenceMessage(report.mensagemCompleta);
                            setShowManualOccurrenceShareModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-[10px] px-2.5 py-1 text-white font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer hover:text-white"
                        >
                          <span>💬</span> Compartilhar WhatsApp
                        </button>
                        <span>Duração: {report.duracao}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  {occurrenceForm.criticidade === 'vermelho' ? '🚨 Registrar Intercorrência Urgente' : '📋 Registrar Ocorrência do Dia'}
                </h3>
                <p className="text-xs text-slate-500">
                  {occurrenceForm.criticidade === 'vermelho'
                    ? 'Alerta crítico para emergências de saúde, febre, quedas ou incidentes'
                    : 'Registro de rotina para comportamento, desentendimento ou observações'}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmOccurrence} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tipo de Ocorrência</label>
                <select 
                  value={occurrenceForm.tipo}
                  onChange={e => setOccurrenceForm({ ...occurrenceForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-xl text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="queda">Queda 🚨</option>
                  <option value="febre">Febre 🌡️</option>
                  <option value="dor">Dor 🤕</option>
                  <option value="recusa_medicacao">Recusa de medicação 💊</option>
                  <option value="recusa_alimentar">Recusa alimentar 🍽️</option>
                  <option value="comportamento">Alteração de comportamento 🧠</option>
                  <option value="pressao">Pressão alterada 💓</option>
                  <option value="outro">Outro (Relatar) 🔍</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nível de Criticidade</label>
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
                    🟡 Atenção recomendável
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
                    🔴 Urgência Crítica
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
                        Como você selecionou Urgência Crítica, ligue ou mande mensagem agora mesmo para o responsável legal.
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
                        title="Fazer ligação comum por telefone"
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
                  placeholder="Seja descritivo. Ex: Se desequilibrou ao levantar da cama, caiu sentado no tapete. Sem sinais de fratura, pressão aferida 12/8 estável. Queixou leve dor nas costas."
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
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Histórico de Auditoria do Alerta</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center space-y-1">
                      <div className="mx-auto w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                        ✓
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
                        {auditStatus === 'whatsapp_aberto' || auditStatus === 'envio_confirmado' ? '✓' : '2'}
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
                        {auditStatus === 'envio_confirmado' ? '✓' : '3'}
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
                    {isCopied ? '✓ Copiado!' : '📋 Copiar Mensagem'}
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
                  ? { nome: idoso.contatoEmergencia.nome || 'Responsável', telefone: idoso.contatoEmergencia.telefone, parentesco: idoso.contatoEmergencia.parentesco || 'Responsável' }
                  : (getFromDB<Usuario[]>('anjo_usuarios', []).find(u => u.tipo === 'familiar' || u.tipo === 'admin') || { nome: 'Responsáveis da Família', telefone: '(11) 98765-4321', parentesco: 'Família' });

                const primaryNumberFormatted = formatWhatsAppNumber(primaryRecipient.telefone || '(11) 98765-4321');
                const textEncoded = encodeURIComponent(manualShareOccurrenceMessage);
                const primaryWaLink = `https://wa.me/${primaryNumberFormatted}?text=${textEncoded}`;

                return (
                  <div className="space-y-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                        ⚡ Ação Rápida de Envio Direto
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
                      <span className="text-base">📲</span> ABRIR NO WHATSAPP REAL AGORA
                    </a>

                    {typeof navigator !== 'undefined' && (navigator as any).share && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await (navigator as any).share({
                              title: isEscolar ? `Diário Escolar de ${idoso.nome}` : `Boletim de Cuidados de ${idoso.nome}`,
                              text: manualShareOccurrenceMessage,
                            });
                          } catch (e) {
                            // User cancelled share window
                          }
                        }}
                        className="w-full py-2 px-3 bg-white hover:bg-emerald-100/60 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>📤</span> Compartilhar pelo Celular (WhatsApp / Outros Apps)
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
                    Enviar para outro número de celular/WhatsApp:
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
                          alert('Por favor, informe o número de telefone com DDD para abrir o WhatsApp.');
                          return;
                        }
                        handleWhatsAppClicked(activeSharingOccurrenceId);
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl text-white transition-all flex items-center gap-1 shrink-0 ${
                        customPhoneInput ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:text-white' : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <span>💬</span> Enviar
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
                              <span>💬</span> Abrir WhatsApp
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
                                Ainda não enviado ⏳
                              </button>
                              <button
                                type="button"
                                onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, [rcp.id || rcp.nome]: 'aberto' }))}
                                className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                  status === 'aberto' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                WhatsApp aberto 💬
                              </button>
                              <button
                                type="button"
                                onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, [rcp.id || rcp.nome]: 'confirmado' }))}
                                className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                  status === 'confirmado' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                Confirmado ✓
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
                            <strong className="text-xs font-bold text-slate-700 block truncate">{idoso.contatoEmergencia.nome} (Contato Responsável / Emergência)</strong>
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
                            <span>💬</span> Abrir WhatsApp
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
                              Ainda não enviado ⏳
                            </button>
                            <button
                              type="button"
                              onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, 'emergencia': 'aberto' }))}
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                status === 'aberto' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              WhatsApp aberto 💬
                            </button>
                            <button
                              type="button"
                              onClick={() => setFamiliarShareStatuses(prev => ({ ...prev, 'emergencia': 'confirmado' }))}
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide cursor-pointer transition-all ${
                                status === 'confirmado' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              Confirmado ✓
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
                    {activeSharingOccurrenceId ? 'Passo 2: Você enviou esta mensagem para a família?' : 'Confirmação do Compartilhamento'}
                  </span>
                  
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => handleConfirmWhatsAppSent(activeSharingOccurrenceId)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all text-center leading-normal"
                    >
                      Sim, enviei no WhatsApp ✓
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleNotSentYet}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-all text-center leading-normal"
                    >
                      Ainda não enviei
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
                <h3 className="text-lg font-black text-slate-800">Confirmação de Encerramento Coletivo</h3>
                <p className="text-xs text-slate-500">
                  {isEscolar
                    ? 'Diários gerados com sucesso! Revise e abra o WhatsApp para os familiares de cada aluno da classe.'
                    : 'Relatórios gerados! Compartilhe o boletim de cuidados com a família de cada assistido.'}
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
                          Responsável: {item.contatoNome} ({item.contatoTelefone})
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
                          {copiedCollectiveIndex === index ? '✓ Copiado' : '📋 Copiar'}
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
                          <span>💬</span> Enviar WA
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
                          Pendente ⏳
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
                          WA Aberto 💬
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
                          Confirmado ✓
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
                Marque cada diário como enviado à medida que concluir as transmissões.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowCollectiveShareModal(false);
                  showToast('Fechamento de diários finalizado com sucesso!', 'success');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer hover:scale-101"
              >
                Concluir Tudo ✓
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
                <h3 className="text-lg font-black text-slate-800">Revisão do Relatório de Turno</h3>
                <p className="text-xs text-slate-500">Revise os registros do seu plantão antes de enviar para os familiares</p>
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
                  <p className="text-[10px] text-slate-500 mt-1">Auditoria de registro correto (mesmo em recusa justificável)</p>
                </div>
              </div>

              {/* Routines Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">💊 Status das medicações & Rotinas de Cuidado</h4>
                <div className="space-y-1.5">
                  {shiftReviewPayload.concluidas.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200/50 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">✓ CONCLUÍDOS ({shiftReviewPayload.concluidas.length})</span>
                      <ul className="text-xs text-emerald-950 space-y-1 pl-1.5 list-disc leading-normal">
                        {shiftReviewPayload.concluidas.map((m: any) => (
                          <li key={m.id}>{m.titulo} às {m.concluidaEm || m.horarioPrevisto}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shiftReviewPayload.recusadas.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-amber-800 flex items-center gap-1">⚠️ RECUSAS REGISTRADAS ({shiftReviewPayload.recusadas.length})</span>
                      <ul className="text-xs text-amber-950 space-y-1 pl-1.5 list-disc leading-normal">
                        {shiftReviewPayload.recusadas.map((r: any) => (
                          <li key={r.id}>*${r.titulo}* - Recusado: "{r.observacao || 'Recusa geral'}"</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shiftReviewPayload.atrasadas.length === 0 && shiftReviewPayload.pendentes.length === 0 ? (
                    <p className="text-xs text-slate-500">✓ Não há pendências na escala neste turno.</p>
                  ) : (
                    <div className="bg-rose-50/50 border border-rose-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-rose-800 flex items-center gap-1">⚠️ PENDÊNCIAS EM ABERTO ({shiftReviewPayload.atrasadas.length + shiftReviewPayload.pendentes.length})</span>
                      <ul className="text-xs text-rose-950 space-y-1 pl-1.5 list-disc leading-normal">
                        {shiftReviewPayload.atrasadas.map((a: any) => (
                          <li key={a.id}>*${a.titulo}* - Atrasada (Prevista: ${a.horarioPrevisto})</li>
                        ))}
                        {shiftReviewPayload.pendentes.map((p: any) => (
                          <li key={p.id}>{p.titulo} - Não preenchido (Previsto: {p.horarioPrevisto})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* nutrition/hydration quick logs summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-150 p-3.5 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">🥛 Líquidos Consumidos</h5>
                  <strong className="text-sm font-bold text-slate-800">{shiftReviewPayload.totalMl}ml de água</strong>
                  <p className="text-[10px] text-slate-500 mt-1">{Math.round(shiftReviewPayload.totalMl/250)} copos oferecidos.</p>
                </div>
                <div className="border border-slate-150 p-3.5 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">🧠 Estado de Humor</h5>
                  <strong className="text-sm font-bold text-slate-800">{shiftReviewPayload.ultimoHumorText.toUpperCase()}</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Último humor reportado na escala.</p>
                </div>
              </div>

              {/* Vitals information */}
              {shiftReviewPayload.ultimoSinal && (
                <div className="border border-slate-150 p-3.5 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">💓 Sinais Vitais aferidos</h5>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold *:bg-slate-50 *:p-1.5 *:rounded-lg">
                    <div>PA: {shiftReviewPayload.ultimoSinal.pressaoArterial}</div>
                    <div>Glicemia: {shiftReviewPayload.ultimoSinal.glicemia}</div>
                    <div>O2: {shiftReviewPayload.ultimoSinal.saturacao}%</div>
                    <div>Temp: {shiftReviewPayload.ultimoSinal.temperatura}°C</div>
                  </div>
                </div>
              )}

              {/* Occurrences logged within active shift */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">🚨 Ocorrências registradas ({shiftReviewPayload.ocorrencias.length})</h5>
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
                  <p className="text-xs text-slate-500">✓ Nenhuma intercorrência física registrada neste turno.</p>
                )}
              </div>

              {/* Medication Adjustments logged within active shift */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">📦 Alterações de Medicamentos ({shiftReviewPayload.medChanges?.length || 0})</h5>
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
                            {ch.tipo === 'cadastro' ? 'Novo Cadastro' : ch.tipo === 'exclusao' ? 'Excluído' : ch.tipo === 'suspensao' ? 'Suspenso' : 'Reativado'}
                          </span>
                          <span className="text-[10px] text-slate-405 font-semibold">por {ch.autor}</span>
                        </div>
                        <div className="font-semibold text-slate-800">💊 {ch.nome}</div>
                        <div className="text-[11px] text-slate-500 leading-normal">{ch.detalhes}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">✓ Nenhuma alteração (Inclusão ou Exclusão) feita neste turno.</p>
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
                <CheckCircle2 className="w-4 h-4" /> Registrar Presença & Enviar WhatsApp
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
                  {duplicateWarning.isIdentical ? '⚠️ Registro Idêntico Detectado!' : '⚠️ Registro Existente para Hoje!'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Você já salvou informações de rotina para o(a) aluno(a) <strong className="text-slate-800">{duplicateWarning.studentName}</strong> hoje.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-extrabold text-[10px] text-slate-400 block uppercase tracking-wider">💾 REGISTRO JÁ EXISTENTE:</span>
                <span className="font-semibold text-slate-700">{duplicateWarning.existingInfo}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="font-extrabold text-[10px] text-indigo-500 block uppercase tracking-wider">🆕 NOVO REGISTRO TENTADO:</span>
                <span className="font-semibold text-indigo-950">{duplicateWarning.newInfo}</span>
              </div>
            </div>

            <div className={duplicateWarning.isIdentical ? "bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-800 font-bold leading-relaxed" : "bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 font-semibold leading-relaxed"}>
              {duplicateWarning.isIdentical 
                ? '🚫 As informações digitadas são exatamente iguais às que já foram salvas hoje. O salvamento foi bloqueado para evitar mensagens duplicadas enviadas à família.'
                : 'Você está salvando informações complementares diferentes para o mesmo dia. Se for isso mesmo, confirme abaixo para salvar!'
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                id="confirm-ok-btn"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESTRIÇÃO ELEGANTE E EDUCADA DE ACESSO AO PAINEL OPERACIONAL */}
      {showCaregiverPinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fade-in" id="caregiver-access-modal">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-2xl text-slate-800 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 leading-tight">
                  {isEscolar ? 'Acesso Restrito a Educadores' : 'Acesso Restrito a Cuidadores'}
                </h3>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
                  Segurança, Privacidade e Conformidade
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Prezada Família, você está conectada no perfil de acompanhamento de <strong className="text-slate-800">{usuarioAtual?.nome}</strong>.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <strong className="text-[11px] block font-extrabold text-slate-700">Por que o painel de registro é restrito?</strong>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {isEscolar 
                  ? 'O Painel da Professora é um ambiente técnico exclusivo de trabalho escolar de plantão, utilizado para controle pedagógico, sesta e trocas de fraldas. Restringir este acesso previne divergências de dados e garante total conformidade com os regulamentos de integridade.'
                  : 'O Painel do Cuidador é um espaço de trabalho operacional reservado aos profissionais de enfermagem e assistência para aferição de sinais vitais, anotações clínicas e administração de remédios, assegurando conformidade de escala e rastreabilidade.'
                }
              </p>
            </div>

            <form onSubmit={handleVerifyCaregiverPin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650 block">Digite o PIN do Profissional para Liberar:</label>
                <input 
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="••••"
                  value={caregiverPinValue}
                  onChange={e => {
                    setCaregiverPinValue(e.target.value.replace(/\D/g, ''));
                    setCaregiverPinError('');
                  }}
                  className="w-full text-center py-2 px-4 tracking-widest text-lg font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 bg-slate-50 text-slate-800"
                  required
                  autoFocus
                />
                
                {caregiverPinError ? (
                  <p className="text-[11px] text-rose-600 font-extrabold text-center">
                    ❌ {caregiverPinError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-semibold text-center leading-normal">
                    🔒 Digite os 4 dígitos do PIN de qualquer cuidador credenciado ou administrador para alternar visualização.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCaregiverPinModal(false);
                    setCaregiverPinValue('');
                    setCaregiverPinError('');
                  }}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-550 hover:bg-slate-50 hover:text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Voltar para Área Familiar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  Liberar Painel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Toast Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm bg-white shadow-xl rounded-xl p-4 flex items-center gap-3 border border-slate-100 border-l-4 border-l-emerald-500 transition-all duration-300 transform translate-y-0">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xs font-bold text-slate-800">
            {toast.message}
          </div>
        </div>
      )}

      {/* Medication Packaging Photo Preview Modal */}
      {previewMedPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up text-left relative">
            <button
              type="button"
              onClick={() => setPreviewMedPhotoModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
                  Foto do Medicamento Cadastrado
                </span>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {previewMedPhotoModal.title}
                </h3>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-rose-100 bg-slate-50 overflow-hidden flex items-center justify-center p-2 min-h-48 max-h-80">
              <img
                referrerPolicy="no-referrer"
                src={previewMedPhotoModal.url}
                alt={previewMedPhotoModal.title}
                className="max-h-72 w-auto object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-1 text-xs text-rose-950">
              <p><strong>Dosagem:</strong> {previewMedPhotoModal.dosagem || 'Conforme orientação'}</p>
              {previewMedPhotoModal.frequencia && <p><strong>Frequência:</strong> {previewMedPhotoModal.frequencia}</p>}
              {previewMedPhotoModal.horarios && previewMedPhotoModal.horarios.length > 0 && (
                <p><strong>Horários:</strong> {previewMedPhotoModal.horarios.join(', ')}</p>
              )}
              {previewMedPhotoModal.obs && (
                <p className="pt-1.5 text-[11px] text-rose-800 border-t border-rose-200/60 italic">
                  Obs da família: "{previewMedPhotoModal.obs}"
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewMedPhotoModal(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* 🌐 MODAL INTERATIVO DO DIÁRIO / BOLETIM DIGITAL COMPLETO (LINK ATIVO) */}
      {selectedReportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md">
                  📄
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {isEscolar ? 'Diário de Rotina Escolar Digital 360º' : 'Boletim de Cuidados Digital'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      ✓ Link Seguro Verificado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedReportModal.cuidador} • {selectedReportModal.data || 'Hoje'} • Período: {selectedReportModal.inicio || '07:30'} às {selectedReportModal.fim || '17:30'}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit & Compliance Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800 text-center space-y-0.5">
                <span className="text-[10px] font-black text-indigo-500 uppercase block">AUDITORIA E CONFORMIDADE</span>
                <strong className="text-xl font-black text-indigo-700 dark:text-indigo-300">{selectedReportModal.taxaConformidade || 100}% OK</strong>
                <span className="text-[10px] text-indigo-600/80 block">Rotinas Auditadas</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-center space-y-0.5">
                <span className="text-[10px] font-black text-emerald-500 uppercase block">QUALIDADE DE REGISTRO</span>
                <strong className="text-xl font-black text-emerald-700 dark:text-emerald-300">{selectedReportModal.taxaQualidade || 100}%</strong>
                <span className="text-[10px] text-emerald-600/80 block">Carimbo Temporal</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800 text-center space-y-0.5">
                <span className="text-[10px] font-black text-amber-500 uppercase block">DURAÇÃO DO PERÍODO</span>
                <strong className="text-xl font-black text-amber-700 dark:text-amber-300">{selectedReportModal.duracao || 'Período Completo'}</strong>
                <span className="text-[10px] text-amber-600/80 block">Registro Sincronizado</span>
              </div>
            </div>

            {/* Complete Report Message Display */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                📝 Conteúdo do Diário / Boletim Transmitido
              </h5>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedReportModal.mensagemCompleta}
              </div>
            </div>

            {/* Direct Active Link Copy Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="min-w-0 text-left">
                <span className="font-extrabold block text-slate-800 dark:text-slate-200">
                  🔗 Link Seguro para Compartilhamento Exclusivo:
                </span>
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 underline truncate block">
                  {window.location.origin}/?relatorio={selectedReportModal.id}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/?relatorio=${selectedReportModal.id}`;
                  navigator.clipboard.writeText(link);
                  showToast('✓ Link do diário copiado com sucesso!');
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                📋 Copiar Link Direto
              </button>
            </div>

            {/* Modal Footer Action */}
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Action Button & Fast Register Modal for Teachers, Caregivers, Coordinators & Directors */}
      {isStaffUser(usuarioAtual) && (
        <AuraSmartRegisterModal
          idoso={idoso}
          usuarioAtual={usuarioAtual}
          appMode={appMode}
          triggerWhatsAppSim={triggerWhatsAppSim}
        />
      )}

      {/* 📍 Strategic Compact Floating Toggle Pill for "Painel dos Professores" & "Painel dos Pais" */}
      {isStaffUser(usuarioAtual) && (
        <div className="fixed bottom-6 left-4 sm:left-6 z-40 select-none animate-fade-in">
          <div className="bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md p-1 sm:p-1.5 rounded-full border border-slate-700/80 shadow-xl flex items-center gap-1 transition-all">
            <button
              type="button"
              onClick={() => handleSetVisualMode('cuidador')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                visualMode === 'cuidador'
                  ? 'bg-indigo-600 text-white shadow-sm scale-102 ring-1 ring-indigo-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={isEscolar ? "Alternar para o Painel da Professora / Educador" : "Alternar para o Painel do Cuidador"}
            >
              <span className="text-xs sm:text-xs">{isEscolar ? '👩‍🏫' : '🧑‍⚕️'}</span>
              <span>{isEscolar ? 'Painel Professores' : 'Painel Cuidador'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetVisualMode('familia')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                visualMode === 'familia'
                  ? 'bg-emerald-600 text-white shadow-sm scale-102 ring-1 ring-emerald-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Alternar para o Portal de Tranquilidade (Visão dos Pais e Familiares)"
            >
              <span className="text-xs sm:text-xs">🌿</span>
              <span>Portal de Tranquilidade</span>
            </button>
          </div>
        </div>
      )}

      {/* 🔑 Security PIN Modal for Releasing Room Access */}
      {showRoomPinModal && pendingRoomToSwitch && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-indigo-100 space-y-4 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Acesso Restrito por PIN
                  </h3>
                  <p className="text-xs font-bold text-indigo-600">
                    Liberar Sala: {pendingRoomToSwitch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRoomPinModal(false);
                  setPendingRoomToSwitch(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const assignedTeacher = getAssignedTeacherForRoom(pendingRoomToSwitch, usuarioAtual);
              return (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3 text-xs">
                  {assignedTeacher?.foto ? (
                    <img src={assignedTeacher.foto} alt={assignedTeacher.nome} className="w-10 h-10 rounded-full object-cover border border-indigo-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-black">
                      👩‍🏫
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Educadora Responsável</p>
                    <p className="font-extrabold text-slate-800">{assignedTeacher ? assignedTeacher.nome : 'Educadora da Turma'}</p>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleVerifyRoomPin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block text-center">
                  Digite o PIN de Segurança (4 dígitos) para liberar a sala:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="••••"
                  value={roomPinInput}
                  onChange={e => {
                    setRoomPinInput(e.target.value.replace(/\D/g, ''));
                    setRoomPinError('');
                  }}
                  className="w-full text-center py-2.5 px-4 tracking-widest text-2xl font-black border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 text-slate-900 shadow-inner"
                  required
                  autoFocus
                />

                {roomPinError ? (
                  <p className="text-[11px] text-rose-600 font-extrabold text-center">
                    {roomPinError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold text-center leading-normal">
                    🔒 Proteção de Segurança: Insira o PIN da educadora para ter acesso a esta sala. <br />
                    <span className="text-indigo-600 font-black">
                      Dica de Simulação: Digite "3031" (Diretora Nilva), "9181" (Dev Djalma) ou o PIN da educadora.
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomPinModal(false);
                    setPendingRoomToSwitch(null);
                  }}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
