import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  MessageSquare,
  Send,
  FileText,
  Users,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  PlusCircle,
  Tag,
  AlertCircle,
  Heart,
  Smile,
  ShieldCheck,
  Share2,
  Phone,
  Mic,
  MicOff,
  User,
  Baby,
  Pill,
  HeartPulse,
  DoorOpen,
  Package,
  Utensils,
  Moon,
  Palette,
  Eye,
  Filter,
} from 'lucide-react';
import { StudentPaxData, AvisoMural, RecadoEscolar, DiarioRotinaRecebido } from '../../types';
import {
  getMuralAvisos,
  salvarAvisoMural,
  getRecadosEscolares,
  salvarRecadoEscolar,
  marcarRecadoComoLido,
  getDiariosRecebidos,
} from '../../services/muralDiariosService';
import { registrarLogAuditoriaLgpd } from '../../services/lgpdService';

interface Props {
  currentStudent: StudentPaxData;
  userRole?: 'professor' | 'familia';
  onToggleRole?: (role: 'professor' | 'familia') => void;
  onSelectStudent?: (id: string) => void;
}

// Assuntos pré-definidos para facilitar a comunicação
interface AssuntoOpcao {
  id: string;
  categoria: 'geral' | 'saude' | 'medicamento' | 'recado_rapido' | 'saida_autorizada';
  titulo: string;
  icone: string;
  descricao: string;
  corBadge: string;
  templatesFamilia: string[];
  templatesProfessor: string[];
}

const ASSUNTOS_DISPONIVEIS: AssuntoOpcao[] = [
  {
    id: 'saida',
    categoria: 'saida_autorizada',
    titulo: 'Saída Autorizada / Quem Busca',
    icone: '🚪',
    descricao: 'Informar quem irá retirar o aluno hoje ou mudança de horário',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    templatesFamilia: [
      'Aviso de saída: Hoje por volta das 17h15 quem irá retirar será a vovó/vovô já cadastrado na portaria.',
      'Hoje o transporte escolar não irá buscar. O papai/mamãe virá pessoalmente às 17h.',
      'Solicito liberação antecipada hoje às 15h30 devido à consulta com o pediatra.',
    ],
    templatesProfessor: [
      'Confirmo o recebimento do aviso de saída. O crachá de identificação será solicitado na portaria.',
      'A saída antecipada foi informada aos monitores da sala e a mochila já estará organizada.',
    ],
  },
  {
    id: 'saude',
    categoria: 'saude',
    titulo: 'Saúde, Febre & Sintomas',
    icone: '🩺',
    descricao: 'Avisos sobre vacina recente, coriza, dentinhos ou indisposição',
    corBadge: 'bg-rose-100 text-rose-900 border-rose-300',
    templatesFamilia: [
      'Acordou dengosa(o) por conta do dentinho nascendo. Deixei o mordedor de silicone esterilizado na mochila.',
      'Tomou vacina ontem e pode apresentar leve sonolência ou sensibilidade na perninha.',
      'Está com leve coriza. Enviei sorinho nasal de uso contínuo para higienização antes das refeições.',
    ],
    templatesProfessor: [
      'Verificamos a temperatura e está 36.5°C (afebril). A criança segue tranquila e participando normalmente.',
      'Higienizamos o narizinho com o soro enviado e ela almoçou com excelente apetite.',
    ],
  },
  {
    id: 'medicamento',
    categoria: 'medicamento',
    titulo: 'Medicamentos & Horários',
    icone: '💊',
    descricao: 'Instruções de administração de xaropes, antibióticos ou pomadas',
    corBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    templatesFamilia: [
      'Enviei a receitinha e o medicamento na frasqueira térmica. Favor administrar 5ml pontualmente às 14h00.',
      'Aplicar pomada protetora reforçada em todas as trocas de fralda do dia.',
    ],
    templatesProfessor: [
      'Medicamento administrado com sucesso às 14h00 conforme receita médica arquivada. Aceitação total.',
      'Cuidados de pomada e hidratação cutânea realizados com sucesso.',
    ],
  },
  {
    id: 'reposicao',
    categoria: 'geral',
    titulo: 'Reposição no Escaninho',
    icone: '🎒',
    descricao: 'Fraldas, lenços umedecidos, troca de roupa ou pomadas',
    corBadge: 'bg-sky-100 text-sky-900 border-sky-300',
    templatesFamilia: [
      'Enviei hoje na mochila um pacote lacrado de fraldas e 2 mudinhas extras de roupa de calor.',
      'Reposição de lenços umedecidos e pomada enviada hoje no compartimento principal.',
    ],
    templatesProfessor: [
      'Olá família! Notamos que restam apenas 2 fraldas no escaninho. Se puderem enviar um pacote amanhã agradecemos!',
      'Pedimos enviar uma troca extra de agasalho pois a temperatura pode cair no final da tarde.',
    ],
  },
  {
    id: 'alimentacao',
    categoria: 'geral',
    titulo: 'Alimentação & Mamadeiras',
    icone: '🍼',
    descricao: 'Restrições, novas frutinhas, mamadeira extra ou apetite',
    corBadge: 'bg-orange-100 text-orange-900 border-orange-300',
    templatesFamilia: [
      'Hoje iniciamos a introdução de mamão no café da manhã. Por favor observar se aceita bem a papinha.',
      'Enviei uma dosagem extra de fórmula láctea na mochila para o lanche das 16h.',
    ],
    templatesProfessor: [
      'A refeição foi um sucesso! Comeu toda a porção de legumes e tomou 180ml de leite com ótimo apetite.',
      'Aceitou super bem a frutinha no lanche da manhã e tomou bastante aguinha fresca.',
    ],
  },
  {
    id: 'sono',
    categoria: 'recado_rapido',
    titulo: 'Soninho & Descanso',
    icone: '💤',
    descricao: 'Como dormiu à noite, mantinha favorita ou rotina de sono',
    corBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    templatesFamilia: [
      'Dormiu um pouco tarde essa noite. Pode ser que precise de um soninho mais cedo na escola.',
      'Enviei o paninho de apego limpinho para o momento de descanso no berço.',
    ],
    templatesProfessor: [
      'Dormiu tranquilamente durante 1h40m no soninho da tarde, acordou bem disposta e sorridente.',
      'Descansou muito bem no colchonete com a mantinha favorita.',
    ],
  },
  {
    id: 'elogio',
    categoria: 'recado_rapido',
    titulo: 'Atividades & Elogio do Dia',
    icone: '🎨',
    descricao: 'Interação com coleguinhas, pinturas, músicas e desenvolvimento',
    corBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    templatesFamilia: [
      'Muito obrigado pelo carinho e dedicação com a nossa pequena! Ela adora as músicas da escola.',
      'Agradecemos o relatório detalhado de ontem, ficamos muito felizes com a evolução motora.',
    ],
    templatesProfessor: [
      'Hoje foi um dia incrível! Participou com muito entusiasmo da pintura sensorial com tintas naturais.',
      'Brincou muito com os coleguinhas no tapete de blocos e deu várias risadas na contação de histórias.',
    ],
  },
];

