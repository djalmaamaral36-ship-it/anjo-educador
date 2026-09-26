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

// Utilitário para calcular término da soneca
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

  // --- CRONÔMETRO ---
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

  // --- ESTADOS DA ROTINA DO DIA ---
  const [refeicaoTipo, setRefeicaoTipo] = useState('Mamadeira');
  const [aceitacao, setAceitacao] = useState('Tomou Tudo');
  const [mamadeiraVolume, setMamadeiraVolume] = useState(() => extractMamadeiraVolume(student));
  const [mamadeirasContador, setMamadeirasContador] = useState(student.alimentacao?.mamadeirasServidas || 0);
  const [mamadeiraObs, setMamadeiraObs] = useState('');

  const [copoSelecionado, setCopoSelecionado] = useState(50);
  const [aguaConsumo, setAguaConsumo] = useState(student.agua?.consumoMl || 0);
  const [coposContador, setCoposContador] = useState(student.agua?.coposServidos || 0);

  const [humorEstado, setHumorEstado] = useState(student.humor?.estado || 'Calmo / Sereno');
  const [humorObs, setHumorObs] = useState(student.humor?.observacao || '');

  const [sonecaDesc, setSonecaDesc] = useState(student.saudeCards?.soneca?.valor || 'Sem Soneca Ainda');
  const [horaSonecaInicio, setHoraSonecaInicio] = useState(() => extractHoraInicioFromSoneca(student.saudeCards?.soneca));
  const [horaSonecaFim, setHoraSonecaFim] = useState(() =>
    extractHoraFimFromSoneca(student.saudeCards?.soneca, extractHoraInicioFromSoneca(student.saudeCards?.soneca))
  );
  const [fraldaDesc, setFraldaDesc] = useState(student.saudeCards?.fraldas?.valor || 'Nenhuma Troca');
  const [temperatura, setTemperatura] = useState('36.5');
  const [peso, setPeso] = useState(() => (student.saudeCards?.peso?.valor || '14.0').replace(/kg/i, '').replace('º', '').trim());
  const [notaGeralSaude, setNotaGeralSaude] = useState('');

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

  // FUNÇÃO MESTRE QUE ZERA TUDO PARA O NOVO DIA
  const resetarTodaRotinaLocalESalvar = () => {
    setSecondsElapsed(0);
    setTimerRunning(false);
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
  };

  const handleResetTimer = () => {
    if (!isProfessor) return;
    resetarTodaRotinaLocalESalvar();
    showFeedback('🔄 Cronômetro e Rotina Zerados para o Novo Dia!');
  };

  const handleToggleTimer = () => {
    if (!isProfessor) return;
    setTimerRunning(!timerRunning);
    showFeedback(!timerRunning ? '⏱️ Cronômetro ligado!' : '⏸️ Cronômetro pausado.');
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
          titulo: 'Aula Encerrada',
          descricao: 'Atividades finalizadas com sucesso.',
        },
      });
    }

    triggerCardConfirmacao(
      '🎓 Aulas Encerradas!',
      `Relatório consolidado e salvo com sucesso.`,
      'encerramento'
    );
  };

  // Mamadeira
  const handleSalvarMamadeira = () => {
    if (!isProfessor) return;
    const novoContador = mamadeirasContador + 1;
    const novoTotalMl = (student.alimentacao?.mamadeirasMlTotal || 0) + mamadeiraVolume;
    setMamadeirasContador(novoContador);

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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

    triggerCardConfirmacao(
      '🍼 Mamadeira Salva',
      `Mamadeira de ${mamadeiraVolume}ml (${aceitacao}) registrada para ${student.nome}!`,
      'alimentacao'
    );
  };

  // Água
  const handleAdicionarAgua = () => {
    if (!isProfessor) return;
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

    triggerCardConfirmacao(
      '💧 Água Registrada',
      `${student.nome} bebeu +${copoSelecionado}ml de água. Jarrinha atualizada!`,
      'agua'
    );
  };

  // Refeições Sólidas
  const handleSalvarRefeicaoDireta = (refeicaoNome: string, aceitacaoValor: string) => {
    if (!isProfessor) return;
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

    triggerCardConfirmacao('🍴 Refeição Registrada', `${refeicaoNome} (${aceitacaoValor}) salvo!`, 'alimentacao');
  };

  // Soneca
  const handleToqueRapidoSoneca = (duracao: string) => {
    if (!isProfessor) return;
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

    setSonecaDesc(desc);
    setHoraSonecaFim(hFim);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          soneca: { valor: desc, periodo: hInicio && hFim ? `${hInicio} às ${hFim}` : 'Hoje' },
        },
      });
    }

    triggerCardConfirmacao('💤 Soneca Salva', desc, 'sono');
  };

  // Febre
  const handleToqueRapidoFebre = (temp: string) => {
    if (!isProfessor) return;
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

    triggerCardConfirmacao('🩺 Temperatura Salva', `Aferição: ${cleanTemp}`, 'temperatura');
  };

  // Fralda
  const handleToqueRapidoFralda = (tipo: string) => {
    if (!isProfessor) return;
    let novaFralda = fraldaDesc;
    if (tipo === 'xixi') novaFralda = 'Apenas Xixi';
    else if (tipo === 'coco') novaFralda = 'Apenas Cocô';

    setFraldaDesc(novaFralda);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          fraldas: { valor: novaFralda, periodo: 'Hoje' },
        },
      });
    }

    triggerCardConfirmacao('🧷 Fralda Salva', novaFralda, 'fralda');
  };

  // Humor
  const handleSalvarHumorDireto = (estado: string) => {
    if (!isProfessor) return;
    setHumorEstado(estado);

    if (onUpdateStudent) {
      onUpdateStudent({
        saudeCards: {
          ...student.saudeCards,
          humor: { valor: estado, periodo: 'Hoje' },
        },
      });
    }

    triggerCardConfirmacao('😊 Humor Salvo', estado, 'humor');
  };

  // Higiene
  const handleToggleHigieneDireto = (key: string, label: string) => {
    if (!isProfessor) return;
    const statusAtual = checklist[key as keyof typeof checklist] || 'Pendente';
    const nextState = statusAtual === 'Realizado' ? 'Pendente' : 'Realizado';
    const novoChecklist = { ...checklist, [key]: nextState };
    setChecklist(novoChecklist);

    if (onUpdateStudent) {
      onUpdateStudent({ hygieneChecklist: novoChecklist });
    }

    triggerCardConfirmacao(nextState === 'Realizado' ? `✨ ${label} Marcado` : `🔄 ${label} Removido`, label, 'higiene');
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
            {timerRunning ? '● EM AULA (AO VIVO)' : '⏸️ PAUSADO'}
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

        {/* SAÚDE, SONO & FRALDA */}
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
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                Humor: <strong className="text-indigo-600 font-extrabold">{student.saudeCards?.humor?.valor || 'Calmo / Sereno'}</strong>
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
            {/* SONECA */}
            <div className="space-y-4">
              <div id="secao-soneca" className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-24">
                <label className="font-black text-slate-700 block text-[11px] uppercase tracking-wider">
                  💤 SONECA
                </label>

                {isProfessor && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['30m', '1h', '1h30', '2h', 'nao_dormiu'].map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => handleToqueRapidoSoneca(btn)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-indigo-50 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-2.5 bg-white rounded-xl font-bold text-slate-800 text-xs border border-slate-200">
                  {sonecaDesc}
                </div>
              </div>

              {/* Febre */}
              <div>
                <label className="font-bold text-slate-600 block mb-1 text-[11px] uppercase tracking-wider">
                  FEBRE (°C)
                </label>
                {isProfessor && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['36.5', '37.0', '37.5', '38.0'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToqueRapidoFebre(t)}
                        className={`px-2 py-1 text-[11px] font-black rounded-lg border transition cursor-pointer ${
                          temperatura === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t}°C
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
                  FRALDA
                </label>
                {isProfessor && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToqueRapidoFralda('xixi')}
                      className="p-2 text-xs font-bold bg-white hover:bg-sky-50 text-sky-800 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      💧 Apenas Xixi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToqueRapidoFralda('coco')}
                      className="p-2 text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      💩 Apenas Cocô
                    </button>
                  </div>
                )}
              </div>

              {/* Peso */}
              <div>
                <label className="font-bold text-slate-600 text-[11px] uppercase tracking-wider block mb-1">
                  PESO CORPORAL
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

          {/* HIGIENE */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
              CHECKLIST DE HIGIENE
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { key: 'trocaRoupas', label: 'Troca de Roupas', icon: '👕' },
                { key: 'escovacaoDentes', label: 'Escovação', icon: '🪥' },
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
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      isOk ? 'bg-emerald-500 text-white font-extrabold' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span>{item.icon} {item.label}</span>
                    <span>{isOk ? '✓' : '...'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
        onConfirmar={handleConfirmarEncerramentoColetivo}
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
        onConfirmarEncerramento={() => handleConfirmarEncerramentoColetivo({ enviarWhatsApp: true, publicarMural: true })}
      />
    </div>
  );
}
