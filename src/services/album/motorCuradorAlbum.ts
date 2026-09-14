/**
 * MOTOR 2: CURADOR EDITORIAL DO ÁLBUM
 * Anjinho Escolar & Anjinha Aura
 * 
 * Regras do Curador:
 * 1. SELEÇÃO EDITORIAL: Seleciona memórias com maior potencial afetivo e histórico.
 * 2. DIVERSIDADE: Evita repetir a mesma atividade (ex: 15 fotos de pintura).
 * 3. DEDUPLICAÇÃO: Impede registros idênticos ou fotos duplicadas.
 * 4. BLINDAGEM DE CONTEÚDO SENSÍVEL: Exclui ocorrências clínicas, acidentes e febres do álbum festivo.
 * 5. LIMITE CONFIGURÁVEL: 20 a 40 memórias principais por ano letivo.
 */

import { StudentPaxData } from '../../types';
import { AlbumEntry, AlbumMedia } from '../../types/albumInfancia';

export interface CandidatoMemoria {
  id: string;
  sourceType: AlbumEntry['sourceType'];
  sourceId: string;
  date: string;
  periodo?: string;
  tituloBruto: string;
  textoOriginal: string;
  categoria: 'arte' | 'musica' | 'movimento' | 'natureza' | 'linguagem' | 'autonomia' | 'convivencia' | 'cuidado';
  midias?: AlbumMedia[];
  temFoto: boolean;
  ehSensivelOuClinico: boolean;
  autorizacaoUso: boolean;
}

// Lista de palavras que caracterizam ocorrências estritamente médicas ou acidentais
const PALAVRAS_SENSIVEIS = [
  'febre', 'alerta febril', 'queda', 'bateu', 'mordida', 'medicamento', 
  'vomitou', 'diarreia', 'machucou', 'curativo', 'atestado', 'emergencia'
];

export class MotorCuradorAlbum {
  /**
   * Extrai e filtra candidatos a memórias a partir dos registros do aluno
   */
  public extrairCandidatos(student: StudentPaxData): CandidatoMemoria[] {
    const candidatos: CandidatoMemoria[] = [];

    // 1. Linha do Tempo e Auditoria Diária
    if (student.auditoriaLinhaDoTempo) {
      student.auditoriaLinhaDoTempo.forEach((item) => {
        const textoCompleto = `${item.titulo} ${item.descricao}`.toLowerCase();
        const ehSensivel = PALAVRAS_SENSIVEIS.some((p) => textoCompleto.includes(p));

        let cat: CandidatoMemoria['categoria'] = 'cuidado';
        if (textoCompleto.includes('pint') || textoCompleto.includes('desenho') || textoCompleto.includes('arte')) {
          cat = 'arte';
        } else if (textoCompleto.includes('músic') || textoCompleto.includes('canto') || textoCompleto.includes('roda')) {
          cat = 'musica';
        } else if (textoCompleto.includes('parque') || textoCompleto.includes('correr') || textoCompleto.includes('movimento')) {
          cat = 'movimento';
        } else if (textoCompleto.includes('amigo') || textoCompleto.includes('partilha') || textoCompleto.includes('brincou')) {
          cat = 'convivencia';
        } else if (textoCompleto.includes('falou') || textoCompleto.includes('disse') || textoCompleto.includes('palavra')) {
          cat = 'linguagem';
        } else if (textoCompleto.includes('sozinho') || textoCompleto.includes('autonomia') || textoCompleto.includes('comeu tudo')) {
          cat = 'autonomia';
        }

        candidatos.push({
          id: item.id,
          sourceType: 'registro_diario',
          sourceId: item.id,
          date: new Date().toISOString().split('T')[0],
          periodo: item.hora,
          tituloBruto: item.titulo,
          textoOriginal: item.descricao,
          categoria: cat,
          temFoto: false,
          ehSensivelOuClinico: ehSensivel,
          autorizacaoUso: true,
        });
      });
    }

    // 2. Observações Afetivas de Humor
    if (student.humor?.observacao) {
      candidatos.push({
        id: `humor_${student.id}`,
        sourceType: 'observacao',
        sourceId: `humor_${student.id}`,
        date: new Date().toISOString().split('T')[0],
        periodo: 'Hoje',
        tituloBruto: `Momento com a Professora: ${student.humor.estado}`,
        textoOriginal: student.humor.observacao,
        categoria: 'convivencia',
        temFoto: false,
        ehSensivelOuClinico: false,
        autorizacaoUso: true,
      });
    }

    // 3. Produções e Atividades com Foto (se houver avatar da criança ou registros visuais)
    if (student.fotoUrl) {
      candidatos.push({
        id: `foto_perfil_${student.id}`,
        sourceType: 'foto',
        sourceId: `foto_perfil_${student.id}`,
        date: new Date().toISOString().split('T')[0],
        periodo: 'Início do Ano Letivo',
        tituloBruto: 'O Sorriso que Ilumina a Nossa Sala',
        textoOriginal: `Retrato escolar de ${student.nome} guardado como marco deste capítulo especial na primeira infância.`,
        categoria: 'convivencia',
        temFoto: true,
        midias: [
          {
            id: `media_${student.id}`,
            type: 'image',
            sourceId: student.id,
            url: student.fotoUrl,
            caption: `Retrato de ${student.nome}`,
            approved: true,
            authorizationStatus: 'authorized',
          },
        ],
        ehSensivelOuClinico: false,
        autorizacaoUso: true,
      });
    }

    return candidatos;
  }

