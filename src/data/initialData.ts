import { StudentProfile, ActivityItem, MedicationItem, MealStatus, TimelineEvent, NoticeItem } from '../types';

export const INITIAL_STUDENT: StudentProfile = {
  id: 'mariana-souza',
  name: 'Mariana Souza',
  photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&h=240&fit=crop&crop=faces&q=80',
  isOnline: true,
  isVerified: true,
  schoolName: 'Colégio Pequeno Anjo',
  schoolSubtitle: 'Onde o amor e o aprendizado se encontram para sua jornada diária.',
  responsible: 'Clarice Souza (Mãe)',
  birthDate: '12/10/2023',
  ageFormatted: '11 meses',
  roomName: 'Maternal I & Berçário B',
  teacherName: 'Ana Silva',
  teacherRole: 'Professora Titular',
  teacherPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces&q=80',
  allergyNotice: 'Alergia: Leite Integral (Lactose) / Frutos do Mar',
  tags: [
    { id: '1', label: 'Passinhos com apoio', icon: 'footprints' },
    { id: '2', label: 'Gargalhadas musicais', icon: 'music' }
  ]
};

export const INITIAL_MEALS: MealStatus[] = [
  { id: 'lanche-manha', name: 'Lanchinho da Manhã', status: 'ACEITOU TUDO', time: '09:00', icon: 'apple', observation: 'Banana amassadinha com aveia. Comeu com muito apetite!' },
  { id: 'almoco', name: 'Papinha / Almoço', status: 'ACEITOU BEM', time: '11:15', icon: 'utensils', observation: 'Purê de abóbora, cenoura cozida e franguinho desfiado.' },
  { id: 'lanche-tarde', name: 'Lanchinho da Tarde', status: 'SEM REGISTRO', icon: 'sun', observation: 'Previsto para 15:30: Frutas da estação e biscoitinho de arroz.' },
  { id: 'jantar', name: 'Jantinha Escolar', status: 'SEM REGISTRO', icon: 'bowl', observation: 'Previsto para 17:00: Caldinho de feijão e legumes.' }
];

