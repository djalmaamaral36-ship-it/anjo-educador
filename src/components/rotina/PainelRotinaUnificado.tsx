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

// Utilitário para calcular término da soneca a partir do início e minutos
const calcHoraFimSoneca = (inicio: string, duracaoMinutos: number): string => {
  if (!inicio || !inicio.includes(':')) return '14:00';
  const [h, m] = inicio.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) return '14:00';
  const totalMin = h * 60 + m + duracaoMinutos;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
};

// Extrai o horário de início da soneca gravado na ficha do aluno
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

// Extrai o término da soneca a partir do período gravado
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

// Extrai o volume da mamadeira em ml
const extractMamadeiraVolume = (student?: StudentPaxData): number => {
  if (!student) return 180;
  if (student.alimentacao?.volumeSelecionado && student.alimentacao.volumeSelecionado > 0) {
    return student.alimentacao.volumeSelecionado;
  }
  if (student.alimentacao?.ultimoVolume && student.alimentacao.ultimoVolume > 0) {
    return student.alimentacao.ultimoVolume;
  }
  const periodo = student.saudeCards?.mamadeiras?.periodo || '';
  const match = periodo.match(/(\d+)\s*ml/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if ((student.alimentacao?.mamadeirasMlTotal || 0) > 0 && (student.alimentacao?.mamadeirasServidas || 0) > 0) {
    const media = Math.round(student.alimentacao.mamadeirasMlTotal / student.alimentacao.mamadeirasServidas);
    if (!isNaN(media) && media > 0) return media;
  }
  return 180;
};

// Sugestões Rápidas de Atividades Pedagógicas Alinhadas à BNCC
export const ATIVIDADES_PREDEFINIDAS = [
  { id: 'historia', titulo: 'Contação de Histórias', icone: '📖', sub: 'Imaginação & Roda', descPadrao: 'Momento afetivo de contação de história com exploração de livros e escuta atenta.' },
  { id: 'musica', titulo: 'Roda de Música & Cantigas', icone: '🎵', sub: 'Ritmo & Expressão', descPadrao: 'Vivência musical com instrumentos sonoros, palmas, cantigas de roda e movimento corporal.' },
  { id: 'artes', titulo: 'Oficina de Artes & Cores', icone: '🎨', sub: 'Pintura & Sensorial', descPadrao: 'Exploração plástica com tintas naturais, texturas, livre expressão visual e sensorial.' },
  { id: 'movimento', titulo: 'Brincadeiras no Parque', icone: '🌳', sub: 'Ar Livre & Psicomotricidade', descPadrao: 'Circuito psicomotor, exploração do espaço externo, corrida e socialização no parque.' },
  { id: 'encaixe', titulo: 'Jogos de Encaixe & Blocos', icone: '🧩', sub: 'Raciocínio & Coordenação', descPadrao: 'Desafio lúdico com blocos lógicos, encaixe e desenvolvimento da coordenação motora fina.' },
  { id: 'natureza', titulo: 'Horta & Contato com a Terra', icone: '🌱', sub: 'Natureza & Investigação', descPadrao: 'Vivência de conexão com o meio ambiente, plantio de mudas e exploração tátil de elementos naturais.' },
  { id: 'personalizada', titulo: 'Outra Atividade Livre', icone: '✨', sub: 'Tema / Projeto Livre', descPadrao: 'Vivência pedagógica especial desenvolvida com a turma.' },
];

export default function PainelRotinaUnificado({
  student,
  userRole,
  onUpdateStudent,
  allStudents,
  onUpdateAllStudents,
}: Props) {
  const isProfessor = userRole === 'professor';

  // --- ESTADOS DO CRONÔMETRO ÚNICO ---
  const [timerRunning, setTimerRunning] = useState(true);
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
          refeicoes: student.alimentacao?.refeicoes || [],
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

  // --- ESTADOS DE ATIVIDADES PEDAGÓGICAS ---
  const [atividadeEscopo, setAtividadeEscopo] = useState<'coletiva' | 'individual'>('coletiva');
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string>('historia');
  const [atividadeTemaCustom, setAtividadeTemaCustom] = useState<string>('');
  const [atividadeObs, setAtividadeObs] = useState<string>('');
  const [atividadeParticipacao, setAtividadeParticipacao] = useState<'muito_participativo' | 'participativo' | 'observador' | 'precisou_apoio'>('muito_participativo');

  // --- CONTROLE DE CRONÔMETRO OBRIGATÓRIO & PREVENÇÃO DE DUPLICIDADE ---
  const [showModalCronometroDesligado, setShowModalCronometroDesligado] = useState(false);
  const [acaoPendenteCronometro, setAcaoPendenteCronometro] = useState<{
    nome: string;
    executar: () => void;
  } | null>(null);

  const [showModalDuplicidade, setShowModalDuplicidade] = useState(false);
  const [duplicidadeInfo, setDuplicidadeInfo] = useState<{
    rotinaNome: string;
    horarioAnterior: string;
    detalhesAnteriores: string;
    novoDetalhe: string;
    onConfirmarSubstituir: () => void;
  } | null>(null);

  // --- CONTROLE PEDIÁTRICO DE INTERVALO DE MAMADEIRA ---
  const [showModalIntervaloMamadeira, setShowModalIntervaloMamadeira] = useState(false);
  const [intervaloMamadeiraInfo, setIntervaloMamadeiraInfo] = useState<{
    horarioUltima: string;
    minutosDesdeUltima: number;
    minutosFaltantes: number;
    novoVolume: number;
    onConfirmarExcecao: () => void;
  } | null>(null);

  // Sincroniza estados ao trocar de aluno
  const lastStudentIdRef = useRef(student.id);
  useEffect(() => {
    if (lastStudentIdRef.current !== student.id) {
      lastStudentIdRef.current = student.id;
      setAguaConsumo(student.agua?.consumoMl || 0);
      setCoposContador(student.agua?.coposServidos || 0);
      setMamadeirasContador(student.alimentacao?.mamadeirasServidas || 0);
      const volSincronizado = extractMamadeiraVolume(student);
      setMamadeiraVolume(volSincronizado);
      setHumorEstado(student.humor?.estado || 'Calmo / Sereno');
      setHumorObs(student.humor?.observacao || '');
      setSonecaDesc(student.saudeCards?.soneca?.valor || 'Sem Soneca Ainda');
      const hInicioCalc = extractHoraInicioFromSoneca(student.saudeCards?.soneca);
      setHoraSonecaInicio(hInicioCalc);
      setHoraSonecaFim(extractHoraFimFromSoneca(student.saudeCards?.soneca, hInicioCalc));
      setFraldaDesc(student.saudeCards?.fraldas?.valor || 'Nenhuma Troca');
      setTemperatura(student.saudeCards?.temperatura?.valor?.replace('°C', '').trim() || '36.5');
      const pesoLimpo = (student.saudeCards?.peso?.valor || '14.0').replace(/kg/i, '').replace('º', '').trim();
      setPeso(pesoLimpo || '14.0');
      setStatusAluno(
        student.presenca.status === 'em_aula'
          ? 'em_aula'
          : student.presenca.status === 'ausente'
          ? 'falta_hoje'
          : student.presenca.status === 'encerrada'
          ? 'saida_antecipada'
          : 'em_aula'
      );
      setAulaFinalizada(student.presenca.status === 'encerrada');
      setChecklist({
        trocaRoupas: student.higieneChecklist?.trocaRoupas || 'Pendente',
        escovacaoDentes: student.higieneChecklist?.escovacaoDentes || 'Pendente',
        maosERosto: student.higieneChecklist?.maosERosto || 'Pendente',
        banhoTomado: student.higieneChecklist?.banhoTomado || 'Pendente',
        pomadaProtetor: student.higieneChecklist?.pomadaProtetor || 'Pendente',
      });
    }
  }, [student.id]);

  // Microfone para Diário do Professor
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

  const formatCleanTemp = (t: string) => {
    const digits = (t || '').replace(/[^\d.,]/g, '').trim();
    return digits ? `${digits}°C` : '36.5°C';
  };

  const formatCleanPeso = (p: string) => {
    const digits = (p || '').replace(/[^\d.,]/g, '').trim();
    return digits ? `${digits} kg` : '14.0 kg';
  };

  const addOrUpdateLinhaTempo = (
    currentList: typeof student.auditoriaLinhaDoTempo = [],
    newItem: {
      id: string;
      hora: string;
      tipo: 'alimentacao' | 'saude' | 'hidratacao' | 'fralda' | 'sono' | 'presenca' | 'pedagogico' | 'higiene' | 'comportamento';
      titulo: string;
      descricao: string;
      responsavel: string;
      verificado: boolean;
    }
  ) => {
    const list = [...(currentList || [])];
    const existingIndex = list.findIndex(
      (item) => item.hora === newItem.hora && (item.tipo === newItem.tipo || item.titulo === newItem.titulo)
    );

    if (existingIndex !== -1) {
      list[existingIndex] = {
        ...list[existingIndex],
        titulo: newItem.titulo,
        descricao: newItem.descricao,
        hora: newItem.hora,
        responsavel: newItem.responsavel,
      };
      return list;
    }

    return [newItem, ...list];
  };

  const validarCronometroAtivo = (acaoNome: string, executarAcao: () => void): boolean => {
    if (!isProfessor) return false;
    if (!timerRunning || statusAluno !== 'em_aula') {
      setAcaoPendenteCronometro({ nome: acaoNome, executar: executarAcao });
      setShowModalCronometroDesligado(true);
      return false;
    }
    return true;
  };

  const handleLigarCronometroEExecutarPendente = () => {
    setTimerRunning(true);
    if (onUpdateStudent) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          isTimerRunning: true,
          status: 'em_aula',
        },
      });
    }
    setShowModalCronometroDesligado(false);
    showFeedback('⏱️ Cronômetro iniciado! Executando lançamento da rotina...');
    if (acaoPendenteCronometro) {
      const fn = acaoPendenteCronometro.executar;
      setTimeout(() => {
        fn();
        setAcaoPendenteCronometro(null);
      }, 50);
    }
  };

  const verificarDuplicidadeRotina = (params: {
    rotinaNome: string;
    horarioAnterior: string;
    detalhesAnteriores: string;
    novoDetalhe: string;
    onConfirmarSubstituir: () => void;
  }) => {
    setDuplicidadeInfo(params);
    setShowModalDuplicidade(true);
  };

  const calcularMinutosPassados = (horaStr: string): number => {
    if (!horaStr || !horaStr.includes(':')) return 999;
    const parts = horaStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 999;

    const agora = new Date();
    const dataAlvo = new Date();
    dataAlvo.setHours(h, m, 0, 0);

    const diffMs = agora.getTime() - dataAlvo.getTime();
    const diffMin = Math.round(diffMs / (1000 * 60));
    return diffMin >= 0 ? diffMin : 999;
  };

  const obterUltimaMamadeira = () => {
    if (student.auditoriaLinhaDoTempo && student.auditoriaLinhaDoTempo.length > 0) {
      const itemMamadeira = student.auditoriaLinhaDoTempo.find((it) => {
        const tit = it.titulo?.toLowerCase() || '';
        const desc = it.descricao?.toLowerCase() || '';
        return (
          it.tipo === 'alimentacao' &&
          (tit.includes('mamadeira') ||
            tit.includes('leite') ||
            tit.includes('fórmula') ||
            desc.includes('mamadeira') ||
            desc.includes('leite') ||
            desc.includes('fórmula'))
        );
      });
      if (itemMamadeira && itemMamadeira.hora) {
        return {
          hora: itemMamadeira.hora,
          descricao: itemMamadeira.descricao,
        };
      }
    }

    if (mamadeirasContador > 0 && student.saudeCards?.mamadeiras?.periodo) {
      return {
        hora: 'Horário anterior',
        descricao: student.saudeCards.mamadeiras.periodo,
      };
    }

    return null;
  };

  // Salvar Soneca
  const executarSalvarSoneca = (desc: string, hFim: string, escopo: 'individual' | 'coletiva') => {
    setSonecaDesc(desc);
    setHoraSonecaFim(hFim);

    const hInicio = horaSonecaInicio || '12:30';
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (escopo === 'coletiva' && onUpdateAllStudents) {
      onUpdateAllStudents((st) => {
        const itemColetivo = {
          id: `audit_soneca_${st.id}_${Date.now()}`,
          hora: horaAtual,
          tipo: 'sono' as const,
          titulo: 'Soneca Coletiva da Turma',
          descricao: `${st.nome}: ${desc}.`,
          responsavel: st.professoraTitular || 'Ana Silva (Professora Titular)',
          verificado: true,
        };
        return {
          ...st,
          saudeCards: {
            ...st.saudeCards,
            soneca: {
              valor: desc,
              periodo: hInicio && hFim ? `${hInicio} às ${hFim}` : 'Hoje',
            },
          },
          auditoriaLinhaDoTempo: addOrUpdateLinhaTempo(st.auditoriaLinhaDoTempo, itemColetivo),
        };
      });

      triggerCardConfirmacao(
        '💤 Soneca Coletiva Registrada!',
        `Soneca registrada para TODOS os ${allStudents?.length || 6} alunos da turma (${student.turma}): "${desc}".`,
        'sono'
      );
    } else {
      const novoItem = {
        id: `audit_soneca_${Date.now()}`,
        hora: horaAtual,
        tipo: 'sono' as const,
        titulo: 'Soneca / Repouso Diário',
        descricao: `${student.nome}: ${desc}.`,
        responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
        verificado: true,
      };

      const novosCards = {
        ...student.saudeCards,
        soneca: {
          valor: desc,
          periodo: hInicio && hFim ? `${hInicio} às ${hFim}` : 'Hoje',
        },
      };

      const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

      if (onUpdateStudent) {
        onUpdateStudent({
          saudeCards: novosCards,
          auditoriaLinhaDoTempo: novaLinhaTempo,
        });
      }

      triggerCardConfirmacao(
        '💤 Soneca Individual Registrada',
        `O registro de sono de ${student.nome} ("${desc}") foi gravado na Linha do Tempo e transmitido aos pais!`,
        'sono'
      );
    }
  };

  const handleToqueRapidoSoneca = (duracao: string, escopoParam?: 'individual' | 'coletiva') => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Soneca / Repouso', () => handleToqueRapidoSoneca(duracao, escopoParam))) {
      return;
    }

    const escopo = escopoParam || sonecaEscopo;
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
      desc = 'Não dormiu no período (ficou acordado e calmo)';
      hFim = '';
    }

    if (sonecaDesc && sonecaDesc !== 'Sem Soneca Ainda' && sonecaDesc !== desc) {
      verificarDuplicidadeRotina({
        rotinaNome: 'Soneca / Repouso Diário',
        horarioAnterior: horaSonecaInicio && horaSonecaFim ? `${horaSonecaInicio} às ${horaSonecaFim}` : 'Hoje',
        detalhesAnteriores: sonecaDesc,
        novoDetalhe: desc,
        onConfirmarSubstituir: () => executarSalvarSoneca(desc, hFim, escopo),
      });
      return;
    }

    executarSalvarSoneca(desc, hFim, escopo);
  };

  const handleSalvarSonecaManual = () => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Soneca / Repouso Manual', () => handleSalvarSonecaManual())) {
      return;
    }

    const hInicio = horaSonecaInicio || '12:30';
    const hFim = horaSonecaFim || '14:00';
    const desc = sonecaDesc.trim() || `Dormiu das ${hInicio} às ${hFim}`;

    if (
      student.saudeCards?.soneca?.valor &&
      student.saudeCards.soneca.valor !== 'Sem Soneca Ainda' &&
      student.saudeCards.soneca.valor !== desc
    ) {
      verificarDuplicidadeRotina({
        rotinaNome: 'Soneca / Repouso Diário',
        horarioAnterior: student.saudeCards.soneca.periodo || 'Hoje',
        detalhesAnteriores: student.saudeCards.soneca.valor,
        novoDetalhe: desc,
        onConfirmarSubstituir: () => executarSalvarSoneca(desc, hFim, sonecaEscopo),
      });
      return;
    }

    executarSalvarSoneca(desc, hFim, sonecaEscopo);
  };

  const handleAlterarHoraSonecaInicio = (novoInicio: string) => {
    if (!novoInicio) return;
    setHoraSonecaInicio(novoInicio);
    const novoFim = calcHoraFimSoneca(novoInicio, 90);
    setHoraSonecaFim(novoFim);

    const novoPeriodo = `${novoInicio} às ${novoFim}`;
    let descAtualizada = sonecaDesc;
    if (!descAtualizada || descAtualizada === 'Sem Soneca Ainda' || descAtualizada === 'Sem registros') {
      descAtualizada = `Dormiu das ${novoInicio} às ${novoFim}`;
    } else if (descAtualizada.includes('às')) {
      descAtualizada = descAtualizada.replace(/\d{1,2}:\d{2}\s*às\s*\d{1,2}:\d{2}/, novoPeriodo);
    } else if (descAtualizada.includes('(') && descAtualizada.includes(')')) {
      descAtualizada = descAtualizada.replace(/\(\d{1,2}:\d{2}.*?\)/, `(${novoPeriodo})`);
    } else {
      descAtualizada = `${descAtualizada} (${novoPeriodo})`;
    }

    setSonecaDesc(descAtualizada);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          soneca: {
            valor: descAtualizada,
            periodo: novoPeriodo,
          },
        },
      });
    }

    triggerCardConfirmacao(
      '⏰ Início da Soneca Definido',
      `Início da soneca de ${student.nome} atualizado para ${novoInicio} (término previsto: ${novoFim}).`,
      'sono'
    );
  };

  // Peso Corporal
  const handleSalvarPesoDireto = (valorDigitado: string) => {
    if (!isProfessor) return;
    const cleanPeso = formatCleanPeso(valorDigitado);
    const pesoNumerico = valorDigitado.replace(/kg/i, '').replace('º', '').trim();
    setPeso(pesoNumerico || '14.0');

    const novosCards = {
      ...student.saudeCards,
      peso: {
        valor: cleanPeso,
        status: 'Adequado',
      },
    };

    const novoItem = {
      id: `audit_peso_${Date.now()}`,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tipo: 'saude' as const,
      titulo: `Aferição de Peso Corporal (${cleanPeso})`,
      descricao: `Peso corporal de ${student.nome} registrado em ${cleanPeso}.`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      '⚖️ Peso Atualizado',
      `Peso corporal de ${student.nome} registrado em ${cleanPeso}.`,
      'saude'
    );
  };

  // Febre / Temperatura
  const executarToqueRapidoFebre = (temp: string) => {
    setTemperatura(temp);
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const isFebre = parseFloat(temp) >= 37.8;
    const cleanTemp = formatCleanTemp(temp);

    const novoItem = {
      id: `audit_temp_${Date.now()}`,
      hora: horaAtual,
      tipo: 'saude' as const,
      titulo: `Aferição de Temperatura Corporal (${cleanTemp})`,
      descricao: `${student.nome} teve temperatura aferida em ${cleanTemp} (${isFebre ? '⚠️ Estado febril observado' : 'Afebril e estável'}).`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      temperatura: {
        valor: cleanTemp,
        status: isFebre ? 'Alerta Febril' : 'Afebril',
      },
    };

    const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      '🩺 Febre & Temperatura Aferida',
      `Aferição de ${cleanTemp} de ${student.nome} registrada e transmitida em tempo real ao painel dos pais!`,
      'temperatura'
    );
  };

  const handleToqueRapidoFebre = (temp: string) => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Aferição de Temperatura', () => handleToqueRapidoFebre(temp))) {
      return;
    }
    executarToqueRapidoFebre(temp);
  };

  // Fralda
  const executarToqueRapidoFralda = (tipo: string) => {
    let novaFralda = fraldaDesc;
    if (tipo === 'xixi') novaFralda = 'Apenas Xixi';
    else if (tipo === 'coco') novaFralda = 'Apenas Cocô';
    else if (tipo === 'xixi_coco') novaFralda = 'Xixi e Cocô';
    else if (tipo === 'pomada') novaFralda = fraldaDesc.includes('Pomada') ? fraldaDesc : `${fraldaDesc ? `${fraldaDesc} + ` : ''}Pomada Aplicada`;
    else if (tipo === 'seca') novaFralda = 'Seca / Limpa';

    setFraldaDesc(novaFralda);
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoItem = {
      id: `audit_fralda_${Date.now()}`,
      hora: horaAtual,
      tipo: 'higiene' as const,
      titulo: 'Troca de Fralda & Higiene do Bebê',
      descricao: `${student.nome}: ${novaFralda}. Higiene completa realizada.`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      fraldas: {
        valor: novaFralda,
        periodo: 'Hoje',
      },
    };

    const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      '🧷 Troca de Fralda & Higiene Registrada',
      `Cuidado de fralda ("${novaFralda}") para ${student.nome} registrado e enviado ao painel de tranquilidade dos pais!`,
      'fralda'
    );
  };

  const handleToqueRapidoFralda = (tipo: string) => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Troca de Fralda & Higiene', () => handleToqueRapidoFralda(tipo))) {
      return;
    }
    executarToqueRapidoFralda(tipo);
  };

  // Humor
  const handleSalvarHumorDireto = (estado: string) => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Estado de Humor', () => handleSalvarHumorDireto(estado))) {
      return;
    }
    
    const obsPorEstado: Record<string, string> = {
      'Feliz': 'Demonstrou-se feliz, participativo e muito dócil.',
      'Calmo / Sereno': 'Muito tranquilo, sereno e concentrado.',
      'Cansado / Sonolento': 'Demonstrou leve cansaço ou sonolência.',
      'Choroso / Inquieto': 'Demonstrou inquietação ou choro pontual.'
    };
    
    const obs = obsPorEstado[estado] || 'Observação registrada com carinho.';
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoItem = {
      id: `audit_humor_${Date.now()}`,
      hora: horaAtual,
      tipo: 'comportamento' as const,
      titulo: `Estado de Humor & Desenvolvimento: ${estado}`,
      descricao: `${student.nome} demonstrou estado: ${estado}. Observação: ${obs}`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      humor: {
        valor: estado,
        periodo: obs,
      },
    };

    const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    setHumorEstado(estado);
    setHumorObs(obs);

    triggerCardConfirmacao(
      '😊 Registros de Humor Salvos',
      `Estado de humor (${estado}) de ${student.nome} salvo e transmitido instantaneamente ao painel dos pais!`,
      'humor'
    );
  };

  // Refeições Sólidas
  const [justificandoRefeicao, setJustificandoRefeicao] = useState<string | null>(null);
  const [justificativaTexto, setJustificativaTexto] = useState<string>('');

  const handleSalvarRefeicaoDireta = (refeicaoNome: string, aceitacaoValor: string, observacaoPersonalizada?: string) => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo(`Alimentação (${refeicaoNome})`, () => handleSalvarRefeicaoDireta(refeicaoNome, aceitacaoValor, observacaoPersonalizada))) {
      return;
    }

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const defaultRefeicoes = [
      { nome: 'Lanchinho da Manhã', status: 'SEM REGISTRO' },
      { nome: 'Papinha / Almocinho', status: 'SEM REGISTRO' },
      { nome: 'Lanchinho da Tarde', status: 'SEM REGISTRO' },
      { nome: 'Jantinha Escolar', status: 'SEM REGISTRO' },
    ];

    const currentRefeicoes =
      student.alimentacao?.refeicoes && student.alimentacao.refeicoes.length > 0
        ? student.alimentacao.refeicoes
        : defaultRefeicoes;

    const novasRefeicoes = currentRefeicoes.map((ref) => {
      if (ref.nome === refeicaoNome) {
        return {
          ...ref,
          status: aceitacaoValor,
          horario: horaAtual,
          observacao: observacaoPersonalizada || (aceitacaoValor === 'Rejeitou' ? 'Alimento recusado pela criança.' : 'Registro de 1 clique efetuado com carinho.'),
        };
      }
      return ref;
    });

    const novoItem = {
      id: `audit_alim_${Date.now()}`,
      hora: horaAtual,
      tipo: 'alimentacao' as const,
      titulo: `Alimentação & Nutrição: ${refeicaoNome}`,
      descricao: `${student.nome} alimentou-se: ${refeicaoNome}. Aceitação: ${aceitacaoValor}.${observacaoPersonalizada ? ` Justificativa: ${observacaoPersonalizada}` : ''}`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const existingList = student.auditoriaLinhaDoTempo || [];
    const filteredList = existingList.filter(item => 
      !item.titulo.toLowerCase().includes(refeicaoNome.toLowerCase())
    );

    const novaLinhaTempo = [novoItem, ...filteredList];

    if (onUpdateStudent) {
      onUpdateStudent({
        alimentacao: {
          ...student.alimentacao,
          refeicoes: novasRefeicoes,
        },
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      '🍴 Refeição Registrada',
      `O registro de ${refeicaoNome} (${aceitacaoValor}) de ${student.nome} foi salvo e enviado aos pais!`,
      'alimentacao'
    );
  };

  // Higiene
  const handleToggleHigieneDireto = (key: string, label: string) => {
    if (!isProfessor) return;
    
    const statusAtual = checklist[key as keyof typeof checklist] || 'Pendente';
    const nextState = statusAtual === 'Realizado' ? 'Pendente' : 'Realizado';
    
    if (nextState === 'Realizado') {
      if (!validarCronometroAtivo(`Cuidado: ${label}`, () => handleToggleHigieneDireto(key, label))) {
        return;
      }
    }

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoChecklist = {
      ...checklist,
      [key]: nextState,
    };
    setChecklist(novoChecklist);

    let novaLinhaTempo = student.auditoriaLinhaDoTempo || [];
    if (nextState === 'Realizado') {
      const novoItem = {
        id: `audit_higiene_${key}_${Date.now()}`,
        hora: horaAtual,
        tipo: 'higiene' as const,
        titulo: `Higiene & Cuidados: ${label}`,
        descricao: `Cuidado de higiene "${label}" realizado com sucesso para ${student.nome}.`,
        responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
        verificado: true,
      };
      
      const filteredList = novaLinhaTempo.filter(item => 
        !item.titulo.toLowerCase().includes(label.toLowerCase())
      );
      novaLinhaTempo = [novoItem, ...filteredList];
    } else {
      novaLinhaTempo = novaLinhaTempo.filter(item => 
        !item.titulo.toLowerCase().includes(label.toLowerCase())
      );
    }

    if (onUpdateStudent) {
      onUpdateStudent({
        higieneChecklist: novoChecklist,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    if (nextState === 'Realizado') {
      triggerCardConfirmacao(
        `✨ ${label} Marcado`,
        `Cuidado de higiene "${label}" de ${student.nome} marcado como realizado e transmitido ao painel dos pais!`,
        'higiene'
      );
    } else {
      triggerCardConfirmacao(
        `🔄 ${label} Removido`,
        `Cuidado de higiene "${label}" de ${student.nome} desfeito e sincronizado no painel dos pais!`,
        'higiene'
      );
    }
  };

  // Consolidação de Saúde
  const handleSalvarSituacaoSaude = () => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Consolidação Geral de Saúde', () => handleSalvarSituacaoSaude())) {
      return;
    }
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const cleanTemp = formatCleanTemp(temperatura);
    const cleanPeso = formatCleanPeso(peso);

    const novoItem = {
      id: `audit_saude_full_${Date.now()}`,
      hora: horaAtual,
      tipo: 'saude' as const,
      titulo: 'Consolidação de Saúde & Rotina do Aluno',
      descricao: `Soneca: ${sonecaDesc || 'Não registrada'}. Fralda: ${fraldaDesc || 'Normal'}. Temp: ${cleanTemp}. Peso: ${cleanPeso}.${notaGeralSaude ? ` Nota de saúde: "${notaGeralSaude}"` : ''}`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      soneca: { valor: sonecaDesc || 'Dormiu bem', periodo: horaSonecaInicio && horaSonecaFim ? `${horaSonecaInicio} às ${horaSonecaFim}` : 'Hoje' },
      fraldas: { valor: fraldaDesc || 'Normal', periodo: 'Hoje' },
      temperatura: { valor: cleanTemp, status: parseFloat(temperatura) >= 37.8 ? 'Alerta Febril' : 'Afebril' },
      peso: { valor: cleanPeso, status: 'Adequado' },
    };

    const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      '🩺 Situação de Saúde & Cuidados Salvos',
      `Todas as informações de saúde, soneca, fralda e peso de ${student.nome} foram consolidadas e transmitidas com sucesso ao painel dos pais!`,
      'saude'
    );
  };

  // Checklist de Higiene
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
  const [showModalOcorrencia, setShowModalOcorrencia] = useState(false);
  const [showModalRelatorio, setShowModalRelatorio] = useState(false);
  const [showModalConfirmarColetivo, setShowModalConfirmarColetivo] = useState(false);
  const [showModalDesligarIndividual, setShowModalDesligarIndividual] = useState(false);
  
  const [statusAluno, setStatusAluno] = useState<'em_aula' | 'saida_antecipada' | 'ausencia_temporaria' | 'falta_hoje'>(
    student.presenca.status === 'em_aula' ? 'em_aula' : (student.presenca.status === 'ausente' ? 'falta_hoje' : 'em_aula')
  );
  const [motivoAusencia, setMotivoAusencia] = useState<string>('');
  const [responsavelRetirada, setResponsavelRetirada] = useState<string>('');
  const [ocorrenciasList, setOcorrenciasList] = useState<OcorrenciaEscolar[]>(student.ocorrenciasHoje || []);
  const [aulaFinalizada, setAulaFinalizada] = useState(student.presenca.status === 'encerrada');

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [cardConfirmacao, setCardConfirmacao] = useState<{
    titulo: string;
    mensagem: string;
    tipo?: string;
  } | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const triggerCardConfirmacao = (titulo: string, mensagem: string, tipo: string = 'geral') => {
    setCardConfirmacao({ titulo, mensagem, tipo });
    setTimeout(() => {
      setCardConfirmacao(null);
    }, 4500);
  };

  // Desligamento Individual
  const handleConfirmarDesligamentoIndividual = (dados: {
    tipo: TipoDesligamento;
    motivo: string;
    responsavelRetirada?: string;
    enviarWhatsApp: boolean;
  }) => {
    setTimerRunning(false);
    setStatusAluno(dados.tipo);
    setMotivoAusencia(dados.motivo);
    if (dados.responsavelRetirada) {
      setResponsavelRetirada(dados.responsavelRetirada);
    }

    if (dados.enviarWhatsApp) {
      const rotulo = dados.tipo === 'saida_antecipada' ? 'Saída Antecipada' : dados.tipo === 'ausencia_temporaria' ? 'Ausência Temporária' : 'Falta / Ausência';
      const msg = `📢 *Aviso Escolar - ${rotulo}*\n` +
        `👶 *Aluno(a):* ${student.nome}\n` +
        `🏫 *Turma:* ${student.turma}\n` +
        `⏱️ *Tempo em Sala:* ${formatTimer(secondsElapsed)}\n` +
        `📝 *Motivo:* ${dados.motivo}\n` +
        (dados.responsavelRetirada ? `👤 *Retirado por:* ${dados.responsavelRetirada}\n` : '') +
        `👩‍🏫 *Professora:* ${student.professoraTitular}`;
      const fone = student.responsavelTelefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    const rotulo = dados.tipo === 'saida_antecipada' ? 'Saída Antecipada' : dados.tipo === 'ausencia_temporaria' ? 'Ausência Temporária' : 'Falta / Ausente';
    showFeedback(`🛑 ${student.nome} desligado individualmente (${rotulo}). Todos os comandos de rotina foram pausados.`);

    if (onUpdateStudent) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          status: dados.tipo === 'saida_antecipada' ? 'encerrada' : 'ausente',
          titulo: rotulo,
          descricao: dados.motivo,
        },
      });
    }
  };

  // Religar Aluno / Iniciar Período
  const handleReligarAluno = () => {
    setStatusAluno('em_aula');
    setTimerRunning(true);
    setSecondsElapsed(0);
    setAguaConsumo(0);
    setCoposContador(0);
    setMamadeirasContador(0);
    setSonecaDesc('Sem Soneca Ainda');
    setHoraSonecaInicio('');
    setHoraSonecaFim('');
    setFraldaDesc('Nenhuma Troca');
    setHumorEstado('Calmo / Sereno');
    setHumorObs('');
    setNotaGeralSaude('');
    setMotivoAusencia('');
    setAulaFinalizada(false);
    setChecklist({
      trocaRoupas: 'Pendente',
      escovacaoDentes: 'Pendente',
      maosERosto: 'Pendente',
      banhoTomado: 'Pendente',
      pomadaProtetor: 'Pendente',
    });

    triggerCardConfirmacao(
      '⚡ Cronômetro Religado!',
      `O cronômetro de aula foi iniciado para a turma.`,
      'religar'
    );
  };

  const handleAddOcorrencia = (nova: OcorrenciaEscolar) => {
    setOcorrenciasList((prev) => [nova, ...prev]);
    showFeedback(`⚠️ Ocorrência "${nova.tipoLabel}" registrada no histórico.`);
  };

  const handleEncerrarAulaConfirmado = () => {
    handleConfirmarEncerramentoColetivo({ enviarWhatsApp: true, publicarMural: true });
  };

  // Encerramento Coletivo
  const handleConfirmarEncerramentoColetivo = (opcoes: { enviarWhatsApp: boolean; publicarMural: boolean }) => {
    setTimerRunning(false);
    setAulaFinalizada(true);

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const tempoEmAula = formatTimer(secondsElapsed);

    if (onUpdateStudent) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          status: 'encerrada',
          titulo: 'Aula Encerrada no Período',
          descricao: 'As atividades escolares de hoje foram concluídas e o relatório foi registrado no sistema.',
        },
      });
    }

    triggerCardConfirmacao(
      '🎓 Aulas Encerradas!',
      `Relatório consolidado das atividades do dia pronto para envio.`,
      'encerramento'
    );
  };

  // Cronômetro Handlers
  const handleToggleTimer = () => {
    if (!isProfessor) return;
    const nextState = !timerRunning;
    setTimerRunning(nextState);
    showFeedback(nextState ? '⏱️ Cronômetro de aula ligado!' : '⏸️ Cronômetro pausado.');
  };

  const handleResetTimer = () => {
    if (!isProfessor) return;
    setTimerRunning(false);
    setSecondsElapsed(0);
    showFeedback('🔄 Cronômetro zerado com sucesso!');
  };

  // Mamadeira Execução (SEPARADA DE ÁGUA)
  const executarSalvarMamadeira = (isSubstituicao: boolean = false) => {
    const isMamadeira =
      refeicaoTipo.toLowerCase().includes('mamadeira') ||
      refeicaoTipo.toLowerCase().includes('leite') ||
      refeicaoTipo.toLowerCase().includes('fórmula');

    const novoContador = isMamadeira ? (isSubstituicao ? mamadeirasContador : mamadeirasContador + 1) : mamadeirasContador;
    const novoVolumeMl = isMamadeira
      ? (student.alimentacao?.mamadeirasMlTotal || 0) + (isSubstituicao ? 0 : mamadeiraVolume)
      : (student.alimentacao?.mamadeirasMlTotal || 0);

    if (isMamadeira) {
      setMamadeirasContador(novoContador);
    }

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const defaultRefeicoes = [
      { nome: 'Lanchinho da Manhã', status: 'SEM REGISTRO' },
      { nome: 'Papinha / Almocinho', status: 'SEM REGISTRO' },
      { nome: 'Lanchinho da Tarde', status: 'SEM REGISTRO' },
      { nome: 'Jantinha Escolar', status: 'SEM REGISTRO' },
    ];

    const currentRefeicoes =
      student.alimentacao?.refeicoes && student.alimentacao.refeicoes.length > 0
        ? student.alimentacao.refeicoes
        : defaultRefeicoes;

    const novasRefeicoes = currentRefeicoes.map((ref) => {
      const refNameNorm = ref.nome.toLowerCase();
      const tipoNorm = refeicaoTipo.toLowerCase();

      if (
        refNameNorm === tipoNorm ||
        (tipoNorm.includes('manhã') && refNameNorm.includes('manhã')) ||
        (tipoNorm.includes('tarde') && refNameNorm.includes('tarde')) ||
        (tipoNorm.includes('papinha') && refNameNorm.includes('papinha')) ||
        (tipoNorm.includes('almocinho') && refNameNorm.includes('almocinho')) ||
        (tipoNorm.includes('frutinha') && (refNameNorm.includes('tarde') || refNameNorm.includes('frutinha'))) ||
        (tipoNorm.includes('jantinha') && refNameNorm.includes('jantinha'))
      ) {
        return {
          ...ref,
          status: aceitacao,
          horario: horaAtual,
          observacao: mamadeiraObs || undefined,
        };
      }
      return ref;
    });

    const novoItem = {
      id: `audit_alim_${Date.now()}`,
      hora: horaAtual,
      tipo: 'alimentacao' as const,
      titulo: `Alimentação & Nutrição: ${refeicaoTipo}`,
      descricao: `${student.nome} alimentou-se: ${refeicaoTipo}${isMamadeira ? ` (${mamadeiraVolume}ml)` : ''}. Aceitação: ${aceitacao}.${mamadeiraObs ? ` Obs: "${mamadeiraObs}"` : ''}`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      mamadeiras: {
        valor: `${novoContador} Servida(s)`,
        periodo: isMamadeira ? `${mamadeiraVolume}ml - ${aceitacao}` : `${refeicaoTipo}: ${aceitacao}`,
      },
    };

    const existingList = student.auditoriaLinhaDoTempo || [];
    const filteredList = existingList.filter(item => 
      !item.titulo.toLowerCase().includes(refeicaoTipo.toLowerCase()) &&
      !refeicaoTipo.toLowerCase().includes(item.titulo.replace(/Alimentação & Nutrição: |Atividade Pedagógica: /g, '').toLowerCase())
    );

    const novaLinhaTempo = [novoItem, ...filteredList];

    if (onUpdateStudent) {
      onUpdateStudent({
        alimentacao: {
          ...student.alimentacao,
          mamadeirasServidas: novoContador,
          mamadeirasMlTotal: novoVolumeMl,
          ultimoVolume: isMamadeira ? mamadeiraVolume : (student.alimentacao?.ultimoVolume || mamadeiraVolume),
          volumeSelecionado: isMamadeira ? mamadeiraVolume : (student.alimentacao?.volumeSelecionado || mamadeiraVolume),
          refeicoes: novasRefeicoes,
        },
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      isSubstituicao ? '🔄 Refeição Atualizada' : '🍼 Mamadeira Registrada',
      `Registro de ${refeicaoTipo} (${aceitacao}) salvo para ${student.nome}!`,
      'alimentacao'
    );
  };

  const handleSalvarMamadeira = () => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo(`Alimentação (${refeicaoTipo})`, () => handleSalvarMamadeira())) {
      return;
    }

    const isMamadeira =
      refeicaoTipo.toLowerCase().includes('mamadeira') ||
      refeicaoTipo.toLowerCase().includes('leite') ||
      refeicaoTipo.toLowerCase().includes('fórmula');

    if (isMamadeira) {
      const ultimaMamadeira = obterUltimaMamadeira();
      if (ultimaMamadeira && ultimaMamadeira.hora && ultimaMamadeira.hora.includes(':')) {
        const minutosPassados = calcularMinutosPassados(ultimaMamadeira.hora);
        if (minutosPassados < 120) {
          const minutosFaltantes = 120 - minutosPassados;
          setIntervaloMamadeiraInfo({
            horarioUltima: ultimaMamadeira.hora,
            minutosDesdeUltima: minutosPassados,
            minutosFaltantes: Math.max(1, minutosFaltantes),
            novoVolume: mamadeiraVolume,
            onConfirmarExcecao: () => executarSalvarMamadeira(false),
          });
          setShowModalIntervaloMamadeira(true);
          return;
        }
      }
      executarSalvarMamadeira(false);
      return;
    }

    executarSalvarMamadeira(false);
  };

  // Água Execução
  const executarAdicionarAgua = () => {
    const novoTotal = aguaConsumo + copoSelecionado;
    setAguaConsumo(novoTotal);
    const novosCopos = coposContador + 1;
    setCoposContador(novosCopos);

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const percent = Math.min(100, Math.round((novoTotal / student.agua.metaMl) * 100));

    const novoItem = {
      id: `audit_agua_${Date.now()}`,
      hora: horaAtual,
      tipo: 'hidratacao' as const,
      titulo: 'Hidratação (Água Ingerida)',
      descricao: `${student.nome} ingeriu +${copoSelecionado}ml de água. Total do dia: ${novoTotal}ml (${percent}% da meta).`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      hidratacao: {
        valor: `${novoTotal}ml`,
        copos: `(${novosCopos} copos)`,
        periodo: `${percent}% da meta`,
      },
    };

    const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, novoItem);

    if (onUpdateStudent) {
      onUpdateStudent({
        agua: {
          ...student.agua,
          consumoMl: novoTotal,
          coposServidos: novosCopos,
          porcentagemMeta: percent,
        },
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      '💧 Ingestão de Água Registrada',
      `${student.nome} ingeriu +${copoSelecionado}ml de água. Jarrinha atualizada!`,
      'agua'
    );
  };

  const handleAdicionarAgua = () => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Hidratação (Água)', () => handleAdicionarAgua())) {
      return;
    }
    executarAdicionarAgua();
  };

  const percentAgua = Math.min(100, Math.round((aguaConsumo / student.agua.metaMl) * 100));

  return (
    <div className="space-y-6 relative">
      {/* CARD DE CONFIRMAÇÃO FLUTUANTE */}
      {cardConfirmacao && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                REGISTRO TRANSMITIDO AO PAINEL DOS PAIS
              </span>
              <button
                type="button"
                onClick={() => setCardConfirmacao(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <h5 className="text-sm font-black text-white mt-0.5">{cardConfirmacao.titulo}</h5>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{cardConfirmacao.mensagem}</p>
          </div>
        </div>
      )}

      {/* AVISO DE PERFIL */}
      {isProfessor && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="font-black text-slate-800">
                Modo Professora Ativo — Edição Liberada
              </p>
              <p className="text-slate-600 mt-0.5">
                Os dados e o cronômetro controlados nesta tela são transmitidos instantaneamente para a família de <strong>{student.nome}</strong>.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-200 px-3 py-1 rounded-full">
            Painel Unificado
          </span>
        </div>
      )}

      {/* FEEDBACK TOAST */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 1. SEÇÃO DO CRONÔMETRO ÚNICO */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {isProfessor ? 'CLASSE E PRESENÇA DO ALUNO' : 'PERMANÊNCIA & TEMPO EM AULA'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              {statusAluno === 'em_aula'
                ? (timerRunning ? `Em Aula — ${student.nome}` : `Aula Pausada (${student.nome})`)
                : statusAluno === 'saida_antecipada'
                ? `Saída Antecipada — ${student.nome}`
                : statusAluno === 'ausencia_temporaria'
                ? `Ausência Temporária — ${student.nome}`
                : `Ausente no Dia (Falta) — ${student.nome}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isProfessor
                ? 'Inicie o diário de classe do aluno para registrar sonecas, xixi/cocô, mamadeiras e saúde.'
                : `Acompanhamento transparente das atividades diárias e cuidados com ${student.nome}.`}
            </p>
          </div>

          <span
            className={`text-xs font-black px-3 py-1 rounded-full self-start sm:self-auto ${
              statusAluno === 'em_aula'
                ? (timerRunning
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200')
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            {statusAluno === 'em_aula'
              ? (timerRunning ? '● EM AULA (AO VIVO)' : '⏸️ EM AULA (PAUSADO)')
              : '🚪 SAÍDA ANTECIPADA'}
          </span>
        </div>

        {/* CONTROLES E DISPLAY DO CRONÔMETRO */}
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
                title="Zerar cronômetro"
                className="text-[10px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/50 hover:bg-rose-950 px-2 py-1 rounded-lg transition border border-rose-800/40 cursor-pointer"
              >
                Zerar
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
                    timerRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {timerRunning ? <Pause size={13} /> : <Play size={13} />}
                  <span>{timerRunning ? 'Pausar' : 'Continuar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowModalDesligarIndividual(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserX size={13} className="text-rose-600" />
                  <span>Desligar Individual / Ausência</span>
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

      {/* 2. REGISTROS DIÁRIOS */}
      <div id="secao-alimentacao" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
        
        {/* BLOCO ESQUERDA: MAMADEIRA */}
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none cursor-pointer focus:border-amber-400"
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

          <div>
            <label className="font-bold text-slate-600 block mb-1 text-xs">
              OBSERVAÇÃO
            </label>
            {isProfessor ? (
              <input
                type="text"
                value={mamadeiraObs}
                onChange={(e) => setMamadeiraObs(e.target.value)}
                placeholder="Observação rápida (ex: Fórmula infantil...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-400"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                {mamadeiraObs || 'Alimentou-se com ótima aceitação.'}
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

        {/* BLOCO DIREITA: HIDRATAÇÃO RÁPIDA (ÁGUA) */}
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
                <p className="text-xs text-sky-700 mt-0.5">Meta: {student.agua.metaMl} ml ({coposContador} copos)</p>
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

      {/* 3. REFEIÇÕES SÓLIDAS & SAÚDE */}
      <div id="secao-refeicoes" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
        {/* BLOCO ESQUERDA: REFEIÇÕES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍛</span>
              <h4 className="text-base font-black text-slate-800">Cardápio & Refeições Rápidas</h4>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              1-Clique para Registrar
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
              const horarioReg = refeicaoDoAluno?.horario ? ` às ${refeicaoDoAluno.horario}` : '';
              
              return (
                <div key={item.nome} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col gap-2.5 text-xs hover:bg-white hover:shadow-2xs transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.ícone}</span>
                      <div>
                        <span className="font-extrabold text-slate-800 block text-xs">{item.nome}</span>
                        <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                          Status: <strong className={statusAtual !== 'SEM REGISTRO' ? (statusAtual === 'Rejeitou' ? 'text-rose-600 font-black' : 'text-emerald-600 font-black') : 'text-slate-400 font-medium'}>{statusAtual}{horarioReg}</strong>
                        </span>
                      </div>
                    </div>
                    
                    {isProfessor && (
                      <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setJustificandoRefeicao(null);
                            handleSalvarRefeicaoDireta(item.nome, 'Comeu Tudo');
                          }}
                          className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition shadow-2xs cursor-pointer ${
                            statusAtual === 'Comeu Tudo'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          ✓ Comeu Tudo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setJustificandoRefeicao(null);
                            handleSalvarRefeicaoDireta(item.nome, 'Aceitou Bem');
                          }}
                          className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition shadow-2xs cursor-pointer ${
                            statusAtual === 'Aceitou Bem'
                              ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                              : 'bg-sky-500 hover:bg-sky-600 text-white'
                          }`}
                        >
                          Aceitou Bem
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setJustificandoRefeicao(item.nome);
                            setJustificativaTexto(refeicaoDoAluno?.observacao && refeicaoDoAluno?.observacao !== 'Registro de 1 clique efetuado com carinho.' && refeicaoDoAluno?.observacao !== 'Alimento recusado pela criança.' ? refeicaoDoAluno.observacao : '');
                          }}
                          className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition shadow-2xs cursor-pointer ${
                            statusAtual === 'Rejeitou'
                              ? 'bg-rose-700 text-white ring-2 ring-rose-300'
                              : 'bg-rose-500 hover:bg-rose-600 text-white'
                          }`}
                        >
                          ✕ Rejeitou
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOCO DIREITA: SAÚDE, SONO, FRALDA & CUIDADOS */}
        <div id="secao-saude" className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">🩺</span>
            <h4 className="text-base font-black text-slate-800">
              Saúde, Sono, Fralda & Cuidados
            </h4>
          </div>

          {/* HUMOR */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/95 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span>😊</span>
                <span>Estado de Humor</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                Humor atual: <strong className="text-indigo-600 font-extrabold">{student.saudeCards?.humor?.valor || 'Calmo / Sereno'}</strong>
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
                    className="p-2 rounded-xl border bg-white border-slate-200 hover:bg-indigo-50 text-slate-700 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SONECA E FEBRE */}
            <div className="space-y-4">
              <div id="secao-soneca" className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span>💤</span>
                    <span>SONECA</span>
                  </label>
                </div>

                {isProfessor && (
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[10px] uppercase tracking-wider">
                      DURAÇÃO RÁPIDA:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: '30m', label: '30m' },
                        { id: '1h', label: '1h' },
                        { id: '1h30', label: '1h30' },
                        { id: '2h', label: '2h' },
                        { id: 'nao_dormiu', label: 'Não dormiu' },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleToqueRapidoSoneca(btn.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-white rounded-xl font-bold text-slate-800 text-xs border border-slate-200">
                  {sonecaDesc}
                </div>
              </div>

              {/* Febre */}
              <div className="pt-1">
                <label className="font-bold text-slate-600 block mb-1 text-[11px] uppercase tracking-wider">
                  FEBRE / TEMP (°C)
                </label>
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

            {/* FRALDA & PESO */}
            <div className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider mb-1">
                  FRALDA (XIXI OU COCO)
                </label>
                {isProfessor && (
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
                  </div>
                )}
              </div>

              {/* Peso */}
              <div>
                <label className="font-bold text-slate-600 text-[11px] uppercase tracking-wider block mb-1">
                  PESO CORPORAL (KG)
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-bold text-slate-800 text-xs">
                  <span>{student.saudeCards?.peso?.valor || `${peso} kg`}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {student.saudeCards?.peso?.status || 'Adequado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist de Higiene */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
              CHECKLIST DE HIGIENE
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { key: 'trocaRoupas', label: 'Troca de Roupas', icon: '👕' },
                { key: 'escovacaoDentes', label: 'Escovação Dentes', icon: '🪥' },
                { key: 'maosERosto', label: 'Mãos e Rosto', icon: '🧼' },
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
                        ? 'bg-emerald-500 border-emerald-600 text-white font-extrabold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    } ${isProfessor ? 'cursor-pointer' : 'cursor-default'}`}
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
        </div>
      </div>

      {/* MODAL DE DESLIGAMENTO INDIVIDUAL */}
      <ModalDesligarIndividual
        isOpen={showModalDesligarIndividual}
        onClose={() => setShowModalDesligarIndividual(false)}
        student={student}
        tempoEmAula={formatTimer(secondsElapsed)}
        onConfirmarDesligamento={handleConfirmarDesligamentoIndividual}
      />

      {/* MODAL DE OCORRÊNCIA DO DIA */}
      <ModalOcorrenciaDoDia
        isOpen={showModalOcorrencia}
        onClose={() => setShowModalOcorrencia(false)}
        student={student}
        userRole={userRole}
        onAddOcorrencia={handleAddOcorrencia}
      />

      {/* MODAL DE CONFIRMAÇÃO DE ENCERRAMENTO COLETIVO */}
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
        onConfirmar={handleConfirmarEncerramentoColetivo}
      />

      {/* MODAL DE RELATÓRIO DO WHATSAPP */}
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
        onConfirmarEncerramento={handleEncerrarAulaConfirmado}
      />
    </div>
  );
}
