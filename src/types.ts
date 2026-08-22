/**
 * Types & Interfaces for Anjo Cuidador
 */

export type UserType = 'admin' | 'familiar' | 'familiar_admin' | 'familiar_convidado' | 'cuidador' | 'professor' | 'coordenador' | 'diretor' | 'desenvolvedor' | 'profissional' | 'convidado' | string;

export const isStaffUser = (user: { tipo?: string; nome?: string; parentesco?: string; id?: string } | null | undefined): boolean => {
  if (!user) return false;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('anjo_master_demonstracao_ativo') === 'true') {
    return true;
  }
  const t = (user.tipo || '').toLowerCase();
  const n = (user.nome || '').toLowerCase();
  const p = (user.parentesco || '').toLowerCase();
  const id = (user.id || '').toLowerCase();

  // Family members / parents / guardians are strictly NON-staff (read-only monitoring, no chronometer controls)
  if (
    t === 'familiar' ||
    t === 'familiar_admin' ||
    t === 'familiar_convidado' ||
    t === 'responsavel' ||
    p.includes('mãe') ||
    p.includes('mae') ||
    p.includes('pai') ||
    p.includes('familiar') ||
    p.includes('responsável') ||
    p.includes('responsavel') ||
    n.includes('mãe') ||
    n.includes('mae') ||
    n.includes('clarice') ||
    id.startsWith('user_mae_') ||
    id.startsWith('user_pai_')
  ) {
    return false;
  }

  return (
    t === 'admin' ||
    t === 'diretor' ||
    t === 'diretora' ||
    t === 'coordenador' ||
    t === 'coordenadora' ||
    t === 'admin_escolar' ||
    t === 'cuidador' ||
    t === 'cuidadora' ||
    t === 'professor' ||
    t === 'professora' ||
    t === 'educador' ||
    t === 'educadora' ||
    t === 'profissional' ||
    t === 'desenvolvedor' ||
    t === 'dev' ||
    t === 'developer' ||
    n.includes('prof') ||
    n.includes('educad') ||
    n.includes('cuidad') ||
    n.includes('diretor') ||
    n.includes('coordenad') ||
    (n.includes('admin') && t !== 'familiar') ||
    id.includes('cuidador') ||
    id.includes('professor') ||
    id.includes('educador') ||
    (id.includes('admin') && t !== 'familiar') ||
    id.includes('dev')
  );
};

export const isDirectorOrAdminUser = (user: { tipo?: string; nome?: string; parentesco?: string; id?: string } | null | undefined): boolean => {
  if (!user) return false;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('anjo_master_demonstracao_ativo') === 'true') {
    return true;
  }
  const t = (user.tipo || '').toLowerCase();
  const n = (user.nome || '').toLowerCase();
  const p = (user.parentesco || '').toLowerCase();

  // If user is explicitly set to family / mother / father / guest, they are NOT director
  if (t === 'familiar' || t === 'familiar_convidado' || t === 'familiar_admin' || p.includes('mãe') || p.includes('mae') || p.includes('pai') || p.includes('familiar') || p.includes('responsável')) {
    return false;
  }

  const id = (user.id || '').toLowerCase();

  return (
    t === 'admin' ||
    t === 'diretor' ||
    t === 'diretora' ||
    t === 'coordenador' ||
    t === 'coordenadora' ||
    t === 'admin_escolar' ||
    t === 'desenvolvedor' ||
    t === 'dev' ||
    t === 'developer' ||
    n.includes('diretor') ||
    n.includes('diretora') ||
    n.includes('coordenad') ||
    (id.includes('admin') && t !== 'familiar') ||
    id.includes('djalma')
  );
};

