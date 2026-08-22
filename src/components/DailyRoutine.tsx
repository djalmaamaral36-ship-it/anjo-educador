import React, { useState, useEffect } from 'react';
import { Idoso, Usuario, TarefaDiaria, RegistroAlimentacao, RegistroHidratacao, RegistroSono, RegistroHumor, RegistroAtividade, SinalVital, Classroom, isStaffUser, getRoleLabel } from '../types';
import { getFromDB, saveToDB, checkFeedingCareAuthorization, compressImage, SALAS_INICIAIS, getShiftActiveState, setShiftActiveState, getNowTimeBr, checkBottleFeedingInterval, registerBottleAttemptNotice, isTodayOrDemoDate, purgeOrphanedStudentData } from '../data';
import { deleteStudentDataFromFirestore, deleteBatchFromFirestore } from '../firebase';
import { VoiceInput } from './VoiceInput';
import { parseAuraRawPlan, formatAuraTaskTitle, inferTaskType, realignPedagogicalActivity, isConversationalChatNoise } from '../utils/auraPlanParser';
import { 
  Coffee, 
  Droplets, 
  Utensils,
  ShowerHead, 
  Moon, 
  Smile, 
  Activity, 
  Plus, 
  Minus,
  User, 
  Users,
  Check, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Award,
  MessageSquare,
  Send,
  CheckCheck,
  UserX,
  Clock,
  Play,
  Pause,
  X,
  ChevronLeft,
  Trash2,
  Loader2
} from 'lucide-react';

interface DailyRoutineProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario;
  triggerWhatsAppSim: (titulo: string, mensagem: string) => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
  };
  keyTrigger: number;
}

export type RoutineTab = 'alimentacao' | 'banho' | 'hidratacao' | 'sono' | 'humores' | 'atividades' | 'recados';

export interface RecadoMural {
  id: string;
  idosoId: string;
  tipo: 'pais_para_prof' | 'prof_para_pais';
  categoria: 'saude' | 'alimentacao' | 'mochila' | 'pedagogico' | 'geral';
  remetente: string;
  cargo: string;
  mensagem: string;
  dataHora: string;
  lido: boolean;
  lidoPor?: string;
}

