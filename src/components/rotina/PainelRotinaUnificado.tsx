import React, { useState, useEffect } from 'react';
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

// Extrai o horário de início da soneca gravado na ficha do aluno (ex: "13:00 às 14:30" => "13:00")
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

// Extrai o término da soneca a partir do período gravado ou calcula 90 min a partir do início
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

// Sugestões Rápidas de Atividades Pedagógicas Alinhadas à BNCC e Árvore da Infância®
export const ATIVIDADES_PREDEFINIDAS = [
  { id: 'historia', titulo: 'Contação de Histórias', icone: '📖', sub: 'Imaginação & Roda', descPadrao: 'Momento afetivo de contação de história com exploração de livros e escuta atenta.' },
  { id: 'musica', titulo: 'Roda de Música & Cantigas', icone: '🎵', sub: 'Ritmo & Expressão', descPadrao: 'Vivência musical com instrumentos sonoros, palmas, cantigas de roda e movimento corporal.' },
  { id: 'artes', titulo: 'Oficina de Artes & Cores', icone: '🎨', sub: 'Pintura & Sensorial', descPadrao: 'Exploração plástica com tintas naturais, texturas, livre expressão visual e sensorial.' },
  { id: 'movimento', titulo: 'Brincadeiras no Parque', icone: '🌳', sub: 'Ar Livre & Psicomotricidade', descPadrao: 'Circuito psicomotor, exploração do espaço externo, corrida e socialização no parque.' },
  { id: 'encaixe', titulo: 'Jogos de Encaixe & Blocos', icone: '🧩', sub: 'Raciocínio & Coordenação', descPadrao: 'Desafio lúdico com blocos lógicos, encaixe e desenvolvimento da coordenação motora fina.' },
  { id: 'natureza', titulo: 'Horta & Contato com a Terra', icone: '🌱', sub: 'Natureza & Investigação', descPadrao: 'Vivência de conexão com o meio ambiente, plantio de mudas e exploração tátil de elementos naturais.' },
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
  const [timerRunning, setTimerRunning] = useState(!!student.presenca.isTimerRunning);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Calcula e atualiza o tempo decorrido usando timestamps reais (garante que não zere ao mudar de aba, sair do app ou recarregar)
  useEffect(() => {
    let interval: any;

    const calcElapsed = () => {
      if (student.presenca.startTimestamp && student.presenca.isTimerRunning) {
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - student.presenca.startTimestamp) / 1000) - (student.presenca.totalPausedSeconds || 0));
        setSecondsElapsed(elapsed);
      } else if (!student.presenca.isTimerRunning) {
        if (student.presenca.tempoEmAulaFormatado) {
          const parts = student.presenca.tempoEmAulaFormatado.split(':');
          if (parts.length === 3) {
            const h = parseInt(parts[0], 10) || 0;
            const m = parseInt(parts[1], 10) || 0;
            const s = parseInt(parts[2], 10) || 0;
            setSecondsElapsed(h * 3600 + m * 60 + s);
          }
        }
      }
    };

    calcElapsed();

    if (timerRunning) {
      interval = setInterval(() => {
        calcElapsed();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, student.presenca.startTimestamp, student.presenca.totalPausedSeconds, student.presenca.isTimerRunning, student.presenca.tempoEmAulaFormatado]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- ESTADOS DE ALIMENTAÇÃO & MAMADEIRA (Foto 11) ---
  const [refeicaoTipo, setRefeicaoTipo] = useState('Mamadeira de Leite');
  const [aceitacao, setAceitacao] = useState('Tomou Tudo / Super Bem');
  const [mamadeiraVolume, setMamadeiraVolume] = useState(180);
  const [mamadeirasContador, setMamadeirasContador] = useState(student.alimentacao?.mamadeirasServidas || 0);
  const [mamadeiraObs, setMamadeiraObs] = useState('');

  // --- ESTADOS DE HIDRATAÇÃO RÁPIDA (ÁGUA) (Foto 11) ---
  const [copoSelecionado, setCopoSelecionado] = useState(50);
  const [aguaConsumo, setAguaConsumo] = useState(student.agua?.consumoMl || 0);
  const [coposContador, setCoposContador] = useState(student.agua?.coposServidos || 0);

  // --- ESTADOS DE HUMOR (Foto 12) ---
  const [humorEstado, setHumorEstado] = useState(student.humor?.estado || 'Calmo / Sereno');
  const [humorObs, setHumorObs] = useState(student.humor?.observacao || '');

  // --- ESTADOS DE SAÚDE, SONO, FRALDA & CUIDADOS (Foto 12, 13 & 28) ---
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

  // --- ESTADOS DE ATIVIDADES PEDAGÓGICAS (Coletiva / Individual) ---
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

  // --- CONTROLE PEDIÁTRICO DE INTERVALO DE MAMADEIRA (MÍNIMO 2 HORAS) ---
  const [showModalIntervaloMamadeira, setShowModalIntervaloMamadeira] = useState(false);
  const [intervaloMamadeiraInfo, setIntervaloMamadeiraInfo] = useState<{
    horarioUltima: string;
    minutosDesdeUltima: number;
    minutosFaltantes: number;
    novoVolume: number;
    onConfirmarExcecao: () => void;
  } | null>(null);

  // Sincroniza estados internos sempre que o objeto `student` for atualizado ou trocado
  useEffect(() => {
    setAguaConsumo(student.agua?.consumoMl || 0);
    setCoposContador(student.agua?.coposServidos || 0);
    setMamadeirasContador(student.alimentacao?.mamadeirasServidas || 0);
    setHumorEstado(student.humor?.estado || 'Calmo / Sereno');
    setHumorObs(student.humor?.observacao || '');
    setSonecaDesc(student.saudeCards?.soneca?.valor || 'Sem Soneca Ainda');
    
    // Início e término dinâmicos da soneca baseados nos dados gravados de cada aluno
    const hInicioCalc = extractHoraInicioFromSoneca(student.saudeCards?.soneca);
    setHoraSonecaInicio(hInicioCalc);
    setHoraSonecaFim(extractHoraFimFromSoneca(student.saudeCards?.soneca, hInicioCalc));

    setFraldaDesc(student.saudeCards?.fraldas?.valor || 'Nenhuma Troca');
    setTemperatura(student.saudeCards?.temperatura?.valor?.replace('°C', '').trim() || '36.5');
    
    // Peso corporal limpo e sincronizado imediatamente com o aluno atual
    const pesoLimpo = (student.saudeCards?.peso?.valor || '14.0')
      .replace(/kg/i, '')
      .replace('º', '')
      .trim();
    setPeso(pesoLimpo || '14.0');

    setTimerRunning(!!student.presenca.isTimerRunning);
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
  }, [
    student.id,
    student.presenca?.status,
    student.presenca?.isTimerRunning,
    student.presenca?.startTimestamp,
    student.presenca?.tempoEmAulaFormatado,
    student.agua?.consumoMl,
    student.alimentacao?.mamadeirasServidas,
    student.saudeCards?.soneca?.valor,
    student.saudeCards?.soneca?.periodo,
    student.saudeCards?.fraldas?.valor,
    student.saudeCards?.temperatura?.valor,
    student.saudeCards?.peso?.valor,
    student.higieneChecklist,
  ]);

  // Reconhecimento de Voz (Microfone) para Diário do Professor
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

  // Funções Utilitárias para Formatação e Auditoria sem Duplicatas
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

  // Validador de Cronômetro Ativo (Nenhum professor pode realizar atividades com o cronômetro desligado)
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

  // Calcula a diferença em minutos entre uma hora string HH:MM e agora
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

  // Busca o último horário em que foi servida mamadeira para o aluno hoje
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

  // Execução efetiva de salvar soneca (individual ou coletiva)
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

    // Mapeia para dar baixa automática na agenda de atividades (Aura Planner)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjinho:rotina-registrada', {
        detail: {
          itemKey: 'sono',
          status: 'Realizado',
          observacao: `Soneca realizada: ${desc}`
        }
      }));
    }
  };

  // Handlers de 1-Clique (Toque Rápido) com validação de cronômetro e detecção de duplicidade
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

    // Se já houver registro anterior de soneca diferente de 'Sem Soneca Ainda' e diferente da nova descrição
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

  // Handler para Salvar Soneca Manual (Individual ou Coletivo)
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

  // Handler para Atualização Dinâmica do Horário de Início da Soneca (Reloginho)
  const handleAlterarHoraSonecaInicio = (novoInicio: string) => {
    if (!novoInicio) return;
    setHoraSonecaInicio(novoInicio);
    const novoFim = calcHoraFimSoneca(novoInicio, 90);
    setHoraSonecaFim(novoFim);

    const novoPeriodo = `${novoInicio} às ${novoFim}`;
    
    // Atualiza a descrição exibida
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

    // Sincroniza imediatamente com os dados do aluno para que os cards de saúde e resumo reflitam na hora
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

  // Handler para Salvar Peso Corporal Imediatamente (sem depender de salvar a ficha inteira)
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

  const executarSalvarHumor = () => {
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoItem = {
      id: `audit_humor_${Date.now()}`,
      hora: horaAtual,
      tipo: 'comportamento' as const,
      titulo: `Estado de Humor & Desenvolvimento: ${humorEstado}`,
      descricao: `${student.nome} demonstrou estado ${humorEstado}.${humorObs ? ` Observação: "${humorObs}"` : ''}`,
      responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    const novosCards = {
      ...student.saudeCards,
      humor: {
        valor: humorEstado,
        periodo: humorObs || 'Observação registrada',
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
      '😊 Registros de Humor Salvos',
      `Estado de humor (${humorEstado}) de ${student.nome} salvo e transmitido instantaneamente ao painel dos pais!`,
      'humor'
    );
  };

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

    // Mapeia para dar baixa automática na agenda de atividades (Aura Planner)
    if (typeof window !== 'undefined') {
      let itemKey = '';
      if (refeicaoNome === 'Lanchinho da Manhã') itemKey = 'lanche_manha';
      else if (refeicaoNome === 'Papinha / Almocinho') itemKey = 'almoco';
      else if (refeicaoNome === 'Lanchinho da Tarde') itemKey = 'lanche_tarde';
      else if (refeicaoNome === 'Jantinha Escolar') itemKey = 'jantar';

      if (itemKey) {
        window.dispatchEvent(new CustomEvent('anjinho:rotina-registrada', {
          detail: {
            itemKey,
            status: aceitacaoValor,
            observacao: observacaoPersonalizada || (aceitacaoValor === 'Rejeitou' ? 'Recusou o alimento.' : 'Alimentou-se adequadamente.')
          }
        }));
      }
    }

    triggerCardConfirmacao(
      '🍴 Refeição Registrada',
      `O registro de ${refeicaoNome} (${aceitacaoValor}) de ${student.nome} foi salvo e enviado aos pais!`,
      'alimentacao'
    );
  };

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

    // Mapeia para dar baixa automática na agenda de atividades (Aura Planner)
    if (nextState === 'Realizado' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjinho:rotina-registrada', {
        detail: {
          itemKey: 'higiene',
          status: 'Realizado',
          observacao: `Cuidado de higiene realizado: ${label}`
        }
      }));
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

  // Handler para Salvar Atividades Pedagógicas (Individual ou Coletiva com 1-Clique)
  const handleSalvarAtividadePedagogica = (
    atividadeIdParam?: string,
    escopoParam?: 'coletiva' | 'individual'
  ) => {
    if (!isProfessor) return;

    const atvId = atividadeIdParam || atividadeSelecionada;
    const escopo = escopoParam || atividadeEscopo;
    const predef = ATIVIDADES_PREDEFINIDAS.find((a) => a.id === atvId);
    const titulo = atividadeTemaCustom.trim()
      ? `Atividade Pedagógica: ${atividadeTemaCustom.trim()}`
      : (predef ? predef.titulo : 'Atividade Pedagógica');

    const rotuloParticipacao =
      atividadeParticipacao === 'muito_participativo' ? 'Muito participativo(a) e encantado(a)' :
      atividadeParticipacao === 'participativo' ? 'Participou com alegria e atenção' :
      atividadeParticipacao === 'observador' ? 'Observou com atenção e tranquilidade' :
      'Recebeu apoio carinhoso da educadora';

    const descBase = atividadeObs.trim() || predef?.descPadrao || 'Vivência pedagógica lúdica realizada em sala.';
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const executar = () => {
      if (escopo === 'coletiva' && onUpdateAllStudents) {
        onUpdateAllStudents((st) => {
          const itemColetivo = {
            id: `audit_ped_${st.id}_${Date.now()}`,
            hora: horaAtual,
            tipo: 'pedagogico' as const,
            titulo: `${titulo} (Coletiva)`,
            descricao: `${st.nome}: Participou da atividade coletiva da turma. ${descBase}`,
            responsavel: st.professoraTitular || 'Ana Silva (Professora Titular)',
            verificado: true,
          };
          return {
            ...st,
            auditoriaLinhaDoTempo: addOrUpdateLinhaTempo(st.auditoriaLinhaDoTempo, itemColetivo),
          };
        });

        // Mapeia para dar baixa automática na agenda pedagógica de atividades (Aura Planner)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjinho:rotina-registrada', {
            detail: {
              itemKey: atvId,
              status: 'Realizado',
              observacao: `Atividade Coletiva da Turma: ${titulo} - ${descBase}`
            }
          }));
        }

        triggerCardConfirmacao(
          '📚 Atividade Coletiva Salva!',
          `"${titulo}" registrada simultaneamente no diário de TODOS os ${allStudents?.length || 6} alunos da turma!`,
          'pedagogico'
        );
      } else {
        const itemIndividual = {
          id: `audit_ped_${Date.now()}`,
          hora: horaAtual,
          tipo: 'pedagogico' as const,
          titulo: `${titulo}`,
          descricao: `${student.nome}: ${descBase} [Engajamento: ${rotuloParticipacao}].`,
          responsavel: student.professoraTitular || 'Ana Silva (Professora Titular)',
          verificado: true,
        };

        const novaLinhaTempo = addOrUpdateLinhaTempo(student.auditoriaLinhaDoTempo, itemIndividual);
        if (onUpdateStudent) {
          onUpdateStudent({
            auditoriaLinhaDoTempo: novaLinhaTempo,
          });
        }

        // Mapeia para dar baixa automática na agenda de atividades (Aura Planner)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anjinho:rotina-registrada', {
            detail: {
              itemKey: atvId,
              status: 'Realizado',
              observacao: `Atividade Individual de ${student.nome}: ${titulo} - ${descBase}`
            }
          }));
        }

        triggerCardConfirmacao(
          '🎨 Atividade Individual Salva!',
          `"${titulo}" registrada com sucesso no diário exclusivo de ${student.nome}.`,
          'pedagogico'
        );
      }

      setAtividadeTemaCustom('');
      setAtividadeObs('');
    };

    if (!validarCronometroAtivo(titulo, executar)) {
      return;
    }

    executar();
  };

  const handleSalvarHumor = () => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo('Estado de Humor', () => handleSalvarHumor())) {
      return;
    }

    if (
      student.saudeCards?.humor?.valor &&
      student.saudeCards.humor.valor !== humorEstado &&
      student.saudeCards.humor.valor !== 'Calmo / Sereno'
    ) {
      verificarDuplicidadeRotina({
        rotinaNome: 'Estado de Humor & Desenvolvimento',
        horarioAnterior: student.saudeCards.humor.periodo || 'Hoje',
        detalhesAnteriores: student.saudeCards.humor.valor,
        novoDetalhe: `${humorEstado}${humorObs ? ` ("${humorObs}")` : ''}`,
        onConfirmarSubstituir: () => executarSalvarHumor(),
      });
      return;
    }

    executarSalvarHumor();
  };

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

  // Checklist de Higiene (Foto 13)
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

  // Modais de Ocorrência, Relatório WhatsApp, Confirmação Coletiva e Desligamento Individual
  const [showModalOcorrencia, setShowModalOcorrencia] = useState(false);
  const [showModalRelatorio, setShowModalRelatorio] = useState(false);
  const [showModalConfirmarColetivo, setShowModalConfirmarColetivo] = useState(false);
  const [showModalDesligarIndividual, setShowModalDesligarIndividual] = useState(false);
  
  // Status Individual do Aluno (em_aula, saida_antecipada, ausencia_temporaria, falta_hoje)
  const [statusAluno, setStatusAluno] = useState<'em_aula' | 'saida_antecipada' | 'ausencia_temporaria' | 'falta_hoje'>(
    student.presenca.status === 'em_aula' ? 'em_aula' : (student.presenca.status === 'ausente' ? 'falta_hoje' : 'em_aula')
  );
  const [motivoAusencia, setMotivoAusencia] = useState<string>('');
  const [responsavelRetirada, setResponsavelRetirada] = useState<string>('');

  const [ocorrenciasList, setOcorrenciasList] = useState<OcorrenciaEscolar[]>(student.ocorrenciasHoje || []);
  const [aulaFinalizada, setAulaFinalizada] = useState(student.presenca.status === 'encerrada');

  // Mensagem de feedback de salvamento & Card de Confirmação Flutuante
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

  // Handler para Desligar Individualmente (Saída Antecipada / Ausência)
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

      // Registra no Livro de Auditoria Digital LGPD
      registrarLogAuditoriaLgpd({
        tipo: 'whatsapp_recado',
        tipoLabel: `Registro de ${rotulo}`,
        studentId: student.id,
        studentNome: student.nome,
        turma: student.turma,
        remetenteNome: student.professoraTitular || 'Ana Silva',
        remetenteCargo: 'Professora Titular',
        destinatarioNome: `${student.responsavelNome} (${student.responsavelParentesco})`,
        destinatarioContato: student.responsavelTelefone,
        canal: 'whatsapp',
        conteudoResumo: `${rotulo} registrado. Motivo: ${dados.motivo}. Tempo em sala: ${formatTimer(secondsElapsed)}.`,
        conteudoIntegral: msg,
        baseLegalLgpd: 'Art. 7º, Inciso V (Execução de Contrato Pedagógico) e Art. 14 da Lei 13.709/18',
      });
    } else {
      // Registra internamente no sistema
      const rotulo = dados.tipo === 'saida_antecipada' ? 'Saída Antecipada' : dados.tipo === 'ausencia_temporaria' ? 'Ausência Temporária' : 'Falta / Ausência';
      registrarLogAuditoriaLgpd({
        tipo: 'autorizacao_retirada',
        tipoLabel: `Registro Interno de ${rotulo}`,
        studentId: student.id,
        studentNome: student.nome,
        turma: student.turma,
        remetenteNome: student.professoraTitular || 'Ana Silva',
        remetenteCargo: 'Professora Titular',
        destinatarioNome: 'Registro Escolar Interno',
        destinatarioContato: student.responsavelTelefone,
        canal: 'sistema',
        conteudoResumo: `${rotulo} registrado sem disparo de WhatsApp. Motivo: ${dados.motivo}. ${dados.responsavelRetirada ? `Retirado por: ${dados.responsavelRetirada}` : ''}`,
        conteudoIntegral: `Status alterado para ${rotulo}. Motivo declarado: ${dados.motivo}. Tempo computado: ${formatTimer(secondsElapsed)}.`,
        baseLegalLgpd: 'Art. 14 da Lei 13.709/18 (Dever de Guarda e Registro Escolar)',
      });
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

  // Handler para Religar Aluno / Iniciar Novo Período (Zera dia anterior)
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

    const resetFn = (st: StudentPaxData): StudentPaxData => ({
      ...st,
      presenca: {
        ...st.presenca,
        status: 'em_aula',
        titulo: 'Em Sala de Aula (Novo Período)',
        descricao: 'Atividades pedagógicas e cuidados diários reiniciados.',
        tempoEmAulaFormatado: '00:00:00',
        isTimerRunning: true,
        startTimestamp: Date.now(),
        totalPausedSeconds: 0,
      },
      agua: {
        ...st.agua,
        consumoMl: 0,
        coposServidos: 0,
        porcentagemMeta: 0,
        historicoBarra: [0, 0, 0, 0, 0],
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
        observacao: 'Novo período de aula iniciado.',
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
      auditoriaLinhaDoTempo: [],
      ocorrenciasHoje: [],
      governanca: {
        conformidadePercent: 0,
        qualidadePercent: 0,
        rotinasRealizadasHoje: 0,
        rotinasRecusasHoje: 0,
        statusRotinaBadge: 'STATUS: ROTINA ESCOLAR DENTRO DO ESPERADO',
        statusRotinaTitulo: 'Tudo Sob Controle na Escola',
        statusRotinaDescricao:
          'O novo período de aula foi iniciado. As atividades previstas na escala estão aguardando execução pelas professoras.',
        responsavelClasse: st.professoraTitular ? `${st.professoraTitular} (Professora Titular)` : 'Ana Silva (Professora Titular)',
        ultimoContatoApi: 'Agora mesmo',
      },
    });

    if (onUpdateAllStudents) {
      onUpdateAllStudents(resetFn);
    } else if (onUpdateStudent) {
      onUpdateStudent(resetFn(student));
    }

    // Dispara evento global para resetar todas as atividades da agenda para pendentes no novo período
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjinho:reset-activities-to-pending'));
    }

    triggerCardConfirmacao(
      '⚡ Cronômetro Religado & Atividades Zeradas!',
      `Todas as atividades, consumos de água, mamadeiras, sonecas e ocorrências foram ZERADAS e colocadas como PENDENTES para o novo período letivo de todos os alunos.`,
      'religar'
    );
  };

  const handleAddOcorrencia = (nova: OcorrenciaEscolar) => {
    setOcorrenciasList((prev) => [nova, ...prev]);
    showFeedback(`⚠️ Ocorrência "${nova.tipoLabel}" registrada no histórico.`);
  };

  const handleEncerrarAulaConfirmado = () => {
    setTimerRunning(false);
    setAulaFinalizada(true);
    showFeedback('🎓 Aula finalizada! Boletim enviado para os responsáveis.');
    if (onUpdateStudent) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          status: 'encerrada',
          titulo: 'Aula Encerrada no Período',
          descricao: 'As atividades escolares de hoje foram concluídas e o relatório foi transmitido aos pais.',
        },
      });
    }
  };

  // Encerramento Coletivo das Aulas com confirmação, disparo WhatsApp, Mural de Avisos e Diários Recebidos
  const handleConfirmarEncerramentoColetivo = (opcoes: { enviarWhatsApp: boolean; publicarMural: boolean }) => {
    setTimerRunning(false);
    setAulaFinalizada(true);

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const tempoEmAula = formatTimer(secondsElapsed);
    const checklistCount = Object.values(checklist).filter((v) => v === 'Realizado').length;

    const targetStudents = allStudents && allStudents.length > 0 ? allStudents : [student];

    targetStudents.forEach((st) => {
      const stAgua = st.agua?.consumoMl ?? aguaConsumo;
      const stMamadeiras = st.alimentacao?.mamadeirasServidas ?? mamadeirasContador;
      const stSoneca = st.saudeCards?.soneca?.valor ?? sonecaDesc;
      const stFralda = st.saudeCards?.fraldas?.valor ?? fraldaDesc;
      const stTemp = st.saudeCards?.temperatura?.valor ?? temperatura;

      const textoWhatsAppSt = 
`🌟 *DIÁRIO DE CLASSE ESCOLAR — ANJO CUIDADOR* 🌟
----------------------------------------
👶 *Aluno(a)*: ${st.nome} (${st.turma})
👩‍🏫 *Educadora*: ${st.professoraTitular || 'Ana Silva'}
📅 *Data*: ${dataHoje} às ${agoraHora}
⏱️ *Tempo em Sala*: ${tempoEmAula}

💧 *HIDRATAÇÃO (ÁGUA)*:
• Consumo: ${stAgua}ml ingeridos (Meta diária de ${st.agua?.metaMl || 600}ml)

🍼 *ALIMENTAÇÃO & MAMADEIRAS*:
• Mamadeiras servidas: ${stMamadeiras} mamadeira(s)
• Refeição do dia: ${refeicaoTipo}
• Aceitação: ${aceitacao}

💤 *SONO & DESCANSO*:
• ${stSoneca}

🧷 *FRALDA & HIGIENE*:
• Trocas e cuidados: ${stFralda}
• Checklist de higiene pessoal: ${checklistCount}/5 cuidados realizados

😊 *HUMOR & DESENVOLVIMENTO*:
• Estado geral: ${humorEstado}
• Nota da educadora: "${humorObs}"

🩺 *SAÚDE & SINAIS*:
• Temperatura: ${stTemp} (Afebril, tudo sob controle)

----------------------------------------
💬 _"Acompanhar cada pequeno passo do seu tesouro é nossa maior honra com amor e segurança!"_
🏫 *Colégio Anjo Cuidador — Transparência em Tempo Real*`;

      salvarDiarioRecebido({
        id: `diario_${st.id}_${Date.now()}`,
        studentId: st.id,
        studentNome: st.nome,
        turma: st.turma,
        data: dataHoje,
        horarioEncerramento: agoraHora,
        professoraNome: st.professoraTitular || 'Ana Silva',
        tempoEmAula,
        aguaMl: stAgua,
        mamadeirasContador: stMamadeiras,
        refeicaoTipo,
        aceitacao,
        humor: humorEstado,
        humorObs,
        soneca: stSoneca,
        fralda: stFralda,
        temperatura: stTemp,
        textoWhatsApp: textoWhatsAppSt,
        destinatarioNome: st.responsavelNome,
        destinatarioTelefone: st.responsavelTelefone,
        enviadoWhatsApp: opcoes.enviarWhatsApp,
        publicadoMural: opcoes.publicarMural,
        criadoEm: `${dataHoje} às ${agoraHora}`,
      });

      registrarLogAuditoriaLgpd({
        tipo: opcoes.enviarWhatsApp ? 'whatsapp_diario' : 'comunicado_mural',
        tipoLabel: opcoes.enviarWhatsApp ? 'Encerramento de Atividades & Diário WhatsApp' : 'Encerramento de Atividades & Auditoria de Saúde',
        studentId: st.id,
        studentNome: st.nome,
        turma: st.turma,
        remetenteNome: st.professoraTitular || 'Ana Silva',
        remetenteCargo: 'Professora Titular',
        destinatarioNome: `${st.responsavelNome} (${st.responsavelParentesco})`,
        destinatarioContato: st.responsavelTelefone,
        canal: opcoes.enviarWhatsApp ? 'whatsapp' : 'app_mural',
        conteudoResumo: `Encerramento de período para ${st.nome}: ${stAgua}ml água, ${stMamadeiras} mamadeiras, soneca ${stSoneca}.`,
        conteudoIntegral: textoWhatsAppSt,
        baseLegalLgpd: 'Art. 7º, Inciso V (Execução de Contrato Pedagógico) e Art. 14 da LGPD (Proteção Integral da Criança)',
      });

      if (opcoes.enviarWhatsApp && st.id === student.id) {
        const telefoneLimpo = st.responsavelTelefone.replace(/\D/g, '');
        const num = telefoneLimpo.length >= 10 ? `55${telefoneLimpo}` : '5511988442211';
        const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(textoWhatsAppSt)}`;
        try {
          window.open(url, '_blank');
        } catch (e) {
          console.error(e);
        }
      }
    });

    if (opcoes.publicarMural) {
      salvarAvisoMural({
        id: `mural_aula_${Date.now()}`,
        titulo: `🎓 Encerramento das Aulas & Diários Consolidados (${dataHoje})`,
        categoria: 'diario_rotina',
        turma: student.turma,
        autorNome: `Profª. ${student.professoraTitular || 'Ana Silva'}`,
        data: dataHoje,
        conteudo: `As atividades letivas da turma ${student.turma} foram encerradas às ${agoraHora}. O cronômetro coletivo foi finalizado e os diários de classe de hidratação, mamadeira, higiene e sono de todos os alunos foram arquivados em "Diários de Rotina Recebidos" e transmitidos para o WhatsApp dos responsáveis.`,
        tags: ['Encerramento de Aulas', 'Diário Consolidado', student.turma],
        destinatarios: `Pais e Responsáveis do ${student.turma}`,
        studentId: student.id,
        criadoEm: `${dataHoje} às ${agoraHora}`,
      });
    }

    if (onUpdateAllStudents) {
      onUpdateAllStudents((st) => ({
        ...st,
        presenca: {
          ...st.presenca,
          status: 'encerrada',
          titulo: 'Aula Encerrada no Período',
          descricao: 'As atividades escolares de hoje foram concluídas e o relatório foi transmitido aos pais.',
        },
      }));
    } else if (onUpdateStudent) {
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
      '🎓 Cronômetro Zerado e Desligado!',
      `Relatório consolidado das atividades e ocorrências do dia foi enviado aos pais de TODOS os alunos da turma.`,
      'encerramento'
    );
  };

  // Handlers do Cronômetro
  const handleToggleTimer = () => {
    if (!isProfessor) return;
    const nextState = !timerRunning;
    setTimerRunning(nextState);

    let newStartTimestamp = student.presenca.startTimestamp;
    let newPausedSeconds = student.presenca.totalPausedSeconds || 0;

    if (nextState) {
      // Iniciando ou Despausando
      if (!newStartTimestamp) {
        newStartTimestamp = Date.now() - secondsElapsed * 1000;
      }
    } else {
      // Pausando
      // Mantém startTimestamp e tempo congelado em tempoEmAulaFormatado
    }

    if (onUpdateStudent) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          isTimerRunning: nextState,
          status: nextState ? 'em_aula' : student.presenca.status,
          startTimestamp: newStartTimestamp,
          totalPausedSeconds: newPausedSeconds,
          tempoEmAulaFormatado: formatTimer(secondsElapsed),
        },
      });
    }

    // Se estiver iniciando o cronômetro a partir do zero ou de um novo período, assegura que as atividades estejam pendentes
    if (nextState && secondsElapsed === 0) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjinho:reset-activities-to-pending'));
      }
    }

    showFeedback(nextState ? '⏱️ Cronômetro de aula ligado!' : '⏸️ Cronômetro pausado.');
  };

  const handleResetTimer = () => {
    if (!isProfessor) return;
    setTimerRunning(false);
    setSecondsElapsed(0);

    // Zerar todos os controles do Diário de Rotina localmente
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

    const resetDataFn = (st: StudentPaxData): StudentPaxData => ({
      ...st,
      presenca: {
        ...st.presenca,
        status: 'em_aula',
        titulo: 'Em Sala de Aula (Novo Período)',
        descricao: 'Cronômetro e diário de rotina zerados para reiniciar do zero.',
        tempoEmAulaFormatado: '00:00:00',
        isTimerRunning: false,
        startTimestamp: null,
        totalPausedSeconds: 0,
      },
      agua: {
        ...st.agua,
        consumoMl: 0,
        coposServidos: 0,
        porcentagemMeta: 0,
        historicoBarra: [0, 0, 0, 0, 0],
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
        observacao: 'Diário de rotina zerado para reiniciar do zero.',
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
      auditoriaLinhaDoTempo: [],
      ocorrenciasHoje: [],
      governanca: {
        conformidadePercent: 0,
        qualidadePercent: 0,
        rotinasRealizadasHoje: 0,
        rotinasRecusasHoje: 0,
        statusRotinaBadge: 'STATUS: ROTINA ESCOLAR DENTRO DO ESPERADO',
        statusRotinaTitulo: 'Tudo Sob Controle na Escola',
        statusRotinaDescricao:
          'O novo período de aula foi iniciado. As atividades previstas na escala estão aguardando execução pelas professoras.',
        responsavelClasse: st.professoraTitular ? `${st.professoraTitular} (Professora Titular)` : 'Ana Silva (Professora Titular)',
        ultimoContatoApi: 'Agora mesmo',
      },
    });

    if (onUpdateAllStudents) {
      onUpdateAllStudents(resetDataFn);
    } else if (onUpdateStudent) {
      onUpdateStudent(resetDataFn(student));
    }

    // Dispara evento global para resetar todas as atividades da agenda para pendentes no novo período
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjinho:reset-activities-to-pending'));
    }

    showFeedback('🔄 Cronômetro e Diário de Rotina Zerados! Prontos para reiniciar do zero.');
  };

  // Execução de Mamadeira / Alimentação
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

    // Atualiza a lista de refeições do aluno
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

    // Remove any existing timeline entry for this same meal name to prevent duplication
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
          refeicoes: novasRefeicoes,
        },
        saudeCards: novosCards,
        auditoriaLinhaDoTempo: novaLinhaTempo,
      });
    }

    triggerCardConfirmacao(
      isSubstituicao ? '🔄 Refeição Atualizada (Substituída)' : '🍼 Refeição / Alimentação Salva',
      `Registro de ${refeicaoTipo} (${aceitacao}) salvo para ${student.nome} e transmitido ao painel dos pais!`,
      'alimentacao'
    );
  };

  // Handler: Mamadeira / Alimentação
  const handleSalvarMamadeira = () => {
    if (!isProfessor) return;
    if (!validarCronometroAtivo(`Alimentação (${refeicaoTipo})`, () => handleSalvarMamadeira())) {
      return;
    }

    const isMamadeira =
      refeicaoTipo.toLowerCase().includes('mamadeira') ||
      refeicaoTipo.toLowerCase().includes('leite') ||
      refeicaoTipo.toLowerCase().includes('fórmula');

    // REGRA DE OURO PEDIÁTRICA: Mamadeiras podem ser servidas várias vezes ao dia, mas exigem intervalo mínimo de 2h
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

      // Mais de 2 horas se passaram ou é a 1ª mamadeira do dia: grava normalmente acumulando volume
      executarSalvarMamadeira(false);
      return;
    }

    // Para refeições sólidas fixas da grade escolar (Lanchinho, Papinha/Almoço, Jantar): verifica duplicidade
    const defaultRefeicoes: Array<{ nome: string; status: string; horario?: string; observacao?: string }> = [
      { nome: 'Lanchinho da Manhã', status: 'SEM REGISTRO' },
      { nome: 'Papinha / Almocinho', status: 'SEM REGISTRO' },
      { nome: 'Lanchinho da Tarde', status: 'SEM REGISTRO' },
      { nome: 'Jantinha Escolar', status: 'SEM REGISTRO' },
    ];

    const currentRefeicoes =
      student.alimentacao?.refeicoes && student.alimentacao.refeicoes.length > 0
        ? student.alimentacao.refeicoes
        : defaultRefeicoes;

    const refeicaoExistente = currentRefeicoes.find((ref) => {
      const refNameNorm = ref.nome.toLowerCase();
      const tipoNorm = refeicaoTipo.toLowerCase();
      return (
        (refNameNorm === tipoNorm ||
          (tipoNorm.includes('manhã') && refNameNorm.includes('manhã')) ||
          (tipoNorm.includes('tarde') && refNameNorm.includes('tarde')) ||
          (tipoNorm.includes('papinha') && refNameNorm.includes('papinha')) ||
          (tipoNorm.includes('almocinho') && refNameNorm.includes('almocinho')) ||
          (tipoNorm.includes('jantinha') && refNameNorm.includes('jantinha'))) &&
        ref.status !== 'SEM REGISTRO'
      );
    });

    if (refeicaoExistente) {
      verificarDuplicidadeRotina({
        rotinaNome: `Alimentação: ${refeicaoExistente.nome}`,
        horarioAnterior: refeicaoExistente.horario || 'Período Atual',
        detalhesAnteriores: `Aceitação: ${refeicaoExistente.status}`,
        novoDetalhe: `Nova aceitação: ${aceitacao}`,
        onConfirmarSubstituir: () => executarSalvarMamadeira(true),
      });
      return;
    }

    executarSalvarMamadeira(false);
  };

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
      `${student.nome} ingeriu +${copoSelecionado}ml de água. Atualizado em tempo real no painel dos pais e na Linha do Tempo!`,
      'agua'
    );
  };

  // Handler: Água
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
      {/* CARD DE CONFIRMAÇÃO FLUTUANTE (TRANSMISSÃO AO PAINEL DOS PAIS) */}
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
            <div className="mt-2 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Sincronizado em Tempo Real com os Pais de {student.nome}
            </div>
          </div>
        </div>
      )}

      {/* AVISO DE PERFIL / SEGURANÇA */}
      {!isProfessor ? (
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <p className="font-black text-slate-800">
                Visualização Exclusiva do Responsável (Modo Acompanhamento)
              </p>
              <p className="text-slate-600 mt-0.5">
                Você está acompanhando a rotina em tempo real de <strong>{student.nome}</strong>. O preenchimento e controle do cronômetro são realizados exclusivamente pela equipe pedagógica.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex-shrink-0">
            Tempo Real Conectado
          </span>
        </div>
      ) : (
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

      {/* 1. SEÇÃO DO CRONÔMETRO ÚNICO (Fotos 9 e 10) */}
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
                ? (statusAluno === 'em_aula'
                    ? 'Inicie o diário de classe do aluno para registrar sonecas, xixi/cocô, mamadeiras e saúde.'
                    : 'Aluno desligado da rotina. Comandos de registro pausados.')
                : `Acompanhamento transparente das atividades diárias e cuidados com ${student.nome}.`}
            </p>
          </div>

          <span
            className={`text-xs font-black px-3 py-1 rounded-full self-start sm:self-auto ${
              statusAluno === 'em_aula'
                ? (timerRunning
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200')
                : statusAluno === 'saida_antecipada'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : statusAluno === 'ausencia_temporaria'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-800 border border-slate-300'
            }`}
          >
            {statusAluno === 'em_aula'
              ? (timerRunning ? '● EM AULA (AO VIVO)' : '⏸️ EM AULA (PAUSADO)')
              : statusAluno === 'saida_antecipada'
              ? '🚪 SAÍDA ANTECIPADA (DESLIGADO)'
              : statusAluno === 'ausencia_temporaria'
              ? '⏱️ AUSÊNCIA TEMPORÁRIA'
              : '🚫 AUSENTE NO DIA (FALTA)'}
          </span>
        </div>

        {/* CONTROLES E DISPLAY DO CRONÔMETRO (Compacto e Unificado) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Mostrador Digital Compacto */}
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
                onClick={handleResetTimer}
                title="Zerar cronômetro"
                className="text-[10px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/50 hover:bg-rose-950 px-2 py-1 rounded-lg transition border border-rose-800/40 cursor-pointer"
              >
                Zerar
              </button>
            )}
          </div>

          {/* Botões de Ação: Apenas Professora pode controlar o cronômetro. Família tem apenas acompanhamento de leitura. */}
          <div className="flex flex-wrap items-center gap-2">
            {isProfessor ? (
              <>
                {statusAluno !== 'em_aula' ? (
                  <>
                    {/* BOTÃO PROEMINENTE DE RELIGAR / MARCAR CHEGADA QUANDO AUSENTE */}
                    <button
                      onClick={handleReligarAluno}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer ring-2 ring-emerald-500/20"
                      title={`Religar cronômetro e registrar chegada/retorno de ${student.nome}`}
                    >
                      <Play size={14} className="fill-white" />
                      <span>▶ Religar / Registrar Chegada de {student.nome}</span>
                    </button>

                    {/* Boletim WhatsApp */}
                    <button
                      onClick={() => setShowModalRelatorio(true)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Visualizar boletim do aluno"
                    >
                      <MessageSquare size={13} />
                      <span>Boletim do Aluno</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* BOTÃO ÚNICO COLETIVO: Ligar e Desligar da Sala */}
                    {!timerRunning ? (
                      <button
                        onClick={handleReligarAluno}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Iniciar cronômetro coletivo de toda a sala e zerar rotinas para novo período"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Ligar Coletivo ({student.turma})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowModalConfirmarColetivo(true)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-rose-900 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-slate-700 hover:border-rose-600"
                        title="Desligar cronômetro coletivo e confirmar encerramento com envio aos pais"
                      >
                        <Clock size={13} className="text-amber-400" />
                        <span>Desligar Coletivo (Encerrar Aulas)</span>
                      </button>
                    )}

                    {/* Pausar / Continuar Individual */}
                    <button
                      onClick={handleToggleTimer}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        timerRunning
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                      title={timerRunning ? 'Pausar cronômetro temporariamente' : 'Retomar cronômetro'}
                    >
                      {timerRunning ? <Pause size={13} /> : <Play size={13} />}
                      <span>{timerRunning ? 'Pausar' : 'Continuar'}</span>
                    </button>

                    {/* BOTÃO DESLIGAR INDIVIDUAL / AUSÊNCIA */}
                    <button
                      onClick={() => setShowModalDesligarIndividual(true)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      title="Desligar individualmente em caso de saída antecipada, consulta ou falta"
                    >
                      <UserX size={13} className="text-rose-600" />
                      <span>Desligar Individual / Ausência</span>
                    </button>

                    {/* Boletim WhatsApp */}
                    <button
                      onClick={() => setShowModalRelatorio(true)}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Visualizar ou enviar relatório WhatsApp"
                    >
                      <MessageSquare size={13} />
                      <span>Boletim WhatsApp</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <Clock size={14} className="text-emerald-600" />
                  <span>Cronômetro oficial controlado por <strong>Profª. {student.professoraTitular}</strong></span>
                </div>
                <button
                  onClick={() => setShowModalRelatorio(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>Ver Boletim do Dia</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAIXA INFORMATIVA DO WHATSAPP (Foto 9 e 10) */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <span className="text-base">💡</span>
            <p>
              No final do período, <strong>termine a aula</strong> para salvar e publicar o <strong>relatório oficial de rotina</strong> com opção de envio aos pais!
            </p>
          </div>
          {isProfessor ? (
            <button
              onClick={() => setShowModalRelatorio(true)}
              className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-2xs"
            >
              <MessageSquare size={14} />
              <span>Gerar Boletim Agora</span>
            </button>
          ) : (
            <button
              onClick={() => setShowModalRelatorio(true)}
              className="text-xs font-black bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <MessageSquare size={14} />
              <span>Visualizar Boletim em Tempo Real</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PAINEL DE REGISTROS DIÁRIOS (OCULTA COMANDOS SE AUSENTE / DESLIGADO INDIVIDUALMENTE) */}
      {statusAluno !== 'em_aula' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            {statusAluno === 'saida_antecipada' ? (
              <LogOut size={30} />
            ) : statusAluno === 'ausencia_temporaria' ? (
              <Clock size={30} />
            ) : (
              <CalendarX size={30} />
            )}
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
              <span>
                {statusAluno === 'saida_antecipada'
                  ? '🚪 Saída Antecipada Registrada'
                  : statusAluno === 'ausencia_temporaria'
                  ? '⏱️ Ausência Temporária Registrada'
                  : '🚫 Aluno Ausente no Período'}
              </span>
            </div>

            <h4 className="text-lg sm:text-xl font-black text-slate-800">
              Comandos de Rotina Ocultos para {student.nome}
            </h4>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {motivoAusencia || (statusAluno === 'saida_antecipada'
                ? `O aluno foi retirado mais cedo da escola. O tempo computado em sala foi finalizado em ${formatTimer(secondsElapsed)}.`
                : statusAluno === 'ausencia_temporaria'
                ? 'O aluno está temporariamente ausente da sala de aula (em consulta ou atendimento externo).'
                : 'O aluno não compareceu às atividades escolares no início do período.')}
            </p>

            {responsavelRetirada && statusAluno === 'saida_antecipada' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 max-w-sm mx-auto">
                <strong>Responsável pela retirada:</strong> {responsavelRetirada}
              </div>
            )}
          </div>

          {/* AVISO DE PROTEÇÃO CONTRA LANÇAMENTOS INDEVIDOS */}
          <div className="max-w-lg mx-auto p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-left text-xs text-amber-900">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Para preservar a fidelidade dos relatórios, os formulários de <strong>alimentação, água, sono, fralda e cuidados</strong> ficam automaticamente bloqueados para este aluno.
            </p>
          </div>

          {/* BOTÃO DE REATIVAR / MARCAR CHEGADA (PROFESSORA) */}
          {isProfessor && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReligarAluno}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer ring-4 ring-emerald-500/10"
              >
                <UserCheck size={16} />
                <span>▶ Religar Rotina & Registrar Chegada de {student.nome}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowModalRelatorio(true)}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>Ver Boletim do Aluno</span>
              </button>
            </div>
          )}
        </div>
      ) : (
      <>
      {/* 2. PAINEL "UM-TOQUE" DE REGISTROS DIÁRIOS (Fotos 10, 11, 12, 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOCO ESQUERDA: ALIMENTAÇÃO & MAMADEIRA (Foto 11) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍼</span>
              <h4 className="text-base font-black text-slate-800">Alimentação & Mamadeira</h4>
            </div>
            <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full">
              {mamadeirasContador} mamadeiras hoje
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">REFEIÇÃO</label>
              {isProfessor ? (
                <select
                  value={refeicaoTipo}
                  onChange={(e) => setRefeicaoTipo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                >
                  <option value="Mamadeiras de Leite / Fórmula">Mamadeiras de Leite / Fórmula</option>
                  <option value="Lanchinho da Manhã">Lanchinho da Manhã</option>
                  <option value="Papinha / Almocinho">Papinha / Almocinho</option>
                  <option value="Lanchinho da Tarde">Lanchinho da Tarde</option>
                  <option value="Jantinha Escolar">Jantinha Escolar</option>
                </select>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800">
                  {refeicaoTipo}
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">ACEITAÇÃO</label>
              {isProfessor ? (
                <select
                  value={aceitacao}
                  onChange={(e) => setAceitacao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                >
                  <option value="Tomou Tudo / Super Bem">Tomou Tudo / Super Bem</option>
                  <option value="Comeu Tudo">Comeu Tudo</option>
                  <option value="Aceitação Parcial">Aceitação Parcial</option>
                  <option value="Recusou / Não Comeu">Recusou / Não Comeu</option>
                </select>
              ) : (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
                  {aceitacao}
                </div>
              )}
            </div>
          </div>

          {/* Seletor de Volume (60ml, 90ml, 120ml, 150ml, 180ml, 210ml, 240ml, 300ml) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Volume da Mamadeira:</span>
              <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {mamadeiraVolume} ml
              </span>
            </div>
            {isProfessor ? (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {[60, 90, 120, 150, 180, 210, 240, 300].map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setMamadeiraVolume(vol)}
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
            ) : null}
          </div>

          {/* Observação / Cardápio */}
          <div>
            <label className="font-bold text-slate-600 block mb-1 text-xs">
              OBSERVAÇÃO / CARDÁPIO
            </label>
            {isProfessor ? (
              <input
                type="text"
                value={mamadeiraObs}
                onChange={(e) => setMamadeiraObs(e.target.value)}
                placeholder="Observação rápida (ex: Amou a banana cozida)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                {mamadeiraObs || 'Alimentou-se nos horários previstos com ótima digestão.'}
              </div>
            )}
          </div>

          {isProfessor && (
            <button
              onClick={handleSalvarMamadeira}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {refeicaoTipo.toLowerCase().includes('mamadeira') ||
                refeicaoTipo.toLowerCase().includes('leite') ||
                refeicaoTipo.toLowerCase().includes('fórmula')
                  ? `+ Registrar Mamadeira (${mamadeiraVolume} ml)`
                  : `+ Registrar ${refeicaoTipo}`}
              </span>
            </button>
          )}
        </div>

        {/* BLOCO DIREITA: HIDRATAÇÃO RÁPIDA (ÁGUA & JARRINHA) (Foto 11) */}
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
              Escolha a quantidade de água servida em mL para {student.nome}. Registra o copo e atualiza a jarrinha.
            </p>

            {/* Botoes de Dosagem (50ml, 100ml, 150ml, 200ml, 250ml, 300ml) */}
            {isProfessor && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3">
                {[50, 100, 150, 200, 250, 300].map((ml) => (
                  <button
                    key={ml}
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

            {/* Barra de Progresso da Jarrinha */}
            <div className="p-4 mt-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">JARRINHA DIÁRIA</span>
                <p className="text-xl font-black text-sky-900">{aguaConsumo} ml ingeridos</p>
                <p className="text-xs text-sky-700 mt-0.5">Meta: {student.agua.metaMl} ml ({coposContador} copos registrados)</p>
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
              onClick={handleAdicionarAgua}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Droplet size={16} />
              <span>Oferecer Copo (+{copoSelecionado}ml) — Jarrinha Sobe!</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. HUMOR & SAÚDE, SONO, FRALDA & HIGIENE (Foto 28) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCO ESQUERDA: REGISTRO RÁPIDO DE REFEIÇÕES SÓLIDAS (1-Clique) */}
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

          <p className="text-xs text-slate-500">
            Acompanhe ou registre instantaneamente a aceitação das refeições sólidas diárias de {student.nome}.
          </p>

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

                  {/* Justification Form Area for Rejection */}
                  {justificandoRefeicao === item.nome && (
                    <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5 mt-1">
                      <span className="text-[10px] font-black text-rose-800 uppercase block tracking-wider">
                        Justificativa / Motivo da Recusa Alimentar:
                      </span>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={justificativaTexto}
                          onChange={(e) => setJustificativaTexto(e.target.value)}
                          placeholder="Ex: Dormiu no horário da refeição / Estava sem apetite"
                          className="flex-1 bg-white border border-rose-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-rose-400 placeholder-slate-400 font-medium"
                        />
                        <div className="flex gap-1.5 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!justificativaTexto.trim()) {
                                triggerCardConfirmacao(
                                  '⚠️ Justificativa Necessária',
                                  'Por favor, explique ou justifique o motivo da recusa alimentar para governança.',
                                  'higiene'
                                );
                                return;
                              }
                              handleSalvarRefeicaoDireta(item.nome, 'Rejeitou', justificativaTexto.trim());
                              setJustificandoRefeicao(null);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                          >
                            Salvar Justificativa
                          </button>
                          <button
                            type="button"
                            onClick={() => setJustificandoRefeicao(null)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black rounded-lg transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                      
                      {/* Sugestões Rápidas de Justificativa */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-rose-100">
                        <span className="text-[9px] font-black text-rose-700 uppercase tracking-wide mr-1 mt-1">
                          Motivos Recorrentes:
                        </span>
                        {[
                          'Estava com soninho / dormiu',
                          'Não demonstrou apetite',
                          'Recusou sólidos / preferiu mamadeira',
                          'Disse estar com a barriguinha cheia',
                          'Indisposição passageira'
                        ].map((sugestao) => (
                          <button
                            key={sugestao}
                            type="button"
                            onClick={() => setJustificativaTexto(sugestao)}
                            className="px-2 py-0.5 bg-white border border-rose-200/60 hover:bg-rose-100 hover:border-rose-300 text-rose-950 text-[9px] font-semibold rounded-md transition cursor-pointer"
                          >
                            {sugestao}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOCO DIREITA: SAÚDE, SONO, FRALDA & CUIDADOS (Foto 28) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">🩺</span>
            <h4 className="text-base font-black text-slate-800">
              Saúde, Sono, Fralda & Cuidados do Aluno
            </h4>
          </div>

          {/* SEÇÃO RÁPIDA DE ESTADO DE HUMOR INTEGRADA (Foto 28) */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/95 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span>😊</span>
                <span>Estado de Humor do Aluno</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                Humor atual: <strong className="text-indigo-600 font-extrabold">{student.saudeCards?.humor?.valor || 'Calmo / Sereno'}</strong>
              </span>
            </div>

            {isProfessor ? (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { estado: 'Feliz', emoji: '😊', bg: 'hover:bg-emerald-50 hover:border-emerald-300' },
                  { estado: 'Calmo / Sereno', emoji: '😌', bg: 'hover:bg-sky-50 hover:border-sky-300' },
                  { estado: 'Cansado / Sonolento', emoji: '😴', bg: 'hover:bg-amber-50 hover:border-amber-300' },
                  { estado: 'Choroso / Inquieto', emoji: '😢', bg: 'hover:bg-rose-50 hover:border-rose-300' },
                ].map((item) => {
                  const isActive = (student.saudeCards?.humor?.valor || 'Calmo / Sereno') === item.estado;
                  return (
                    <button
                      key={item.estado}
                      type="button"
                      onClick={() => handleSalvarHumorDireto(item.estado)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102 font-extrabold'
                          : `bg-white border-slate-200 text-slate-700 ${item.bg}`
                      }`}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span className="text-[9px] font-bold tracking-tight block leading-none">
                        {item.estado.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
                <span className="text-xl mr-2">
                  {student.saudeCards?.humor?.valor === 'Feliz' ? '😊' : student.saudeCards?.humor?.valor === 'Cansado / Sonolento' ? '😴' : student.saudeCards?.humor?.valor === 'Choroso / Inquieto' ? '😢' : '😌'}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {student.nome} está demonstrando estado {student.saudeCards?.humor?.valor || 'Calmo / Sereno'} hoje.
                </span>
              </div>
            )}
          </div>

          {/* DUAS SUB-COLUNAS LADO A LADO (Foto 28) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SUB-COLUNA ESQUERDA: SONECA E FEBRE (Foto 28) */}
            <div className="space-y-4">
              {/* Soneca / Descanso com Reloginho e Escopo Individual / Coletivo */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span>💤</span>
                    <span>SONECA / DESCANSO</span>
                  </label>

                  {/* Seletor de Escopo: Individual vs Coletiva */}
                  {isProfessor && (
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSonecaEscopo('individual')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                          sonecaEscopo === 'individual'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        👤 Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setSonecaEscopo('coletiva')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                          sonecaEscopo === 'coletiva'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        👥 Coletiva (Turma)
                      </button>
                    </div>
                  )}
                </div>

                {/* Banner informativo de escopo */}
                {isProfessor && (
                  <div className={`p-2 rounded-xl text-[11px] font-bold border transition ${
                    sonecaEscopo === 'coletiva'
                      ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900'
                      : 'bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}>
                    {sonecaEscopo === 'coletiva' ? (
                      <span>👥 <strong>Soneca Coletiva:</strong> Aplica o mesmo horário de sono para todos os {allStudents?.length || 6} alunos da sala simultaneamente.</span>
                    ) : (
                      <span>👤 <strong>Soneca Individual:</strong> Registro exclusivo para <strong>{student.nome}</strong>.</span>
                    )}
                  </div>
                )}

                {/* Reloginho - Horário de Início da Soneca */}
                {isProfessor ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} className="text-indigo-600" />
                        Início da Soneca (Reloginho):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          handleAlterarHoraSonecaInicio(now);
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
                      >
                        🕒 Agora ({new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Input com ícone de relógio */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                        <Clock size={13} className="text-indigo-600" />
                        <input
                          type="time"
                          value={horaSonecaInicio}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleAlterarHoraSonecaInicio(val);
                          }}
                          className="text-xs font-black text-slate-800 outline-none bg-transparent"
                        />
                      </div>

                      {/* Botões rápidos de horários comuns de início */}
                      {['12:00', '12:30', '13:00', '13:30'].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleAlterarHoraSonecaInicio(h)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                            horaSonecaInicio === h
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-300'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={13} className="text-indigo-600" />
                      Início da Soneca:
                    </span>
                    <strong className="text-slate-800">
                      {extractHoraInicioFromSoneca(student.saudeCards?.soneca) || horaSonecaInicio || '12:30'}
                    </strong>
                  </div>
                )}

                {/* Toque Rápido / Duração da Soneca */}
                {isProfessor && (
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[10px] uppercase tracking-wider">
                      DURAÇÃO & 1-CLIQUE:
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

                {/* Descrição e Intervalo de Soneca */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                      RESUMO DO DESCANSO:
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600">
                      {horaSonecaInicio && horaSonecaFim ? `${horaSonecaInicio} às ${horaSonecaFim}` : ''}
                    </span>
                  </div>
                  {isProfessor ? (
                    <div className="space-y-2">
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
                        className={`w-full py-1.5 px-3 rounded-xl font-black text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          sonecaEscopo === 'coletiva'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                      >
                        <span>💾</span>
                        <span>
                          {sonecaEscopo === 'coletiva'
                            ? `Salvar Soneca Coletiva (Toda a Turma - ${allStudents?.length || 6} Alunos)`
                            : `Salvar Soneca Individual (${student.nome})`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white rounded-xl font-bold text-slate-800 text-xs border border-slate-200">
                      {sonecaDesc}
                    </div>
                  )}
                </div>
              </div>

              {/* Febre / Temp (°C) */}
              <div className="pt-1">
                <label className="font-bold text-slate-600 block mb-1 text-[11px] uppercase tracking-wider">
                  FEBRE / TEMP (°C)
                </label>
                {isProfessor ? (
                  <input
                    type="text"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    placeholder="Ex: 38.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 text-xs outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs">
                    {temperatura}°C (Afebril)
                  </div>
                )}

                {/* Toque Rápido Febre (1-Clique) */}
                {isProfessor && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {[
                      { temp: '36.5', label: '36,5°C', alert: false },
                      { temp: '37.0', label: '37,0°C', alert: false },
                      { temp: '37.5', label: '37,5°C', alert: false },
                      { temp: '38.0', label: '38,0°C [!]', alert: true },
                    ].map((btn) => (
                      <button
                        key={btn.temp}
                        type="button"
                        onClick={() => handleToqueRapidoFebre(btn.temp)}
                        className={`px-2 py-1 text-[11px] font-black rounded-lg border transition cursor-pointer ${
                          temperatura === btn.temp
                            ? btn.alert
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-indigo-600 text-white border-indigo-600'
                            : btn.alert
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
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

            {/* SUB-COLUNA DIREITA: FRALDA E SELEÇÃO RÁPIDA (Foto 28) */}
            <div className="space-y-3.5">
              {/* Header com FALAR: Microfone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
                    FRALDA (XIXI OU COCO)
                  </label>
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

              {/* SELEÇÃO RÁPIDA DE FRALDA / TOALETE: (1-Clique Foto 28) */}
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

              {/* Peso Corporal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <span>⚖️</span>
                    <span>PESO CORPORAL (KG)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {isProfessor && (
                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                        Enter ou Salvar para gravar
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowModalHistoricoPeso(true)}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-100 transition"
                      title="Ver Histórico Ponderal do Aluno"
                    >
                      <Scale size={11} className="text-indigo-600" />
                      <span>Ver Histórico</span>
                    </button>
                  </div>
                </div>
                {isProfessor ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value)}
                          onBlur={() => handleSalvarPesoDireto(peso)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSalvarPesoDireto(peso);
                            }
                          }}
                          placeholder="14.0"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-black text-slate-800 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 pr-8"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                          kg
                        </span>
                      </div>

                      {/* Botões rápidos de ajuste fino -100g e +100g */}
                      <button
                        type="button"
                        onClick={() => {
                          const num = Math.max(2, parseFloat(peso.replace(',', '.')) || 14.0);
                          const novo = (num - 0.1).toFixed(1);
                          handleSalvarPesoDireto(novo);
                        }}
                        title="Diminuir 100g"
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
                        title="Aumentar 100g"
                        className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl border border-slate-200 transition cursor-pointer"
                      >
                        +0.1
                      </button>

                      {/* Botão de Salvar Imediato */}
                      <button
                        type="button"
                        onClick={() => handleSalvarPesoDireto(peso)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1"
                      >
                        <Check size={12} />
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span>{student.saudeCards?.peso?.valor || `${peso} kg`}</span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {student.saudeCards?.peso?.status || 'Adequado'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checklist de Higiene (Foto 13) */}
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

          {/* Nota Geral de Saúde */}
          <div>
            <label className="font-bold text-slate-600 block mb-1 text-xs">
              NOTAS GERAIS DE SAÚDE / ROTINA DO BEBÊ
            </label>
            {isProfessor ? (
              <input
                type="text"
                value={notaGeralSaude}
                onChange={(e) => setNotaGeralSaude(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                "{notaGeralSaude}"
              </div>
            )}
          </div>

          {isProfessor && (
            <button
              onClick={handleSalvarSituacaoSaude}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Salvar Situação de Saúde & Alertar Pais</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. VIVÊNCIAS & ATIVIDADES PEDAGÓGICAS (1-Clique Coletivo / Individual) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎨</span>
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Vivências & Atividades Pedagógicas</span>
                <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                  BNCC & Árvore da Infância®
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Apontamento rápido de contação de histórias, música, artes e parque com alternância entre registro coletivo da turma e individual.
              </p>
            </div>
          </div>

          {/* Toggle Individual vs Coletiva */}
          {isProfessor && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => setAtividadeEscopo('coletiva')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  atividadeEscopo === 'coletiva'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={14} />
                <span>👥 Coletiva (Toda a Turma)</span>
              </button>
              <button
                type="button"
                onClick={() => setAtividadeEscopo('individual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  atividadeEscopo === 'individual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User size={14} />
                <span>👤 Individual ({student.nome.split(' ')[0]})</span>
              </button>
            </div>
          )}
        </div>

        {/* Banner Informativo de Escopo */}
        {isProfessor && (
          <div className={`p-3 rounded-2xl text-xs font-bold border transition flex items-start gap-2.5 ${
            atividadeEscopo === 'coletiva'
              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}>
            <span className="text-base leading-none">
              {atividadeEscopo === 'coletiva' ? '👥' : '👤'}
            </span>
            <div className="space-y-0.5">
              <span className="font-black block">
                {atividadeEscopo === 'coletiva'
                  ? `Modo Coletivo Ativado (Turma ${student.turma}):`
                  : `Modo Individual Ativado (${student.nome}):`}
              </span>
              <p className="text-[11px] font-normal leading-relaxed opacity-90">
                {atividadeEscopo === 'coletiva'
                  ? `Ao salvar, esta experiência pedagógica será replicada instantaneamente para a linha do tempo de TODOS os ${allStudents?.length || 6} alunos da turma de forma simultânea, economizando seu tempo!`
                  : `Registro exclusivo para ${student.nome}. Ideal para observações singulares de desenvolvimento, falas marcantes ou adaptações pedagógicas individuais.`}
              </p>
            </div>
          </div>
        )}

        {/* Grade de Atividades Rápidas (1-Clique) */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
            Selecione a Experiência Pedagógica do Momento:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {ATIVIDADES_PREDEFINIDAS.map((atv) => {
              const isSelected = atividadeSelecionada === atv.id;
              return (
                <button
                  key={atv.id}
                  type="button"
                  onClick={() => {
                    setAtividadeSelecionada(atv.id);
                    if (!atividadeObs) {
                      setAtividadeObs(atv.descPadrao);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 shadow-2xs cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs scale-102 ring-2 ring-indigo-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{atv.icone}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <strong className={`block text-xs font-black leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {atv.titulo}
                    </strong>
                    <span className={`text-[10px] block mt-0.5 line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {atv.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campos de Personalização / Livro / Tema */}
        {isProfessor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                Tema / Livro / História (Opcional):
              </label>
              <input
                type="text"
                value={atividadeTemaCustom}
                onChange={(e) => setAtividadeTemaCustom(e.target.value)}
                placeholder="Ex: Livro 'O Pequeno Urso' / Pintura com Cotonetes"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                {atividadeEscopo === 'coletiva' ? 'Engajamento Geral da Turma:' : `Participação de ${student.nome.split(' ')[0]}:`}
              </label>
              <select
                value={atividadeParticipacao}
                onChange={(e) => setAtividadeParticipacao(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 font-bold"
              >
                <option value="muito_participativo">⭐ Muito participativo(a) e encantado(a)</option>
                <option value="participativo">😊 Participou com alegria e atenção</option>
                <option value="observador">👀 Observou com calma e atenção</option>
                <option value="precisou_apoio">🤝 Recebeu mediação / apoio carinhoso</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                Observação Pedagógica / Relato do Momento:
              </label>
              <textarea
                value={atividadeObs}
                onChange={(e) => setAtividadeObs(e.target.value)}
                rows={2}
                placeholder="Descreva brevemente como foi a vivência e as reações das crianças..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-indigo-500 font-medium resize-none"
              />
            </div>
          </div>
        )}

        {/* Botão de Gravação com Destaque de Escopo */}
        {isProfessor && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSalvarAtividadePedagogica()}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center justify-center gap-2.5 ${
                atividadeEscopo === 'coletiva'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span>{atividadeEscopo === 'coletiva' ? '👥' : '👤'}</span>
              <span>
                {atividadeEscopo === 'coletiva'
                  ? `Salvar Atividade Coletiva (Toda a Turma - ${allStudents?.length || 6} Alunos)`
                  : `Salvar Atividade Individual para ${student.nome}`}
              </span>
            </button>
          </div>
        )}
      </div>
      </>
      )}

      {/* BOTÃO FLUTUANTE DE OCORRÊNCIA DO DIA (Apenas para Educadoras/Professores) */}
      {isProfessor && (
        <BotaoFlutuanteOcorrencia
          onClick={() => setShowModalOcorrencia(true)}
          countOcorrencias={ocorrenciasList.length}
        />
      )}

      {/* MODAL DE DESLIGAMENTO INDIVIDUAL (SAÍDA ANTECIPADA / AUSÊNCIA) */}
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

      {/* MODAL DE RELATÓRIO DO WHATSAPP (Fotos 9 e 10) */}
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

      {/* MODAL DE CRONÔMETRO DESLIGADO (BLOQUEIO DE ROTINA FORA DO PERÍODO DE AULA) */}
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
                <strong>Regra de Governança Escolar:</strong> Nenhum professor pode realizar ou lançar atividades de rotina (alimentação, soneca, higiene ou cuidados) com o cronômetro desligado, pois está fora do período de aula.
              </p>
              {acaoPendenteCronometro && (
                <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-slate-800">
                  <span className="text-[10px] font-black uppercase text-amber-800 block">Ação solicitada:</span>
                  <span className="font-black text-xs text-indigo-900">{acaoPendenteCronometro.nome}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Deseja <strong>iniciar o cronômetro da turma agora</strong> para validar o período de aula e registrar a atividade automaticamente?
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

      {/* MODAL DE AVISO DE DUPLICIDADE DE INFORMAÇÃO */}
      {showModalDuplicidade && duplicidadeInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shrink-0 border border-indigo-200 shadow-2xs">
                🔄
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Aviso de Duplicidade</h3>
                <p className="text-xs font-bold text-indigo-700">Esta rotina já possui lançamento anterior</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <div className="font-bold text-slate-900 text-sm">
                {duplicidadeInfo.rotinaNome}
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-0.5">
                <span className="text-[10px] font-black uppercase text-rose-800 block">Registro Anterior:</span>
                <p className="text-xs font-bold text-rose-950">{duplicidadeInfo.detalhesAnteriores}</p>
                <span className="text-[10px] text-rose-700">Horário: {duplicidadeInfo.horarioAnterior}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                <span className="text-[10px] font-black uppercase text-emerald-800 block">Novo Registro Solicitado:</span>
                <p className="text-xs font-bold text-emerald-950">{duplicidadeInfo.novoDetalhe}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Para evitar dados duplicados no diário escolar e no aplicativo dos pais, você deseja <strong>substituir</strong> o registro anterior com a nova informação?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModalDuplicidade(false);
                  setDuplicidadeInfo(null);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Manter Anterior (Cancelar)
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = duplicidadeInfo.onConfirmarSubstituir;
                  setShowModalDuplicidade(false);
                  setDuplicidadeInfo(null);
                  fn();
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🔄 Substituir Registro Anterior</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE AVISO DE INTERVALO DE MAMADEIRA (< 2 HORAS - PROTOCOLO PEDIÁTRICO) */}
      {showModalIntervaloMamadeira && intervaloMamadeiraInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0 border border-amber-200 shadow-2xs">
                🍼
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Alerta Nutricional & Digestivo</h3>
                <p className="text-xs font-bold text-amber-700">Intervalo entre mamadeiras menor que 2 horas</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2.5 text-xs text-amber-950 font-medium">
              <p>
                <strong>Protocolo de Saúde Infantil:</strong> O leite e a fórmula exigem um intervalo digestivo de no mínimo <strong>2 horas (120 minutos)</strong> entre mamadeiras para prevenir sobrecarga gástrica, cólicas e refluxo no bebê.
              </p>

              <div className="p-2.5 bg-white/95 rounded-xl border border-amber-200 space-y-1 text-slate-800">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold">Última mamadeira:</span>
                  <span className="font-black text-amber-900">
                    {intervaloMamadeiraInfo.horarioUltima} ({intervaloMamadeiraInfo.minutosDesdeUltima} min atrás)
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold">Intervalo ideal:</span>
                  <span className="font-bold text-slate-700">Mínimo 2 horas (120 min)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold">Tempo faltante recomendado:</span>
                  <span className="font-black text-amber-800">
                    ~{intervaloMamadeiraInfo.minutosFaltantes} minutos
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-bold">Nova mamadeira solicitada:</span>
                  <span className="font-black text-indigo-700">{intervaloMamadeiraInfo.novoVolume} ml</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Recomenda-se aguardar o intervalo digestivo. Caso haja <strong>orientação pediátrica específica</strong> ou necessidade especial comprovada, você pode confirmar o registro extraordinário.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModalIntervaloMamadeira(false);
                  setIntervaloMamadeiraInfo(null);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Aguardar Horário (Cancelar)
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = intervaloMamadeiraInfo.onConfirmarExcecao;
                  setShowModalIntervaloMamadeira(false);
                  setIntervaloMamadeiraInfo(null);
                  fn();
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🍼 Confirmar (Exceção/Prescrição)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO PONDERAL ESCOLAR */}
      {showModalHistoricoPeso && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Scale size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Histórico Ponderal Escolar
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Acompanhamento de {student.nome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModalHistoricoPeso(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Destaque da Pesagem Atual */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                  PESAGEM ATUAL REGISTRADA
                </span>
                <span className="text-2xl font-black text-indigo-950">
                  {student.saudeCards?.peso?.valor || `${peso} kg`}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Responsável: {student.professoraTitular || 'Equipe Escolar'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                  {student.saudeCards?.peso?.status || 'Adequado'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Curva de Crescimento Normal</p>
              </div>
            </div>

            {/* Histórico Comparativo */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                EVOLUÇÃO PONDERAL & MARCOS
              </span>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-800">Aferição do Mês Atual</p>
                    <p className="text-[11px] text-slate-400">Escola & Equipe de Cuidados</p>
                  </div>
                  <span className="font-black text-base text-indigo-700">
                    {student.saudeCards?.peso?.valor || `${peso} kg`}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center opacity-80">
                  <div>
                    <p className="font-bold text-slate-700">Mês Anterior</p>
                    <p className="text-[11px] text-slate-400">Padrão OMS — Ganho ponderal adequado</p>
                  </div>
                  <span className="font-bold text-sm text-slate-600">13.6 kg</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center opacity-70">
                  <div>
                    <p className="font-bold text-slate-700">Início do Semestre</p>
                    <p className="text-[11px] text-slate-400">Registro na matrícula</p>
                  </div>
                  <span className="font-bold text-sm text-slate-600">13.1 kg</span>
                </div>
              </div>
            </div>

            {/* Registros Recentes da Linha do Tempo */}
            {student.auditoriaLinhaDoTempo && student.auditoriaLinhaDoTempo.filter(i => i.tipo === 'saude' && (i.titulo?.toLowerCase().includes('peso') || i.descricao?.toLowerCase().includes('peso'))).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  AFERIÇÕES REGISTRADAS HOJE NO DIÁRIO
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {student.auditoriaLinhaDoTempo
                    .filter(i => i.tipo === 'saude' && (i.titulo?.toLowerCase().includes('peso') || i.descricao?.toLowerCase().includes('peso')))
                    .map((item) => (
                      <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{item.titulo}</p>
                          <p className="text-[10px] text-slate-400">{item.descricao} • {item.responsavel}</p>
                        </div>
                        <span className="text-[11px] font-mono font-black text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {item.hora}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Nota Afetiva / Metodologia Árvore da Infância */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
              🌿 <strong>Cuidado e Desenvolvimento:</strong> Os registros de peso e desenvolvimento infantil preservam a história do crescimento da criança, promovendo tranquilidade para a família e segurança pedagógica.
            </div>

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setShowModalHistoricoPeso(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
