/**
 * MÉTODO ÁRVORE DA INFÂNCIA®
 * Especificação da Camada Oculta de Inteligência e Equidade
 * 
 * Regras do Sistema:
 * 1. NENHUMA pontuação fria, nota ou ranking é exposta na Camada Visível.
 * 2. Regra Berçário & Maternal: Maior peso relativo a Cuidados Essenciais (Sono, Alimentação, Hidratação, Higiene).
 * 3. Regra Pré-Escola & Jardim: Maior peso relativo a Desenvolvimento Socioemocional (Gentileza, Cooperação, Autonomia).
 * 4. Preservação da História: A árvore NUNCA reseta de um ano para o outro.
 * 5. Regra de Individualidade: Compara a criança apenas com a sua própria trajetória histórica.
 * 6. Análise de Recorrência: Identifica consolidação de marcos através da repetição de evidências ao longo do tempo.
 */

export type FaixaEtariaMetodo = 'bercario_maternal' | 'pre_escola_jardim';

export type SubcategoriaEvidencia =
  | 'sono'
  | 'alimentacao'
  | 'higiene'
  | 'hidratacao'
  | 'gentileza'
  | 'cooperacao'
  | 'autonomia'
  | 'linguagem'
  | 'movimento';

export interface EvidenciaDesenvolvimento {
  id: string;
  data: string;
  faixaEtaria: FaixaEtariaMetodo;
  subcategoria: SubcategoriaEvidencia;
  descricao: string;
  contexto?: string;
}

export interface EstacaoDaVida {
  id: number;
  nome: string;
  subtitulo: string;
  descricaoVisivel: string;
  fraseArvorePoetica: string;
}

export interface TabelaMultiplicadoresMetodo {
  bercario_maternal: Record<SubcategoriaEvidencia, number>;
  pre_escola_jardim: Record<SubcategoriaEvidencia, number>;
}

// Multiplicadores Referenciais da Camada Oculta (Definição Padrão de Equidade)
export const MULTIPLICADORES_CAMADA_OCULTA: TabelaMultiplicadoresMetodo = {
  bercario_maternal: {
    sono: 5.0,          // Prioridade Máxima (Cuidado Essencial Vital)
    alimentacao: 5.0,   // Prioridade Máxima (Cuidado Essencial Vital)
    higiene: 5.0,       // Prioridade Máxima (Cuidado Essencial Vital)
    hidratacao: 4.5,    // Alta Prioridade
    movimento: 3.5,     // Desenvolvimento Motor
    linguagem: 3.0,     // Comunicação Inicial
    autonomia: 2.5,     // Primeiros passos de independência
    gentileza: 2.0,     // Primeiros gestos
    cooperacao: 2.0,    // Socialização inicial
  },
  pre_escola_jardim: {
    gentileza: 5.0,     // Vetor Central Socioemocional
    cooperacao: 5.0,    // Vetor Central Socioemocional
    autonomia: 5.0,     // Vetor Central Socioemocional
    linguagem: 4.0,     // Expressão e Argumentação
    movimento: 3.5,     // Coordenação Ampla e Fina
    sono: 2.5,          // Cuidado Integrado
    alimentacao: 2.5,   // Cuidado Integrado
    higiene: 2.5,       // Autonomia no Cuidado
    hidratacao: 2.0,    // Hábito Consolidado
  },
};

