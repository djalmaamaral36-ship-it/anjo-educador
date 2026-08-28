import React, { useState, useEffect } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  Coffee,
  Droplets,
  Activity,
  Smile,
  Moon,
  Thermometer,
  Palette,
  FileText,
  AlertTriangle,
  Send,
  Loader2,
  Volume2,
  Clock,
  Play
} from 'lucide-react';
import { Idoso, Usuario, SinalVital, isStaffUser } from '../types';
import { getFromDB, saveToDB, getShiftActiveState, setShiftActiveStatesBatch, getNowTimeBr, resetStudentDailyRoutine } from '../data';
import { findMatchingMealTask } from '../utils/auraPlanParser';
import { VoiceInput } from './VoiceInput';

interface AuraSmartRegisterModalProps {
  idoso: Idoso;
  usuarioAtual: Usuario;
  appMode?: 'idoso' | 'escolar' | 'escolar_infantil' | 'escolar_fundamental' | string;
  triggerWhatsAppSim?: (titulo: string, mensagem: string) => void;
  onRegisterComplete?: () => void;
}

export const AuraSmartRegisterModal: React.FC<AuraSmartRegisterModalProps> = ({
  idoso,
  usuarioAtual,
  appMode = 'escolar',
  triggerWhatsAppSim,
  onRegisterComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hub' | 'aura_voice' | 'roteiro_guiado' | 'refeicao' | 'agua' | 'higiene' | 'sono' | 'humor' | 'saude' | 'atividade' | 'nota' | 'ocorrencia' | 'intercorrencia'>('hub');

  // Roteiro Guiado State with inclusion flags for deselection
  const [guidedState, setGuidedState] = useState({
    incSono: true,
    sonecaMinutos: 60,
    sonecaNaoDormiu: false,
    incHigiene: true,
    xixi: true,
    coco: true,
    cocoConsistencia: 'normal',
    banho: false,
    dentes: true,
    roupa: true,
    incHumor: true,
    humor: 'feliz',
    incAlimentacao: true,
    refeicaoTipo: 'Almoco',
    refeicaoAceitacao: 'muito_bem',
    incAgua: true,
    aguaMl: 200,
    incSaude: true,
    temperatura: '36.5',
    peso: idoso?.peso ? String(idoso.peso) : '12.5',
    observacaoGeral: ''
  });

  // Aura Voice Selection State (allows toggling off specific detected items)
  const [voiceSelected, setVoiceSelected] = useState<{
    hidratacao: boolean;
    sono: boolean;
    alimentacao: boolean;
    humor: boolean;
    higiene: boolean;
    saude: boolean;
    atividades: boolean;
  }>({
    hidratacao: true,
    sono: true,
    alimentacao: true,
    humor: true,
    higiene: true,
    saude: true,
    atividades: true
  });

  const notifyWhatsApp = (titulo: string, mensagem: string) => {
    if (triggerWhatsAppSim) {
      triggerWhatsAppSim(titulo, mensagem);
    } else {
      const logs = getFromDB<any[]>('anjo_notificacoes', []);
      logs.unshift({
        id: `notif_${Date.now()}`,
        titulo,
        mensagem,
        timestamp: getNowTimeBr(),
        status: 'enviado'
      });
      saveToDB('anjo_notificacoes', logs);
    }
  };
  
  // Aura Voice State
  const [voiceText, setVoiceText] = useState('');
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick State inputs
  const [quickMeal, setQuickMeal] = useState<{ tipo: string; aceitacao: string; obs: string }>({ tipo: 'Lanche', aceitacao: 'muito_bem', obs: '' });
  const [quickFralda, setQuickFralda] = useState<{ tipo: string; consistencia?: string; obs: string }>({ tipo: 'xixi', consistencia: 'normal', obs: '' });
  const [quickHumor, setQuickHumor] = useState<string>('feliz');
  const [quickSono, setQuickSono] = useState<number>(60);
  const [quickTemp, setQuickTemp] = useState<string>('36.5');
  const [quickAtividade, setQuickAtividade] = useState<string>('Pintura e Colagem');
  const [quickNota, setQuickNota] = useState<string>('');

  const [showShiftConfirmModal, setShowShiftConfirmModal] = useState(false);
  const [pendingShiftAction, setPendingShiftAction] = useState<{ callback: () => void; label?: string } | null>(null);

  const isEscolar = appMode === 'escolar';
  const prefix = isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador';

  const [isShiftActive, setIsShiftActive] = useState<boolean>(() => {
    return getShiftActiveState(idoso.id).active;
  });

  useEffect(() => {
    if (isOpen) {
      setIsShiftActive(getShiftActiveState(idoso.id).active);
    }
  }, [isOpen, idoso.id]);

  useEffect(() => {
    const handleShiftUpdate = () => {
      setIsShiftActive(getShiftActiveState(idoso.id).active);
    };
    const handleOpenModalEvent = () => {
      setIsOpen(true);
    };
    window.addEventListener('anjo_shift_updated', handleShiftUpdate);
    window.addEventListener('db-vitals-update', handleShiftUpdate);
    window.addEventListener('open-aura-smart-modal', handleOpenModalEvent);
    return () => {
      window.removeEventListener('anjo_shift_updated', handleShiftUpdate);
      window.removeEventListener('db-vitals-update', handleShiftUpdate);
      window.removeEventListener('open-aura-smart-modal', handleOpenModalEvent);
    };
  }, [idoso.id]);

  const ensureShiftActive = (onConfirmedAction?: () => void, actionLabel?: string): boolean => {
    const currentActive = getShiftActiveState(idoso.id).active;
    if (currentActive) {
      if (onConfirmedAction) onConfirmedAction();
      return true;
    }

    // Timer is inactive: open confirmation modal and hold pending action
    if (onConfirmedAction) {
      setPendingShiftAction({ callback: onConfirmedAction, label: actionLabel });
    } else {
      setPendingShiftAction(null);
    }
    setShowShiftConfirmModal(true);
    return false;
  };

  const handleConfirmStartShift = () => {
    const startTimeStamp = new Date().toISOString();
    resetStudentDailyRoutine([idoso.id]);
    setShiftActiveStatesBatch([{ targetKey: idoso.id, active: true, startTime: startTimeStamp }]);
    setIsShiftActive(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    }
    setSaveSuccessMsg(`  Cronometro ativado! Registros de ${idoso.nome} iniciados.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);

    setShowShiftConfirmModal(false);

    if (pendingShiftAction?.callback) {
      const actionToRun = pendingShiftAction.callback;
      setPendingShiftAction(null);
      actionToRun();
    }
  };

  const handleCancelStartShift = () => {
    setShowShiftConfirmModal(false);
    setPendingShiftAction(null);
  };

  const handleStartShiftNow = () => {
    if (isShiftActive) return;
    handleConfirmStartShift();
  };

  const notifyUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_sinais' } }));
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_sinais' } }));
      window.dispatchEvent(new CustomEvent('db-tasks-update'));
      window.dispatchEvent(new CustomEvent('db-routine-update'));
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
    }
    if (onRegisterComplete) onRegisterComplete();
  };

  const handleQuickAgua = (ml: number) => {
    const runAgua = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      const commonWaterId = `hid_${Date.now()}`;

      // 1. Water specific key 1
      const key = `anjo_registro_agua_${idoso.id}`;
      const records = getFromDB<any[]>(key, []);
      records.unshift({
        id: commonWaterId,
        idosoId: idoso.id,
        quantidadeMl: ml,
        horario: now,
        data: todayIso,
        registradoPor: usuarioAtual.nome
      });
      saveToDB(key, records);

      // 1b. Water specific key 2
      const key2 = `anjo_hidratacao_${idoso.id}`;
      const records2 = getFromDB<any[]>(key2, []);
      records2.unshift({
        id: commonWaterId,
        idosoId: idoso.id,
        quantidadeMl: ml,
        horario: now,
        data: todayIso,
        registradoPor: usuarioAtual.nome
      });
      saveToDB(key2, records2);

      // 2. Main anjo_hidratacao store
      const hidsKey = 'anjo_hidratacao';
      const hids = getFromDB<any[]>(hidsKey, []);
      hids.unshift({
        id: commonWaterId,
        idosoId: idoso.id,
        quantidadeMl: ml,
        horario: now,
        data: todayIso,
        registradoPor: usuarioAtual.nome
      });
      saveToDB(hidsKey, hids);

      // 3. Daily task completion
      const tasksKey = 'anjo_tarefas_diarias';
      const allTasks = getFromDB<any[]>(tasksKey, []);
      const waterTaskIndex = allTasks.findIndex(t => t.idosoId === idoso.id && t.tipo === 'hidratacao' && t.status !== 'concluido');
      if (waterTaskIndex >= 0) {
        allTasks[waterTaskIndex].status = 'concluido';
        allTasks[waterTaskIndex].concluidaEm = now;
        allTasks[waterTaskIndex].completadaPor = usuarioAtual.nome;
        allTasks[waterTaskIndex].observacao = `Oferecido ${ml}ml de agua.`;
        saveToDB(tasksKey, allTasks);
      }

      // 4. Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: isEscolar ? 0 : 75,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Hidratacao: +${ml}ml de agua`
      });
      saveToDB('anjo_sinais', vitalsStore);

      // Trigger WhatsApp notification
      notifyWhatsApp(
        `Hidratacao (${ml}ml)`,
        `${prefix}: ${isEscolar ? 'Profa ' : ''}${usuarioAtual.nome} acabou de registrar hidratacao de ${ml}ml para ${idoso.nome} as ${now}.`
      );

      setSaveSuccessMsg(`  Registrado +${ml}ml de agua para ${idoso.nome}!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runAgua, `Registrar +${ml}ml de agua`)) return;
    runAgua();
  };

  const handleQuickRefeicao = (refeicaoNome: string, aceitacao: string) => {
    const runRefeicao = () => {
      const now = getNowTimeBr();
      const todayIso = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      const aceitacaoText = aceitacao === 'muito_bem' ? 'Comeu Muito Bem (Aceitacao Total)' : aceitacao === 'parcial' ? 'Aceitacao Parcial' : 'Recusou Refeicao';

      // 1. Main anjo_alimentacao store
      const mealKey = 'anjo_alimentacao';
      const meals = getFromDB<any[]>(mealKey, []);
      const refKey = (refeicaoNome.toLowerCase().includes('mamad') || refeicaoNome.toLowerCase().includes('leite') || refeicaoNome.toLowerCase().includes('formula')) ? 'mamadeira'
        : (refeicaoNome.toLowerCase().includes('almoco') || refeicaoNome.toLowerCase().includes('almoco') || refeicaoNome.toLowerCase().includes('papinha')) ? 'almoco' 
        : (refeicaoNome.toLowerCase().includes('cafe') || refeicaoNome.toLowerCase().includes('cafe') || refeicaoNome.toLowerCase().includes('desjejum') || refeicaoNome.toLowerCase().includes('colacao')) ? 'cafe_manha'
        : (refeicaoNome.toLowerCase().includes('fruta') || refeicaoNome.toLowerCase().includes('lanche')) ? 'lanche' 
        : 'jantar';
      meals.unshift({
        id: `meal_${Date.now()}`,
        idosoId: idoso.id,
        refeicao: refKey,
        aceitacao: aceitacao,
        horario: now,
        data: todayIso,
        registradoPor: usuarioAtual.nome,
        observacao: quickMeal.obs || aceitacaoText,
        observacoes: quickMeal.obs || aceitacaoText
      });
      saveToDB(mealKey, meals);

      // 2. Update daily tasks vinculando estritamente palavra E horario
      const tasksKey = 'anjo_tarefas_diarias';
      const allTasks = getFromDB<any[]>(tasksKey, []);
      const seniorTasks = allTasks.filter(t => t.idosoId === idoso.id);
      const matchedTask = findMatchingMealTask(seniorTasks, refKey, now);

      if (matchedTask) {
        const updatedTasks = allTasks.map(t => {
          if (t.id === matchedTask.id) {
            return {
              ...t,
              status: (aceitacao === 'recusou' ? 'recusado' : 'concluido') as any,
              concluidaEm: now,
              completadaPor: usuarioAtual.nome,
              observacao: `Refeicao (${refeicaoNome}): ${aceitacaoText}. ${quickMeal.obs || ''}`
            };
          }
          return t;
        });
        saveToDB(tasksKey, updatedTasks);
      }

      // 3. Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 90,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Refeicao (${refeicaoNome}): ${aceitacaoText}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `Alimentacao (${refeicaoNome})`,
        `${prefix}: Refeicao "${refeicaoNome}" de ${idoso.nome} registrada por ${usuarioAtual.nome}: ${aceitacaoText}.`
      );

      setSaveSuccessMsg(`  Refeicao (${refeicaoNome}) salva com sucesso!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runRefeicao, `Registrar Refeicao (${refeicaoNome})`)) return;
    runRefeicao();
  };

  const handleQuickHigiene = (tipoIcon: string) => {
    const runHigiene = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      let label = 'Troca de Fralda / Higiene';
      if (tipoIcon === 'xixi') label = 'Fralda: Apenas Xixi';
      else if (tipoIcon === 'coco') label = `Fralda: Coco (${quickFralda.consistencia || 'Normal'})`;
      else if (tipoIcon === 'banho') label = 'Banho Completo Realizado';
      else if (tipoIcon === 'dentes') label = 'Higiene Bucal / Escovacao de Dentes';
      else if (tipoIcon === 'roupa') label = 'Troca de Roupa Realizada';

      // 1. Save specific hygiene log
      const hygKey = `anjo_higiene_log_${idoso.id}`;
      saveToDB(hygKey, {
        bath: tipoIcon === 'banho',
        teeth: tipoIcon === 'dentes',
        clothes: tipoIcon === 'roupa',
        diaper: tipoIcon === 'xixi' || tipoIcon === 'coco',
        time: now,
        observations: label
      });

      // 2. Update daily tasks
      const tasksKey = 'anjo_tarefas_diarias';
      const allTasks = getFromDB<any[]>(tasksKey, []);
      const updatedTasks = allTasks.map(t => {
        if (t.idosoId === idoso.id && (t.tipo === 'banho' || t.tipo === 'higiene') && t.status !== 'concluido') {
          return {
            ...t,
            status: 'concluido' as const,
            concluidaEm: now,
            completadaPor: usuarioAtual.nome,
            observacao: `${label}. ${quickFralda.obs}`
          };
        }
        return t;
      });
      saveToDB(tasksKey, updatedTasks);

      // 3. Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 92,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: quickFralda.obs ? `${label} - ${quickFralda.obs}` : label,
        fralda: label
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `Higiene (${label})`,
        `${prefix}: Registro de higiene de ${idoso.nome} feito por ${usuarioAtual.nome}: ${label}.`
      );

      setSaveSuccessMsg(`  ${label} registrado!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runHigiene, `Registrar Higiene / Fralda`)) return;
    runHigiene();
  };

  const handleQuickHumor = (humorVal: string) => {
    const runHumor = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      // 1. Specific key
      const key = `anjo_humor_${idoso.id}`;
      saveToDB(key, { humor: humorVal, horario: now, registradoPor: usuarioAtual.nome });

      // 2. Main anjo_humor store
      const humKey = 'anjo_humor';
      const hums = getFromDB<any[]>(humKey, []);
      hums.unshift({
        id: `hum_${Date.now()}`,
        idosoId: idoso.id,
        estado: humorVal,
        horario: now,
        data: todayIso,
        registradoPor: usuarioAtual.nome
      });
      saveToDB(humKey, hums);

      // 3. Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 90,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Humor: ${humorVal.toUpperCase()}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `Humor (${humorVal})`,
        `${prefix}: ${idoso.nome} esta se sentindo ${humorVal.toUpperCase()} hoje (registrado por ${usuarioAtual.nome} as ${now}).`
      );

      setSaveSuccessMsg(`  Humor "${humorVal}" registrado!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runHumor, `Registrar Humor (${humorVal})`)) return;
    runHumor();
  };

  const handleQuickSono = (minutos: number) => {
    const runSono = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];
      const horastxt = minutos >= 60 ? `${Math.floor(minutos / 60)}h${minutos % 60 ? (minutos % 60) + 'm' : ''}` : `${minutos}min`;

      // 1. Specific key
      const key = `anjo_registro_sono_${idoso.id}`;
      saveToDB(key, {
        duracaoMinutos: minutos,
        horarioRegistro: now,
        registradoPor: usuarioAtual.nome,
        observacao: `Dormiu por aproximadamente ${horastxt}.`
      });

      // 2. Main anjo_sono store
      const sonoKey = 'anjo_sono';
      const sonos = getFromDB<any[]>(sonoKey, []);
      sonos.unshift({
        id: `sono_${Date.now()}`,
        idosoId: idoso.id,
        duracaoMinutos: minutos,
        dormiuEm: '13:00',
        acordouEm: minutos >= 60 ? '14:00' : '13:30',
        horario: now,
        data: todayIso,
        registradoPor: usuarioAtual.nome
      });
      saveToDB(sonoKey, sonos);

      // 3. Update daily tasks
      const tasksKey = 'anjo_tarefas_diarias';
      const allTasks = getFromDB<any[]>(tasksKey, []);
      const updatedTasks = allTasks.map(t => {
        if (t.idosoId === idoso.id && t.tipo === 'sono' && t.status !== 'concluido') {
          return {
            ...t,
            status: 'concluido' as const,
            concluidaEm: now,
            completadaPor: usuarioAtual.nome,
            observacao: `Soneca: Dormiu ${horastxt}.`
          };
        }
        return t;
      });
      saveToDB(tasksKey, updatedTasks);

      // 4. Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: `Dormiu ${horastxt}`,
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 90,
        saturacao: 99,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `Dormiu por aproximadamente ${horastxt}.`,
        soneca: `Dormiu ${horastxt}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `Soneca (${horastxt})`,
        `${prefix}: ${idoso.nome} dormiu uma soneca tranquilamente por ${horastxt} (registrado por ${usuarioAtual.nome} as ${now}).`
      );

      setSaveSuccessMsg(`  Soneca de ${horastxt} registrada!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runSono, `Registrar Soneca (${minutos}min)`)) return;
    runSono();
  };

  const handleQuickSaude = (tempStr: string, pesoStr?: string) => {
    const runSaude = () => {
      const tempNum = parseFloat(tempStr);
      const pesoNum = pesoStr ? parseFloat(pesoStr) : (guidedState.peso ? parseFloat(guidedState.peso) : (idoso.peso ? Number(idoso.peso) : 0));
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];
      const key = `anjo_sinais_vitais_${idoso.id}`;
      const records = getFromDB<any[]>(key, []);
      records.unshift({
        id: `vital_${Date.now()}`,
        temperatura: tempNum,
        peso: pesoNum > 0 ? pesoNum : undefined,
        horario: now,
        registradoPor: usuarioAtual.nome,
        alertaFebre: tempNum >= 37.8
      });
      saveToDB(key, records);

      if (pesoNum > 0) {
        idoso.peso = pesoNum;
        const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
        const updatedSeniors = allSeniors.map(s => s.id === idoso.id ? { ...s, peso: pesoNum } : s);
        saveToDB('anjo_idosos', updatedSeniors);
      }

      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: tempNum,
        frequenciaCardiaca: isEscolar ? 0 : 75,
        saturacao: 98,
        peso: pesoNum > 0 ? pesoNum : undefined,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: tempNum >= 37.8 ? `Alerta Febre: ${tempNum}oC` : `Temperatura Aferida: ${tempNum}oC${pesoNum > 0 ? ` (Peso: ${pesoNum}kg)` : ''}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      if (tempNum >= 37.8) {
        notifyWhatsApp(
          `  ALERTA FEBRE (${tempNum}oC)`,
          `  ALERTA DE TEMPERATURA (${tempPrefix()}): ${idoso.nome} apresentou temperatura de ${tempNum}oC as ${now}. ${isEscolar ? 'A professora' : 'O cuidador'} ${usuarioAtual.nome} acionou o protocolo de observacao continua.`
        );
      } else {
        notifyWhatsApp(
          `Afericao Temperatura (${tempNum}oC)`,
          `${prefix}: Temperatura de ${idoso.nome} aferida em ${tempNum}oC as ${now} por ${usuarioAtual.nome}. Tudo normal.`
        );
      }

      setSaveSuccessMsg(`  Temperatura ${tempNum}oC salva!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runSaude, `Registrar Temperatura (${tempStr}oC)`)) return;
    runSaude();
  };

  const handleQuickIntercorrencia = (tipo: string, descricao: string) => {
    const runIntercorrencia = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];
      const key = `anjo_ocorrencias_${idoso.id}`;
      const records = getFromDB<any[]>(key, []);
      const newRecord = {
        id: `occ_${Date.now()}`,
        tipo,
        criticidade: 'vermelho',
        descricao,
        dataHora: `${todayIso} ${now}`,
        registradoPor: usuarioAtual.nome,
        alertaUrgente: true
      };
      records.unshift(newRecord);
      saveToDB(key, records);

      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 92,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Intercorrencia Urgente (${tipo}): ${descricao}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `  INTERCORRENCIA URGENTE - ${tipo.toUpperCase()}`,
        `  ALERTA DE INTERCORRENCIA (${prefix}): ${idoso.nome} apresentou "${tipo}" - ${descricao}. Registrado por ${usuarioAtual.nome} as ${now}. Contato imediato recomendado.`
      );

      setSaveSuccessMsg(`  Intercorrencia urgente registrada com sucesso! Alerta acionado.`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runIntercorrencia, `Registrar Intercorrencia`)) return;
    runIntercorrencia();
  };

  const handleQuickOcorrencia = (tipo: string, descricao: string) => {
    const runOcorrencia = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];
      const key = `anjo_ocorrencias_${idoso.id}`;
      const records = getFromDB<any[]>(key, []);
      const newRecord = {
        id: `occ_${Date.now()}`,
        tipo,
        criticidade: 'amarelo',
        descricao,
        dataHora: `${todayIso} ${now}`,
        registradoPor: usuarioAtual.nome,
        alertaUrgente: false
      };
      records.unshift(newRecord);
      saveToDB(key, records);

      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 92,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Ocorrencia do Dia (${tipo}): ${descricao}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `  Ocorrencia do Dia - ${tipo}`,
        `${prefix}: Ocorrencia de rotina registrada para ${idoso.nome} (${tipo}): "${descricao}". Registrado as ${now} por ${usuarioAtual.nome}.`
      );

      setSaveSuccessMsg(`  Ocorrencia do dia registrada na rotina!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runOcorrencia, `Registrar Ocorrencia`)) return;
    runOcorrencia();
  };

  const handleQuickAtividade = (actVal: string, actName: string) => {
    const runAtividade = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      // Update daily tasks
      const tasksKey = 'anjo_tarefas_diarias';
      const allTasks = getFromDB<any[]>(tasksKey, []);
      const updatedTasks = allTasks.map(t => {
        if (t.idosoId === idoso.id && (t.tipo === 'atividade' || t.tipo === 'recreacao') && t.status !== 'concluido') {
          return {
            ...t,
            status: 'concluido' as const,
            concluidaEm: now,
            completadaPor: usuarioAtual.nome,
            observacao: `Atividade (${actVal}): ${actName}`
          };
        }
        return t;
      });
      saveToDB(tasksKey, updatedTasks);

      // Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 90,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Atividade (${actVal}): ${actName}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `Atividade (${actVal})`,
        `${prefix}: ${idoso.nome} participou com entusiasmo da atividade "${actName}" as ${now}.`
      );

      setSaveSuccessMsg(`  Atividade "${actVal}" registrada!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runAtividade, `Registrar Atividade (${actVal})`)) return;
    runAtividade();
  };

  const handleQuickNota = (noteText: string) => {
    const runNota = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      // Save occurrence log
      const key = `anjo_ocorrencias_${idoso.id}`;
      const records = getFromDB<any[]>(key, []);
      records.unshift({
        id: `occ_${Date.now()}`,
        tipo: 'Observacao',
        criticidade: 'verde',
        descricao: noteText,
        dataHora: `${todayIso} ${now}`,
        registradoPor: usuarioAtual.nome,
        alertaUrgente: false
      });
      saveToDB(key, records);

      // Main anjo_sinais store
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      vitalsStore.push({
        id: 'sin_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: '120/80',
        glicemia: 0,
        temperatura: 36.5,
        frequenciaCardiaca: 90,
        saturacao: 98,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome,
        observacoes: `  Observacao: ${noteText}`
      });
      saveToDB('anjo_sinais', vitalsStore);

      notifyWhatsApp(
        `Observacao / Recado`,
        `${prefix}: Recado de ${isEscolar ? 'Profa ' : ''}${usuarioAtual.nome} para os responsaveis de ${idoso.nome}: "${noteText}".`
      );

      setSaveSuccessMsg(`  Observacao salva!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setQuickNota('');
        setIsOpen(false);
        setActiveTab('hub');
      }, 1200);
    };

    if (!ensureShiftActive(runNota, `Registrar Observacao`)) return;
    runNota();
  };

  function tempPrefix() {
    return isEscolar ? 'Escola' : 'Cuidador';
  }

  // Aura Smart Multi-Record Voice Parser
  const handleProcessAuraVoice = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsParsingVoice(true);
    setParsedData(null);

    try {
      const res = await fetch('/api/aura-smart-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcript,
          studentName: idoso.nome,
          geminiKey: process.env.GEMINI_API_KEY
        })
      });

      if (res.ok) {
        const data = await res.json();
        setParsedData(data);
        setVoiceSelected({
          hidratacao: !!data.hidratacao,
          sono: !!data.sono,
          alimentacao: !!data.alimentacao,
          humor: !!data.humor,
          higiene: !!data.higiene,
          saude: !!data.saude,
          atividades: !!(data.atividades && data.atividades.length > 0)
        });
      } else {
        throw new Error('Fallback local parser');
      }
    } catch (err) {
      // Local intelligent fallback parser
      const textLower = transcript.toLowerCase();
      const extracted: any = {
        respostaAura: `Aura interpretou o seu relato de voz para ${idoso.nome} com carinho e preparou os registros!  `,
        alimentacao: textLower.includes('comeu') || textLower.includes('fruta') || textLower.includes('lanche') || textLower.includes('almoco') || textLower.includes('mamadeira') || textLower.includes('papa') ? {
          refeicao: textLower.includes('almoco') ? 'Almoco' : textLower.includes('fruta') ? 'Fruta' : textLower.includes('mamadeira') ? 'Mamadeira' : 'Lanche',
          aceitacao: textLower.includes('recusou') || textLower.includes('nao comeu') ? 'recusou' : textLower.includes('pouco') ? 'parcial' : 'muito_bem',
          observacao: transcript
        } : null,
        hidratacao: (textLower.includes('agua') || textLower.includes('agua') || textLower.includes('suco') || textLower.includes('cha') || textLower.includes('cha') || textLower.includes('hidratacao') || (textLower.includes('ml') && !textLower.includes('mamadeira'))) ? {
          quantidadeMl: textLower.includes('250') ? 250 : textLower.includes('200') ? 200 : textLower.includes('150') ? 150 : textLower.includes('100') ? 100 : 150,
          observacao: 'Hidratacao registrada por voz'
        } : null,
        sono: textLower.includes('dormiu') || textLower.includes('soneca') || textLower.includes('acordou') || textLower.includes('descansou') ? {
          duracaoMinutos: textLower.includes('2h') || textLower.includes('duas horas') ? 120 : textLower.includes('1h30') || textLower.includes('uma hora e meia') ? 90 : textLower.includes('1h') || textLower.includes('uma hora') ? 60 : 45,
          observacao: 'Soneca registrada por voz'
        } : null,
        humor: textLower.includes('feliz') || textLower.includes('humor') || textLower.includes('bem') || textLower.includes('calmo') || textLower.includes('chorou') ? {
          estado: textLower.includes('chorou') || textLower.includes('triste') ? 'choroso' : textLower.includes('agitado') ? 'agitado' : 'feliz',
          observacao: 'Humor/Bem-estar registrado por voz'
        } : null,
        higiene: textLower.includes('fralda') || textLower.includes('xixi') || textLower.includes('coco') || textLower.includes('coco') || textLower.includes('banho') || textLower.includes('dentes') || textLower.includes('limp') ? {
          banho: textLower.includes('banho'),
          trocaFralda: textLower.includes('fralda') || textLower.includes('xixi') || textLower.includes('coco') || textLower.includes('coco'),
          tipoFralda: (textLower.includes('xixi') && (textLower.includes('coco') || textLower.includes('coco'))) ? 'ambos' : (textLower.includes('coco') || textLower.includes('coco')) ? 'coco' : 'xixi',
          consistenciaCoco: textLower.includes('mole') || textLower.includes('liquid') ? 'liquida' : textLower.includes('dura') ? 'dura' : 'normal',
          observacao: transcript
        } : null,
        saude: textLower.includes('febre') || textLower.includes('temperatura') || textLower.includes('graus') || textLower.includes('oc') ? {
          febre: textLower.includes('febre') || textLower.includes('alta'),
          temperatura: textLower.includes('38') ? 38.2 : textLower.includes('37.8') ? 37.8 : textLower.includes('37.5') ? 37.5 : 36.6,
          observacao: transcript
        } : null,
        atividades: textLower.includes('pintura') || textLower.includes('roda') || textLower.includes('parque') || textLower.includes('aula') || textLower.includes('desenho') ? [
          { titulo: 'Atividade Pedagogica / Recreativa', observacao: transcript }
        ] : null,
        observacaoGeral: transcript
      };
      setParsedData(extracted);
      setVoiceSelected({
        hidratacao: !!extracted.hidratacao,
        sono: !!extracted.sono,
        alimentacao: !!extracted.alimentacao,
        humor: !!extracted.humor,
        higiene: !!extracted.higiene,
        saude: !!extracted.saude,
        atividades: !!(extracted.atividades && extracted.atividades.length > 0)
      });
      
      // Also update guided state for immediate visual feedback
      if (extracted.sono) setGuidedState(p => ({ ...p, incSono: true, sonecaMinutos: extracted.sono.duracaoMinutos || 60, sonecaNaoDormiu: false }));
      if (extracted.humor) setGuidedState(p => ({ ...p, incHumor: true, humor: extracted.humor.estado || 'feliz' }));
      if (extracted.hidratacao) setGuidedState(p => ({ ...p, incAgua: true, aguaMl: extracted.hidratacao.quantidadeMl || 200 }));
      if (extracted.alimentacao) setGuidedState(p => ({ ...p, incAlimentacao: true, refeicaoTipo: extracted.alimentacao.refeicao || 'Almoco', refeicaoAceitacao: extracted.alimentacao.aceitacao || 'muito_bem' }));
      if (extracted.saude) setGuidedState(p => ({ ...p, incSaude: true, temperatura: String(extracted.saude.temperatura || '36.5') }));
    } finally {
      setIsParsingVoice(false);
    }
  };

  const handleSaveGuidedScript = () => {
    const runGuided = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      const hasSelected = guidedState.incAgua || guidedState.incAlimentacao || guidedState.incSono || guidedState.incHigiene || guidedState.incHumor || guidedState.incSaude;
      if (!hasSelected) {
        alert('[!] Por favor, selecione ao menos 1 item (refeicao, agua, higiene, etc.) para registrar.');
        return;
      }

      const summaryParts: string[] = [];

      // 1. Water Intake
      if (guidedState.incAgua && guidedState.aguaMl > 0) {
        const commonId = `hid_${Date.now()}`;
        const hidsKey = 'anjo_hidratacao';
        const hids = getFromDB<any[]>(hidsKey, []);
        hids.unshift({
          id: commonId,
          idosoId: idoso.id,
          quantidadeMl: guidedState.aguaMl,
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome
        });
        saveToDB(hidsKey, hids);

        const waterKey = `anjo_registro_agua_${idoso.id}`;
        const recs = getFromDB<any[]>(waterKey, []);
        recs.unshift({ id: commonId, quantidadeMl: guidedState.aguaMl, horario: now, data: todayIso, registradoPor: usuarioAtual.nome });
        saveToDB(waterKey, recs);

        summaryParts.push(`  Agua: ${guidedState.aguaMl}ml`);
      }

      // 2. Meal
      if (guidedState.incAlimentacao) {
        const mealKey = 'anjo_alimentacao';
        const meals = getFromDB<any[]>(mealKey, []);
        const refKey = guidedState.refeicaoTipo.toLowerCase().includes('almoco') ? 'almoco' 
          : guidedState.refeicaoTipo.toLowerCase().includes('fruta') || guidedState.refeicaoTipo.toLowerCase().includes('lanche') ? 'lanche' 
          : guidedState.refeicaoTipo.toLowerCase().includes('mamad') ? 'mamadeira' : 'jantar';
        
        meals.unshift({
          id: `meal_${Date.now()}`,
          idosoId: idoso.id,
          refeicao: refKey,
          aceitacao: guidedState.refeicaoAceitacao,
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome,
          observacao: guidedState.observacaoGeral || 'Registrado via Roteiro Guiado da Aura'
        });
        saveToDB(mealKey, meals);

        summaryParts.push(refKey === 'mamadeira' ? '  Mamadeira: 1 mamadeira' : `  Refeicao: ${guidedState.refeicaoTipo} (${guidedState.refeicaoAceitacao === 'muito_bem' ? 'Comeu Tudo' : guidedState.refeicaoAceitacao})`);
      }

      // 3. Sleep
      let sonecaStr = '';
      if (guidedState.incSono) {
        const durMins = guidedState.sonecaNaoDormiu ? 0 : guidedState.sonecaMinutos;
        sonecaStr = guidedState.sonecaNaoDormiu ? 'Nao dormiu soneca' : `Dormiu ${durMins >= 60 ? `${Math.floor(durMins/60)}h${durMins%60 ? `${durMins%60}m`:''}` : `${durMins}min`}`;
        
        const sonoKey = 'anjo_sono';
        const sonos = getFromDB<any[]>(sonoKey, []);
        sonos.unshift({
          id: `sono_${Date.now()}`,
          idosoId: idoso.id,
          duracaoMinutos: durMins,
          dormiuEm: '13:00',
          acordouEm: durMins >= 60 ? '14:00' : '13:30',
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome
        });
        saveToDB(sonoKey, sonos);

        saveToDB(`anjo_registro_sono_${idoso.id}`, {
          duracaoMinutos: durMins,
          horarioRegistro: now,
          registradoPor: usuarioAtual.nome,
          observacao: sonecaStr
        });

        summaryParts.push(`  Sono: ${sonecaStr}`);
      }

      // 4. Hygiene / Diaper
      let fraldaStr = '';
      if (guidedState.incHigiene) {
        const fraldaDetails = [];
        if (guidedState.xixi) fraldaDetails.push('Xixi');
        if (guidedState.coco) fraldaDetails.push(`Coco (${guidedState.cocoConsistencia})`);
        if (guidedState.dentes) fraldaDetails.push('Dentes Escovados');
        if (guidedState.banho) fraldaDetails.push('Banho Tomado');
        if (guidedState.roupa) fraldaDetails.push('Roupa Trocada');
        fraldaStr = fraldaDetails.join(', ') || 'Troca de Fralda Realizada';

        const hygKey = `anjo_higiene_log_${idoso.id}`;
        saveToDB(hygKey, {
          bath: guidedState.banho,
          teeth: guidedState.dentes,
          clothes: guidedState.roupa,
          diaper: guidedState.xixi || guidedState.coco,
          hands: true,
          cream: true,
          time: now,
          observations: fraldaStr
        });

        summaryParts.push(`  Higiene: ${fraldaStr}`);
      }

      // 5. Humor
      if (guidedState.incHumor) {
        const humKey = 'anjo_humor';
        const hums = getFromDB<any[]>(humKey, []);
        hums.unshift({
          id: `hum_${Date.now()}`,
          idosoId: idoso.id,
          estado: guidedState.humor,
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome
        });
        saveToDB(humKey, hums);
        saveToDB(`anjo_humor_${idoso.id}`, { humor: guidedState.humor, horario: now, registradoPor: usuarioAtual.nome });

        summaryParts.push(`  Humor: ${guidedState.humor.toUpperCase()}`);
      }

      // 6. Health & Temperature
      let tempNum = parseFloat(guidedState.temperatura) || 36.5;
      let pesoNum = parseFloat(guidedState.peso) || (idoso.peso ? Number(idoso.peso) : 0);

      if (guidedState.incSaude) {
        if (pesoNum > 0) {
          idoso.peso = pesoNum;
          const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
          const updatedSeniors = allSeniors.map(s => s.id === idoso.id ? { ...s, peso: pesoNum } : s);
          saveToDB('anjo_idosos', updatedSeniors);
        }

        const vitalsKey = `anjo_sinais_vitais_${idoso.id}`;
        const vitRecords = getFromDB<any[]>(vitalsKey, []);
        vitRecords.unshift({
          id: `vital_${Date.now()}`,
          temperatura: tempNum,
          peso: pesoNum > 0 ? pesoNum : undefined,
          horario: now,
          registradoPor: usuarioAtual.nome,
          alertaFebre: tempNum >= 37.8
        });
        saveToDB(vitalsKey, vitRecords);

        summaryParts.push(`  Saude: ${tempNum}oC`);
        if (pesoNum > 0) summaryParts.push(`  Peso: ${pesoNum} kg`);
      }

      // 7. Core Sinais Store (anjo_sinais)
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      const novoSinal: SinalVital = {
        id: 'sin_guided_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: guidedState.incSono ? sonecaStr : 'Sem registros',
        glicemia: 0,
        temperatura: guidedState.incSaude ? tempNum : 36.5,
        frequenciaCardiaca: isEscolar ? 0 : 75,
        saturacao: 98,
        peso: (guidedState.incSaude && pesoNum > 0) ? pesoNum : undefined,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome + ' (Roteiro Guiado Aura)',
        observacoes: guidedState.observacaoGeral || `Registro de rotina para ${idoso.nome}`,
        fralda: guidedState.incHigiene ? fraldaStr : undefined,
        soneca: guidedState.incSono ? sonecaStr : undefined
      };
      vitalsStore.push(novoSinal);
      saveToDB('anjo_sinais', vitalsStore);

      // 8. Daily Tasks
      const tasksKey = 'anjo_tarefas_diarias';
      const allTasks = getFromDB<any[]>(tasksKey, []);
      const updatedTasks = allTasks.map(t => {
        if (t.idosoId === idoso.id && t.status !== 'concluido') {
          let matchTask = false;
          if (guidedState.incAlimentacao && t.tipo === 'alimentacao') matchTask = true;
          if (guidedState.incAgua && t.tipo === 'hidratacao') matchTask = true;
          if (guidedState.incHigiene && (t.tipo === 'higiene' || t.tipo === 'banho')) matchTask = true;
          if (guidedState.incSono && t.tipo === 'sono') matchTask = true;

          if (matchTask) {
            return {
              ...t,
              status: 'concluido' as const,
              concluidaEm: now,
              completadaPor: usuarioAtual.nome,
              observacao: `Aura Roteiro Guiado: Concluido.`
            };
          }
        }
        return t;
      });
      saveToDB(tasksKey, updatedTasks);

      // Trigger WhatsApp notification with ONLY selected parts
      const cleanStudentName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
      notifyWhatsApp(
        `Diario de ${cleanStudentName}`,
        `  ${prefix}: Registro de ${cleanStudentName} confirmado por Profa ${usuarioAtual.nome}:\n` +
        summaryParts.join('\n')
      );

      setSaveSuccessMsg(`  Registro de ${cleanStudentName} salvo e Portal de Tranquilidade Atualizado com Sucesso!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsOpen(false);
        setActiveTab('hub');
      }, 1800);
    };

    if (!ensureShiftActive(runGuided, `Salvar Roteiro Guiado da Aura`)) return;
    runGuided();
  };

  const handleConfirmAuraBatchSave = () => {
    if (!parsedData) return;
    const runBatch = () => {
      const now = getNowTimeBr();
      const todayIso = new Date().toISOString().split('T')[0];

      const summaryParts: string[] = [];

      // 1. Hidratacao
      if (parsedData.hidratacao && voiceSelected.hidratacao) {
        const ml = parsedData.hidratacao.quantidadeMl || 150;
        const commonId = `hid_${Date.now()}`;

        const hidsKey = 'anjo_hidratacao';
        const hids = getFromDB<any[]>(hidsKey, []);
        hids.unshift({
          id: commonId,
          idosoId: idoso.id,
          quantidadeMl: ml,
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome
        });
        saveToDB(hidsKey, hids);

        const key = `anjo_registro_agua_${idoso.id}`;
        const recs = getFromDB<any[]>(key, []);
        recs.unshift({ id: commonId, quantidadeMl: ml, horario: now, data: todayIso, registradoPor: usuarioAtual.nome });
        saveToDB(key, recs);
        summaryParts.push(`  Hidratacao: +${ml}ml de agua`);
      }

      // 2. Sono / Soneca
      let sonecaTextStr: string | undefined = undefined;
      if (parsedData.sono && voiceSelected.sono) {
        const mins = parsedData.sono.duracaoMinutos || 60;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        const durStr = hrs > 0 ? `${hrs}h${remMins > 0 ? `${remMins}m` : ''}` : `${mins}min`;
        sonecaTextStr = `Dormiu ${durStr}`;

        const sonoKey = 'anjo_sono';
        const sonos = getFromDB<any[]>(sonoKey, []);
        sonos.unshift({
          id: `sono_${Date.now()}`,
          idosoId: idoso.id,
          duracaoMinutos: mins,
          dormiuEm: parsedData.sono.horarioInicio || '13:00',
          acordouEm: '14:00',
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome,
          observacoes: parsedData.sono.observacao || sonecaTextStr
        });
        saveToDB(sonoKey, sonos);

        const key = `anjo_registro_sono_${idoso.id}`;
        saveToDB(key, { duracaoMinutos: mins, horarioRegistro: now, registradoPor: usuarioAtual.nome, observacao: parsedData.sono.observacao || sonecaTextStr });

        // Update tasks in anjo_tarefas_diarias
        const tasksKey = 'anjo_tarefas_diarias';
        const allTasks = getFromDB<any[]>(tasksKey, []);
        const updatedTasks = allTasks.map(t => {
          if (t.idosoId === idoso.id && (t.tipo === 'sono' || t.tipo === 'soneca' || t.titulo?.toLowerCase().includes('sono') || t.titulo?.toLowerCase().includes('soninho')) && t.status !== 'concluido') {
            return {
              ...t,
              status: 'concluido' as const,
              concluidaEm: now,
              completadaPor: usuarioAtual.nome,
              observacao: `Aura Voz: ${sonecaTextStr}. ${parsedData.sono.observacao || ''}`
            };
          }
          return t;
        });
        saveToDB(tasksKey, updatedTasks);

        summaryParts.push(`  Soneca: ${sonecaTextStr}`);
      }

      // 3. Humor / Bem-Estar
      if (parsedData.humor && voiceSelected.humor) {
        const estadoHumor = parsedData.humor.estado || 'feliz';
        const humKey = 'anjo_humor';
        const hums = getFromDB<any[]>(humKey, []);
        hums.unshift({
          id: `hum_${Date.now()}`,
          idosoId: idoso.id,
          estado: estadoHumor,
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome,
          observacoes: parsedData.humor.observacao || 'Registrado por voz via Aura'
        });
        saveToDB(humKey, hums);

        const key = `anjo_humor_${idoso.id}`;
        saveToDB(key, { humor: estadoHumor, horario: now, registradoPor: usuarioAtual.nome });
        summaryParts.push(`  Humor: ${estadoHumor}`);
      }

      // 4. Higiene / Troca de Fralda / Banho
      let fraldaTextStr: string | undefined = undefined;
      if (parsedData.higiene && voiceSelected.higiene) {
        if (parsedData.higiene.tipoFralda === 'coco') {
          fraldaTextStr = `Fez Coco (${parsedData.higiene.consistenciaCoco || 'normal'})`;
        } else if (parsedData.higiene.tipoFralda === 'ambos') {
          fraldaTextStr = `Xixi e Coco (${parsedData.higiene.consistenciaCoco || 'normal'})`;
        } else if (parsedData.higiene.tipoFralda === 'xixi') {
          fraldaTextStr = 'Fez Xixi / Fralda Trocada';
        } else if (parsedData.higiene.banho) {
          fraldaTextStr = 'Banho Tomado / Limpo';
        } else {
          fraldaTextStr = 'Troca de Fralda / Higiene';
        }

        const hygKey = `anjo_higiene_log_${idoso.id}`;
        saveToDB(hygKey, {
          bath: parsedData.higiene.banho || false,
          teeth: parsedData.higiene.dentes || false,
          clothes: false,
          diaper: parsedData.higiene.trocaFralda || true,
          hands: true,
          cream: true,
          time: now,
          observations: fraldaTextStr
        });

        // Update tasks
        const tasksKey = 'anjo_tarefas_diarias';
        const allTasks = getFromDB<any[]>(tasksKey, []);
        const updatedTasks = allTasks.map(t => {
          if (t.idosoId === idoso.id && (t.tipo === 'banho' || t.tipo === 'higiene') && t.status !== 'concluido') {
            return {
              ...t,
              status: 'concluido' as const,
              concluidaEm: now,
              completadaPor: usuarioAtual.nome,
              observacao: `Aura Voz: ${fraldaTextStr}. ${parsedData.higiene.observacao || ''}`
            };
          }
          return t;
        });
        saveToDB(tasksKey, updatedTasks);
        summaryParts.push(`  Higiene: ${fraldaTextStr}`);
      }

      // 5. Alimentacao
      if (parsedData.alimentacao && voiceSelected.alimentacao) {
        const rawRef = (parsedData.alimentacao.refeicao || 'Refeicao').toLowerCase();
        const refKey = rawRef.includes('mamad') ? 'mamadeira'
          : rawRef.includes('almoco') || rawRef.includes('almoco') ? 'almoco' 
          : rawRef.includes('fruta') || rawRef.includes('lanche') ? 'lanche' 
          : rawRef.includes('cafe') || rawRef.includes('cafe') ? 'cafe_manha' : 'jantar';

        const mealKey = 'anjo_alimentacao';
        const meals = getFromDB<any[]>(mealKey, []);
        meals.unshift({
          id: `meal_${Date.now()}`,
          idosoId: idoso.id,
          refeicao: refKey,
          quantidadeMl: undefined,
          aceitacao: parsedData.alimentacao.aceitacao || 'muito_bem',
          horario: now,
          data: todayIso,
          registradoPor: usuarioAtual.nome,
          observacoes: parsedData.alimentacao.observacao || 'Registrado por voz via Aura'
        });
        saveToDB(mealKey, meals);

        const tasksKey = 'anjo_tarefas_diarias';
        const allTasks = getFromDB<any[]>(tasksKey, []);
        const seniorTasks = allTasks.filter(t => t.idosoId === idoso.id);
        const matchedTask = findMatchingMealTask(seniorTasks, refKey, now);

        if (matchedTask) {
          const updatedTasks = allTasks.map(t => {
            if (t.id === matchedTask.id) {
              return {
                ...t,
                status: 'concluido' as const,
                concluidaEm: now,
                completadaPor: usuarioAtual.nome,
                observacao: `Aura Voz: ${parsedData.alimentacao.refeicao || 'Refeicao'} (${parsedData.alimentacao.aceitacao}). ${parsedData.alimentacao.observacao || ''}`
              };
            }
            return t;
          });
          saveToDB(tasksKey, updatedTasks);
        }
        summaryParts.push(refKey === 'mamadeira' ? '  Mamadeira: 1 mamadeira' : `  Refeicao: ${parsedData.alimentacao.refeicao || 'Refeicao'} (${parsedData.alimentacao.aceitacao})`);
      }

      // 6. Atividades
      if (parsedData.atividades && voiceSelected.atividades) {
        const ativKey = 'anjo_atividades';
        const ativs = getFromDB<any[]>(ativKey, []);
        let activTitle = 'Atividade Pedagogica / Recreativa';
        if (Array.isArray(parsedData.atividades) && parsedData.atividades.length > 0) {
          parsedData.atividades.forEach((a: any, idx: number) => {
            activTitle = a.titulo || a.tipo || activTitle;
            ativs.unshift({
              id: `ati_${Date.now()}_${idx}`,
              idosoId: idoso.id,
              tipo: activTitle,
              duracaoMinutos: 30,
              horario: now,
              data: todayIso,
              observacoes: a.observacao || 'Registrado por voz via Aura'
            });
          });
          summaryParts.push(`  Atividade: ${activTitle}`);
        } else if (typeof parsedData.atividades === 'object') {
          activTitle = (parsedData.atividades as any).titulo || (parsedData.atividades as any).tipo || activTitle;
          ativs.unshift({
            id: `ati_${Date.now()}`,
            idosoId: idoso.id,
            tipo: activTitle,
            duracaoMinutos: 30,
            horario: now,
            data: todayIso,
            observacoes: (parsedData.atividades as any).observacao || 'Registrado por voz via Aura'
          });
          summaryParts.push(`  Atividade: ${activTitle}`);
        }
        saveToDB(ativKey, ativs);

        // Update tasks for activities
        const tasksKey = 'anjo_tarefas_diarias';
        const allTasks = getFromDB<any[]>(tasksKey, []);
        const updatedTasks = allTasks.map(t => {
          if (t.idosoId === idoso.id && (t.tipo === 'atividade' || t.tipo === 'pedagogica' || t.titulo?.toLowerCase().includes('atividade') || t.titulo?.toLowerCase().includes('pedagogica')) && t.status !== 'concluido') {
            return {
              ...t,
              status: 'concluido' as const,
              concluidaEm: now,
              completadaPor: usuarioAtual.nome,
              observacao: `Aura Voz: ${activTitle}`
            };
          }
          return t;
        });
        saveToDB(tasksKey, updatedTasks);

        localStorage.removeItem(`anjo_activities_cleared_${idoso.id}`);
        localStorage.removeItem(`anjo_tasks_cleared_${idoso.id}`);
      }

      // 6. Saude / Febre / Peso
      let pesoNum = 0;
      if (parsedData.saude && voiceSelected.saude) {
        pesoNum = parsedData.saude?.peso || (guidedState.peso ? parseFloat(guidedState.peso) : 0) || (idoso.peso ? Number(idoso.peso) : 0);
        if (pesoNum > 0) {
          idoso.peso = pesoNum;
          const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
          const updatedSeniors = allSeniors.map(s => s.id === idoso.id ? { ...s, peso: pesoNum } : s);
          saveToDB('anjo_idosos', updatedSeniors);
        }

        const tempNum = parsedData.saude.temperatura || 36.5;
        const key = `anjo_sinais_vitais_${idoso.id}`;
        const records = getFromDB<any[]>(key, []);
        records.unshift({
          id: `vital_${Date.now()}`,
          temperatura: tempNum,
          peso: pesoNum > 0 ? pesoNum : undefined,
          horario: now,
          registradoPor: usuarioAtual.nome + ' (via Aura Voz)',
          alertaFebre: parsedData.saude.febre || tempNum >= 37.8
        });
        saveToDB(key, records);
        summaryParts.push(`  Saude: ${tempNum}oC`);
      }

      if (summaryParts.length === 0) {
        alert('[!] Nenhum item selecionado para gravar!');
        return;
      }

      // 7. Core Sinais Store (`anjo_sinais`)
      const vitalsStore = getFromDB<SinalVital[]>('anjo_sinais', []);
      const tempNum = (parsedData.saude && voiceSelected.saude) ? (parsedData.saude.temperatura || 36.5) : 36.5;

      const novoSinal: SinalVital = {
        id: 'sin_aura_' + Date.now(),
        idosoId: idoso.id,
        pressaoArterial: sonecaTextStr || 'Sem registros',
        glicemia: 0,
        temperatura: tempNum,
        frequenciaCardiaca: isEscolar ? 0 : 75,
        saturacao: 98,
        peso: pesoNum > 0 ? pesoNum : undefined,
        data: todayIso,
        horario: now,
        registradoPor: usuarioAtual.nome + ' (via Aura Voz)',
        observacoes: parsedData.observacaoGeral || parsedData.respostaAura || 'Registro por voz via Aura',
        fralda: fraldaTextStr,
        soneca: sonecaTextStr
      };
      vitalsStore.push(novoSinal);
      saveToDB('anjo_sinais', vitalsStore);

      // Trigger WhatsApp notification with selected items summary
      const cleanStudentName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
      notifyWhatsApp(
        `Aura Registro por Voz (${cleanStudentName})`,
        `  ${prefix}: Registro de ${cleanStudentName} por voz (${usuarioAtual.nome}):\n` + summaryParts.join('\n')
      );

      setSaveSuccessMsg(`  ${summaryParts.length} item(ns) registrado(s) com sucesso pela Aura!`);
      notifyUpdate();
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setParsedData(null);
        setVoiceText('');
        setIsOpen(false);
        setActiveTab('hub');
      }, 1500);
    };

    if (!ensureShiftActive(runBatch, `Salvar Registros da Aura Voz`)) return;
    runBatch();
  };

  if (!isStaffUser(usuarioAtual)) {
    return null;
  }

  return (
    <>
      
      <div className="fixed bottom-6 right-6 z-40 animate-bounce-subtle">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setActiveTab('hub');
          }}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold rounded-full shadow-2xl shadow-emerald-900/30 border-2 border-emerald-300/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="relative flex items-center justify-center w-8 h-8 bg-white/20 rounded-full backdrop-blur-xs group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-5 h-5 text-white" />
          </span>
          <span className="text-sm tracking-wide font-black uppercase text-white drop-shadow-xs">
            Registro Rapido
          </span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200"></span>
          </span>
        </button>
      </div>

      
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden text-left relative animate-slide-up">
            
            
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white flex items-center justify-between shrink-0 border-b border-emerald-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                    {prefix}   Modulo de 1 Toque
                  </span>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    Registro Rapido para {idoso.nome}
                  </h3>
                  {idoso.contatoEmergencia?.nome && (
                    <span className="text-[11px] font-medium text-emerald-200/90 block mt-0.5">
                          Resp: {idoso.contatoEmergencia.nome} ({idoso.contatoEmergencia.parentesco || 'Mae/Pai'})
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('hub');
                }}
                className="p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            
            {saveSuccessMsg && (
              <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-3 text-center flex items-center justify-center gap-2 animate-fade-in shadow-inner">
                <Check className="w-4 h-4 stroke-[3]" /> {saveSuccessMsg}
              </div>
            )}

            
            <div className="p-5 overflow-y-auto space-y-4">

              
              {!isShiftActive ? (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-950">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 animate-pulse">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <span>  Cronometro da Aula Desligado</span>
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Registros da rotina ocorrem com o cronometro ligado. Ao registrar qualquer item, a aula iniciara automaticamente!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartShiftNow}
                    className="shrink-0 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Ligar Cronometro
                  </button>
                </div>
              ) : (
                <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="font-bold text-emerald-800">  Cronometro de Aulas: LIGADO</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">Registros Autorizados</span>
                </div>
              )}

              
              {activeTab === 'hub' && (
                <div className="space-y-4">
                  
                  <div className="p-4 bg-gradient-to-br from-indigo-900 via-teal-950 to-slate-900 text-white border-2 border-emerald-400/50 rounded-2xl relative overflow-hidden space-y-3 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 shrink-0">
                          <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                            NOVO   Roteiro Guiado da Aura
                          </span>
                          <h4 className="text-sm font-black text-white leading-snug">
                            Diario Completo de {idoso.nome} em 6 Pilares
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            Responda sobre sono, higiene, humor, refeicao e saude. Nao deixa faltar nenhum item e atualiza o Portal de Tranquilidade apos a sua confirmacao!
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('roteiro_guiado')}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Abrir Roteiro Guiado de {idoso.nome}
                    </button>
                  </div>

                  
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl relative overflow-hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                          <Mic className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">
                            Falar Tudo por Voz (Aura Voz AI)
                          </h4>
                          <p className="text-[10px] text-slate-600">
                            Fale livremente: <i>"Heitor dormiu 1h, fez xixi, comeu toda a fruta"</i>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('aura_voice')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[11px] shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Falar
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    Ou selecione a categoria para registrar em 1 toque:
                  </p>

                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('intercorrencia')}
                      className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-102 cursor-pointer col-span-2 sm:col-span-2 shadow-md border border-red-500 animate-pulse"
                    >
                      <AlertTriangle className="w-6 h-6 text-white" />
                      <div className="text-left">
                        <span className="text-xs font-black uppercase tracking-wider block">  Intercorrencia Urgente</span>
                        <span className="text-[10px] text-red-100 block">Febre, Queda, Machucado, Reacao</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('ocorrencia')}
                      className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-102 cursor-pointer col-span-2 sm:col-span-2 shadow-sm border border-amber-400"
                    >
                      <FileText className="w-6 h-6 text-white" />
                      <div className="text-left">
                        <span className="text-xs font-black uppercase tracking-wider block">  Ocorrencia do Dia</span>
                        <span className="text-[10px] text-amber-100 block">Mordida, Choro, Falta de Material</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('agua')}
                      className="p-3.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Droplets className="w-7 h-7 text-cyan-600" />
                      <span className="text-xs font-bold">  Agua</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('refeicao')}
                      className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Coffee className="w-7 h-7 text-amber-600" />
                      <span className="text-xs font-bold">  Refeicao</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('higiene')}
                      className="p-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Activity className="w-7 h-7 text-purple-600" />
                      <span className="text-xs font-bold">  Higiene/Fralda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('sono')}
                      className="p-3.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Moon className="w-7 h-7 text-indigo-600" />
                      <span className="text-xs font-bold">  Soneca</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('humor')}
                      className="p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Smile className="w-7 h-7 text-rose-600" />
                      <span className="text-xs font-bold">  Humor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('saude')}
                      className="p-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Thermometer className="w-7 h-7 text-red-600" />
                      <span className="text-xs font-bold">  Temperatura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('atividade')}
                      className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <Palette className="w-7 h-7 text-emerald-600" />
                      <span className="text-xs font-bold">  Atividade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('nota')}
                      className="p-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-102 cursor-pointer"
                    >
                      <FileText className="w-7 h-7 text-slate-600" />
                      <span className="text-xs font-bold">  Observacao</span>
                    </button>
                  </div>
                </div>
              )}

              
              {activeTab === 'roteiro_guiado' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" /> Roteiro Guiado da Aura
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Preenchimento assistido para {idoso.nome}   Marque os itens que deseja enviar
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('hub')}
                      className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                    >
                        Voltar ao Menu
                    </button>
                  </div>

                  
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-950 text-xs">
                    <span className="text-base shrink-0"> </span>
                    <p className="leading-relaxed">
                      <strong>Aura pergunta:</strong> Como foi o dia do(a) <strong>{idoso.nome.split(' ')[0]}</strong>? Marque/desmarque as caixinhas dos itens que voce quer enviar agora:
                    </p>
                  </div>

                  
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/80 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Filtro rapido:</span>
                    <button
                      type="button"
                      onClick={() => setGuidedState(p => ({ ...p, incSono: true, incHigiene: true, incHumor: true, incAlimentacao: true, incAgua: true, incSaude: true }))}
                      className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                    >
                        Marcar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuidedState(p => ({ ...p, incSono: false, incHigiene: false, incHumor: false, incAlimentacao: false, incAgua: false, incSaude: false }))}
                      className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                    >
                        Desmarcar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuidedState(p => ({ ...p, incSono: false, incHigiene: false, incHumor: false, incAlimentacao: true, incAgua: false, incSaude: false }))}
                      className="px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                    >
                        So Refeicao
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuidedState(p => ({ ...p, incSono: false, incHigiene: false, incHumor: false, incAlimentacao: false, incAgua: true, incSaude: false }))}
                      className="px-2.5 py-1 bg-cyan-100 text-cyan-900 hover:bg-cyan-200 border border-cyan-300 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                    >
                        So Agua
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuidedState(p => ({ ...p, incSono: false, incHigiene: true, incHumor: false, incAlimentacao: false, incAgua: false, incSaude: false }))}
                      className="px-2.5 py-1 bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                    >
                        So Higiene
                    </button>
                  </div>

                  
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-emerald-600" /> Preferir falar por voz?
                      </span>
                      <VoiceInput
                        onTranscript={(txt) => {
                          setVoiceText(txt);
                          handleProcessAuraVoice(txt);
                        }}
                        size="sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Diga ex: "Heitor dormiu 1h, fez coco normal, estava feliz, comeu o almoco todo e tomou 200ml de agua"
                    </p>
                  </div>

                  
                  <div className={`p-3.5 rounded-2xl space-y-2 border transition-all ${
                    guidedState.incSono ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={guidedState.incSono}
                          onChange={(e) => setGuidedState(p => ({ ...p, incSono: e.target.checked }))}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <Moon className={`w-4 h-4 ${guidedState.incSono ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className={guidedState.incSono ? 'text-indigo-950 font-black' : 'text-slate-500 line-through'}>
                          1. Sono / Soneca
                        </span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${guidedState.incSono ? 'text-indigo-700 bg-indigo-100' : 'text-slate-400 bg-slate-200'}`}>
                        {guidedState.incSono ? (guidedState.sonecaNaoDormiu ? 'Nao Dormiu' : `${guidedState.sonecaMinutos} min`) : 'Nao incluir'}
                      </span>
                    </div>

                    {guidedState.incSono && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[30, 45, 60, 90, 120].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incSono: true, sonecaMinutos: mins, sonecaNaoDormiu: false }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              !guidedState.sonecaNaoDormiu && guidedState.sonecaMinutos === mins
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                            }`}
                          >
                            {mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}m` : ''}` : `${mins}min`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setGuidedState(p => ({ ...p, incSono: true, sonecaNaoDormiu: true }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            guidedState.sonecaNaoDormiu
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Nao Dormiu
                        </button>
                      </div>
                    )}
                  </div>

                  
                  <div className={`p-3.5 rounded-2xl space-y-2 border transition-all ${
                    guidedState.incHigiene ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={guidedState.incHigiene}
                          onChange={(e) => setGuidedState(p => ({ ...p, incHigiene: e.target.checked }))}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <Activity className={`w-4 h-4 ${guidedState.incHigiene ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span className={guidedState.incHigiene ? 'text-purple-950 font-black' : 'text-slate-500 line-through'}>
                          2. Higiene & Trocas
                        </span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${guidedState.incHigiene ? 'text-purple-700 bg-purple-100' : 'text-slate-400 bg-slate-200'}`}>
                        {guidedState.incHigiene ? (guidedState.coco ? `Coco (${guidedState.cocoConsistencia})` : guidedState.xixi ? 'Xixi' : 'Troca') : 'Nao incluir'}
                      </span>
                    </div>

                    {guidedState.incHigiene && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incHigiene: true, xixi: !p.xixi }))}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              guidedState.xixi ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                              Xixi {guidedState.xixi ? ' ' : ''}
                          </button>

                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incHigiene: true, coco: !p.coco }))}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              guidedState.coco ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                              Coco {guidedState.coco ? ' ' : ''}
                          </button>

                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incHigiene: true, dentes: !p.dentes }))}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              guidedState.dentes ? 'bg-teal-600 text-white border-teal-700' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                              Dentes {guidedState.dentes ? ' ' : ''}
                          </button>

                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incHigiene: true, roupa: !p.roupa }))}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              guidedState.roupa ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                              Roupa {guidedState.roupa ? ' ' : ''}
                          </button>

                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incHigiene: true, banho: !p.banho }))}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              guidedState.banho ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                              Banho {guidedState.banho ? ' ' : ''}
                          </button>
                        </div>

                        {guidedState.coco && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-500">Consistencia Coco:</span>
                            {['normal', 'liquida', 'dura'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setGuidedState(p => ({ ...p, incHigiene: true, cocoConsistencia: c }))}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                  guidedState.cocoConsistencia === c ? 'bg-amber-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  
                  <div className={`p-3.5 rounded-2xl space-y-2 border transition-all ${
                    guidedState.incHumor ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={guidedState.incHumor}
                          onChange={(e) => setGuidedState(p => ({ ...p, incHumor: e.target.checked }))}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <Smile className={`w-4 h-4 ${guidedState.incHumor ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span className={guidedState.incHumor ? 'text-rose-950 font-black' : 'text-slate-500 line-through'}>
                          3. Humor / Disposicao
                        </span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${guidedState.incHumor ? 'text-rose-700 bg-rose-100' : 'text-slate-400 bg-slate-200'}`}>
                        {guidedState.incHumor ? guidedState.humor : 'Nao incluir'}
                      </span>
                    </div>

                    {guidedState.incHumor && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                        {[
                          { id: 'feliz', label: '  Feliz / Alegre' },
                          { id: 'tranquilo', label: '  Calmo / Ok' },
                          { id: 'choroso', label: '  Manhoso' },
                          { id: 'agitado', label: '  Agitado' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incHumor: true, humor: item.id }))}
                            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              guidedState.humor === item.id
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white text-rose-950 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  
                  <div className={`p-3.5 rounded-2xl space-y-2 border transition-all ${
                    guidedState.incAlimentacao ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={guidedState.incAlimentacao}
                          onChange={(e) => setGuidedState(p => ({ ...p, incAlimentacao: e.target.checked }))}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <Coffee className={`w-4 h-4 ${guidedState.incAlimentacao ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className={guidedState.incAlimentacao ? 'text-amber-950 font-black' : 'text-slate-500 line-through'}>
                          4. Alimentacao & Aceitacao
                        </span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${guidedState.incAlimentacao ? 'text-amber-800 bg-amber-100' : 'text-slate-400 bg-slate-200'}`}>
                        {guidedState.incAlimentacao ? `${guidedState.refeicaoTipo} (${guidedState.refeicaoAceitacao === 'muito_bem' ? 'Comeu Tudo' : guidedState.refeicaoAceitacao})` : 'Nao incluir'}
                      </span>
                    </div>

                    {guidedState.incAlimentacao && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {['Almoco', 'Lanchinho', 'Mamadeira', 'Jantar'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setGuidedState(p => ({ ...p, incAlimentacao: true, refeicaoTipo: m }))}
                              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                guidedState.refeicaoTipo === m
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-amber-950 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incAlimentacao: true, refeicaoAceitacao: 'muito_bem' }))}
                            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              guidedState.refeicaoAceitacao === 'muito_bem' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                              Comeu Tudo
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incAlimentacao: true, refeicaoAceitacao: 'parcial' }))}
                            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              guidedState.refeicaoAceitacao === 'parcial' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                              Parcial
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incAlimentacao: true, refeicaoAceitacao: 'recusou' }))}
                            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              guidedState.refeicaoAceitacao === 'recusou' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                              Recusou
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  
                  <div className={`p-3.5 rounded-2xl space-y-2 border transition-all ${
                    guidedState.incAgua ? 'bg-cyan-50/50 border-cyan-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={guidedState.incAgua}
                          onChange={(e) => setGuidedState(p => ({ ...p, incAgua: e.target.checked }))}
                          className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <Droplets className={`w-4 h-4 ${guidedState.incAgua ? 'text-cyan-600' : 'text-slate-400'}`} />
                        <span className={guidedState.incAgua ? 'text-cyan-950 font-black' : 'text-slate-500 line-through'}>
                          5. Hidratacao (Agua / Suco)
                        </span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${guidedState.incAgua ? 'text-cyan-800 bg-cyan-100' : 'text-slate-400 bg-slate-200'}`}>
                        {guidedState.incAgua ? `${guidedState.aguaMl} ml` : 'Nao incluir'}
                      </span>
                    </div>

                    {guidedState.incAgua && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[50, 100, 150, 200, 250, 300].map((ml) => (
                          <button
                            key={ml}
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, incAgua: true, aguaMl: ml }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              guidedState.aguaMl === ml
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : 'bg-white text-cyan-950 border border-cyan-200 hover:bg-cyan-100'
                            }`}
                          >
                            +{ml}ml
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  
                  <div className={`p-3.5 rounded-2xl space-y-3 border transition-all ${
                    guidedState.incSaude ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={guidedState.incSaude}
                          onChange={(e) => setGuidedState(p => ({ ...p, incSaude: e.target.checked }))}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <Thermometer className={`w-4 h-4 ${guidedState.incSaude ? 'text-red-600' : 'text-slate-400'}`} />
                        <span className={guidedState.incSaude ? 'text-red-950 font-black' : 'text-slate-500 line-through'}>
                          6. Saude, Febre & Peso
                        </span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${guidedState.incSaude ? 'text-red-800 bg-red-100' : 'text-slate-400 bg-slate-200'}`}>
                        {guidedState.incSaude ? `${guidedState.temperatura}oC | ${guidedState.peso || '-'} kg` : 'Nao incluir'}
                      </span>
                    </div>

                    {guidedState.incSaude && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Temperatura (oC):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['36.2', '36.5', '36.8', '37.2', '37.8'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setGuidedState(p => ({ ...p, incSaude: true, temperatura: t }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                guidedState.temperatura === t
                                  ? parseFloat(t) >= 37.8 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {t}oC {parseFloat(t) >= 37.8 ? '  Febre' : ''}
                            </button>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-red-200/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">  Peso Corporal da Crianca (Kg):</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={guidedState.peso}
                              onChange={(e) => setGuidedState(p => ({ ...p, incSaude: true, peso: e.target.value }))}
                              placeholder="Ex: 12.5"
                              className="w-28 p-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-black text-slate-600">kg</span>
                            <div className="flex flex-wrap gap-1">
                              {['10.0', '12.5', '14.0', '15.5', '18.0', '20.0'].map((w) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setGuidedState(p => ({ ...p, incSaude: true, peso: w }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    guidedState.peso === w ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {w}kg
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  
                  <div className="p-4 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white border-2 border-emerald-400/60 rounded-2xl space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        ITENS SELECIONADOS A ENVIAR AO PORTAL DE TRANQUILIDADE
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          Requer Confirmacao
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                      {guidedState.incSono && (
                        <div>
                          <span className="text-emerald-300 font-bold block text-[11px]">  Sono:</span>
                          <span>{guidedState.sonecaNaoDormiu ? 'Nao dormiu' : `${guidedState.sonecaMinutos} min`}</span>
                        </div>
                      )}
                      {guidedState.incHigiene && (
                        <div>
                          <span className="text-emerald-300 font-bold block text-[11px]">  Higiene:</span>
                          <span>{guidedState.coco ? 'Coco ' : ''}{guidedState.xixi ? 'Xixi' : ''}</span>
                        </div>
                      )}
                      {guidedState.incHumor && (
                        <div>
                          <span className="text-emerald-300 font-bold block text-[11px]">  Humor:</span>
                          <span className="capitalize">{guidedState.humor}</span>
                        </div>
                      )}
                      {guidedState.incAlimentacao && (
                        <div>
                          <span className="text-emerald-300 font-bold block text-[11px]">  Refeicao:</span>
                          <span>{guidedState.refeicaoTipo} ({guidedState.refeicaoAceitacao === 'muito_bem' ? '100%' : 'Parcial'})</span>
                        </div>
                      )}
                      {guidedState.incAgua && (
                        <div>
                          <span className="text-emerald-300 font-bold block text-[11px]">  Agua:</span>
                          <span>{guidedState.aguaMl} ml</span>
                        </div>
                      )}
                      {guidedState.incSaude && (
                        <div>
                          <span className="text-emerald-300 font-bold block text-[11px]">  Saude:</span>
                          <span>{guidedState.temperatura}oC</span>
                        </div>
                      )}
                    </div>

                    {(!guidedState.incAgua && !guidedState.incAlimentacao && !guidedState.incSono && !guidedState.incHigiene && !guidedState.incHumor && !guidedState.incSaude) && (
                      <p className="text-xs text-amber-300 italic">
                        [!] Nenhum item selecionado. Marque as caixinhas dos itens que deseja enviar acima.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveGuidedScript}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Check className="w-5 h-5 stroke-[3]" /> Confirmar & Enviar Apenas os Selecionados
                    </button>
                  </div>
                </div>
              )}

              
              {activeTab === 'aura_voice' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Aura Multirregistro por Voz
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('hub')}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                        Voltar ao Menu
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal">
                    Toque no microfone e fale naturalmente os acontecimentos de <strong>{idoso.nome}</strong>:
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        rows={3}
                        value={voiceText}
                        onChange={(e) => setVoiceText(e.target.value)}
                        placeholder={`Ex: "Aura, o ${idoso.nome} dormiu 1h30, acordou alegre, tomou 150ml de agua e comeu toda a fruta no lanche."`}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                      />
                    </div>
                    <VoiceInput
                      onTranscript={(txt) => {
                        setVoiceText(prev => prev ? `${prev} ${txt}` : txt);
                      }}
                      size="md"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!voiceText.trim() || isParsingVoice}
                    onClick={() => handleProcessAuraVoice(voiceText)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {isParsingVoice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processando com Aura IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Interpretar e Preencher com a Aura
                      </>
                    )}
                  </button>

                  
                  {parsedData && (
                    <div className="p-4 bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl space-y-3 animate-slide-up">
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg"> </span>
                        <div>
                          <h5 className="text-xs font-extrabold text-emerald-950">
                            Aura interpretou os seguintes registros (Marque o que deseja enviar):
                          </h5>
                          <p className="text-[11px] text-emerald-800 italic mt-0.5">
                            "{parsedData.respostaAura}"
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-emerald-100">
                        {parsedData.hidratacao && (
                          <label className="flex items-center gap-2 font-semibold text-cyan-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceSelected.hidratacao}
                              onChange={(e) => setVoiceSelected(p => ({ ...p, hidratacao: e.target.checked }))}
                              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                            />
                            <span className={voiceSelected.hidratacao ? '' : 'line-through text-slate-400'}>
                                Hidratacao: +{parsedData.hidratacao.quantidadeMl || 100}ml de agua
                            </span>
                          </label>
                        )}
                        {parsedData.sono && (
                          <label className="flex items-center gap-2 font-semibold text-indigo-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceSelected.sono}
                              onChange={(e) => setVoiceSelected(p => ({ ...p, sono: e.target.checked }))}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className={voiceSelected.sono ? '' : 'line-through text-slate-400'}>
                                Soneca: {parsedData.sono.duracaoMinutos || 60} minutos de sono
                            </span>
                          </label>
                        )}
                        {parsedData.alimentacao && (
                          <label className="flex items-center gap-2 font-semibold text-amber-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceSelected.alimentacao}
                              onChange={(e) => setVoiceSelected(p => ({ ...p, alimentacao: e.target.checked }))}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className={voiceSelected.alimentacao ? '' : 'line-through text-slate-400'}>
                                Alimentacao: {parsedData.alimentacao.refeicao || 'Refeicao'} ({parsedData.alimentacao.aceitacao})
                            </span>
                          </label>
                        )}
                        {parsedData.higiene && (
                          <label className="flex items-center gap-2 font-semibold text-purple-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceSelected.higiene}
                              onChange={(e) => setVoiceSelected(p => ({ ...p, higiene: e.target.checked }))}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className={voiceSelected.higiene ? '' : 'line-through text-slate-400'}>
                                Higiene: {parsedData.higiene.tipoFralda || 'Troca de Fralda'}
                            </span>
                          </label>
                        )}
                        {parsedData.humor && (
                          <label className="flex items-center gap-2 font-semibold text-rose-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceSelected.humor}
                              onChange={(e) => setVoiceSelected(p => ({ ...p, humor: e.target.checked }))}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                            <span className={voiceSelected.humor ? '' : 'line-through text-slate-400'}>
                                Humor: {parsedData.humor.estado || 'Feliz'}
                            </span>
                          </label>
                        )}
                        {parsedData.saude && (
                          <label className="flex items-center gap-2 font-semibold text-red-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceSelected.saude}
                              onChange={(e) => setVoiceSelected(p => ({ ...p, saude: e.target.checked }))}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                            <span className={voiceSelected.saude ? '' : 'line-through text-slate-400'}>
                                Saude: {parsedData.saude.temperatura || 36.5}oC
                            </span>
                          </label>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmAuraBatchSave}
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Confirmar e Gravar Apenas os Selecionados
                      </button>
                    </div>
                  )}
                </div>
              )}

              
              {activeTab === 'agua' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-cyan-900 flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-cyan-600" /> Registro de Agua (1 Toque)
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Toque na quantidade servida para <strong>{idoso.nome}</strong>. O registro e instant
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {[50, 100, 150, 200].map((ml) => (
                      <button
                        key={ml}
                        type="button"
                        onClick={() => handleQuickAgua(ml)}
                        className="py-4 px-3 bg-cyan-50 hover:bg-cyan-500 hover:text-white border-2 border-cyan-200 hover:border-cyan-600 rounded-2xl text-cyan-950 hover:text-white transition-all font-black text-sm flex flex-col items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span className="text-xl"> </span>
                        <span>+{ml} ml</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              
              {activeTab === 'refeicao' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-amber-600" /> Registro de Refeicao
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">Qual Refeicao?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Mamadeira', 'Almoco', 'Lanche da Tarde', 'Fruta'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setQuickMeal(prev => ({ ...prev, tipo: m }))}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${quickMeal.tipo === m ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">Como foi a aceitacao?</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickRefeicao(quickMeal.tipo, 'muito_bem')}
                          className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
                        >
                          <span className="text-xl"> </span>
                          <span className="text-[11px] font-bold">Comeu Tudo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickRefeicao(quickMeal.tipo, 'parcial')}
                          className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
                        >
                          <span className="text-xl"> </span>
                          <span className="text-[11px] font-bold">Pouco</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickRefeicao(quickMeal.tipo, 'recusou')}
                          className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 rounded-2xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
                        >
                          <span className="text-xl"> </span>
                          <span className="text-[11px] font-bold">Recusou</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'higiene' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-purple-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" /> Higiene e Fralda
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">Selecione o registro realizado com 1 toque:</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickHigiene('xixi')}
                      className="p-3.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer"
                    >
                      <span className="text-2xl"> </span>
                      <span className="text-xs font-bold">Xixi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickHigiene('coco')}
                      className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer"
                    >
                      <span className="text-2xl"> </span>
                      <span className="text-xs font-bold">Coco</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickHigiene('banho')}
                      className="p-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer"
                    >
                      <span className="text-2xl"> </span>
                      <span className="text-xs font-bold">Banho</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickHigiene('dentes')}
                      className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer"
                    >
                      <span className="text-2xl"> </span>
                      <span className="text-xs font-bold">Dentes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickHigiene('roupa')}
                      className="p-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer"
                    >
                      <span className="text-2xl"> </span>
                      <span className="text-xs font-bold">Troca Roupa</span>
                    </button>
                  </div>
                </div>
              )}

              
              {activeTab === 'sono' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-indigo-900 flex items-center gap-2">
                      <Moon className="w-5 h-5 text-indigo-600" /> Registro de Soneca
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">Quanto tempo {idoso.nome} dormiu?</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[30, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleQuickSono(mins)}
                        className="py-4 px-3 bg-indigo-50 hover:bg-indigo-600 hover:text-white border-2 border-indigo-200 rounded-2xl text-indigo-950 hover:text-white transition-all font-black text-sm flex flex-col items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span className="text-xl"> </span>
                        <span>{mins >= 60 ? `${mins / 60}h` : `${mins} min`}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              
              {activeTab === 'humor' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-rose-900 flex items-center gap-2">
                      <Smile className="w-5 h-5 text-rose-600" /> Estado de Humor
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { label: 'Feliz / Contente', emoji: ' ', val: 'feliz' },
                      { label: 'Tranquilo', emoji: ' ', val: 'tranquilo' },
                      { label: 'Sensivel / Choroso', emoji: ' ', val: 'choroso' },
                      { label: 'Com Sono', emoji: ' ', val: 'sonolento' },
                      { label: 'Indisposto', emoji: ' ', val: 'indisposto' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleQuickHumor(item.val)}
                        className="p-3.5 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-200 text-rose-950 hover:text-white rounded-2xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              
              {activeTab === 'saude' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-red-900 flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-red-600" /> Saude, Temperatura & Peso
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">  Peso Corporal da Crianca (Kg):</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={guidedState.peso}
                        onChange={(e) => setGuidedState(p => ({ ...p, peso: e.target.value }))}
                        placeholder="Ex: 12.5"
                        className="w-28 p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      />
                      <span className="text-xs font-black text-slate-600">kg</span>
                      <div className="flex flex-wrap gap-1">
                        {['10.0', '12.5', '14.0', '15.5', '18.0', '20.0'].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setGuidedState(p => ({ ...p, peso: w }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              guidedState.peso === w ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {w}kg
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-bold">Selecione a temperatura para registrar com o peso:</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {['36.5', '37.0', '37.8', '38.5'].map((tStr) => {
                      const isFebre = parseFloat(tStr) >= 37.8;
                      return (
                        <button
                          key={tStr}
                          type="button"
                          onClick={() => handleQuickSaude(tStr, guidedState.peso)}
                          className={`py-4 px-3 border-2 rounded-2xl font-black text-sm flex flex-col items-center gap-1 transition-all cursor-pointer shadow-xs ${
                            isFebre
                              ? 'bg-red-50 hover:bg-red-600 text-red-900 hover:text-white border-red-300'
                              : 'bg-slate-50 hover:bg-slate-800 text-slate-800 hover:text-white border-slate-200'
                          }`}
                        >
                          <span className="text-xl">{isFebre ? '  ' : ' '}</span>
                          <span>{tStr}o C</span>
                          {isFebre && <span className="text-[10px] font-extrabold uppercase">Alerta Febre</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              
              {activeTab === 'atividade' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-emerald-600" /> Atividade Pedagogica / Recreativa
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: '  Pintura e Arte', val: 'Pintura' },
                      { name: '  Aula de Musica', val: 'Musica' },
                      { name: '  Recreacao no Parque', val: 'Parque' },
                      { name: '  Roda de Historias', val: 'Historia' },
                      { name: '  Jogos Pedagogicos', val: 'Jogos' }
                    ].map((act) => (
                      <button
                        key={act.val}
                        type="button"
                        onClick={() => handleQuickAtividade(act.val, act.name)}
                        className="p-3.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-950 rounded-2xl text-left font-bold text-xs transition-all cursor-pointer"
                      >
                        {act.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              
              {activeTab === 'nota' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-slate-600" /> Observacao / Recado Rapido
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500">
                        Voltar
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={quickNota}
                    onChange={(e) => setQuickNota(e.target.value)}
                    placeholder="Escreva uma breve nota ou observacao pedagogica..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500"
                  />

                  <button
                    type="button"
                    disabled={!quickNota.trim()}
                    onClick={() => handleQuickNota(quickNota)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    Salvar Observacao
                  </button>
                </div>
              )}

              
              {activeTab === 'intercorrencia' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-red-100 pb-2">
                    <h4 className="text-sm font-black text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" /> Intercorrencia Urgente  
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
                        Voltar
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Selecione o tipo de ocorrencia medica/urgente para registrar e avisar a familia imediatamente:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { tipo: 'Febre', icon: ' ', desc: 'Febre aferida alta' },
                      { tipo: 'Queda / Escoriacao', icon: ' ', desc: 'Queda no recreio/sala' },
                      { tipo: 'Machucado / Hematoma', icon: ' ', desc: 'Pancada ou machucado' },
                      { tipo: 'Vomito / Mal-estar', icon: ' ', desc: 'Sintomas gastricos' },
                      { tipo: 'Reacao Alergica', icon: ' ', desc: 'Alergia subita' },
                      { tipo: 'Recusa de Medicacao', icon: '  ', desc: 'Medicacao nao tomada' }
                    ].map((item) => (
                      <button
                        key={item.tipo}
                        type="button"
                        onClick={() => handleQuickIntercorrencia(item.tipo, item.desc)}
                        className="p-3 bg-red-50 hover:bg-red-600 text-red-950 hover:text-white border border-red-200 rounded-2xl text-left transition-all cursor-pointer font-bold text-xs"
                      >
                        <span className="text-lg mr-1">{item.icon}</span>
                        <span className="block font-black">{item.tipo}</span>
                        <span className="text-[10px] opacity-80 block">{item.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Detalhar Outra Intercorrencia:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Picada de inseto ou sintoma especifico..."
                        value={quickNota}
                        onChange={(e) => setQuickNota(e.target.value)}
                        className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        disabled={!quickNota.trim()}
                        onClick={() => {
                          handleQuickIntercorrencia('Outra Intercorrencia', quickNota);
                          setQuickNota('');
                        }}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        Registrar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'ocorrencia' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <h4 className="text-sm font-black text-amber-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600" /> Ocorrencia do Dia / Rotina  
                    </h4>
                    <button type="button" onClick={() => setActiveTab('hub')} className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
                        Voltar
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Registre observacoes de comportamento ou incidentes leves do dia:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { tipo: 'Mordida / Atrito', icon: ' ', desc: 'Atitude com coleguinha' },
                      { tipo: 'Choro / Adaptacao', icon: ' ', desc: 'Choro prolongado' },
                      { tipo: 'Falta de Material', icon: ' ', desc: 'Sem muda de roupa/fralda' },
                      { tipo: 'Desentendimento', icon: ' ', desc: 'Conflito na brincadeira' },
                      { tipo: 'Agitacao', icon: ' ', desc: 'Dificuldade de concentracao' },
                      { tipo: 'Recusa Alimentar', icon: ' ', desc: 'Nao quis o lanche' }
                    ].map((item) => (
                      <button
                        key={item.tipo}
                        type="button"
                        onClick={() => handleQuickOcorrencia(item.tipo, item.desc)}
                        className="p-3 bg-amber-50 hover:bg-amber-500 text-amber-950 hover:text-white border border-amber-200 rounded-2xl text-left transition-all cursor-pointer font-bold text-xs"
                      >
                        <span className="text-lg mr-1">{item.icon}</span>
                        <span className="block font-black">{item.tipo}</span>
                        <span className="text-[10px] opacity-80 block">{item.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Escrever Ocorrencia Personalizada:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escreva a ocorrencia..."
                        value={quickNota}
                        onChange={(e) => setQuickNota(e.target.value)}
                        className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        disabled={!quickNota.trim()}
                        onClick={() => {
                          handleQuickOcorrencia('Ocorrencia Escolar', quickNota);
                          setQuickNota('');
                        }}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        Registrar
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      
      {showShiftConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative p-6 space-y-4 text-left animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
                <Clock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                  Aviso de Cronometro
                </span>
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  Ligar Cronometro?
                </h3>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-1.5 text-slate-700 text-xs leading-relaxed">
              <p className="font-bold text-slate-800">
                O cronometro de {isEscolar ? 'aulas/turno' : 'turno'} de <span className="font-black text-amber-950">{idoso.nome}</span> esta desligado.
              </p>
              <p className="text-slate-600">
                Deseja ligar o cronometro agora para realizar o registro{pendingShiftAction?.label ? ` ("${pendingShiftAction.label}")` : ''}?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelStartShift}
                className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmStartShift}
                className="flex-1 py-3 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black rounded-2xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
              >
                <Play className="w-4 h-4 fill-white shrink-0" />
                <span>Sim, Ligar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
