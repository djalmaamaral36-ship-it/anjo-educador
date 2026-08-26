import { Classroom, Idoso, Usuario } from './types';

export const SALAS_INICIAIS: Classroom[] = [
  {
    id: 'sala_1',
    name: 'Berçário I - A',
    emoji: '🍼',
    ageGroup: '0-1 ano',
    capacity: 5,
    description: 'Turma de bebês com estimulação sensorial e cuidados contínuos.'
  },
  {
    id: 'sala_2',
    name: 'Maternal I - A',
    emoji: '🧸',
    ageGroup: '2-3 anos',
    capacity: 5,
    description: 'Turma de desenvolvimento motor, linguagem e socialização.'
  }
];

export const USUARIOS_SIMULADOS: Usuario[] = [
  // 1. Desenvolvedor Master
  {
    id: 'user_desenvolvedor_djalma',
    nome: 'Djalma Amaral (Desenvolvedor Dev)',
    email: 'djalmaamaral36@gmail.com',
    telefone: '(11) 98765-9181',
    tipo: 'desenvolvedor',
    parentesco: 'Desenvolvedor Master',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Desenvolvedor e Criador da Plataforma. Acesso total.',
    pin: '9181'
  },

  // 2. Diretor (1)
  {
    id: 'user_admin',
    nome: 'Nilva Amaral (Diretora)',
    email: 'nilva.amaral@escola.com',
    telefone: '(11) 98765-3031',
    tipo: 'diretor',
    parentesco: 'Diretora Geral',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Diretora Geral da Escola. Gestão executiva e administrativa.',
    pin: '3031'
  },

  // 3. Coordenadoras (2)
  {
    id: 'user_coordenador_1',
    nome: 'Renata Vasconcelos (Coordenadora Pedagógica)',
    email: 'renata.coord@escola.com',
    telefone: '(11) 98765-1010',
    tipo: 'coordenador',
    parentesco: 'Coordenação Pedagógica',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Coordenadora Pedagógica da Educação Infantil.',
    pin: '1010'
  },
  {
    id: 'user_coordenador_2',
    nome: 'Fabiana Moreira (Coordenadora de Cuidados e Rotina)',
    email: 'fabiana.coord@escola.com',
    telefone: '(11) 98765-2020',
    tipo: 'coordenador',
    parentesco: 'Coordenação de Cuidados',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Coordenadora de Saúde, Nutrição e Acolhimento Infantil.',
    pin: '2020'
  },

  // 4. Professores (2 Professores - 1 para cada classe)
  // Professora da Sala 1: Berçário I - A
  {
    id: 'user_cuidador_1',
    nome: 'Ana Silva (Professora Titular)',
    email: 'ana.silva@escola.com',
    telefone: '(11) 91234-5678',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular responsável pelo Berçário I - A.',
    pin: '5678',
    salaAula: 'Berçário I - A'
  },

  // Professora da Sala 2: Maternal I - A
  {
    id: 'user_cuidador_2',
    nome: 'Carla Dias (Professora Titular)',
    email: 'carla.dias@escola.com',
    telefone: '(11) 92222-2222',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular responsável pelo Maternal I - A.',
    pin: '2222',
    salaAula: 'Maternal I - A'
  },

  // 5. Pais / Mães / Responsáveis (10) - 1 para cada um dos 10 alunos
  // Pais da Sala 1: Berçário I - A (5 Alunos)
  {
    id: 'user_mae_clarice',
    nome: 'Clarice Souza (Mãe)',
    email: 'clarice.souza@gmail.com',
    telefone: '(11) 98765-4321',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da aluna Mariana Souza.',
    pin: '4321'
  },
  {
    id: 'user_pai_thiago',
    nome: 'Thiago Alencar (Pai)',
    email: 'thiago.alencar@outlook.com',
    telefone: '(11) 95555-4440',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do aluno Enzo Alencar.',
    pin: '4440'
  },
  {
    id: 'user_mae_beatriz',
    nome: 'Mariana Castro (Mãe)',
    email: 'mariana.castro@gmail.com',
    telefone: '(11) 99823-3310',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da aluna Beatriz Castro.',
    pin: '3310'
  },
  {
    id: 'user_pai_felipe',
    nome: 'Felipe Teixeira (Pai)',
    email: 'felipe.teixeira@gmail.com',
    telefone: '(11) 97123-4567',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do aluno Bernardo Teixeira.',
    pin: '4567'
  },
  {
    id: 'user_mae_camila',
    nome: 'Camila Duarte (Mãe)',
    email: 'camila.duarte@gmail.com',
    telefone: '(11) 98321-7654',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da aluna Cecília Duarte.',
    pin: '7654'
  },

  // Pais da Sala 2: Maternal I - A (5 Alunos)
  {
    id: 'user_mae_juliana',
    nome: 'Juliana Santos (Mãe)',
    email: 'juliana.santos@gmail.com',
    telefone: '(11) 98844-3322',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da aluna Alice Santos.',
    pin: '3322'
  },
  {
    id: 'user_pai_marcelo',
    nome: 'Marcelo Oliveira (Pai)',
    email: 'marcelo.oliveira@gmail.com',
    telefone: '(11) 97711-2233',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do aluno Lucas Oliveira.',
    pin: '2233'
  },
  {
    id: 'user_mae_patricia',
    nome: 'Patrícia Ferreira (Mãe)',
    email: 'patricia.ferreira@gmail.com',
    telefone: '(11) 96622-3344',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da aluna Helena Ferreira.',
    pin: '3344'
  },
  {
    id: 'user_pai_rodrigo',
    nome: 'Rodrigo Mendes (Pai)',
    email: 'rodrigo.mendes@gmail.com',
    telefone: '(11) 95533-4455',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do aluno Gabriel Mendes.',
    pin: '4455'
  },
  {
    id: 'user_mae_larissa',
    nome: 'Larissa Costa (Mãe)',
    email: 'larissa.costa@gmail.com',
    telefone: '(11) 94455-6677',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da aluna Laura Costa.',
    pin: '6677'
  }
];

