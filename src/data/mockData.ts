import { Aluno, RotinaDia, RecadinhoTurma, MuralAviso } from '../types';

export const ALUNOS_MOCK: Aluno[] = [
  {
    id: '1',
    nome: 'Helena Silva',
    turma: 'Berçário II - Manhã',
    responsaveis: 'Mariana Silva (Mãe)',
    telefoneContato: '(14) 99751-9181',
    presente: true,
    recadinhoIndividual: 'Helena participou ativamente da roda de leitura hoje!'
  },
  {
    id: '2',
    nome: 'Arthur Oliveira',
    turma: 'Berçário II - Manhã',
    responsaveis: 'Carlos Oliveira (Pai)',
    telefoneContato: '(14) 99751-9181',
    presente: true,
    recadinhoIndividual: 'Arthur comeu toda a fruta no lanche da tarde.'
  },
  {
    id: '3',
    nome: 'Gabriel Santos',
    turma: 'Berçário II - Manhã',
    responsaveis: 'Fernanda Santos (Mãe)',
    telefoneContato: '(14) 99751-9181',
    presente: true,
    recadinhoIndividual: 'Dormiu 1h30 tranquilamente ao som de música suave.'
  },
  {
    id: '4',
    nome: 'Alice Pereira',
    turma: 'Berçário II - Manhã',
    responsaveis: 'Juliana Pereira (Mãe)',
    telefoneContato: '(14) 99751-9181',
    presente: true,
    recadinhoIndividual: ''
  },
  {
    id: '5',
    nome: 'Lucas Mendes',
    turma: 'Maternal I',
    responsaveis: 'Roberto Mendes (Pai)',
    telefoneContato: '(14) 99751-9181',
    presente: true,
    recadinhoIndividual: ''
  }
];

export const RECADINHO_TURMA_MOCK: RecadinhoTurma = {
  data: new Date().toISOString().split('T')[0],
  turma: 'Berçário II - Manhã',
  mensagem: 'Olá papais e mamães! Hoje tivemos um dia muito especial repleto de exploração sensorial com tintas atóxicas e contação de histórias com fantoches. Todos os pequenos interagiram super bem e se divertiram bastante. Lembrem-se de enviar a troca de roupa reserva amanhã! Com carinho, Tia Ana. 🌟🌸',
  educadoraNome: 'Profª. Ana Cláudia',
  destaque: true,
  categoria: 'Carinho & Elogio'
};

export const ROTINAS_MOCK: Record<string, RotinaDia> = {
  '1': {
    alunoId: '1',
    data: new Date().toISOString().split('T')[0],
    alimentacao: 'Excelente',
    sono: 'Dormiu bem',
    tempoSono: '1h 30min',
    higiene: 'Troca de fralda OK',
    evacuacao: 'Normal',
    humor: 'Alegre',
    atividades: ['Pintura a dedo', 'Roda de música', 'Parquinho'],
    recadinhoEducadora: 'Helena esteve super alegre hoje! Adorou a aula de música e cantou junto na rodinha.'
  },
  '2': {
    alunoId: '2',
    data: new Date().toISOString().split('T')[0],
    alimentacao: 'Boa',
    sono: 'Agitado',
    tempoSono: '45min',
    higiene: 'Troca de fralda OK',
    evacuacao: 'Normal',
    humor: 'Calmo',
    atividades: ['Montagem de blocos', 'Contação de história'],
    recadinhoEducadora: 'Arthur se concentrou muito na atividade de blocos coloridos. Teve um ótimo dia!'
  }
};

export const MURAIS_MOCK: MuralAviso[] = [
  {
    id: 'm1',
    titulo: 'Reunião de Pais e Mestres',
    conteudo: 'Convidamos todas as famílias para nossa reunião trimestral nesta sexta-feira às 18h.',
    data: '2026-09-18',
    autor: 'Direção Pedagógica',
    categoria: 'Evento'
  },
  {
    id: 'm2',
    titulo: 'Projeto Horta Escolar',
    conteudo: 'Solicitamos que traguem uma garrafinha PET higienizada para nossa oficina de cultivo.',
    data: '2026-09-16',
    autor: 'Profª. Ana Cláudia',
    categoria: 'Geral'
  }
];

export const CONTATO_SUPORTE = {
  nome: 'Djalma Amaral - Administração',
  email: 'djalmaamaral.adm@gmail.com',
  telefone: '(14) 99751-9181',
  suporteAtendimento: 'Segunda a Sexta, das 07h às 19h'
};
