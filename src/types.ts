export interface Aluno {
  id: string;
  nome: string;
  turma: string;
  foto?: string;
  responsaveis: string;
  telefoneContato: string;
  presente: boolean;
  recadinhoIndividual?: string;
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
  recadinhoEducadora: string; // Recadinho final da educadora
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
