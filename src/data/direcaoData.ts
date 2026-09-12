export interface DocenteMembro {
  id: string;
  nome: string;
  cargo: 'DIRETOR' | 'COORDENADOR' | 'CUIDADOR' | 'DESENVOLVEDOR';
  cargoDescricao: string;
  pin: string;
  telefone: string;
  fotoUrl: string;
  turmasAtivas: string;
  descricao: string;
}

export interface TurmaEscolar {
  id: string;
  nome: string;
  faixaEtaria: string;
  icone: string;
  descricao: string;
  capacidade: number;
  lotacao: number;
  educadorTitular: string;
  alunos: string[];
}

export interface ReacaoFamiliar {
  id: string;
  autor: string;
  aluno: string;
  tipo: 'regada' | 'medicamento' | 'recado' | 'foto';
  mensagem: string;
  tempoAtras: string;
  origem: string;
}

export const INITIAL_DOCENTES: DocenteMembro[] = [
  {
    id: '1',
    nome: 'Nilva Amaral',
    cargo: 'DIRETOR',
    cargoDescricao: 'Diretora Geral da Escola',
    pin: '3031',
    telefone: '(11) 98765-3031',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    turmasAtivas: 'Nenhuma sala vinculada',
    descricao: 'Diretora Geral da Escola. Gestão executiva e administrativa.'
  },
  {
    id: '2',
    nome: 'Renata Vasconcelos',
    cargo: 'COORDENADOR',
    cargoDescricao: 'Coordenadora Pedagógica',
    pin: '1010',
    telefone: '(11) 98765-1010',
    fotoUrl: 'https://images.unsplash.com/photo-1580894732488-c7e6c3dc621b?w=150&auto=format&fit=crop&q=80',
    turmasAtivas: 'Nenhuma sala vinculada',
    descricao: 'Coordenadora Pedagógica da Educação Infantil.'
  },
  {
    id: '3',
    nome: 'Fabiana Moreira',
    cargo: 'COORDENADOR',
    cargoDescricao: 'Coordenadora de Saúde & Nutrição',
    pin: '2020',
    telefone: '(11) 98765-2020',
    fotoUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&auto=format&fit=crop&q=80',
    turmasAtivas: 'Nenhuma sala vinculada',
    descricao: 'Coordenadora de Saúde, Nutrição e Acolhimento Infantil.'
  },
  {
    id: '4',
    nome: 'Ana Silva',
    cargo: 'CUIDADOR',
    cargoDescricao: 'Professora Titular',
    pin: '5678',
    telefone: '(11) 91234-5678',
    fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    turmasAtivas: 'Berçário I - A',
    descricao: 'Professora titular responsável pelo Berçário I - A.'
  },
  {
    id: '5',
    nome: 'Carla Dias',
    cargo: 'CUIDADOR',
    cargoDescricao: 'Professora Titular',
    pin: '2222',
    telefone: '(11) 98765-2222',
    fotoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    turmasAtivas: 'Maternal I - A',
    descricao: 'Professora titular responsável pelo Maternal I - A.'
  },
  {
    id: '6',
    nome: 'Djalma Amaral',
    cargo: 'DESENVOLVEDOR',
    cargoDescricao: 'Desenvolvedor & Gestão de TI',
    pin: '9181',
    telefone: '(11) 98765-9181',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    turmasAtivas: 'Acesso Geral',
    descricao: 'Desenvolvedor do Sistema Anjo Educador e Governança de Dados.'
  }
];

export const INITIAL_TURMAS: TurmaEscolar[] = [
  {
    id: 'bercario_1_a',
    nome: 'Berçário I - A',
    faixaEtaria: '0-1 ANO',
    icone: '🍼',
    descricao: 'Turma de bebês com estimulação sensorial e cuidados contínuos.',
    capacidade: 5,
    lotacao: 5,
    educadorTitular: 'Ana Silva',
    alunos: ['Mariana Souza', 'Laura Costa', 'Beatriz Castro', 'Cecília Duarte', 'Alice Santos']
  },
  {
    id: 'maternal_1_a',
    nome: 'Maternal I - A',
    faixaEtaria: '2-3 ANOS',
    icone: '🧸',
    descricao: 'Turma de desenvolvimento motor, linguagem e socialização.',
    capacidade: 5,
    lotacao: 5,
    educadorTitular: 'Carla Dias',
    alunos: ['Enzo Alencar', 'Bernardo Teixeira', 'Lucas Oliveira', 'Helena Ferreira', 'Gabriel Mendes']
  }
];

export const INITIAL_REACOES: ReacaoFamiliar[] = [
  {
    id: 'r1',
    autor: 'Mãe de Mariana Souza',
    aluno: 'Mariana Souza',
    tipo: 'regada',
    mensagem: 'Mãe de Mariana Souza enviou uma Regada de Amor para parabenizar a dedicação dos professores hoje!',
    tempoAtras: '15 min atrás',
    origem: 'App do Familiar'
  },
  {
    id: 'r2',
    autor: 'Pai de Miguel Oliveira',
    aluno: 'Miguel Oliveira',
    tipo: 'medicamento',
    mensagem: 'Pai de Miguel Oliveira assinou eletronicamente o diário e confirmou envio de medicação diária.',
    tempoAtras: '1 hora atrás',
    origem: 'Autorização Confirmada'
  },
  {
    id: 'r3',
    autor: 'Família de Enzo Alencar',
    aluno: 'Enzo Alencar',
    tipo: 'recado',
    mensagem: 'Família de Enzo Alencar enviou mensagem de carinho aos educadores do Maternal pelo acolhimento.',
    tempoAtras: '2 horas atrás',
    origem: 'Mensagem Recebida'
  }
];