export default function DailyRoutine({ 
  idoso, 
  usuarioAtual, 
  triggerWhatsAppSim, 
  accessibilitySettings,
  keyTrigger 
}: DailyRoutineProps) {
  const [activeTab, setActiveTab] = useState<RoutineTab>('alimentacao');
  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental' || (idoso?.id ? idoso.id.startsWith('aluno_') : false);
  const isFundamental = false;
  const [isAbsent, setIsAbsent] = useState<boolean>(() => localStorage.getItem(`anjo_is_absent_${idoso.id}`) === 'true');

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

  const renderAuthBadge = () => {
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs mb-4">
          <div className="text-xl">⚠️</div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-rose-950">
              {isEscolar ? 'Falta de Autorização Escolar dos Pais' : 'Falta de Autorização de Cuidados'}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isEscolar 
                ? 'Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel de Pais & Autorizados para este aluno. A gravação e o registro desta rotina estão bloqueados.'
                : 'Nenhum familiar responsável autorizou "Alimentação e Cuidados" no painel da Família. A gravação desta rotina está bloqueada.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 shadow-3xs mb-4">
        <div className="text-emerald-600 bg-white p-1 rounded-full text-xs font-black shadow-3xs">✓</div>
        <div className="text-xs font-semibold text-emerald-950">
          {isEscolar ? 'Autorização Ativa dos Pais: ' : 'Autorização Ativa da Família: '}
          <span className="font-extrabold text-emerald-800">
            {auth.authorizedNames.join(', ')}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium ml-1.5">(Permissão concedida via Painel)</span>
        </div>
      </div>
    );
  };
  
  // States of each tracker item
  const [hidratacaoToday, setHidratacaoToday] = useState<RegistroHidratacao[]>([]);
  const [ultimoHumor, setUltimoHumor] = useState<RegistroHumor | null>(null);
  const [atividadesToday, setAtividadesToday] = useState<RegistroAtividade[]>([]);
  const [recados, setRecados] = useState<RecadoMural[]>([]);
  const [sonosToday, setSonosToday] = useState<RegistroSono[]>([]);
  const [alimentacaoToday, setAlimentacaoToday] = useState<RegistroAlimentacao[]>([]);
  
  // Input builders
  const [mealForm, setMealForm] = useState({ refeicao: 'cafe_manha', aceitacao: 'muito_bem', observacoes: '', quantidadeMl: 180 });
  const [hygieneForm, setHygieneForm] = useState({ banho: true, higieneBucal: true, trocaRoupa: true, trocaFralda: false, pele: true, obs: '' });
  const [waterAmount, setWaterAmount] = useState(250);
  const [sleepForm, setSleepForm] = useState({ 
    dormiuEm: isEscolar ? '13:00' : '22:00', 
    acordouEm: isEscolar ? '14:30' : '06:30', 
    qualidade: 'boa' as any, 
    interrupcoes: 0, 
    obs: '' 
  });
  const [humorForm, setHumorForm] = useState({ estado: 'calmo' as any, obs: '' });
  const [activityForm, setActivityForm] = useState({ 
    tipo: isEscolar ? 'Pintura e Artes Visuais' : 'Alongamento Leve', 
    duracao: isEscolar ? 30 : 20, 
    obs: '', 
    fotoTrabalhinho: '' 
  });
  const [activityScope, setActivityScope] = useState<'individual' | 'coletivo'>('individual');
  
  // Aura Weekly Plan Import states
  const [activityTabMode, setActivityTabMode] = useState<'direto' | 'planejamento_aura'>('direto');
  const [weeklyPlanText, setWeeklyPlanText] = useState('');
  const [isParsingWeeklyPlan, setIsParsingWeeklyPlan] = useState(false);
  const [parsedAuraMeta, setParsedAuraMeta] = useState<{ dia: string; dataStr: string; tema: string; turma: string } | null>(null);
  const [parsedWeeklyActivities, setParsedWeeklyActivities] = useState<Array<{
    dia: string;
    tipo: string;
    duracao: number;
    obs: string;
    horario?: string;
    objetivoBNCC?: string;
    materiais?: string[];
    turma?: string;
  }>>([]);
  
  const [showGalleryShow, setShowGalleryShow] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<'aluno' | 'classe'>('aluno');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(false);

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

  const handleDeleteActivity = (activityId: string) => {
    if (window.confirm("Deseja realmente excluir este registro de atividade/trabalhinho?")) {
      const ativs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
      const actToDelete = ativs.find(a => a.id === activityId);
      const updated = ativs.filter(a => a.id !== activityId);
      saveToDB('anjo_atividades', updated);
      
      // Also remove matching task in anjo_tarefas_diarias if linked
      if (actToDelete) {
        const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
        const matchingTaskId = actToDelete.id.replace(/^ati_/, 'task_');
        const updatedTasks = allTasks.filter(t => 
          t.id !== matchingTaskId && 
          t.id !== activityId && 
          !(t.idosoId === actToDelete.idosoId && (t.titulo === actToDelete.tipo || t.descricao?.includes(actToDelete.tipo)))
        );
        if (updatedTasks.length !== allTasks.length) {
          saveToDB('anjo_tarefas_diarias', updatedTasks);
        }
      }

      // Delete directly from Firestore so it doesn't get synced back
      deleteBatchFromFirestore('anjo_atividades', [activityId]);

      // If no activities remain for this student today, mark as cleared
      const remainingForStudent = updated.filter(a => a.idosoId === idoso.id && isTodayOrDemoDate(a.data));
      if (remainingForStudent.length === 0) {
        localStorage.setItem(`anjo_activities_cleared_${idoso.id}`, 'true');
      }

      // If we are currently showing a gallery with slideshow, adjust currentSlideIndex
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      const currentClassroom = getStudentClassroomLocal(idoso.nome);
      const remainingGalleryItems = updated.filter(ati => {
        if (!ati.fotoTrabalhinho) return false;
        if (galleryFilter === 'aluno') {
          return ati.idosoId === idoso.id;
        } else {
          const student = allSeniors.find(s => s.id === ati.idosoId);
          return student && getStudentClassroomLocal(student.nome) === currentClassroom;
        }
      });

      if (remainingGalleryItems.length === 0) {
        setCurrentSlideIndex(0);
        setSlideshowActive(false);
      } else if (currentSlideIndex >= remainingGalleryItems.length) {
        setCurrentSlideIndex(remainingGalleryItems.length - 1);
      }
      
      setAtividadesToday(remainingForStudent);
      loadTrackerData();
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-routine-update'));
      window.dispatchEvent(new CustomEvent('db-tasks-update'));
      window.dispatchEvent(new CustomEvent('db-jornada-update'));
      alert("Atividade/trabalhinho excluído com sucesso!");
    }
  };

  const handleClearAllActivitiesToday = () => {
    const currentClassroom = getStudentClassroomLocal(idoso.nome);
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const roomStudents = isEscolar
      ? allSeniors.filter(s => s.id.startsWith('aluno_') && getStudentClassroomLocal(s.nome) === currentClassroom)
      : [idoso];
    
    let targetStudents = [idoso];
    if (isEscolar && roomStudents.length > 1) {
      const choice = window.confirm(`Deseja limpar as atividades de TODA A SALA (${currentClassroom} - ${roomStudents.length} alunos)?\n\n[OK] = Limpar de Toda a Sala\n[Cancelar] = Limpar apenas de ${idoso.nome}`);
      if (choice) {
        targetStudents = roomStudents;
      }
    } else {
      if (!window.confirm(`Deseja realmente limpar todas as atividades anteriores e registradas para ${idoso.nome}?`)) {
        return;
      }
    }

    const targetIds = new Set(targetStudents.map(s => s.id));
    const ativs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    const updated = ativs.filter(a => !targetIds.has(a.idosoId));
    saveToDB('anjo_atividades', updated);

    // Also clean matching tasks from anjo_tarefas_diarias
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasks = allTasks.filter(t => !targetIds.has(t.idosoId));
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    targetStudents.forEach(st => {
      localStorage.setItem(`anjo_tasks_initialized_${st.id}`, 'true');
      localStorage.setItem(`anjo_tasks_cleared_${st.id}`, 'true');
      localStorage.setItem(`anjo_activities_cleared_${st.id}`, 'true');
    });

    // Delete directly from Firestore to prevent cloud re-sync
    deleteStudentDataFromFirestore(Array.from(targetIds)).catch(() => {});
    purgeOrphanedStudentData();

    setAtividadesToday([]);
    loadTrackerData();
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new CustomEvent('db-tasks-update'));
    window.dispatchEvent(new CustomEvent('db-vitals-update'));
    window.dispatchEvent(new CustomEvent('db-jornada-update'));
    alert(`🗑️ Todas as atividades anteriores foram limpas com sucesso para ${targetStudents.length} ${targetStudents.length === 1 ? 'aluno' : 'alunos'}!`);
  };

  useEffect(() => {
    let interval: any;
    if (slideshowActive && showGalleryShow) {
      interval = setInterval(() => {
        const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
        const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
        const currentClassroom = getStudentClassroomLocal(idoso.nome);
        
        const galleryItems = allAtivs.filter(ati => {
          if (!ati.fotoTrabalhinho) return false;
          if (localStorage.getItem(`anjo_activities_cleared_${ati.idosoId}`) === 'true') return false;
          if (galleryFilter === 'aluno') {
            return ati.idosoId === idoso.id;
          } else {
            const student = allSeniors.find(s => s.id === ati.idosoId);
            return student && getStudentClassroomLocal(student.nome) === currentClassroom;
          }
        });

        if (galleryItems.length > 0) {
          setCurrentSlideIndex(prev => (prev + 1) % galleryItems.length);
        }
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [slideshowActive, showGalleryShow, galleryFilter, idoso.id, idoso.nome]);

  const [newRecadoForm, setNewRecadoForm] = useState({ mensagem: '', categoria: 'geral' as 'saude' | 'alimentacao' | 'mochila' | 'pedagogico' | 'geral' });

  useEffect(() => {
    loadTrackerData();

    const handleGlobalSync = () => {
      loadTrackerData();
    };

    window.addEventListener('anjo_user_updated', handleGlobalSync);
    window.addEventListener('db-jornada-update', handleGlobalSync);
    window.addEventListener('db-mural-update', handleGlobalSync);
    window.addEventListener('db-vitals-update', handleGlobalSync);
    window.addEventListener('db-routine-update', handleGlobalSync);
    window.addEventListener('db-tasks-update', handleGlobalSync);
    window.addEventListener('storage', handleGlobalSync);

    const syncInterval = setInterval(() => {
      loadTrackerData();
    }, 2500);

    return () => {
      window.removeEventListener('anjo_user_updated', handleGlobalSync);
      window.removeEventListener('db-jornada-update', handleGlobalSync);
      window.removeEventListener('db-mural-update', handleGlobalSync);
      window.removeEventListener('db-vitals-update', handleGlobalSync);
      window.removeEventListener('db-routine-update', handleGlobalSync);
      window.removeEventListener('db-tasks-update', handleGlobalSync);
      window.removeEventListener('storage', handleGlobalSync);
      clearInterval(syncInterval);
    };
  }, [idoso, activeTab, keyTrigger]);

  const getLocalTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getLocalTodayBr = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${day}/${m}/${y}`;
  };

  const todayIso = getLocalTodayIso();
  const todayBr = getLocalTodayBr();
  const isTodayOrDemoDate = (d?: string) => {
    if (!d) return false;
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

  const loadTrackerData = () => {
    // Lead hydration details from global and student-specific DB using clean deduplication
    const globalH = getFromDB<any[]>('anjo_hidratacao', []);
    const studentH1 = getFromDB<any[]>(`anjo_registro_agua_${idoso.id}`, []);
    const studentH2 = getFromDB<any[]>(`anjo_hidratacao_${idoso.id}`, []);

    const combinedH: any[] = [];
    [...globalH, ...studentH1, ...studentH2].forEach(item => {
      if (!item) return;
      const itemStudentId = item.idosoId || idoso.id;
      if (itemStudentId !== idoso.id) return;
      combinedH.push(item);
    });

    const hasTodayRealH = combinedH.some(item => {
      if (!item.data) return false;
      const cleanD = String(item.data).split(' ')[0].split('T')[0];
      return cleanD === todayIso || cleanD === todayBr;
    });

    const waterMap = new Map<string, RegistroHidratacao>();
    combinedH.forEach((item, idx) => {
      if (!item) return;
      if (item.data) {
        const cleanD = String(item.data).split(' ')[0].split('T')[0];
        if (hasTodayRealH && cleanD !== todayIso && cleanD !== todayBr) return;
        if (!isTodayOrDemoDate(item.data)) return;
      }
      const id = item.id || `hid_fallback_${item.horario || ''}_${item.quantidadeMl || item.ml || ''}_${idx}`;
      const timeStr = item.horario || item.time || '';
      const mlVal = Number(item.quantidadeMl || item.ml || item.quantidade || 0);

      if (!waterMap.has(id)) {
        waterMap.set(id, {
          id,
          idosoId: idoso.id,
          quantidadeMl: mlVal > 0 ? mlVal : 150,
          horario: timeStr || '10:00',
          data: item.data || todayIso,
          registradoPor: item.registradoPor || 'Equipe Escolar'
        });
      }
    });
    setHidratacaoToday(Array.from(waterMap.values()));

    const allSonos = getFromDB<RegistroSono[]>('anjo_sono', []);
    setSonosToday(allSonos.filter(s => s.idosoId === idoso.id && isTodayOrDemoDate(s.data)));

    // Lead meal details from global and student-specific DB
    const globalFeeds = getFromDB<any[]>('anjo_alimentacao', []);
    const studentFeeds = getFromDB<any[]>(`anjo_alimentacao_${idoso.id}`, []);
    const mealsMap = new Map<string, RegistroAlimentacao>();
    [...globalFeeds, ...studentFeeds].forEach((item, idx) => {
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
          data: item.data || todayIso,
          observacoes: item.observacoes || item.observacao || '',
          registradoPor: item.registradoPor || 'Equipe Escolar'
        });
      }
    });
    setAlimentacaoToday(Array.from(mealsMap.values()));

    const allHumors = getFromDB<RegistroHumor[]>('anjo_humor', []);
    const seniorHumors = allHumors.filter(hu => hu.idosoId === idoso.id).sort((a,b) => b.data.localeCompare(a.data) || b.horario.localeCompare(a.horario));
    setUltimoHumor(seniorHumors.length > 0 ? seniorHumors[0] : null);

    // Pre-fill Hygiene form state from stored hygiene log
    const savedHyg = getFromDB<any>(`anjo_higiene_log_${idoso.id}`, null);
    if (savedHyg) {
      setHygieneForm({
        banho: Boolean(savedHyg.banho ?? savedHyg.bath ?? savedHyg.hands),
        higieneBucal: Boolean(savedHyg.higieneBucal ?? savedHyg.teeth),
        trocaRoupa: Boolean(savedHyg.trocaRoupa ?? savedHyg.clothes),
        trocaFralda: Boolean(savedHyg.trocaFralda ?? savedHyg.diaper),
        pele: Boolean(savedHyg.pele ?? savedHyg.cream),
        obs: savedHyg.observations || savedHyg.obs || ''
      });
    } else {
      setHygieneForm({
        banho: false,
        higieneBucal: false,
        trocaRoupa: false,
        trocaFralda: false,
        pele: false,
        obs: ''
      });
    }

    // Pre-fill Mood form state if today's mood exists
    if (seniorHumors.length > 0) {
      const todayHumor = seniorHumors.find(h => isTodayOrDemoDate(h.data)) || seniorHumors[0];
      setHumorForm({
        estado: todayHumor.estado as any,
        obs: todayHumor.observacoes || ''
      });
    }

    // Pre-fill Sleep form state if today's sleep exists
    const todaySonos = allSonos.filter(s => s.idosoId === idoso.id && isTodayOrDemoDate(s.data));
    if (todaySonos.length > 0) {
      const lastSleep = todaySonos[todaySonos.length - 1];
      if (lastSleep.dormiuEm && lastSleep.acordouEm) {
        setSleepForm({
          dormiuEm: lastSleep.dormiuEm,
          acordouEm: lastSleep.acordouEm,
          qualidade: lastSleep.qualidade || 'boa',
          interrupcoes: lastSleep.interrupcoes || 0,
          obs: lastSleep.observacoes || ''
        });
      }
    }

    const isActivitiesCleared = localStorage.getItem(`anjo_activities_cleared_${idoso.id}`) === 'true';
    const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    if (isActivitiesCleared) {
      const residual = allAtivs.filter(a => a.idosoId === idoso.id);
      if (residual.length > 0) {
        const cleaned = allAtivs.filter(a => a.idosoId !== idoso.id);
        saveToDB('anjo_atividades', cleaned);
      }
      setAtividadesToday([]);
    } else {
      setAtividadesToday(allAtivs.filter(a => a.idosoId === idoso.id && isTodayOrDemoDate(a.data)));
    }

    // Load Recados Mural
    const allRecados = getFromDB<RecadoMural[]>('anjo_mural_recados', []);
    // Purge any legacy dummy seed messages
    const cleanedRecados = allRecados.filter(r => r && r.id !== 'rec_seed_1' && r.id !== 'rec_seed_2' && !r.mensagem?.includes('jardim sob o sol'));
    if (cleanedRecados.length !== allRecados.length) {
      saveToDB('anjo_mural_recados', cleanedRecados);
    }
    const filteredRecados = cleanedRecados.filter(r => r.idosoId === idoso.id);
    
    // Sort chronological: oldest to newest
    setRecados(filteredRecados);
  };

  // 1. Save Food (Alimentacao)
  const handleSaveFeed = (e: React.FormEvent) => {
    e.preventDefault();
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (!isShiftActive) {
      setShiftActiveState(idoso.id, true);
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não pode registrar ou realizar alimentação sem autorização ativa.`);
      return;
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }

    if (mealForm.refeicao === 'mamadeira') {
      const nowTime = getNowTimeBr();
      const check = checkBottleFeedingInterval(idoso.id, nowTime, idoso.nome);
      if (!check.allowed) {
        registerBottleAttemptNotice(
          idoso.id,
          idoso.nome,
          check.lastHorario,
          check.nextAllowedHorario,
          nowTime,
          usuarioAtual.nome
        );

        triggerWhatsAppSim(
          '🍼 Comunicado: Mamadeira Já Servida',
          `Anjinho Escolar: ${idoso.nome} já tomou mamadeira às ${check.lastHorario}. A tentativa de novo registro foi feita às ${nowTime}. Para garantir a nutrição e o descanso digestivo de 2h, a próxima mamadeira estará liberada a partir das ${check.nextAllowedHorario}.`
        );

        alert(`${check.message}\n\n📢 Foi gerado um comunicado oficial no mural e no diário do aluno informando os pais e a equipe.`);
        return;
      }
    } else {
      const feeds = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
      const alreadyExists = feeds.some(f => f.idosoId === idoso.id && f.refeicao === mealForm.refeicao && isTodayOrDemoDate(f.data));
      if (alreadyExists) {
        const mealLabelMap: { [key: string]: string } = {
          cafe_manha: 'Café da manhã',
          almoco: 'Almoço',
          lanche: 'Lanche',
          lanche_tarde: 'Lanche',
          jantar: 'Jantar',
          ceia: 'Ceia'
        };
        const label = mealLabelMap[mealForm.refeicao] || mealForm.refeicao;
        alert(`⚠️ Registro Duplicado Bloqueado: A refeição "${label}" já foi registrada para ${idoso.nome} hoje!\n\nNão é permitido enviar duas refeições idênticas no mesmo dia.`);
        return;
      }
    }

    const feeds = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
    const novoFeed: RegistroAlimentacao = {
      id: 'ali_' + Date.now(),
      idosoId: idoso.id,
      refeicao: mealForm.refeicao as any,
      aceitacao: mealForm.aceitacao as any,
      quantidadeMl: mealForm.refeicao === 'mamadeira' ? (mealForm.quantidadeMl || 180) : undefined,
      horario: getNowTimeBr(),
      data: todayIso,
      observacoes: mealForm.observacoes,
      registradoPor: usuarioAtual.nome
    };

    feeds.push(novoFeed);
    saveToDB('anjo_alimentacao', feeds);

    // Sync task dashboard check
    const mealLabelMap: { [key: string]: string } = {
      mamadeira: 'Mamadeira de Leite',
      cafe_manha: 'Café da manhã',
      almoco: 'Almoço',
      lanche: 'Lanche',
      lanche_tarde: 'Lanche',
      jantar: 'Jantar',
      ceia: 'Ceia'
    };
    
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const labelToMatch = mealLabelMap[mealForm.refeicao] || '';
    const updatedTasks = allTasks.map(t => {
      if (t.idosoId === idoso.id && t.tipo === 'alimentacao' && labelToMatch && t.titulo.toLowerCase().includes(labelToMatch.toLowerCase())) {
        return {
          ...t,
          status: 'concluido' as const,
          concluidaEm: novoFeed.horario,
          completadaPor: usuarioAtual.nome,
          observacao: `Aceitação: ${mealForm.aceitacao.replace('_', ' ')}. Obs: ${novoFeed.observacoes}`
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    // Compute total bottles today
    const totalBottlesToday = feeds.filter(f => f.idosoId === idoso.id && f.refeicao === 'mamadeira' && isTodayOrDemoDate(f.data)).length;

    // Simulated WhatsApp Alerts
    const acceptText = mealForm.aceitacao === 'muito_bem' ? 'muito bem' : mealForm.aceitacao === 'pouco' ? 'muito pouco' : 'recusou a refeição';
    const totalBottlesText = mealForm.refeicao === 'mamadeira' ? ` (Total do dia: ${totalBottlesToday} mamadeira(s))` : '';
    const alertMsg = `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Registro de Alimentação para ${idoso.nome}. Refeição: ${mealLabelMap[mealForm.refeicao] || mealForm.refeicao}${novoFeed.quantidadeMl ? ` (${novoFeed.quantidadeMl}ml)` : ''} às ${novoFeed.horario}. Aceitação: ${acceptText}.${totalBottlesText} Nota: "${novoFeed.observacoes || 'Sem observações'}", registrado por ${usuarioAtual.nome}.`;
    triggerWhatsAppSim('Acompanhamento Alimentar', alertMsg);

    setMealForm({ refeicao: 'cafe_manha', aceitacao: 'muito_bem', observacoes: '', quantidadeMl: 180 });
    alert('Alimentação registrada com sucesso!');
    
    // Dispatch global events to sync other screens (including Reports & dashboard)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
    }
    
    loadTrackerData();
  };

  // 2. Save Bath and Hygiene (Banho e Higiene)
  const handleSaveHygiene = (e: React.FormEvent) => {
    e.preventDefault();
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (!isShiftActive) {
      setShiftActiveState(idoso.id, true);
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não pode registrar ou realizar cuidados de higiene sem autorização ativa.`);
      return;
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }

    const allTasksCheck = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const alreadyCompleted = allTasksCheck.some(t => t.idosoId === idoso.id && t.tipo === 'banho' && t.status === 'concluido');
    if (alreadyCompleted) {
      const confirmSave = window.confirm(`⚠️ Atenção: O registro de Higiene e Banho para ${idoso.nome} já foi marcado como concluído hoje!\n\nDeseja realmente registrar novamente?`);
      if (!confirmSave) return;
    }
    
    // Save interactive hygiene log for dashboard / family view synchronization
    const defaultTime = getNowTimeBr();
    const hygieneLog = {
      bath: hygieneForm.banho,
      teeth: hygieneForm.higieneBucal,
      clothes: hygieneForm.trocaRoupa,
      diaper: hygieneForm.trocaFralda,
      hands: hygieneForm.banho,
      cream: hygieneForm.pele,
      banho: hygieneForm.banho,
      higieneBucal: hygieneForm.higieneBucal,
      trocaRoupa: hygieneForm.trocaRoupa,
      trocaFralda: hygieneForm.trocaFralda,
      pele: hygieneForm.pele,
      observations: hygieneForm.obs || '',
      obs: hygieneForm.obs || '',
      time: defaultTime,
      date: todayIso,
      registradoPor: usuarioAtual.nome
    };
    saveToDB(`anjo_higiene_log_${idoso.id}`, hygieneLog);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: `anjo_higiene_log_${idoso.id}` } }));
    }

    // Auto complete Task on Dashboard
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasks = allTasks.map(t => {
      // Find "banho" task for this senior
      if (t.idosoId === idoso.id && t.tipo === 'banho') {
        return {
          ...t,
          status: 'concluido' as const,
          concluidaEm: getNowTimeBr(),
          completadaPor: usuarioAtual.nome,
          observacao: `Higiene bucal: Sim, Troca Roupa: Sim, Pele: Hidratada. Nota extra: ${hygieneForm.obs}`
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    const alertMsg = `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Registro de Higiene para ${idoso.nome}. Banho realizado com sucesso assistido por ${usuarioAtual.nome}. Higiene bucal e hidratação da pele concluídas. Obs: ${hygieneForm.obs || 'Nenhuma anormalidade na pele.'}`;
    triggerWhatsAppSim('Higiene & Banho', alertMsg);

    setHygieneForm({ banho: true, higieneBucal: true, trocaRoupa: true, trocaFralda: false, pele: true, obs: '' });
    alert('Higiene e Banho registrados com sucesso!');
    loadTrackerData();
  };

  // 3. Water intake clickers
  const handleAddWater = (cupsMl: number) => {
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (!isShiftActive) {
      // Auto start shift so hydration recording is never blocked
      setShiftActiveState(idoso.id, true);
    }
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      alert(`⚠️ Operação Não Autorizada: Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel "Pais & Autorizados" para este aluno. A professora/cuidadora não pode registrar ou administrar hidratação sem autorização ativa.`);
      return;
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }
    const novoRegistro: RegistroHidratacao = {
      id: `hid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      idosoId: idoso.id,
      quantidadeMl: cupsMl,
      horario: getNowTimeBr(),
      data: todayIso,
      registradoPor: usuarioAtual.nome
    };

    const allHid = getFromDB<RegistroHidratacao[]>('anjo_hidratacao', []);
    allHid.push(novoRegistro);
    saveToDB('anjo_hidratacao', allHid);

    const waterKey1 = `anjo_registro_agua_${idoso.id}`;
    const studentH1Logs = getFromDB<any[]>(waterKey1, []);
    studentH1Logs.push(novoRegistro);
    saveToDB(waterKey1, studentH1Logs);

    const waterKey2 = `anjo_hidratacao_${idoso.id}`;
    const studentH2Logs = getFromDB<any[]>(waterKey2, []);
    studentH2Logs.push(novoRegistro);
    saveToDB(waterKey2, studentH2Logs);

    // Sync water task on dashboard
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const totalMlNow = allHid.filter(h => h.idosoId === idoso.id && isTodayOrDemoDate(h.data)).reduce((acc, curr) => acc + curr.quantidadeMl, 0);

    const updatedTasks = allTasks.map(t => {
      if (t.idosoId === idoso.id && t.tipo === 'hidratacao') {
        return {
          ...t,
          status: totalMlNow >= 1500 ? ('concluido' as const) : ('em_andamento' as const),
          concluidaEm: totalMlNow >= 1500 ? getNowTimeBr() : undefined,
          completadaPor: usuarioAtual.nome,
          observacao: `Total ingerido até agora: ${totalMlNow}ml de meta de 1500ml.`
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    // simulated dispatch
    triggerWhatsAppSim(
      'Hidratação Registrada',
      `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: ${idoso.nome} bebeu mais um copo de água (${cupsMl}ml). Total acumulado hoje: ${totalMlNow}ml de uma meta de 1500ml. Registrado por ${usuarioAtual.nome}.`
    );

    // Dispatch global events to sync other screens (including Reports & dashboard)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
    }

    loadTrackerData();
  };

  // 4. Save Sleep (Sono)
  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (!isShiftActive) {
      setShiftActiveState(idoso.id, true);
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }
    
    // Calculates total hours slept
    let h1 = Number(sleepForm.dormiuEm.split(':')[0]);
    let m1 = Number(sleepForm.dormiuEm.split(':')[1]);
    let h2 = Number(sleepForm.acordouEm.split(':')[0]);
    let m2 = Number(sleepForm.acordouEm.split(':')[1]);

    let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMin < 0) {
      diffMin += 24 * 60; // sleep split among midnight
    }
    const horasProntas = Number((diffMin / 60).toFixed(1));

    const sonos = getFromDB<RegistroSono[]>('anjo_sono', []);
    const vitals = getFromDB<SinalVital[]>('anjo_sinais', []);

    const startClean = sleepForm.dormiuEm.trim();
    const endClean = sleepForm.acordouEm.trim();
    const startShort = startClean.replace(/^0/, '');
    const endShort = endClean.replace(/^0/, '');

    // 1. Check duplicate in Frequência (anjo_sono)
    const alreadyExistsInSono = sonos.some(s => {
      if (s.idosoId !== idoso.id || !isTodayOrDemoDate(s.data)) return false;
      const sStart = (s.dormiuEm || '').trim();
      const sEnd = (s.acordouEm || '').trim();
      return (sStart === startClean && sEnd === endClean) ||
             (sStart.replace(/^0/, '') === startShort && sEnd.replace(/^0/, '') === endShort);
    });

    // 2. Check duplicate in Diário da Infância (anjo_sinais)
    const alreadyExistsInSinais = vitals.some(v => {
      if (v.idosoId !== idoso.id || !isTodayOrDemoDate(v.data)) return false;
      const txt = (v.soneca || v.pressaoArterial || '').toLowerCase();
      if (!txt || txt === 'sem registros' || txt === 'não dormiu / sesta' || txt === '120/80') return false;
      const hasStart = txt.includes(startClean) || txt.includes(startShort);
      const hasEnd = txt.includes(endClean) || txt.includes(endShort);
      return hasStart && hasEnd;
    });

    if (alreadyExistsInSono || alreadyExistsInSinais) {
      const sourceName = alreadyExistsInSinais ? 'Diário da Infância' : 'Frequência';
      alert(`⚠️ Registro Duplicado Bloqueado: Já existe um registro de soneca/sono para ${idoso.nome} no mesmo horário (${sleepForm.dormiuEm} às ${sleepForm.acordouEm}) registrado hoje no ${sourceName}!\n\nNão é permitido salvar dois registros idênticos para o mesmo horário.`);
      return;
    }

    const novoSono: RegistroSono = {
      id: 'sono_' + Date.now(),
      idosoId: idoso.id,
      dormiuEm: sleepForm.dormiuEm,
      acordouEm: sleepForm.acordouEm,
      horasTotais: horasProntas,
      qualidade: sleepForm.qualidade,
      interrupcoes: Number(sleepForm.interrupcoes) || 0,
      data: todayIso,
      observacoes: sleepForm.obs
    };

    sonos.push(novoSono);
    saveToDB('anjo_sono', sonos);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_sono' } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_sono' } }));
      window.dispatchEvent(new CustomEvent('db-jornada-update'));
      window.dispatchEvent(new CustomEvent('db-mural-update'));
    }

    // Alerts
    const alertMsg = `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Registro de Sono de ${idoso.nome}. Dormiu às ${sleepForm.dormiuEm}, acordou às ${sleepForm.acordouEm}. Total de ${horasProntas} horas sob qualidade "${sleepForm.qualidade.toUpperCase()}". ${sleepForm.interrupcoes} interrupções registradas. Nota: "${sleepForm.obs || 'Noite calma'}"`;
    triggerWhatsAppSim('Acompanhamento do Sono', alertMsg);

    setSleepForm({ 
      dormiuEm: isEscolar ? '13:00' : '22:00', 
      acordouEm: isEscolar ? '14:30' : '06:30', 
      qualidade: 'boa', 
      interrupcoes: 0, 
      obs: '' 
    });
    alert('Sleep log salvo!');
    loadTrackerData();
  };

  // 5. Save Humor
  const handleSaveHumor = (e: React.FormEvent) => {
    e.preventDefault();
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (!isShiftActive) {
      setShiftActiveState(idoso.id, true);
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }
    const humores = getFromDB<RegistroHumor[]>('anjo_humor', []);
    const alreadyExistsHumor = humores.some(h => h.idosoId === idoso.id && isTodayOrDemoDate(h.data) && h.estado === humorForm.estado);
    if (alreadyExistsHumor) {
      const confirmSave = window.confirm(`⚠️ Atenção: Você já registrou o humor "${humorForm.estado.toUpperCase()}" para ${idoso.nome} hoje!\n\nDeseja realmente salvar esse novo registro de humor?`);
      if (!confirmSave) return;
    }

    const novoHumor: RegistroHumor = {
      id: 'hum_' + Date.now(),
      idosoId: idoso.id,
      data: todayIso,
      horario: getNowTimeBr(),
      estado: humorForm.estado,
      observacoes: humorForm.obs,
      registradoPor: usuarioAtual.nome
    };

    humores.push(novoHumor);
    saveToDB('anjo_humor', humores);

    // Sync task humor
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasks = allTasks.map(t => {
      if (t.idosoId === idoso.id && t.tipo === 'humor') {
        return {
          ...t,
          status: 'concluido' as const,
          concluidaEm: novoHumor.horario,
          completadaPor: usuarioAtual.nome,
          observacao: `Humor registrado: ${humorForm.estado.toUpperCase()}. Obs: ${humorForm.obs}`
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    // Alerts
    const alertMsg = `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Registro de Humor de ${idoso.nome}. Estado comportamental observado: ${humorForm.estado.toUpperCase()}. Nota: "${humorForm.obs || 'Sem anormalidades'}", registrado por ${usuarioAtual.nome}.`;
    triggerWhatsAppSim('Acompanhamento Comportamental', alertMsg);

    setHumorForm({ estado: 'calmo', obs: '' });
    alert('Comportamento e humor salvos!');
    loadTrackerData();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 200, 0.4);
        setActivityForm(prev => ({ ...prev, fotoTrabalhinho: compressed }));
      } catch (err) {
        console.error('Erro ao comprimir imagem de atividade, usando fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setActivityForm(prev => ({ ...prev, fotoTrabalhinho: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // 6. Save Activity (Atividades)
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (!isShiftActive) {
      setShiftActiveState(idoso.id, true);
    }
    if (isAbsent) {
      unlockAndMarkPresent();
    }

    const currentClassroom = getStudentClassroomLocal(idoso.nome);
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    let targetSeniorsCheck: Idoso[] = [idoso];

    if (isEscolar && activityScope === 'coletivo') {
      targetSeniorsCheck = allSeniors.filter(s => {
        if (!s.id.startsWith('aluno_')) return false;
        const studentIsAbsent = localStorage.getItem(`anjo_is_absent_${s.id}`) === 'true';
        return getStudentClassroomLocal(s.nome) === currentClassroom && !studentIsAbsent;
      });
    }

    const ativsCheck = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    const duplicates = targetSeniorsCheck.filter(student => 
      ativsCheck.some(a => a.idosoId === student.id && a.tipo.trim().toLowerCase() === activityForm.tipo.trim().toLowerCase() && isTodayOrDemoDate(a.data))
    );

    if (duplicates.length > 0) {
      if (activityScope === 'coletivo') {
        alert(`⚠️ Registro Duplicado Bloqueado: A atividade "${activityForm.tipo}" já foi registrada para a turma hoje!\n\nNão é permitido enviar duas atividades iguais no mesmo dia.`);
      } else {
        alert(`⚠️ Registro Duplicado Bloqueado: A atividade "${activityForm.tipo}" já foi registrada para ${idoso.nome} hoje!\n\nNão é permitido enviar duas atividades iguais no mesmo dia.`);
      }
      return;
    }

    let targetSeniors: Idoso[] = [idoso];
    let createdCount = 1;

    if (isEscolar && activityScope === 'coletivo') {
      targetSeniors = allSeniors.filter(s => {
        if (!s.id.startsWith('aluno_')) return false;
        const studentIsAbsent = localStorage.getItem(`anjo_is_absent_${s.id}`) === 'true';
        return getStudentClassroomLocal(s.nome) === currentClassroom && !studentIsAbsent;
      });
      createdCount = targetSeniors.length;
    }

    targetSeniors.forEach(st => {
      localStorage.removeItem(`anjo_activities_cleared_${st.id}`);
    });

    const ativs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    const newAtivs: RegistroAtividade[] = targetSeniors.map((student, idx) => ({
      id: 'ati_' + Date.now() + '_' + idx,
      idosoId: student.id,
      tipo: activityForm.tipo,
      duracaoMinutos: Number(activityForm.duracao) || 15,
      data: todayIso,
      horario: getNowTimeBr(),
      observacoes: activityForm.obs,
      fotoTrabalhinho: activityForm.fotoTrabalhinho
    }));

    const updatedAtivs = [...ativs, ...newAtivs];
    saveToDB('anjo_atividades', updatedAtivs);

    // Sync activity task
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasks = allTasks.map(t => {
      const isTarget = targetSeniors.some(s => s.id === t.idosoId);
      if (isTarget && t.tipo === 'atividade_fisica' && t.titulo.toLowerCase().includes('sol') && activityForm.tipo.toLowerCase().includes('sol')) {
        return {
          ...t,
          status: 'concluido' as const,
          concluidaEm: getNowTimeBr(),
          completadaPor: usuarioAtual.nome,
          observacao: `Atividade: ${activityForm.tipo} por ${activityForm.duracao} min. Obs: ${activityForm.obs}`
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    // Audit logs
    targetSeniors.forEach(student => {
      const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${student.id}`, []);
      logs.unshift({
        id: 'log_' + Date.now() + '_' + student.id,
        autor: usuarioAtual.nome,
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
        acao: isEscolar 
          ? (activityScope === 'coletivo' ? `Registrou atividade pedagógica coletiva: ${activityForm.tipo}` : `Registrou atividade pedagógica individual: ${activityForm.tipo}`)
          : `Registrou atividade diária: ${activityForm.tipo}`,
        detalhes: `Atividade realizada por ${activityForm.duracao} minutos. Obs: ${activityForm.obs || 'Nenhuma'}`
      });
      saveToDB(`anjo_lgpd_auditoria_${student.id}`, logs);
    });

    // alert
    const detailsExtra = activityForm.fotoTrabalhinho ? " [Foto do trabalhinho registrada com sucesso!] " : "";
    let alertMsg = "";
    if (isEscolar && activityScope === 'coletivo') {
      alertMsg = `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Atividade Coletiva de ${activityForm.tipo} realizada por toda a classe (${currentClassroom}) por ${activityForm.duracao} minutos. Obs: "${activityForm.obs || 'Realizado com esforço positivo'}"${detailsExtra}`;
    } else {
      alertMsg = `${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}: Registro de Atividade para ${idoso.nome}. Realizou "${activityForm.tipo}" por ${activityForm.duracao} minutos. Obs: "${activityForm.obs || 'Realizado com esforço positivo'}"${detailsExtra}`;
    }
    triggerWhatsAppSim('Acompanhamento de Atividades', alertMsg);

    setActivityForm({ 
      tipo: isEscolar ? 'Pintura e Artes Visuais' : 'Alongamento Leve', 
      duracao: isEscolar ? 30 : 20, 
      obs: '', 
      fotoTrabalhinho: '' 
    });
    setActivityScope('individual');
    
    if (isEscolar && activityScope === 'coletivo') {
      alert(`🎉 Atividade coletiva registrada com sucesso para todos os ${createdCount} alunos da sala!`);
    } else {
      alert(isEscolar ? 'Atividade pedagógica e registro salvos com sucesso!' : 'Atividade diária salva com sucesso!');
    }
    loadTrackerData();
  };

  const handleParseWeeklyPlan = async () => {
    if (!weeklyPlanText.trim()) {
      alert('Por favor, cole o texto do planejamento gerado pela Aura!');
      return;
    }

    setIsParsingWeeklyPlan(true);

    try {
      // 1. Extração local imediata e confiável (< 2ms)
      const localParsed = parseAuraRawPlan(weeklyPlanText);
      if (localParsed.metadata) {
        setParsedAuraMeta(localParsed.metadata);
      }

      if (localParsed.activities && localParsed.activities.length > 0) {
        const list = localParsed.activities.map(act => ({
          dia: act.dia,
          tipo: act.titulo,
          duracao: act.duracao || 30,
          obs: act.descricao,
          horario: act.horario,
          objetivoBNCC: act.objetivoBNCC || 'Desenvolvimento Integral & BNCC',
          materiais: act.materiais || [],
          turma: act.turma || localParsed.metadata.turma || 'Toda a Sala'
        }));
        setParsedWeeklyActivities(list);
        setIsParsingWeeklyPlan(false);
        return;
      }

      // 2. Se não encontrou blocos locais, tenta a API com timeout rápido de 4s
      const customKey = localStorage.getItem('aura_gemini_key') || undefined;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch("/api/parse-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          text: weeklyPlanText,
          geminiKey: customKey
        })
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data && Array.isArray(data.activities) && data.activities.length > 0) {
        if (data.metadata) {
          setParsedAuraMeta({
            dia: data.metadata.day || localParsed.metadata.dia,
            dataStr: data.metadata.dateStr || localParsed.metadata.dataStr,
            tema: data.metadata.theme || localParsed.metadata.tema,
            turma: data.metadata.targetClass || localParsed.metadata.turma
          });
        }

        const formattedList = data.activities.map((a: any) => {
          const rawTitle = typeof a.title === 'string' ? a.title : (typeof a.tipo === 'string' ? a.tipo : 'Atividade Pedagógica');
          const cleanTitle = formatAuraTaskTitle(rawTitle, '', '');
          const safeDuration = typeof a.duration === 'number' ? a.duration : (parseInt(String(a.duration || '30'), 10) || 30);
          
          let safeObs = 'Atividade planejada pela Aura.';
          if (typeof a.instructions === 'string' && a.instructions.trim().length > 0) safeObs = a.instructions;
          else if (typeof a.descricao === 'string' && a.descricao.trim().length > 0) safeObs = a.descricao;
          else if (typeof a.description === 'string' && a.description.trim().length > 0) safeObs = a.description;
          else if (typeof a.obs === 'string' && a.obs.trim().length > 0) safeObs = a.obs;
          else if (typeof a.detalhes === 'string' && a.detalhes.trim().length > 0) safeObs = a.detalhes;

          const safeTime = typeof a.time === 'string' ? a.time : '09:00';
          
          let safeBncc = 'Desenvolvimento Lúdico e Psicomotor';
          if (typeof a.bnccObjective === 'string') safeBncc = a.bnccObjective;
          else if (typeof a.bnccObjective === 'object') safeBncc = a.bnccObjective?.code || a.bnccObjective?.description || JSON.stringify(a.bnccObjective);

          let safeMaterials: string[] = [];
          if (Array.isArray(a.materials)) {
            safeMaterials = a.materials.map((m: any) => {
              if (typeof m === 'string') return m;
              if (typeof m === 'object') return m?.name || m?.item || m?.material || JSON.stringify(m);
              return String(m || '');
            }).filter(Boolean);
          } else if (a.materials) {
            safeMaterials = [typeof a.materials === 'object' ? JSON.stringify(a.materials) : String(a.materials)];
          }

          const safeTurma = typeof a.targetClass === 'string' ? a.targetClass : (localParsed.metadata.turma || 'Toda a Sala');
          const safeDay = typeof a.day === 'string' ? a.day : (localParsed.metadata.dia || 'Segunda-feira');

          return {
            dia: String(safeDay),
            tipo: String(cleanTitle),
            duracao: safeDuration,
            obs: String(safeObs),
            horario: String(safeTime),
            objetivoBNCC: String(safeBncc),
            materiais: safeMaterials,
            turma: String(safeTurma)
          };
        });
        const validList = formattedList.filter((act: any) => 
          !isConversationalChatNoise(act.tipo || '') && 
          !isConversationalChatNoise(act.obs || '')
        );
        setParsedWeeklyActivities(validList);
        setIsParsingWeeklyPlan(false);
        return;
      }
    } catch (err) {
      console.warn('Processamento no DailyRoutine concluiu com fallback:', err);
    } finally {
      setIsParsingWeeklyPlan(false);
    }
  };

  const handleSaveParsedWeeklyPlan = () => {
    if (parsedWeeklyActivities.length === 0) return;

    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const currentClassroom = getStudentClassroomLocal(idoso.nome);
    const targetStudents = activityScope === 'coletivo' && isEscolar
      ? allSeniors.filter(s => s.id.startsWith('aluno_') && getStudentClassroomLocal(s.nome) === currentClassroom)
      : [idoso];

    const existingAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
    const targetStudentIds = new Set(targetStudents.map(s => s.id));
    const baseAtivs = existingAtivs.filter(a => !targetStudentIds.has(a.idosoId));
    const newAtivsBatch: RegistroAtividade[] = [];

    parsedWeeklyActivities.forEach((planItem, planIdx) => {
      targetStudents.forEach((st, stIdx) => {
        newAtivsBatch.push({
          id: 'ati_plan_' + Date.now() + '_' + planIdx + '_' + stIdx,
          idosoId: st.id,
          tipo: planItem.tipo,
          duracaoMinutos: planItem.duracao,
          data: todayIso,
          horario: planItem.horario || '09:00',
          observacoes: planItem.obs,
          fotoTrabalhinho: ''
        });
      });
    });

    const updated = [...baseAtivs, ...newAtivsBatch];
    saveToDB('anjo_atividades', updated);

    // Também sincroniza diretamente com anjo_tarefas_diarias substituindo tarefas anteriores para exibir o planejamento oficial no checklist diário do Dashboard
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const baseTasks = allTasks.filter(t => !targetStudentIds.has(t.idosoId));

    const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const currentDayName = DAY_NAMES[new Date().getDay()];

    const distinctDays = Array.from(new Set(parsedWeeklyActivities.map(a => a.dia).filter(Boolean)));
    let dailyActsToApply = parsedWeeklyActivities;
    if (distinctDays.length > 1) {
      const todayMatch = parsedWeeklyActivities.filter(a => a.dia?.toLowerCase() === currentDayName.toLowerCase());
      if (todayMatch.length > 0) {
        dailyActsToApply = todayMatch;
      } else {
        const firstDay = distinctDays[0];
        dailyActsToApply = parsedWeeklyActivities.filter(a => a.dia === firstDay);
      }
    }

    const newTasksBatch: TarefaDiaria[] = [];
    const seenDailyKeys = new Set<string>();

    dailyActsToApply.forEach((planItem, planIdx) => {
      const { title: alignedTitle, tipo: detectedType } = realignPedagogicalActivity(
        planItem.tipo, 
        planItem.obs || '', 
        planItem.horario || '09:00', 
        planItem.objetivoBNCC
      );

      const normTime = (planItem.horario || '09:00').trim();
      const normTitle = alignedTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${normTime}_${normTitle}`;

      if (seenDailyKeys.has(key)) {
        return;
      }
      seenDailyKeys.add(key);

        targetStudents.forEach((st, stIdx) => {
        newTasksBatch.push({
          id: 'task_aura_' + Date.now() + '_' + planIdx + '_' + stIdx,
          idosoId: st.id,
          tipo: detectedType,
          titulo: alignedTitle,
          descricao: planItem.obs,
          horarioPrevisto: planItem.horario || '09:00',
          status: 'pendente'
        });
        localStorage.setItem(`anjo_tasks_initialized_${st.id}`, 'true');
        localStorage.removeItem(`anjo_tasks_cleared_${st.id}`);
        localStorage.removeItem(`anjo_activities_cleared_${st.id}`);
      });
    });

    saveToDB('anjo_tarefas_diarias', [...baseTasks, ...newTasksBatch]);

    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));

    setWeeklyPlanText('');
    setParsedWeeklyActivities([]);
    setParsedAuraMeta(null);
    setActivityTabMode('direto');
    loadTrackerData();

    alert(`🎉 Sucesso! ${parsedWeeklyActivities.length} atividade(s) padronizadas do planejamento da Aura foram cadastradas para ${targetStudents.length} aluno(s)!`);
  };

  // 7. Save and handle Mural de Recados
  const handleSaveRecado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecadoForm.mensagem.trim()) return;

    const isUserTeacher = isStaffUser(usuarioAtual);
    
    const novoRecado: RecadoMural = {
      id: 'rec_' + Date.now(),
      idosoId: idoso.id,
      tipo: isUserTeacher ? 'prof_para_pais' : 'pais_para_prof',
      categoria: newRecadoForm.categoria,
      remetente: usuarioAtual.nome,
      cargo: isUserTeacher ? getRoleLabel(usuarioAtual, isEscolar) : 'Pais / Responsáveis',
      mensagem: newRecadoForm.mensagem,
      dataHora: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      lido: false
    };

    const recadosDB = getFromDB<RecadoMural[]>('anjo_mural_recados', []);
    recadosDB.push(novoRecado);
    saveToDB('anjo_mural_recados', recadosDB);

    // Send mock WhatsApp notification to make the experience real & satisfying!
    const senderDescription = isEscolar 
      ? (isUserTeacher ? `Profª. ${usuarioAtual.nome}` : `Pais de ${idoso.nome}`)
      : (isUserTeacher ? `Cuidador(a) ${usuarioAtual.nome}` : `Família de ${idoso.nome}`);
    
    const alertMsg = `${isEscolar ? 'Anjo Escolar' : 'Anjo Cuidador'}: Novo recado de ${senderDescription}. Categoria: ${newRecadoForm.categoria.toUpperCase()}. Mensagem: "${newRecadoForm.mensagem}"`;
    triggerWhatsAppSim(isEscolar ? 'Diário Escolar / Recado' : 'Acompanhamento / Recado', alertMsg);

    setNewRecadoForm({ mensagem: '', categoria: 'geral' });
    alert(isEscolar 
      ? 'Seu recado foi adicionado à agenda escolar e notificado via WhatsApp!' 
      : 'Anotação adicionada ao caderno de acompanhamento do idoso!');
    loadTrackerData();
  };

  const handleMarkRecadoAsRead = (recadoId: string) => {
    const recadosDB = getFromDB<RecadoMural[]>('anjo_mural_recados', []);
    const updated = recadosDB.map(r => {
      if (r.id === recadoId) {
        return {
          ...r,
          lido: true,
          lidoPor: usuarioAtual.nome
        };
      }
      return r;
    });
    saveToDB('anjo_mural_recados', updated);
    loadTrackerData();
  };

  const handleDeleteRecado = (recadoId: string) => {
    const recadosDB = getFromDB<RecadoMural[]>('anjo_mural_recados', []);
    const updated = recadosDB.filter(r => r.id !== recadoId);
    saveToDB('anjo_mural_recados', updated);
    loadTrackerData();
  };

  const handleClearAllRecados = () => {
    if (!window.confirm(`Deseja limpar todos os recados do mural para ${idoso.nome}?`)) return;
    const recadosDB = getFromDB<RecadoMural[]>('anjo_mural_recados', []);
    const updated = recadosDB.filter(r => r.idosoId !== idoso.id);
    localStorage.setItem(`anjo_mural_cleared_${idoso.id}`, 'true');
    saveToDB('anjo_mural_recados', updated);
    deleteStudentDataFromFirestore(idoso.id).catch(() => {});
    loadTrackerData();
  };

  // Hydration calculations
  const totalMl = hidratacaoToday.reduce((acc, curr) => acc + curr.quantidadeMl, 0);
  const percentHydrated = Math.min(Math.round((totalMl / 1500) * 100), 100);

  // Tab Header Button design
  const getTabBtnClass = (id: RoutineTab) => {
    const isSel = activeTab === id;
    const activeColorClass = isEscolar 
      ? 'bg-indigo-600 text-white border-indigo-650 shadow-sm' 
      : 'bg-serene-blue text-white border-serene-blue shadow-sm';
    return `flex items-center gap-2 px-3 py-3 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer justify-center sm:justify-start ${
      isSel 
        ? activeColorClass 
        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
    }`;
  };

  return (
    <div className="space-y-6">
      {/* Tab selection headers */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-850">
            {isEscolar ? 'Diário Escolar & Mural de Recados' : 'Lançamento de Cuidados e Diários'}
          </h2>
          <p className="text-sm text-slate-500">
            {isEscolar 
              ? 'Acompanhe as rotinas, atividades pedagógicas e recados do aluno em tempo real.' 
              : 'Selecione uma rotina para registrar o andamento do idoso.'}
          </p>
        </div>
      </div>

      {/* Student/Elder active profile badge */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs">
        <div className="flex items-center gap-3.5">
          <img
            referrerPolicy="no-referrer"
            src={idoso.foto}
            alt={idoso.nome}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200/60 shadow-3xs shrink-0"
          />
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md">
              {isEscolar ? 'Aluno Selecionado' : 'Perfil em Monitoração'}
            </span>
            <h3 className="text-base font-black text-slate-850 mt-1">{idoso.nome}</h3>
            <p className="text-xs text-slate-500 font-semibold">
              {isEscolar ? 'Todas as anotações e atividades abaixo serão salvas nesta ficha escolar.' : 'Sessão ativa de lançamento de rotina diária.'}
            </p>
          </div>
        </div>
        {isAbsent && (
          <div className="bg-rose-100 text-rose-800 border border-rose-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider select-none shrink-0">
            Ausente Hoje ❌
          </div>
        )}
      </div>

      {usuarioAtual?.tipo === 'familiar' && (
        <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 flex items-center gap-3 shadow-3xs animate-fade-in">
          <div className="text-xl">🔒</div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-amber-900">
              Modo Família / Leitura Ativo
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Você está visualizando a grade de atividades e rotinas diárias no modo de acompanhamento. Apenas educadores e cuidadores autorizados podem registrar, modificar ou salvar rotinas neste diário.
            </p>
          </div>
        </div>
      )}

      {/* Grid of buttons to make them completely visible and easy to click on mobile */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 w-full pb-2">
        <button onClick={() => setActiveTab('alimentacao')} className={getTabBtnClass('alimentacao')} id="btn-tab-alimentacao">
          <Coffee className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate">{isEscolar ? 'Papa & Mamadeira' : 'Alimentação'}</span>
        </button>
        <button onClick={() => setActiveTab('banho')} className={getTabBtnClass('banho')} id="btn-tab-banho">
          <ShowerHead className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate">{isEscolar ? 'Trocas & Higiene' : 'Banho e Higiene'}</span>
        </button>
        <button onClick={() => setActiveTab('hidratacao')} className={getTabBtnClass('hidratacao')} id="btn-tab-hidratacao">
          <Droplets className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate">{isEscolar ? 'Água (Hidratação)' : 'Hidratação'}</span>
        </button>
        <button onClick={() => setActiveTab('sono')} className={getTabBtnClass('sono')} id="btn-tab-sono">
          <Moon className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate">{isEscolar ? 'Sono/Soneca' : 'Diário de Sono'}</span>
        </button>
        <button onClick={() => setActiveTab('humores')} className={getTabBtnClass('humores')} id="btn-tab-humores">
          <Smile className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate">{isEscolar ? 'Humor & Social' : 'Humor/Comportamento'}</span>
        </button>
        <button onClick={() => setActiveTab('atividades')} className={getTabBtnClass('atividades')} id="btn-tab-atividades">
          <Activity className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate">{isEscolar ? 'Atividade Pedagógica' : 'Atividade Física/Mental'}</span>
        </button>
        <button onClick={() => setActiveTab('recados')} className={getTabBtnClass('recados')} id="btn-tab-recados">
          <MessageSquare className="w-4 h-4 sm:w-5 h-5 shrink-0" /> 
          <span className="truncate font-black text-rose-650">{isEscolar ? 'Recados de Mão Dupla 💬' : 'Caderno de Recados 💬'}</span>
        </button>
      </div>

      {/* 🥤 Banner do Somatório de Água & Jarrinha Animada Persistente (Visível em Notebook e Celular) */}
      {(() => {
        const allHidsGlobal = getFromDB<any[]>('anjo_hidratacao', []);
        const studentHidsToday = allHidsGlobal.filter(h => h.idosoId === idoso.id && isTodayOrDemoDate(h.data));
        const totalStudentMl = studentHidsToday.reduce((sum, h) => sum + (h.quantidadeMl || 0), 0);
        const targetGoal = isEscolar ? 600 : 1500;
        const percentJug = Math.min(100, Math.round((totalStudentMl / targetGoal) * 100));

        const teacherNameClean = usuarioAtual?.nome || '';
        const teacherHidsToday = allHidsGlobal.filter(h => isTodayOrDemoDate(h.data) && (h.registradoPor === teacherNameClean || (teacherNameClean && h.registradoPor && h.registradoPor.toLowerCase().includes(teacherNameClean.toLowerCase().split(' ')[0]))));
        const totalTeacherMl = teacherHidsToday.reduce((sum, h) => sum + (h.quantidadeMl || 0), 0);

        return (
          <div className="bg-gradient-to-r from-cyan-500/10 via-sky-50 to-indigo-50/80 border-2 border-cyan-300 rounded-2xl p-3.5 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-600 text-white rounded-xl text-xl shadow-xs shrink-0 flex items-center justify-center">
                🥤
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  Hidratação de {idoso.nome}
                  <span className="bg-cyan-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-3xs">
                    {percentJug}% da Meta ({totalStudentMl}/{targetGoal}ml)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 font-semibold leading-tight">
                  Você serviu <strong className="text-cyan-800">{totalTeacherMl}ml</strong> no total hoje. A jarrinha ao lado atualiza o nível da água instantaneamente!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
              {/* Jarrinha Animada de Água */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-cyan-300 shadow-3xs" title={`Jarrinha de ${idoso.nome}: ${percentJug}% preenchida`}>
                <div className="relative my-0.5">
                  <div className="relative w-8 h-11 border-2 border-cyan-600 rounded-b-lg rounded-t-xs bg-cyan-50/50 overflow-hidden shadow-inner flex flex-col justify-end">
                    <div 
                      className="bg-gradient-to-t from-cyan-600 via-sky-500 to-sky-400 w-full transition-all duration-700 relative"
                      style={{ height: `${percentJug}%` }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-sky-200 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="absolute -right-1.5 top-1.5 bottom-1.5 w-1.5 border-2 border-l-0 border-cyan-600 rounded-r-md pointer-events-none"></div>
                </div>

                <div className="flex flex-col text-left space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cyan-800">
                    🫖 Jarrinha
                  </span>
                  <span className="text-sm font-black text-cyan-900 font-mono leading-none">
                    {percentJug}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">
                    {totalStudentMl}ml
                  </span>
                </div>
              </div>

              {/* Botão de Registro Rápido */}
              <button
                type="button"
                onClick={() => handleAddWater(100)}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Dar 1 copinho (100ml) e encher a jarrinha"
              >
                <span>+100ml Água</span>
                <span className="text-[10px] bg-cyan-800/40 px-1.5 py-0.5 rounded font-mono">🫖 Sobe!</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* RENDER ACTIVE TAB LAYOUTS */}
      <div className="bg-white rounded-2xl border border-soft-gray p-6 relative">
        {isAbsent && activeTab !== 'recados' && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-900 shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">
                  {isEscolar ? 'Aluno(a) Marcado como Ausente Hoje' : 'Cliente Marcado como Ausente'}
                </h4>
                <p className="text-[11px] text-rose-800 leading-snug">
                  Você pode preencher a rotina normalmente. Ao salvar, a presença será reativada automaticamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => unlockAndMarkPresent()}
              className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Marcar como Presente
            </button>
          </div>
        )}
        
        <div>
        
        {/* =============== TAB: ALIMENTACAO =============== */}
        {activeTab === 'alimentacao' && (
          <form onSubmit={handleSaveFeed} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isFundamental ? 'Acompanhamento de Alimentação / Lanche' : (isEscolar ? 'Acompanhamento Alimentar do Aluno' : 'Acompanhamento Alimentar Diário')}
                </h3>
                <p className="text-xs text-slate-400">
                  {isFundamental 
                    ? 'Insira os lanches, almoços ou sucos consumidos pelo aluno durante o período letivo.'
                    : isEscolar 
                      ? 'Insira as mamadeiras, papinhas ou lanches escolares oferecidos hoje.' 
                      : 'Insira as refeições, a aceitação geral e a qualidade alimentar.'}
                </p>
              </div>
            </div>

            {renderAuthBadge()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-705 block">
                  {isFundamental ? 'Qual refeição/lanche foi consumido?' : (isEscolar ? 'Qual refeição/mamadeira foi servida?' : 'Qual refeição está sendo oferecida?')}
                </label>
                <select 
                  value={mealForm.refeicao}
                  onChange={e => setMealForm({ ...mealForm, refeicao: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
                >
                  {isFundamental ? (
                    <>
                      <option value="lanche_manha">☕ Lanche do Recreio (Manhã)</option>
                      <option value="almoco">🍽️ Almoço na Escola</option>
                      <option value="lanche_tarde">🍪 Lanche do Recreio (Tarde)</option>
                      <option value="outro">🍉 Fruta / Outros Lanches</option>
                    </>
                  ) : isEscolar ? (
                    <>
                      <option value="mamadeira">🍼 Mamadeira de Leite / Fórmula</option>
                      <option value="cafe_manha">☕ Café da Manhã</option>
                      <option value="lanche">🍎 Lanchinho da Manhã (Colação)</option>
                      <option value="almoco">🍲 Almoço Escolar</option>
                      <option value="lanche_tarde">🍪 Lanche da Tarde</option>
                      <option value="ceia">🥛 Colação do Final de Período</option>
                    </>
                  ) : (
                    <>
                      <option value="cafe_manha">Café da Manhã</option>
                      <option value="lanche">Lanche da Manhã / Tarde</option>
                      <option value="almoco">Almoço</option>
                      <option value="jantar">Jantar</option>
                      <option value="ceia">Ceia Noturna</option>
                    </>
                  )}
                </select>
              </div>

              {mealForm.refeicao === 'mamadeira' && (
                <div className="space-y-3 sm:col-span-2 bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200 text-xs">
                  <div className="flex items-center justify-between gap-2 text-indigo-900 font-bold">
                    <div className="flex items-center gap-1.5">
                      <span>🍼 Volume da Mamadeira (mL):</span>
                      <span className="bg-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-md font-black shadow-xs font-mono">
                        {mealForm.quantidadeMl || 180} ml
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-600 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-200 font-bold">
                      Controle do Professor
                    </span>
                  </div>

                  {/* Quick ML pills for bottles */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[90, 120, 150, 180, 210, 240].map(vol => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => setMealForm({ ...mealForm, quantidadeMl: vol })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (mealForm.quantidadeMl || 180) === vol
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {vol} ml
                      </button>
                    ))}
                  </div>

                  {/* Stepper / Fine-tuning volume */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-indigo-800">Ajuste fino:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMealForm({ ...mealForm, quantidadeMl: Math.max(30, (mealForm.quantidadeMl || 180) - 10) })}
                        className="w-7 h-7 bg-white hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg text-indigo-700 font-bold text-sm flex items-center justify-center cursor-pointer shadow-3xs"
                        title="Diminuir 10ml"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        step="10"
                        value={mealForm.quantidadeMl || 180}
                        onChange={e => setMealForm({ ...mealForm, quantidadeMl: Number(e.target.value) || 180 })}
                        className="w-18 text-center text-xs font-black text-indigo-900 bg-white border border-indigo-300 rounded-lg py-1 px-1 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setMealForm({ ...mealForm, quantidadeMl: Math.min(500, (mealForm.quantidadeMl || 180) + 10) })}
                        className="w-7 h-7 bg-white hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg text-indigo-700 font-bold text-sm flex items-center justify-center cursor-pointer shadow-3xs"
                        title="Aumentar 10ml"
                      >
                        +
                      </button>
                      <span className="text-[11px] font-bold text-indigo-600 ml-1">ml servidos</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-705 block">
                  {isFundamental ? 'Aceitação do Aluno' : (isEscolar ? 'Aceitação da Criança' : 'Aceitação do Idoso')}
                </label>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, aceitacao: 'muito_bem' })}
                    className={`flex-1 py-2 px-1 text-center text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                      mealForm.aceitacao === 'muito_bem' 
                        ? (isEscolar ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-emerald-500 text-white border-emerald-500')
                        : 'bg-slate-50 border-slate-250 text-slate-600'
                    }`}
                  >
                    {isEscolar ? 'Comeu / Tomou tudo' : 'Comeu bem'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, aceitacao: 'pouco' })}
                    className={`flex-1 py-2 px-1 text-center text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                      mealForm.aceitacao === 'pouco' 
                        ? 'bg-amber-500 text-white border-amber-500' 
                        : 'bg-slate-50 border-slate-250 text-slate-600'
                    }`}
                  >
                    {isEscolar ? 'Comeu parcial' : 'Comeu pouco'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, aceitacao: 'recusou' })}
                    className={`flex-1 py-2 px-1 text-center text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                      mealForm.aceitacao === 'recusou' 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-slate-50 border-slate-250 text-slate-600'
                    }`}
                  >
                    {isEscolar ? 'Recusou / Rejeitou' : 'Recusou tudo'}
                  </button>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-705 block">
                    {isFundamental ? 'O que o aluno consumiu?' : 'Qual o cardápio ou observações adicionais?'}
                  </label>
                  <VoiceInput 
                    onTranscript={text => setMealForm(prev => ({ ...prev, observacoes: prev.observacoes ? prev.observacoes + ' ' + text : text }))} 
                    size="sm"
                  />
                </div>
                <textarea 
                  placeholder={isFundamental ? "Ex: Comeu a salada de frutas que trouxe de casa, aceitou o suco de uva e dividiu biscoitos com colegas." : isEscolar ? "Ex: bebeu 150ml da mamadeira de leite integral, comeu pedacinhos de banana e maçã e rejeitou o miolo de pão." : "Ex: purê de batata, suco de pêssego, recusou os vegetais mas tomou bastante água."}
                  rows={3}
                  value={mealForm.observacoes}
                  onChange={e => setMealForm({ ...mealForm, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
                ></textarea>
              </div>
            </div>

            {/* Listing historic meals logged today */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-500 block">Registros do dia ({alimentacaoToday.length}):</span>
              {alimentacaoToday.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma refeição registrada hoje ainda.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {alimentacaoToday.map(m => {
                    const mealLabels: Record<string, string> = {
                      mamadeira: '🍼 Mamadeira de Leite / Fórmula',
                      cafe_manha: isEscolar ? '☕ Café da Manhã' : 'Café da Manhã',
                      almoco: isEscolar ? '🍲 Papinha / Almocinho' : 'Almoço Principal',
                      lanche: isEscolar ? '🍎 Frutinha / Lanchinho' : 'Lanche / Tarde',
                      lanche_tarde: isEscolar ? '🍎 Lanchinho Tarde' : 'Lanche da Tarde',
                      jantar: isEscolar ? '🥣 Jantinha Escolar' : 'Jantar Sênior',
                      ceia: isEscolar ? '🥛 Colação Final' : 'Ceia / Repouso'
                    };
                    const label = mealLabels[m.refeicao] || m.refeicao || 'Refeição';
                    const volumeText = (m.quantidadeMl && m.refeicao !== 'mamadeira') 
                      ? ` (${m.quantidadeMl} ml)` 
                      : (m.refeicao === 'mamadeira' ? ` (1 mamadeira • ${m.quantidadeMl || 180} ml)` : '');
                    const acceptBadge = m.aceitacao === 'muito_bem' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : m.aceitacao === 'pouco' 
                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                        : 'bg-rose-100 text-rose-800 border-rose-200';
                    const acceptText = m.aceitacao === 'muito_bem' ? 'Comeu Bem' : m.aceitacao === 'pouco' ? 'Parcial' : 'Recusou';
                    return (
                      <div key={m.id} className="p-2 bg-white rounded-xl border border-slate-200 text-xs flex flex-col gap-1 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-amber-500" /> {label}{volumeText} às {m.horario}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${acceptBadge}`}>
                            {acceptText}
                          </span>
                        </div>
                        {m.observacoes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
                            "{m.observacoes}"
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 text-right">Por: {m.registradoPor || 'Equipe Escolar'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`px-5 py-3 ${isEscolar ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-serene-blue hover:bg-blue-600'} text-white font-bold rounded-xl active:scale-95 transition-all text-sm block ml-auto cursor-pointer shadow-sm`}
            >
              {isEscolar ? 'Salvar Alimentação (Notificar Pais)' : 'Salvar Alimentação (Avisar Família)'}
            </button>
          </form>
        )}

        {/* =============== TAB: BANHO E HIGIENE =============== */}
        {activeTab === 'banho' && (
          <form onSubmit={handleSaveHygiene} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
                <ShowerHead className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isFundamental ? 'Acompanhamento de Foco, Conduta & Organização' : (isEscolar ? 'Controle de Trocas, Higiene e Desfralde' : 'Banho, Roupas e Cuidados Estéticos')}
                </h3>
                <p className="text-xs text-slate-400">
                  {isFundamental 
                    ? 'Registre os aspectos comportamentais, atenção às aulas e convivência escolar do aluno.'
                    : isEscolar 
                      ? 'Assinale os rituais de troca de fraldas, lavagem de mãos e higiene escovar aplicados.' 
                      : 'Assinale as atividades preventivas de higiene e proteção da pessoa idosa.'}
                </p>
              </div>
            </div>

            {renderAuthBadge()}

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">Atividades Concluídas nesta Sessão</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isEscolar ? hygieneForm.trocaFralda : hygieneForm.banho}
                    onChange={e => setHygieneForm({ ...hygieneForm, [isEscolar ? 'trocaFralda' : 'banho']: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-350 text-indigo-600"
                  />
                  <div>
                    <strong className="text-sm font-bold block text-slate-750">
                      {isFundamental ? 'Atenção & Concentração nas Aulas' : (isEscolar ? 'Troca de Fralda / Cuidado de Toalete' : 'Banho de Chuveiro Realizado')}
                    </strong>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isFundamental ? 'O aluno demonstrou bom foco nas explicações dos professores e participou das atividades.' : (isEscolar ? 'Fralda descartável checada/trocada ou incentivo de uso do toalete.' : 'Controle de temperatura de água e piso antiderrapante.')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={hygieneForm.higieneBucal}
                    onChange={e => setHygieneForm({ ...hygieneForm, higieneBucal: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-350 text-indigo-600"
                  />
                  <div>
                    <strong className="text-sm font-bold block text-slate-750">
                      {isFundamental ? 'Respeito às Regras & Disciplina' : (isEscolar ? 'Escovação de Dentes Orientada' : 'Higiene Bucal Completa')}
                    </strong>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isFundamental ? 'Seguiu as orientações da equipe escolar, portando-se de maneira respeitosa e educada.' : (isEscolar ? 'Com escovinha individual e creme dental infantil de forma lúdica.' : 'Uso de escova macia, higienizador de língua ou solução protética.')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={hygieneForm.trocaRoupa}
                    onChange={e => setHygieneForm({ ...hygieneForm, trocaRoupa: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-350 text-indigo-600"
                  />
                  <div>
                    <strong className="text-sm font-bold block text-slate-750">
                      {isFundamental ? 'Organização dos Materiais' : (isEscolar ? 'Troca de Roupa (Mochila)' : 'Troca de Roupa por Limpas')}
                    </strong>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isFundamental ? 'Manteve cadernos, estojo e mochila organizados, guardando seus pertences após o uso.' : (isEscolar ? 'Criança vestida com roupas limpas enviadas pelos pais após sujar ou banho.' : 'Roupas frescas, fáceis de vestir e adequadas ao clima.')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isEscolar ? hygieneForm.banho : hygieneForm.trocaFralda}
                    onChange={e => setHygieneForm({ ...hygieneForm, [isEscolar ? 'banho' : 'trocaFralda']: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-350 text-indigo-600"
                  />
                  <div>
                    <strong className="text-sm font-bold block text-slate-750">
                      {isFundamental ? 'Relações Sociais & Parceria' : (isEscolar ? 'Lavagem das Mãos e Rosto' : 'Troca de Fralda / Absorvente')}
                    </strong>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isFundamental ? 'Colaborou com os colegas de classe, demonstrou empatia e trabalhou bem em equipe.' : (isEscolar ? 'Praticado antes e após refeições e depois das brincadeiras de artes/pátio.' : 'Se aplicável, ou verificação de vazamento urinário.')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={hygieneForm.pele}
                    onChange={e => setHygieneForm({ ...hygieneForm, pele: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-350 text-indigo-600"
                  />
                  <div>
                    <strong className="text-sm font-bold block text-slate-750">
                      {isFundamental ? 'Zelo pelo Uniforme & Apresentação' : (isEscolar ? 'Pomada Antiassadura / Protetor' : 'Hidratação e Proteção da Pele')}
                    </strong>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isFundamental ? 'Zelou pelo próprio uniforme escolar e pertences pessoais com cuidado e asseio.' : (isEscolar ? 'Aplicação de pomada nas dobrinhas para prevenção de brotoejas ou assadura.' : 'Uso de cremes sênior preventivos para escaras e ressecamento.')}
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-705 block">
                    {isFundamental ? 'Observações adicionais de comportamento e participação' : (isEscolar ? 'Observações de higiene (assaduras detectadas, resistência no fraldário, etc.)' : 'Observações do cuidador (pele machucada, resistência para banhar etc.)')}
                  </label>
                  <VoiceInput 
                    onTranscript={text => setHygieneForm(prev => ({ ...prev, obs: prev.obs ? prev.obs + ' ' + text : text }))} 
                    size="sm"
                  />
                </div>
                <textarea 
                  placeholder={isFundamental ? "Ex: Se comportou muito bem, prestou bastante atenção às aulas e interagiu com os amigos." : (isEscolar ? "Ex: sem assaduras hoje. Cooperou bastante cantando a musiquinha do sapo para lavar as mãos." : "Ex: sem queixas, pele saudável. Dona Maria cooperou ouvindo músicas antigas.")}
                  rows={2.5}
                  value={hygieneForm.obs}
                  onChange={e => setHygieneForm({ ...hygieneForm, obs: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className={`px-5 py-3 ${isEscolar ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-serene-blue hover:bg-blue-600'} text-white font-bold rounded-xl active:scale-95 transition-all text-sm block ml-auto cursor-pointer shadow-sm`}
            >
              {isFundamental ? 'Confirmar Avaliação (Notificar Pais)' : (isEscolar ? 'Confirmar Higiene (Enviar para os Pais)' : 'Confirmar Banho & Higiene (Avisar Família)')}
            </button>
          </form>
        )}

        {/* =============== TAB: HIDRATACAO =============== */}
        {activeTab === 'hidratacao' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-cyan-100 rounded-2xl text-cyan-500 animate-bounce">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEscolar ? 'Controle de Hidratação do Aluno' : 'Controle e Incentivo de Hidratação'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEscolar 
                    ? 'Copos de água filtrada consumidos. Toque nas opções para registrar cada porção.' 
                    : 'Pessoas idosas sentem menos sede. Clique nos copos para registrar cada porção bebida.'}
                </p>
              </div>
            </div>

            {renderAuthBadge()}

            {/* 🥤 Banner de Somatório de Água do Educador */}
            {(() => {
              const allHidsGlobal = getFromDB<any[]>('anjo_hidratacao', []);
              const teacherNameClean = usuarioAtual?.nome || '';
              const teacherHidsToday = allHidsGlobal.filter(h => isTodayOrDemoDate(h.data) && (h.registradoPor === teacherNameClean || (teacherNameClean && h.registradoPor && h.registradoPor.toLowerCase().includes(teacherNameClean.toLowerCase().split(' ')[0]))));
              const totalTeacherMl = teacherHidsToday.reduce((sum, h) => sum + (h.quantidadeMl || 0), 0);
              const totalTeacherCups = teacherHidsToday.length;

              return (
                <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl text-2xl font-black shrink-0">
                      🥤
                    </div>
                    <div>
                      <h4 className="text-sm font-black flex items-center gap-2">
                        Somatório de Água Servida por Você
                        <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Professora
                        </span>
                      </h4>
                      <p className="text-xs text-cyan-100 font-medium">
                        Total acumulado servido por {usuarioAtual?.nome || 'você'} durante o turno de hoje.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-center self-stretch sm:self-auto justify-around">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-200 block">Total Servido</span>
                      <span className="text-xl font-black text-white">{totalTeacherMl} ml</span>
                    </div>
                    <div className="border-l border-white/20 pl-3">
                      <span className="text-[10px] uppercase font-bold text-cyan-200 block">Porções/Copos</span>
                      <span className="text-xl font-black text-white">{totalTeacherCups}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Simulated interactive water jug filling anim */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                
                {/* Visual Glass/Jug Animation */}
                <div className="relative w-44 h-60 border-4 border-slate-300 rounded-b-3xl rounded-t-lg bg-white overflow-hidden shadow-inner flex flex-col justify-end">
                  {/* Fluid liquid filling */}
                  <div 
                    className="bg-sky-400/80 w-full rounded-b-xl transition-all duration-700 relative"
                    style={{ height: `${percentHydrated}%` }}
                  >
                    {/* Ripple visual top border elements */}
                    <div className="absolute top-0 left-0 right-0 h-3 bg-sky-200/80 animate-pulse rounded-t"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center text-white font-black font-mono text-2xl select-none text-shadow-sm">
                      {percentHydrated}%
                    </div>
                  </div>

                  {/* Measuring lines on water cup layout */}
                  <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between p-4 pointer-events-none select-none">
                    <div className="border-t border-slate-200 text-right text-[10px] font-bold text-slate-400">1.500 ml (Meta)</div>
                    <div className="border-t border-slate-200 text-right text-[10px] font-bold text-slate-400">1.000 ml</div>
                    <div className="border-t border-slate-200 text-right text-[10px] font-bold text-slate-400">500 ml</div>
                    <div className="border-t border-slate-200 text-right text-[10px] font-bold text-slate-400">250 ml</div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-slate-550">Progresso de Hoje</p>
                  <p className="text-2xl font-black text-slate-800">{totalMl} ml <span className="text-base font-normal text-slate-400">de 1500 ml (Meta Diária)</span></p>
                </div>
              </div>

              {/* Water logging interaction buttons */}
              <div className="space-y-6">
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center gap-3 text-cyan-800">
                  <div className="p-2 bg-cyan-200 rounded-md">
                    <Award className="w-5 h-5 text-cyan-700" />
                  </div>
                  <div>
                    <strong className="text-sm block font-bold leading-tight">Alerta de Hidratação Constante</strong>
                    <span className="text-[11px] leading-relaxed block font-medium">Oferecer pequenas doses ao longo do dia, idealmente a cada 2 horas.</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-705 block">Escolha o tamanho do copo servido:</label>
                    <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-md">
                      Controle em mL
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddWater(50)}
                      className="py-3 px-2 border rounded-2xl transition-all cursor-pointer text-center group flex flex-col items-center gap-1 focus:ring-2 border-cyan-200 hover:border-cyan-300 bg-white hover:bg-cyan-50/50 focus:ring-cyan-300"
                    >
                      <Droplets className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 block">Copinho</span>
                      <strong className="text-xs text-cyan-600 font-mono font-black">50 ml</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddWater(100)}
                      className="py-3 px-2 border rounded-2xl transition-all cursor-pointer text-center group flex flex-col items-center gap-1 focus:ring-2 border-cyan-300 hover:border-cyan-400 bg-cyan-50/20 hover:bg-cyan-100/50 focus:ring-cyan-400"
                    >
                      <Droplets className="w-4.5 h-4.5 text-cyan-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 block">Copo Médio</span>
                      <strong className="text-xs text-cyan-700 font-mono font-black">100 ml</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddWater(150)}
                      className="py-3 px-2 border rounded-2xl transition-all cursor-pointer text-center group flex flex-col items-center gap-1 focus:ring-2 border-indigo-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 focus:ring-indigo-300"
                    >
                      <Droplets className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 block">Copo Grande</span>
                      <strong className="text-xs text-indigo-700 font-mono font-black">150 ml</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddWater(200)}
                      className="py-3 px-2 border rounded-2xl transition-all cursor-pointer text-center group flex flex-col items-center gap-1 focus:ring-2 border-sky-200 hover:border-sky-300 bg-white hover:bg-sky-50/50 focus:ring-sky-300"
                    >
                      <Droplets className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 block">Copo Cheio</span>
                      <strong className="text-xs text-sky-700 font-mono font-black">200 ml</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddWater(250)}
                      className="py-3 px-2 border rounded-2xl transition-all cursor-pointer text-center group flex flex-col items-center gap-1 focus:ring-2 border-teal-200 hover:border-teal-300 bg-white hover:bg-teal-50/50 focus:ring-teal-300"
                    >
                      <Droplets className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 block">Caneca / Garrafa</span>
                      <strong className="text-xs text-teal-700 font-mono font-black">250 ml</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddWater(300)}
                      className="py-3 px-2 border rounded-2xl transition-all cursor-pointer text-center group flex flex-col items-center gap-1 focus:ring-2 border-blue-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 focus:ring-blue-300"
                    >
                      <Droplets className="w-5.5 h-5.5 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 block">Squeeze Infantil</span>
                      <strong className="text-xs text-blue-700 font-mono font-black">300 ml</strong>
                    </button>
                  </div>

                  {/* Custom ml volume input / stepper */}
                  <div className="p-3.5 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-2xl border border-cyan-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-cyan-600" />
                        Quantidade Personalizada (mL):
                      </span>
                      <span className="text-xs font-mono font-black text-cyan-800 bg-white px-2 py-0.5 rounded-md border border-cyan-200">
                        {waterAmount} ml
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-cyan-200 shadow-3xs">
                        <button
                          type="button"
                          onClick={() => setWaterAmount(prev => Math.max(10, prev - 10))}
                          className="w-7 h-7 bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 rounded-lg text-cyan-800 font-bold text-sm flex items-center justify-center cursor-pointer"
                          title="Diminuir 10ml"
                        >
                          -10
                        </button>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          step="10"
                          value={waterAmount}
                          onChange={e => setWaterAmount(Math.max(10, Number(e.target.value) || 10))}
                          className="w-16 text-center text-xs font-black text-slate-800 bg-transparent border-0 focus:outline-hidden font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setWaterAmount(prev => Math.min(1000, prev + 10))}
                          className="w-7 h-7 bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 rounded-lg text-cyan-800 font-bold text-sm flex items-center justify-center cursor-pointer"
                          title="Aumentar 10ml"
                        >
                          +10
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddWater(waterAmount)}
                        className="flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white"
                      >
                        <Droplets className="w-3.5 h-3.5" />
                        <span>Registrar Dose (+{waterAmount}ml)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Listing historic fluids logged today */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 block">Registros do dia ({hidratacaoToday.length} copos / doses):</span>
                    <span className="text-xs font-black text-cyan-700 font-mono">{totalMl} ml total</span>
                  </div>
                  {hidratacaoToday.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum copo de água registrado hoje ainda.</p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                      {hidratacaoToday.map(h => (
                        <div key={h.id} className="flex justify-between items-center text-xs text-slate-700 font-medium py-1.5 px-2 bg-white rounded-lg border border-slate-200/70 shadow-3xs">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{h.quantidadeMl} ml</span>
                            <span className="text-[11px] font-normal text-slate-400">às {h.horario}</span>
                          </span>
                          <span className="text-slate-400 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{h.registradoPor || 'Professora'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============== TAB: SONO =============== */}
        {activeTab === 'sono' && (
          <form onSubmit={handleSaveSleep} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isFundamental ? 'Controle de Tarefa / Dever de Casa' : (isEscolar ? 'Controle de Descanso e Soneca' : 'Diário e Qualidade de Sono')}
                </h3>
                <p className="text-xs text-slate-400">
                  {isFundamental 
                    ? 'Acompanhe as tarefas e deveres para casa dadas pelos professores e o andamento da sua realização.'
                    : isEscolar 
                      ? 'Registre a soneca pós-almoço ou períodos de descanso do aluno na escola.' 
                      : 'Preencha o padrão de descanso noturno ou sono da tarde.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isFundamental ? (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-705 block">Matéria / Disciplina</label>
                  <select 
                    value={sleepForm.dormiuEm}
                    onChange={e => setSleepForm({ ...sleepForm, dormiuEm: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-550/20 text-sm font-medium text-slate-800"
                  >
                    <option value="">-- Selecione a Matéria --</option>
                    <option value="Matemática">📐 Matemática</option>
                    <option value="Português">✏️ Língua Portuguesa / Redação</option>
                    <option value="História">🌍 História</option>
                    <option value="Geografia">🌍 Geografia</option>
                    <option value="Ciências">🔬 Ciências da Natureza</option>
                    <option value="Inglês">💬 Língua Estrangeira (Inglês)</option>
                    <option value="Artes">🎨 Artes / Projetos</option>
                    <option value="Outro">🎒 Outra Matéria / Recado</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-705 block">
                    {isEscolar ? 'Início da soneca' : 'Que horas dormiu?'}
                  </label>
                  <input 
                    type="time" 
                    value={sleepForm.dormiuEm}
                    onChange={e => setSleepForm({ ...sleepForm, dormiuEm: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-550/20 text-sm"
                  />
                </div>
              )}

              {isFundamental ? (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-705 block">Prazo de Entrega / Data</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Próxima aula ou Amanhã (29/06)"
                    value={sleepForm.acordouEm}
                    onChange={e => setSleepForm({ ...sleepForm, acordouEm: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-550/20 text-sm font-bold text-slate-800"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-705 block">
                    {isEscolar ? 'Acordou às' : 'Que horas acordou?'}
                  </label>
                  <input 
                    type="time" 
                    value={sleepForm.acordouEm}
                    onChange={e => setSleepForm({ ...sleepForm, acordouEm: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-550/20 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-750 block">
                  {isFundamental ? 'Páginas / Exercícios Solicitados' : (isEscolar ? 'Acordou/Agitou durante o descanso?' : 'Despertares no meio da noite (interrupções)')}
                </label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder={isFundamental ? 'Ex: 4' : (isEscolar ? 'Ex: dengo comum ou engasgo de tosse' : 'Ex: 1')}
                  value={sleepForm.interrupcoes}
                  onChange={e => setSleepForm({ ...sleepForm, interrupcoes: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-550/20 text-sm font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-750 block">
                  {isFundamental ? 'Status de Realização' : 'Qualidade do descanso'}
                </label>
                <div className="flex gap-2 pt-1">
                  {['excelente', 'boa', 'regular', 'ruim'].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSleepForm({ ...sleepForm, qualidade: q as any })}
                      className={`flex-1 py-2 px-0.5 text-center text-xs font-bold border rounded-lg uppercase transition-all cursor-pointer ${
                        sleepForm.qualidade === q 
                          ? (isEscolar ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-purple-600 text-white border-purple-600 shadow-xs')
                          : 'bg-slate-50 border-slate-250 text-slate-600'
                      }`}
                    >
                      {isFundamental 
                        ? (q === 'excelente' ? 'Completo' : q === 'boa' ? 'Em Andamento' : q === 'regular' ? 'Incomplete' : 'Não Fez')
                        : isEscolar 
                          ? (q === 'excelente' ? 'Tranquilo' : q === 'boa' ? 'Leve' : q === 'regular' ? 'Agitado' : 'Choroso') 
                          : q
                      }
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-705 block">Observações do Dever / Atividade</label>
                  <VoiceInput 
                    onTranscript={text => setSleepForm(prev => ({ ...prev, obs: prev.obs ? prev.obs + ' ' + text : text }))} 
                    size="sm"
                  />
                </div>
                <textarea 
                  placeholder={isFundamental ? "Ex: Fez todas as questões de frações. Apresentou dúvidas simples na divisão." : isEscolar ? "Ex: precisou de cafuné para acalmar mas descansou super bem por 1h30m." : "Ex: acordou confusa às 03:00, mas bebeu meio copo de água e voltou a descansar rapidamente."}
                  rows={2}
                  value={sleepForm.obs}
                  onChange={e => setSleepForm({ ...sleepForm, obs: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-800"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className={`px-5 py-3 ${isEscolar ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-serene-blue hover:bg-blue-600'} text-white font-bold rounded-xl active:scale-95 transition-all text-sm block ml-auto cursor-pointer shadow-sm`}
            >
              {isFundamental ? 'Registrar Dever de Casa' : (isEscolar ? 'Registrar Soneca do Aluno' : 'Registrar Sono Noturno')}
            </button>
          </form>
        )}

        {/* =============== TAB: HUMOR =============== */}
        {activeTab === 'humores' && (
          <form onSubmit={handleSaveHumor} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <Smile className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEscolar ? 'Estado de Humor & Convivência Social' : 'Estado Psicoemocional e Humor'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEscolar 
                    ? 'Registre como foi a socialização da criança e seu temperamento predominantemente.' 
                    : 'Monitore as variações de comportamento e humor do idoso ao longo das visitas.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-705 block text-center">
                {isEscolar ? 'Como o aluno se comportou e conviveu hoje?' : 'Como o idoso está se sentindo / comportando agora?'}
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {isEscolar ? (
                  [
                    { id: 'feliz', label: '😊 Alegre / Lúdico', bgSel: 'bg-emerald-500 text-white border-emerald-500' },
                    { id: 'calmo', label: '😌 Calmo / Atento', bgSel: 'bg-indigo-600 text-white border-indigo-600' },
                    { id: 'choroso', label: '🥺 Choroso / Manhoso', bgSel: 'bg-amber-500 text-white border-amber-500' },
                    { id: 'timido', label: '🫣 Tímido / Calado', bgSel: 'bg-blue-500 text-white border-blue-500' },
                    { id: 'agitado', label: '🤪 Muito Agitado / Elétrico', bgSel: 'bg-orange-500 text-white border-orange-500' },
                    { id: 'birra', label: '😤 Birra / Teimosia', bgSel: 'bg-rose-500 text-white border-rose-500' },
                    { id: 'sonolento', label: '😴 Preguiça / Sono', bgSel: 'bg-purple-500 text-white border-purple-500' }
                  ].map(item => {
                    const active = humorForm.estado === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHumorForm({ ...humorForm, estado: item.id as any })}
                        className={`py-3.5 px-3 rounded-2xl text-center text-sm font-bold border transition-all cursor-pointer ${
                          active 
                            ? `${item.bgSel} scale-102 shadow-md` 
                            : 'bg-slate-50 border-slate-250 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })
                ) : (
                  [
                    { id: 'feliz', label: '😊 Feliz', bgSel: 'bg-emerald-500 text-white border-emerald-500' },
                    { id: 'calmo', label: '😌 Calmo', bgSel: 'bg-emerald-650 text-white border-emerald-650' },
                    { id: 'agitado', label: '😰 Agitado', bgSel: 'bg-amber-500 text-white border-amber-500' },
                    { id: 'triste', label: '😢 Triste', bgSel: 'bg-indigo-500 text-white border-indigo-500' },
                    { id: 'confuso', label: '🤔 Confuso', bgSel: 'bg-indigo-600 text-white border-indigo-600' },
                    { id: 'sonolento', label: '😴 Sonolento', bgSel: 'bg-purple-500 text-white border-purple-500' },
                    { id: 'irritado', label: '😠 Irritado', bgSel: 'bg-rose-500 text-white border-rose-500' }
                  ].map(item => {
                    const active = humorForm.estado === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHumorForm({ ...humorForm, estado: item.id as any })}
                        className={`py-3.5 px-3 rounded-2xl text-center text-sm font-bold border transition-all cursor-pointer ${
                          active 
                            ? `${item.bgSel} scale-102 shadow-md` 
                            : 'bg-slate-50 border-slate-250 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })
                )}
              </div>

              {ultimoHumor && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-650">
                  ⚡ Último estado registrado: <strong className="uppercase">{ultimoHumor.estado}</strong> ({ultimoHumor.horario} do dia {ultimoHumor.data}) {ultimoHumor.observacoes ? ` - "${ultimoHumor.observacoes}"` : ''}
                </div>
              )}

              <div className="space-y-1 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-705 block">
                    {isEscolar ? 'Observações adicionais de convívio ou choro' : 'Observações do cuidador / gatilhos emocionais'}
                  </label>
                  <VoiceInput 
                    onTranscript={text => setHumorForm(prev => ({ ...prev, obs: prev.obs ? prev.obs + ' ' + text : text }))} 
                    size="sm"
                  />
                </div>
                <textarea 
                  placeholder={isEscolar ? "Ex: dividiu os brinquedos com o bento no pátio e deu risada, mas chorou um pouquinho na hora de entrar." : "Ex: Demonstrou teimosia benigna com os remédios, mas sorriu quando mostramos fotos da neta."}
                  rows={2}
                  value={humorForm.obs}
                  onChange={e => setHumorForm({ ...humorForm, obs: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className={`px-5 py-3 ${isEscolar ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-serene-blue hover:bg-blue-600'} text-white font-bold rounded-xl active:scale-95 transition-all text-sm block ml-auto cursor-pointer shadow-sm`}
            >
              {isEscolar ? 'Acompanhar Humor & Socialização' : 'Registrar Humor (Avisar Família)'}
            </button>
          </form>
        )}

        {/* =============== TAB: ATIVIDADES =============== */}
        {activeTab === 'atividades' && (
          <form onSubmit={handleSaveActivity} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEscolar ? 'Atividades Pedagógicas, Psicomotoras e Lúdicas' : 'Atividades Físicas e Estimulação Cognitiva'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEscolar 
                    ? 'Registre as brincadeiras, artes, histórias e atividades psicomotoras realizadas hoje.' 
                    : 'Atividades preservam a cognição e esticam músculos articulares.'}
                </p>
              </div>
            </div>

            {/* Mode Switcher: Registro Avulso vs Importar Planejamento Aura */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => setActivityTabMode('direto')}
                className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activityTabMode === 'direto'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📌 Registro Avulso Diário
              </button>
              <button
                type="button"
                onClick={() => setActivityTabMode('planejamento_aura')}
                className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activityTabMode === 'planejamento_aura'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold'
                }`}
              >
                🧠 Importar Planejamento Semanal (Aura)
              </button>
            </div>

            {activityTabMode === 'planejamento_aura' ? (
              <div className="space-y-4 bg-gradient-to-b from-indigo-50/80 to-purple-50/50 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 rounded-xl text-white shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 fill-amber-300/40" />
                    <span>Padrão Oficial de Planejamento de Professores + Aura AI</span>
                  </div>
                  <p className="text-xs text-white/95 leading-relaxed font-medium">
                    Cole qualquer texto bruto, relatório de aula ou planejamento semanal de professores. A <strong>Aura AI</strong> extrai e padroniza automaticamente todos os campos pedagógicos oficiais:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 text-[10px] pt-1 font-semibold text-amber-100">
                    <div>📌 <strong>Atividade / Tema</strong></div>
                    <div>🗓️ <strong>Dia & Horário</strong></div>
                    <div>⏱️ <strong>Duração (min)</strong></div>
                    <div>🎯 <strong>Objetivo BNCC</strong></div>
                    <div>🎒 <strong>Materiais & Recursos</strong></div>
                    <div>📖 <strong>Passo a Passo / Instruções</strong></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <span>👇</span> COLE O PLANO DE AULA / TEXTO BRUTO AQUI:
                  </label>
                  <textarea
                    rows={6}
                    value={weeklyPlanText}
                    onChange={e => setWeeklyPlanText(e.target.value)}
                    placeholder={`Cole aqui o texto do planejamento de aula. Exemplo:

Segunda-feira:
- 09:00: Roda de Leitura e Contos (30 min) - Objetivo: Linguagem e oralidade. Materiais: Livro de fábulas e fantoches. Passo a passo: Organizar roda e ler a fábula com entonação de voz.
- 14:00: Pintura de Dedos (45 min) - Materiais: Tinta guache e papel craft.

Terça-feira:
- 10:00: Musicalização e Bandinha (30 min) - Objetivo: Sons, cores e formas. Materiais: Chocalhos e tambores.`}
                    className="w-full p-4 bg-white border-2 border-indigo-300 focus:border-indigo-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 text-xs font-mono text-slate-800 shadow-inner"
                  ></textarea>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    disabled={isParsingWeeklyPlan}
                    onClick={handleParseWeeklyPlan}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isParsingWeeklyPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraindo e Padronizando com Aura...</span>
                      </>
                    ) : (
                      <>
                        <span>🧠 Extrair & Padronizar com Aura</span>
                      </>
                    )}
                  </button>
                </div>

                {parsedWeeklyActivities.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-indigo-100">
                    {/* Cabeçalho no Padrão Manual Pedagógico */}
                    <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                          <span>📋</span> Planejamento Diário: {parsedAuraMeta?.tema || 'Rotina Pedagógica'}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                          {parsedWeeklyActivities.length} Atividades
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">📅 Data</span>
                          <span className="font-extrabold text-slate-800">{parsedAuraMeta?.dataStr || parsedAuraMeta?.dia || 'Segunda-feira'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">🎨 Tema do Dia</span>
                          <span className="font-extrabold text-indigo-900">{parsedAuraMeta?.tema || 'Identidade e Desenvolvimento'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">👶 Turma</span>
                          <span className="font-extrabold text-purple-900">{parsedAuraMeta?.turma || getStudentClassroomLocal(idoso.nome)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[260px] overflow-y-auto shadow-inner">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="p-2.5 w-20">Horário</th>
                            <th className="p-2.5 w-1/3">Atividade Padronizada</th>
                            <th className="p-2.5">Objetivo BNCC & Descrição</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedWeeklyActivities.map((act, i) => (
                            <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="p-2.5 font-mono font-extrabold text-indigo-700 text-xs">{String(act.horario || '09:00')}</td>
                              <td className="p-2.5">
                                <span className="font-bold text-slate-900 block text-xs">{String(act.tipo || 'Atividade')}</span>
                                {act.duracao ? (
                                  <span className="text-[10px] text-slate-400 font-medium">⏱️ {act.duracao} min</span>
                                ) : null}
                              </td>
                              <td className="p-2.5 space-y-1">
                                {act.objetivoBNCC && (
                                  <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 mr-1.5">
                                    🎯 {act.objetivoBNCC}
                                  </span>
                                )}
                                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{String(act.obs || '')}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setParsedWeeklyActivities([]); setParsedAuraMeta(null); }}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Limpar Resultados
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveParsedWeeklyPlan}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <span>💾 Confirmar e Cadastrar no Padrão Escolar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEscolar && (
                <div className="sm:col-span-2 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider block flex items-center gap-1">
                      👥 Alcance do Registro Pedagógico
                    </span>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Selecione se o registro é individual para <strong>{idoso.nome}</strong> ou coletivo para toda a turma <strong>{getStudentClassroomLocal(idoso.nome)}</strong>.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActivityScope('individual')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        activityScope === 'individual'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black'
                          : 'bg-white text-slate-650 border-slate-205 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityScope('coletivo')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        activityScope === 'coletivo'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black'
                          : 'bg-white text-slate-650 border-slate-205 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" /> Classe Toda
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-705 block">Qual atividade foi realizada?</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      🎙️ Voz
                    </span>
                    <VoiceInput 
                      onTranscript={text => setActivityForm(prev => ({ ...prev, tipo: text }))} 
                      size="sm"
                    />
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    value={activityForm.tipo}
                    onChange={e => setActivityForm({ ...activityForm, tipo: e.target.value })}
                    placeholder={isEscolar ? "Ex: Pintura, Teatrinho, Recreação..." : "Ex: Alongamento, Caminhada..."}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
                  />
                  <div className="absolute right-3 text-slate-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Quick Suggestion Pills */}
                <div className="pt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Sugestões rápidas (Clique para selecionar):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(isFundamental ? [
                      { label: "📚 Aulas & Explicações", val: "Aulas e Matérias Regulares" },
                      { label: "📝 Provas / Testes", val: "Provas e Avaliações" },
                      { label: "⚽ Ed. Física", val: "Educação Física e Esportes" },
                      { label: "🎨 Oficina de Artes", val: "Artes e Expressão Gráfica" },
                      { label: "🔬 Ciências", val: "Laboratório / Ciências" },
                      { label: "📖 Leitura / Redação", val: "Leitura e Produção de Texto" }
                    ] : isEscolar ? [
                      { label: "🎨 Pintura & Desenho", val: "Pintura e Artes Visuais" },
                      { label: "📖 Contação de Histórias", val: "Roda de Leitura e Contos" },
                      { label: "🎵 Musicalização", val: "Musicalização Infantil" },
                      { label: "🏃‍♂️ Psicomotricidade", val: "Psicomotricidade no Parque" },
                      { label: "🧩 Peças de Encaixe", val: "Peças de Encaixe e Blocos" },
                      { label: "💬 Prática de Inglês", val: "Atividade de Linguagem/Inglês" }
                    ] : [
                      { label: "🧘 Alongamento", val: "Alongamento Leve" },
                      { label: "🚶 Caminhada", val: "Caminhada Assistida" },
                      { label: "🧠 Atv. Cognitiva", val: "Atividade Cognitiva" },
                      { label: "🌿 Recreação no Jardim", val: "Recreação no Jardim" },
                      { label: "📖 Leitura", val: "Leitura ou Conversa" },
                      { label: "🩺 Fisioterapia", val: "Fisioterapia" }
                    ]).map((sug) => (
                      <button
                        key={sug.val}
                        type="button"
                        onClick={() => setActivityForm(prev => ({ ...prev, tipo: sug.val }))}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                          activityForm.tipo === sug.val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-205 hover:border-slate-300'
                        }`}
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-750 block">Duração (Minutos)</label>
                  <span className="text-[10px] text-amber-600 font-extrabold uppercase bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Reloginho
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivityForm(prev => ({ ...prev, duracao: Math.max(5, prev.duracao - 5) }))}
                    className="p-2 bg-slate-100 border border-slate-250 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer font-extrabold flex items-center justify-center shrink-0 w-10 h-10 shadow-3xs"
                    title="Diminuir 5 minutos"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      min="5" 
                      max="120"
                      value={activityForm.duracao}
                      onChange={e => setActivityForm({ ...activityForm, duracao: Number(e.target.value) })}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-extrabold text-slate-800 text-center"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivityForm(prev => ({ ...prev, duracao: Math.min(180, prev.duracao + 5) }))}
                    className="p-2 bg-slate-100 border border-slate-250 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer font-extrabold flex items-center justify-center shrink-0 w-10 h-10 shadow-3xs"
                    title="Aumentar 5 minutos"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Reloginho Preset Pills */}
                <div className="pt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Durações comuns:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[15, 20, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setActivityForm(prev => ({ ...prev, duracao: mins }))}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          activityForm.duracao === mins
                            ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-2xs scale-102 font-black'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-205 hover:border-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{mins} min</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-705 block">
                    {isEscolar ? 'Observações do Rendimento Pedagógico' : 'Observações do Rendimento e Reação Física/Mental'}
                  </label>
                  <VoiceInput 
                    onTranscript={text => setActivityForm(prev => ({ ...prev, obs: prev.obs ? prev.obs + ' ' + text : text }))} 
                    size="sm"
                  />
                </div>
                <textarea 
                  placeholder={isFundamental ? "Ex: Resolveu os exercícios de frações com facilidade e prestou bastante atenção na explicação de Ciências por 40 min." : isEscolar ? "Ex: Adorou pintar a folha com tinta guache azul e demonstrou excelente foco por 25 min." : "Ex: aceitou muito bem fazer os exercícios cognitivos de reconhecer nomes, mas cansou rápida em 15min."}
                  rows={2}
                  value={activityForm.obs}
                  onChange={e => setActivityForm({ ...activityForm, obs: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-800"
                ></textarea>
              </div>

              {/* TRABALHINHOS PHOTO UPLOAD SECTOR */}
              <div className="space-y-4 sm:col-span-2 bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100/60 font-sans">
                <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                  🖼️ {isEscolar ? 'Fotos dos Trabalhinhos / Atividade do Aluno' : 'Fotos de Comprovação da Atividade'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload button area */}
                  <div className="flex flex-col justify-center items-center p-4 border border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-all cursor-pointer relative min-h-[90px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Sparkles className="w-5 h-5 text-indigo-500 mb-1 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">Tirar Foto ou Upload</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Capturar câmera ou escolher arquivo</span>
                  </div>

                  {/* Pre-made quick templates */}
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-900/60 block">{isFundamental ? 'Prefere simular uma tarefa do aluno?' : 'Prefere simular um desenho do aluno?'}</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(isFundamental ? [
                        { name: "📝 Redação Feita", url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=440&auto=format&fit=crop&q=60" },
                        { name: "📐 Conta Matemática", url: "https://images.unsplash.com/photo-1453733190148-c44698c265a8?w=440&auto=format&fit=crop&q=60" },
                        { name: "🔬 Experimento", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=440&auto=format&fit=crop&q=60" },
                        { name: "🎨 Trabalho Artes", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=440&auto=format&fit=crop&q=60" }
                      ] : [
                        { name: "🎨 Pintura de Flor", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=440&auto=format&fit=crop&q=60" },
                        { name: "🖍️ Giz de Cera", url: "https://images.unsplash.com/photo-1596495574221-8fcb78c772cb?w=440&auto=format&fit=crop&q=60" },
                        { name: "🧩 Castelo de Blocos", url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=440&auto=format&fit=crop&q=60" },
                        { name: "🧸 Massa Modelar", url: "https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?w=440&auto=format&fit=crop&q=60" }
                      ]).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivityForm(prev => ({ ...prev, fotoTrabalhinho: preset.url }))}
                          className={`px-2 py-1 text-[10px] border rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-slate-700 font-bold flex items-center justify-between gap-1 cursor-pointer truncate ${activityForm.fotoTrabalhinho === preset.url ? 'bg-indigo-100/50 border-indigo-400 ring-1 ring-indigo-400/50' : 'bg-white border-slate-205'}`}
                        >
                          <span className="truncate">{preset.name}</span>
                          <span className="text-[9px] text-indigo-500 font-bold shrink-0">Usar</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Previews uploaded artwork */}
                {activityForm.fotoTrabalhinho && (
                  <div className="mt-3 flex items-center gap-3 bg-white p-2 rounded-xl border border-indigo-200/50 animate-fade-in">
                    <img 
                      src={activityForm.fotoTrabalhinho} 
                      alt="Trabalhinho selecionado" 
                      className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800 truncate">✓ Trabalhinho Anexado</p>
                      <p className="text-[9px] text-indigo-550 font-semibold">Salvar para enviar à galeria do dia</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivityForm(prev => ({ ...prev, fotoTrabalhinho: '' }))}
                      className="px-2.5 py-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-transparent"
                    >
                      Remover ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}

            {activityTabMode === 'direto' && (
              <button
                type="submit"
                className={`px-5 py-3 ${isEscolar ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-serene-blue hover:bg-blue-600'} text-white font-bold rounded-xl active:scale-95 transition-all text-sm block ml-auto cursor-pointer shadow-sm`}
              >
                {isEscolar ? '📸 + Registrar Nova Lembrança na Jornada' : 'Registrar Atividade Diária'}
              </button>
            )}

            {/* HISTORICAL REGISTERED ACTIVITIES LOG FOR TODAY */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  📂 {isEscolar ? 'Trabalhinhos e Atividades Registradas Hoje' : 'Registro de Exercícios e Atividades Recentes'}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {atividadesToday.length > 0 && isStaffUser(usuarioAtual) && (
                    <button
                      type="button"
                      onClick={handleClearAllActivitiesToday}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Limpar todas as atividades registradas hoje"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar Atividades</span>
                    </button>
                  )}
                  {isEscolar && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSlideIndex(0);
                        setSlideshowActive(false);
                        setShowGalleryShow(true);
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md flex items-center gap-1.5 transition-all hover:scale-102 active:scale-95 cursor-pointer"
                    >
                      🎨 Apresentação de Trabalhinhos (Slideshow)
                    </button>
                  )}
                </div>
              </div>
              
              {atividadesToday.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Ainda não há atividades registradas para hoje. Preencha o formulário acima para registrar e anexar fotos dos trabalhinhos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {atividadesToday.map((ati) => (
                    <div key={ati.id} className="bg-white p-4 border border-slate-150 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">
                            ⏱️ {ati.horario}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`${isEscolar ? 'text-indigo-600' : 'text-emerald-600'} font-bold`}>
                              {ati.duracaoMinutos} min
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(ati.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent"
                              title="Excluir Atividade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm truncate">{ati.tipo}</h5>
                        {ati.observacoes && (
                          <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-dotted border-slate-200 break-words">
                            "{ati.observacoes}"
                          </p>
                        )}
                      </div>

                      {ati.fotoTrabalhinho && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-150 bg-slate-100 relative group">
                          <img 
                            src={ati.fotoTrabalhinho} 
                            alt={`Trabalhinho de ${ati.tipo}`} 
                            className="w-full h-44 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[10px] text-white text-center font-bold">
                            🎨 {isEscolar ? 'Trabalhinho Registrado na Rotina' : 'Registro Visual da Atividade'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}

        {/* =============== TAB: RECADO / MURAL DE COMUNICACAO =============== */}
        {activeTab === 'recados' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 animate-pulse">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEscolar ? 'Mural de Recados (Mão Dupla Pais & Professores)' : 'Caderno de Recados do Idoso'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEscolar 
                    ? 'Canal ágil de recados entre pais, professora e coordenação. Notificações imediatas integradas.' 
                    : 'Anotações rápidas de acompanhamento, solicitações da família ou comunicações da equipe médica.'}
                </p>
              </div>
            </div>

            {/* Warning card to highlight the bi-lateral communication flow */}
            <div className={`p-4 rounded-2xl border text-sm ${isEscolar ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900' : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'}`}>
              <p className="font-semibold mb-1">💡 Como funciona este Mural de Mão Dupla?</p>
              <p className="text-xs leading-relaxed text-slate-600">
                Se os <strong>Pais</strong> escreverem, a <strong>Professora</strong> receberá um alerta em tempo real e dará visto. 
                Se a <strong>Professora</strong> registrar uma tarefa pedagógica ou comportamento, os <strong>Pais</strong> receberão no WhatsApp! 
                Seu perfil atual é: <span className="bg-white/80 px-2 py-0.5 rounded border font-bold text-slate-800 uppercase text-[10px]">{usuarioAtual.tipo} ({usuarioAtual.nome})</span>
              </p>
            </div>

            {/* SEND NEW MESSAGE FORM */}
            <form onSubmit={handleSaveRecado} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Escrever Novo Recado ou Memorando</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Assunto / Categoria</label>
                  <select
                    value={newRecadoForm.categoria}
                    onChange={e => setNewRecadoForm({ ...newRecadoForm, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-rose-500/25 text-xs text-slate-700 font-semibold"
                  >
                    {isEscolar ? (
                      <>
                        <option value="geral">💬 Recado Geral / Comunicado</option>
                        <option value="alimentacao">🎒 Material ou Alimentação</option>
                        <option value="saude_sono">💊 Vacina ou Remédio</option>
                        <option value="pedagogico">🎨 Feedback Pedagógico</option>
                      </>
                    ) : (
                      <>
                        <option value="geral">💬 Recado Geral</option>
                        <option value="saude_remedios">💊 Saúde / Remédios</option>
                        <option value="alimentacao">🍎 Alimentação / Compras</option>
                        <option value="intercorrencia">🚨 Intercorrência / Alerta</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Escreva sua mensagem aqui</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newRecadoForm.mensagem}
                      onChange={e => setNewRecadoForm({ ...newRecadoForm, mensagem: e.target.value })}
                      placeholder={isEscolar ? "Ex: Professora, favor administrar o xarope às 14:00 que deixei na mochila." : "Ex: Acabou as fraldas G, favor trazer novo fardo na visita de amanhã."}
                      className="w-full pl-3 pr-20 py-2 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-rose-450/20 text-xs text-slate-800 animate-none"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <VoiceInput 
                        onTranscript={text => setNewRecadoForm(prev => ({ ...prev, mensagem: prev.mensagem ? prev.mensagem + ' ' + text : text }))} 
                        size="sm"
                        className="bg-transparent border-none! hover:bg-slate-100 p-1 rounded-lg"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg active:scale-90 transition-transform cursor-pointer"
                        title="Enviar recado"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* MESSAGE ITERATION BOARD */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-450 uppercase tracking-widest block">Mural de Mensagens Históricas ({recados.length})</span>
                <div className="flex items-center gap-2">
                  {recados.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllRecados}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Limpar todos os recados deste aluno"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar Mural
                    </button>
                  )}
                  <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">Atualizado em Tempo Real</span>
                </div>
              </div>

              {recados.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-bold">Nenhum recado no mural para hoje.</p>
                  <p className="text-xs">Seja o primeiro a enviar uma mensagem para coordenar os cuidados!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {recados.map((rec) => {
                    const isSystemOrProf = rec.tipo === 'prof_para_pais';
                    // Determine category badges
                    const getCategoryBadge = (cat: string) => {
                      switch(cat) {
                        case 'saude_remedios': case 'saude_sono':
                          return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase">💊 Saúde</span>;
                        case 'alimentacao':
                          return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase">🍼 Alimentação</span>;
                        case 'pedagogico':
                          return <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase">🎨 Pedagógico</span>;
                        case 'intercorrencia':
                          return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase">🚨 Intercorrência</span>;
                        default:
                          return <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase">💬 Comunicado</span>;
                      }
                    };

                    return (
                      <div 
                        key={rec.id} 
                        className={`p-4 rounded-2xl border transition-all ${
                          rec.lido 
                            ? 'bg-white border-slate-150 shadow-xs' 
                            : 'bg-rose-50/20 border-rose-100 shadow-xs ring-1 ring-rose-300/30'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-dotted border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{rec.remetente}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isSystemOrProf ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rec.cargo || (isSystemOrProf ? 'Equipe Profissional' : 'Família')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(rec.categoria)}
                            <span className="text-[10px] text-slate-450 font-mono flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg shadow-3xs" title="Sincronizado em tempo real">
                              <Clock className="w-3 h-3 text-indigo-500 animate-pulse" />
                              {rec.dataHora}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecado(rec.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir este recado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                          {rec.mensagem}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/50">
                          {rec.lido ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-bold">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Visto por {rec.lidoPor || 'Coordenação'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-550 font-black animate-pulse">
                                ● Novo Recado
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => handleMarkRecadoAsRead(rec.id)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Marcar como Lido ✓
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== DIGITAL ART EXHIBITION SLIDESHOW MODAL =============== */}
        {showGalleryShow && (
          <div className="fixed inset-0 z-55 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in font-sans">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col justify-between relative">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    🎨 Expositor e Galeria de Arte Digital
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Anjinho Escolar • Exposição de Trabalhinhos e Atividades
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl self-start md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryFilter('aluno');
                      setCurrentSlideIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      galleryFilter === 'aluno'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-300/40'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Apenas {idoso.nome.split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryFilter('classe');
                      setCurrentSlideIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      galleryFilter === 'classe'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-300/40'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Sala {getStudentClassroomLocal(idoso.nome)}
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowGalleryShow(false);
                    setSlideshowActive(false);
                  }}
                  className="absolute right-4 top-4 md:static p-2 bg-slate-105 hover:bg-slate-200 text-slate-650 rounded-full transition-colors cursor-pointer border border-transparent"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900 flex flex-col justify-center min-h-[300px]">
                {(() => {
                  const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
                  const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
                  const currentClassroom = getStudentClassroomLocal(idoso.nome);
                  
                  const galleryItems = allAtivs.filter(ati => {
                    if (!ati.fotoTrabalhinho) return false;
                    if (localStorage.getItem(`anjo_activities_cleared_${ati.idosoId}`) === 'true') return false;
                    if (galleryFilter === 'aluno') {
                      return ati.idosoId === idoso.id;
                    } else {
                      const student = allSeniors.find(s => s.id === ati.idosoId);
                      return student && getStudentClassroomLocal(student.nome) === currentClassroom;
                    }
                  });

                  if (galleryItems.length === 0) {
                    return (
                      <div className="text-center space-y-4 max-w-md mx-auto py-12">
                        <div className="w-16 h-16 bg-white/10 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                          🖼️
                        </div>
                        <h4 className="font-extrabold text-white text-base">Nenhum trabalhinho encontrado</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Não existem fotos de trabalhinhos registradas {galleryFilter === 'aluno' ? `para ${idoso.nome}` : `para a sala ${currentClassroom}`} até o momento. 
                        </p>
                        <p className="text-[11px] text-indigo-400 font-semibold bg-indigo-950/50 p-3 rounded-2xl border border-indigo-900/30">
                          💡 Dica: Ao registrar uma atividade pedagógica ou lúdica na aba ao lado, você pode bater foto do desenho ou pintura para que apareça nesta galeria!
                        </p>
                      </div>
                    );
                  }

                  const currentItem = galleryItems[currentSlideIndex];
                  const author = allSeniors.find(s => s.id === currentItem.idosoId);

                  return (
                    <div className="space-y-4 max-w-2xl mx-auto w-full">
                      {/* Image Frame with Navigation */}
                      <div className="relative group rounded-3xl overflow-hidden border-4 border-white/95 shadow-2xl bg-black flex items-center justify-center aspect-video max-h-[480px]">
                        <img 
                          src={currentItem.fotoTrabalhinho} 
                          alt={currentItem.tipo} 
                          className="max-h-full max-w-full object-contain transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />

                        {/* Navigation Arrows */}
                        <button
                          type="button"
                          onClick={() => setCurrentSlideIndex(prev => (prev - 1 + galleryItems.length) % galleryItems.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer border border-transparent shadow-md"
                          title="Anterior"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentSlideIndex(prev => (prev + 1) % galleryItems.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer border border-transparent shadow-md"
                          title="Próximo"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Slide Count Overlay */}
                        <div className="absolute right-4 top-4 bg-black/70 px-2.5 py-1 rounded-full text-[10px] text-white font-mono font-bold tracking-wider">
                          {currentSlideIndex + 1} / {galleryItems.length}
                        </div>
                      </div>

                      {/* Details Card */}
                      <div className="bg-white/95 p-4 rounded-2xl border border-white/20 shadow-lg space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block">
                              🎨 Autoria do Aluno
                            </span>
                            <span className="font-extrabold text-slate-800 text-sm">
                              {author ? author.nome : 'Aluno'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block">Atividade</span>
                              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                                {currentItem.tipo}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(currentItem.id)}
                              className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] font-black shadow-3xs"
                              title="Excluir Trabalhinho"
                            >
                              <Trash2 className="w-3 h-3" /> Excluir Foto
                            </button>
                          </div>
                        </div>

                        {currentItem.observacoes ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block">
                              📝 Observação Pedagógica
                            </span>
                            <p className="text-xs text-slate-650 italic bg-indigo-50/30 p-2.5 rounded-xl border border-dashed border-indigo-100 leading-relaxed">
                              "{currentItem.observacoes}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 text-center italic py-2">Sem observações adicionadas para este trabalhinho.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Controls */}
              {(() => {
                const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
                const allAtivs = getFromDB<RegistroAtividade[]>('anjo_atividades', []);
                const currentClassroom = getStudentClassroomLocal(idoso.nome);
                const galleryItems = allAtivs.filter(ati => {
                  if (!ati.fotoTrabalhinho) return false;
                  if (galleryFilter === 'aluno') {
                    return ati.idosoId === idoso.id;
                  } else {
                    const student = allSeniors.find(s => s.id === ati.idosoId);
                    return student && getStudentClassroomLocal(student.nome) === currentClassroom;
                  }
                });

                if (galleryItems.length === 0) return null;

                return (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSlideshowActive(!slideshowActive)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          slideshowActive
                            ? 'bg-rose-500 hover:bg-rose-600 text-white animate-none'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {slideshowActive ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-white" /> Pausar Apresentação
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" /> Iniciar Slideshow
                          </>
                        )}
                      </button>

                      {slideshowActive && (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-lg animate-pulse">
                          ▶️ Avanço Automático Ativo (3s)
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      {galleryFilter === 'aluno' ? 'Portfólio Individual' : `Mural da Classe - ${currentClassroom}`}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
