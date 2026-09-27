import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Droplet, 
  Baby, Moon, Thermometer, Smile, Utensils, HeartHandshake,
  ShieldCheck, Mic, Plus, Lock, Clock, Sparkles, MessageSquare, Send, Check,
  UserX, UserCheck, LogOut, CalendarX, AlertCircle, Scale,
  Users, User, BookOpen, Palette, Music, TreePine, Puzzle
} from 'lucide-react';
import { StudentPaxData, OcorrenciaEscolar } from '../../types';
import ModalOcorrenciaDoDia from './ModalOcorrenciaDoDia';
import ModalRelatorioWhatsApp from './ModalRelatorioWhatsApp';
import ModalConfirmarEncerramentoColetivo from './ModalConfirmarEncerramentoColetivo';
import ModalDesligarIndividual, { TipoDesligamento } from './ModalDesligarIndividual';
import BotaoFlutuanteOcorrencia from './BotaoFlutuanteOcorrencia';
import { salvarDiarioRecebido, salvarAvisoMural } from '../../services/muralDiariosService';
import { registrarLogAuditoriaLgpd } from '../../services/lgpdService';
import { formatarDiarioCompletoWhatsApp } from '../../utils/formatadorDiarioWhatsApp';

interface Props {
  student: StudentPaxData;
  userRole: 'professor' | 'familia';
  onUpdateStudent?: (updated: Partial<StudentPaxData>) => void;
  allStudents?: StudentPaxData[];
  onUpdateAllStudents?: (updater: (st: StudentPaxData) => StudentPaxData) => void;
}

const calcHoraFimSoneca = (inicio: string, duracaoMinutos: number): string => {
  if (!inicio || !inicio.includes(':')) return '14:00';
  const [h, m] = inicio.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) return '14:00';
  const totalMin = h * 60 + m + duracaoMinutos;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
};