export default function MuralAvisosERecadosModule({
  currentStudent,
  userRole = 'professor',
  onToggleRole,
  onSelectStudent,
}: Props) {
  // Estado de Dados Unificados
  const [muralAvisos, setMuralAvisos] = useState<AvisoMural[]>(() => getMuralAvisos(currentStudent.turma));
  const [recados, setRecados] = useState<RecadoEscolar[]>(() => getRecadosEscolares(currentStudent.id));
  const [diarios, setDiarios] = useState<DiarioRotinaRecebido[]>(() => getDiariosRecebidos(currentStudent.id));

  // Estados de Formulário
  const [assuntoSelecionadoId, setAssuntoSelecionadoId] = useState<string>('saida');
  const [mensagemTexto, setMensagemTexto] = useState<string>('');
  const [observacaoExtra, setObservacaoExtra] = useState<string>('');
  const [notificarWhatsApp, setNotificarWhatsApp] = useState<boolean>(false);
  const [publicarNoMuralGeral, setPublicarNoMuralGeral] = useState<boolean>(true);

  // Estados de Microfone / Reconhecimento de Voz
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micSupported, setMicSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Filtros & Visualização
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'diarios' | 'recados_pais' | 'recados_pro' | 'avisos_mural'>('todos');
  const [filtroBusca, setFiltroBusca] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [curtidasMap, setCurtidasMap] = useState<Record<string, number>>({
    mural_1: 5,
    mural_2: 7,
    mural_3: 9,
  });
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Inicializar Web Speech API para microfone
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.warn('Erro no microfone:', e);
        setIsListening(false);
        showToast('Microfone finalizado ou permissão não concedida.');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setMensagemTexto((prev) => (prev ? `${prev} ${transcript}` : transcript));
          showToast('🎙️ Voz reconhecida com sucesso!');
        }
      };

      recognitionRef.current = recognition;
    } else {
      setMicSupported(false);
    }
  }, []);

  const handleToggleMic = () => {
    if (!micSupported) {
      // Simulação graciosa se o browser não tiver suporte à API nativa de voz
      const frasesExemplo = [
        'Hoje quem busca é a vovó Lourdes às 17h15.',
        'A Mariana dormiu muito bem e comeu toda a frutinha com alegria.',
        'Deixei o mordedor de silicone e o sorinho nasal na bolsa lateral.',
      ];
      const frase = frasesExemplo[Math.floor(Math.random() * frasesExemplo.length)];
      setMensagemTexto((prev) => (prev ? `${prev} ${frase}` : frase));
      showToast('🎙️ Ditado por voz adicionado (Modo Simulado)!');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 200);
      }
    }
  };

  // Sincronização em tempo real de avisos, diários e recados
  useEffect(() => {
    const syncData = () => {
      setMuralAvisos(getMuralAvisos(currentStudent.turma));
      setRecados(getRecadosEscolares(currentStudent.id));
      setDiarios(getDiariosRecebidos(currentStudent.id));
    };

    window.addEventListener('anjo_mural_atualizado', syncData);
    window.addEventListener('anjo_recados_atualizado', syncData);
    window.addEventListener('anjo_diario_atualizado', syncData);

    return () => {
      window.removeEventListener('anjo_mural_atualizado', syncData);
      window.removeEventListener('anjo_recados_atualizado', syncData);
      window.removeEventListener('anjo_diario_atualizado', syncData);
    };
  }, [currentStudent.turma, currentStudent.id]);

  const assuntoAtual =
    ASSUNTOS_DISPONIVEIS.find((a) => a.id === assuntoSelecionadoId) || ASSUNTOS_DISPONIVEIS[0];

  // Geração do Texto Formatado para WhatsApp em Tempo Real (Padrão das Fotos 31 e 32)
  const dataHojeFormatada = new Date().toLocaleDateString('pt-BR');
  const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const textoWhatsAppPadronizado =
    userRole === 'familia'
      ? `📩 *RECADO DA FAMÍLIA — ANJO CUIDADOR* 🌟\n----------------------------------------\n👶 *Aluno(a)*: ${currentStudent.nome} (${currentStudent.turma})\n👤 *De*: ${currentStudent.responsavelNome} (${currentStudent.responsavelParentesco || 'Responsável'})\n👩‍🏫 *Para*: Profª. ${currentStudent.professoraTitular}\n📅 *Data*: ${dataHojeFormatada} às ${horaAgora}\n📌 *Assunto*: ${assuntoAtual.icone} ${assuntoAtual.titulo}\n\n💬 *MENSAGEM*:\n"${mensagemTexto || 'Escreva sua mensagem ou selecione um modelo...'}"\n\n${observacaoExtra ? `📝 *OBSERVAÇÃO EXTRA*:\n${observacaoExtra}\n\n` : ''}----------------------------------------\n🏫 *Colégio Anjo Cuidador — Comunicação em Tempo Real*`
      : `🌟 *AVISO PEDAGÓGICO — ANJO CUIDADOR* 🌟\n----------------------------------------\n👶 *Aluno(a)*: ${currentStudent.nome} (${currentStudent.turma})\n👩‍🏫 *Educadora*: ${currentStudent.professoraTitular}\n👤 *Para*: ${currentStudent.responsavelNome}\n📅 *Data*: ${dataHojeFormatada} às ${horaAgora}\n📌 *Assunto*: ${assuntoAtual.icone} ${assuntoAtual.titulo}\n\n💬 *COMUNICADO*:\n"${mensagemTexto || 'Escreva o comunicado da turma ou selecione um modelo...'}"\n\n${observacaoExtra ? `📝 *OBSERVAÇÃO EXTRA*:\n${observacaoExtra}\n\n` : ''}----------------------------------------\n💖 *Acolhimento, amor e segurança em cada pequeno passo!*`;

  // Copiar Texto Formatado
  const handleCopiarTexto = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast('📋 Texto formatado copiado com sucesso!');
  };

  // Enviar para o WhatsApp Real
  const handleEnviarWhatsAppReal = (textoPersonalizado?: string) => {
    const textoParaEnviar = textoPersonalizado || textoWhatsAppPadronizado;
    const telefoneLimpo = currentStudent.responsavelTelefone.replace(/\D/g, '');
    const num = telefoneLimpo.length >= 10 ? `55${telefoneLimpo}` : '5511988442211';
    const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(textoParaEnviar)}`;

    try {
      window.open(url, '_blank');
      showToast('📱 WhatsApp aberto com o comunicado formatado!');
    } catch (e) {
      console.error(e);
    }
  };

  // Salvar no Log / Publicar no Mural Unificado
  const handleSalvarNoLogEMural = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mensagemTexto.trim()) {
      showToast('Por favor, digite uma mensagem ou selecione um modelo.');
      return;
    }

    const remetenteTipo = userRole === 'familia' ? 'familia' : 'professor';
    const remetenteNome =
      userRole === 'familia'
        ? `${currentStudent.responsavelNome} (${currentStudent.responsavelParentesco || 'Família'})`
        : `Profª. ${currentStudent.professoraTitular}`;
    const remetenteCargo = userRole === 'familia' ? 'Responsável Legal' : 'Educadora Titular';
    const destinatarioNome =
      userRole === 'familia'
        ? `Profª. ${currentStudent.professoraTitular}`
        : `${currentStudent.responsavelNome} (Responsável de ${currentStudent.nome})`;

    // 1. Salva como Recado de Mão Dupla
    const novoRecado: RecadoEscolar = {
      id: `recado_${Date.now()}`,
      studentId: currentStudent.id,
      studentNome: currentStudent.nome,
      turma: currentStudent.turma,
      remetenteTipo,
      remetenteNome,
      remetenteCargo,
      destinatarioNome,
      mensagem: mensagemTexto.trim() + (observacaoExtra ? `\n(Obs: ${observacaoExtra})` : ''),
      data: dataHojeFormatada,
      horario: horaAgora,
      lido: true,
      categoria: assuntoAtual.categoria,
      enviadoWhatsApp: notificarWhatsApp,
      criadoEm: `${dataHojeFormatada} às ${horaAgora}`,
    };

    salvarRecadoEscolar(novoRecado);

    // 2. Se for comunicado geral ou marcado para o mural
    if (publicarNoMuralGeral || userRole === 'professor') {
      const novoAviso: AvisoMural = {
        id: `mural_pub_${Date.now()}`,
        titulo: `${assuntoAtual.icone} ${assuntoAtual.titulo}: ${currentStudent.nome}`,
        categoria: assuntoAtual.categoria === 'saude' ? 'saude' : 'comunicado',
        turma: currentStudent.turma,
        autorNome: remetenteNome,
        data: dataHojeFormatada,
        conteudo: mensagemTexto.trim() + (observacaoExtra ? `\n\nObs: ${observacaoExtra}` : ''),
        tags: [assuntoAtual.titulo, currentStudent.turma, currentStudent.nome],
        destinatarios: `Pais e Professores do ${currentStudent.turma}`,
        studentId: currentStudent.id,
        criadoEm: `${dataHojeFormatada} às ${horaAgora}`,
      };
      salvarAvisoMural(novoAviso);
    }

    // 3. Disparar WhatsApp se selecionado
    if (notificarWhatsApp) {
      handleEnviarWhatsAppReal(textoWhatsAppPadronizado);
      registrarLogAuditoriaLgpd({
        tipo: 'whatsapp_recado',
        tipoLabel: `Recado Escolar (${assuntoAtual.titulo})`,
        studentId: currentStudent.id,
        studentNome: currentStudent.nome,
        turma: currentStudent.turma,
        remetenteNome,
        remetenteCargo,
        destinatarioNome,
        destinatarioContato: currentStudent.responsavelTelefone,
        canal: 'whatsapp',
        conteudoResumo: `[${assuntoAtual.titulo}] ${mensagemTexto.trim().slice(0, 100)}...`,
        conteudoIntegral: textoWhatsAppPadronizado,
        baseLegalLgpd: 'Art. 7º, Inciso V (Execução de Contrato e Comunicação Pedagógica) e Art. 14 da LGPD',
      });
    } else {
      registrarLogAuditoriaLgpd({
        tipo: 'comunicado_mural',
        tipoLabel: `Mural Escolar (${assuntoAtual.titulo})`,
        studentId: currentStudent.id,
        studentNome: currentStudent.nome,
        turma: currentStudent.turma,
        remetenteNome,
        remetenteCargo,
        destinatarioNome,
        destinatarioContato: currentStudent.responsavelTelefone,
        canal: 'app_mural',
        conteudoResumo: `[${assuntoAtual.titulo}] ${mensagemTexto.trim().slice(0, 100)}...`,
        conteudoIntegral: mensagemTexto.trim() + (observacaoExtra ? `\n\nObs: ${observacaoExtra}` : ''),
        baseLegalLgpd: 'Art. 14, §1º da Lei 13.709/18 (Comunicação Escolar do Menor)',
      });
    }

    setMensagemTexto('');
    setObservacaoExtra('');
    showToast('🚀 Aviso publicado no Mural e registrado no histórico com sucesso!');
  };

  const handleCurtirItem = (id: string) => {
    setCurtidasMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    showToast('❤️ Leitura confirmada com carinho!');
  };

  // Construção do Feed Unificado
  interface FeedItem {
    id: string;
    tipo: 'diario' | 'recado' | 'mural';
    titulo: string;
    origem: string;
    origemTipo: 'professor' | 'familia' | 'coordenacao';
    dataHora: string;
    conteudo: string;
    textoFormatadoWhatsApp?: string;
    categoria: string;
    icone: string;
    lido?: boolean;
    studentNome?: string;
    dadosExtras?: any;
  }

  const feedUnificado: FeedItem[] = [
    // Recados
    ...recados.map((r) => ({
      id: r.id,
      tipo: 'recado' as const,
      titulo: `Recado: ${r.destinatarioNome}`,
      origem: r.remetenteNome,
      origemTipo: r.remetenteTipo,
      dataHora: `${r.data} às ${r.horario}`,
      conteudo: r.mensagem,
      textoFormatadoWhatsApp: `💬 *RECADO ESCOLAR*\nDe: ${r.remetenteNome}\nPara: ${r.destinatarioNome}\nData: ${r.data}\n\n"${r.mensagem}"`,
      categoria: r.categoria,
      icone: r.categoria === 'saida_autorizada' ? '🚪' : r.categoria === 'saude' ? '🩺' : '💬',
      lido: r.lido,
      studentNome: r.studentNome,
    })),
    // Diários Recebidos
    ...diarios.map((d) => ({
      id: d.id,
      tipo: 'diario' as const,
      titulo: `🎓 Diário de Aula Consolidado (${d.horarioEncerramento})`,
      origem: d.professoraNome,
      origemTipo: 'professor' as const,
      dataHora: `${d.data} às ${d.horarioEncerramento}`,
      conteudo: `⏱️ Tempo em aula: ${d.tempoEmAula} | 💧 Água: ${d.aguaMl}ml | 🍼 Mamadeiras: ${d.mamadeirasContador} | 💤 ${d.soneca} | 🧷 ${d.fralda}`,
      textoFormatadoWhatsApp: d.textoWhatsApp,
      categoria: 'diario_rotina',
      icone: '📋',
      lido: true,
      studentNome: d.studentNome,
      dadosExtras: d,
    })),
    // Avisos do Mural
    ...muralAvisos.map((m) => ({
      id: m.id,
      tipo: 'mural' as const,
      titulo: m.titulo,
      origem: m.autorNome,
      origemTipo: 'coordenacao' as const,
      dataHora: m.criadoEm || m.data,
      conteudo: m.conteudo,
      textoFormatadoWhatsApp: `📢 *COMUNICADO OFICIAL DO MURAL*\n📌 ${m.titulo}\nData: ${m.data}\nPublicado por: ${m.autorNome}\n\n${m.conteudo}`,
      categoria: m.categoria,
      icone: '📢',
      lido: true,
      studentNome: currentStudent.nome,
    })),
  ].sort((a, b) => b.id.localeCompare(a.id));

  // Filtros do Feed
  const feedFiltrado = feedUnificado.filter((item) => {
    // Filtro por tipo
    if (filtroTipo === 'diarios' && item.tipo !== 'diario') return false;
    if (filtroTipo === 'recados_pais' && (item.tipo !== 'recado' || item.origemTipo !== 'familia')) return false;
    if (filtroTipo === 'recados_pro' && (item.tipo !== 'recado' || item.origemTipo !== 'professor')) return false;
    if (filtroTipo === 'avisos_mural' && item.tipo !== 'mural') return false;

    // Filtro por texto
    if (filtroBusca) {
      const matchBusca =
        item.conteudo.toLowerCase().includes(filtroBusca.toLowerCase()) ||
        item.titulo.toLowerCase().includes(filtroBusca.toLowerCase()) ||
        item.origem.toLowerCase().includes(filtroBusca.toLowerCase());
      if (!matchBusca) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* TOAST FLUTUANTE */}
      {feedbackToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="text-amber-400" size={16} />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 1. CABEÇALHO UNIFICADO & STATUS DO ALUNO */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Phone size={18} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20">
                MURAL OFICIAL & CENTRAL WHATSAPP UNIFICADOS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Mural de Avisos, Recados & WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Comunicação padronizada no formato oficial de WhatsApp com reconhecimento de voz por microfone, temas rápidos e histórico sincronizado em tempo real.
            </p>
          </div>

          {/* Card do Aluno Selecionado e Alternador de Papel */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 text-xs">
              <img
                src={currentStudent.fotoUrl}
                alt={currentStudent.nome}
                className="w-11 h-11 rounded-xl object-cover border border-white/40 shadow-xs"
              />
              <div>
                <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">
                  ALUNO(A) ATIVO(A)
                </span>
                <p className="font-black text-white text-sm leading-tight">{currentStudent.nome}</p>
                <p className="text-[11px] text-slate-300">{currentStudent.turma}</p>
              </div>
            </div>

            {onToggleRole && (
              <button
                onClick={() => onToggleRole(userRole === 'professor' ? 'familia' : 'professor')}
                className="px-3.5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-amber-950 font-black text-xs transition shadow-md cursor-pointer flex items-center gap-2"
                title="Alternar entre perfil da Professora e da Família"
              >
                <Eye size={14} />
                <span>{userRole === 'professor' ? 'Perfil: Educadora' : 'Perfil: Família'}</span>
                <span className="text-[10px] font-bold bg-amber-950/15 px-1.5 py-0.5 rounded">Trocar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. GRID PRINCIPAL: FORMULÁRIO DE ENVIO COM MICROFONE (ESQUERDA) + PRÉVIA WHATSAPP AO VIVO (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: CONFIGURAR INFORMATIVO / RECADO (7 Colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            {/* Título da Seção */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✍️</span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    {userRole === 'familia'
                      ? 'Escrever Recado para a Educadora'
                      : 'Configurar Informativo / Aviso do Dia'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {userRole === 'familia'
                      ? `De: ${currentStudent.responsavelNome} → Para: Profª. ${currentStudent.professoraTitular}`
                      : `De: Profª. ${currentStudent.professoraTitular} → Para: ${currentStudent.responsavelNome}`}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Padronizado WhatsApp
              </span>
            </div>

            {/* SELEÇÃO DE ASSUNTOS DOS RECADOS (CHIPS RÁPIDOS) */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-600 flex items-center justify-between">
                <span>1. Escolha o Assunto do Recado:</span>
                <span className="text-[10px] text-indigo-600 font-bold lowercase">
                  ({ASSUNTOS_DISPONIVEIS.length} tópicos rápidos)
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ASSUNTOS_DISPONIVEIS.map((assunto) => {
                  const isSelected = assunto.id === assuntoSelecionadoId;
                  return (
                    <button
                      key={assunto.id}
                      type="button"
                      onClick={() => {
                        setAssuntoSelecionadoId(assunto.id);
                        // Sugere o primeiro template se o texto estiver vazio
                        const templates =
                          userRole === 'familia'
                            ? assunto.templatesFamilia
                            : assunto.templatesProfessor;
                        if (!mensagemTexto && templates.length > 0) {
                          setMensagemTexto(templates[0]);
                        }
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? `${assunto.corBadge} border-current shadow-xs font-black ring-2 ring-indigo-500/20`
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-base">{assunto.icone}</span>
                        <span className="truncate">{assunto.titulo}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">
                        {assunto.descricao}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MODELOS DE 1 CLIQUE PARA O ASSUNTO SELECIONADO */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 block flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                <span>Modelos Prontos para "{assuntoAtual.titulo}":</span>
              </span>
              <div className="flex flex-col gap-1.5">
                {(userRole === 'familia'
                  ? assuntoAtual.templatesFamilia
                  : assuntoAtual.templatesProfessor
                ).map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMensagemTexto(tpl)}
                    className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 hover:border-indigo-200 rounded-xl text-left text-xs text-slate-700 transition cursor-pointer flex items-start gap-2 shadow-2xs group"
                  >
                    <span className="text-indigo-500 text-xs font-bold group-hover:scale-110 transition">➔</span>
                    <span className="flex-1 leading-snug">{tpl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CAMPO DE TEXTO COM MICROFONE INTEGRADO */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-slate-700 block">
                  2. Mensagem ou Observações Extras:
                </label>
                <span className="text-[10px] text-slate-400">
                  {mensagemTexto.length} caracteres
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={mensagemTexto}
                  onChange={(e) => setMensagemTexto(e.target.value)}
                  placeholder={
                    userRole === 'familia'
                      ? 'Ex: Bom dia, prô! A Mariana acordou super disposta. Deixei a papinha e o mordedor na bolsa lateral...'
                      : 'Ex: O Pedrinho passou o dia muito alegre e participativo. Comeu toda a frutinha e descansou bem no soninho...'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 pr-14 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition resize-none leading-relaxed"
                />

                {/* BOTÃO DO MICROFONE DENTRO DO CAMPO */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`absolute right-3 bottom-3.5 p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                  title={isListening ? 'Parar gravação de voz' : 'Falar por microfone / Ditado por voz'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              {isListening && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
                  <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping" />
                  <span>🎙️ Ouvindo... Fale seu recado que o texto será inserido automaticamente.</span>
                </div>
              )}
            </div>

            {/* OPÇÕES ADICIONAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center gap-2.5 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl cursor-pointer hover:bg-indigo-50 transition">
                <input
                  type="checkbox"
                  checked={publicarNoMuralGeral}
                  onChange={(e) => setPublicarNoMuralGeral(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded accent-indigo-600 cursor-pointer"
                />
                <div>
                  <span className="font-black text-indigo-950 text-xs block">
                    Publicar no Mural & Feed do App
                  </span>
                  <span className="text-[10px] text-indigo-800">
                    Fica salvo internamente para consulta dos cuidadores
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl cursor-pointer hover:bg-emerald-50 transition">
                <input
                  type="checkbox"
                  checked={notificarWhatsApp}
                  onChange={(e) => setNotificarWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                />
                <div>
                  <span className="font-black text-emerald-950 text-xs block">
                    Enviar também via WhatsApp (Opcional)
                  </span>
                  <span className="text-[10px] text-emerald-800">
                    Abre mensagem formatada no app externo
                  </span>
                </div>
              </label>
            </div>

            {/* BOTÕES DE AÇÃO PADRONIZADOS (FOTOS 31 e 32) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              {/* 1. Gravar no App / Mural */}
              <button
                type="button"
                onClick={() => handleSalvarNoLogEMural()}
                className="py-3 px-3 bg-indigo-700 hover:bg-indigo-800 active:scale-98 text-white font-black text-xs rounded-2xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 size={14} />
                <span>Gravar no Mural & App</span>
              </button>

              {/* 2. Copiar Texto Formatado */}
              <button
                type="button"
                onClick={() => handleCopiarTexto('form_atual', textoWhatsAppPadronizado)}
                className="py-3 px-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-black text-xs rounded-2xl transition border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'form_atual' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedId === 'form_atual' ? 'Copiado!' : 'Copiar Texto Formatado'}</span>
              </button>

              {/* 3. Enviar p/ WhatsApp Externo */}
              <button
                type="button"
                onClick={() => handleEnviarWhatsAppReal()}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-2xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone size={14} />
                <span>📲 Abrir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: PRÉVIA EM FORMATO WHATSAPP REAL (FOTOS 31 e 32) (5 Colunas) */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="bg-[#0b141a] rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
            {/* CABEÇALHO DO CHAT WHATSAPP */}
            <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentStudent.fotoUrl}
                    alt={currentStudent.nome}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-400/50"
                  />
                  <span className="w-3 h-3 bg-emerald-500 rounded-full absolute bottom-0 right-0 border-2 border-[#1f2c34]" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white leading-tight">
                    Grupo de Cuidados — {currentStudent.nome}
                  </h4>
                  <p className="text-[10px] text-emerald-400">
                    Visto por último hoje no Anjo Cuidador
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded-full font-mono">
                  {horaAgora}
                </span>
              </div>
            </div>

            {/* ÁREA DE MENSAGENS COM BALÃO VERDE WHATSAPP (#dcf8c6 no modo clássico) */}
            <div
              className="p-4 space-y-3 min-h-[300px] flex flex-col justify-end"
              style={{
                backgroundColor: '#0c1317',
                backgroundImage:
                  'radial-gradient(#1f2c34 0.75px, transparent 0.75px), radial-gradient(#1f2c34 0.75px, #0c1317 0.75px)',
                backgroundSize: '30px 30px',
                backgroundPosition: '0 0, 15px 15px',
              }}
            >
              <div className="text-center my-1">
                <span className="text-[9px] font-bold bg-[#182229] text-slate-400 px-3 py-1 rounded-md shadow-xs">
                  HOJE
                </span>
              </div>

              {/* BALÃO DA MENSAGEM PADRONIZADA (Fundo Verde Suave WhatsApp) */}
              <div className="self-end max-w-[94%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 shadow-md border border-emerald-200/50 space-y-2 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-emerald-900/10 pb-1 text-[10px] font-bold text-emerald-900">
                  <span>{assuntoAtual.icone} {assuntoAtual.titulo}</span>
                  <span className="text-emerald-800">{userRole === 'familia' ? 'Família' : 'Educadora'}</span>
                </div>

                <div className="font-mono text-[11px] sm:text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {textoWhatsAppPadronizado}
                </div>

                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-900/70 font-sans pt-1">
                  <span>{horaAgora}</span>
                  <span className="text-sky-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* BARRA INFERIOR DE DICA DE USO */}
            <div className="bg-[#1f2c34] p-3 text-[11px] text-slate-300 border-t border-slate-700/60 flex items-start gap-2">
              <span className="text-emerald-400 font-bold">💡</span>
              <p className="leading-tight">
                <strong>Como utilizar no celular:</strong> Basta clicar em <em>Copiar Texto Formatado</em> ou <em>Enviar p/ WhatsApp Real</em>. O texto já vai com marcadores e emojis perfeitamente alinhados!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEÇÃO INFERIOR: HISTÓRICO UNIFICADO DE AVISOS, DIÁRIOS & RECADOS DE MÃO DUPLA */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        {/* BARRA DE TÍTULO & FILTROS POR CHIP */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={20} />
              <span>Linha do Tempo Unificada de Comunicação & Diários</span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {feedFiltrado.length} registros
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Histórico unificado com recados dos pais, diários consolidados de fechamento de aula e comunicados oficiais.
            </p>
          </div>

          {/* BUSCA RÁPIDA */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              placeholder="Buscar no histórico..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* CHIPS DE FILTRAGEM RÁPIDA */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filtroTipo === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔘 Todos os Registros ({feedUnificado.length})
          </button>
          <button
            onClick={() => setFiltroTipo('diarios')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filtroTipo === 'diarios'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>📋 Diários de Aula ({diarios.length})</span>
          </button>
          <button
            onClick={() => setFiltroTipo('recados_pais')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filtroTipo === 'recados_pais'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <span>💬 Recados da Família ({recados.filter((r) => r.remetenteTipo === 'familia').length})</span>
          </button>
          <button
            onClick={() => setFiltroTipo('recados_pro')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filtroTipo === 'recados_pro'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>👩‍🏫 Recados da Prô ({recados.filter((r) => r.remetenteTipo === 'professor').length})</span>
          </button>
          <button
            onClick={() => setFiltroTipo('avisos_mural')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filtroTipo === 'avisos_mural'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <span>📢 Mural da Turma ({muralAvisos.length})</span>
          </button>
        </div>

        {/* FEED DE CARDS EM PADRÃO WHATSAPP */}
        <div className="space-y-3.5">
          {feedFiltrado.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 space-y-2">
              <MessageSquare size={32} className="mx-auto text-slate-300" />
              <p className="font-bold text-xs">Nenhum aviso ou recado encontrado com os filtros atuais.</p>
            </div>
          ) : (
            feedFiltrado.map((item) => {
              const isFamilia = item.origemTipo === 'familia';
              const isDiario = item.tipo === 'diario';
              const curtidas = curtidasMap[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition space-y-3 shadow-2xs hover:shadow-xs ${
                    isDiario
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isFamilia
                      ? 'bg-indigo-50/30 border-indigo-200'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* TOPO DO CARD */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                          isDiario
                            ? 'bg-emerald-600 text-white'
                            : isFamilia
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {item.icone}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs sm:text-sm text-slate-900">{item.titulo}</strong>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isDiario
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                : isFamilia
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                                : 'bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                          >
                            {isDiario ? 'Diário Consolidado' : isFamilia ? 'Enviado pelos Pais' : 'Educadora / Mural'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          De: <strong>{item.origem}</strong> • 📅 {item.dataHora}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                      <button
                        onClick={() => handleCurtirItem(item.id)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-xl border border-slate-200 transition flex items-center gap-1 cursor-pointer text-xs"
                        title="Confirmar leitura / curtir"
                      >
                        <Heart size={13} className="fill-rose-500 text-rose-500" />
                        <span>{curtidas}</span>
                      </button>
                    </div>
                  </div>

                  {/* CONTEÚDO DO AVISO / BALÃO WHATSAPP */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-xs sm:text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
                    {item.textoFormatadoWhatsApp || item.conteudo}
                  </div>

                  {/* AÇÕES RÁPIDAS NO CARD */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Registrado no Diário & Histórico Oficial</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopiarTexto(
                            item.id,
                            item.textoFormatadoWhatsApp || item.conteudo
                          )
                        }
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        {copiedId === item.id ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={() =>
                          handleEnviarWhatsAppReal(
                            item.textoFormatadoWhatsApp || item.conteudo
                          )
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                      >
                        <Phone size={13} />
                        <span>Enviar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
