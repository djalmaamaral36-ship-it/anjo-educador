export interface HydrationRecord {
  id: string;
  studentId: string;
  amountMl: number;
  timestamp: string;
}

export interface AlimentacaoRecord {
  id: string;
  studentId: string;
  foodType: string;
  acceptance: string;
  timestamp: string;
}

export interface HumorRecord {
  id: string;
  studentId: string;
  mood: string;
  note: string;
  timestamp: string;
}

export interface HealthRecord {
  id: string;
  studentId: string;
  sleep: string;
  diaper: string;
  temp: string;
  timestamp: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'professor' | 'familia' | 'coordenacao';
}

export interface ChildProfile {
  id: string;
  nome: string;
  dataNascimento: string;
  idadeMeses?: number;
  turma: string;
  sala: string;
  fotoUrl?: string;
  statusBncc: string;
}

export type LembrancaCategory = 'conquista' | 'atividade' | 'foto' | 'evolucao' | 'relatorio';

export interface LembrancaMoment {
  id: string;
  studentId: string;
  titulo: string;
  tipo: LembrancaCategory;
  tipoLabel: string;
  data: string;
  dataIso?: string;
  descricao: string;
  fotoUrl?: string;
  foco: string[];
  valores: string[];
  gestosAfeto: {
    label: string;
    count: number;
  }[];
  postarRedesSociais?: boolean;
  fotoOcultaRedes?: boolean;
  mensagemAfetoRedes?: string;
  createdAt?: string;
}

export interface TreeStatus {
  estacao: string;
  estacaoSubtitulo: string;
  vitalidadeTexto: string;
  vitalidadeStatus: string;
  soloStatus: string;
  porcentagemCultivo: number;
  falaArvore: string;
  folhasCultivadas: number;
  valoresDesabrochados: number;
  frutosColhidos: number;
  gestosDeAfeto: number;
}

export interface DailyNarrative {
  data: string;
  titulo: string;
  saudacao: string;
  corpo: string;
  vivencias: string;
  momentosSalvos: number;
  fotografias: number;
  atividadesArte: number;
  diasDescoberta: number;
}

export interface MethodLivroItem {
  letra: 'L' | 'I' | 'V' | 'R' | 'O';
  palavra: string;
  descricao: string;
}

// Rotina Consolidada
export interface DailyRoutineSummary {
  date: string;
  hidratacaoTotalMl: number;
  refeicoes: {
    tipo: string;
    aceitacao: string;
    hora: string;
  }[];
  sonoMinutosTotal: number;
  trocasFraldaTotal: number;
  temperaturaRecente?: string;
  humorPredominante?: string;
}