const extractHoraInicioFromSoneca = (soneca?: { valor?: string; periodo?: string }): string => {
  if (!soneca) return '12:30';
  const combined = `${soneca.periodo || ''} ${soneca.valor || ''}`;
  const match = combined.match(/(\d{1,2}:\d{2})/);
  if (match) {
    const [h, m] = match[1].split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  return '12:30';
};

const extractHoraFimFromSoneca = (soneca?: { valor?: string; periodo?: string }, inicio = '12:30'): string => {
  if (!soneca) return calcHoraFimSoneca(inicio, 90);
  const combined = `${soneca.periodo || ''} ${soneca.valor || ''}`;
  const matches = combined.match(/(\d{1,2}:\d{2})/g);
  if (matches && matches.length >= 2) {
    const [h, m] = matches[1].split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  return calcHoraFimSoneca(inicio, 90);
};

const extractMamadeiraVolume = (student?: StudentPaxData): number => {
  if (!student) return 180;
  if (student.alimentacao?.volumeSelecionado && student.alimentacao.volumeSelecionado > 0) {
    return student.alimentacao.volumeSelecionado;
  }
  if (student.alimentacao?.ultimoVolume && student.alimentacao.ultimoVolume > 0) {
    return student.alimentacao.ultimoVolume;
  }
  return 180;
};

export default function PainelRotinaUnificado({
  student,
  userRole,
  onUpdateStudent,
  allStudents,
  onUpdateAllStudents,
}: Props) {
  const isProfessor = userRole === 'professor';

  // --- CRONÔMETRO SINCRONIZADO ---
  const [timerRunning, setTimerRunning] = useState(!!student.presenca?.isTimerRunning);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const sincronizarCronometroGlobal = (running: boolean) => {
    setTimerRunning(running);
    if (onUpdateAllStudents) {
      onUpdateAllStudents((st) => ({
        ...st,
        presenca: {
          ...st.presenca,
          isTimerRunning: running,
          status: running ? 'em_aula' : st.presenca.status,
          tempoEmAulaFormatado: formatTimer(secondsElapsed),
        },
      }));
    } else if (onUpdateStudent) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          isTimerRunning: running,
          status: running ? 'em_aula' : student.presenca.status,
          tempoEmAulaFormatado: formatTimer(secondsElapsed),
        },
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjinho:timer-status-changed', {
        detail: { isTimerRunning: running, status: running ? 'em_aula' : 'pausado' }
      }));
    }
  };

  // --- ESTADOS DE MAMADEIRA ---
  const [refeicaoTipo, setRefeicaoTipo] = useState('Mamadeira');
  const [aceitacao, setAceitacao] = useState('Tomou Tudo');
  const [mamadeiraVolume, setMamadeiraVolume] = useState(() => extractMamadeiraVolume(student));
  const [mamadeirasContador, setMamadeirasContador] = useState(student.alimentacao?.mamadeirasServidas || 0);
  const [mamadeiraObs, setMamadeiraObs] = useState('');

  const handleSelectMamadeiraVolume = (vol: number) => {
    setMamadeiraVolume(vol);
    if (onUpdateStudent && isProfessor) {
      onUpdateStudent({
        alimentacao: {
          ...student.alimentacao,
          mamadeirasServidas: student.alimentacao?.mamadeirasServidas || 0,
          mamadeirasMlTotal: student.alimentacao?.mamadeirasMlTotal || 0,
          ultimoVolume: vol,
          volumeSelecionado: vol,
        },
      });
    }
  };

  // --- ESTADOS DE HIDRATAÇÃO RÁPIDA (ÁGUA) ---
  const [copoSelecionado, setCopoSelecionado] = useState(50);
  const [aguaConsumo, setAguaConsumo] = useState(student.agua?.consumoMl || 0);
  const [coposContador, setCoposContador] = useState(student.agua?.coposServidos || 0);

  // --- ESTADOS DE HUMOR ---
  const [humorEstado, setHumorEstado] = useState(student.humor?.estado || 'Calmo / Sereno');
  const [humorObs, setHumorObs] = useState(student.humor?.observacao || '');

  // --- ESTADOS DE SAÚDE, SONO, FRALDA & CUIDADOS ---
  const [sonecaDesc, setSonecaDesc] = useState(student.saudeCards?.soneca?.valor || 'Sem Soneca Ainda');
  const [horaSonecaInicio, setHoraSonecaInicio] = useState(() => extractHoraInicioFromSoneca(student.saudeCards?.soneca));
  const [horaSonecaFim, setHoraSonecaFim] = useState(() =>
    extractHoraFimFromSoneca(student.saudeCards?.soneca, extractHoraInicioFromSoneca(student.saudeCards?.soneca))
  );
  const [sonecaEscopo, setSonecaEscopo] = useState<'individual' | 'coletiva'>('coletiva');
  const [fraldaDesc, setFraldaDesc] = useState(student.saudeCards?.fraldas?.valor || 'Nenhuma Troca');
  const [temperatura, setTemperatura] = useState('36.5');
  const [peso, setPeso] = useState(() => (student.saudeCards?.peso?.valor || '14.0').replace(/kg/i, '').replace('º', '').trim());
  const [notaGeralSaude, setNotaGeralSaude] = useState('');
  const [showModalHistoricoPeso, setShowModalHistoricoPeso] = useState(false);

  // Reconhecimento de Voz (Microfone)
  const [isListeningHumor, setIsListeningHumor] = useState(false);
  const [isListeningFralda, setIsListeningFralda] = useState(false);

  const handleVoiceRecord = (field: 'humor' | 'fralda') => {
    if (!isProfessor) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showFeedback('⚠️ Reconhecimento de voz não suportado neste navegador. Digite pelo teclado.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      if (field === 'humor') {
        setIsListeningHumor(true);
        recognition.onend = () => setIsListeningHumor(false);
        recognition.onerror = () => setIsListeningHumor(false);
        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setHumorObs((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListeningHumor(false);
          showFeedback(`🎙️ Humor gravado por voz: "${transcript}"`);
        };
      } else {
        setIsListeningFralda(true);
        recognition.onend = () => setIsListeningFralda(false);
        recognition.onerror = () => setIsListeningFralda(false);
        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setFraldaDesc(transcript);
          setIsListeningFralda(false);
          showFeedback(`🎙️ Fralda gravada por voz: "${transcript}"`);
        };
      }
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListeningHumor(false);
      setIsListeningFralda(false);
    }
  };

  // Checklist de Higiene (5 Itens)
  const [checklist, setChecklist] = useState<{
    trocaRoupas: 'Realizado' | 'Pendente';
    escovacaoDentes: 'Realizado' | 'Pendente';
    maosERosto: 'Realizado' | 'Pendente';
    banhoTomado: 'Realizado' | 'Pendente';
    pomadaProtetor: 'Realizado' | 'Pendente';
  }>({
    trocaRoupas: student.higieneChecklist?.trocaRoupas || 'Pendente',
    escovacaoDentes: student.higieneChecklist?.escovacaoDentes || 'Pendente',
    maosERosto: student.higieneChecklist?.maosERosto || 'Pendente',
    banhoTomado: student.higieneChecklist?.banhoTomado || 'Pendente',
    pomadaProtetor: student.higieneChecklist?.pomadaProtetor || 'Pendente',
  });

  // Modais
  const [showModalRelatorio, setShowModalRelatorio] = useState(false);
  const [showModalConfirmarColetivo, setShowModalConfirmarColetivo] = useState(false);
  const [showModalCronometroDesligado, setShowModalCronometroDesligado] = useState(false);
  const [acaoPendenteCronometro, setAcaoPendenteCronometro] = useState<{ nome: string; executar: () => void } | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [cardConfirmacao, setCardConfirmacao] = useState<{ titulo: string; mensagem: string } | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const triggerCardConfirmacao = (titulo: string, mensagem: string) => {
    setCardConfirmacao({ titulo, mensagem });
    setTimeout(() => setCardConfirmacao(null), 4500);
  };

  // 🔒 VALIDAÇÃO OBRIGATÓRIA DE CRONÔMETRO
  const validarCronometroAtivo = (acaoNome: string, executarAcao: () => void): boolean => {
    if (!isProfessor) return false;
    if (!timerRunning) {
      setAcaoPendenteCronometro({ nome: acaoNome, executar: executarAcao });
      setShowModalCronometroDesligado(true);
      return false;
    }
    return true;
  };

  const handleLigarCronometroEExecutarPendente = () => {
    sincronizarCronometroGlobal(true);
    setShowModalCronometroDesligado(false);
    showFeedback('⏱️ Cronômetro iniciado e sincronizado com as Atividades!');
    if (acaoPendenteCronometro) {
      const fn = acaoPendenteCronometro.executar;
      setTimeout(() => {
        fn();
        setAcaoPendenteCronometro(null);
      }, 50);
    }
  };

  // ZERA TUDO PARA O NOVO DIA
  const handleResetTimer = () => {
    if (!isProfessor) return;
    setSecondsElapsed(0);
    sincronizarCronometroGlobal(false);
    setAguaConsumo(0);
    setCoposContador(0);
    setMamadeirasContador(0);
    setMamadeiraObs('');
    setSonecaDesc('Sem Soneca Ainda');
    setHoraSonecaInicio('');
    setHoraSonecaFim('');
    setFraldaDesc('Nenhuma Troca');
    setHumorEstado('Calmo / Sereno');
    setHumorObs('');
    setNotaGeralSaude('');
    setChecklist({
      trocaRoupas: 'Pendente',
      escovacaoDentes: 'Pendente',
      maosERosto: 'Pendente',
      banhoTomado: 'Pendente',
      pomadaProtetor: 'Pendente',
    });

    const resetObj = (st: StudentPaxData): StudentPaxData => ({
      ...st,
      presenca: {
        ...st.presenca,
        status: 'em_aula',
        titulo: 'Em Sala de Aula',
        descricao: 'Novo dia iniciado.',
        tempoEmAulaFormatado: '00:00:00',
        isTimerRunning: false,
        startTimestamp: null,
      },
      agua: {
        ...st.agua,
        consumoMl: 0,
        coposServidos: 0,
        porcentagemMeta: 0,
      },
      alimentacao: {
        ...st.alimentacao,
        mamadeirasServidas: 0,
        mamadeirasMlTotal: 0,
        refeicoes: [
          { nome: 'Lanchinho da Manhã', status: 'SEM REGISTRO' },
          { nome: 'Papinha / Almocinho', status: 'SEM REGISTRO' },
          { nome: 'Lanchinho da Tarde', status: 'SEM REGISTRO' },
          { nome: 'Jantinha Escolar', status: 'SEM REGISTRO' },
        ],
      },
      humor: {
        estado: 'Calmo / Sereno',
        turno: 'Manhã',
        observacao: '',
      },
      higieneChecklist: {
        trocaRoupas: 'Pendente',
        escovacaoDentes: 'Pendente',
        maosERosto: 'Pendente',
        banhoTomado: 'Pendente',
        pomadaProtetor: 'Pendente',
      },
      saudeCards: {
        soneca: { valor: 'Sem Soneca Ainda', periodo: 'Hoje' },
        fraldas: { valor: 'Nenhuma Troca', periodo: 'Hoje' },
        mamadeiras: { valor: '0 Servidas', periodo: 'Hoje' },
        hidratacao: { valor: '0ml', copos: '(0 copos)', periodo: '0% da meta' },
        temperatura: { valor: '36.5°C', status: 'Afebril' },
        peso: { valor: `${st.saudeCards?.peso?.valor || '14.0 kg'}`, status: 'Adequado' },
        humor: { valor: 'Calmo / Sereno', periodo: 'Início de turno' },
      },
    });

    if (onUpdateAllStudents) {
      onUpdateAllStudents(resetObj);
    } else if (onUpdateStudent) {
      onUpdateStudent(resetObj(student));
    }

    showFeedback('🔄 Cronômetro e Rotina Zerados para o Novo Dia!');
  };

  const handleToggleTimer = () => {
    if (!isProfessor) return;
    const nextState = !timerRunning;
    sincronizarCronometroGlobal(nextState);
    showFeedback(nextState ? '⏱️ Cronômetro ligado!' : '⏸️ Cronômetro pausado.');
  };

  // Mamadeira
  const executarSalvarMamadeira = () => {
    const novoContador = mamadeirasContador + 1;
    const novoTotalMl = (student.alimentacao?.mamadeirasMlTotal || 0) + mamadeiraVolume;
    setMamadeirasContador(novoContador);

    if (onUpdateStudent) {
      onUpdateStudent({
        alimentacao: {
          ...student.alimentacao,
          mamadeirasServidas: novoContador,
          mamadeirasMlTotal: novoTotalMl,
          ultimoVolume: mamadeiraVolume,
          volumeSelecionado: mamadeiraVolume,
        },
        saudeCards: {
          ...student.saudeCards,
          mamadeiras: {
            valor: `${novoContador} Servida(s)`,
            periodo: `${mamadeiraVolume}ml - ${aceitacao}`,
          },
        },
      });
    }

    triggerCardConfirmacao('🍼 Mamadeira Salva', `Mamadeira de ${mamadeiraVolume}ml (${aceitacao}) registrada para ${student.nome}!`);
  };

  const handleSalvarMamadeira = () => {
    if (!validarCronometroAtivo('Registrar Mamadeira', () => executarSalvarMamadeira())) return;
    executarSalvarMamadeira();
  };

  // Água
  const executarAdicionarAgua = () => {
    const novoTotal = aguaConsumo + copoSelecionado;
    const novosCopos = coposContador + 1;
    setAguaConsumo(novoTotal);
    setCoposContador(novosCopos);

    const percent = Math.min(100, Math.round((novoTotal / (student.agua?.metaMl || 800)) * 100));

    if (onUpdateStudent) {
      onUpdateStudent({
        agua: {
          ...student.agua,
          consumoMl: novoTotal,
          coposServidos: novosCopos,
          porcentagemMeta: percent,
        },
        saudeCards: {
          ...student.saudeCards,
          hidratacao: {
            valor: `${novoTotal}ml`,
            copos: `(${novosCopos} copos)`,
            periodo: `${percent}% da meta`,
          },
        },
      });
    }

    triggerCardConfirmacao('💧 Água Registrada', `${student.nome} bebeu +${copoSelecionado}ml de água.`);
  };

  const handleAdicionarAgua = () => {
    if (!validarCronometroAtivo('Oferecer Água', () => executarAdicionarAgua())) return;
    executarAdicionarAgua();
  };

  // Refeições Sólidas
  const executarSalvarRefeicao = (refeicaoNome: string, aceitacaoValor: string) => {
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const defaultRefeicoes = [
      { nome: 'Lanchinho da Manhã', status: 'SEM REGISTRO' },
      { nome: 'Papinha / Almocinho', status: 'SEM REGISTRO' },
      { nome: 'Lanchinho da Tarde', status: 'SEM REGISTRO' },
      { nome: 'Jantinha Escolar', status: 'SEM REGISTRO' },
    ];

    const currentRefeicoes = student.alimentacao?.refeicoes && student.alimentacao.refeicoes.length > 0
      ? student.alimentacao.refeicoes
      : defaultRefeicoes;

    const novasRefeicoes = currentRefeicoes.map((ref) => {
      if (ref.nome === refeicaoNome) {
        return { ...ref, status: aceitacaoValor, horario: horaAtual };
      }
      return ref;
    });

    if (onUpdateStudent) {
      onUpdateStudent({
        alimentacao: {
          ...student.alimentacao,
          refeicoes: novasRefeicoes,
        },
      });
    }

    triggerCardConfirmacao('🍴 Refeição Registrada', `${refeicaoNome} (${aceitacaoValor}) salvo!`);
  };

  const handleSalvarRefeicaoDireta = (refeicaoNome: string, aceitacaoValor: string) => {
    if (!validarCronometroAtivo(`Refeição (${refeicaoNome})`, () => executarSalvarRefeicao(refeicaoNome, aceitacaoValor))) return;
    executarSalvarRefeicao(refeicaoNome, aceitacaoValor);
  };

  // Soneca (Reloginho + Manual + Duração Rápida)
  const executarSoneca = (desc: string, hFim: string) => {
    const hInicio = horaSonecaInicio || '12:30';
    setSonecaDesc(desc);
    setHoraSonecaFim(hFim);

    if (sonecaEscopo === 'coletiva' && onUpdateAllStudents) {
      onUpdateAllStudents((st) => ({
        ...st,
        saudeCards: {
          ...st.saudeCards,
          soneca: { valor: desc, periodo: hInicio && hFim ? `${hInicio} às ${hFim}` : 'Hoje' },
        },
      }));
      triggerCardConfirmacao('💤 Soneca Coletiva Salva', `Soneca registrada para toda a turma: ${desc}`);
    } else {
      if (onUpdateStudent) {
        onUpdateStudent({
          saudeCards: {
            ...student.saudeCards,
            soneca: { valor: desc, periodo: hInicio && hFim ? `${hInicio} às ${hFim}` : 'Hoje' },
          },
        });
      }
      triggerCardConfirmacao('💤 Soneca Salva', desc);
    }
  };

  const handleToqueRapidoSoneca = (duracao: string) => {
    const hInicio = horaSonecaInicio || '12:30';
    let hFim = horaSonecaFim || '14:00';
    let desc = `Dormiu das ${hInicio} às ${hFim}`;

    if (duracao === '30m') {
      hFim = calcHoraFimSoneca(hInicio, 30);
      desc = `Dormiu 30 min (${hInicio} às ${hFim})`;
    } else if (duracao === '1h') {
      hFim = calcHoraFimSoneca(hInicio, 60);
      desc = `Dormiu 1 hora (${hInicio} às ${hFim})`;
    } else if (duracao === '1h30') {
      hFim = calcHoraFimSoneca(hInicio, 90);
      desc = `Dormiu 1h30 (${hInicio} às ${hFim})`;
    } else if (duracao === '2h') {
      hFim = calcHoraFimSoneca(hInicio, 120);
      desc = `Dormiu 2 horas (${hInicio} às ${hFim})`;
    } else if (duracao === 'nao_dormiu') {
      desc = 'Não dormiu no período';
      hFim = '';
    }

    if (!validarCronometroAtivo('Registrar Soneca', () => executarSoneca(desc, hFim))) return;
    executarSoneca(desc, hFim);
  };

  const handleAlterarHoraSonecaInicio = (novoInicio: string) => {
    if (!novoInicio) return;
    setHoraSonecaInicio(novoInicio);
    const novoFim = calcHoraFimSoneca(novoInicio, 90);
    setHoraSonecaFim(novoFim);
    const novoPeriodo = `${novoInicio} às ${novoFim}`;
    const descAtualizada = `Dormiu das ${novoInicio} às ${novoFim}`;
    setSonecaDesc(descAtualizada);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          soneca: { valor: descAtualizada, periodo: novoPeriodo },
        },
      });
    }
  };

  const handleSalvarSonecaManual = () => {
    const hInicio = horaSonecaInicio || '12:30';
    const hFim = horaSonecaFim || '14:00';
    const desc = sonecaDesc.trim() || `Dormiu das ${hInicio} às ${hFim}`;
    if (!validarCronometroAtivo('Salvar Soneca Manual', () => executarSoneca(desc, hFim))) return;
    executarSoneca(desc, hFim);
  };

  // Febre
  const executarFebre = (temp: string) => {
    setTemperatura(temp);
    const cleanTemp = `${temp}°C`;

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          temperatura: { valor: cleanTemp, status: parseFloat(temp) >= 37.8 ? 'Alerta Febril' : 'Afebril' },
        },
      });
    }

    triggerCardConfirmacao('🩺 Temperatura Salva', `Aferição: ${cleanTemp}`);
  };

  const handleToqueRapidoFebre = (temp: string) => {
    if (!validarCronometroAtivo('Aferição de Febre', () => executarFebre(temp))) return;
    executarFebre(temp);
  };

  // Fralda (5 Botões Rápidos + Microfone de Voz)
  const executarFralda = (tipo: string) => {
    let novaFralda = fraldaDesc;
    if (tipo === 'xixi') novaFralda = 'Apenas Xixi';
    else if (tipo === 'coco') novaFralda = 'Apenas Cocô';
    else if (tipo === 'xixi_coco') novaFralda = 'Xixi e Cocô';
    else if (tipo === 'pomada') novaFralda = fraldaDesc.includes('Pomada') ? fraldaDesc : `${fraldaDesc ? `${fraldaDesc} + ` : ''}Pomada Aplicada`;
    else if (tipo === 'seca') novaFralda = 'Seca / Limpa';

    setFraldaDesc(novaFralda);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          fraldas: { valor: novaFralda, periodo: 'Hoje' },
        },
      });
    }

    triggerCardConfirmacao('🧷 Fralda Salva', novaFralda);
  };

  const handleToqueRapidoFralda = (tipo: string) => {
    if (!validarCronometroAtivo('Troca de Fralda', () => executarFralda(tipo))) return;
    executarFralda(tipo);
  };

  // Peso Corporal
  const handleSalvarPesoDireto = (valorDigitado: string) => {
    if (!isProfessor) return;
    const pesoNumerico = valorDigitado.replace(/kg/i, '').replace('º', '').trim();
    setPeso(pesoNumerico || '14.0');
    const cleanPeso = `${pesoNumerico || '14.0'} kg`;

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          peso: { valor: cleanPeso, status: 'Adequado' },
        },
      });
    }

    triggerCardConfirmacao('⚖️ Peso Atualizado', `Peso corporal: ${cleanPeso}`);
  };

  // Humor
  const executarHumor = (estado: string) => {
    setHumorEstado(estado);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          humor: { valor: estado, periodo: 'Hoje' },
        },
      });
    }

    triggerCardConfirmacao('😊 Humor Salvo', estado);
  };

  const handleSalvarHumorDireto = (estado: string) => {
    if (!validarCronometroAtivo('Registro de Humor', () => executarHumor(estado))) return;
    executarHumor(estado);
  };

  // Higiene (5 Itens)
  const executarHigiene = (key: string, label: string) => {
    const statusAtual = checklist[key as keyof typeof checklist] || 'Pendente';
    const nextState = statusAtual === 'Realizado' ? 'Pendente' : 'Realizado';
    const novoChecklist = { ...checklist, [key]: nextState };
    setChecklist(novoChecklist);

    if (onUpdateStudent) {
      onUpdateStudent({ higieneChecklist: novoChecklist });
    }

    triggerCardConfirmacao(nextState === 'Realizado' ? `✨ ${label} Marcado` : `🔄 ${label} Removido`, label);
  };

  const handleToggleHigieneDireto = (key: string, label: string) => {
    if (!validarCronometroAtivo(`Cuidado (${label})`, () => executarHigiene(key, label))) return;
    executarHigiene(key, label);
  };

  // Salvar Situação Completa de Saúde
  const handleSalvarSituacaoSaude = () => {
    if (!validarCronometroAtivo('Consolidação de Saúde', () => {
      if (onUpdateStudent) {
        onUpdateStudent({
          saudeCards: {
            ...student.saudeCards,
            soneca: { valor: sonecaDesc, periodo: horaSonecaInicio && horaSonecaFim ? `${horaSonecaInicio} às ${horaSonecaFim}` : 'Hoje' },
            fraldas: { valor: fraldaDesc, periodo: 'Hoje' },
            temperatura: { valor: `${temperatura}°C`, status: parseFloat(temperatura) >= 37.8 ? 'Alerta Febril' : 'Afebril' },
            peso: { valor: `${peso} kg`, status: 'Adequado' },
          },
        });
      }
      triggerCardConfirmacao('🩺 Situação de Saúde Salva', 'Todos os cuidados de saúde foram atualizados!');
    })) return;

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          soneca: { valor: sonecaDesc, periodo: horaSonecaInicio && horaSonecaFim ? `${horaSonecaInicio} às ${horaSonecaFim}` : 'Hoje' },
          fraldas: { valor: fraldaDesc, periodo: 'Hoje' },
          temperatura: { valor: `${temperatura}°C`, status: parseFloat(temperatura) >= 37.8 ? 'Alerta Febril' : 'Afebril' },
          peso: { valor: `${peso} kg`, status: 'Adequado' },
        },
      });
    }
    triggerCardConfirmacao('🩺 Situação de Saúde Salva', 'Todos os cuidados de saúde foram atualizados!');
  };

  const percentAgua = Math.min(100, Math.round((aguaConsumo / (student.agua?.metaMl || 800)) * 100));

  return (
    <div className="space-y-6 relative">
      {/* CARD FLUTUANTE */}
      {cardConfirmacao && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              REGISTRO SINCRONIZADO COM OS PAIS
            </span>
            <h5 className="text-sm font-black text-white mt-0.5">{cardConfirmacao.titulo}</h5>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{cardConfirmacao.mensagem}</p>
          </div>
        </div>
      )}

      {/* FEEDBACK TOAST */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 1. SEÇÃO DO CRONÔMETRO */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              CLASSE E PRESENÇA DO ALUNO
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              {timerRunning ? `Em Aula — ${student.nome}` : `Aula Pausada (${student.nome})`}
            </h3>
          </div>

          <span
            className={`text-xs font-black px-3 py-1 rounded-full ${
              timerRunning ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {timerRunning ? '● EM AULA (AO VIVO)' : '⏸️ CRONÔMETRO DESLIGADO'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 flex items-center justify-between sm:justify-start gap-4 shadow-inner">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                {timerRunning ? 'TEMPO DE AULA EM ANDAMENTO' : 'TEMPO EM AULA COMPUTADO'}
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-emerald-400">
                {formatTimer(secondsElapsed)}
              </span>
            </div>
            {isProfessor && (
              <button
                type="button"
                onClick={handleResetTimer}
                title="Zerar cronômetro e limpar rotina para novo dia"
                className="text-[10px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/50 hover:bg-rose-950 px-2 py-1 rounded-lg transition border border-rose-800/40 cursor-pointer"
              >
                Zerar Dia
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isProfessor && (
              <>
                {!timerRunning ? (
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play size={13} className="fill-white" />
                    <span>Ligar Cronômetro</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModalConfirmarColetivo(true)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-rose-900 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Clock size={13} className="text-amber-400" />
                    <span>Desligar Coletivo (Encerrar Aulas)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    timerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {timerRunning ? <Pause size={13} /> : <Play size={13} />}
                  <span>{timerRunning ? 'Pausar' : 'Continuar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowModalRelatorio(true)}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>Boletim WhatsApp</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAMADEIRA & ÁGUA */}
      <div id="secao-alimentacao" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
        {/* MAMADEIRA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍼</span>
              <h4 className="text-base font-black text-slate-800">Mamadeira</h4>
            </div>
            <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full">
              {mamadeirasContador} mamadeira{mamadeirasContador === 1 ? '' : 's'} hoje
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">MAMADEIRA</label>
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 flex items-center gap-2">
                <span className="text-base">🍼</span>
                <span>Mamadeira</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">ACEITAÇÃO</label>
              {isProfessor ? (
                <select
                  value={aceitacao}
                  onChange={(e) => setAceitacao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Tomou Tudo">Tomou Tudo</option>
                  <option value="Pouco">Pouco</option>
                  <option value="Recusou">Recusou</option>
                </select>
              ) : (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
                  {aceitacao}
                </div>
              )}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Volume da Mamadeira:</span>
              <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {mamadeiraVolume} ml
              </span>
            </div>
            {isProfessor && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {[60, 90, 120, 150, 180, 210, 240, 300].map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => handleSelectMamadeiraVolume(vol)}
                    className={`py-1.5 text-xs font-black rounded-lg border transition cursor-pointer ${
                      mamadeiraVolume === vol
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {vol}ml
                  </button>
                ))}
              </div>
            )}
          </div>

          {isProfessor && (
            <button
              type="button"
              onClick={handleSalvarMamadeira}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Registrar Mamadeira ({mamadeiraVolume} ml)</span>
            </button>
          )}
        </div>

        {/* HIDRATAÇÃO ÁGUA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💧</span>
                <h4 className="text-base font-black text-slate-800">Hidratação Rápida (Água)</h4>
              </div>
              <span className="text-xs font-black text-sky-800 bg-sky-100 px-2.5 py-1 rounded-full">
                {aguaConsumo} ml / {percentAgua}%
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Escolha a quantidade de água servida em mL para {student.nome}.
            </p>

            {isProfessor && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3">
                {[50, 100, 150, 200, 250, 300].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => setCopoSelecionado(ml)}
                    className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                      copoSelecionado === ml
                        ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ml}ml
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 mt-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">JARRINHA DIÁRIA</span>
                <p className="text-xl font-black text-sky-900">{aguaConsumo} ml ingeridos</p>
                <p className="text-xs text-sky-700 mt-0.5">Meta: {student.agua?.metaMl || 800} ml ({coposContador} copos)</p>
              </div>
              <div className="w-16 h-20 relative flex items-end justify-center bg-white border-2 border-sky-300 rounded-b-xl overflow-hidden shadow-2xs">
                <div
                  className="w-full bg-sky-400 transition-all duration-500"
                  style={{ height: `${percentAgua}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">
                  {percentAgua}%
                </span>
              </div>
            </div>
          </div>

          {isProfessor && (
            <button
              type="button"
              onClick={handleAdicionarAgua}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Droplet size={16} />
              <span>Oferecer Copo (+{copoSelecionado}ml) — Jarrinha Sobe!</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. REFEIÇÕES & SAÚDE */}
      <div id="secao-refeicoes" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
        {/* REFEIÇÕES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍛</span>
              <h4 className="text-base font-black text-slate-800">Cardápio & Refeições Rápidas</h4>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              1-Clique
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { nome: 'Lanchinho da Manhã', ícone: '🍎' },
              { nome: 'Papinha / Almocinho', ícone: '🍛' },
              { nome: 'Lanchinho da Tarde', ícone: '🍌' },
              { nome: 'Jantinha Escolar', ícone: '🍲' }
            ].map((item) => {
              const refeicaoDoAluno = (student.alimentacao?.refeicoes || []).find(r => r.nome === item.nome);
              const statusAtual = refeicaoDoAluno?.status || 'SEM REGISTRO';
              
              return (
                <div key={item.nome} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.ícone}</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">{item.nome}</span>
                      <span className="text-[10px] font-medium text-slate-500 block">
                        Status: <strong className={statusAtual !== 'SEM REGISTRO' ? 'text-emerald-600 font-black' : 'text-slate-400'}>{statusAtual}</strong>
                      </span>
                    </div>
                  </div>
                  
                  {isProfessor && (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSalvarRefeicaoDireta(item.nome, 'Comeu Tudo')}
                        className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition ${
                          statusAtual === 'Comeu Tudo' ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                        }`}
                      >
                        ✓ Comeu Tudo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSalvarRefeicaoDireta(item.nome, 'Aceitou Bem')}
                        className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition ${
                          statusAtual === 'Aceitou Bem' ? 'bg-sky-600 text-white' : 'bg-sky-500 text-white'
                        }`}
                      >
                        Aceitou Bem
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSalvarRefeicaoDireta(item.nome, 'Rejeitou')}
                        className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition ${
                          statusAtual === 'Rejeitou' ? 'bg-rose-700 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        ✕ Rejeitou
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SAÚDE, SONO, FRALDA & CUIDADOS (COMPLETO E RESTAURADO) */}
        <div id="secao-saude" className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">🩺</span>
            <h4 className="text-base font-black text-slate-800">
              Saúde, Sono, Fralda & Cuidados do Aluno
            </h4>
          </div>

          {/* ESTADO DE HUMOR */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/95 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span>😊</span>
                <span>Estado de Humor do Aluno</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                Humor: <strong className="text-indigo-600 font-extrabold">{humorEstado}</strong>
              </span>
            </div>

            {isProfessor && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { estado: 'Feliz', emoji: '😊' },
                  { estado: 'Calmo / Sereno', emoji: '😌' },
                  { estado: 'Cansado / Sonolento', emoji: '😴' },
                  { estado: 'Choroso / Inquieto', emoji: '😢' },
                ].map((item) => (
                  <button
                    key={item.estado}
                    type="button"
                    onClick={() => handleSalvarHumorDireto(item.estado)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                      humorEstado === item.estado
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102 font-extrabold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-[9px] font-bold tracking-tight block leading-none">
                      {item.estado.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DUAS COLUNAS: SONECA COM RELOGINHO E FRALDA COM MICROFONE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SUB-COLUNA ESQUERDA: SONECA E FEBRE */}
            <div className="space-y-4">
              <div id="secao-soneca" className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-24">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span>💤</span>
                    <span>SONECA / DESCANSO</span>
                  </label>

                  {/* Seletor Individual vs Coletiva */}
                  {isProfessor && (
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSonecaEscopo('individual')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                          sonecaEscopo === 'individual' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        👤 Indiv.
                      </button>
                      <button
                        type="button"
                        onClick={() => setSonecaEscopo('coletiva')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                          sonecaEscopo === 'coletiva' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        👥 Turma
                      </button>
                    </div>
                  )}
                </div>

                {/* ⏰ RELOGINHO DE INÍCIO */}
                {isProfessor && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} className="text-indigo-600" />
                        Início da Soneca:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          handleAlterarHoraSonecaInicio(now);
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
                      >
                        🕒 Agora
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1 shadow-2xs">
                        <Clock size={12} className="text-indigo-600" />
                        <input
                          type="time"
                          value={horaSonecaInicio}
                          onChange={(e) => handleAlterarHoraSonecaInicio(e.target.value)}
                          className="text-xs font-black text-slate-800 outline-none bg-transparent"
                        />
                      </div>

                      {['12:00', '12:30', '13:00', '13:30'].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleAlterarHoraSonecaInicio(h)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                            horaSonecaInicio === h
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* DURAÇÃO RÁPIDA */}
                {isProfessor && (
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[10px] uppercase tracking-wider">
                      DURAÇÃO & 1-CLIQUE:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['30m', '1h', '1h30', '2h', 'nao_dormiu'].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => handleToqueRapidoSoneca(btn)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-indigo-50 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo e Salvar Manual */}
                {isProfessor ? (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      value={sonecaDesc}
                      onChange={(e) => setSonecaDesc(e.target.value)}
                      placeholder="Ex: Dormiu das 12:30 às 14:00"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 text-xs outline-none focus:border-indigo-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleSalvarSonecaManual}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      💾 Salvar Soneca {sonecaEscopo === 'coletiva' ? '(Toda a Turma)' : `(${student.nome})`}
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl font-bold text-slate-800 text-xs border border-slate-200">
                    {sonecaDesc}
                  </div>
                )}
              </div>

              {/* Febre */}
              <div className="pt-1">
                <label className="font-bold text-slate-600 block mb-1 text-[11px] uppercase tracking-wider">
                  FEBRE / TEMP (°C)
                </label>
                {isProfessor ? (
                  <input
                    type="text"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    placeholder="Ex: 36.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 text-xs outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs">
                    {temperatura}°C (Afebril)
                  </div>
                )}

                {isProfessor && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {[
                      { temp: '36.5', label: '36,5°C' },
                      { temp: '37.0', label: '37,0°C' },
                      { temp: '37.5', label: '37,5°C' },
                      { temp: '38.0', label: '38,0°C [!]' },
                    ].map((btn) => (
                      <button
                        key={btn.temp}
                        type="button"
                        onClick={() => handleToqueRapidoFebre(btn.temp)}
                        className={`px-2 py-1 text-[11px] font-black rounded-lg border transition cursor-pointer ${
                          temperatura === btn.temp
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SUB-COLUNA DIREITA: FRALDA COM MICROFONE E PESO */}
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
                    FRALDA (XIXI OU COCO)
                  </label>
                  {/* 🎙️ BOTÃO FALAR: MICROFONE */}
                  {isProfessor && (
                    <button
                      type="button"
                      onClick={() => handleVoiceRecord('fralda')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                        isListeningFralda
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <Mic size={12} />
                      <span>FALAR: 🎙️</span>
                    </button>
                  )}
                </div>

                {isProfessor ? (
                  <input
                    type="text"
                    value={fraldaDesc}
                    onChange={(e) => setFraldaDesc(e.target.value)}
                    placeholder="Ex: Fez Coco / Pomada"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 text-xs outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-xl font-bold text-slate-800 text-xs">{fraldaDesc}</div>
                )}
              </div>

              {/* 🧷 5 BOTÕES DE SELEÇÃO RÁPIDA DE FRALDA / TOALETE */}
              {isProfessor && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-600 block tracking-wider">
                    🧷 SELEÇÃO RÁPIDA DE FRALDA / TOALETE:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToqueRapidoFralda('xixi')}
                      className="p-2 text-left text-xs font-bold bg-white hover:bg-sky-50 text-sky-800 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>💧</span>
                      <span>Apenas Xixi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToqueRapidoFralda('coco')}
                      className="p-2 text-left text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>💩</span>
                      <span>Apenas Coco</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToqueRapidoFralda('xixi_coco')}
                      className="p-2 text-left text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-900 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>💧💩</span>
                      <span>Xixi e Coco</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToqueRapidoFralda('pomada')}
                      className="p-2 text-left text-xs font-bold bg-white hover:bg-purple-50 text-purple-900 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>🧴</span>
                      <span>+ Pomada</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToqueRapidoFralda('seca')}
                    className="w-full p-2 text-left text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs justify-center"
                  >
                    <span>✨</span>
                    <span>Seca / Limpa</span>
                  </button>
                </div>
              )}

              {/* ⚖️ PESO CORPORAL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <span>⚖️</span>
                    <span>PESO CORPORAL (KG)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModalHistoricoPeso(true)}
                    className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100"
                  >
                    <Scale size={11} className="text-indigo-600" />
                    <span>Ver Histórico</span>
                  </button>
                </div>
                {isProfessor ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder="14.0"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-black text-slate-800 text-xs outline-none focus:border-indigo-500 pr-8 shadow-2xs"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                        kg
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const num = Math.max(2, parseFloat(peso.replace(',', '.')) || 14.0);
                        const novo = (num - 0.1).toFixed(1);
                        handleSalvarPesoDireto(novo);
                      }}
                      className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl border border-slate-200 transition cursor-pointer"
                    >
                      -0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseFloat(peso.replace(',', '.')) || 14.0;
                        const novo = (num + 0.1).toFixed(1);
                        handleSalvarPesoDireto(novo);
                      }}
                      className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl border border-slate-200 transition cursor-pointer"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSalvarPesoDireto(peso)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Check size={12} />
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span>{peso} kg</span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Adequado
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✨ CHECKLIST COMPLETO DE HIGIENE (5 ITENS) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
              CHECKLIST DE HIGIENE & CUIDADOS PESSOAIS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { key: 'trocaRoupas', label: 'Troca de Roupas', icon: '👕' },
                { key: 'escovacaoDentes', label: 'Escovação Dentes', icon: '🪥' },
                { key: 'maosERosto', label: 'Mãos e Rosto', icon: '🧼' },
                { key: 'banhoTomado', label: 'Banho Tomado', icon: '🛁' },
                { key: 'pomadaProtetor', label: 'Pomada / Protetor', icon: '🧴' },
              ].map((item) => {
                const status = (checklist as any)[item.key];
                const isOk = status === 'Realizado';
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={!isProfessor}
                    onClick={() => handleToggleHigieneDireto(item.key, item.label)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isOk
                        ? 'bg-emerald-500 border-emerald-600 text-white font-extrabold shadow-2xs scale-102'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    } ${isProfessor ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'}`}
                  >
                    <div>
                      <span className="mr-1.5">{item.icon}</span>
                      <span className="font-bold text-[11px]">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded-md">
                      {isOk ? '✓' : '...'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NOTAS GERAIS DE SAÚDE */}
          <div>
            <label className="font-bold text-slate-600 block mb-1 text-xs">
              NOTAS GERAIS DE SAÚDE / ROTINA DO BEBÊ
            </label>
            {isProfessor ? (
              <input
                type="text"
                value={notaGeralSaude}
                onChange={(e) => setNotaGeralSaude(e.target.value)}
                placeholder="Observações de saúde adicionais..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                "{notaGeralSaude || 'Sem observações especiais hoje.'}"
              </div>
            )}
          </div>

          {isProfessor && (
            <button
              type="button"
              onClick={handleSalvarSituacaoSaude}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Salvar Situação de Saúde & Alertar Pais</span>
            </button>
          )}
        </div>
      </div>

      {/* 🛑 MODAL DE CRONÔMETRO DESLIGADO */}
      {showModalCronometroDesligado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0 border border-amber-200 shadow-2xs">
                ⏱️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Período de Aula Desligado</h3>
                <p className="text-xs font-bold text-amber-700">Cronômetro não está em execução</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2 text-xs text-amber-950 font-medium">
              <p>
                <strong>Regra de Governança Escolar:</strong> Não é permitido realizar lançamentos de rotina ou atividades pedagógicas com o cronômetro desligado.
              </p>
              {acaoPendenteCronometro && (
                <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-slate-800">
                  <span className="text-[10px] font-black uppercase text-amber-800 block">Ação solicitada:</span>
                  <span className="font-black text-xs text-indigo-900">{acaoPendenteCronometro.nome}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Deseja <strong>iniciar o cronômetro agora</strong> para registrar a atividade automaticamente?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModalCronometroDesligado(false);
                  setAcaoPendenteCronometro(null);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLigarCronometroEExecutarPendente}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>▶️ Iniciar Cronômetro & Registrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DE PESO */}
      {showModalHistoricoPeso && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">Histórico Ponderal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModalHistoricoPeso(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600">PESO ATUAL</span>
                <p className="text-2xl font-black text-indigo-950">{peso} kg</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Adequado
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowModalHistoricoPeso(false)}
              className="w-full py-2.5 bg-slate-800 text-white font-black text-xs rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL COLETIVO */}
      <ModalConfirmarEncerramentoColetivo
        isOpen={showModalConfirmarColetivo}
        onClose={() => setShowModalConfirmarColetivo(false)}
        student={student}
        tempoEmAula={formatTimer(secondsElapsed)}
        aguaMl={aguaConsumo}
        mamadeirasContador={mamadeirasContador}
        refeicaoTipo={refeicaoTipo}
        aceitacao={aceitacao}
        humor={humorEstado}
        humorObs={humorObs}
        soneca={sonecaDesc}
        fralda={fraldaDesc}
        temperatura={temperatura}
        checklistCount={Object.values(checklist).filter((v) => v === 'Realizado').length}
        onConfirmar={() => {
          sincronizarCronometroGlobal(false);
          setShowModalConfirmarColetivo(false);
          showFeedback('🎓 Aulas Encerradas!');
        }}
      />

      {/* MODAL WHATSAPP */}
      <ModalRelatorioWhatsApp
        isOpen={showModalRelatorio}
        onClose={() => setShowModalRelatorio(false)}
        student={student}
        tempoEmAula={formatTimer(secondsElapsed)}
        aguaMl={aguaConsumo}
        mamadeirasContador={mamadeirasContador}
        refeicaoTipo={refeicaoTipo}
        aceitacao={aceitacao}
        humor={humorEstado}
        humorObs={humorObs}
        soneca={sonecaDesc}
        fralda={fraldaDesc}
        temperatura={temperatura}
        checklistCount={Object.values(checklist).filter((v) => v === 'Realizado').length}
        onConfirmarEncerramento={() => {
          sincronizarCronometroGlobal(false);
          setShowModalRelatorio(false);
        }}
      />
    </div>
  );
}
