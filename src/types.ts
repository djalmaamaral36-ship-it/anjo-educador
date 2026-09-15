export type PerfilUsuario = 'educadora' | 'coordenacao' | 'direcao' | 'familia';

export interface Aluno {
  id: string;
  nome: string;
  turma: string;
  foto?: string;
  responsaveis: string;
  telefoneContato: string;
  presente: boolean;
  recadinhoIndividual?: string;
  medicamentoAtivo?: {
    nome: string;
    dosagem: string;
    horario: string;
    instrucoes: string;
    autorizadoPor: string;
  };
}

export interface RotinaDia {
  alunoId: string;
  data: string;
  alimentacao: 'Excelente' | 'Boa' | 'Parcial' | 'Recusou';
  sono: 'Dormiu bem' | 'Agitado' | 'Não dormiu';
  tempoSono?: string;
  higiene: 'Troca de fralda OK' | 'Banho realizado' | 'Sem trocas';
  evacuacao: 'Normal' | 'Pastoso' | 'Ausente';
  humor: 'Alegre' | 'Calmo' | 'Sensível' | 'Choroso';
  atividades: string[];
  recadinhoEducadora: string;
  ocorrencia?: string;
  fotos?: string[];
}

export interface RecadinhoTurma {
  data: string;
  turma: string;
  mensagem: string;
  educadoraNome: string;
  destaque: boolean;
  categoria: 'Pedagógico' | 'Aviso Importante' | 'Carinho & Elogio' | 'Lembrete de Material';
}

export interface MuralAviso {
  id: string;
  titulo: string;
  conteudo: string;
  data: string;
  autor: string;
  categoria: 'Geral' | 'Evento' | 'Urgente';
}

export interface MensagemAura {
  id: string;
  remetente: 'usuario' | 'aura';
  texto: string;
  data: string;
  sugestaoBncc?: string;
  acoesRapidas?: string[];
}

export interface PlanejamentoSemanal {
  id: string;
  turma: string;
  semana: string;
  campoExperienciaBNCC: string;
  objetivosAprendizagem: string;
  atividadesPropostas: string;
  status: 'Pendente' | 'Aprovado' | 'Ajustes Solicitados';
  observacaoCoordenacao?: string;
}

export interface DadoFinanceiroPax {
  totalAlunosMatriculados: number;
  mensalidadesEmDia: number;
  mensalidadesPendentes: number;
  taxaPaxAtiva: boolean;
  receitaMensalEstimada: string;
}