export const IDOSOS_INICIAIS: Idoso[] = [
  // --- SALA 1: Berçário I - A (5 Alunos) ---
  {
    id: 'aluno_1',
    nome: 'Mariana Souza',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '12/10/2023',
    condicoesMedicas: ['Soneca após o almoço', 'Em fase de primeiros dentinhos'],
    alergias: ['Leite Integral (lactose)'],
    observacoes: 'Gosta de dormir com seu paninho azul.',
    contatoEmergencia: {
      nome: 'Clarice Souza',
      parentesco: 'Mãe',
      telefone: '(11) 98765-4321'
    },
    planoCuidado: 'Oferecer água regularmente e verificar troca de fralda.',
    medicoResponsavel: {
      nome: 'Dra. Luana Peixoto',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98888-7777'
    }
  },
  {
    id: 'aluno_2',
    nome: 'Enzo Alencar',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '15/03/2023',
    condicoesMedicas: ['Engatinhando com agilidade'],
    alergias: ['Frutos Vermelhos'],
    observacoes: 'Adora brinquedos com músicas e cores vivas.',
    contatoEmergencia: {
      nome: 'Thiago Alencar',
      parentesco: 'Pai',
      telefone: '(11) 95555-4440'
    },
    planoCuidado: 'Estimulação motora e alimentação orientada.',
    medicoResponsavel: {
      nome: 'Dr. Lucas Mendes',
      especialidade: 'Pediatra',
      telefone: '(11) 97777-6666'
    }
  },
  {
    id: 'aluno_3',
    nome: 'Beatriz Castro',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '18/07/2023',
    condicoesMedicas: ['Nenhuma observação clínica relevante'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Muito tranquila e risonha durante as atividades.',
    contatoEmergencia: {
      nome: 'Mariana Castro',
      parentesco: 'Mãe',
      telefone: '(11) 99823-3310'
    },
    planoCuidado: 'Estimulação sensorial e contação de histórias.',
    medicoResponsavel: {
      nome: 'Dra. Patrícia Faro',
      especialidade: 'Pediatra',
      telefone: '(11) 99342-8888'
    }
  },
  {
    id: 'aluno_4',
    nome: 'Bernardo Teixeira',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '05/09/2023',
    condicoesMedicas: ['Refluxo leve fisiológico'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Manter elevado 20 minutos após mamadas.',
    contatoEmergencia: {
      nome: 'Felipe Teixeira',
      parentesco: 'Pai',
      telefone: '(11) 97123-4567'
    },
    planoCuidado: 'Cuidados pós-alimentação e sonecas regulares.',
    medicoResponsavel: {
      nome: 'Dr. Marcos Santos',
      especialidade: 'Pediatra',
      telefone: '(11) 98777-1122'
    }
  },
  {
    id: 'aluno_5',
    nome: 'Cecília Duarte',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '22/11/2023',
    condicoesMedicas: ['Adaptação recente'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Gosta de ouvir canções de ninar para dormir.',
    contatoEmergencia: {
      nome: 'Camila Duarte',
      parentesco: 'Mãe',
      telefone: '(11) 98321-7654'
    },
    planoCuidado: 'Acolhimento afetivo e rotina de sono calma.',
    medicoResponsavel: {
      nome: 'Dra. Fernanda Lins',
      especialidade: 'Pediatra',
      telefone: '(11) 97666-5544'
    }
  },

  // --- SALA 2: Maternal I - A (5 Alunos) ---
  {
    id: 'aluno_6',
    nome: 'Alice Santos',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '10/05/2021',
    condicoesMedicas: ['Em processo de desfralde diurno'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Adora pintar com tinta guache e brincar na pracinha.',
    contatoEmergencia: {
      nome: 'Juliana Santos',
      parentesco: 'Mãe',
      telefone: '(11) 98844-3322'
    },
    planoCuidado: 'Incentivo para ir ao banheiro a cada 2h e atividades lúdicas.',
    medicoResponsavel: {
      nome: 'Dr. Roberto Kardec',
      especialidade: 'Pediatra',
      telefone: '(11) 99999-8888'
    }
  },
  {
    id: 'aluno_7',
    nome: 'Lucas Oliveira',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '14/02/2021',
    condicoesMedicas: ['Muito ativo e comunicativo'],
    alergias: ['Amendoim'],
    observacoes: 'Gosta de blocos de montar e dinossauros.',
    contatoEmergencia: {
      nome: 'Marcelo Oliveira',
      parentesco: 'Pai',
      telefone: '(11) 97711-2233'
    },
    planoCuidado: 'Restrição a amendoim e estímulo psicomotor.',
    medicoResponsavel: {
      nome: 'Dra. Vanessa Luz',
      especialidade: 'Pediatra',
      telefone: '(11) 98877-3311'
    }
  },
  {
    id: 'aluno_8',
    nome: 'Helena Ferreira',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '30/08/2021',
    condicoesMedicas: ['Rinite alérgica leve em dias secos'],
    alergias: ['Poeira e ácaros'],
    observacoes: 'Muito criativa e participativa na roda de música.',
    contatoEmergencia: {
      nome: 'Patrícia Ferreira',
      parentesco: 'Mãe',
      telefone: '(11) 96622-3344'
    },
    planoCuidado: 'Manter ambiente arejado e hidratação frequente.',
    medicoResponsavel: {
      nome: 'Dr. Lucas Mendes',
      especialidade: 'Alergista Pediátrico',
      telefone: '(11) 97777-6666'
    }
  },
  {
    id: 'aluno_9',
    nome: 'Gabriel Mendes',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '19/11/2021',
    condicoesMedicas: ['Desenvolvimento dentro do esperado'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Gosta de histórias ilustradas e massinha de modelar.',
    contatoEmergencia: {
      nome: 'Rodrigo Mendes',
      parentesco: 'Pai',
      telefone: '(11) 95533-4455'
    },
    planoCuidado: 'Atividades em grupo e jogos motores.',
    medicoResponsavel: {
      nome: 'Dra. Luana Peixoto',
      especialidade: 'Pediatra',
      telefone: '(11) 98888-7777'
    }
  },
  {
    id: 'aluno_10',
    nome: 'Laura Costa',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '03/04/2021',
    condicoesMedicas: ['Ótima autonomia nas refeições'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Expressa-se muito bem e adora dança.',
    contatoEmergencia: {
      nome: 'Larissa Costa',
      parentesco: 'Mãe',
      telefone: '(11) 94455-6677'
    },
    planoCuidado: 'Desenvolvimento socioemocional e brincadeiras coletivas.',
    medicoResponsavel: {
      nome: 'Dra. Patrícia Faro',
      especialidade: 'Pediatra',
      telefone: '(11) 99342-8888'
    }
  }
];