// PAX Portal de Tranquilidade (Painel dos Pais / Responsáveis)
export interface StudentPaxData {
  id: string;
  nome: string;
  nascimento: string;
  idadeStr: string;
  responsavelNome: string;
  responsavelParentesco: string;
  responsavelTelefone: string;
  professoraTitular: string;
  turma: string;
  fotoUrl: string;
  marcos: string[];
  alergias: string[];
  presenca: {
    status: 'sem_aula' | 'em_aula' | 'encerrada' | 'ausente';
    titulo: string;
    descricao: string;
    tempoEmAulaFormatado: string;
    isTimerRunning?: boolean;
    startTimestamp?: number | null;
    totalPausedSeconds?: number;
  };
  governanca: {
    conformidadePercent: number;
    qualidadePercent: number;
    rotinasRealizadasHoje: number;
    rotinasRecusasHoje: number;
    statusRotinaBadge: string;
    statusRotinaTitulo: string;
    statusRotinaDescricao: string;
    responsavelClasse: string;
    ultimoContatoApi: string;
  };
  medicamentos: {
    id: string;
    nome: string;
    horario: string;
    dosagem: string;
    instrucoes: string;
    ativo: boolean;
    turno?: 'todos' | 'manha' | 'tarde' | 'noite' | 'madrugada';
    ministradoHoje?: boolean;
    ministradoPor?: string;
    ministradoHorario?: string;
    observacaoMinistracao?: string;
    cadastradoPor?: string;
    cadastradoEm?: string;
    pinAutorizado?: boolean;
    anexoReceitaUrl?: string;
    estoqueFrascos?: number;
    suspenso?: boolean;
  }[];
  agua: {
    consumoMl: number;
    metaMl: number;
    porcentagemMeta: number;
    coposServidos: number;
    historicoBarra: number[];
  };
  alimentacao: {
    mamadeirasServidas: number;
    mamadeirasMlTotal: number;
    refeicoes: {
      nome: string;
      status: string;
      horario?: string;
      observacao?: string;
    }[];
  };
  humor: {
    estado: string;
    turno: string;
    observacao: string;
  };
  saudeCards: {
    soneca: { valor: string; periodo: string };
    fraldas: { valor: string; periodo: string };
    mamadeiras: { valor: string; periodo: string };
    hidratacao: { valor: string; copos: string; periodo: string };
    temperatura: { valor: string; status: string };
    peso: { valor: string; status: string };
    humor: { valor: string; periodo: string };
  };
  auditoriaLinhaDoTempo: {
    id: string;
    hora: string;
    tipo: 'alimentacao' | 'saude' | 'hidratacao' | 'fralda' | 'sono' | 'presenca' | 'pedagogico' | 'higiene' | 'comportamento';
    titulo: string;
    descricao: string;
    responsavel: string;
    verificado: boolean;
  }[];
  ocorrenciasHoje?: OcorrenciaEscolar[];
  codigoAl?: string;
  pinAcesso?: string;
  responsavelEmail?: string;
  pediatra?: {
    nome: string;
    telefone: string;
    especialidade: string;
  };
  diretrizesCuidados?: string;
  faltasTotais?: number;
  presenteHoje?: boolean;
  cuidadosEspeciais?: boolean;
  higieneChecklist?: {
    trocaRoupas?: 'Realizado' | 'Pendente';
    escovacaoDentes?: 'Realizado' | 'Pendente';
    maosERosto?: 'Realizado' | 'Pendente';
    banhoTomado?: 'Realizado' | 'Pendente';
    pomadaProtetor?: 'Realizado' | 'Pendente';
  };
}

export interface OcorrenciaEscolar {
  id: string;
  studentId: string;
  studentNome: string;
  tipo: 'febre' | 'queda_machucado' | 'recusa_alimentar' | 'alergia' | 'vomito_malestar' | 'comportamento' | 'outro';
  tipoLabel: string;
  gravidade: 'informativo' | 'moderado' | 'urgente';
  horario: string;
  data: string;
  descricao: string;
  condutaTomada: string;
  educadoraResponsavel: string;
  notificarPaisWhatsApp: boolean;
  notificadoEm?: string;
  status: 'registrada' | 'em_acompanhamento' | 'resolvida';
}

export interface EventoEscolar {
  id: string;
  titulo: string;
  tipo: string;
  professorResponsavel: string;
  turmas: string[];
  publicoAlvoTexto: string;
  totalAlunosImpactados: number;
  local: string;
  data: string;
  horario: string;
  observacoes: string;
  emMassa: boolean;
  notificarWhatsApp: boolean;
  criadoEm: string;
  alunoId?: string;
}

export interface RegrasComunicadoWhatsApp {
  rotinasPendentes: boolean;
  alimentacaoCuidados: boolean;
  saudeSonoFralda: boolean;
  diarioAulaResumo: boolean;
}

export type CategoriaVinculo = 'familiares' | 'educadores' | 'direcao';

