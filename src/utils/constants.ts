import { ChildProfile, TreeStatus, MethodLivroItem } from '../types';

export const DEFAULT_CHILD: ChildProfile = {
  id: 'mariana_souza_01',
  nome: 'Mariana Souza',
  dataNascimento: '12/10/2023',
  idadeMeses: 22,
  turma: 'Berçário I - A',
  sala: 'Maternal I Histórico Emocional e Pedagógico Permanente',
  fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
  statusBncc: 'Acompanhamento BNCC Ativo',
};

export const INITIAL_TREE_STATUS: TreeStatus = {
  estacao: 'Primavera (Berçário)',
  estacaoSubtitulo: 'PRIMAVERA DO BERÇÁRIO ESTAÇÃO DA VIDA ATIVA',
  vitalidadeTexto: 'VITALIDADE DE CULTIVO',
  vitalidadeStatus: 'ÁRVORE EM PLENO FLORESCIMENTO',
  soloStatus: 'SOLO NUTRIDO',
  porcentagemCultivo: 100,
  falaArvore: 'Olha só! Sinto meus galhos ainda mais fortes e felizes por conta daquele momento especial de Mariana: "Sentou sem apoio pela primeira vez!". Guardarei essa linda lembrança para sempre!',
  folhasCultivadas: 3,
  valoresDesabrochados: 5,
  frutosColhidos: 2,
  gestosDeAfeto: 25,
};

export const METODO_LIVRO: MethodLivroItem[] = [
  {
    letra: 'L',
    palavra: 'Lembrar',
    descricao: 'Registrar cada marco ou pequena descoberta e transformá-la em recordação viva.',
  },
  {
    letra: 'I',
    palavra: 'Inspirar',
    descricao: 'Despertar a curiosidade inata da infância através do afeto e do respeito aos ritmos.',
  },
  {
    letra: 'V',
    palavra: 'Valorizar',
    descricao: 'Celebrar a singularidade de cada conquista, acolhendo as emoções e os laços.',
  },
  {
    letra: 'R',
    palavra: 'Registrar',
    descricao: 'Construir a memória pedagógica permanente com respeito à trajetória da criança.',
  },
  {
    letra: 'O',
    palavra: 'Organizar',
    descricao: 'Integrar a rotina escolar à história da família em uma narrativa acolhedora.',
  },
];

export const THREE_PILLARS = [
  {
    id: 'memorias',
    titulo: 'Memórias',
    descricao: 'Cada dia na escola é uma história inesquecível que merece ser eternizada com delicadeza.',
    cor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    id: 'relacionamento',
    titulo: 'Relacionamento',
    descricao: 'Fortalecemos a parceria ativa e a confiança mútua entre a equipe da escola e a família.',
    cor: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  {
    id: 'desenvolvimento',
    titulo: 'Desenvolvimento',
    descricao: 'Acompanhamos cada pequena conquista como parte de um lindo legado que desabrocha.',
    cor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
];

export const CATEGORY_LABELS: Record<string, { label: string; badgeColor: string }> = {
  todos: { label: 'Todos os Momentos', badgeColor: 'bg-indigo-600 text-white' },
  conquistas: { label: 'Conquistas', badgeColor: 'bg-amber-500 text-white' },
  atividades: { label: 'Atividades', badgeColor: 'bg-purple-600 text-white' },
  fotos: { label: 'Fotos', badgeColor: 'bg-pink-600 text-white' },
  evolucao: { label: 'Evolução', badgeColor: 'bg-teal-600 text-white' },
  relatorios: { label: 'Relatórios', badgeColor: 'bg-blue-600 text-white' },
  datas: { label: 'Datas', badgeColor: 'bg-slate-600 text-white' },
};

export const GESTOS_DEFAULT = [
  'Que encanto!',
  'Feito com amor',
  'Puro brilho!',
  'Orgulho da gente',
  'Um tesouro!',
];