export const INITIAL_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med-1',
    name: 'Paracetamol 200mg/mL Gotas',
    dose: '10 gotas se febre > 37.8°C',
    instructions: 'Diluir em 2 colheres de água filtrada. Avisar a mãe no app imediatamente.',
    scheduleDescription: 'Uso SOS / Sintomático',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Responsável Legal',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: 'Hoje às 10:20',
    lastAdministeredBy: 'Ana Silva (Professora Titular)',
    history: [
      {
        id: 'hist-1',
        timestamp: 'Hoje às 10:20',
        administeredBy: 'Ana Silva (Professora Titular)',
        dose: '10 gotas com água',
        pinConfirmed: true,
        notes: 'Aferição de temperatura indicou 37.9°C. Ministrado conforme prescrição médica e autorização dos pais via PIN.'
      }
    ]
  },
  {
    id: 'med-2',
    name: 'Soro Fisiológico Nasal 0.9% (Maresis Baby)',
    dose: '2 jatos em cada narina',
    instructions: 'Higienização nasal suave antes do soninho da tarde.',
    scheduleDescription: 'Diário no Berçário • 12:15',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Responsável Legal',
    pinVerified: true,
    status: 'active',
    lastAdministeredAt: 'Hoje às 12:15',
    lastAdministeredBy: 'Ana Silva (Professora Titular)',
    history: [
      {
        id: 'hist-2',
        timestamp: 'Hoje às 12:15',
        administeredBy: 'Ana Silva (Professora Titular)',
        dose: '2 jatos por narina',
        pinConfirmed: true,
        notes: 'Higienização nasal realizada antes da soneca. Respiração limpa e desobstruída.'
      }
    ]
  },
  {
    id: 'med-3',
    name: 'Pomada Bepantol Baby Protetora',
    dose: 'Camada fina na região das fraldas',
    instructions: 'Prevenção de assaduras nas trocas de fraldas da tarde.',
    scheduleDescription: 'A cada troca de fralda',
    authorizedBy: 'Clarice Souza (Mãe)',
    authorizedRole: 'Responsável Legal',
    pinVerified: true,
    status: 'active'
  }
];

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'tl-1',
    time: '07:30',
    title: 'Acolhimento & Entrada no Berçário',
    description: 'Mariana chegou muito tranquila e sorridente no colo da mãe. Pertences e mochila higienizados e conferidos.',
    category: 'geral',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Presença Confirmada',
    badgeColor: 'emerald',
    icon: 'baby',
    verified: true
  },
  {
    id: 'tl-2',
    time: '08:00',
    title: 'Mamadeira Nutritiva Matinal',
    description: '180 ml de fórmula hipoalergênica oferecida e ingerida integralmente com boa aceitação.',
    category: 'alimentacao',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: '180 ml • Aceitou Tudo',
    badgeColor: 'amber',
    icon: 'bottle',
    verified: true
  },
  {
    id: 'tl-3',
    time: '08:45',
    title: 'Troca de Fralda & Higiene Preventiva',
    description: 'Troca de fralda número 1 (xixi). Pele limpa e aplicação suave de pomada protetora Bepantol Baby.',
    category: 'higiene',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Fralda Troca 1 • Normal',
    badgeColor: 'teal',
    icon: 'sparkles',
    verified: true
  },
  {
    id: 'tl-4',
    time: '09:20',
    title: 'Roda de Cantigas & Expressão Musical (BNCC EI01TS01)',
    description: 'Vivenciou a atividade coletiva com a turma. Mariana bateu palminhas ao som da cantiga "Dona Aranha" e interagiu com os chocalhos.',
    category: 'atividade',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Vivenciada com a Turma',
    badgeColor: 'indigo',
    icon: 'music',
    photoUrl: 'https://images.unsplash.com/photo-1596464716127-f2a829822391?w=400&fit=crop&q=80',
    details: 'Objetivo de aprendizagem alcançado: exploração de sons, ritmos e socialização.',
    verified: true
  },
  {
    id: 'tl-5',
    time: '10:15',
    title: 'Aferição de Temperatura & Checagem Preventiva',
    description: 'Temperatura corporal aferida em 36.6°C (Afebril). Criança alegre, hidratada e com excelente tônus.',
    category: 'saude',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: '36.6°C • Afebril',
    badgeColor: 'emerald',
    icon: 'thermometer',
    verified: true
  },
  {
    id: 'tl-6',
    time: '11:15',
    title: 'Almoço Saudável (Papinha & Frango)',
    description: 'Papinha de legumes coloridos e franguinho desfiado. Ingeriu 90% da porção com excelente apetite.',
    category: 'alimentacao',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Almoço • Aceitou Bem',
    badgeColor: 'amber',
    icon: 'utensils',
    photoUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400&fit=crop&q=80',
    verified: true
  },
  {
    id: 'tl-7',
    time: '12:00',
    title: 'Higienização Nasal & Cuidados Pré-Soneca',
    description: 'Aplicação de 2 jatos de Soro Fisiológico 0.9% em cada narina conforme prescrição autorizada pelos pais com PIN.',
    category: 'medicamento',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Prescrição PIN • Ministrado',
    badgeColor: 'purple',
    icon: 'pill',
    verified: true
  },
  {
    id: 'tl-8',
    time: '12:30',
    title: 'Soninho Reparador da Tarde',
    description: 'Adormeceu tranquilamente no berço individual ao som de ruído branco e luz suave. Dormindo serenamente.',
    category: 'sono',
    registeredBy: 'Ana Silva (Professora Titular)',
    badge: 'Em Andamento • Sereno',
    badgeColor: 'indigo',
    icon: 'moon',
    verified: true
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'not-1',
    title: 'Recado da Mamãe: Noite tranquila e medicação preventiva',
    content: 'Olá tia Ana! A Mariana dormiu bem à noite, mas acordou com um leve espirrinho. Mandei na mochila o Soro e o Paracetamol com a receita anexada no app. Qualquer febrezinha pode avisar!',
    author: 'Clarice Souza (Mãe)',
    role: 'familia',
    authorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&q=80',
    date: '24/09/2026',
    time: '07:25',
    priority: 'importante',
    isRead: true,
    tags: ['Saúde', 'Medicamento', 'Família']
  },
  {
    id: 'not-2',
    title: 'Aviso da Escola: Piquenique Pedagógico de Frutas Amanhã',
    content: 'Queridas famílias do Maternal I: Amanhã faremos uma oficina sensorial de frutas no jardim. As crianças poderão explorar texturas e sabores de melancia, banana e maçã. Favor enviar roupinha confortável.',
    author: 'Coordenação Pedagógica',
    role: 'escola',
    date: '24/09/2026',
    time: '09:00',
    priority: 'normal',
    isRead: true,
    tags: ['Pedagógico', 'Avisos', 'Amanhã']
  },
  {
    id: 'not-3',
    title: 'Alerta de Reposição de Itens da Mochila',
    content: 'Lembramos que o pacote de fraldas da Mariana tem 3 unidades restantes na gaveta individual. Solicitamos o envio de um novo pacote na segunda-feira.',
    author: 'Ana Silva (Professora Titular)',
    role: 'escola',
    authorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces&q=80',
    date: '24/09/2026',
    time: '11:00',
    priority: 'normal',
    isRead: false,
    tags: ['Mochila', 'Higiene', 'Fraldas']
  }
];