export const getRoleLabel = (user: { tipo?: string; nome?: string; parentesco?: string; id?: string } | null | undefined, isEscolar: boolean = true): string => {
  if (!user) return 'Usuário';
  const t = (user.tipo || '').toLowerCase();
  const n = (user.nome || '').toLowerCase();
  const p = (user.parentesco || '').toLowerCase();
  const id = (user.id || '').toLowerCase();

  // Prioritize family / parents if user is set to familiar or has parentesco/mãe/pai
  if (
    t === 'familiar' || 
    t === 'familiar_admin' || 
    t === 'familiar_convidado' || 
    p.includes('mãe') || 
    p.includes('mae') || 
    p.includes('pai') || 
    p.includes('responsável') || 
    p.includes('familiar')
  ) {
    if (t === 'familiar_convidado' || p.includes('convidado')) return 'Familiar Convidado';
    if (t === 'familiar_admin' || p.includes('admin')) return 'Familiar Responsável (Admin)';
    if (user.parentesco && !p.includes('dire')) return `Familiar (${user.parentesco})`;
    return 'Familiar (Mãe/Responsável)';
  }

  if (t === 'desenvolvedor' || t === 'dev' || n.includes('desenvolvedor') || n.includes('dev') || id.includes('dev')) {
    return 'Desenvolvedor Master';
  }
  if (t === 'diretor' || t === 'diretora' || (t === 'admin' && isEscolar) || n.includes('direç') || n.includes('diret')) {
    return isEscolar ? 'Direção Escolar' : 'Administrador';
  }
  if (t === 'coordenador' || t === 'coordenadora' || (t === 'profissional' && isEscolar) || n.includes('coordenad') || id === 'user_medico_1') {
    return isEscolar ? 'Coordenação Pedagógica' : 'Profissional / Saúde';
  }
  if (
    t === 'professor' ||
    t === 'professora' ||
    t === 'educador' ||
    t === 'educadora' ||
    t === 'cuidador' ||
    n.includes('prof') ||
    n.includes('educad') ||
    n.includes('cuidador') ||
    id.includes('cuidador')
  ) {
    return isEscolar ? 'Professora Titular / Educador' : 'Cuidador Sênior';
  }
  if (t === 'familiar_admin') {
    return 'Familiar Responsável (Admin)';
  }
  if (t === 'familiar_convidado' || t === 'convidado') {
    return 'Familiar Convidado';
  }
  if (t === 'familiar' || user.parentesco) {
    return user.parentesco ? `Familiar (${user.parentesco})` : 'Familiar Responsável';
  }
  return isEscolar ? 'Educador(a)' : 'Cuidador(a)';
};

export interface Usuario {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  tipo: UserType;
  foto?: string;
  parentesco?: string; // for family members (ex: 'Filho', 'Neto')
  observacoes?: string;
  pin?: string; // Optional custom 4-digit PIN for access
  salaAula?: string; // e.g. 'Todas' | 'Maternal I' | 'Maternal II' | 'Jardim I' | 'Jardim II'
}

export interface Classroom {
  id: string;
  name: string; // e.g. "Maternal I - A"
  emoji: string; // e.g. "🧸"
  ageGroup: string; // e.g. "2-3 anos"
  capacity?: number;
  description?: string;
}

export interface Idoso {
  id: string;
  nome: string;
  foto: string;
  dataNascimento: string; // YYYY-MM-DD
  condicoesMedicas: string[];
  alergias: string[];
  observacoes: string;
  peso?: number;
  salaAula?: string; // Classroom name e.g. "Maternal I - A"
  quarto?: string; // Room / classroom fallback
  contatoEmergencia: {
    nome: string;
    parentesco: string;
    telefone: string;
  };
  planoCuidado: string;
  medicoResponsavel?: {
    nome: string;
    especialidade: string;
    telefone: string;
  };
}

export type TaskType = 'alimentacao' | 'banho' | 'medicacao' | 'hidratacao' | 'consulta' | 'exame' | 'sono' | 'humor' | 'atividade_fisica' | 'sinais_vitais';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluido' | 'atrasado' | 'recusado';

export interface TarefaDiaria {
  id: string;
  idosoId: string;
  tipo: TaskType;
  titulo: string;
  descricao: string;
  horarioPrevisto: string; // "HH:MM"
  status: TaskStatus;
  concluidaEm?: string; // Locale time string or ISO string
  completadaPor?: string; // Name of Caregiver/User
  observacao?: string;
  detalhes?: any; // Task-specific state details (e.g. amount of food, pressure value)
}

export interface Medicamento {
  id: string;
  idosoId: string;
  nome: string;
  dosagem: string; // e.g. "1 comprimido", "5ml"
  frequência: string; // e.g. "Diário", "A cada 12h"
  horarios: string[]; // e.g. ["08:00", "20:00"]
  diasSemana: string[]; // e.g. ["Seg", "Ter", "Qua"...] or ["Todos"]
  observacoes: string;
  fotoEmbalagem?: string;
  status: 'ativo' | 'suspenso';
}

export interface CompromissoMedico {
  id: string;
  idosoId: string;
  tipo: 'consulta' | 'exame' | 'retorno' | 'fisioterapia' | 'vacina' | 'outros';
  titulo: string;
  medico: string;
  especialidade: string;
  local: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  observacoes: string;
  confirmadoFamiliar: boolean;
  alertasAtivos: boolean;
  status: 'agendado' | 'realizado' | 'cancelado';
  broadcastGroupId?: string;
}

export interface SinalVital {
  id: string;
  idosoId: string;
  pressaoArterial: string; // e.g. "120/80"
  glicemia: number; // e.g. 104 (mg/dL)
  tipoGlicemia?: 'jejum' | 'pos-prandial' | 'casual';
  temperatura: number; // e.g. 36.5
  frequenciaCardiaca: number; // e.g. 72
  saturacao: number; // e.g. 98
  peso?: number; // e.g. 70.5
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  registradoPor: string;
  observacoes: string;
  fralda?: string; // School mode only e.g., "Fez Cocô / Pomada"
  soneca?: string; // School mode only e.g., "Dormiu das 13h às 14h"
}