// Definição das Estações da Vida (Camada Visível Afetiva)
export const ESTACOES_DA_VIDA: EstacaoDaVida[] = [
  {
    id: 1,
    nome: 'Primavera (A Semente)',
    subtitulo: 'ACOLHIMENTO E PRIMEIRAS CONEXÕES VITAIS',
    descricaoVisivel: 'Toda grande árvore começa como uma semente. Nesta fase, cada cuidado e afeto cria raízes que fortalecem o futuro.',
    fraseArvorePoetica: 'Sinto o calor do acolhimento e a ternura das primeiras descobertas. Minhas raízes estão nascendo com muito amor!',
  },
  {
    id: 2,
    nome: 'Verão (Primeiros Brotos)',
    subtitulo: 'CURIOSIDADE ATIVA E EXPLORAÇÃO SENSORIAL',
    descricaoVisivel: 'Os primeiros brotos desabrocham com energia, explorando novas texturas, sons e os primeiros laços com os colegas.',
    fraseArvorePoetica: 'Olha só como meus galhos estão crescendo fortes! Cada risada e cada abraço me fazem sorrir para o sol!',
  },
  {
    id: 3,
    nome: 'Outono (Raízes Fortes)',
    subtitulo: 'CONSOLIDAÇÃO DA ROTINA E AUTONOMIA',
    descricaoVisivel: 'A árvore ganha firmeza no solo. A criança consolida hábitos saudáveis, equilíbrio emocional e autonomia.',
    fraseArvorePoetica: 'Sinto minhas raízes fundas e seguras no solo nutrido da escola. Aprendi a cuidar de mim e dos meus amigos!',
  },
  {
    id: 4,
    nome: 'Inverno Acolhedor (Tempo de Florescer)',
    subtitulo: 'EMPATIA, GENTILEZA E INTELIGÊNCIA EMOCIONAL',
    descricaoVisivel: 'Flores coloridas enfeitam a copa da árvore, simbolizando atitudes espontâneas de cooperação, escuta e carinho.',
    fraseArvorePoetica: 'Desabrochei lindas flores de gentileza! Guardarei com carinho cada gesto compartilhado na nossa roda.',
  },
  {
    id: 5,
    nome: 'Árvore de Frutos (Preservação Permanente)',
    subtitulo: 'LEGADO DA PRIMEIRA INFÂNCIA PRESERVADO PARA SEMPRE',
    descricaoVisivel: 'A árvore chega à maturidade plena com frutos doces e memórias eternas que nunca se apagam e continuam crescendo.',
    fraseArvorePoetica: 'Sou uma árvore cheia de frutos e histórias inesquecíveis! Esta linda caminhada estará preservada para sempre.',
  },
];

/**
 * Calcula a maturidade histórica da criança na Camada Oculta.
 * Retorna dados formatados estritamente para a Camada Visível.
 */
export function calcularMaturidadeArvore(
  evidencias: EvidenciaDesenvolvimento[],
  faixaEtaria: FaixaEtariaMetodo,
  multiplicadoresCustomizados?: Partial<TabelaMultiplicadoresMetodo>
) {
  const tabela = multiplicadoresCustomizados
    ? { ...MULTIPLICADORES_CAMADA_OCULTA, ...multiplicadoresCustomizados }
    : MULTIPLICADORES_CAMADA_OCULTA;

  let pesoAcumuladoOculto = 0;
  const contadoresPorSubcategoria: Record<SubcategoriaEvidencia, number> = {
    sono: 0,
    alimentacao: 0,
    higiene: 0,
    hidratacao: 0,
    gentileza: 0,
    cooperacao: 0,
    autonomia: 0,
    linguagem: 0,
    movimento: 0,
  };

  evidencias.forEach((ev) => {
    const mult = tabela[ev.faixaEtaria][ev.subcategoria] || 3.0;
    pesoAcumuladoOculto += mult;
    contadoresPorSubcategoria[ev.subcategoria] += 1;
  });

  // Determinar a Estação da Vida correspondente sem expor nota
  let estacaoAtual = ESTACOES_DA_VIDA[0];
  if (pesoAcumuladoOculto >= 110) estacaoAtual = ESTACOES_DA_VIDA[4];
  else if (pesoAcumuladoOculto >= 75) estacaoAtual = ESTACOES_DA_VIDA[3];
  else if (pesoAcumuladoOculto >= 40) estacaoAtual = ESTACOES_DA_VIDA[2];
  else if (pesoAcumuladoOculto >= 15) estacaoAtual = ESTACOES_DA_VIDA[1];

  // Análise de Recorrência (Identificação de tendências socioemocionais ou de cuidado)
  const evidenciasRecorrentes: string[] = [];
  if (contadoresPorSubcategoria.autonomia >= 3) {
    evidenciasRecorrentes.push('Consolidação de Autonomia na Rotina');
  }
  if (contadoresPorSubcategoria.gentileza + contadoresPorSubcategoria.cooperacao >= 3) {
    evidenciasRecorrentes.push('Tendência Consolidada de Empatia e Cooperação');
  }
  if (contadoresPorSubcategoria.sono + contadoresPorSubcategoria.alimentacao >= 4) {
    evidenciasRecorrentes.push('Adaptação Plena ao Cuidado Essencial');
  }

  return {
    estacao: estacaoAtual,
    totalEvidenciasAcumuladas: evidencias.length,
    evidenciasRecorrentes,
    contadoresPorSubcategoria,
    // Apenas indicadores narrativos/qualitativos
    soloStatus: 'SOLO NUTRIDO',
    vitalidadeStatus: 'ÁRVORE EM PLENO CULTIVO',
  };
}
