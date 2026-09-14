/**
 * MOTOR 1: MÉTODO ÁRVORE DA INFÂNCIA® PARA O ÁLBUM
 * Anjinho Escolar & Anjinha Aura
 * 
 * Regras Estritas de Blindagem:
 * 1. ÁRVORE = INTELIGÊNCIA INTERNA E CONTEXTO QUALITATIVO
 * 2. NUNCA expor pontuações, notas, rankings ou multiplicadores para a família ou no texto do álbum.
 * 3. Identifica a estação da vida e a trajetória individual da criança baseada em evidências reais.
 */

import { StudentPaxData } from '../../types';

export interface ContextoArvoreAlbum {
  estacaoNome: string;
  estacaoSimbolo: string;
  subtitulo: string;
  frasePoetica: string;
  dimensoesFortalecidas: {
    dimensao: 'Plantar' | 'Cultivar' | 'Florescer' | 'Frutificar' | 'Preservar';
    descricaoAfetiva: string;
    marcosReais: string[];
  }[];
  evolucaoVisual: {
    etapa: 'Início do Ano' | 'Meio do Ano' | 'Final do Ano';
    simboloVisual: string;
    marcosConquistados: string;
  }[];
}

export function interpretarArvoreParaAlbum(student: StudentPaxData): ContextoArvoreAlbum {
  const idade = student.idadeStr || '2 anos';
  const isBebeOuMaternal = idade.includes('mês') || idade.includes('mes') || idade.includes('1 ano') || idade.includes('2 ano');

  // Identifica marcos reais baseados nos dados existentes da criança
  const marcosCultivar: string[] = [];
  const marcosFlorescer: string[] = [];
  const marcosFrutificar: string[] = [];

  // Cuidados e Sono
  if (student.saudeCards?.soneca?.valor && !student.saudeCards.soneca.valor.includes('Sem')) {
    marcosCultivar.push('Ritmo tranquilo de sono e descanso revigorante na escola');
  }
  if (student.agua?.consumoMl && student.agua.consumoMl > 0) {
    marcosCultivar.push(`Apreciação de hidratação diária (${student.agua.consumoMl}ml servidos)`);
  }

  // Autonomia e Higiene
  if (student.higieneChecklist) {
    if (student.higieneChecklist.maosERosto === 'Realizado') {
      marcosFlorescer.push('Iniciativa no cuidado pessoal (lavar mãos e rosto)');
    }
    if (student.higieneChecklist.escovacaoDentes === 'Realizado') {
      marcosFlorescer.push('Participação alegre no momento da escovação');
    }
  }

  // Humor e Convivência
  if (student.humor?.observacao) {
    marcosFrutificar.push(student.humor.observacao);
  } else {
    marcosFrutificar.push(`Expressão serena e afetuosa com educadoras e colegas (${student.humor?.estado || 'Calmo / Sereno'})`);
  }

  // Se não há marcos detectados, fornecemos o padrão acolhedor da primeira infância
  if (marcosCultivar.length === 0) marcosCultivar.push('Acolhimento diário e construção de vínculo seguro');
  if (marcosFlorescer.length === 0) marcosFlorescer.push('Descoberta do mundo ao redor com curiosidade');
  if (marcosFrutificar.length === 0) marcosFrutificar.push('Trocas afetivas com o grupo e educadores');

  return {
    estacaoNome: isBebeOuMaternal ? 'Cultivar & Florescer' : 'Florescer & Frutificar',
    estacaoSimbolo: isBebeOuMaternal ? '🌱' : '🌳',
    subtitulo: 'Cada dia na escola é uma raiz que se aprofunda e um galho que busca a luz.',
    frasePoetica: `Assim como uma jovem árvore protegida na floresta, ${student.nome} encontrou na escola solo fértil de carinho, respeito e estímulos para desabrochar no seu próprio tempo.`,
    dimensoesFortalecidas: [
      {
        dimensao: 'Plantar',
        descricaoAfetiva: 'O acolhimento inicial, o olhar seguro e a criação de laços afetivos com a escola.',
        marcosReais: ['Adaptação harmoniosa e confiança nas educadoras'],
      },
      {
        dimensao: 'Cultivar',
        descricaoAfetiva: 'O carinho constante na rotina de alimentação, descanso e hidratação diária.',
        marcosReais: marcosCultivar,
      },
      {
        dimensao: 'Florescer',
        descricaoAfetiva: 'As pequenas grandes conquistas de autonomia, primeiros passos e palavras.',
        marcosReais: marcosFlorescer,
      },
      {
        dimensao: 'Frutificar',
        descricaoAfetiva: 'O convívio social, as partilhas e os sorrisos compartilhados com a turma.',
        marcosReais: marcosFrutificar,
      },
      {
        dimensao: 'Preservar',
        descricaoAfetiva: 'A história afetiva guardada com amor para ser lembrada por toda a vida.',
        marcosReais: ['Memórias reais protegidas no Álbum da 1ª Infância®'],
      },
    ],
    evolucaoVisual: [
      {
        etapa: 'Início do Ano',
        simboloVisual: '🌱',
        marcosConquistados: 'Primeiras raízes de confiança, acolhimento amoroso e adaptação ao espaço escolar.',
      },
      {
        etapa: 'Meio do Ano',
        simboloVisual: '🌿',
        marcosConquistados: 'Consolidação das rotinas com autonomia crescente, segurança e alegria nas brincadeiras.',
      },
      {
        etapa: 'Final do Ano',
        simboloVisual: '🌸',
        marcosConquistados: 'Florescimento da comunicação, vínculos profundos com os amigos e grandes descobertas.',
      },
    ],
  };
}