export interface MembroVinculo {
  id: string;
  nome: string;
  tituloExibicao: string;
  cargoBadge: string;
  categoria: CategoriaVinculo;
  whatsapp: string;
  sala: string;
  email: string;
  tipoPapel: 'responsavel_secundario' | 'professor_titular' | 'pais_responsaveis';
  papelTitulo: string;
  papelDescricao: string;
  pinAcesso: string;
  notas: string;
  fotoUrl: string;
  regrasWhatsApp: RegrasComunicadoWhatsApp;
}

export interface DiarioRotinaRecebido {
  id: string;
  studentId: string;
  studentNome: string;
  turma: string;
  data: string;
  horarioEncerramento: string;
  professoraNome: string;
  tempoEmAula: string;
  aguaMl: number;
  mamadeirasContador: number;
  refeicaoTipo: string;
  aceitacao: string;
  humor: string;
  humorObs: string;
  soneca: string;
  fralda: string;
  temperatura: string;
  textoWhatsApp: string;
  destinatarioNome: string;
  destinatarioTelefone: string;
  enviadoWhatsApp: boolean;
  publicadoMural: boolean;
  criadoEm: string;
}

export interface AvisoMural {
  id: string;
  titulo: string;
  categoria: 'diario_rotina' | 'comunicado' | 'evento' | 'saude';
  turma: string;
  autorNome: string;
  data: string;
  conteudo: string;
  tags?: string[];
  destinatarios: string;
  studentId?: string;
  criadoEm: string;
}

export interface RecadoEscolar {
  id: string;
  studentId: string;
  studentNome: string;
  turma: string;
  remetenteTipo: 'professor' | 'familia';
  remetenteNome: string;
  remetenteCargo?: string;
  destinatarioNome: string;
  mensagem: string;
  data: string;
  horario: string;
  lido: boolean;
  categoria: 'geral' | 'saude' | 'medicamento' | 'recado_rapido' | 'saida_autorizada';
  enviadoWhatsApp?: boolean;
  criadoEm: string;
}

export interface LgpdConsentimento {
  id: string;
  studentId: string;
  studentNome: string;
  turma: string;
  responsavelNome: string;
  responsavelCpf: string;
  responsavelGrau: 'Mae' | 'Pai' | 'Responsavel_Legal' | 'Outro';
  responsavelTelefone: string;
  responsavelEmail?: string;
  aceitoEm: string; // ISO string
  aceitoEmFormatado: string;
  versaoTermo: string; // ex: "1.0/2026"
  ipOrigem?: string;
  dispositivoInfo?: string;
  hashAssinaturaDigital: string;
  status: 'ativo' | 'revogado';
  autorizacoes: {
    tratamentoDadosMenor: boolean; // Art. 14 LGPD
    comunicacaoWhatsAppERotina: boolean; // Notificações e diários
    registroSaudeEMedicamentos: boolean; // Art. 11 LGPD (Dados sensíveis de saúde)
    registroFotograficoPedagogico: boolean; // Fotos de atividades escolares restritas ao ambiente pedagógico
  };
  observacoes?: string;
}

export type TipoLgpdLog =
  | 'whatsapp_diario'
  | 'whatsapp_ocorrencia'
  | 'whatsapp_recado'
  | 'consentimento_assinado'
  | 'medicamento_ministrado'
  | 'autorizacao_retirada'
  | 'comunicado_mural';

export interface LgpdLogRegistro {
  id: string;
  tipo: TipoLgpdLog;
  tipoLabel: string;
  studentId: string;
  studentNome: string;
  turma: string;
  dataHoraFormatada: string;
  dataIso: string;
  remetenteNome: string;
  remetenteCargo: string;
  destinatarioNome: string;
  destinatarioContato: string;
  canal: 'whatsapp' | 'app_mural' | 'sistema';
  conteudoResumo: string;
  conteudoIntegral: string;
  hashIntegridade: string;
  baseLegalLgpd: string; // ex: "Art. 14, §1º da Lei 13.709/18 (Melhor Interesse da Criança)"
}

// Modelos do Álbum da 1ª Infância®
export * from './types/albumInfancia';