export interface RegistroHidratacao {
  id: string;
  idosoId: string;
  quantidadeMl: number; // amount taken (e.g., 200, 250)
  horario: string;
  data: string; // YYYY-MM-DD
  registradoPor: string;
}

export interface RegistroSono {
  id: string;
  idosoId: string;
  dormiuEm: string; // HH:MM
  acordouEm: string; // HH:MM
  horasTotais: number;
  qualidade: 'excelente' | 'boa' | 'regular' | 'ruim';
  interrupcoes: number; // counts of interruptions
  data: string; // YYYY-MM-DD
  observacoes: string;
}

export interface RegistroHumor {
  id: string;
  idosoId: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  estado: 'feliz' | 'calmo' | 'agitado' | 'triste' | 'confuso' | 'sonolento' | 'irritado';
  observacoes: string;
  registradoPor: string;
}

export interface RegistroAlimentacao {
  id: string;
  idosoId: string;
  refeicao: 'cafe_manha' | 'almoco' | 'lanche' | 'lanche_tarde' | 'jantar' | 'ceia' | 'mamadeira' | string;
  aceitacao: 'muito_bem' | 'pouco' | 'recusou';
  quantidadeMl?: number;
  horario: string;
  data: string; // YYYY-MM-DD
  observacoes: string;
  registradoPor: string;
}

export interface RegistroAtividade {
  id: string;
  idosoId: string;
  tipo: string; // e.g., 'Caminhada', 'Fisioterapia', 'Jogo Cognitivo', 'Banho de Sol'
  duracaoMinutos: number;
  data: string;
  horario: string;
  observacoes: string;
  fotoTrabalhinho?: string;
}

export interface NotificacaoSimulada {
  id: string;
  idosoId: string;
  familiarNome: string;
  telefoneDestino: string;
  tipoCompromisso: string;
  mensagem: string;
  status: 'enviada_whatsapp' | 'falha' | 'pendente';
  dataEnvio: string; // date-time string
  canal: 'WhatsApp' | 'Push' | 'SMS';
  isBroadcast?: boolean;
  destinatariosContagem?: number;
  destinatariosLista?: { idosoNome: string; familiarNome: string; telefone: string }[];
}

export interface CuidadoStatusDia {
  farolStatus: 'verde' | 'amarelo' | 'vermelho' | 'cinza';
  mensagem: string;
}

/**
 * Formata um número de telefone brasileiro para abertura de link do WhatsApp (wa.me)
 * Trata o caso comum de DDD 55 (Rio Grande do Sul) que causava falhas no prefixo 55 internacional,
 * além de validar comprimentos padrão (10 ou 11 dígitos para celular/fixo nacional).
 */
export function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  
  // Se possuir exatamente 10 ou 11 dígitos, é um número padrão sem o código do país prefixado
  // (ex: DDD + 9 ou 8 dígitos). Assim, forçamos o prefixo 55.
  if (cleaned.length === 10 || cleaned.length === 11) {
    return '55' + cleaned;
  }
  
  // Se já tiver 12 ou mais dígitos, assume-se que já conta com o DDI internacional brasileiro (55)
  if (cleaned.length >= 12) {
    return cleaned;
  }
  
  // Fallback geral
  return cleaned.startsWith('55') ? cleaned : '55' + cleaned;
}

export type GestoAfetoTipo = 'encanto' | 'amor' | 'brilho' | 'orgulho' | 'tesouro';

export interface GestoAfetoCount {
  encanto?: number; // "Que encanto!" ✨
  amor?: number; // "Feito com amor" ❤️
  brilho?: number; // "Puro brilho!" ⭐
  orgulho?: number; // "Orgulho da gente" 🌿
  tesouro?: number; // "Um tesouro!" 💎
}

export interface JornadaEvent {
  id: string;
  idosoId: string; // Student/Child ID
  tipo: 'foto' | 'atividade' | 'evolucao' | 'conquista' | 'relatorio' | 'data_importante' | 'rotina' | 'recado';
  titulo: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  imagemUrl?: string;
  dimensoesDesenvolvimento?: string[]; // e.g. ["Cognitivo", "Motor Fino", "Motor Amplo", "Social/Afetivo", "Linguagem"]
  likes?: number; // Reactions counter
  reagido?: boolean; // If parent has clicked and liked
  meuGestoAfeto?: GestoAfetoTipo; // Specific affective reaction chosen by current user
  gestosAfeto?: GestoAfetoCount; // Count breakdown per affective reaction
  registradoPor?: string;
  anexoNome?: string;
  valoresVivenciados?: string[]; // 🌟 Valores Vivenciados (e.g. "Compartilhou", "Foi gentil", etc.)
  inesquecivel?: boolean; // 💬 Momentos que Merecem ser Lembrados
}