  /**
   * Algoritmo de Ranqueamento Editorial e Equilíbrio de Diversidade
   * Seção 10: score_memoria = relevancia + significancia + afetividade + desenvolvimento + representatividade + qualidade_visual + diversidade
   * Regras Aprovadas:
   * - 2 a 4 momentos significativos por mês (média 3/mês)
   * - Total anual entre 25 e 35 memórias
   */
  public selecionarMemóriasEditoriais(
    candidatos: CandidatoMemoria[],
    limiteMaximo: number = 30
  ): CandidatoMemoria[] {
    // 1. Filtra registros sensíveis ou sem autorização
    const validos = candidatos.filter(
      (c) => !c.ehSensivelOuClinico && c.autorizacaoUso
    );

    // 2. Controle de Duplicidade (Deduplicação)
    const vistos = new Set<string>();
    const unicos: CandidatoMemoria[] = [];

    for (const item of validos) {
      const chaveDeduplicacao = `${item.date}_${item.categoria}_${item.tituloBruto.slice(0, 15).toLowerCase()}`;
      if (!vistos.has(chaveDeduplicacao)) {
        vistos.add(chaveDeduplicacao);
        unicos.push(item);
      }
    }

    // 3. Calcula Pontuação Editorial Interna
    const rankeados = unicos.map((item) => {
      let score = 5.0; // pontuação base

      // Afetividade & Convivência
      if (item.categoria === 'convivencia') score += 3.5;
      if (item.categoria === 'autonomia') score += 3.0;
      if (item.categoria === 'linguagem') score += 2.5;
      if (item.categoria === 'arte' || item.categoria === 'musica') score += 2.0;

      // Fotos enriquecem o álbum de memórias
      if (item.temFoto) score += 4.0;

      // Textos mais descritivos têm maior valor narrativo
      if (item.textoOriginal.length > 30) score += 1.5;

      return {
        ...item,
        editorialScore: score,
      };
    });

    // 4. Ordena por pontuação decrescente
    rankeados.sort((a, b) => (b.editorialScore || 0) - (a.editorialScore || 0));

    // 5. Agrupa por mês e garante entre 2 e 4 momentos por mês
    const mesesContador: Record<string, number> = {};
    const categoriasContador: Record<string, number> = {};
    const selecionados: CandidatoMemoria[] = [];

    for (const item of rankeados) {
      if (selecionados.length >= limiteMaximo) break;

      const mesChave = item.date ? item.date.slice(0, 7) : 'geral';
      const contagemMes = mesesContador[mesChave] || 0;
      const contagemCategoria = categoriasContador[item.categoria] || 0;

      // Limita a no máximo 4 momentos por mês e no máximo 6 da mesma categoria no ano
      if (contagemMes < 4 && contagemCategoria < 6) {
        mesesContador[mesChave] = contagemMes + 1;
        categoriasContador[item.categoria] = contagemCategoria + 1;
        selecionados.push(item);
      }
    }

    // Se ainda sobrar espaço e houver itens não incluídos, preenche até atingir a meta saudável (mínimo 20, máximo 35)
    for (const item of rankeados) {
      if (selecionados.length >= limiteMaximo) break;
      if (!selecionados.some((s) => s.id === item.id)) {
        selecionados.push(item);
      }
    }

    return selecionados;
  }
}
